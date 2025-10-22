package database

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

const createVirtualTryonHistoryTable = `-- name: CreateVirtualTryonHistoryTable :exec
CREATE TABLE IF NOT EXISTS virtual_tryon_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_image_url TEXT NOT NULL,
  garment_image_url TEXT NOT NULL,
  composite_image_url TEXT,
  instructions TEXT NOT NULL,
  position TEXT NOT NULL DEFAULT 'full-body',
  fit TEXT NOT NULL DEFAULT 'regular',
  style TEXT NOT NULL DEFAULT 'realistic',
  confidence FLOAT,
  status TEXT NOT NULL DEFAULT 'pending',
  processing_time BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_virtual_tryon_history_user_id ON virtual_tryon_history(user_id);
CREATE INDEX IF NOT EXISTS idx_virtual_tryon_history_status ON virtual_tryon_history(status);
CREATE INDEX IF NOT EXISTS idx_virtual_tryon_history_created_at ON virtual_tryon_history(created_at);

-- RLS policies
ALTER TABLE virtual_tryon_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own history
CREATE POLICY "Users can view own virtual tryon history" ON virtual_tryon_history
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own history
CREATE POLICY "Users can insert own virtual tryon history" ON virtual_tryon_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own history
CREATE POLICY "Users can update own virtual tryon history" ON virtual_tryon_history
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own history
CREATE POLICY "Users can delete own virtual tryon history" ON virtual_tryon_history
  FOR DELETE USING (auth.uid() = user_id);
`

func (q *Queries) CreateVirtualTryonHistoryTable(ctx context.Context) error {
	_, err := q.db.Exec(ctx, createVirtualTryonHistoryTable)
	return err
}

const createVirtualTryonHistory = `-- name: CreateVirtualTryonHistory :one
INSERT INTO virtual_tryon_history (
  id, user_id, user_image_url, garment_image_url, composite_image_url,
  instructions, position, fit, style, confidence, status,
  processing_time, created_at
) VALUES (
  $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
)
RETURNING
  id, user_id, user_image_url, garment_image_url, composite_image_url,
  instructions, position, fit, style, confidence, status,
  processing_time, created_at, updated_at
`

type CreateVirtualTryonHistoryParams struct {
	ID                uuid.UUID
	UserID            uuid.UUID
	UserImageUrl      string
	GarmentImageUrl   string
	CompositeImageUrl pgtype.Text
	Instructions      string
	Position          string
	Fit               string
	Style             string
	Confidence        pgtype.Float8
	Status            string
	ProcessingTime    pgtype.Int8
	CreatedAt         time.Time
}

func (q *Queries) CreateVirtualTryonHistory(ctx context.Context, arg CreateVirtualTryonHistoryParams) (CreateVirtualTryonHistoryRow, error) {
	row := q.db.QueryRow(ctx, createVirtualTryonHistory,
		arg.ID,
		arg.UserID,
		arg.UserImageUrl,
		arg.GarmentImageUrl,
		arg.CompositeImageUrl,
		arg.Instructions,
		arg.Position,
		arg.Fit,
		arg.Style,
		arg.Confidence,
		arg.Status,
		arg.ProcessingTime,
		arg.CreatedAt,
	)
	var i CreateVirtualTryonHistoryRow
	err := row.Scan(
		&i.ID,
		&i.UserID,
		&i.UserImageUrl,
		&i.GarmentImageUrl,
		&i.CompositeImageUrl,
		&i.Instructions,
		&i.Position,
		&i.Fit,
		&i.Style,
		&i.Confidence,
		&i.Status,
		&i.ProcessingTime,
		&i.CreatedAt,
		&i.UpdatedAt,
	)
	return i, err
}

const getVirtualTryonHistory = `-- name: GetVirtualTryonHistory :many
SELECT
  id, user_id, user_image_url, garment_image_url, composite_image_url,
  instructions, position, fit, style, confidence, status,
  processing_time, created_at, updated_at
FROM virtual_tryon_history
WHERE user_id = $1
ORDER BY created_at DESC
LIMIT $2 OFFSET $3
`

type GetVirtualTryonHistoryParams struct {
	UserID uuid.UUID
	Limit  int32
	Offset int32
}

func (q *Queries) GetVirtualTryonHistory(ctx context.Context, arg GetVirtualTryonHistoryParams) ([]GetVirtualTryonHistoryRow, error) {
	rows, err := q.db.Query(ctx, getVirtualTryonHistory, arg.UserID, arg.Limit, arg.Offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []GetVirtualTryonHistoryRow
	for rows.Next() {
		var i GetVirtualTryonHistoryRow
		if err := rows.Scan(
			&i.ID,
			&i.UserID,
			&i.UserImageUrl,
			&i.GarmentImageUrl,
			&i.CompositeImageUrl,
			&i.Instructions,
			&i.Position,
			&i.Fit,
			&i.Style,
			&i.Confidence,
			&i.Status,
			&i.ProcessingTime,
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

const getVirtualTryonHistoryByID = `-- name: GetVirtualTryonHistoryByID :one
SELECT
  id, user_id, user_image_url, garment_image_url, composite_image_url,
  instructions, position, fit, style, confidence, status,
  processing_time, created_at, updated_at
FROM virtual_tryon_history
WHERE id = $1 AND user_id = $2
`

type GetVirtualTryonHistoryByIDParams struct {
	ID     uuid.UUID
	UserID uuid.UUID
}

func (q *Queries) GetVirtualTryonHistoryByID(ctx context.Context, arg GetVirtualTryonHistoryByIDParams) (GetVirtualTryonHistoryRow, error) {
	row := q.db.QueryRow(ctx, getVirtualTryonHistoryByID, arg.ID, arg.UserID)
	var i GetVirtualTryonHistoryRow
	err := row.Scan(
		&i.ID,
		&i.UserID,
		&i.UserImageUrl,
		&i.GarmentImageUrl,
		&i.CompositeImageUrl,
		&i.Instructions,
		&i.Position,
		&i.Fit,
		&i.Style,
		&i.Confidence,
		&i.Status,
		&i.ProcessingTime,
		&i.CreatedAt,
		&i.UpdatedAt,
	)
	return i, err
}

const deleteVirtualTryonHistory = `-- name: DeleteVirtualTryonHistory :exec
DELETE FROM virtual_tryon_history
WHERE id = $1 AND user_id = $2
RETURNING id, user_id
`

type DeleteVirtualTryonHistoryParams struct {
	ID     uuid.UUID
	UserID uuid.UUID
}

func (q *Queries) DeleteVirtualTryonHistory(ctx context.Context, arg DeleteVirtualTryonHistoryParams) error {
	_, err := q.db.Exec(ctx, deleteVirtualTryonHistory, arg.ID, arg.UserID)
	return err
}

const updateVirtualTryonHistory = `-- name: UpdateVirtualTryonHistory :one
UPDATE virtual_tryon_history SET
  composite_image_url = COALESCE($3, composite_image_url),
  confidence = COALESCE($4, confidence),
  status = COALESCE($5, status),
  processing_time = COALESCE($6, processing_time),
  updated_at = NOW()
WHERE id = $1 AND user_id = $2
RETURNING
  id, user_id, user_image_url, garment_image_url, composite_image_url,
  instructions, position, fit, style, confidence, status,
  processing_time, created_at, updated_at
`

type UpdateVirtualTryonHistoryParams struct {
	ID                uuid.UUID
	UserID            uuid.UUID
	CompositeImageUrl pgtype.Text
	Confidence        pgtype.Float8
	Status            string
	ProcessingTime    pgtype.Int8
}

func (q *Queries) UpdateVirtualTryonHistory(ctx context.Context, arg UpdateVirtualTryonHistoryParams) (GetVirtualTryonHistoryRow, error) {
	row := q.db.QueryRow(ctx, updateVirtualTryonHistory,
		arg.ID,
		arg.UserID,
		arg.CompositeImageUrl,
		arg.Confidence,
		arg.Status,
		arg.ProcessingTime,
	)
	var i GetVirtualTryonHistoryRow
	err := row.Scan(
		&i.ID,
		&i.UserID,
		&i.UserImageUrl,
		&i.GarmentImageUrl,
		&i.CompositeImageUrl,
		&i.Instructions,
		&i.Position,
		&i.Fit,
		&i.Style,
		&i.Confidence,
		&i.Status,
		&i.ProcessingTime,
		&i.CreatedAt,
		&i.UpdatedAt,
	)
	return i, err
}

const getVirtualTryonStats = `-- name: GetVirtualTryonStats :one
SELECT
  COUNT(*) as total_edits,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_edits,
  COALESCE(AVG(processing_time), 0) as average_processing_time,
  COUNT(CASE WHEN created_at >= date_trunc('month', CURRENT_DATE) THEN 1 END) as this_month_edits,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_edits,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_edits,
  COUNT(CASE WHEN confidence >= 0.8 THEN 1 END) as high_confidence_edits,
  COALESCE(AVG(CASE WHEN status = 'completed' THEN confidence END), 0) as avg_confidence
FROM virtual_tryon_history
WHERE user_id = $1
`

func (q *Queries) GetVirtualTryonStats(ctx context.Context, userID uuid.UUID) (GetVirtualTryonStatsRow, error) {
	row := q.db.QueryRow(ctx, getVirtualTryonStats, userID)
	var i GetVirtualTryonStatsRow
	err := row.Scan(
		&i.TotalEdits,
		&i.SuccessfulEdits,
		&i.AverageProcessingTime,
		&i.ThisMonthEdits,
		&i.PendingEdits,
		&i.FailedEdits,
		&i.HighConfidenceEdits,
		&i.AvgConfidence,
	)
	return i, err
}

// Cleanup old records (for maintenance)
const cleanupOldVirtualTryonHistory = `-- name: CleanupOldVirtualTryonHistory :exec
DELETE FROM virtual_tryon_history
WHERE created_at < NOW() - INTERVAL '90 days'
`

func (q *Queries) CleanupOldVirtualTryonHistory(ctx context.Context) error {
	_, err := q.db.Exec(ctx, cleanupOldVirtualTryonHistory)
	return err
}