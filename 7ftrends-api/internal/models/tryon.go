package models

import (
	"time"
)

// TryOnSession represents an AR try-on session
type TryOnSession struct {
	BaseModel
	UserID          uuid.UUID  `json:"user_id" db:"user_id"`
	OriginalImage   string     `json:"original_image" db:"original_image"`
	ProcessedImage  *string    `json:"processed_image" db:"processed_image"`
	WardrobeItems   []string   `json:"wardrobe_items" db:"wardrobe_items" gorm:"type:text[]"`
	Settings        TryOnSettings `json:"settings" db:"settings" gorm:"type:jsonb"`
	Status          string     `json:"status" db:"status" gorm:"default:processing"` // processing, completed, failed
	ProcessingTime  int        `json:"processing_time" db:"processing_time"` // milliseconds
	AIConfidence    float64    `json:"ai_confidence" db:"ai_confidence"`
	IsPublic        bool       `json:"is_public" db:"is_public" gorm:"default:false"`
	ShareableURL    *string    `json:"shareable_url" db:"shareable_url"`
}

// TryOnSettings holds try-on configuration
type TryOnSettings struct {
	Background      string            `json:"background" db:"background"`      // remove, blur, replace
	BackgroundColor string            `json:"background_color" db:"background_color"`
	Lighting        string            `json:"lighting" db:"lighting"`          // natural, studio, custom
	Filters         []string          `json:"filters" db:"filters"`            // brightness, contrast, saturation
	Quality         string            `json:"quality" db:"quality"`            // low, medium, high
	Customizations  map[string]interface{} `json:"customizations" db:"customizations"`
}

// TryOnRequest represents a try-on request
type TryOnRequest struct {
	UserID         uuid.UUID     `json:"user_id" binding:"required"`
	BaseImage      string        `json:"base_image" binding:"required"` // Base64 or URL
	ItemsToTry     []string      `json:"items_to_try" binding:"required,min=1,max=5"` // Wardrobe item IDs
	Settings       TryOnSettings `json:"settings"`
	Priority       int           `json:"priority"` // 1-10, higher priority for premium users
}

// TryOnResponse represents try-on result
type TryOnResponse struct {
	SessionID       uuid.UUID `json:"session_id"`
	Success         bool      `json:"success"`
	ProcessedImage  string    `json:"processed_image,omitempty"`
	Confidence      float64   `json:"confidence"`
	ProcessingTime  int       `json:"processing_time"`
	AppliedItems    []WardrobeItem `json:"applied_items"`
	Error           string    `json:"error,omitempty"`
	Suggestions     []string  `json:"suggestions,omitempty"`
}

// WardrobeItem represents an item in user's wardrobe
type WardrobeItem struct {
	BaseModel
	UserID       uuid.UUID `json:"user_id" db:"user_id"`
	Name         string    `json:"name" db:"name" binding:"required,min=1,max=100"`
	Category     string    `json:"category" db:"category" binding:"required"` // top, bottom, shoes, accessories
	SubCategory  *string   `json:"sub_category" db:"sub_category"`
	Color        string    `json:"color" db:"color"`
	Brand        *string   `json:"brand" db:"brand"`
	Size         *string   `json:"size" db:"size"`
	Material     *string   `json:"material" db:"material"`
	Pattern      *string   `json:"pattern" db:"pattern"`
	Season       *string   `json:"season" db:"season"` // spring, summer, fall, winter
	Style        *string   `json:"style" db:"style"`   // casual, formal, sporty
	Tags         []string  `json:"tags" db:"tags" gorm:"type:text[]"`
	Images       []string  `json:"images" db:"images" gorm:"type:text[]"`
	PrimaryImage string    `json:"primary_image" db:"primary_image"`
	IsFavorite   bool      `json:"is_favorite" db:"is_favorite" gorm:"default:false"`
	IsPublic     bool      `json:"is_public" db:"is_public" gorm:"default:false"`
	Price        *float64  `json:"price" db:"price"`
	Currency     *string   `json:"currency" db:"currency"`
	PurchaseDate *time.Time `json:"purchase_date" db:"purchase_date"`
	LastWorn     *time.Time `json:"last_worn" db:"last_worn"`
	WearCount    int       `json:"wear_count" db:"wear_count" gorm:"default:0"`
	Condition    string    `json:"condition" db:"condition" gorm:"default:excellent"` // excellent, good, fair, poor
	Notes        *string   `json:"notes" db:"notes"`
	Metadata     map[string]interface{} `json:"metadata" db:"metadata" gorm:"type:jsonb"`
}

// Outfit represents a combination of wardrobe items
type Outfit struct {
	BaseModel
	UserID        uuid.UUID      `json:"user_id" db:"user_id"`
	Name          string         `json:"name" db:"name" binding:"required,min=1,max=100"`
	Description   *string        `json:"description" db:"description"`
	Items         []OutfitItem   `json:"items" db:"items" gorm:"foreignKey:OutfitID"`
	Occasion      string         `json:"occasion" db:"occasion"` // casual, business, party, date, etc.
	Season        string         `json:"season" db:"season"`
	Style         string         `json:"style" db:"style"`
	Tags          []string       `json:"tags" db:"tags" gorm:"type:text[]"`
	Images        []string       `json:"images" db:"images" gorm:"type:text[]"`
	PrimaryImage  string         `json:"primary_image" db:"primary_image"`
	IsPublic      bool           `json:"is_public" db:"is_public" gorm:"default:false"`
	IsFavorite    bool           `json:"is_favorite" db:"is_favorite" gorm:"default:false"`
	WearCount     int            `json:"wear_count" db:"wear_count" gorm:"default:0"`
	LastWorn      *time.Time     `json:"last_worn" db:"last_worn"`
	Rating        *int           `json:"rating" db:"rating"` // 1-5 stars
	Weather       *string        `json:"weather" db:"weather"`
	Temperature   *float64       `json:"temperature" db:"temperature"` // Celsius
	Metadata      map[string]interface{} `json:"metadata" db:"metadata" gorm:"type:jsonb"`
}

// OutfitItem represents an item within an outfit
type OutfitItem struct {
	ID           uuid.UUID `json:"id" db:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	OutfitID     uuid.UUID `json:"outfit_id" db:"outfit_id"`
	WardrobeID   uuid.UUID `json:"wardrobe_id" db:"wardrobe_id"`
	Position     int       `json:"position" db:"position"` // Layer position
	Customizations map[string]interface{} `json:"customizations" db:"customizations" gorm:"type:jsonb"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
}

// OutfitSuggestion represents AI-generated outfit recommendations
type OutfitSuggestion struct {
	BaseModel
	UserID        uuid.UUID      `json:"user_id" db:"user_id"`
	Name          string         `json:"name" db:"name"`
	Occasion      string         `json:"occasion" db:"occasion"`
	Season        string         `json:"season" db:"season"`
	Weather       string         `json:"weather" db:"weather"`
	Temperature   float64        `json:"temperature" db:"temperature"`
	Items         []WardrobeItem `json:"items" gorm:"many2many:suggestion_items;"`
	Confidence    float64        `json:"confidence" db:"confidence"`
	Reason        string         `json:"reason" db:"reason"`
	Alternatives  []Outfit       `json:"alternatives"`
	IsAccepted    bool           `json:"is_accepted" db:"is_accepted"`
	AcceptedAt    *time.Time     `json:"accepted_at" db:"accepted_at"`
	ExpiresAt     time.Time      `json:"expires_at" db:"expires_at"`
}

// WardrobeStats represents user wardrobe statistics
type WardrobeStats struct {
	TotalItems        int                    `json:"total_items"`
	ItemsByCategory   map[string]int         `json:"items_by_category"`
	ItemsByColor      map[string]int         `json:"items_by_color"`
	ItemsByBrand      map[string]int         `json:"items_by_brand"`
	TotalValue        float64                `json:"total_value"`
	MostWornItems     []WardrobeItem         `json:"most_worn_items"`
	LeastWornItems    []WardrobeItem         `json:"least_worn_items"`
	FavoriteItems     []WardrobeItem         `json:"favorite_items"`
	RecentAdditions   []WardrobeItem         `json:"recent_additions"`
	CostPerWear       map[string]float64     `json:"cost_per_wear"`
	WardrobeHealth    WardrobeHealthMetrics  `json:"wardrobe_health"`
}

// WardrobeHealthMetrics represents wardrobe health analysis
type WardrobeHealthMetrics struct {
	VarietyScore    float64 `json:"variety_score"`    // 0-100
	UtilizationScore float64 `json:"utilization_score"` // 0-100
	QualityScore    float64 `json:"quality_score"`    // 0-100
	SustainabilityScore float64 `json:"sustainability_score"` // 0-100
	OverallScore    float64 `json:"overall_score"`    // 0-100
	Recommendations []string `json:"recommendations"`
}