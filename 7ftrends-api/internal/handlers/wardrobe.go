package handlers

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/your-org/7ftrends-api/internal/auth"
	"github.com/your-org/7ftrends-api/internal/database"
	"github.com/your-org/7ftrends-api/internal/models"
	"github.com/your-org/7ftrends-api/internal/utils"
)

type WardrobeHandler struct {
	db *database.Queries
}

func NewWardrobeHandler(db *database.Queries) *WardrobeHandler {
	return &WardrobeHandler{db: db}
}

// WardrobeItem represents a clothing item in the wardrobe
type WardrobeItem struct {
	ID                uuid.UUID              `json:"id"`
	UserID            uuid.UUID              `json:"user_id"`
	Name              string                 `json:"name"`
	Description       *string                `json:"description"`
	Category          string                 `json:"category"`
	Subcategory       *string                `json:"subcategory"`
	Brand             *string                `json:"brand"`
	Color             string                 `json:"color"`
	SecondaryColors   []string               `json:"secondary_colors"`
	Size              *string                `json:"size"`
	Material          *string                `json:"material"`
	Style             *string                `json:"style"`
	Occasion          []string               `json:"occasion"`
	Season            []string               `json:"season"`
	Pattern           *string                `json:"pattern"`
	Images            []string               `json:"images"`
	Tags              []string               `json:"tags"`
	PurchaseDate      *time.Time             `json:"purchase_date"`
	PurchasePrice     *float64               `json:"purchase_price"`
	PurchaseLocation  *string                `json:"purchase_location"`
	CareInstructions  []string               `json:"care_instructions"`
	IsFavorite        bool                   `json:"is_favorite"`
	IsAvailable       bool                   `json:"is_available"`
	IsClean           bool                   `json:"is_clean"`
	LastWorn          *time.Time             `json:"last_worn"`
	WearCount         int32                  `json:"wear_count"`
	Condition         string                 `json:"condition"`
	QualityScore      int32                  `json:"quality_score"`
	SustainabilityScore *int32                `json:"sustainability_score"`
	Metadata          map[string]interface{} `json:"metadata"`
	// AI fields
	AITags            []string  `json:"ai_tags"`
	AICategory        *string   `json:"ai_category"`
	AIColors          []string  `json:"ai_colors"`
	AIOccasions       []string  `json:"ai_occasions"`
	AISeasons         []string  `json:"ai_seasons"`
	AIStyle           *string   `json:"ai_style"`
	AIMaterials       []string  `json:"ai_materials"`
	AIConfidence      *float64  `json:"ai_confidence"`
	AIProcessedAt     *time.Time `json:"ai_processed_at"`
	AIStatus          string    `json:"ai_status"`
	AIErrorMessage    *string   `json:"ai_error_message"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}

type CreateWardrobeItemRequest struct {
	Name              string                 `json:"name" validate:"required"`
	Description       *string                `json:"description"`
	Category          string                 `json:"category" validate:"required,oneof=top bottom dress outerwear shoes accessories underwear"`
	Subcategory       *string                `json:"subcategory"`
	Brand             *string                `json:"brand"`
	Color             string                 `json:"color" validate:"required"`
	SecondaryColors   []string               `json:"secondary_colors"`
	Size              *string                `json:"size"`
	Material          *string                `json:"material"`
	Style             *string                `json:"style"`
	Occasion          []string               `json:"occasion"`
	Season            []string               `json:"season"`
	Pattern           *string                `json:"pattern"`
	Images            []string               `json:"images"`
	Tags              []string               `json:"tags"`
	PurchaseDate      *time.Time             `json:"purchase_date"`
	PurchasePrice     *float64               `json:"purchase_price"`
	PurchaseLocation  *string                `json:"purchase_location"`
	CareInstructions  []string               `json:"care_instructions"`
	IsFavorite        bool                   `json:"is_favorite"`
	QualityScore      int32                  `json:"quality_score"`
	SustainabilityScore *int32                `json:"sustainability_score"`
	Metadata          map[string]interface{} `json:"metadata"`
}

type UpdateWardrobeItemRequest struct {
	Name              *string                `json:"name"`
	Description       *string                `json:"description"`
	Category          *string                `json:"category" validate:"omitempty,oneof=top bottom dress outerwear shoes accessories underwear"`
	Subcategory       *string                `json:"subcategory"`
	Brand             *string                `json:"brand"`
	Color             *string                `json:"color"`
	SecondaryColors   []string               `json:"secondary_colors"`
	Size              *string                `json:"size"`
	Material          *string                `json:"material"`
	Style             *string                `json:"style"`
	Occasion          []string               `json:"occasion"`
	Season            []string               `json:"season"`
	Pattern           *string                `json:"pattern"`
	Images            []string               `json:"images"`
	Tags              []string               `json:"tags"`
	PurchaseDate      *time.Time             `json:"purchase_date"`
	PurchasePrice     *float64               `json:"purchase_price"`
	PurchaseLocation  *string                `json:"purchase_location"`
	CareInstructions  []string               `json:"care_instructions"`
	IsFavorite        *bool                  `json:"is_favorite"`
	IsAvailable       *bool                  `json:"is_available"`
	IsClean           *bool                  `json:"is_clean"`
	WearCount         *int32                 `json:"wear_count"`
	Condition         *string                `json:"condition" validate:"omitempty,oneof=new excellent good fair poor"`
	QualityScore      *int32                 `json:"quality_score" validate:"omitempty,min=1,max=10"`
	SustainabilityScore *int32               `json:"sustainability_score" validate:"omitempty,min=1,max=10"`
	Metadata          map[string]interface{} `json:"metadata"`
}

type GetWardrobeItemsResponse struct {
	Items       []WardrobeItem `json:"items"`
	TotalCount  int64          `json:"total_count"`
	Page        int            `json:"page"`
	PerPage      int            `json:"per_page"`
	TotalPages  int            `json:"total_pages"`
}

// GetWardrobeItems retrieves user's wardrobe items with pagination and filtering
func (h *WardrobeHandler) GetWardrobeItems(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID := auth.GetUserID(ctx)

	// Parse query parameters
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	if page < 1 {
		page = 1
	}
	perPage, _ := strconv.Atoi(r.URL.Query().Get("per_page"))
	if perPage < 1 || perPage > 100 {
		perPage = 20
	}

	category := r.URL.Query().Get("category")
	color := r.URL.Query().Get("color")
	brand := r.URL.Query().Get("brand")
	isFavorite := r.URL.Query().Get("is_favorite")
	search := r.URL.Query().Get("search")

	offset := (page - 1) * perPage

	// Build query parameters
	params := database.GetWardrobeItemsParams{
		UserID: userID,
		Limit:  int32(perPage),
		Offset: int32(offset),
	}

	if category != "" {
		params.Category = pgtype.Text{
			String: category,
			Valid:  true,
		}
	}

	if color != "" {
		params.Color = pgtype.Text{
			String: color,
			Valid:  true,
		}
	}

	if brand != "" {
		params.Brand = pgtype.Text{
			String: brand,
			Valid:  true,
		}
	}

	if isFavorite == "true" {
		params.IsFavorite = pgtype.Bool{
			Bool:  true,
			Valid: true,
		}
	}

	if search != "" {
		params.Search = pgtype.Text{
			String: search,
			Valid:  true,
		}
	}

	// Execute query
	items, err := h.db.GetWardrobeItems(ctx, params)
	if err != nil {
		log.Printf("Error getting wardrobe items: %v", err)
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to retrieve wardrobe items")
		return
	}

	// Get total count for pagination
	count, err := h.db.GetWardrobeItemsCount(ctx, database.GetWardrobeItemsCountParams{
		UserID:     userID,
		Category:   params.Category,
		Color:      params.Color,
		Brand:      params.Brand,
		IsFavorite: params.IsFavorite,
		Search:     params.Search,
	})
	if err != nil {
		log.Printf("Error getting wardrobe items count: %v", err)
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to retrieve items count")
		return
	}

	// Convert database items to response format
	wardrobeItems := make([]WardrobeItem, len(items))
	for i, item := range items {
		wardrobeItems[i] = h.convertDBItemToWardrobeItem(item)
	}

	totalPages := int((count + int64(perPage) - 1) / int64(perPage))

	response := GetWardrobeItemsResponse{
		Items:      wardrobeItems,
		TotalCount: count,
		Page:       page,
		PerPage:     perPage,
		TotalPages: totalPages,
	}

	utils.RespondWithJSON(w, http.StatusOK, response)
}

// GetWardrobeItem retrieves a specific wardrobe item
func (h *WardrobeHandler) GetWardrobeItem(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID := auth.GetUserID(ctx)

	itemIDStr := chi.URLParam(r, "id")
	itemID, err := uuid.Parse(itemIDStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid item ID")
		return
	}

	item, err := h.db.GetWardrobeItem(ctx, database.GetWardrobeItemParams{
		ID:     itemID,
		UserID: userID,
	})
	if err != nil {
		if err == sql.ErrNoRows {
			utils.RespondWithError(w, http.StatusNotFound, "Item not found")
			return
		}
		log.Printf("Error getting wardrobe item: %v", err)
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to retrieve item")
		return
	}

	wardrobeItem := h.convertDBItemToWardrobeItem(item)
	utils.RespondWithJSON(w, http.StatusOK, wardrobeItem)
}

// CreateWardrobeItem creates a new wardrobe item
func (h *WardrobeHandler) CreateWardrobeItem(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID := auth.GetUserID(ctx)

	var req CreateWardrobeItemRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate request
	if err := utils.ValidateStruct(req); err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	itemID := uuid.New()
	now := time.Now()

	// Convert arrays to JSON for database
	secondaryColorsJSON, _ := json.Marshal(req.SecondaryColors)
	occasionJSON, _ := json.Marshal(req.Occasion)
	seasonJSON, _ := json.Marshal(req.Season)
	imagesJSON, _ := json.Marshal(req.Images)
	tagsJSON, _ := json.Marshal(req.Tags)
	careInstructionsJSON, _ := json.Marshal(req.CareInstructions)
	metadataJSON, _ := json.Marshal(req.Metadata)

	params := database.CreateWardrobeItemParams{
		ID:                    itemID,
		UserID:                userID,
		Name:                  req.Name,
		Description:           pgtype.Text{String: utils.StringValue(req.Description), Valid: req.Description != nil},
		Category:              req.Category,
		Subcategory:           pgtype.Text{String: utils.StringValue(req.Subcategory), Valid: req.Subcategory != nil},
		Brand:                 pgtype.Text{String: utils.StringValue(req.Brand), Valid: req.Brand != nil},
		Color:                 req.Color,
		SecondaryColors:       secondaryColorsJSON,
		Size:                  pgtype.Text{String: utils.StringValue(req.Size), Valid: req.Size != nil},
		Material:              pgtype.Text{String: utils.StringValue(req.Material), Valid: req.Material != nil},
		Style:                 pgtype.Text{String: utils.StringValue(req.Style), Valid: req.Style != nil},
		Occasion:              occasionJSON,
		Season:                seasonJSON,
		Pattern:               pgtype.Text{String: utils.StringValue(req.Pattern), Valid: req.Pattern != nil},
		Images:                imagesJSON,
		Tags:                  tagsJSON,
		PurchaseDate:          pgtype.Timestamptz{Time: utils.TimeValue(req.PurchaseDate), Valid: req.PurchaseDate != nil},
		PurchasePrice:         pgtype.Float8{Float64: utils.Float64Value(req.PurchasePrice), Valid: req.PurchasePrice != nil},
		PurchaseLocation:      pgtype.Text{String: utils.StringValue(req.PurchaseLocation), Valid: req.PurchaseLocation != nil},
		CareInstructions:      careInstructionsJSON,
		IsFavorite:            req.IsFavorite,
		IsAvailable:           true,
		IsClean:               true,
		WearCount:             0,
		Condition:             "good",
		QualityScore:          req.QualityScore,
		SustainabilityScore:   pgtype.Int4{Int32: utils.Int32Value(req.SustainabilityScore), Valid: req.SustainabilityScore != nil},
		Metadata:              metadataJSON,
		CreatedAt:             now,
		UpdatedAt:             now,
	}

	item, err := h.db.CreateWardrobeItem(ctx, params)
	if err != nil {
		log.Printf("Error creating wardrobe item: %v", err)
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to create item")
		return
	}

	wardrobeItem := h.convertDBItemToWardrobeItem(item)
	utils.RespondWithJSON(w, http.StatusCreated, wardrobeItem)
}

// UpdateWardrobeItem updates an existing wardrobe item
func (h *WardrobeHandler) UpdateWardrobeItem(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID := auth.GetUserID(ctx)

	itemIDStr := chi.URLParam(r, "id")
	itemID, err := uuid.Parse(itemIDStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid item ID")
		return
	}

	var req UpdateWardrobeItemRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate request
	if err := utils.ValidateStruct(req); err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	// Check if item exists and belongs to user
	existingItem, err := h.db.GetWardrobeItem(ctx, database.GetWardrobeItemParams{
		ID:     itemID,
		UserID: userID,
	})
	if err != nil {
		if err == sql.ErrNoRows {
			utils.RespondWithError(w, http.StatusNotFound, "Item not found")
			return
		}
		log.Printf("Error getting wardrobe item for update: %v", err)
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to retrieve item")
		return
	}

	// Build update parameters
	params := database.UpdateWardrobeItemParams{
		ID:        itemID,
		UserID:    userID,
		UpdatedAt: time.Now(),
	}

	if req.Name != nil {
		params.Name = *req.Name
	}
	if req.Description != nil {
		params.Description = pgtype.Text{String: *req.Description, Valid: true}
	}
	if req.Category != nil {
		params.Category = *req.Category
	}
	if req.Subcategory != nil {
		params.Subcategory = pgtype.Text{String: *req.Subcategory, Valid: true}
	}
	if req.Brand != nil {
		params.Brand = pgtype.Text{String: *req.Brand, Valid: true}
	}
	if req.Color != nil {
		params.Color = *req.Color
	}
	if req.SecondaryColors != nil {
		if jsonBytes, err := json.Marshal(req.SecondaryColors); err == nil {
			params.SecondaryColors = jsonBytes
		}
	}
	if req.Size != nil {
		params.Size = pgtype.Text{String: *req.Size, Valid: true}
	}
	if req.Material != nil {
		params.Material = pgtype.Text{String: *req.Material, Valid: true}
	}
	if req.Style != nil {
		params.Style = pgtype.Text{String: *req.Style, Valid: true}
	}
	if req.Occasion != nil {
		if jsonBytes, err := json.Marshal(req.Occasion); err == nil {
			params.Occasion = jsonBytes
		}
	}
	if req.Season != nil {
		if jsonBytes, err := json.Marshal(req.Season); err == nil {
			params.Season = jsonBytes
		}
	}
	if req.Pattern != nil {
		params.Pattern = pgtype.Text{String: *req.Pattern, Valid: true}
	}
	if req.Images != nil {
		if jsonBytes, err := json.Marshal(req.Images); err == nil {
			params.Images = jsonBytes
		}
	}
	if req.Tags != nil {
		if jsonBytes, err := json.Marshal(req.Tags); err == nil {
			params.Tags = jsonBytes
		}
	}
	if req.PurchaseDate != nil {
		params.PurchaseDate = pgtype.Timestamptz{Time: *req.PurchaseDate, Valid: true}
	}
	if req.PurchasePrice != nil {
		params.PurchasePrice = pgtype.Float8{Float64: *req.PurchasePrice, Valid: true}
	}
	if req.PurchaseLocation != nil {
		params.PurchaseLocation = pgtype.Text{String: *req.PurchaseLocation, Valid: true}
	}
	if req.CareInstructions != nil {
		if jsonBytes, err := json.Marshal(req.CareInstructions); err == nil {
			params.CareInstructions = jsonBytes
		}
	}
	if req.IsFavorite != nil {
		params.IsFavorite = *req.IsFavorite
	}
	if req.IsAvailable != nil {
		params.IsAvailable = *req.IsAvailable
	}
	if req.IsClean != nil {
		params.IsClean = *req.IsClean
	}
	if req.WearCount != nil {
		params.WearCount = *req.WearCount
	}
	if req.Condition != nil {
		params.Condition = *req.Condition
	}
	if req.QualityScore != nil {
		params.QualityScore = *req.QualityScore
	}
	if req.SustainabilityScore != nil {
		params.SustainabilityScore = pgtype.Int4{Int32: *req.SustainabilityScore, Valid: true}
	}
	if req.Metadata != nil {
		if jsonBytes, err := json.Marshal(req.Metadata); err == nil {
			params.Metadata = jsonBytes
		}
	}

	item, err := h.db.UpdateWardrobeItem(ctx, params)
	if err != nil {
		log.Printf("Error updating wardrobe item: %v", err)
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to update item")
		return
	}

	wardrobeItem := h.convertDBItemToWardrobeItem(item)
	utils.RespondWithJSON(w, http.StatusOK, wardrobeItem)
}

// DeleteWardrobeItem deletes a wardrobe item
func (h *WardrobeHandler) DeleteWardrobeItem(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID := auth.GetUserID(ctx)

	itemIDStr := chi.URLParam(r, "id")
	itemID, err := uuid.Parse(itemIDStr)
	if err != nil {
		utils.RespondWithError(w, http.StatusBadRequest, "Invalid item ID")
		return
	}

	// Check if item exists and belongs to user
	_, err = h.db.GetWardrobeItem(ctx, database.GetWardrobeItemParams{
		ID:     itemID,
		UserID: userID,
	})
	if err != nil {
		if err == sql.ErrNoRows {
			utils.RespondWithError(w, http.StatusNotFound, "Item not found")
			return
		}
		log.Printf("Error getting wardrobe item for deletion: %v", err)
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to retrieve item")
		return
	}

	err = h.db.DeleteWardrobeItem(ctx, database.DeleteWardrobeItemParams{
		ID:     itemID,
		UserID: userID,
	})
	if err != nil {
		log.Printf("Error deleting wardrobe item: %v", err)
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to delete item")
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, map[string]string{"message": "Item deleted successfully"})
}

// GetWardrobeStats retrieves wardrobe statistics for the user
func (h *WardrobeHandler) GetWardrobeStats(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userID := auth.GetUserID(ctx)

	stats, err := h.db.GetWardrobeStats(ctx, userID)
	if err != nil {
		log.Printf("Error getting wardrobe stats: %v", err)
		utils.RespondWithError(w, http.StatusInternalServerError, "Failed to retrieve wardrobe statistics")
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, stats)
}

// Helper function to convert database item to WardrobeItem
func (h *WardrobeHandler) convertDBItemToWardrobeItem(item database.GetWardrobeItemsRow) WardrobeItem {
	wardrobeItem := WardrobeItem{
		ID:                item.ID,
		UserID:            item.UserID,
		Name:              item.Name,
		Category:          item.Category,
		Color:             item.Color,
		IsFavorite:        item.IsFavorite,
		IsAvailable:       item.IsAvailable,
		IsClean:           item.IsClean,
		WearCount:         item.WearCount,
		Condition:         item.Condition,
		QualityScore:      item.QualityScore,
		CreatedAt:         item.CreatedAt,
		UpdatedAt:         item.UpdatedAt,
	}

	// Parse nullable fields
	if item.Description.Valid {
		wardrobeItem.Description = &item.Description.String
	}
	if item.Subcategory.Valid {
		wardrobeItem.Subcategory = &item.Subcategory.String
	}
	if item.Brand.Valid {
		wardrobeItem.Brand = &item.Brand.String
	}
	if item.Size.Valid {
		wardrobeItem.Size = &item.Size.String
	}
	if item.Material.Valid {
		wardrobeItem.Material = &item.Material.String
	}
	if item.Style.Valid {
		wardrobeItem.Style = &item.Style.String
	}
	if item.Pattern.Valid {
		wardrobeItem.Pattern = &item.Pattern.String
	}
	if item.PurchaseDate.Valid {
		wardrobeItem.PurchaseDate = &item.PurchaseDate.Time
	}
	if item.PurchasePrice.Valid {
		wardrobeItem.PurchasePrice = &item.PurchasePrice.Float64
	}
	if item.PurchaseLocation.Valid {
		wardrobeItem.PurchaseLocation = &item.PurchaseLocation.String
	}
	if item.LastWorn.Valid {
		wardrobeItem.LastWorn = &item.LastWorn.Time
	}
	if item.SustainabilityScore.Valid {
		wardrobeItem.SustainabilityScore = &item.SustainabilityScore.Int32
	}

	// Parse JSON fields
	if err := json.Unmarshal(item.SecondaryColors, &wardrobeItem.SecondaryColors); err != nil {
		log.Printf("Error parsing secondary colors: %v", err)
	}
	if err := json.Unmarshal(item.Occasion, &wardrobeItem.Occasion); err != nil {
		log.Printf("Error parsing occasion: %v", err)
	}
	if err := json.Unmarshal(item.Season, &wardrobeItem.Season); err != nil {
		log.Printf("Error parsing season: %v", err)
	}
	if err := json.Unmarshal(item.Images, &wardrobeItem.Images); err != nil {
		log.Printf("Error parsing images: %v", err)
	}
	if err := json.Unmarshal(item.Tags, &wardrobeItem.Tags); err != nil {
		log.Printf("Error parsing tags: %v", err)
	}
	if err := json.Unmarshal(item.CareInstructions, &wardrobeItem.CareInstructions); err != nil {
		log.Printf("Error parsing care instructions: %v", err)
	}
	if err := json.Unmarshal(item.Metadata, &wardrobeItem.Metadata); err != nil {
		log.Printf("Error parsing metadata: %v", err)
	}

	// Parse AI fields
	if err := json.Unmarshal(item.AiTags, &wardrobeItem.AITags); err != nil {
		log.Printf("Error parsing AI tags: %v", err)
	}
	if item.AiCategory.Valid {
		wardrobeItem.AICategory = &item.AiCategory.String
	}
	if err := json.Unmarshal(item.AiColors, &wardrobeItem.AIColors); err != nil {
		log.Printf("Error parsing AI colors: %v", err)
	}
	if err := json.Unmarshal(item.AiOccasions, &wardrobeItem.AIOccasions); err != nil {
		log.Printf("Error parsing AI occasions: %v", err)
	}
	if err := json.Unmarshal(item.AiSeasons, &wardrobeItem.AISeasons); err != nil {
		log.Printf("Error parsing AI seasons: %v", err)
	}
	if item.AiStyle.Valid {
		wardrobeItem.AIStyle = &item.AiStyle.String
	}
	if err := json.Unmarshal(item.AiMaterials, &wardrobeItem.AIMaterials); err != nil {
		log.Printf("Error parsing AI materials: %v", err)
	}
	if item.AiConfidence.Valid {
		wardrobeItem.AIConfidence = &item.AiConfidence.Float64
	}
	if item.AiProcessedAt.Valid {
		wardrobeItem.AIProcessedAt = &item.AiProcessedAt.Time
	}
	if item.AiStatus.Valid {
		wardrobeItem.AIStatus = item.AiStatus.String
	}
	if item.AiErrorMessage.Valid {
		wardrobeItem.AIErrorMessage = &item.AiErrorMessage.String
	}

	return wardrobeItem
}

// RegisterRoutes registers wardrobe routes
func (h *WardrobeHandler) RegisterRoutes(r chi.Router) {
	r.Route("/wardrobe", func(r chi.Router) {
		r.Get("/", h.GetWardrobeItems)
		r.Post("/", h.CreateWardrobeItem)
		r.Get("/stats", h.GetWardrobeStats)
		r.Route("/{id}", func(r chi.Router) {
			r.Get("/", h.GetWardrobeItem)
			r.Put("/", h.UpdateWardrobeItem)
			r.Delete("/", h.DeleteWardrobeItem)
		})
	})
}