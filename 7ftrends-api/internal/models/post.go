package models

import (
	"time"
)

// Post represents a social media post
type Post struct {
	BaseModel
	UserID       uuid.UUID   `json:"user_id" db:"user_id"`
	Content      PostContent `json:"content" db:"content" gorm:"type:jsonb"`
	Media        []Media     `json:"media" db:"media" gorm:"foreignKey:PostID"`
	OutfitID     *uuid.UUID  `json:"outfit_id" db:"outfit_id"`
	Tags         []string    `json:"tags" db:"tags" gorm:"type:text[]"`
	Location     *Location   `json:"location" db:"location" gorm:"type:jsonb"`
	Status       string      `json:"status" db:"status" gorm:"default:draft"` // draft, published, archived
	Visibility   string      `json:"visibility" db:"visibility" gorm:"default:public"` // public, private, friends
	Stats        PostStats   `json:"stats" db:"stats" gorm:"type:jsonb"`
	IsPinned     bool        `json:"is_pinned" db:"is_pinned" gorm:"default:false"`
	PublishedAt  *time.Time  `json:"published_at" db:"published_at"`
}

// PostContent represents the text and metadata of a post
type PostContent struct {
	Text       string   `json:"text" db:"text"`
	Mentions   []string `json:"mentions" db:"mentions"   // User mentions
	Hashtags   []string `json:"hashtags" db:"hashtags"   // Hashtags without #
	Links      []string `json:"links" db:"links"`        // URLs in post
	Emojis     []string `json:"emojis" db:"emojis"`      // Emojis used
}

// Media represents attached media files
type Media struct {
	BaseModel
	PostID      uuid.UUID `json:"post_id" db:"post_id"`
	Type        string    `json:"type" db:"type"`                    // image, video
	URL         string    `json:"url" db:"url"`
	ThumbnailURL *string  `json:"thumbnail_url" db:"thumbnail_url"`
	Width       int       `json:"width" db:"width"`
	Height      int       `json:"height" db:"height"`
	FileSize    int64     `json:"file_size" db:"file_size"`
	MimeType    string    `json:"mime_type" db:"mime_type"`
	Duration    *int      `json:"duration" db:"duration"`             // For videos in seconds
	Position    int       `json:"position" db:"position"`             // Order in post
	Caption     *string   `json:"caption" db:"caption"`
	Metadata    map[string]interface{} `json:"metadata" db:"metadata" gorm:"type:jsonb"`
}

// Location represents geographical location
type Location struct {
	Name        string  `json:"name" db:"name"`
	Address     string  `json:"address" db:"address"`
	City        string  `json:"city" db:"city"`
	Country     string  `json:"country" db:"country"`
	Latitude    float64 `json:"latitude" db:"latitude"`
	Longitude   float64 `json:"longitude" db:"longitude"`
	PlaceID     string  `json:"place_id" db:"place_id"`
}

// PostStats represents post statistics
type PostStats struct {
	LikesCount    int `json:"likes_count" db:"likes_count"`
	CommentsCount int `json:"comments_count" db:"comments_count"`
	SharesCount   int `json:"shares_count" db:"shares_count"`
	ViewsCount    int `json:"views_count" db:"views_count"`
	SavesCount    int `json:"saves_count" db:"saves_count"`
}

// PostRequest represents a post creation request
type PostRequest struct {
	Content     PostContent `json:"content" binding:"required"`
	OutfitID    *uuid.UUID  `json:"outfit_id,omitempty"`
	Tags        []string    `json:"tags,omitempty"`
	Location    *Location   `json:"location,omitempty"`
	Visibility  string      `json:"visibility" binding:"omitempty,oneof=public private friends"`
	MediaFiles  []string    `json:"media_files,omitempty"` // Base64 encoded files or URLs
}

// PostUpdate represents a post update request
type PostUpdate struct {
	Content    *PostContent `json:"content,omitempty"`
	Tags       []string     `json:"tags,omitempty"`
	Location   *Location    `json:"location,omitempty"`
	Visibility string       `json:"visibility,omitempty" binding:"omitempty,oneof=public private friends"`
	Status     string       `json:"status,omitempty" binding:"omitempty,oneof=draft published archived"`
}

// PostResponse represents post response with additional data
type PostResponse struct {
	Post
	User      UserProfile      `json:"user"`
	Outfit    *Outfit          `json:"outfit,omitempty"`
	IsLiked   bool             `json:"is_liked"`
	IsSaved   bool             `json:"is_saved"`
	IsOwner   bool             `json:"is_owner"`
	Likers    []UserProfile    `json:"likers,omitempty"`
	Media     []Media          `json:"media"`
}

// Comment represents a comment on a post
type Comment struct {
	BaseModel
	PostID     uuid.UUID  `json:"post_id" db:"post_id"`
	UserID     uuid.UUID  `json:"user_id" db:"user_id"`
	ParentID   *uuid.UUID `json:"parent_id" db:"parent_id"` // For nested comments
	Content    string     `json:"content" db:"content" binding:"required,min=1,max=1000"`
	Mentions   []string   `json:"mentions" db:"mentions"`
	Hashtags   []string   `json:"hashtags" db:"hashtags"`
	IsEdited   bool       `json:"is_edited" db:"is_edited" gorm:"default:false"`
	EditedAt   *time.Time `json:"edited_at" db:"edited_at"`
	IsDeleted  bool       `json:"is_deleted" db:"is_deleted" gorm:"default:false"`
	DeletedAt  *time.Time `json:"deleted_at" db:"deleted_at"`
	Stats      CommentStats `json:"stats" db:"stats" gorm:"type:jsonb"`
	Replies    []Comment  `json:"replies,omitempty" gorm:"foreignKey:ParentID"`
}

// CommentStats represents comment statistics
type CommentStats struct {
	LikesCount int `json:"likes_count" db:"likes_count"`
	RepliesCount int `json:"replies_count" db:"replies_count"`
}

// CommentRequest represents a comment creation request
type CommentRequest struct {
	PostID   uuid.UUID `json:"post_id" binding:"required"`
	ParentID *uuid.UUID `json:"parent_id,omitempty"`
	Content  string    `json:"content" binding:"required,min=1,max=1000"`
}

// CommentResponse represents comment response with user data
type CommentResponse struct {
	Comment
	User     UserProfile `json:"user"`
	IsLiked  bool        `json:"is_liked"`
	IsOwner  bool        `json:"is_owner"`
	Replies  []CommentResponse `json:"replies,omitempty"`
}

// Like represents a like on a post or comment
type Like struct {
	BaseModel
	UserID       uuid.UUID `json:"user_id" db:"user_id"`
	TargetType   string    `json:"target_type" db:"target_type"` // post, comment
	TargetID     uuid.UUID `json:"target_id" db:"target_id"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
}

// Save represents a saved post
type Save struct {
	BaseModel
	UserID    uuid.UUID `json:"user_id" db:"user_id"`
	PostID    uuid.UUID `json:"post_id" db:"post_id"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

// Share represents a shared post
type Share struct {
	BaseModel
	UserID    uuid.UUID `json:"user_id" db:"user_id"`
	PostID    uuid.UUID `json:"post_id" db:"post_id"`
	Platform  string    `json:"platform" db:"platform"` // instagram, facebook, twitter, etc.
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

// Story represents an ephemeral story
type Story struct {
	BaseModel
	UserID     uuid.UUID  `json:"user_id" db:"user_id"`
	Media      Media      `json:"media" gorm:"embedded"`
	Caption    *string    `json:"caption" db:"caption"`
	Links      []StoryLink `json:"links" db:"links" gorm:"type:jsonb"`
	Settings   StorySettings `json:"settings" db:"settings" gorm:"type:jsonb"`
	Stats      StoryStats `json:"stats" db:"stats" gorm:"type:jsonb"`
	ExpiresAt  time.Time  `json:"expires_at" db:"expires_at"`
	CreatedAt  time.Time  `json:"created_at" db:"created_at"`
}

// StoryLink represents links in stories
type StoryLink struct {
	URL   string `json:"url"`
	Title string `json:"title"`
	Icon  string `json:"icon"`
}

// StorySettings represents story privacy and interaction settings
type StorySettings struct {
	AllowReplies    bool `json:"allow_replies" db:"allow_replies"`
	AllowReactions  bool `json:"allow_reactions" db:"allow_reactions"`
	AllowSharing    bool `json:"allow_sharing" db:"allow_sharing"`
	HideViewCount   bool `json:"hide_view_count" db:"hide_view_count"`
}

// StoryStats represents story statistics
type StoryStats struct {
	ViewsCount   int `json:"views_count" db:"views_count"`
	RepliesCount int `json:"replies_count" db:"replies_count"`
	ReactionsCount int `json:"reactions_count" db:"reactions_count"`
	SharesCount int `json:"shares_count" db:"shares_count"`
}

// StoryView represents who viewed a story
type StoryView struct {
	ID        uuid.UUID `json:"id" db:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	StoryID   uuid.UUID `json:"story_id" db:"story_id"`
	UserID    uuid.UUID `json:"user_id" db:"user_id"`
	ViewedAt  time.Time `json:"viewed_at" db:"viewed_at"`
}

// Feed represents a user's social feed
type Feed struct {
	Posts      []PostResponse `json:"posts"`
	Pagination Pagination      `json:"pagination"`
	HasMore    bool           `json:"has_more"`
	NextCursor string         `json:"next_cursor,omitempty"`
}

// Trending represents trending content
type Trending struct {
	Hashtags    []TrendingHashtag `json:"hashtags"`
	Posts       []PostResponse    `json:"posts"`
	Users       []UserProfile     `json:"users"`
	Challenges  []Competition     `json:"challenges"`
	GeneratedAt time.Time         `json:"generated_at"`
}

// TrendingHashtag represents a trending hashtag
type TrendingHashtag struct {
	Tag       string `json:"tag"`
	Count     int    `json:"count"`
	Growth    float64 `json:"growth"` // Percentage growth
	Posts     []PostResponse `json:"posts,omitempty"`
}