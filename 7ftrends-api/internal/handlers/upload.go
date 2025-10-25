package handlers

import (
	"net/http"
	"time"

	"github.com/7ftrends/api/internal/services"
	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

type UploadHandler struct {
	upload *services.UploadService
	logger *logrus.Logger
}

func NewUploadHandler(upload *services.UploadService, logger *logrus.Logger) *UploadHandler {
	return &UploadHandler{upload: upload, logger: logger}
}

// GetPresignedURL returns a pre-signed PUT URL for direct upload to R2
// Query params:
// - key: desired object key (path/filename)
// - contentType: mime type (e.g., image/jpeg)
// - expires: seconds (optional)
func (h *UploadHandler) GetPresignedURL(c *gin.Context) {
	key := c.Query("key")
	contentType := c.Query("contentType")
	if key == "" || contentType == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "key and contentType are required"})
		return
	}

	expires := 300 * time.Second
	if expStr := c.Query("expires"); expStr != "" {
		if dur, err := time.ParseDuration(expStr + "s"); err == nil {
			expires = dur
		}
	}

	url, err := h.upload.GetPresignedPutURL(c.Request.Context(), key, contentType, expires)
	if err != nil {
		h.logger.WithError(err).Error("failed to create presigned url")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create presigned url"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"url": url,
		"public": h.upload.PublicURL(key),
	})
}

// UploadImage - not implemented yet (client should use presigned URL)
func (h *UploadHandler) UploadImage(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{"message": "Use presigned upload flow"})
}

// UploadMultipleImages - not implemented yet
func (h *UploadHandler) UploadMultipleImages(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{"message": "Use presigned upload flow"})
}

// DeleteFile deletes an object by key
func (h *UploadHandler) DeleteFile(c *gin.Context) {
	key := c.Param("id")
	if key == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "key is required"})
		return
	}
	if err := h.upload.DeleteFile(c.Request.Context(), key); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete file"})
		return
	}
	c.Status(http.StatusNoContent)
}
