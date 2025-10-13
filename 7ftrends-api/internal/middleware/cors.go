package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// CORSMiddleware provides Cross-Origin Resource Sharing middleware
type CORSMiddleware struct {
	allowedOrigins []string
	allowedMethods []string
	allowedHeaders []string
	exposedHeaders []string
	allowCredentials bool
	maxAge         string
}

// NewCORSMiddleware creates a new CORS middleware with custom configuration
func NewCORSMiddleware() *CORSMiddleware {
	return &CORSMiddleware{
		allowedOrigins: []string{
			"http://localhost:3000", // React development server
			"http://localhost:8081", // Expo development server
			"http://localhost:19006", // Expo web
			"https://7ftrends.com",   // Production domain
			"https://www.7ftrends.com",
			"https://app.7ftrends.com",
		},
		allowedMethods: []string{
			"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD",
		},
		allowedHeaders: []string{
			"Origin", "Content-Type", "Accept", "Authorization", "X-Requested-With",
			"X-Device-ID", "X-App-Version", "X-Platform", "X-Client-Version",
			"Cache-Control", "Pragma", "Accept-Encoding", "Accept-Language",
		},
		exposedHeaders: []string{
			"X-Total-Count", "X-Page-Count", "X-Rate-Limit-Remaining",
			"X-Rate-Limit-Reset", "X-Request-ID",
		},
		allowCredentials: true,
		maxAge:         "86400", // 24 hours in seconds
	}
}

// AddOrigin adds an allowed origin dynamically
func (c *CORSMiddleware) AddOrigin(origin string) {
	c.allowedOrigins = append(c.allowedOrigins, origin)
}

// AddAllowedHeader adds an allowed header
func (c *CORSMiddleware) AddAllowedHeader(header string) {
	c.allowedHeaders = append(c.allowedHeaders, header)
}

// SetAllowedOrigins sets the allowed origins
func (c *CORSMiddleware) SetAllowedOrigins(origins []string) {
	c.allowedOrigins = origins
}

// SetAllowedMethods sets the allowed methods
func (c *CORSMiddleware) SetAllowedMethods(methods []string) {
	c.allowedMethods = methods
}

// SetAllowedHeaders sets the allowed headers
func (c *CORSMiddleware) SetAllowedHeaders(headers []string) {
	c.allowedHeaders = headers
}

// SetAllowCredentials sets whether credentials are allowed
func (c *CORSMiddleware) SetAllowCredentials(allow bool) {
	c.allowCredentials = allow
}

// Handler returns the Gin middleware handler
func (c *CORSMiddleware) Handler() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		origin := ctx.Request.Header.Get("Origin")

		// Set CORS headers
		if c.isOriginAllowed(origin) {
			ctx.Header("Access-Control-Allow-Origin", origin)
		} else if len(c.allowedOrigins) == 0 {
			// If no origins are specified, allow all (not recommended for production)
			ctx.Header("Access-Control-Allow-Origin", "*")
		}

		ctx.Header("Access-Control-Allow-Methods", strings.Join(c.allowedMethods, ", "))
		ctx.Header("Access-Control-Allow-Headers", strings.Join(c.allowedHeaders, ", "))
		ctx.Header("Access-Control-Expose-Headers", strings.Join(c.exposedHeaders, ", "))
		ctx.Header("Access-Control-Allow-Credentials", boolToString(c.allowCredentials))
		ctx.Header("Access-Control-Max-Age", c.maxAge)

		// Handle preflight requests
		if ctx.Request.Method == "OPTIONS" {
			ctx.AbortWithStatus(http.StatusNoContent)
			return
		}

		ctx.Next()
	}
}

// isOriginAllowed checks if the origin is in the allowed origins list
func (c *CORSMiddleware) isOriginAllowed(origin string) bool {
	if origin == "" {
		return false
	}

	for _, allowedOrigin := range c.allowedOrigins {
		if allowedOrigin == "*" || allowedOrigin == origin {
			return true
		}

		// Support wildcard subdomains
		if strings.HasPrefix(allowedOrigin, "*.") {
			domain := strings.TrimPrefix(allowedOrigin, "*.")
			if strings.HasSuffix(origin, domain) {
				originParts := strings.Split(origin, ".")
				if len(originParts) >= 2 {
					return true
				}
			}
		}
	}

	return false
}

// boolToString converts a boolean to string
func boolToString(b bool) string {
	if b {
		return "true"
	}
	return "false"
}

// SimpleCORS returns a simple CORS middleware with default settings
func SimpleCORS() gin.HandlerFunc {
	return NewCORSMiddleware().Handler()
}

// PermissiveCORS returns a permissive CORS middleware for development
func PermissiveCORS() gin.HandlerFunc {
	return &CORSMiddleware{
		allowedOrigins: []string{"*"},
		allowedMethods: []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		allowedHeaders: []string{"*"},
		allowCredentials: false,
		maxAge:         "86400",
	}.Handler()
}

// RestrictiveCORS returns a restrictive CORS middleware for production
func RestrictiveCORS(allowedOrigins []string) gin.HandlerFunc {
	cors := NewCORSMiddleware()
	cors.SetAllowedOrigins(allowedOrigins)
	cors.SetAllowCredentials(true)
	return cors.Handler()
}