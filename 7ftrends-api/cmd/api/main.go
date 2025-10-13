package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"

	"github.com/7ftrends/api/internal/config"
	"github.com/7ftrends/api/internal/middleware"
	"github.com/7ftrends/api/internal/router"
	"github.com/7ftrends/api/internal/utils"
)

func main() {
	// Load configuration
	cfg, err := config.LoadConfig("./configs")
	if err != nil {
		fmt.Printf("Failed to load configuration: %v\n", err)
		os.Exit(1)
	}

	// Validate configuration
	if err := cfg.Validate(); err != nil {
		fmt.Printf("Configuration validation failed: %v\n", err)
		os.Exit(1)
	}

	// Initialize logger
	logger := initLogger(cfg)
	logger.Info("Starting 7Ftrends API server...")

	// Set Gin mode
	gin.SetMode(cfg.Server.Mode)

	// Initialize router
	app := gin.New()

	// Setup global middleware
	setupGlobalMiddleware(app, cfg, logger)

	// Setup routes
	router.SetupRoutes(app, cfg, logger)

	// Create HTTP server
	server := &http.Server{
		Addr:         cfg.GetAddr(),
		Handler:      app,
		ReadTimeout:  time.Duration(cfg.Server.ReadTimeout) * time.Second,
		WriteTimeout: time.Duration(cfg.Server.WriteTimeout) * time.Second,
		IdleTimeout:  time.Duration(cfg.Server.IdleTimeout) * time.Second,
	}

	// Start server in a goroutine
	go func() {
		logger.WithField("address", server.Addr).Info("Server starting...")
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.WithError(err).Fatal("Failed to start server")
		}
	}()

	// Wait for interrupt signal to gracefully shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Info("Shutting down server...")

	// Create a deadline for shutdown
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// Attempt graceful shutdown
	if err := server.Shutdown(ctx); err != nil {
		logger.WithError(err).Error("Server forced to shutdown")
	}

	logger.Info("Server exited")
}

// initLogger initializes the logger with the given configuration
func initLogger(cfg *config.Config) *logrus.Logger {
	logger := logrus.New()

	// Set log level
	level, err := logrus.ParseLevel(cfg.Logger.Level)
	if err != nil {
		level = logrus.InfoLevel
	}
	logger.SetLevel(level)

	// Set log format
	if cfg.Logger.Format == "json" {
		logger.SetFormatter(&logrus.JSONFormatter{
			TimestampFormat: time.RFC3339,
		})
	} else {
		logger.SetFormatter(&logrus.TextFormatter{
			FullTimestamp:   true,
			TimestampFormat: time.RFC3339,
		})
	}

	// Set output
	if cfg.Logger.Output == "file" && cfg.Logger.MaxSize > 0 {
		// For file logging, you might want to use lumberjack or similar
		// For now, we'll stick with stdout
		logger.SetOutput(os.Stdout)
	} else {
		logger.SetOutput(os.Stdout)
	}

	return logger
}

// setupGlobalMiddleware sets up global middleware for the application
func setupGlobalMiddleware(app *gin.Engine, cfg *config.Config, logger *logrus.Logger) {
	// Recovery middleware
	app.Use(gin.Recovery())

	// Logging middleware
	app.Use(gin.LoggerWithFormatter(func(param gin.LogFormatterParams) string {
		logger.WithFields(logrus.Fields{
			"status":     param.StatusCode,
			"method":     param.Method,
			"path":       param.Path,
			"ip":         param.ClientIP,
			"latency":    param.Latency,
			"user_agent": param.Request.UserAgent(),
			"error":      param.ErrorMessage,
		}).Info("HTTP Request")
		return ""
	}))

	// CORS middleware
	corsMiddleware := middleware.NewCORSMiddleware()
	if cfg.IsDevelopment() {
		// Allow localhost origins for development
		corsMiddleware.AddOrigin("http://localhost:3000")
		corsMiddleware.AddOrigin("http://localhost:8081")
		corsMiddleware.AddOrigin("exp://192.168.1.100:8081") // Expo development
	}
	app.Use(corsMiddleware.Handler())

	// Rate limiting middleware
	rateLimitConfig := middleware.DefaultRateLimiterConfig()
	if cfg.IsDevelopment() {
		rateLimitConfig = middleware.DevelopmentRateLimiterConfig()
	} else if cfg.IsProduction() {
		rateLimitConfig = middleware.ProductionRateLimiterConfig()
	}
	rateLimiter := middleware.NewRateLimiter(rateLimitConfig, logger)
	app.Use(rateLimiter.Middleware())

	// Request ID middleware
	app.Use(func(c *gin.Context) {
		requestID := utils.GenerateRequestID()
		c.Set("request_id", requestID)
		c.Header("X-Request-ID", requestID)
		c.Next()
	})

	// Security headers middleware
	app.Use(func(c *gin.Context) {
		c.Header("X-Content-Type-Options", "nosniff")
		c.Header("X-Frame-Options", "DENY")
		c.Header("X-XSS-Protection", "1; mode=block")
		c.Header("Referrer-Policy", "strict-origin-when-cross-origin")
		c.Header("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
		c.Next()
	})

	// Health check endpoint (no auth required)
	app.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":    "ok",
			"timestamp": time.Now().UTC(),
			"version":   "1.0.0",
			"service":   "7ftrends-api",
		})
	})

	// API info endpoint
	app.GET("/api/v1/info", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"name":        "7Ftrends API",
			"version":     "1.0.0",
			"description": "Fashion try-on and social platform API",
			"endpoints": map[string]string{
				"tryon":        "/api/v1/tryon",
				"upload":       "/api/v1/upload",
				"posts":        "/api/v1/posts",
				"competitions": "/api/v1/competitions",
				"votes":        "/api/v1/votes",
			},
		})
	})
}