package handlers

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/your-org/7ftrends-api/internal/auth"
	"github.com/your-org/7ftrends-api/internal/database"
	"github.com/your-org/7ftrends-api/internal/utils"
)

type CompetitionsHandler struct {
	db *database.Queries
}

func NewCompetitionsHandler(db *database.Queries) *CompetitionsHandler {
	return &CompetitionsHandler{db: db}
}

// CompetitionRequest represents the request to create/update a competition
type CompetitionRequest struct {
	Country        string    `json:"country" validate:"required"`
	Title          string    `json:"title" validate:"required,max=200"`
	Theme          string    `json:"theme,omitempty" validate:"max=100"`
	Description    string    `json:"description,omitempty" validate:"max=1000"`
	BannerImageUrl string    `json:"banner_image_url,omitempty" validate:"url"`
	Rules          string    `json:"rules,omitempty" validate:"max=2000"`
	PrizePool      *PrizePool `json:"prize_pool,omitempty"`
	MaxEntries     *int      `json:"max_entries,omitempty" validate:"omitempty,min=1,max=10000"`
	StartAt        time.Time `json:"start_at" validate:"required"`
	EndAt          time.Time `json:"end_at" validate:"required,gtfield=StartAt"`
	VotingStartAt  *time.Time `json:"voting_start_at,omitempty"`
	VotingEndAt    *time.Time `json:"voting_end_at,omitempty"`
	JudgePanel     []uuid.UUID `json:"judge_panel,omitempty"`
}

type PrizePool struct {
	Points     int      `json:"points,omitempty"`
	Rewards    []string `json:"rewards,omitempty"`
	Sponsor    string   `json:"sponsor,omitempty"`
	SponsorLogo string  `json:"sponsor_logo,omitempty"`
}

// CompetitionResponse represents the response for competition data
type CompetitionResponse struct {
	ID              uuid.UUID  `json:"id"`
	Country         string     `json:"country"`
	Title           string     `json:"title"`
	Theme           *string    `json:"theme,omitempty"`
	Description     *string    `json:"description,omitempty"`
	BannerImageUrl  *string    `json:"banner_image_url,omitempty"`
	Rules           *string    `json:"rules,omitempty"`
	PrizePool       *PrizePool `json:"prize_pool,omitempty"`
	MaxEntries      *int       `json:"max_entries,omitempty"`
	StartAt         time.Time  `json:"start_at"`
	EndAt           time.Time  `json:"end_at"`
	VotingStartAt   *time.Time `json:"voting_start_at,omitempty"`
	VotingEndAt     *time.Time `json:"voting_end_at,omitempty"`
	Status          string     `json:"status"`
	JudgePanel      []uuid.UUID `json:"judge_panel,omitempty"`
	CreatedBy       uuid.UUID  `json:"created_by"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
	EntriesCount    *int64     `json:"entries_count,omitempty"`
	UserEntered     bool       `json:"user_entered,omitempty"`
}

// CompetitionEntryRequest represents the request to submit a competition entry
type CompetitionEntryRequest struct {
	CompetitionID uuid.UUID `json:"competition_id" validate:"required"`
	Title         string    `json:"title" validate:"required,max=200"`
	Description   string    `json:"description,omitempty" validate:"max=1000"`
	ImageUrl      string    `json:"image_url" validate:"required,url"`
	Images        []string  `json:"images,omitempty" validate:"dive,url"`
	Tags          []string  `json:"tags,omitempty" validate:"dive,max=50"`
}

// CompetitionEntryResponse represents the response for competition entry data
type CompetitionEntryResponse struct {
	ID            uuid.UUID   `json:"id"`
	UserID        uuid.UUID   `json:"user_id"`
	Username      string      `json:"username"`
	AvatarUrl     *string     `json:"avatar_url,omitempty"`
	CompetitionID uuid.UUID   `json:"competition_id"`
	Title         string      `json:"title"`
	Description   *string     `json:"description,omitempty"`
	ImageUrl      string      `json:"image_url"`
	Images        []string    `json:"images,omitempty"`
	Tags          []string    `json:"tags,omitempty"`
	Likes         int32       `json:"likes"`
	VotesCount    int32       `json:"votes_count"`
	Status        string      `json:"status"`
	FinalPlacement *int32     `json:"final_placement,omitempty"`
	FinalPointsAwarded *int32 `json:"final_points_awarded,omitempty"`
	SubmittedAt   time.Time   `json:"submitted_at"`
	JudgedAt      *time.Time  `json:"judged_at,omitempty"`
	JudgedBy      *uuid.UUID  `json:"judged_by,omitempty"`
	JudgeFeedback *string     `json:"judge_feedback,omitempty"`
	CreatedAt     time.Time   `json:"created_at"`
	UpdatedAt     time.Time   `json:"updated_at"`
	UserLiked     bool        `json:"user_liked,omitempty"`
}

// CreateCompetition creates a new competition
func (h *CompetitionsHandler) CreateCompetition(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Get authenticated user
	userID, err := auth.GetUserIDFromContext(ctx)
	if err != nil {
		utils.ErrorResponse(w, http.StatusUnauthorized, "User not authenticated", err)
		return
	}

	var req CompetitionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	// Validate request
	if err := utils.ValidateStruct(req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Validation failed", err)
		return
	}

	// Prepare prize pool JSON
	var prizePoolJSON []byte
	if req.PrizePool != nil {
		prizePoolJSON, err = json.Marshal(req.PrizePool)
		if err != nil {
			utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to process prize pool", err)
			return
		}
	}

	// Prepare judge panel JSON
	var judgePanelJSON []byte
	if len(req.JudgePanel) > 0 {
		judgePanelJSON, err = json.Marshal(req.JudgePanel)
		if err != nil {
			utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to process judge panel", err)
			return
		}
	}

	// Create competition
	competitionID := uuid.New()
	now := time.Now()

	params := database.CreateCompetitionParams{
		ID:             competitionID,
		Country:        req.Country,
		Title:          req.Title,
		Theme:          pgtype.Text{String: req.Theme, Valid: req.Theme != ""},
		Description:    pgtype.Text{String: req.Description, Valid: req.Description != ""},
		BannerImageUrl: pgtype.Text{String: req.BannerImageUrl, Valid: req.BannerImageUrl != ""},
		Rules:          pgtype.Text{String: req.Rules, Valid: req.Rules != ""},
		PrizePool:      prizePoolJSON,
		MaxEntries:     pgtype.Int4{Int32: int32(*req.MaxEntries), Valid: req.MaxEntries != nil},
		StartAt:        req.StartAt,
		EndAt:          req.EndAt,
		VotingStartAt:  pgtype.Timestamptz{Time: *req.VotingStartAt, Valid: req.VotingStartAt != nil},
		VotingEndAt:    pgtype.Timestamptz{Time: *req.VotingEndAt, Valid: req.VotingEndAt != nil},
		Status:         "draft",
		JudgePanel:     judgePanelJSON,
		CreatedBy:      userID,
		CreatedAt:      now,
		UpdatedAt:      now,
	}

	result, err := h.db.CreateCompetition(ctx, params)
	if err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to create competition", err)
		return
	}

	response := h.mapCompetitionToResponse(result)
	utils.JSONResponse(w, http.StatusCreated, response)
}

// GetActiveCompetitions retrieves active competitions
func (h *CompetitionsHandler) GetActiveCompetitions(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Parse country filter
	country := r.URL.Query().Get("country")
	var countryFilter pgtype.Text
	if country != "" {
		countryFilter = pgtype.Text{String: country, Valid: true}
	}

	competitions, err := h.db.GetActiveCompetitions(ctx, countryFilter)
	if err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to fetch competitions", err)
		return
	}

	var response []CompetitionResponse
	for _, comp := range competitions {
		response = append(response, h.mapCompetitionToResponse(comp))
	}

	utils.JSONResponse(w, http.StatusOK, map[string]interface{}{
		"competitions": response,
		"count":        len(response),
	})
}

// GetCompetitionByID retrieves a specific competition
func (h *CompetitionsHandler) GetCompetitionByID(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	competitionID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid competition ID", err)
		return
	}

	competition, err := h.db.GetCompetitionByID(ctx, competitionID)
	if err != nil {
		if err == sql.ErrNoRows {
			utils.ErrorResponse(w, http.StatusNotFound, "Competition not found", err)
			return
		}
		utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to fetch competition", err)
		return
	}

	response := h.mapCompetitionToResponse(competition)
	utils.JSONResponse(w, http.StatusOK, response)
}

// SubmitCompetitionEntry submits a new entry to a competition
func (h *CompetitionsHandler) SubmitCompetitionEntry(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Get authenticated user
	userID, err := auth.GetUserIDFromContext(ctx)
	if err != nil {
		utils.ErrorResponse(w, http.StatusUnauthorized, "User not authenticated", err)
		return
	}

	var req CompetitionEntryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	// Validate request
	if err := utils.ValidateStruct(req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Validation failed", err)
		return
	}

	// Check if user already has an entry for this competition
	_, err = h.db.CheckUserCompetitionEntry(ctx, database.CheckUserCompetitionEntryParams{
		UserID:        userID,
		CompetitionID: req.CompetitionID,
	})
	if err == nil {
		utils.ErrorResponse(w, http.StatusConflict, "You have already entered this competition", nil)
		return
	}
	if err != sql.ErrNoRows {
		utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to check existing entry", err)
		return
	}

	// Prepare images JSON
	var imagesJSON []byte
	if len(req.Images) > 0 {
		imagesJSON, err = json.Marshal(req.Images)
		if err != nil {
			utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to process images", err)
			return
		}
	}

	// Prepare tags JSON
	var tagsJSON []byte
	if len(req.Tags) > 0 {
		tagsJSON, err = json.Marshal(req.Tags)
		if err != nil {
			utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to process tags", err)
			return
		}
	}

	// Create entry
	now := time.Now()
	entryID := uuid.New()

	params := database.CreateCompetitionEntryParams{
		ID:            entryID,
		UserID:        userID,
		CompetitionID: req.CompetitionID,
		Title:         req.Title,
		Description:   pgtype.Text{String: req.Description, Valid: req.Description != ""},
		ImageUrl:      req.ImageUrl,
		Images:        imagesJSON,
		Tags:          tagsJSON,
		Status:        "submitted",
		SubmittedAt:   now,
		CreatedAt:     now,
		UpdatedAt:     now,
	}

	result, err := h.db.CreateCompetitionEntry(ctx, params)
	if err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to create entry", err)
		return
	}

	response := h.mapCompetitionEntryToResponse(result)
	utils.JSONResponse(w, http.StatusCreated, response)
}

// GetCompetitionEntries retrieves entries for a specific competition
func (h *CompetitionsHandler) GetCompetitionEntries(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	competitionID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid competition ID", err)
		return
	}

	// Parse query parameters
	sortBy := r.URL.Query().Get("sort_by")
	if sortBy == "" {
		sortBy = "votes_count"
	}
	sortOrder := r.URL.Query().Get("sort_order")
	if sortOrder == "" {
		sortOrder = "DESC"
	}

	limit, offset := utils.ParsePagination(r)

	params := database.GetCompetitionEntriesParams{
		CompetitionID: competitionID,
		SortBy:        sortBy,
		SortOrder:     sortOrder,
		Limit:         limit,
		Offset:        offset,
	}

	entries, err := h.db.GetCompetitionEntries(ctx, params)
	if err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to fetch entries", err)
		return
	}

	var response []CompetitionEntryResponse
	for _, entry := range entries {
		response = append(response, CompetitionEntryResponse{
			ID:            entry.ID,
			UserID:        entry.UserID,
			Username:      entry.Username,
			AvatarUrl:     &entry.AvatarUrl.String,
			CompetitionID: entry.CompetitionID,
			Title:         entry.Title,
			Description:   &entry.Description.String,
			ImageUrl:      entry.ImageUrl,
			Likes:         entry.Likes,
			VotesCount:    entry.VotesCount,
			Status:        entry.Status,
			SubmittedAt:   entry.SubmittedAt,
			CreatedAt:     entry.CreatedAt,
			UserLiked:     false, // TODO: Implement user liked logic
		})
	}

	utils.JSONResponse(w, http.StatusOK, map[string]interface{}{
		"entries": response,
		"count":   len(response),
		"limit":   limit,
		"offset":  offset,
	})
}

// GetUserCompetitionEntries retrieves entries for the authenticated user
func (h *CompetitionsHandler) GetUserCompetitionEntries(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Get authenticated user
	userID, err := auth.GetUserIDFromContext(ctx)
	if err != nil {
		utils.ErrorResponse(w, http.StatusUnauthorized, "User not authenticated", err)
		return
	}

	limit, offset := utils.ParsePagination(r)

	params := database.GetUserCompetitionEntriesParams{
		UserID: userID,
		Limit:  limit,
		Offset: offset,
	}

	entries, err := h.db.GetUserCompetitionEntries(ctx, params)
	if err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to fetch user entries", err)
		return
	}

	var response []CompetitionEntryResponse
	for _, entry := range entries {
		response = append(response, h.mapCompetitionEntryToResponse(entry))
	}

	utils.JSONResponse(w, http.StatusOK, map[string]interface{}{
		"entries": response,
		"count":   len(response),
		"limit":   limit,
		"offset":  offset,
	})
}

// WithdrawCompetitionEntry withdraws a competition entry
func (h *CompetitionsHandler) WithdrawCompetitionEntry(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Get authenticated user
	userID, err := auth.GetUserIDFromContext(ctx)
	if err != nil {
		utils.ErrorResponse(w, http.StatusUnauthorized, "User not authenticated", err)
		return
	}

	entryID, err := uuid.Parse(chi.URLParam(r, "entryId"))
	if err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid entry ID", err)
		return
	}

	params := database.UpdateCompetitionEntryStatusParams{
		ID:     entryID,
		Status: "withdrawn",
		UserID: userID,
	}

	result, err := h.db.UpdateCompetitionEntryStatus(ctx, params)
	if err != nil {
		if err == sql.ErrNoRows {
			utils.ErrorResponse(w, http.StatusNotFound, "Entry not found or you don't have permission", err)
			return
		}
		utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to withdraw entry", err)
		return
	}

	response := h.mapCompetitionEntryToResponse(result)
	utils.JSONResponse(w, http.StatusOK, response)
}

// Helper functions to map database models to response models
func (h *CompetitionsHandler) mapCompetitionToResponse(comp database.CompetitionsRow) CompetitionResponse {
	var prizePool *PrizePool
	if len(comp.PrizePool) > 0 {
		if err := json.Unmarshal(comp.PrizePool, &prizePool); err != nil {
			log.Printf("Failed to unmarshal prize pool: %v", err)
		}
	}

	var judgePanel []uuid.UUID
	if len(comp.JudgePanel) > 0 {
		if err := json.Unmarshal(comp.JudgePanel, &judgePanel); err != nil {
			log.Printf("Failed to unmarshal judge panel: %v", err)
		}
	}

	return CompetitionResponse{
		ID:             comp.ID,
		Country:        comp.Country,
		Title:          comp.Title,
		Theme:          &comp.Theme.String,
		Description:    &comp.Description.String,
		BannerImageUrl: &comp.BannerImageUrl.String,
		Rules:          &comp.Rules.String,
		PrizePool:      prizePool,
		MaxEntries:     (*int)(&comp.MaxEntries.Int32),
		StartAt:        comp.StartAt,
		EndAt:          comp.EndAt,
		VotingStartAt:  &comp.VotingStartAt.Time,
		VotingEndAt:    &comp.VotingEndAt.Time,
		Status:         comp.Status,
		JudgePanel:     judgePanel,
		CreatedBy:      comp.CreatedBy,
		CreatedAt:      comp.CreatedAt,
		UpdatedAt:      comp.UpdatedAt,
	}
}

func (h *CompetitionsHandler) mapCompetitionEntryToResponse(entry database.CompetitionEntriesRow) CompetitionEntryResponse {
	var images []string
	if len(entry.Images) > 0 {
		if err := json.Unmarshal(entry.Images, &images); err != nil {
			log.Printf("Failed to unmarshal images: %v", err)
		}
	}

	var tags []string
	if len(entry.Tags) > 0 {
		if err := json.Unmarshal(entry.Tags, &tags); err != nil {
			log.Printf("Failed to unmarshal tags: %v", err)
		}
	}

	return CompetitionEntryResponse{
		ID:                  entry.ID,
		UserID:              entry.UserID,
		CompetitionID:       entry.CompetitionID,
		Title:               entry.Title,
		Description:         &entry.Description.String,
		ImageUrl:            entry.ImageUrl,
		Images:              images,
		Tags:                tags,
		Likes:               entry.Likes,
		VotesCount:          entry.VotesCount,
		Status:              entry.Status,
		FinalPlacement:      &entry.FinalPlacement,
		FinalPointsAwarded:  &entry.FinalPointsAwarded,
		SubmittedAt:         entry.SubmittedAt,
		JudgedAt:            &entry.JudgedAt.Time,
		JudgedBy:            &entry.JudgedBy,
		JudgeFeedback:       &entry.JudgeFeedback.String,
		CreatedAt:           entry.CreatedAt,
		UpdatedAt:           entry.UpdatedAt,
		UserLiked:           false, // TODO: Implement user liked logic
	}
}