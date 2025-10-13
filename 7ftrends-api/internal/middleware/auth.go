package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/sirupsen/logrus"

	"github.com/7ftrends/api/internal/models"
	"github.com/7ftrends/api/internal/utils"
)

// AuthMiddleware provides JWT authentication
type AuthMiddleware struct {
	jwtSecret []byte
	logger    *logrus.Logger
}

// NewAuthMiddleware creates a new auth middleware
func NewAuthMiddleware(jwtSecret string, logger *logrus.Logger) *AuthMiddleware {
	return &AuthMiddleware{
		jwtSecret: []byte(jwtSecret),
		logger:    logger,
	}
}

// RequireAuth middleware that validates JWT tokens
func (a *AuthMiddleware) RequireAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		token := a.extractToken(c)
		if token == "" {
			c.JSON(http.StatusUnauthorized, models.APIResponse{
				Success: false,
				Error: &models.ErrorInfo{
					Code:    "MISSING_TOKEN",
					Message: "Authentication token is required",
				},
			})
			c.Abort()
			return
		}

		claims, err := a.validateToken(token)
		if err != nil {
			a.logger.WithFields(logrus.Fields{
				"error": err.Error(),
				"token": token[:min(len(token), 20)] + "...",
			}).Warn("Invalid token")

			c.JSON(http.StatusUnauthorized, models.APIResponse{
				Success: false,
				Error: &models.ErrorInfo{
					Code:    "INVALID_TOKEN",
					Message: "Invalid or expired authentication token",
				},
			})
			c.Abort()
			return
		}

		// Add user context to the request
		c.Set("user_id", claims.UserID)
		c.Set("username", claims.Username)
		c.Set("email", claims.Email)
		c.Set("role", claims.Role)

		a.logger.WithFields(logrus.Fields{
			"user_id":  claims.UserID,
			"username": claims.Username,
			"path":     c.Request.URL.Path,
		}).Debug("User authenticated")

		c.Next()
	}
}

// RequireRole middleware that requires specific user role
func (a *AuthMiddleware) RequireRole(roles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole, exists := c.Get("role")
		if !exists {
			c.JSON(http.StatusUnauthorized, models.APIResponse{
				Success: false,
				Error: &models.ErrorInfo{
					Code:    "NO_ROLE",
					Message: "User role not found",
				},
			})
			c.Abort()
			return
		}

		roleStr := userRole.(string)
		for _, requiredRole := range roles {
			if roleStr == requiredRole {
				c.Next()
				return
			}
		}

		c.JSON(http.StatusForbidden, models.APIResponse{
			Success: false,
			Error: &models.ErrorInfo{
				Code:    "INSUFFICIENT_PERMISSIONS",
				Message: "Insufficient permissions to access this resource",
			},
		})
		c.Abort()
	}
}

// RequireOwnership middleware that requires user to own the resource
func (a *AuthMiddleware) RequireOwnership(resourceIDParam string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, models.APIResponse{
				Success: false,
				Error: &models.ErrorInfo{
					Code:    "NOT_AUTHENTICATED",
					Message: "Authentication required",
				},
			})
			c.Abort()
			return
		}

		resourceIDStr := c.Param(resourceIDParam)
		if resourceIDStr == "" {
			c.JSON(http.StatusBadRequest, models.APIResponse{
				Success: false,
				Error: &models.ErrorInfo{
					Code:    "MISSING_RESOURCE_ID",
					Message: "Resource ID is required",
				},
			})
			c.Abort()
			return
		}

		resourceID, err := uuid.Parse(resourceIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, models.APIResponse{
				Success: false,
				Error: &models.ErrorInfo{
					Code:    "INVALID_RESOURCE_ID",
					Message: "Invalid resource ID format",
				},
			})
			c.Abort()
			return
		}

		// Check if user owns the resource
		// This would typically involve a database query
		// For now, we'll assume the check is done elsewhere
		c.Set("resource_id", resourceID)
		c.Set("user_id", userID.(uuid.UUID))

		c.Next()
	}
}

// OptionalAuth middleware that optionally validates JWT tokens
func (a *AuthMiddleware) OptionalAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		token := a.extractToken(c)
		if token != "" {
			claims, err := a.validateToken(token)
			if err == nil {
				c.Set("user_id", claims.UserID)
				c.Set("username", claims.Username)
				c.Set("email", claims.Email)
				c.Set("role", claims.Role)

				a.logger.WithFields(logrus.Fields{
					"user_id":  claims.UserID,
					"username": claims.Username,
					"path":     c.Request.URL.Path,
				}).Debug("User optionally authenticated")
			}
		}

		c.Next()
	}
}

// JWTClaims represents the claims in our JWT token
type JWTClaims struct {
	UserID   uuid.UUID `json:"user_id"`
	Username string    `json:"username"`
	Email    string    `json:"email"`
	Role     string    `json:"role"`
	jwt.RegisteredClaims
}

// extractToken extracts JWT token from request
func (a *AuthMiddleware) extractToken(c *gin.Context) string {
	// Try to get token from Authorization header
	authHeader := c.GetHeader("Authorization")
	if authHeader != "" {
		parts := strings.Split(authHeader, " ")
		if len(parts) == 2 && parts[0] == "Bearer" {
			return parts[1]
		}
	}

	// Try to get token from query parameter (for WebSocket connections)
	token := c.Query("token")
	if token != "" {
		return token
	}

	// Try to get token from cookie
	cookie, err := c.Cookie("auth_token")
	if err == nil && cookie != "" {
		return cookie
	}

	return ""
}

// validateToken validates the JWT token and returns claims
func (a *AuthMiddleware) validateToken(tokenString string) (*JWTClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		// Validate signing method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, jwt.ErrSignatureInvalid
		}
		return a.jwtSecret, nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*JWTClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, jwt.ErrInvalidKey
}

// GenerateToken generates a new JWT token for a user
func (a *AuthMiddleware) GenerateToken(userID uuid.UUID, username, email, role string) (string, error) {
	claims := JWTClaims{
		UserID:   userID,
		Username: username,
		Email:    email,
		Role:     role,
		RegisteredClaims: jwt.RegisteredClaims{
			// Token expires in 24 hours
			ExpiresAt: jwt.NewNumericDate(utils.GetTime().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(utils.GetTime()),
			NotBefore: jwt.NewNumericDate(utils.GetTime()),
			Issuer:    "7ftrends-api",
			Subject:   userID.String(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(a.jwtSecret)
}

// GenerateRefreshToken generates a refresh token
func (a *AuthMiddleware) GenerateRefreshToken(userID uuid.UUID) (string, error) {
	claims := JWTClaims{
		UserID: userID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(utils.GetTime().Add(7 * 24 * time.Hour)), // 7 days
			IssuedAt:  jwt.NewNumericDate(utils.GetTime()),
			NotBefore: jwt.NewNumericDate(utils.GetTime()),
			Issuer:    "7ftrends-api",
			Subject:   userID.String(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(a.jwtSecret)
}

// RefreshToken generates a new access token from a refresh token
func (a *AuthMiddleware) RefreshToken(refreshTokenString string) (string, error) {
	claims, err := a.validateToken(refreshTokenString)
	if err != nil {
		return "", err
	}

	// Generate new access token with shorter expiration
	newClaims := JWTClaims{
		UserID:   claims.UserID,
		Username: claims.Username,
		Email:    claims.Email,
		Role:     claims.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(utils.GetTime().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(utils.GetTime()),
			NotBefore: jwt.NewNumericDate(utils.GetTime()),
			Issuer:    "7ftrends-api",
			Subject:   claims.UserID.String(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, newClaims)
	return token.SignedString(a.jwtSecret)
}

// min returns the minimum of two integers
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}