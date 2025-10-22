package database

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

// Competitions table queries
const createCompetition = `-- name: CreateCompetition :one
INSERT INTO competitions (
  id, country, title, theme, description, banner_image_url, rules,
  prize_pool, max_entries, start_at, end_at, voting_start_at, voting_end_at,
  status, judge_panel, created_by, created_at, updated_at
) VALUES (
  $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
)
RETURNING
  id, country, title, theme, description, banner_image_url, rules,
  prize_pool, max_entries, start_at, end_at, voting_start_at, voting_end_at,
  status, judge_panel, created_by, created_at, updated_at
`

type CreateCompetitionParams struct {
	ID              uuid.UUID
	Country         string
	Title           string
	Theme           pgtype.Text
	Description     pgtype.Text
	BannerImageUrl  pgtype.Text
	Rules           pgtype.Text
	PrizePool       []byte
	MaxEntries      pgtype.Int4
	StartAt         time.Time
	EndAt           time.Time
	VotingStartAt   pgtype.Timestamptz
	VotingEndAt     pgtype.Timestamptz
	Status          string
	JudgePanel      []byte
	CreatedBy       uuid.UUID
	CreatedAt       time.Time
	UpdatedAt       time.Time
}

func (q *Queries) CreateCompetition(ctx context.Context, arg CreateCompetitionParams) (CompetitionsRow, error) {
	row := q.db.QueryRow(ctx, createCompetition,
		arg.ID,
		arg.Country,
		arg.Title,
		arg.Theme,
		arg.Description,
		arg.BannerImageUrl,
		arg.Rules,
		arg.PrizePool,
		arg.MaxEntries,
		arg.StartAt,
		arg.EndAt,
		arg.VotingStartAt,
		arg.VotingEndAt,
		arg.Status,
		arg.JudgePanel,
		arg.CreatedBy,
		arg.CreatedAt,
		arg.UpdatedAt,
	)
	var i CompetitionsRow
	err := row.Scan(
		&i.ID,
		&i.Country,
		&i.Title,
		&i.Theme,
		&i.Description,
		&i.BannerImageUrl,
		&i.Rules,
		&i.PrizePool,
		&i.MaxEntries,
		&i.StartAt,
		&i.EndAt,
		&i.VotingStartAt,
		&i.VotingEndAt,
		&i.Status,
		&i.JudgePanel,
		&i.CreatedBy,
		&i.CreatedAt,
		&i.UpdatedAt,
	)
	return i, err
}

const getActiveCompetitions = `-- name: GetActiveCompetitions :many
SELECT
  id, country, title, theme, description, banner_image_url, prize_pool,
  start_at, end_at, voting_start_at, voting_end_at, status,
  created_by, created_at, updated_at
FROM competitions
WHERE status IN ('active', 'voting')
  AND start_at <= NOW()
  AND end_at >= NOW()
  AND ($1::text IS NULL OR country = $1)
ORDER BY end_at ASC
`

func (q *Queries) GetActiveCompetitions(ctx context.Context, country pgtype.Text) ([]CompetitionsRow, error) {
	rows, err := q.db.Query(ctx, getActiveCompetitions, country)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []CompetitionsRow
	for rows.Next() {
		var i CompetitionsRow
		if err := rows.Scan(
			&i.ID,
			&i.Country,
			&i.Title,
			&i.Theme,
			&i.Description,
			&i.BannerImageUrl,
			&i.PrizePool,
			&i.StartAt,
			&i.EndAt,
			&i.VotingStartAt,
			&i.VotingEndAt,
			&i.Status,
			&i.CreatedBy,
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

const getCompetitionByID = `-- name: GetCompetitionByID :one
SELECT
  id, country, title, theme, description, banner_image_url, rules,
  prize_pool, max_entries, start_at, end_at, voting_start_at, voting_end_at,
  status, judge_panel, created_by, created_at, updated_at
FROM competitions
WHERE id = $1
`

func (q *Queries) GetCompetitionByID(ctx context.Context, id uuid.UUID) (CompetitionsRow, error) {
	row := q.db.QueryRow(ctx, getCompetitionByID, id)
	var i CompetitionsRow
	err := row.Scan(
		&i.ID,
		&i.Country,
		&i.Title,
		&i.Theme,
		&i.Description,
		&i.BannerImageUrl,
		&i.Rules,
		&i.PrizePool,
		&i.MaxEntries,
		&i.StartAt,
		&i.EndAt,
		&i.VotingStartAt,
		&i.VotingEndAt,
		&i.Status,
		&i.JudgePanel,
		&i.CreatedBy,
		&i.CreatedAt,
		&i.UpdatedAt,
	)
	return i, err
}

const updateCompetitionStatus = `-- name: UpdateCompetitionStatus :one
UPDATE competitions
SET status = $2, updated_at = NOW()
WHERE id = $1
RETURNING
  id, country, title, theme, description, banner_image_url, rules,
  prize_pool, max_entries, start_at, end_at, voting_start_at, voting_end_at,
  status, judge_panel, created_by, created_at, updated_at
`

func (q *Queries) UpdateCompetitionStatus(ctx context.Context, arg UpdateCompetitionStatusParams) (CompetitionsRow, error) {
	row := q.db.QueryRow(ctx, updateCompetitionStatus, arg.ID, arg.Status)
	var i CompetitionsRow
	err := row.Scan(
		&i.ID,
		&i.Country,
		&i.Title,
		&i.Theme,
		&i.Description,
		&i.BannerImageUrl,
		&i.Rules,
		&i.PrizePool,
		&i.MaxEntries,
		&i.StartAt,
		&i.EndAt,
		&i.VotingStartAt,
		&i.VotingEndAt,
		&i.Status,
		&i.JudgePanel,
		&i.CreatedBy,
		&i.CreatedAt,
		&i.UpdatedAt,
	)
	return i, err
}

// Competition entries table queries
const createCompetitionEntry = `-- name: CreateCompetitionEntry :one
INSERT INTO competition_entries (
  id, user_id, competition_id, title, description, image_url, images,
  tags, status, submitted_at, created_at, updated_at
) VALUES (
  $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
)
RETURNING
  id, user_id, competition_id, title, description, image_url, images,
  tags, likes, votes_count, status, final_placement, final_points_awarded,
  submitted_at, judged_at, judged_by, judge_feedback, metadata, created_at, updated_at
`

type CreateCompetitionEntryParams struct {
	ID            uuid.UUID
	UserID        uuid.UUID
	CompetitionID uuid.UUID
	Title         string
	Description   pgtype.Text
	ImageUrl      string
	Images        []byte
	Tags          []byte
	Status        string
	SubmittedAt   time.Time
	CreatedAt     time.Time
	UpdatedAt     time.Time
}

func (q *Queries) CreateCompetitionEntry(ctx context.Context, arg CreateCompetitionEntryParams) (CompetitionEntriesRow, error) {
	row := q.db.QueryRow(ctx, createCompetitionEntry,
		arg.ID,
		arg.UserID,
		arg.CompetitionID,
		arg.Title,
		arg.Description,
		arg.ImageUrl,
		arg.Images,
		arg.Tags,
		arg.Status,
		arg.SubmittedAt,
		arg.CreatedAt,
		arg.UpdatedAt,
	)
	var i CompetitionEntriesRow
	err := row.Scan(
		&i.ID,
		&i.UserID,
		&i.CompetitionID,
		&i.Title,
		&i.Description,
		&i.ImageUrl,
		&i.Images,
		&i.Tags,
		&i.Likes,
		&i.VotesCount,
		&i.Status,
		&i.FinalPlacement,
		&i.FinalPointsAwarded,
		&i.SubmittedAt,
		&i.JudgedAt,
		&i.JudgedBy,
		&i.JudgeFeedback,
		&i.Metadata,
		&i.CreatedAt,
		&i.UpdatedAt,
	)
	return i, err
}

const getCompetitionEntries = `-- name: GetCompetitionEntries :many
SELECT
  ce.id, ce.user_id, ce.competition_id, ce.title, ce.description,
  ce.image_url, ce.images, ce.tags, ce.likes, ce.votes_count,
  ce.status, ce.submitted_at, ce.created_at,
  u.username, u.avatar_url
FROM competition_entries ce
JOIN auth.users u ON ce.user_id = u.id
WHERE ce.competition_id = $1
  AND ce.status IN ('submitted', 'approved', 'featured')
ORDER BY
  CASE
    WHEN $2 = 'votes_count' AND $3 = 'ASC' THEN ce.votes_count
    WHEN $2 = 'likes' AND $3 = 'ASC' THEN ce.likes
    WHEN $2 = 'submitted_at' AND $3 = 'ASC' THEN ce.submitted_at
    ELSE NULL
  END ASC,
  CASE
    WHEN $2 = 'votes_count' AND $3 = 'DESC' THEN ce.votes_count
    WHEN $2 = 'likes' AND $3 = 'DESC' THEN ce.likes
    WHEN $2 = 'submitted_at' AND $3 = 'DESC' THEN ce.submitted_at
    ELSE NULL
  END DESC,
  ce.submitted_at DESC
LIMIT $4 OFFSET $5
`

type GetCompetitionEntriesParams struct {
	CompetitionID uuid.UUID
	SortBy        string
	SortOrder     string
	Limit         int32
	Offset        int32
}

type GetCompetitionEntriesRow struct {
	ID            uuid.UUID
	UserID        uuid.UUID
	CompetitionID uuid.UUID
	Title         string
	Description   pgtype.Text
	ImageUrl      string
	Images        []byte
	Tags          []byte
	Likes         int32
	VotesCount    int32
	Status        string
	SubmittedAt   time.Time
	CreatedAt     time.Time
	Username      string
	AvatarUrl     pgtype.Text
}

func (q *Queries) GetCompetitionEntries(ctx context.Context, arg GetCompetitionEntriesParams) ([]GetCompetitionEntriesRow, error) {
	rows, err := q.db.Query(ctx, getCompetitionEntries,
		arg.CompetitionID,
		arg.SortBy,
		arg.SortOrder,
		arg.Limit,
		arg.Offset,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []GetCompetitionEntriesRow
	for rows.Next() {
		var i GetCompetitionEntriesRow
		if err := rows.Scan(
			&i.ID,
			&i.UserID,
			&i.CompetitionID,
			&i.Title,
			&i.Description,
			&i.ImageUrl,
			&i.Images,
			&i.Tags,
			&i.Likes,
			&i.VotesCount,
			&i.Status,
			&i.SubmittedAt,
			&i.CreatedAt,
			&i.Username,
			&i.AvatarUrl,
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

const getUserCompetitionEntries = `-- name: GetUserCompetitionEntries :many
SELECT
  id, user_id, competition_id, title, description, image_url, images,
  tags, likes, votes_count, status, final_placement, final_points_awarded,
  submitted_at, judged_at, judged_by, judge_feedback, metadata, created_at, updated_at
FROM competition_entries
WHERE user_id = $1
ORDER BY submitted_at DESC
LIMIT $2 OFFSET $3
`

type GetUserCompetitionEntriesParams struct {
	UserID uuid.UUID
	Limit  int32
	Offset int32
}

func (q *Queries) GetUserCompetitionEntries(ctx context.Context, arg GetUserCompetitionEntriesParams) ([]CompetitionEntriesRow, error) {
	rows, err := q.db.Query(ctx, getUserCompetitionEntries, arg.UserID, arg.Limit, arg.Offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []CompetitionEntriesRow
	for rows.Next() {
		var i CompetitionEntriesRow
		if err := rows.Scan(
			&i.ID,
			&i.UserID,
			&i.CompetitionID,
			&i.Title,
			&i.Description,
			&i.ImageUrl,
			&i.Images,
			&i.Tags,
			&i.Likes,
			&i.VotesCount,
			&i.Status,
			&i.FinalPlacement,
			&i.FinalPointsAwarded,
			&i.SubmittedAt,
			&i.JudgedAt,
			&i.JudgedBy,
			&i.JudgeFeedback,
			&i.Metadata,
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

const updateCompetitionEntryStatus = `-- name: UpdateCompetitionEntryStatus :one
UPDATE competition_entries
SET status = $2, updated_at = NOW()
WHERE id = $1 AND user_id = $3
RETURNING
  id, user_id, competition_id, title, description, image_url, images,
  tags, likes, votes_count, status, final_placement, final_points_awarded,
  submitted_at, judged_at, judged_by, judge_feedback, metadata, created_at, updated_at
`

type UpdateCompetitionEntryStatusParams struct {
	ID     uuid.UUID
	Status string
	UserID uuid.UUID
}

func (q *Queries) UpdateCompetitionEntryStatus(ctx context.Context, arg UpdateCompetitionEntryStatusParams) (CompetitionEntriesRow, error) {
	row := q.db.QueryRow(ctx, updateCompetitionEntryStatus, arg.ID, arg.Status, arg.UserID)
	var i CompetitionEntriesRow
	err := row.Scan(
		&i.ID,
		&i.UserID,
		&i.CompetitionID,
		&i.Title,
		&i.Description,
		&i.ImageUrl,
		&i.Images,
		&i.Tags,
		&i.Likes,
		&i.VotesCount,
		&i.Status,
		&i.FinalPlacement,
		&i.FinalPointsAwarded,
		&i.SubmittedAt,
		&i.JudgedAt,
		&i.JudgedBy,
		&i.JudgeFeedback,
		&i.Metadata,
		&i.CreatedAt,
		&i.UpdatedAt,
	)
	return i, err
}

const checkUserCompetitionEntry = `-- name: CheckUserCompetitionEntry :one
SELECT id, user_id, competition_id, title, description, image_url, images,
  tags, likes, votes_count, status, final_placement, final_points_awarded,
  submitted_at, judged_at, judged_by, judge_feedback, metadata, created_at, updated_at
FROM competition_entries
WHERE user_id = $1 AND competition_id = $2 AND status NOT IN ('withdrawn', 'rejected')
LIMIT 1
`

type CheckUserCompetitionEntryParams struct {
	UserID        uuid.UUID
	CompetitionID uuid.UUID
}

func (q *Queries) CheckUserCompetitionEntry(ctx context.Context, arg CheckUserCompetitionEntryParams) (CompetitionEntriesRow, error) {
	row := q.db.QueryRow(ctx, checkUserCompetitionEntry, arg.UserID, arg.CompetitionID)
	var i CompetitionEntriesRow
	err := row.Scan(
		&i.ID,
		&i.UserID,
		&i.CompetitionID,
		&i.Title,
		&i.Description,
		&i.ImageUrl,
		&i.Images,
		&i.Tags,
		&i.Likes,
		&i.VotesCount,
		&i.Status,
		&i.FinalPlacement,
		&i.FinalPointsAwarded,
		&i.SubmittedAt,
		&i.JudgedAt,
		&i.JudgedBy,
		&i.JudgeFeedback,
		&i.Metadata,
		&i.CreatedAt,
		&i.UpdatedAt,
	)
	return i, err
}