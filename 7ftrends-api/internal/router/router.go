package router

import (
	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"

	"github.com/7ftrends/api/internal/config"
	"github.com/7ftrends/api/internal/handlers"
	"github.com/7ftrends/api/internal/middleware"
	"github.com/7ftrends/api/internal/repository/supabase"
	"github.com/7ftrends/api/internal/services"
)

// SetupRoutes configures all API routes
func SetupRoutes(app *gin.Engine, cfg *config.Config, logger *logrus.Logger) {
	// Initialize repositories
	supabaseClient, err := supabase.NewClient(cfg.Supabase.URL, cfg.Supabase.ServiceKey)
	if err != nil {
		logger.WithError(err).Fatal("Failed to initialize Supabase client")
	}

	// Initialize repositories
	userRepo := supabase.NewUserRepository(supabaseClient)
	postRepo := supabase.NewPostRepository(supabaseClient)
	competitionRepo := supabase.NewCompetitionRepository(supabaseClient)
	tryonRepo := supabase.NewTryOnRepository(supabaseClient)

	// Initialize services
	authService := services.NewAuthService(userRepo, cfg.Auth.JWTSecret, cfg.Auth.JWTExpiration, logger)
	postService := services.NewPostService(postRepo, logger)
	competitionService := services.NewCompetitionService(competitionRepo, logger)
	tryonService := services.NewTryOnService(tryonRepo, logger)
	uploadService := services.NewUploadService(cfg.Storage, logger)

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(authService, logger)
	postHandler := handlers.NewPostHandler(postService, logger)
	competitionHandler := handlers.NewCompetitionHandler(competitionService, logger)
	tryonHandler := handlers.NewTryOnHandler(tryonService, logger)
	uploadHandler := handlers.NewUploadHandler(uploadService, logger)

	// Initialize middleware
	authMiddleware := middleware.NewAuthMiddleware(cfg.Auth.JWTSecret, logger)

	// API version 1
	v1 := app.Group("/api/v1")
	{
		// Authentication routes (no auth required)
		auth := v1.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
			auth.POST("/logout", authMiddleware.RequireAuth(), authHandler.Logout)
			auth.POST("/refresh", authHandler.RefreshToken)
			auth.POST("/forgot-password", authHandler.ForgotPassword)
			auth.POST("/reset-password", authHandler.ResetPassword)
			auth.GET("/me", authMiddleware.RequireAuth(), authHandler.GetCurrentUser)
			auth.PUT("/me", authMiddleware.RequireAuth(), authHandler.UpdateProfile)
			auth.PUT("/me/password", authMiddleware.RequireAuth(), authHandler.ChangePassword)
		}

		// Post routes
		posts := v1.Group("/posts")
		{
			posts.GET("", authMiddleware.OptionalAuth(), postHandler.GetPosts)
			posts.GET("/:id", authMiddleware.OptionalAuth(), postHandler.GetPost)
			posts.POST("", authMiddleware.RequireAuth(), postHandler.CreatePost)
			posts.PUT("/:id", authMiddleware.RequireAuth(), postHandler.UpdatePost)
			posts.DELETE("/:id", authMiddleware.RequireAuth(), postHandler.DeletePost)

			// Post interactions
			posts.POST("/:id/like", authMiddleware.RequireAuth(), postHandler.LikePost)
			posts.DELETE("/:id/like", authMiddleware.RequireAuth(), postHandler.UnlikePost)
			posts.POST("/:id/save", authMiddleware.RequireAuth(), postHandler.SavePost)
			posts.DELETE("/:id/save", authMiddleware.RequireAuth(), postHandler.UnsavePost)
			posts.POST("/:id/share", authMiddleware.RequireAuth(), postHandler.SharePost)

			// Comments
			posts.GET("/:id/comments", authMiddleware.OptionalAuth(), postHandler.GetComments)
			posts.POST("/:id/comments", authMiddleware.RequireAuth(), postHandler.CreateComment)
			posts.PUT("/comments/:id", authMiddleware.RequireAuth(), postHandler.UpdateComment)
			posts.DELETE("/comments/:id", authMiddleware.RequireAuth(), postHandler.DeleteComment)
			posts.POST("/comments/:id/like", authMiddleware.RequireAuth(), postHandler.LikeComment)
			posts.DELETE("/comments/:id/like", authMiddleware.RequireAuth(), postHandler.UnlikeComment)
		}

		// Competition routes
		competitions := v1.Group("/competitions")
		{
			competitions.GET("", authMiddleware.OptionalAuth(), competitionHandler.GetCompetitions)
			competitions.GET("/:id", authMiddleware.OptionalAuth(), competitionHandler.GetCompetition)
			competitions.POST("", authMiddleware.RequireAuth(), competitionHandler.CreateCompetition)
			competitions.PUT("/:id", authMiddleware.RequireAuth(), competitionHandler.UpdateCompetition)
			competitions.DELETE("/:id", authMiddleware.RequireAuth(), competitionHandler.DeleteCompetition)

			// Competition entries
			competitions.GET("/:id/entries", authMiddleware.OptionalAuth(), competitionHandler.GetEntries)
			competitions.POST("/:id/entries", authMiddleware.RequireAuth(), competitionHandler.CreateEntry)
			competitions.GET("/entries/:id", authMiddleware.OptionalAuth(), competitionHandler.GetEntry)
			competitions.PUT("/entries/:id", authMiddleware.RequireAuth(), competitionHandler.UpdateEntry)
			competitions.DELETE("/entries/:id", authMiddleware.RequireAuth(), competitionHandler.DeleteEntry)

			// Voting
			competitions.POST("/entries/:id/vote", authMiddleware.RequireAuth(), competitionHandler.VoteEntry)
			competitions.DELETE("/entries/:id/vote", authMiddleware.RequireAuth(), competitionHandler.RemoveVote)

			// Judge voting (admin/judge only)
			competitions.POST("/entries/:id/judge-vote", authMiddleware.RequireAuth(), authMiddleware.RequireRole("admin", "moderator", "judge"), competitionHandler.JudgeVoteEntry)

			// Competition comments
			competitions.GET("/entries/:id/comments", authMiddleware.OptionalAuth(), competitionHandler.GetEntryComments)
			competitions.POST("/entries/:id/comments", authMiddleware.RequireAuth(), competitionHandler.CreateEntryComment)
		}

		// AR Try-on routes
		tryon := v1.Group("/tryon")
		{
			tryon.POST("/process", authMiddleware.RequireAuth(), tryonHandler.ProcessTryOn)
			tryon.GET("/sessions", authMiddleware.RequireAuth(), tryonHandler.GetUserSessions)
			tryon.GET("/sessions/:id", authMiddleware.RequireAuth(), tryonHandler.GetSession)
			tryon.DELETE("/sessions/:id", authMiddleware.RequireAuth(), tryonHandler.DeleteSession)
			tryon.POST("/sessions/:id/share", authMiddleware.RequireAuth(), tryonHandler.ShareSession)

			// Wardrobe management
			tryon.GET("/wardrobe", authMiddleware.RequireAuth(), tryonHandler.GetWardrobeItems)
			tryon.POST("/wardrobe", authMiddleware.RequireAuth(), tryonHandler.CreateWardrobeItem)
			tryon.GET("/wardrobe/:id", authMiddleware.RequireAuth(), tryonHandler.GetWardrobeItem)
			tryon.PUT("/wardrobe/:id", authMiddleware.RequireAuth(), tryonHandler.UpdateWardrobeItem)
			tryon.DELETE("/wardrobe/:id", authMiddleware.RequireAuth(), tryonHandler.DeleteWardrobeItem)

			// Outfit management
			tryon.GET("/outfits", authMiddleware.RequireAuth(), tryonHandler.GetOutfits)
			tryon.POST("/outfits", authMiddleware.RequireAuth(), tryonHandler.CreateOutfit)
			tryon.GET("/outfits/:id", authMiddleware.RequireAuth(), tryonHandler.GetOutfit)
			tryon.PUT("/outfits/:id", authMiddleware.RequireAuth(), tryonHandler.UpdateOutfit)
			tryon.DELETE("/outfits/:id", authMiddleware.RequireAuth(), tryonHandler.DeleteOutfit)

			// AI suggestions
			tryon.GET("/suggestions", authMiddleware.RequireAuth(), tryonHandler.GetOutfitSuggestions)
			tryon.POST("/generate-suggestions", authMiddleware.RequireAuth(), tryonHandler.GenerateOutfitSuggestions)

			// Wardrobe analytics
			tryon.GET("/wardrobe/stats", authMiddleware.RequireAuth(), tryonHandler.GetWardrobeStats)
		}

		// Upload routes
		upload := v1.Group("/upload")
		{
			upload.POST("/image", authMiddleware.RequireAuth(), uploadHandler.UploadImage)
			upload.POST("/images", authMiddleware.RequireAuth(), uploadHandler.UploadMultipleImages)
			upload.GET("/presigned-url", authMiddleware.RequireAuth(), uploadHandler.GetPresignedURL)
			upload.DELETE("/:id", authMiddleware.RequireAuth(), uploadHandler.DeleteFile)
		}

		// User routes
		users := v1.Group("/users")
		{
			users.GET("/:username", authMiddleware.OptionalAuth(), getUserProfileHandler)
			users.GET("/:username/posts", authMiddleware.OptionalAuth(), getUserPostsHandler)
			users.GET("/:username/outfits", authMiddleware.OptionalAuth(), getUserOutfitsHandler)
			users.POST("/:username/follow", authMiddleware.RequireAuth(), followUserHandler)
			users.DELETE("/:username/follow", authMiddleware.RequireAuth(), unfollowUserHandler)
			users.GET("/:username/followers", authMiddleware.OptionalAuth(), getUserFollowersHandler)
			users.GET("/:username/following", authMiddleware.OptionalAuth(), getUserFollowingHandler)
		}

		// Search routes
		search := v1.Group("/search")
		{
			search.GET("/posts", authMiddleware.OptionalAuth(), searchPostsHandler)
			search.GET("/users", authMiddleware.OptionalAuth(), searchUsersHandler)
			search.GET("/competitions", authMiddleware.OptionalAuth(), searchCompetitionsHandler)
			search.GET("/wardrobe", authMiddleware.RequireAuth(), searchWardrobeHandler)
			search.GET("/hashtags", authMiddleware.OptionalAuth(), searchHashtagsHandler)
		}

		// Feed routes
		feed := v1.Group("/feed")
		{
			feed.GET("", authMiddleware.RequireAuth(), getFeedHandler)
			feed.GET("/trending", authMiddleware.OptionalAuth(), getTrendingHandler)
			feed.GET("/following", authMiddleware.RequireAuth(), getFollowingFeedHandler)
		}

		// Notification routes
		notifications := v1.Group("/notifications")
		{
			notifications.GET("", authMiddleware.RequireAuth(), getNotificationsHandler)
			notifications.PUT("/:id/read", authMiddleware.RequireAuth(), markNotificationReadHandler)
			notifications.PUT("/read-all", authMiddleware.RequireAuth(), markAllNotificationsReadHandler)
		}

		// Admin routes (admin only)
		admin := v1.Group("/admin")
		admin.Use(authMiddleware.RequireAuth())
		admin.Use(authMiddleware.RequireRole("admin"))
		{
			admin.GET("/stats", getAdminStatsHandler)
			admin.GET("/users", getAdminUsersHandler)
			admin.PUT("/users/:id/ban", banUserHandler)
			admin.PUT("/users/:id/unban", unbanUserHandler)
			admin.GET("/reports", getReportsHandler)
			admin.PUT("/reports/:id/resolve", resolveReportHandler)
		}
	}

	// WebSocket routes (for real-time features)
	app.GET("/ws", authMiddleware.OptionalAuth(), handleWebSocket)

	// Static file serving (for uploaded images)
	app.Static("/uploads", "./uploads")
}

// Placeholder handlers for routes that would be implemented
func getUserProfileHandler(c *gin.Context) {
	c.JSON(501, gin.H{"message": "Not implemented yet"})
}

func getUserPostsHandler(c *gin.Context) {
	c.JSON(501, gin.H{"message": "Not implemented yet"})
}

func getUserOutfitsHandler(c *gin.Context) {
	c.JSON(501, gin.H{"message": "Not implemented yet"})
}

func followUserHandler(c *gin.Context) {
	c.JSON(501, gin.H{"message": "Not implemented yet"})
}

func unfollowUserHandler(c *gin.Context) {
	c.JSON(501, gin.H{"message": "Not implemented yet"})
}

func getUserFollowersHandler(c *gin.Context) {
	c.JSON(501, gin.H{"message": "Not implemented yet"})
}

func getUserFollowingHandler(c *gin.Context) {
	c.JSON(501, gin.H{"message": "Not implemented yet"})
}

func searchPostsHandler(c *gin.Context) {
	c.JSON(501, gin.H{"message": "Not implemented yet"})
}

func searchUsersHandler(c *gin.Context) {
	c.JSON(501, gin.H{"message": "Not implemented yet"})
}

func searchCompetitionsHandler(c *gin.Context) {
	c.JSON(501, gin.H{"message": "Not implemented yet"})
}

func searchWardrobeHandler(c *gin.Context) {
	c.JSON(501, gin.H{"message": "Not implemented yet"})
}

func searchHashtagsHandler(c *gin.Context) {
	c.JSON(501, gin.H{"message": "Not implemented yet"})
}

func getFeedHandler(c *gin.Context) {
	c.JSON(501, gin.H{"message": "Not implemented yet"})
}

func getTrendingHandler(c *gin.Context) {
	c.JSON(501, gin.H{"message": "Not implemented yet"})
}

func getFollowingFeedHandler(c *gin.Context) {
	c.JSON(501, gin.H{"message": "Not implemented yet"})
}

func getNotificationsHandler(c *gin.Context) {
	c.JSON(501, gin.H{"message": "Not implemented yet"})
}

func markNotificationReadHandler(c *gin.Context) {
	c.JSON(501, gin.H{"message": "Not implemented yet"})
}

func markAllNotificationsReadHandler(c *gin.Context) {
	c.JSON(501, gin.H{"message": "Not implemented yet"})
}

func getAdminStatsHandler(c *gin.Context) {
	c.JSON(501, gin.H{"message": "Not implemented yet"})
}

func getAdminUsersHandler(c *gin.Context) {
	c.JSON(501, gin.H{"message": "Not implemented yet"})
}

func banUserHandler(c *gin.Context) {
	c.JSON(501, gin.H{"message": "Not implemented yet"})
}

func unbanUserHandler(c *gin.Context) {
	c.JSON(501, gin.H{"message": "Not implemented yet"})
}

func getReportsHandler(c *gin.Context) {
	c.JSON(501, gin.H{"message": "Not implemented yet"})
}

func resolveReportHandler(c *gin.Context) {
	c.JSON(501, gin.H{"message": "Not implemented yet"})
}

func handleWebSocket(c *gin.Context) {
	c.JSON(501, gin.H{"message": "WebSocket not implemented yet"})
}