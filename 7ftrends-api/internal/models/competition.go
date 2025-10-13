package models

import (
	"time"
)

// Competition represents a fashion competition
type Competition struct {
	BaseModel
	Title         string           `json:"title" db:"title" binding:"required,min=1,max=100"`
	Description   string           `json:"description" db:"description" binding:"required,min=1,max=2000"`
	Icon          string           `json:"icon" db:"icon"` // Emoji or icon name
	Banner        *string          `json:"banner" db:"banner"`
	Theme         string           `json:"theme" db:"theme"`
	Rules         []string         `json:"rules" db:"rules" gorm:"type:text[]"`
	Prizes        []Prize         `json:"prizes" db:"prizes" gorm:"type:jsonb"`
	Requirements  CompetitionRequirements `json:"requirements" db:"requirements" gorm:"type:jsonb"`
	StartDate     time.Time        `json:"start_date" db:"start_date"`
	EndDate       time.Time        `json:"end_date" db:"end_date"`
	JudgingStart  time.Time        `json:"judging_start" db:"judging_start"`
	JudgingEnd    time.Time        `json:"judging_end" db:"judging_end"`
	Status        string           `json:"status" db:"status" gorm:"default:upcoming"` // upcoming, active, judging, completed, cancelled
	MaxEntries    *int             `json:"max_entries" db:"max_entries"`
	EntryFee      *float64         `json:"entry_fee" db:"entry_fee"`
	Currency      *string          `json:"currency" db:"currency"`
	Judges        []CompetitionJudge `json:"judges" db:"judges" gorm:"type:jsonb"`
	Sponsors      []CompetitionSponsor `json:"sponsors" db:"sponsors" gorm:"type:jsonb"`
	Stats         CompetitionStats `json:"stats" db:"stats" gorm:"type:jsonb"`
	Settings      CompetitionSettings `json:"settings" db:"settings" gorm:"type:jsonb"`
	CreatedBy     uuid.UUID        `json:"created_by" db:"created_by"`
	IsPublic      bool             `json:"is_public" db:"is_public" gorm:"default:true"`
	IsFeatured    bool             `json:"is_featured" db:"is_featured" gorm:"default:false"`
	PublishedAt   *time.Time       `json:"published_at" db:"published_at"`
}

// Prize represents competition prizes
type Prize struct {
	Position int     `json:"position" db:"position"` // 1st, 2nd, 3rd, etc.
	Title    string  `json:"title" db:"title"`
	Description string `json:"description" db:"description"`
	Value    float64 `json:"value" db:"value"`
	Currency string  `json:"currency" db:"currency"`
	Image    *string `json:"image" db:"image"`
	Sponsor  *string `json:"sponsor" db:"sponsor"`
}

// CompetitionRequirements represents entry requirements
type CompetitionRequirements struct {
	MinOutfitItems     int      `json:"min_outfit_items" db:"min_outfit_items"`
	MaxOutfitItems     int      `json:"max_outfit_items" db:"max_outfit_items"`
	RequiredCategories []string `json:"required_categories" db:"required_categories"`
	ForbiddenCategories []string `json:"forbidden_categories" db:"forbidden_categories"`
	RequiredTags       []string `json:"required_tags" db:"required_tags"`
	ImageQuality       string   `json:"image_quality" db:"image_quality"` // low, medium, high
	MinImageResolution int      `json:"min_image_resolution" db:"min_image_resolution"`
	MaxImageSize       int64    `json:"max_image_size" db:"max_image_size"`
	AgeRestriction     *int     `json:"age_restriction" db:"age_restriction"`
	LocationRestriction []string `json:"location_restriction" db:"location_restriction"`
	OriginalWorkOnly   bool     `json:"original_work_only" db:"original_work_only"`
	ModelRelease       bool     `json:"model_release" db:"model_release"`
}

// CompetitionJudge represents competition judges
type CompetitionJudge struct {
	UserID      uuid.UUID `json:"user_id" db:"user_id"`
	Username    string    `json:"username" db:"username"`
	AvatarURL   *string   `json:"avatar_url" db:"avatar_url"`
	Bio         *string   `json:"bio" db:"bio"`
	Role        string    `json:"role" db:"role"` // head_judge, judge, guest_judge
	Expertise   []string  `json:"expertise" db:"expertise"`
	CompanyName *string   `json:"company_name" db:"company_name"`
	CompanyLogo *string   `json:"company_logo" db:"company_logo"`
}

// CompetitionSponsor represents competition sponsors
type CompetitionSponsor struct {
	ID          uuid.UUID `json:"id" db:"id"`
	Name        string    `json:"name" db:"name"`
	Logo        string    `json:"logo" db:"logo"`
	Website     *string   `json:"website" db:"website"`
	Description *string   `json:"description" db:"description"`
	Tier        string    `json:"tier" db:"tier"` // platinum, gold, silver, bronze
	Contribution float64  `json:"contribution" db:"contribution"`
	Currency    string    `json:"currency" db:"currency"`
}

// CompetitionStats represents competition statistics
type CompetitionStats struct {
	TotalParticipants   int `json:"total_participants" db:"total_participants"`
	TotalEntries        int `json:"total_entries" db:"total_entries"`
	PendingEntries      int `json:"pending_entries" db:"pending_entries"`
	ApprovedEntries     int `json:"approved_entries" db:"approved_entries"`
	TotalVotes          int `json:"total_votes" db:"total_votes"`
	UniqueVoters        int `json:"unique_voters" db:"unique_voters"`
	AverageRating       float64 `json:"average_rating" db:"average_rating"`
	TotalViews          int `json:"total_views" db:"total_views"`
	SharesCount         int `json:"shares_count" db:"shares_count"`
}

// CompetitionSettings represents competition settings
type CompetitionSettings struct {
	AllowPublicVoting   bool `json:"allow_public_voting" db:"allow_public_voting"`
	VotingStartDelay    int  `json:"voting_start_delay" db:"voting_start_delay"` // Hours after entry
	MaxVotesPerUser     int  `json:"max_votes_per_user" db:"max_votes_per_user"`
	AllowSelfVoting     bool `json:"allow_self_voting" db:"allow_self_voting"`
	ShowResults         bool `json:"show_results" db:"show_results"`
	NotifyParticipants  bool `json:"notify_participants" db:"notify_participants"`
	AutoApproveEntries  bool `json:"auto_approve_entries" db:"auto_approve_entries"`
	EnableComments      bool `json:"enable_comments" db:"enable_comments"`
	ModerateComments    bool `json:"moderate_comments" db:"moderate_comments"`
}

// CompetitionEntry represents an entry in a competition
type CompetitionEntry struct {
	BaseModel
	CompetitionID uuid.UUID            `json:"competition_id" db:"competition_id"`
	UserID        uuid.UUID            `json:"user_id" db:"user_id"`
	OutfitID      uuid.UUID            `json:"outfit_id" db:"outfit_id"`
	Title         string               `json:"title" db:"title" binding:"required,min=1,max=100"`
	Description   string               `json:"description" db:"description" binding:"required,min=1,max=2000"`
	Images        []EntryImage         `json:"images" db:"images" gorm:"foreignKey:EntryID"`
	Tags          []string             `json:"tags" db:"tags" gorm:"type:text[]"`
	SubmissionType string              `json:"submission_type" db:"submission_type"` // photo, video, outfit
	Status        string               `json:"status" db:"status" gorm:"default:submitted"` // submitted, under_review, approved, rejected, withdrawn
	RejectionReason *string            `json:"rejection_reason" db:"rejection_reason"`
	Stats         EntryStats           `json:"stats" db:"stats" gorm:"type:jsonb"`
	JudgeVotes    []JudgeVote          `json:"judge_votes" db:"judge_votes" gorm:"foreignKey:EntryID"`
	PublicVotes   []PublicVote         `json:"public_votes" db:"public_votes" gorm:"foreignKey:EntryID"`
	Comments      []CompetitionComment `json:"comments" db:"comments" gorm:"foreignKey:EntryID"`
	SubmittedAt   time.Time            `json:"submitted_at" db:"submitted_at"`
	ReviewedAt    *time.Time           `json:"reviewed_at" db:"reviewed_at"`
	ReviewedBy    *uuid.UUID           `json:"reviewed_by" db:"reviewed_by"`
	IsFeatured    bool                 `json:"is_featured" db:"is_featured" gorm:"default:false"`
	PrizeWon      *PrizeWon            `json:"prize_won,omitempty" db:"prize_won"`
}

// EntryImage represents images for competition entries
type EntryImage struct {
	BaseModel
	EntryID       uuid.UUID `json:"entry_id" db:"entry_id"`
	URL           string    `json:"url" db:"url"`
	ThumbnailURL  *string   `json:"thumbnail_url" db:"thumbnail_url"`
	Width         int       `json:"width" db:"width"`
	Height        int       `json:"height" db:"height"`
	FileSize      int64     `json:"file_size" db:"file_size"`
	MimeType      string    `json:"mime_type" db:"mime_type"`
	Position      int       `json:"position" db:"position"`
	Caption       *string   `json:"caption" db:"caption"`
	IsPrimary     bool      `json:"is_primary" db:"is_primary" gorm:"default:false"`
}

// EntryStats represents entry statistics
type EntryStats struct {
	VotesCount     int     `json:"votes_count" db:"votes_count"`
	JudgeScore     float64 `json:"judge_score" db:"judge_score"`
	PublicScore    float64 `json:"public_score" db:"public_score"`
	TotalScore     float64 `json:"total_score" db:"total_score"`
	ViewsCount     int     `json:"views_count" db:"views_count"`
	CommentsCount  int     `json:"comments_count" db:"comments_count"`
	SharesCount    int     `json:"shares_count" db:"shares_count"`
	LikesCount     int     `json:"likes_count" db:"likes_count"`
	AverageRating  float64 `json:"average_rating" db:"average_rating"`
	Rank           *int    `json:"rank" db:"rank"` // Final ranking
}

// JudgeVote represents votes from competition judges
type JudgeVote struct {
	BaseModel
	EntryID     uuid.UUID `json:"entry_id" db:"entry_id"`
	JudgeID     uuid.UUID `json:"judge_id" db:"judge_id"`
	Score       float64   `json:"score" db:"score"` // 0-10
	Comment     *string   `json:"comment" db:"comment"`
	Criteria    map[string]float64 `json:"criteria" db:"criteria" gorm:"type:jsonb"` // Specific criteria scores
	SubmittedAt time.Time `json:"submitted_at" db:"submitted_at"`
	IsFinal     bool      `json:"is_final" db:"is_final" gorm:"default:false"`
}

// PublicVote represents votes from the public
type PublicVote struct {
	BaseModel
	EntryID uuid.UUID `json:"entry_id" db:"entry_id"`
	UserID  uuid.UUID `json:"user_id" db:"user_id"`
	Score   int       `json:"score" db:"score"` // 1-5 stars
	VotedAt time.Time `json:"voted_at" db:"voted_at"`
}

// CompetitionComment represents comments on competition entries
type CompetitionComment struct {
	BaseModel
	EntryID    uuid.UUID  `json:"entry_id" db:"entry_id"`
	UserID     uuid.UUID  `json:"user_id" db:"user_id"`
	ParentID   *uuid.UUID `json:"parent_id" db:"parent_id"`
	Content    string     `json:"content" db:"content" binding:"required,min=1,max=1000"`
	IsEdited   bool       `json:"is_edited" db:"is_edited" gorm:"default:false"`
	EditedAt   *time.Time `json:"edited_at" db:"edited_at"`
	IsDeleted  bool       `json:"is_deleted" db:"is_deleted" gorm:"default:false"`
	DeletedAt  *time.Time `json:"deleted_at" db:"deleted_at"`
	CreatedAt  time.Time  `json:"created_at" db:"created_at"`
}

// PrizeWon represents prizes won by an entry
type PrizeWon struct {
	PrizeID    uuid.UUID `json:"prize_id" db:"prize_id"`
	PrizeTitle string    `json:"prize_title" db:"prize_title"`
	Position   int       `json:"position" db:"position"`
	Value      float64   `json:"value" db:"value"`
	Currency   string    `json:"currency" db:"currency"`
	AwardedAt  time.Time `json:"awarded_at" db:"awarded_at"`
}

// CompetitionRequest represents a competition creation request
type CompetitionRequest struct {
	Title        string                  `json:"title" binding:"required,min=1,max=100"`
	Description  string                  `json:"description" binding:"required,min=1,max=2000"`
	Icon         string                  `json:"icon"`
	Banner       *string                 `json:"banner"`
	Theme        string                  `json:"theme"`
	Rules        []string                `json:"rules"`
	Prizes       []Prize                 `json:"prizes"`
	Requirements CompetitionRequirements `json:"requirements"`
	StartDate    time.Time               `json:"start_date" binding:"required"`
	EndDate      time.Time               `json:"end_date" binding:"required"`
	JudgingStart time.Time               `json:"judging_start"`
	JudgingEnd   time.Time               `json:"judging_end"`
	MaxEntries   *int                    `json:"max_entries"`
	EntryFee     *float64                `json:"entry_fee"`
	Currency     *string                 `json:"currency"`
	Settings     CompetitionSettings     `json:"settings"`
}

// CompetitionUpdate represents a competition update request
type CompetitionUpdate struct {
	Title       *string                `json:"title,omitempty"`
	Description *string                `json:"description,omitempty"`
	Icon        *string                `json:"icon,omitempty"`
	Banner      *string                `json:"banner,omitempty"`
	Theme       *string                `json:"theme,omitempty"`
	Rules       []string               `json:"rules,omitempty"`
	Prizes      []Prize                `json:"prizes,omitempty"`
	Requirements *CompetitionRequirements `json:"requirements,omitempty"`
	StartDate   *time.Time             `json:"start_date,omitempty"`
	EndDate     *time.Time             `json:"end_date,omitempty"`
	Status      string                 `json:"status,omitempty" binding:"omitempty,oneof=upcoming active judging completed cancelled"`
	Settings    *CompetitionSettings   `json:"settings,omitempty"`
}

// CompetitionEntryRequest represents an entry creation request
type CompetitionEntryRequest struct {
	CompetitionID uuid.UUID `json:"competition_id" binding:"required"`
	OutfitID      uuid.UUID `json:"outfit_id" binding:"required"`
	Title         string    `json:"title" binding:"required,min=1,max=100"`
	Description   string    `json:"description" binding:"required,min=1,max=2000"`
	Images        []string  `json:"images" binding:"required,min=1,max=5"` // Base64 or URLs
	Tags          []string  `json:"tags"`
}

// VoteRequest represents a voting request
type VoteRequest struct {
	EntryID uuid.UUID `json:"entry_id" binding:"required"`
	Score   float64   `json:"score" binding:"required,min=0,max=10"`
	Comment *string   `json:"comment"`
	Criteria map[string]float64 `json:"criteria"`
}

// PublicVoteRequest represents a public voting request
type PublicVoteRequest struct {
	EntryID uuid.UUID `json:"entry_id" binding:"required"`
	Score   int       `json:"score" binding:"required,min=1,max=5"`
}