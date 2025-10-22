package database

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

const getWardrobeItems = `-- name: GetWardrobeItems :many
SELECT
  id, user_id, name, description, category, subcategory, brand, color,
  secondary_colors, size, material, style, occasion, season, pattern,
  images, tags, purchase_date, purchase_price, purchase_location,
  care_instructions, is_favorite, is_available, is_clean, last_worn,
  wear_count, condition, quality_score, sustainability_score, metadata,
  ai_tags, ai_category, ai_colors, ai_occasions, ai_seasons, ai_style,
  ai_materials, ai_confidence, ai_processed_at, ai_status, ai_error_message,
  created_at, updated_at
FROM wardrobe_items
WHERE user_id = $1
  AND ($2::text IS NULL OR category = $2)
  AND ($3::text IS NULL OR color = $3)
  AND ($4::text IS NULL OR brand = $4)
  AND ($5::bool IS NULL OR is_favorite = $5)
  AND ($6::text IS NULL OR (
    LOWER(name) LIKE LOWER('%' || $6 || '%') OR
    LOWER(description) LIKE LOWER('%' || $6 || '%') OR
    LOWER(brand) LIKE LOWER('%' || $6 || '%') OR
    EXISTS (SELECT 1 FROM jsonb_array_elements_text(tags) WHERE value ILIKE '%' || $6 || '%')
  ))
ORDER BY created_at DESC
LIMIT $7 OFFSET $8
`

type GetWardrobeItemsParams struct {
	UserID     uuid.UUID
	Category   pgtype.Text
	Color      pgtype.Text
	Brand      pgtype.Text
	IsFavorite pgtype.Bool
	Search     pgtype.Text
	Limit      int32
	Offset     int32
}

func (q *Queries) GetWardrobeItems(ctx context.Context, arg GetWardrobeItemsParams) ([]GetWardrobeItemsRow, error) {
	rows, err := q.db.Query(ctx, getWardrobeItems,
		arg.UserID,
		arg.Category,
		arg.Color,
		arg.Brand,
		arg.IsFavorite,
		arg.Search,
		arg.Limit,
		arg.Offset,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []GetWardrobeItemsRow
	for rows.Next() {
		var i GetWardrobeItemsRow
		if err := rows.Scan(
			&i.ID,
			&i.UserID,
			&i.Name,
			&i.Description,
			&i.Category,
			&i.Subcategory,
			&i.Brand,
			&i.Color,
			&i.SecondaryColors,
			&i.Size,
			&i.Material,
			&i.Style,
			&i.Occasion,
			&i.Season,
			&i.Pattern,
			&i.Images,
			&i.Tags,
			&i.PurchaseDate,
			&i.PurchasePrice,
			&i.PurchaseLocation,
			&i.CareInstructions,
			&i.IsFavorite,
			&i.IsAvailable,
			&i.IsClean,
			&i.LastWorn,
			&i.WearCount,
			&i.Condition,
			&i.QualityScore,
			&i.SustainabilityScore,
			&i.Metadata,
			&i.AiTags,
			&i.AiCategory,
			&i.AiColors,
			&i.AiOccasions,
			&i.AiSeasons,
			&i.AiStyle,
			&i.AiMaterials,
			&i.AiConfidence,
			&i.AiProcessedAt,
			&i.AiStatus,
			&i.AiErrorMessage,
			&i.CreatedAt,
			&i.UpdatedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

const getWardrobeItemsCount = `-- name: GetWardrobeItemsCount :one
SELECT COUNT(*)
FROM wardrobe_items
WHERE user_id = $1
  AND ($2::text IS NULL OR category = $2)
  AND ($3::text IS NULL OR color = $3)
  AND ($4::text IS NULL OR brand = $4)
  AND ($5::bool IS NULL OR is_favorite = $5)
  AND ($6::text IS NULL OR (
    LOWER(name) LIKE LOWER('%' || $6 || '%') OR
    LOWER(description) LIKE LOWER('%' || $6 || '%') OR
    LOWER(brand) LIKE LOWER('%' || $6 || '%') OR
    EXISTS (SELECT 1 FROM jsonb_array_elements_text(tags) WHERE value ILIKE '%' || $6 || '%')
  ))
`

type GetWardrobeItemsCountParams struct {
	UserID     uuid.UUID
	Category   pgtype.Text
	Color      pgtype.Text
	Brand      pgtype.Text
	IsFavorite pgtype.Bool
	Search     pgtype.Text
}

func (q *Queries) GetWardrobeItemsCount(ctx context.Context, arg GetWardrobeItemsCountParams) (int64, error) {
	var count int64
	err := q.db.QueryRow(ctx, getWardrobeItemsCount,
		arg.UserID,
		arg.Category,
		arg.Color,
		arg.Brand,
		arg.IsFavorite,
		arg.Search,
	).Scan(&count)
	return count, err
}

const getWardrobeItem = `-- name: GetWardrobeItem :one
SELECT
  id, user_id, name, description, category, subcategory, brand, color,
  secondary_colors, size, material, style, occasion, season, pattern,
  images, tags, purchase_date, purchase_price, purchase_location,
  care_instructions, is_favorite, is_available, is_clean, last_worn,
  wear_count, condition, quality_score, sustainability_score, metadata,
  ai_tags, ai_category, ai_colors, ai_occasions, ai_seasons, ai_style,
  ai_materials, ai_confidence, ai_processed_at, ai_status, ai_error_message,
  created_at, updated_at
FROM wardrobe_items
WHERE id = $1 AND user_id = $2
`

type GetWardrobeItemParams struct {
	ID     uuid.UUID
	UserID uuid.UUID
}

func (q *Queries) GetWardrobeItem(ctx context.Context, arg GetWardrobeItemParams) (GetWardrobeItemsRow, error) {
	var i GetWardrobeItemsRow
	err := q.db.QueryRow(ctx, getWardrobeItem, arg.ID, arg.UserID).Scan(
		&i.ID,
		&i.UserID,
		&i.Name,
		&i.Description,
		&i.Category,
		&i.Subcategory,
		&i.Brand,
		&i.Color,
		&i.SecondaryColors,
		&i.Size,
		&i.Material,
		&i.Style,
		&i.Occasion,
		&i.Season,
		&i.Pattern,
		&i.Images,
		&i.Tags,
		&i.PurchaseDate,
		&i.PurchasePrice,
		&i.PurchaseLocation,
		&i.CareInstructions,
		&i.IsFavorite,
		&i.IsAvailable,
		&i.IsClean,
		&i.LastWorn,
		&i.WearCount,
		&i.Condition,
		&i.QualityScore,
		&i.SustainabilityScore,
		&i.Metadata,
		&i.AiTags,
		&i.AiCategory,
		&i.AiColors,
		&i.AiOccasions,
		&i.AiSeasons,
		&i.AiStyle,
		&i.AiMaterials,
		&i.AiConfidence,
		&i.AiProcessedAt,
		&i.AiStatus,
		&i.AiErrorMessage,
		&i.CreatedAt,
		&i.UpdatedAt,
	)
	return i, err
}

const createWardrobeItem = `-- name: CreateWardrobeItem :one
INSERT INTO wardrobe_items (
  id, user_id, name, description, category, subcategory, brand, color,
  secondary_colors, size, material, style, occasion, season, pattern,
  images, tags, purchase_date, purchase_price, purchase_location,
  care_instructions, is_favorite, is_available, is_clean, wear_count,
  condition, quality_score, sustainability_score, metadata,
  ai_tags, ai_category, ai_colors, ai_occasions, ai_seasons, ai_style,
  ai_materials, ai_confidence, ai_processed_at, ai_status, ai_error_message,
  created_at, updated_at
) VALUES (
  $1, $2, $3, $4, $5, $6, $7, $8,
  $9, $10, $11, $12, $13, $14, $15,
  $16, $17, $18, $19, $20,
  $21, $22, $23, $24, $25,
  $26, $27, $28, $29, $30,
  $31, $32, $33, $34, $35, $36,
  $37, $38, $39, $40, $41,
  $42, $43, $44, $45
)
RETURNING
  id, user_id, name, description, category, subcategory, brand, color,
  secondary_colors, size, material, style, occasion, season, pattern,
  images, tags, purchase_date, purchase_price, purchase_location,
  care_instructions, is_favorite, is_available, is_clean, last_worn,
  wear_count, condition, quality_score, sustainability_score, metadata,
  ai_tags, ai_category, ai_colors, ai_occasions, ai_seasons, ai_style,
  ai_materials, ai_confidence, ai_processed_at, ai_status, ai_error_message,
  created_at, updated_at
`

type CreateWardrobeItemParams struct {
	ID                   uuid.UUID
	UserID               uuid.UUID
	Name                 string
	Description          pgtype.Text
	Category             string
	Subcategory          pgtype.Text
	Brand                pgtype.Text
	Color                string
	SecondaryColors      []byte
	Size                 pgtype.Text
	Material             pgtype.Text
	Style                pgtype.Text
	Occasion             []byte
	Season               []byte
	Pattern              pgtype.Text
	Images               []byte
	Tags                 []byte
	PurchaseDate         pgtype.Timestamptz
	PurchasePrice        pgtype.Float8
	PurchaseLocation     pgtype.Text
	CareInstructions     []byte
	IsFavorite           bool
	IsAvailable          bool
	IsClean              bool
	WearCount            int32
	Condition            string
	QualityScore         int32
	SustainabilityScore  pgtype.Int4
	Metadata             []byte
	AITags               []byte
	AICategory           pgtype.Text
	AIColors              []byte
	AIOccasions          []byte
	AISeasons            []byte
	AIStyle              pgtype.Text
	AIMaterials          []byte
	AIConfidence         pgtype.Float8
	AIProcessedAt        pgtype.Timestamptz
	AIStatus             pgtype.Text
	AIErrorMessage       pgtype.Text
	CreatedAt            time.Time
	UpdatedAt            time.Time
}

func (q *Queries) CreateWardrobeItem(ctx context.Context, arg CreateWardrobeItemParams) (GetWardrobeItemsRow, error) {
	var i GetWardrobeItemsRow
	err := q.db.QueryRow(ctx, createWardrobeItem,
		arg.ID,
		arg.UserID,
		arg.Name,
		arg.Description,
		arg.Category,
		arg.Subcategory,
		arg.Brand,
		arg.Color,
		arg.SecondaryColors,
		arg.Size,
		arg.Material,
		arg.Style,
		arg.Occasion,
		arg.Season,
		arg.Pattern,
		arg.Images,
		arg.Tags,
		arg.PurchaseDate,
		arg.PurchasePrice,
		arg.PurchaseLocation,
		arg.CareInstructions,
		arg.IsFavorite,
		arg.IsAvailable,
		arg.IsClean,
		arg.WearCount,
		arg.Condition,
		arg.QualityScore,
		arg.SustainabilityScore,
		arg.Metadata,
		arg.AiTags,
		arg.AiCategory,
		arg.AiColors,
		arg.AiOccasions,
		arg.AiSeasons,
		arg.AiStyle,
		arg.AiMaterials,
		arg.AiConfidence,
		arg.AiProcessedAt,
		arg.AiStatus,
		arg.AiErrorMessage,
		arg.CreatedAt,
		arg.UpdatedAt,
	).Scan(
		&i.ID,
		&i.UserID,
		&i.Name,
		&i.Description,
		&i.Category,
		&i.Subcategory,
		&i.Brand,
		&i.Color,
		&i.SecondaryColors,
		&i.Size,
		&i.Material,
		&i.Style,
		&i.Occasion,
		&i.Season,
		&i.Pattern,
		&i.Images,
		&i.Tags,
		&i.PurchaseDate,
		&i.PurchasePrice,
		&i.PurchaseLocation,
		&i.CareInstructions,
		&i.IsFavorite,
		&i.IsAvailable,
		&i.IsClean,
		&i.LastWorn,
		&i.WearCount,
		&i.Condition,
		&i.QualityScore,
		&i.SustainabilityScore,
		&i.Metadata,
		&i.AiTags,
		&i.AiCategory,
		&i.AiColors,
		&i.AiOccasions,
		&i.AiSeasons,
		&i.AiStyle,
		&i.AiMaterials,
		&i.AiConfidence,
		&i.AiProcessedAt,
		&i.AiStatus,
		&i.AiErrorMessage,
		&i.CreatedAt,
		&i.UpdatedAt,
	)
	return i, err
}

const updateWardrobeItem = `-- name: UpdateWardrobeItem :one
UPDATE wardrobe_items SET
  name = COALESCE($3, name),
  description = COALESCE($4, description),
  category = COALESCE($5, category),
  subcategory = COALESCE($6, subcategory),
  brand = COALESCE($7, brand),
  color = COALESCE($8, color),
  secondary_colors = COALESCE($9, secondary_colors),
  size = COALESCE($10, size),
  material = COALESCE($11, material),
  style = COALESCE($12, style),
  occasion = COALESCE($13, occasion),
  season = COALESCE($14, season),
  pattern = COALESCE($15, pattern),
  images = COALESCE($16, images),
  tags = COALESCE($17, tags),
  purchase_date = COALESCE($18, purchase_date),
  purchase_price = COALESCE($19, purchase_price),
  purchase_location = COALESCE($20, purchase_location),
  care_instructions = COALESCE($21, care_instructions),
  is_favorite = COALESCE($22, is_favorite),
  is_available = COALESCE($23, is_available),
  is_clean = COALESCE($24, is_clean),
  wear_count = COALESCE($25, wear_count),
  condition = COALESCE($26, condition),
  quality_score = COALESCE($27, quality_score),
  sustainability_score = COALESCE($28, sustainability_score),
  metadata = COALESCE($29, metadata),
  updated_at = $30
WHERE id = $1 AND user_id = $2
RETURNING
  id, user_id, name, description, category, subcategory, brand, color,
  secondary_colors, size, material, style, occasion, season, pattern,
  images, tags, purchase_date, purchase_price, purchase_location,
  care_instructions, is_favorite, is_available, is_clean, last_worn,
  wear_count, condition, quality_score, sustainability_score, metadata,
  ai_tags, ai_category, ai_colors, ai_occasions, ai_seasons, ai_style,
  ai_materials, ai_confidence, ai_processed_at, ai_status, ai_error_message,
  created_at, updated_at
`

type UpdateWardrobeItemParams struct {
	ID                   uuid.UUID
	UserID               uuid.UUID
	Name                 string
	Description          pgtype.Text
	Category             string
	Subcategory          pgtype.Text
	Brand                pgtype.Text
	Color                string
	SecondaryColors      []byte
	Size                 pgtype.Text
	Material             pgtype.Text
	Style                pgtype.Text
	Occasion             []byte
	Season               []byte
	Pattern              pgtype.Text
	Images               []byte
	Tags                 []byte
	PurchaseDate         pgtype.Timestamptz
	PurchasePrice        pgtype.Float8
	PurchaseLocation     pgtype.Text
	CareInstructions     []byte
	IsFavorite           bool
	IsAvailable          bool
	IsClean              bool
	WearCount            int32
	Condition            string
	QualityScore         int32
	SustainabilityScore  pgtype.Int4
	Metadata             []byte
	UpdatedAt            time.Time
}

func (q *Queries) UpdateWardrobeItem(ctx context.Context, arg UpdateWardrobeItemParams) (GetWardrobeItemsRow, error) {
	var i GetWardrobeItemsRow
	err := q.db.QueryRow(ctx, updateWardrobeItem,
		arg.ID,
		arg.UserID,
		arg.Name,
		arg.Description,
		arg.Category,
		arg.Subcategory,
		arg.Brand,
		arg.Color,
		arg.SecondaryColors,
		arg.Size,
		arg.Material,
		arg.Style,
		arg.Occasion,
		arg.Season,
		arg.Pattern,
		arg.Images,
		arg.Tags,
		arg.PurchaseDate,
		arg.PurchasePrice,
		arg.PurchaseLocation,
		arg.CareInstructions,
		arg.IsFavorite,
		arg.IsAvailable,
		arg.IsClean,
		arg.WearCount,
		arg.Condition,
		arg.QualityScore,
		arg.SustainabilityScore,
		arg.Metadata,
		arg.UpdatedAt,
	).Scan(
		&i.ID,
		&i.UserID,
		&i.Name,
		&i.Description,
		&i.Category,
		&i.Subcategory,
		&i.Brand,
		&i.Color,
		&i.SecondaryColors,
		&i.Size,
		&i.Material,
		&i.Style,
		&i.Occasion,
		&i.Season,
		&i.Pattern,
		&i.Images,
		&i.Tags,
		&i.PurchaseDate,
		&i.PurchasePrice,
		&i.PurchaseLocation,
		&i.CareInstructions,
		&i.IsFavorite,
		&i.IsAvailable,
		&i.IsClean,
		&i.LastWorn,
		&i.WearCount,
		&i.Condition,
		&i.QualityScore,
		&i.SustainabilityScore,
		&i.Metadata,
		&i.AiTags,
		&i.AiCategory,
		&i.AiColors,
		&i.AiOccasions,
		&i.AiSeasons,
		&i.AiStyle,
		&i.AiMaterials,
		&i.AiConfidence,
		&i.AiProcessedAt,
		&i.AiStatus,
		&i.AiErrorMessage,
		&i.CreatedAt,
		&i.UpdatedAt,
	)
	return i, err
}

const deleteWardrobeItem = `-- name: DeleteWardrobeItem :exec
DELETE FROM wardrobe_items
WHERE id = $1 AND user_id = $2
`

type DeleteWardrobeItemParams struct {
	ID     uuid.UUID
	UserID uuid.UUID
}

func (q *Queries) DeleteWardrobeItem(ctx context.Context, arg DeleteWardrobeItemParams) error {
	_, err := q.db.Exec(ctx, deleteWardrobeItem, arg.ID, arg.UserID)
	return err
}

const getWardrobeStats = `-- name: GetWardrobeStats :one
SELECT
  COUNT(*) as total_items,
  COUNT(CASE WHEN is_favorite = true THEN 1 END) as favorite_items,
  COUNT(CASE WHEN is_available = true THEN 1 END) as available_items,
  COUNT(CASE WHEN is_clean = true THEN 1 END) as clean_items,
  SUM(wear_count) as total_wears,
  AVG(quality_score) as avg_quality_score,
  category,
  COUNT(*) as count_by_category
FROM wardrobe_items
WHERE user_id = $1
GROUP BY category
ORDER BY count_by_category DESC
`

func (q *Queries) GetWardrobeStats(ctx context.Context, userID uuid.UUID) ([]GetWardrobeStatsRow, error) {
	rows, err := q.db.Query(ctx, getWardrobeStats, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []GetWardrobeStatsRow
	for rows.Next() {
		var i GetWardrobeStatsRow
		if err := rows.Scan(
			&i.TotalItems,
			&i.FavoriteItems,
			&i.AvailableItems,
			&i.CleanItems,
			&i.TotalWears,
			&i.AvgQualityScore,
			&i.Category,
			&i.CountByCategory,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}