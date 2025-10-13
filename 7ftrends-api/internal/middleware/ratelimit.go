package middleware

import (
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
	"golang.org/x/time/rate"
)

// RateLimiterConfig holds configuration for rate limiting
type RateLimiterConfig struct {
	// General rate limiting
	RequestsPerSecond float64
	BurstSize         int

	// Rate limiting per user/IP
	UserRequestsPerSecond float64
	UserBurstSize         int

	// Rate limiting per endpoint
	EndpointLimits map[string]EndpointLimit

	// Whitelist and blacklist
	WhitelistedIPs []string
	BlacklistedIPs []string

	// Rate limiting for specific roles
	RoleLimits map[string]RoleLimit
}

// EndpointLimit defines rate limits for specific endpoints
type EndpointLimit struct {
	RequestsPerSecond float64
	BurstSize         int
}

// RoleLimit defines rate limits for specific user roles
type RoleLimit struct {
	RequestsPerSecond float64
	BurstSize         int
}

// RateLimiter provides rate limiting functionality
type RateLimiter struct {
	config   RateLimiterConfig
	limiters map[string]*rate.Limiter
	mu       sync.RWMutex
	logger   *logrus.Logger
}

// NewRateLimiter creates a new rate limiter with the given configuration
func NewRateLimiter(config RateLimiterConfig, logger *logrus.Logger) *RateLimiter {
	// Set default values if not provided
	if config.RequestsPerSecond == 0 {
		config.RequestsPerSecond = 10.0 // 10 requests per second
	}
	if config.BurstSize == 0 {
		config.BurstSize = 20
	}
	if config.UserRequestsPerSecond == 0 {
		config.UserRequestsPerSecond = 5.0 // 5 requests per second per user
	}
	if config.UserBurstSize == 0 {
		config.UserBurstSize = 10
	}

	return &RateLimiter{
		config:   config,
		limiters: make(map[string]*rate.Limiter),
		logger:   logger,
	}
}

// Middleware returns the Gin middleware for rate limiting
func (rl *RateLimiter) Middleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Check if IP is blacklisted
		if rl.isIPBlacklisted(c.ClientIP()) {
			rl.logger.WithField("ip", c.ClientIP()).Warn("Blacklisted IP attempted to access the API")
			c.JSON(http.StatusForbidden, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "IP_BLOCKED",
					"message": "Your IP address has been blocked",
				},
			})
			c.Abort()
			return
		}

		// Check if IP is whitelisted
		if rl.isIPWhitelisted(c.ClientIP()) {
			c.Next()
			return
		}

		// Get the appropriate limiter for this request
		limiter := rl.getLimiter(c)

		// Check if the request is allowed
		if !limiter.Allow() {
			rl.logger.WithFields(logrus.Fields{
				"ip":     c.ClientIP(),
				"path":   c.Request.URL.Path,
				"method": c.Request.Method,
				"user_id": rl.getUserID(c),
			}).Warn("Rate limit exceeded")

			c.JSON(http.StatusTooManyRequests, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "RATE_LIMIT_EXCEEDED",
					"message": "Too many requests, please try again later",
				},
			})
			c.Abort()
			return
		}

		// Add rate limit headers
		rl.addRateLimitHeaders(c, limiter)

		c.Next()
	}
}

// getLimiter returns the appropriate rate limiter for the request
func (rl *RateLimiter) getLimiter(c *gin.Context) *rate.Limiter {
	// Check for endpoint-specific limits
	if endpointLimit, exists := rl.config.EndpointLimits[c.FullPath()]; exists {
		key := fmt.Sprintf("endpoint:%s", c.FullPath())
		return rl.getOrCreateLimiter(key, endpointLimit.RequestsPerSecond, endpointLimit.BurstSize)
	}

	// Check for user-specific limits
	userID := rl.getUserID(c)
	if userID != "" {
		// Check for role-based limits
		if role, exists := c.Get("role"); exists {
			if roleLimit, exists := rl.config.RoleLimits[role.(string)]; exists {
				key := fmt.Sprintf("role:%s:%s", role, userID)
				return rl.getOrCreateLimiter(key, roleLimit.RequestsPerSecond, roleLimit.BurstSize)
			}
		}

		// Default user-specific limits
		key := fmt.Sprintf("user:%s", userID)
		return rl.getOrCreateLimiter(key, rl.config.UserRequestsPerSecond, rl.config.UserBurstSize)
	}

	// Default IP-based limits
	key := fmt.Sprintf("ip:%s", c.ClientIP())
	return rl.getOrCreateLimiter(key, rl.config.RequestsPerSecond, rl.config.BurstSize)
}

// getOrCreateLimiter gets an existing limiter or creates a new one
func (rl *RateLimiter) getOrCreateLimiter(key string, rps float64, burst int) *rate.Limiter {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	if limiter, exists := rl.limiters[key]; exists {
		return limiter
	}

	limiter := rate.NewLimiter(rate.Limit(rps), burst)
	rl.limiters[key] = limiter

	// Start a cleanup goroutine for this limiter
	go rl.cleanupLimiter(key)

	return limiter
}

// getUserID extracts user ID from the context
func (rl *RateLimiter) getUserID(c *gin.Context) string {
	if userID, exists := c.Get("user_id"); exists {
		return fmt.Sprintf("%v", userID)
	}
	return ""
}

// isIPWhitelisted checks if an IP is in the whitelist
func (rl *RateLimiter) isIPWhitelisted(ip string) bool {
	for _, whitelistedIP := range rl.config.WhitelistedIPs {
		if whitelistedIP == ip {
			return true
		}
	}
	return false
}

// isIPBlacklisted checks if an IP is in the blacklist
func (rl *RateLimiter) isIPBlacklisted(ip string) bool {
	for _, blacklistedIP := range rl.config.BlacklistedIPs {
		if blacklistedIP == ip {
			return true
		}
	}
	return false
}

// addRateLimitHeaders adds rate limit headers to the response
func (rl *RateLimiter) addRateLimitHeaders(c *gin.Context, limiter *rate.Limiter) {
	// Get limiter info
	tokens := limiter.Tokens()
	limit := limiter.Limit()

	// Calculate requests remaining
	remaining := int(tokens)
	if remaining < 0 {
		remaining = 0
	}

	// Add headers
	c.Header("X-RateLimit-Limit", fmt.Sprintf("%.0f", limit))
	c.Header("X-RateLimit-Remaining", fmt.Sprintf("%d", remaining))
	c.Header("X-RateLimit-Reset", fmt.Sprintf("%d", time.Now().Add(time.Second).Unix()))
}

// cleanupLimiter removes a limiter after a period of inactivity
func (rl *RateLimiter) cleanupLimiter(key string) {
	time.Sleep(5 * time.Minute) // Wait 5 minutes

	rl.mu.Lock()
	defer rl.mu.Unlock()

	delete(rl.limiters, key)
}

// CleanupExpiredLimiters removes all expired limiters
func (rl *RateLimiter) CleanupExpiredLimiters() {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	// This is a simple cleanup - in production, you might want more sophisticated logic
	if len(rl.limiters) > 10000 { // If we have too many limiters
		// Clear half of them (this is arbitrary - adjust based on your needs)
		count := 0
		for key := range rl.limiters {
			delete(rl.limiters, key)
			count++
			if count >= 5000 {
				break
			}
		}
	}
}

// DefaultRateLimiterConfig returns a default configuration for rate limiting
func DefaultRateLimiterConfig() RateLimiterConfig {
	return RateLimiterConfig{
		RequestsPerSecond:    10.0,
		BurstSize:            20,
		UserRequestsPerSecond: 5.0,
		UserBurstSize:         10,
		EndpointLimits: map[string]EndpointLimit{
			"/api/v1/auth/login":    {RequestsPerSecond: 2.0, BurstSize: 5},  // Login attempts
			"/api/v1/auth/register": {RequestsPerSecond: 1.0, BurstSize: 3},  // Registration attempts
			"/api/v1/upload":       {RequestsPerSecond: 2.0, BurstSize: 5},  // File uploads
			"/api/v1/tryon":        {RequestsPerSecond: 1.0, BurstSize: 3},  // AI try-on (expensive)
		},
		RoleLimits: map[string]RoleLimit{
			"admin":    {RequestsPerSecond: 50.0, BurstSize: 100},
			"moderator": {RequestsPerSecond: 20.0, BurstSize: 40},
			"premium":  {RequestsPerSecond: 15.0, BurstSize: 30},
		},
		WhitelistedIPs: []string{},
		BlacklistedIPs: []string{},
	}
}

// DevelopmentRateLimiterConfig returns a permissive configuration for development
func DevelopmentRateLimiterConfig() RateLimiterConfig {
	return RateLimiterConfig{
		RequestsPerSecond:    100.0, // Much higher for development
		BurstSize:            200,
		UserRequestsPerSecond: 50.0,
		UserBurstSize:         100,
		EndpointLimits:        map[string]EndpointLimit{},
		RoleLimits:           map[string]RoleLimit{},
		WhitelistedIPs:       []string{"127.0.0.1", "::1", "localhost"},
		BlacklistedIPs:       []string{},
	}
}

// ProductionRateLimiterConfig returns a restrictive configuration for production
func ProductionRateLimiterConfig() RateLimiterConfig {
	return RateLimiterConfig{
		RequestsPerSecond:    5.0,  // More restrictive for production
		BurstSize:            10,
		UserRequestsPerSecond: 2.0,
		UserBurstSize:         5,
		EndpointLimits: map[string]EndpointLimit{
			"/api/v1/auth/login":    {RequestsPerSecond: 1.0, BurstSize: 3},
			"/api/v1/auth/register": {RequestsPerSecond: 0.5, BurstSize: 2},
			"/api/v1/upload":       {RequestsPerSecond: 1.0, BurstSize: 3},
			"/api/v1/tryon":        {RequestsPerSecond: 0.5, BurstSize: 2},
		},
		RoleLimits: map[string]RoleLimit{
			"admin":     {RequestsPerSecond: 25.0, BurstSize: 50},
			"moderator": {RequestsPerSecond: 10.0, BurstSize: 20},
			"premium":   {RequestsPerSecond: 7.5, BurstSize: 15},
		},
		WhitelistedIPs: []string{},
		BlacklistedIPs: []string{},
	}
}