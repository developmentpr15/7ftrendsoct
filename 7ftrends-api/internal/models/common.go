package models

import (
	"time"

	"github.com/google/uuid"
)

// Common fields for all models
type BaseModel struct {
	ID        uuid.UUID  `json:"id" db:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	CreatedAt time.Time  `json:"created_at" db:"created_at" gorm:"autoCreateTime"`
	UpdatedAt time.Time  `json:"updated_at" db:"updated_at" gorm:"autoUpdateTime"`
	DeletedAt *time.Time `json:"deleted_at,omitempty" db:"deleted_at" gorm:"index"`
}

// Pagination parameters
type PaginationParams struct {
	Page     int    `json:"page" form:"page" binding:"min=1"`
	Limit    int    `json:"limit" form:"limit" binding:"min=1,max=100"`
	SortBy   string `json:"sort_by" form:"sort_by"`
	SortDesc bool   `json:"sort_desc" form:"sort_desc"`
}

// Default pagination values
func (p *PaginationParams) SetDefaults() {
	if p.Page <= 0 {
		p.Page = 1
	}
	if p.Limit <= 0 {
		p.Limit = 20
	}
	if p.Limit > 100 {
		p.Limit = 100
	}
}

// Get offset for database query
func (p *PaginationParams) GetOffset() int {
	return (p.Page - 1) * p.Limit
}

// Paginated response wrapper
type PaginatedResponse struct {
	Data       interface{} `json:"data"`
	Pagination Pagination  `json:"pagination"`
}

// Pagination metadata
type Pagination struct {
	Page       int  `json:"page"`
	Limit      int  `json:"limit"`
	Total      int64 `json:"total"`
	TotalPages int  `json:"total_pages"`
	HasNext    bool `json:"has_next"`
	HasPrev    bool `json:"has_prev"`
}

// API response structure
type APIResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   *ErrorInfo  `json:"error,omitempty"`
	Message string      `json:"message,omitempty"`
}

// Error information
type ErrorInfo struct {
	Code    string      `json:"code"`
	Message string      `json:"message"`
	Details interface{} `json:"details,omitempty"`
}

// Filter parameters
type FilterParams struct {
	Category   string    `json:"category" form:"category"`
	Color      string    `json:"color" form:"color"`
	Brand      string    `json:"brand" form:"brand"`
	Size       string    `json:"size" form:"size"`
	Tags       []string  `json:"tags" form:"tags"`
	DateFrom   time.Time `json:"date_from" form:"date_from"`
	DateTo     time.Time `json:"date_to" form:"date_to"`
	PriceMin   float64   `json:"price_min" form:"price_min"`
	PriceMax   float64   `json:"price_max" form:"price_max"`
	Status     string    `json:"status" form:"status"`
	Search     string    `json:"search" form:"search"`
}

// User context for requests
type UserContext struct {
	UserID   uuid.UUID `json:"user_id"`
	Username string    `json:"username"`
	Email    string    `json:"email"`
	Role     string    `json:"role"`
}

// File upload information
type FileUpload struct {
	ID          uuid.UUID `json:"id" db:"id"`
	OriginalName string   `json:"original_name" db:"original_name"`
	FileName    string    `json:"file_name" db:"file_name"`
	FilePath    string    `json:"file_path" db:"file_path"`
	FileSize    int64     `json:"file_size" db:"file_size"`
	MimeType    string    `json:"mime_type" db:"mime_type"`
	Hash        string    `json:"hash" db:"hash"`
	UserID      uuid.UUID `json:"user_id" db:"user_id"`
	PublicURL   string    `json:"public_url" db:"public_url"`
	BaseModel
}

// Common constants
const (
	// User roles
	RoleUser        = "user"
	RoleAdmin       = "admin"
	RoleModerator   = "moderator"

	// Post statuses
	StatusDraft     = "draft"
	StatusPublished = "published"
	StatusArchived  = "archived"

	// Competition statuses
	CompetitionStatusUpcoming   = "upcoming"
	CompetitionStatusActive     = "active"
	CompetitionStatusJudging    = "judging"
	CompetitionStatusCompleted  = "completed"

	// Entry statuses
	EntryStatusSubmitted  = "submitted"
	EntryStatusUnderReview = "under_review"
	EntryStatusApproved    = "approved"
	EntryStatusRejected    = "rejected"

	// File types
	ImageTypeJPEG = "image/jpeg"
	ImageTypePNG  = "image/png"
	ImageTypeWEBP = "image/webp"

	// Sort directions
	SortAsc  = "asc"
	SortDesc = "desc"

	// Default limits
	DefaultPageSize    = 20
	MaxPageSize        = 100
	MaxFileSizeDefault = 5 * 1024 * 1024 // 5MB
	MaxImageDimension  = 2048
)