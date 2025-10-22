package handlers

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/your-org/7ftrends-api/internal/auth"
	"github.com/your-org/7ftrends-api/internal/database"
	"github.com/your-org/7ftrends-api/internal/utils"
)

type ImageEditHandler struct {
	db        *database.Queries
	uploadsDir string
	geminiKey  string
}

func NewImageEditHandler(db *database.Queries) *ImageEditHandler {
	uploadsDir := os.Getenv("UPLOADS_DIR")
	if uploadsDir == "" {
		uploadsDir = "./uploads"
	}

	geminiKey := os.Getenv("GEMINI_API_KEY")
	if geminiKey == "" {
		log.Println("⚠️ GEMINI_API_KEY not set in environment variables")
	}

	return &ImageEditHandler{
		db:        db,
		uploadsDir: uploadsDir,
		geminiKey:  geminiKey,
	}
}

// EditImageRequest represents a virtual try-on request
type EditImageRequest struct {
	UserImage      string `json:"userImage" validate:"required"`      // Base64 or URL
	GarmentImage   string `json:"garmentImage" validate:"required"`   // Base64 or URL
	Instructions   string `json:"instructions"`                        // Custom overlay instructions
	Position       string `json:"position" validate:"omitempty,oneof=upper-body lower-body full-body accessory"`
	Fit            string `json:"fit" validate:"omitempty,oneof=snug regular loose"`
	Style          string `json:"style" validate:"omitempty,oneof=realistic stylized enhanced"`
}

// EditImageResponse represents the response from image editing
type EditImageResponse struct {
	Success           bool    `json:"success"`
	CompositeImageURL string  `json:"compositeImageUrl,omitempty"`
	EditedImageURL    string  `json:"editedImageUrl,omitempty"`
	Confidence        float64 `json:"confidence,omitempty"`
	ProcessingTime    int64   `json:"processingTime,omitempty"`
	Error             string  `json:"error,omitempty"`
	Details           struct {
		ModelUsed             string   `json:"modelUsed"`
		InputDimensions      Dimensions `json:"inputDimensions"`
		OutputDimensions     Dimensions `json:"outputDimensions"`
		AppliedInstructions  []string `json:"appliedInstructions"`
	} `json:"details,omitempty"`
}

type Dimensions struct {
	Width  int `json:"width"`
	Height int `json:"height"`
}

// VirtualTryonHistory represents a virtual try-on history record
type VirtualTryonHistory struct {
	ID                uuid.UUID `json:"id"`
	UserID            uuid.UUID `json:"userId"`
	UserImageUrl      string    `json:"userImageUrl"`
	GarmentImageUrl   string    `json:"garmentImageUrl"`
	CompositeImageUrl *string   `json:"compositeImageUrl,omitempty"`
	Instructions      string    `json:"instructions"`
	Position          string    `json:"position"`
	Fit               string    `json:"fit"`
	Style             string    `json:"style"`
	Confidence        *float64  `json:"confidence,omitempty"`
	Status            string    `json:"status"`
	ProcessingTime    *int64    `json:"processingTime,omitempty"`
	CreatedAt         time.Time `json:"createdAt"`
}

// Gemini API request structure
type GeminiEditRequest struct {
	Contents []struct {
		Parts []struct {
			Text       string `json:"text,omitempty"`
			InlineData  struct {
				MimeType string `json:"mimeType"`
				Data     string `json:"data"`
			} `json:"inline_data,omitempty"`
		} `json:"parts"`
	} `json:"contents"`
	GenerationConfig struct {
		Temperature     float64 `json:"temperature"`
		TopK            int     `json:"topK"`
		TopP            float64 `json:"topP"`
		MaxOutputTokens int     `json:"maxOutputTokens"`
		ResponseMimeType string  `json:"responseMimeType"`
		ResponseSchema   struct {
			Type       string `json:"type"`
			Properties struct {
				Success struct {
					Type string `json:"type"`
				} `json:"success"`
				Confidence struct {
					Type    string  `json:"type"`
					Minimum float64 `json:"minimum"`
					Maximum float64 `json:"maximum"`
				} `json:"confidence"`
				AppliedInstructions struct {
					Type string `json:"type"`
					Items struct {
						Type string `json:"type"`
					} `json:"items"`
				} `json:"appliedInstructions"`
			} `json:"properties"`
		} `json:"responseSchema"`
	} `json:"generationConfig"`
}

// Gemini API response structure
type GeminiEditResponse struct {
	Candidates []struct {
		Content struct {
			Parts []struct {
				Text       string `json:"text,omitempty"`
				InlineData  struct {
					MimeType string `json:"mimeType"`
					Data     string `json:"data"`
				} `json:"inline_data,omitempty"`
			} `json:"parts"`
		} `json:"content"`
	} `json:"candidates"`
}

// EditImageWithGemini processes a virtual try-on request using Gemini 2.5 Flash Image API
func (h *ImageEditHandler) EditImageWithGemini(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID := auth.GetUserID(ctx)

	if h.geminiKey == "" {
		utils.RespondWithError(w, http.StatusServiceUnavailable, "Image editing service not available")
		return
	}

	var req EditImageRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate request
	if err := utils.ValidateStruct(req); err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	// Set default values
	if req.Position == "" {
		req.Position = "full-body"
	}
	if req.Fit == "" {
		req.Fit = "regular"
	}
	if req.Style == "" {
		req.Style = "realistic"
	}

	startTime := time.Now()

	// Process the image editing request
	result, err := h.processImageEdit(ctx, userID, req)
	if err != nil {
		log.Printf("Error processing image edit: %v", err)
		utils.RespondWithError(w, http.StatusInternalServerError, fmt.Sprintf("Image editing failed: %v", err))
		return
	}

	// Save to history
	historyID, err := h.saveEditHistory(ctx, userID, req, result)
	if err != nil {
		log.Printf("Error saving edit history: %v", err)
		// Don't fail the request if history saving fails
	}

	// Log successful editing
	log.Printf("✅ Virtual try-on completed for user %s, history ID: %s", userID, historyID)

	utils.RespondWithJSON(w, http.StatusOK, result)
}

// processImageEdit handles the actual image editing logic
func (h *ImageEditHandler) processImageEdit(ctx context.Context, userID uuid.UUID, req EditImageRequest) (EditImageResponse, error) {
	startTime := time.Now()

	// Convert images to base64 if they're URLs
	userImageBase64, err := h.convertToBase64(req.UserImage)
	if err != nil {
		return EditImageResponse{Success: false, Error: fmt.Sprintf("Failed to process user image: %v", err)}, nil
	}

	garmentImageBase64, err := h.convertToBase64(req.GarmentImage)
	if err != nil {
		return EditImageResponse{Success: false, Error: fmt.Sprintf("Failed to process garment image: %v", err)}, nil
	}

	// Generate contextual instructions
	instructions := h.generateOverlayInstructions(req)

	// Call Gemini 2.5 Flash Image API
	geminiResponse, err := h.callGeminiAPI(userImageBase64, garmentImageBase64, instructions)
	if err != nil {
		return EditImageResponse{Success: false, Error: fmt.Sprintf("Gemini API error: %v", err)}, nil
	}

	// Extract edited image
	editedImageBase64 := h.extractEditedImageFromResponse(geminiResponse)
	if editedImageBase64 == "" {
		return EditImageResponse{Success: false, Error: "Failed to extract edited image from API response"}, nil
	}

	// Upload composite image to storage
	compositeImageURL, err := h.uploadCompositeImage(ctx, userID, editedImageBase64)
	if err != nil {
		log.Printf("Warning: Failed to upload composite image: %v", err)
		// Continue without storage URL
		compositeImageURL = ""
	}

	processingTime := time.Since(startTime).Milliseconds()

	// Extract confidence from response
	confidence := h.extractConfidenceFromResponse(geminiResponse)

	return EditImageResponse{
		Success:           true,
		CompositeImageURL: compositeImageURL,
		EditedImageURL:    fmt.Sprintf("data:image/jpeg;base64,%s", editedImageBase64),
		Confidence:        confidence,
		ProcessingTime:    processingTime,
		Details: struct {
			ModelUsed             string   `json:"modelUsed"`
			InputDimensions      Dimensions `json:"inputDimensions"`
			OutputDimensions     Dimensions `json:"outputDimensions"`
			AppliedInstructions  []string `json:"appliedInstructions"`
		}{
			ModelUsed:             "gemini-2.5-flash-image",
			InputDimensions:      Dimensions{}, // Could be extracted from images
			OutputDimensions:     Dimensions{}, // Could be extracted from response
			AppliedInstructions:  []string{instructions},
		},
	}, nil
}

// convertToBase64 converts image URL or base64 to base64 string
func (h *ImageEditHandler) convertToBase64(imageSource string) (string, error) {
	// If already base64 (starts with data:), extract the base64 part
	if strings.HasPrefix(imageSource, "data:") {
		parts := strings.Split(imageSource, ",")
		if len(parts) != 2 {
			return "", fmt.Errorf("invalid base64 data URL format")
		}
		return parts[1], nil
	}

	// If it's a URL, download and convert
	if strings.HasPrefix(imageSource, "http://") || strings.HasPrefix(imageSource, "https://") {
		resp, err := http.Get(imageSource)
		if err != nil {
			return "", fmt.Errorf("failed to download image: %v", err)
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			return "", fmt.Errorf("image download failed with status: %d", resp.StatusCode)
		}

		// Read the image data
		imageData, err := io.ReadAll(resp.Body)
		if err != nil {
			return "", fmt.Errorf("failed to read image data: %v", err)
		}

		// Convert to base64
		return utils.EncodeBase64(imageData), nil
	}

	return "", fmt.Errorf("unsupported image source format")
}

// generateOverlayInstructions creates contextual instructions for garment overlay
func (h *ImageEditHandler) generateOverlayInstructions(req EditImageRequest) string {
	baseInstructions := "Create a realistic virtual try-on image by overlaying the garment onto the user photo. Ensure natural fitting, proper shadows, and realistic blending."

	positionInstructions := map[string]string{
		"upper-body": "Focus on upper body placement. Ensure proper alignment with shoulders, chest, and arms.",
		"lower-body": "Focus on lower body placement. Ensure proper alignment with waist, hips, and legs.",
		"full-body":  "Place garment on appropriate body section with full-body visibility.",
		"accessory":  "Position accessory naturally on the user (hat on head, bag in hand, watch on wrist, etc.).",
	}

	fitInstructions := map[string]string{
		"snug":   "Apply with close fit to body, showing natural contours.",
		"regular": "Apply with standard fit, neither too tight nor too loose.",
		"loose":  "Apply with relaxed fit, showing natural draping and movement.",
	}

	styleInstructions := map[string]string{
		"realistic":  "Create photorealistic result with accurate lighting, shadows, and textures.",
		"stylized":   "Apply artistic enhancement while maintaining recognizable features.",
		"enhanced":   "Improve overall appearance with subtle enhancements to lighting and colors.",
	}

	instructions := baseInstructions

	if posInstr, exists := positionInstructions[req.Position]; exists {
		instructions += " " + posInstr
	}

	if fitInstr, exists := fitInstructions[req.Fit]; exists {
		instructions += " " + fitInstr
	}

	if styleInstr, exists := styleInstructions[req.Style]; exists {
		instructions += " " + styleInstr
	}

	if req.Instructions != "" {
		instructions += " Additional requirements: " + req.Instructions
	}

	return instructions
}

// callGeminiAPI makes the actual API call to Gemini 2.5 Flash Image API
func (h *ImageEditHandler) callGeminiAPI(userImageBase64, garmentImageBase64, instructions string) (*GeminiEditResponse, error) {
	requestBody := GeminiEditRequest{
		Contents: []struct {
			Parts []struct {
				Text      string `json:"text,omitempty"`
				InlineData struct {
					MimeType string `json:"mimeType"`
					Data     string `json:"data"`
				} `json:"inline_data,omitempty"`
			} `json:"parts"`
		}{
			{
				Parts: []struct {
					Text      string `json:"text,omitempty"`
					InlineData struct {
						MimeType string `json:"mimeType"`
						Data     string `json:"data"`
					} `json:"inline_data,omitempty"`
				}{
					{Text: instructions},
					{
						InlineData: struct {
							MimeType string `json:"mimeType"`
							Data     string `json:"data"`
						}{
							MimeType: "image/jpeg",
							Data:     userImageBase64,
						},
					},
					{
						InlineData: struct {
							MimeType string `json:"mimeType"`
							Data     string `json:"data"`
						}{
							MimeType: "image/jpeg",
							Data:     garmentImageBase64,
						},
					},
				},
			},
		},
		GenerationConfig: struct {
			Temperature     float64 `json:"temperature"`
			TopK            int     `json:"topK"`
			TopP            float64 `json:"topP"`
			MaxOutputTokens int     `json:"maxOutputTokens"`
			ResponseMimeType string  `json:"responseMimeType"`
			ResponseSchema   struct {
				Type       string `json:"type"`
				Properties struct {
					Success struct {
						Type string `json:"type"`
					} `json:"success"`
					Confidence struct {
						Type    string  `json:"type"`
						Minimum float64 `json:"minimum"`
						Maximum float64 `json:"maximum"`
					} `json:"confidence"`
					AppliedInstructions struct {
						Type string `json:"type"`
						Items struct {
							Type string `json:"type"`
						} `json:"items"`
					} `json:"appliedInstructions"`
				} `json:"properties"`
			} `json:"responseSchema"`
		}{
			Temperature:     0.1,
			TopK:            32,
			TopP:            0.95,
			MaxOutputTokens: 1024,
			ResponseMimeType: "application/json",
			ResponseSchema: struct {
				Type       string `json:"type"`
				Properties struct {
					Success struct {
						Type string `json:"type"`
					} `json:"success"`
					Confidence struct {
						Type    string  `json:"type"`
						Minimum float64 `json:"minimum"`
						Maximum float64 `json:"maximum"`
					} `json:"confidence"`
					AppliedInstructions struct {
						Type string `json:"type"`
						Items struct {
							Type string `json:"type"`
						} `json:"items"`
					} `json:"appliedInstructions"`
				} `json:"properties"`
			}{
				Type: "object",
				Properties: struct {
					Success struct {
						Type string `json:"type"`
					} `json:"success"`
					Confidence struct {
						Type    string  `json:"type"`
						Minimum float64 `json:"minimum"`
						Maximum float64 `json:"maximum"`
					} `json:"confidence"`
					AppliedInstructions struct {
						Type string `json:"type"`
						Items struct {
							Type string `json:"type"`
						} `json:"items"`
					} `json:"appliedInstructions"`
				},
			},
		},
	}

	// Convert request to JSON
	requestJSON, err := json.Marshal(requestBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %v", err)
	}

	// Make HTTP request to Gemini API
	resp, err := http.Post(
		fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:edit?key=%s", h.geminiKey),
		"application/json",
		strings.NewReader(string(requestJSON)),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to make request to Gemini API: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("Gemini API error: status=%d, body=%s", resp.StatusCode, string(body))
	}

	// Parse response
	var geminiResponse GeminiEditResponse
	if err := json.NewDecoder(resp.Body).Decode(&geminiResponse); err != nil {
		return nil, fmt.Errorf("failed to parse Gemini response: %v", err)
	}

	return &geminiResponse, nil
}

// extractEditedImageFromResponse extracts the edited image from Gemini response
func (h *ImageEditHandler) extractEditedImageFromResponse(response *GeminiEditResponse) string {
	for _, candidate := range response.Candidates {
		for _, part := range candidate.Content.Parts {
			if part.InlineData.Data != "" && strings.HasPrefix(part.InlineData.MimeType, "image/") {
				return part.InlineData.Data
			}
		}
	}
	return ""
}

// extractConfidenceFromResponse extracts confidence score from Gemini response
func (h *ImageEditHandler) extractConfidenceFromResponse(response *GeminiEditResponse) float64 {
	// This would need to be parsed from the text response if Gemini provides confidence
	// For now, return a default confidence
	return 0.85
}

// uploadCompositeImage saves the composite image to storage
func (h *ImageEditHandler) uploadCompositeImage(ctx context.Context, userID uuid.UUID, base64Image string) (string, error) {
	// Create user-specific directory
	userDir := filepath.Join(h.uploadsDir, "virtual-tryon", userID.String())
	if err := os.MkdirAll(userDir, 0755); err != nil {
		return "", fmt.Errorf("failed to create upload directory: %v", err)
	}

	// Generate unique filename
	filename := fmt.Sprintf("%d-composite.jpg", time.Now().Unix())
	filePath := filepath.Join(userDir, filename)

	// Decode base64
	imageData, err := utils.DecodeBase64(base64Image)
	if err != nil {
		return "", fmt.Errorf("failed to decode base64 image: %v", err)
	}

	// Write file
	if err := os.WriteFile(filePath, imageData, 0644); err != nil {
		return "", fmt.Errorf("failed to write image file: %v", err)
	}

	// Return public URL (this would be configured based on your setup)
	return fmt.Sprintf("/uploads/virtual-tryon/%s/%s", userID.String(), filename), nil
}

// saveEditHistory saves the edit attempt to database
func (h *ImageEditHandler) saveEditHistory(ctx context.Context, userID uuid.UUID, req EditImageRequest, result EditImageResponse) (uuid.UUID, error) {
	historyID := uuid.New()
	now := time.Now()

	var compositeImageURL pgtype.Text
	if result.CompositeImageURL != "" {
		compositeImageURL = pgtype.Text{String: result.CompositeImageURL, Valid: true}
	}

	var confidence pgtype.Float8
	if result.Success {
		confidence = pgtype.Float8{Float64: result.Confidence, Valid: true}
	}

	var processingTime pgtype.Int8
	if result.ProcessingTime > 0 {
		processingTime = pgtype.Int8{Int64: result.ProcessingTime, Valid: true}
	}

	params := database.CreateVirtualTryonHistoryParams{
		ID:                historyID,
		UserID:            userID,
		UserImageUrl:      req.UserImage,
		GarmentImageUrl:   req.GarmentImage,
		CompositeImageUrl: compositeImageURL,
		Instructions:      req.Instructions,
		Position:          req.Position,
		Fit:               req.Fit,
		Style:             req.Style,
		Confidence:        confidence,
		Status:            map[bool]string{true: "completed", false: "failed"}[result.Success],
		ProcessingTime:    processingTime,
		CreatedAt:         now,
	}

	err := h.db.CreateVirtualTryonHistory(ctx, params)
	if err != nil {
		return uuid.Nil, fmt.Errorf("failed to save edit history: %v", err)
	}

	return historyID, nil
}

// GetEditHistory retrieves user's virtual try-on history
func (h *ImageEditHandler) GetEditHistory(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID := auth.GetUserID(ctx)

	// Parse query parameters
	limitStr := r.URL.Query().Get("limit")
	limit, _ := strconv.Atoi(limitStr)
	if limit < 1 || limit > 100 {
		limit = 20
	}

	offsetStr := r.URL.Query().Get("offset")
	offset, _ := strconv.Atoi(offsetStr)
	if offset < 0 {
		offset = 0
	}

	// Fetch history from database
	history, err := h.db.GetVirtualTryonHistory(ctx, database.GetVirtualTryonHistoryParams{
		UserID: userID,
		Limit:  int32(limit),
		Offset: int32(offset),
	})
	if err != nil {
		log.Printf("Error getting edit history: %v", err)
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to retrieve edit history")
		return
	}

	// Convert to response format
	historyItems := make([]VirtualTryonHistory, len(history))
	for i, item := range history {
		historyItems[i] = VirtualTryonHistory{
			ID:                item.ID,
			UserID:            item.UserID,
			UserImageUrl:      item.UserImageUrl,
			GarmentImageUrl:   item.GarmentImageUrl,
			CompositeImageUrl: utils.StringPtr(item.CompositeImageUrl.String),
			Instructions:      item.Instructions,
			Position:          item.Position,
			Fit:               item.Fit,
			Style:             item.Style,
			Confidence:        utils.Float64Ptr(item.Confidence.Float64),
			Status:            item.Status,
			ProcessingTime:    utils.Int64Ptr(item.ProcessingTime.Int64),
			CreatedAt:         item.CreatedAt,
		}
	}

	utils.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"history": historyItems,
		"limit":   limit,
		"offset":  offset,
	})
}

// DeleteEditHistory deletes a virtual try-on history item
func (h *ImageEditHandler) DeleteEditHistory(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID := auth.GetUserID(ctx)

	historyIDStr := chi.URLParam(r, "id")
	historyID, err := uuid.Parse(historyIDStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid history ID")
		return
	}

	// Verify ownership and delete
	err = h.db.DeleteVirtualTryonHistory(ctx, database.DeleteVirtualTryonHistoryParams{
		ID:     historyID,
		UserID: userID,
	})
	if err != nil {
		if err == sql.ErrNoRows {
			utils.RespondWithError(w, http.StatusNotFound, "History item not found")
			return
		}
		log.Printf("Error deleting edit history: %v", err)
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to delete history item")
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, map[string]string{"message": "History item deleted successfully"})
}

// GetUsageStats retrieves usage statistics for image editing
func (h *ImageEditHandler) GetUsageStats(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID := auth.GetUserID(ctx)

	stats, err := h.db.GetVirtualTryonStats(ctx, userID)
	if err != nil {
		log.Printf("Error getting usage stats: %v", err)
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to retrieve usage statistics")
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, stats)
}

// RegisterRoutes registers image editing routes
func (h *ImageEditHandler) RegisterRoutes(r chi.Router) {
	r.Route("/image-edit", func(r chi.Router) {
		r.Post("/edit", h.EditImageWithGemini)
		r.Get("/history", h.GetEditHistory)
		r.Get("/stats", h.GetUsageStats)
		r.Route("/history/{id}", func(r chi.Router) {
			r.Delete("/", h.DeleteEditHistory)
		})
	})
}