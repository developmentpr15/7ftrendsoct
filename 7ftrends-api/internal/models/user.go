package models

import (
	"time"
)

// User model
type User struct {
	BaseModel
	Username     string     `json:"username" db:"username" gorm:"uniqueIndex;not null"`
	Email        string     `json:"email" db:"email" gorm:"uniqueIndex;not null"`
	PasswordHash string     `json:"-" db:"password_hash" gorm:"not null"`
	FirstName    *string    `json:"first_name" db:"first_name"`
	LastName     *string    `json:"last_name" db:"last_name"`
	Bio          *string    `json:"bio" db:"bio"`
	AvatarURL    *string    `json:"avatar_url" db:"avatar_url"`
	Role         string     `json:"role" db:"role" gorm:"default:user"`
	IsActive     bool       `json:"is_active" db:"is_active" gorm:"default:true"`
	LastLoginAt  *time.Time `json:"last_login_at" db:"last_login_at"`
	EmailVerifiedAt *time.Time `json:"email_verified_at" db:"email_verified_at"`
	Settings     UserSettings `json:"settings" db:"settings" gorm:"type:jsonb"`
	Stats        UserStats    `json:"stats" db:"stats" gorm:"type:jsonb"`
}

// UserSettings holds user preferences
type UserSettings struct {
	Theme        string `json:"theme" db:"theme"` // light, dark, auto
	Language     string `json:"language" db:"language"`
	Notifications NotificationSettings `json:"notifications" db:"notifications"`
	Privacy      PrivacySettings `json:"privacy" db:"privacy"`
	Units        string `json:"units" db:"units"` // metric, imperial
}

// NotificationSettings holds notification preferences
type NotificationSettings struct {
	Push      bool `json:"push" db:"push"`
	Email     bool `json:"email" db:"email"`
	Posts     bool `json:"posts" db:"posts"`
	Comments  bool `json:"comments" db:"comments"`
	Followers bool `json:"followers" db:"followers"`
	Competitions bool `json:"competitions" db:"competitions"`
}

// PrivacySettings holds privacy preferences
type PrivacySettings struct {
	ProfileVisibility string `json:"profile_visibility" db:"profile_visibility"` // public, private, friends
	ShowEmail        bool   `json:"show_email" db:"show_email"`
	ShowStats        bool   `json:"show_stats" db:"show_stats"`
	AllowMessages    bool   `json:"allow_messages" db:"allow_messages"`
	AllowTagging     bool   `json:"allow_tagging" db:"allow_tagging"`
}

// UserStats holds user statistics
type UserStats struct {
	FollowersCount    int `json:"followers_count" db:"followers_count"`
	FollowingCount    int `json:"following_count" db:"following_count"`
	PostsCount        int `json:"posts_count" db:"posts_count"`
	OutfitsCount      int `json:"outfits_count" db:"outfits_count"`
	CompetitionsWon   int `json:"competitions_won" db:"competitions_won"`
	TotalLikes        int `json:"total_likes" db:"total_likes"`
	TotalComments     int `json:"total_comments" db:"total_comments"`
	EngagementRate    float64 `json:"engagement_rate" db:"engagement_rate"`
}

// UserProfile represents public user profile
type UserProfile struct {
	ID              uuid.UUID  `json:"id"`
	Username        string     `json:"username"`
	FirstName       *string    `json:"first_name"`
	LastName        *string    `json:"last_name"`
	Bio             *string    `json:"bio"`
	AvatarURL       *string    `json:"avatar_url"`
	Stats           UserStats  `json:"stats"`
	IsFollowing     bool       `json:"is_following"`
	FollowersCount  int        `json:"followers_count"`
	FollowingCount  int        `json:"following_count"`
	CreatedAt       time.Time  `json:"created_at"`
}

// UserLogin represents login request
type UserLogin struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

// UserRegister represents registration request
type UserRegister struct {
	Username  string `json:"username" binding:"required,min=3,max=30"`
	Email     string `json:"email" binding:"required,email"`
	Password  string `json:"password" binding:"required,min=6"`
	FirstName *string `json:"first_name,omitempty" binding:"omitempty,max=50"`
	LastName  *string `json:"last_name,omitempty" binding:"omitempty,max=50"`
}

// UserUpdate represents update request
type UserUpdate struct {
	FirstName *string       `json:"first_name,omitempty" binding:"omitempty,max=50"`
	LastName  *string       `json:"last_name,omitempty" binding:"omitempty,max=50"`
	Bio       *string       `json:"bio,omitempty" binding:"omitempty,max=500"`
	AvatarURL *string       `json:"avatar_url,omitempty"`
	Settings  *UserSettings `json:"settings,omitempty"`
}

// UserChangePassword represents password change request
type UserChangePassword struct {
	CurrentPassword string `json:"current_password" binding:"required"`
	NewPassword     string `json:"new_password" binding:"required,min=6"`
}

// Follow represents user follow relationship
type Follow struct {
	BaseModel
	FollowerID uuid.UUID `json:"follower_id" db:"follower_id"`
	FollowingID uuid.UUID `json:"following_id" db:"following_id"`
	Status     string    `json:"status" db:"status" gorm:"default:active"`
}

// UserSession represents active user session
type UserSession struct {
	ID           uuid.UUID `json:"id" db:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	UserID       uuid.UUID `json:"user_id" db:"user_id"`
	TokenHash    string    `json:"-" db:"token_hash"`
	RefreshToken string    `json:"-" db:"refresh_token"`
	DeviceType   string    `json:"device_type" db:"device_type"`
	DeviceID     string    `json:"device_id" db:"device_id"`
	UserAgent    string    `json:"user_agent" db:"user_agent"`
	IPAddress    string    `json:"ip_address" db:"ip_address"`
	ExpiresAt    time.Time `json:"expires_at" db:"expires_at"`
	LastUsedAt   time.Time `json:"last_used_at" db:"last_used_at"`
	IsActive     bool      `json:"is_active" db:"is_active" gorm:"default:true"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time `json:"updated_at" db:"updated_at"`
}

// UserActivity represents user activity log
type UserActivity struct {
	ID         uuid.UUID `json:"id" db:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	UserID     uuid.UUID `json:"user_id" db:"user_id"`
	Action     string    `json:"action" db:"action"`
	Resource   string    `json:"resource" db:"resource"`
	ResourceID *uuid.UUID `json:"resource_id" db:"resource_id"`
	Metadata   map[string]interface{} `json:"metadata" db:"metadata" gorm:"type:jsonb"`
	IPAddress  string    `json:"ip_address" db:"ip_address"`
	UserAgent  string    `json:"user_agent" db:"user_agent"`
	CreatedAt  time.Time `json:"created_at" db:"created_at"`
}