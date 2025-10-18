-- 7Ftrends Database Schema Migration
-- P0 Tables for Gamification and Engagement Tracking
-- Version: 1.0.0
-- Created: October 18, 2025

-- ============================================================================
-- POST ENGAGEMENT TABLE
-- For tracking detailed engagement metrics and trending score calculations
-- ============================================================================

CREATE TABLE IF NOT EXISTS post_engagement (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    engagement_type VARCHAR(20) NOT NULL CHECK (engagement_type IN ('like', 'comment', 'share', 'view', 'save', 'click')),
    engagement_value DECIMAL(3,2) DEFAULT 1.0, -- Weight value for the engagement
    metadata JSONB DEFAULT '{}', -- Additional data (e.g., comment length, share platform)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for post_engagement
CREATE INDEX IF NOT EXISTS idx_post_engagement_post_id ON post_engagement(post_id);
CREATE INDEX IF NOT EXISTS idx_post_engagement_user_id ON post_engagement(user_id);
CREATE INDEX IF NOT EXISTS idx_post_engagement_type ON post_engagement(engagement_type);
CREATE INDEX IF NOT EXISTS idx_post_engagement_created_at ON post_engagement(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_engagement_post_created ON post_engagement(post_id, created_at DESC);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_post_engagement_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER post_engagement_updated_at
    BEFORE UPDATE ON post_engagement
    FOR EACH ROW
    EXECUTE FUNCTION update_post_engagement_updated_at();

-- ============================================================================
-- COMPETITION ENTRIES TABLE
-- Links posts to competitions for participation tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS competition_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID REFERENCES posts(id) ON DELETE SET NULL, -- Optional post link
    title VARCHAR(200) NOT NULL,
    description TEXT,
    images JSONB DEFAULT '[]', -- Array of image URLs
    outfit_items JSONB DEFAULT '[]', -- Array of wardrobe items used
    style_tags TEXT[] DEFAULT '{}', -- Style tags for categorization
    votes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    average_score DECIMAL(3,2) DEFAULT 0.0,
    total_score DECIMAL(10,2) DEFAULT 0.0,
    status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('submitted', 'approved', 'rejected', 'featured', 'withdrawn')),
    is_featured BOOLEAN DEFAULT FALSE,
    featured_at TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES users(id),
    metadata JSONB DEFAULT '{}', -- Additional competition-specific data
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for competition_entries
CREATE INDEX IF NOT EXISTS idx_competition_entries_competition_id ON competition_entries(competition_id);
CREATE INDEX IF NOT EXISTS idx_competition_entries_participant_id ON competition_entries(participant_id);
CREATE INDEX IF NOT EXISTS idx_competition_entries_post_id ON competition_entries(post_id);
CREATE INDEX IF NOT EXISTS idx_competition_entries_status ON competition_entries(status);
CREATE INDEX IF NOT EXISTS idx_competition_entries_submitted_at ON competition_entries(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_competition_entries_votes ON competition_entries(votes_count DESC);
CREATE INDEX IF NOT EXISTS idx_competition_entries_score ON competition_entries(average_score DESC);
CREATE INDEX IF NOT EXISTS idx_competition_entries_featured ON competition_entries(is_featured, featured_at DESC);

-- Unique constraint: One entry per participant per competition
CREATE UNIQUE INDEX IF NOT EXISTS idx_competition_entries_unique
ON competition_entries(competition_id, participant_id)
WHERE status NOT IN ('withdrawn', 'rejected');

-- Trigger to update updated_at
CREATE TRIGGER competition_entries_updated_at
    BEFORE UPDATE ON competition_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_post_engagement_updated_at();

-- ============================================================================
-- VOTES TABLE
-- Competition voting system with detailed vote tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id UUID NOT NULL REFERENCES competition_entries(id) ON DELETE CASCADE,
    voter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    score INTEGER NOT NULL CHECK (score >= 1 AND score <= 10), -- 1-10 voting scale
    vote_type VARCHAR(20) DEFAULT 'public' CHECK (vote_type IN ('public', 'judge', 'admin')),
    feedback TEXT, -- Optional feedback comment
    criteria_scores JSONB DEFAULT '{}', -- Detailed scoring by criteria (e.g., creativity: 8, style: 7)
    is_anonymous BOOLEAN DEFAULT FALSE,
    ip_address INET, -- For vote verification
    user_agent TEXT, -- For fraud detection
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for votes
CREATE INDEX IF NOT EXISTS idx_votes_entry_id ON votes(entry_id);
CREATE INDEX IF NOT EXISTS idx_votes_voter_id ON votes(voter_id);
CREATE INDEX IF NOT EXISTS idx_votes_competition_id ON votes(competition_id);
CREATE INDEX IF NOT EXISTS idx_votes_score ON votes(score DESC);
CREATE INDEX IF NOT EXISTS idx_votes_type ON votes(vote_type);
CREATE INDEX IF NOT EXISTS idx_votes_created_at ON votes(created_at DESC);

-- Unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS idx_votes_unique_public
ON votes(entry_id, voter_id)
WHERE vote_type = 'public';

CREATE UNIQUE INDEX IF NOT EXISTS idx_votes_unique_judge
ON votes(entry_id, voter_id, vote_type)
WHERE vote_type IN ('judge', 'admin');

-- Trigger to update vote counts on competition_entries
CREATE OR REPLACE FUNCTION update_entry_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE competition_entries
        SET
            votes_count = (
                SELECT COUNT(*)
                FROM votes v
                WHERE v.entry_id = NEW.entry_id
            ),
            total_score = (
                SELECT COALESCE(SUM(v.score), 0)
                FROM votes v
                WHERE v.entry_id = NEW.entry_id
            ),
            average_score = (
                SELECT COALESCE(AVG(v.score), 0)
                FROM votes v
                WHERE v.entry_id = NEW.entry_id
            )
        WHERE id = NEW.entry_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE competition_entries
        SET
            votes_count = (
                SELECT COUNT(*)
                FROM votes v
                WHERE v.entry_id = OLD.entry_id
            ),
            total_score = (
                SELECT COALESCE(SUM(v.score), 0)
                FROM votes v
                WHERE v.entry_id = OLD.entry_id
            ),
            average_score = (
                SELECT COALESCE(AVG(v.score), 0)
                FROM votes v
                WHERE v.entry_id = OLD.entry_id
            )
        WHERE id = OLD.entry_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_entry_vote_counts
    AFTER INSERT OR UPDATE OR DELETE ON votes
    FOR EACH ROW
    EXECUTE FUNCTION update_entry_vote_counts();

-- Trigger to update updated_at
CREATE TRIGGER votes_updated_at
    BEFORE UPDATE ON votes
    FOR EACH ROW
    EXECUTE FUNCTION update_post_engagement_updated_at();

-- ============================================================================
-- POINTS TRANSACTIONS TABLE
-- Gamification point history and reward tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS points_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    transaction_type VARCHAR(30) NOT NULL CHECK (transaction_type IN (
        'post_like_received', 'post_comment_received', 'post_share_received',
        'competition_entry', 'competition_vote_received', 'competition_win',
        'daily_login', 'profile_complete', 'first_post', 'first_competition',
        'streak_bonus', 'quality_content', 'trending_post', 'featured_entry',
        'admin_reward', 'penalty', 'refund', 'bonus', 'milestone'
    )),
    points_amount INTEGER NOT NULL, -- Can be positive or negative
    reference_id UUID, -- Reference to related post, entry, etc.
    reference_type VARCHAR(20), -- 'post', 'competition_entry', 'competition', etc.
    description TEXT,
    metadata JSONB DEFAULT '{}', -- Additional transaction data
    balance_before INTEGER NOT NULL, -- User's balance before transaction
    balance_after INTEGER NOT NULL, -- User's balance after transaction
    expires_at TIMESTAMPTZ, -- Points expiration date
    is_expired BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for points_transactions
CREATE INDEX IF NOT EXISTS idx_points_transactions_user_id ON points_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_points_transactions_type ON points_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_points_transactions_created_at ON points_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_points_transactions_reference ON points_transactions(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_points_transactions_expires_at ON points_transactions(expires_at);

-- Function to update user points balance
CREATE OR REPLACE FUNCTION update_user_points_balance()
RETURNS TRIGGER AS $$
DECLARE
    current_balance INTEGER;
BEGIN
    -- Get current user balance
    SELECT COALESCE(SUM(points_amount), 0)
    INTO current_balance
    FROM points_transactions
    WHERE user_id = NEW.user_id
    AND (expires_at IS NULL OR expires_at > NOW())
    AND is_expired = FALSE;

    -- Update users table if it has points_balance column
    BEGIN
        UPDATE users
        SET points_balance = current_balance,
        updated_at = NOW()
        WHERE id = NEW.user_id;
    EXCEPTION WHEN undefined_column THEN
        -- Column doesn't exist, skip update
        NULL;
    END;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_points_balance
    AFTER INSERT OR UPDATE ON points_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_user_points_balance();

-- Trigger to update updated_at
CREATE TRIGGER points_transactions_updated_at
    BEFORE UPDATE ON points_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_post_engagement_updated_at();

-- ============================================================================
-- FEED SETTINGS TABLE
-- Tunable algorithm weights and feed configuration
-- ============================================================================

CREATE TABLE IF NOT EXISTS feed_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value DECIMAL(5,3) NOT NULL DEFAULT 1.0,
    setting_type VARCHAR(20) NOT NULL DEFAULT 'weight' CHECK (setting_type IN ('weight', 'threshold', 'limit', 'boolean')),
    category VARCHAR(50), -- 'algorithm', 'trending', 'competitions', 'user_preference'
    description TEXT,
    min_value DECIMAL(5,3),
    max_value DECIMAL(5,3),
    is_active BOOLEAN DEFAULT TRUE,
    requires_restart BOOLEAN DEFAULT FALSE, -- Whether app restart is required
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Default feed algorithm settings
INSERT INTO feed_settings (setting_key, setting_value, setting_type, category, description, min_value, max_value) VALUES
-- Feed composition weights (should sum to 1.0)
('mutual_friends_weight', 0.35, 'weight', 'algorithm', 'Weight for mutual friends posts in feed', 0.0, 1.0),
('following_weight', 0.25, 'weight', 'algorithm', 'Weight for following posts in feed', 0.0, 1.0),
('own_posts_weight', 0.10, 'weight', 'algorithm', 'Weight for user''s own posts in feed', 0.0, 1.0),
('trending_weight', 0.20, 'weight', 'algorithm', 'Weight for trending posts in feed', 0.0, 1.0),
('competitions_weight', 0.10, 'weight', 'algorithm', 'Weight for competition posts in feed', 0.0, 1.0),

-- Friendship boost multipliers
('mutual_friends_boost', 3.0, 'weight', 'algorithm', 'Visibility boost for mutual friends posts', 1.0, 10.0),
('following_boost', 1.5, 'weight', 'algorithm', 'Visibility boost for following posts', 1.0, 5.0),
('own_posts_boost', 2.0, 'weight', 'algorithm', 'Visibility boost for own posts', 1.0, 5.0),

-- Trending score settings
('trending_decay_hours', 72.0, 'threshold', 'trending', 'Hours for trending score decay', 1.0, 168.0),
('like_weight', 1.0, 'weight', 'trending', 'Weight for likes in trending calculation', 0.1, 10.0),
('comment_weight', 2.0, 'weight', 'trending', 'Weight for comments in trending calculation', 0.1, 10.0),
('share_weight', 3.0, 'weight', 'trending', 'Weight for shares in trending calculation', 0.1, 10.0),

-- Feed limits and thresholds
('feed_default_limit', 20.0, 'limit', 'algorithm', 'Default number of posts per feed load', 5.0, 100.0),
('feed_cache_minutes', 5.0, 'threshold', 'algorithm', 'Minutes to cache feed data', 1.0, 60.0),
('trending_post_age_hours', 168.0, 'threshold', 'trending', 'Maximum age for trending posts (hours)', 1.0, 720.0),

-- Competition settings
('competition_entry_score_boost', 1.5, 'weight', 'competitions', 'Boost for competition entries in feed', 1.0, 5.0),
('featured_entry_boost', 2.5, 'weight', 'competitions', 'Boost for featured competition entries', 1.0, 10.0),
('competition_voting_days', 14.0, 'threshold', 'competitions', 'Days competition entries accept votes', 1.0, 30.0)

ON CONFLICT (setting_key) DO NOTHING;

-- Indexes for feed_settings
CREATE INDEX IF NOT EXISTS idx_feed_settings_key ON feed_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_feed_settings_category ON feed_settings(category);
CREATE INDEX IF NOT EXISTS idx_feed_settings_active ON feed_settings(is_active);

-- Trigger to update updated_at
CREATE TRIGGER feed_settings_updated_at
    BEFORE UPDATE ON feed_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_post_engagement_updated_at();

-- ============================================================================
-- UTILITY FUNCTIONS
-- For the gamification and engagement system
-- ============================================================================

-- Function to get user's total points
CREATE OR REPLACE FUNCTION get_user_points_balance(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    total_points INTEGER;
BEGIN
    SELECT COALESCE(SUM(points_amount), 0)
    INTO total_points
    FROM points_transactions
    WHERE user_id = user_uuid
    AND (expires_at IS NULL OR expires_at > NOW())
    AND is_expired = FALSE;

    RETURN total_points;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to award points to user
CREATE OR REPLACE FUNCTION award_points_to_user(
    user_uuid UUID,
    points_amount INTEGER,
    transaction_type VARCHAR(30),
    reference_id UUID DEFAULT NULL,
    reference_type VARCHAR(20) DEFAULT NULL,
    description TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    transaction_id UUID;
    current_balance INTEGER;
BEGIN
    -- Get current balance
    current_balance := get_user_points_balance(user_uuid);

    -- Create transaction
    INSERT INTO points_transactions (
        user_id,
        transaction_type,
        points_amount,
        reference_id,
        reference_type,
        description,
        balance_before,
        balance_after
    ) VALUES (
        user_uuid,
        transaction_type,
        points_amount,
        reference_id,
        reference_type,
        description,
        current_balance,
        current_balance + points_amount
    ) RETURNING id INTO transaction_id;

    RETURN transaction_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get trending posts with real-time calculations
CREATE OR REPLACE FUNCTION get_trending_posts_with_engagement(
    limit_count INTEGER DEFAULT 20,
    offset_count INTEGER DEFAULT 0,
    hours_ago INTEGER DEFAULT 168
)
RETURNS TABLE(
    post_id UUID,
    author_id UUID,
    content TEXT,
    likes_count BIGINT,
    comments_count BIGINT,
    shares_count BIGINT,
    trending_score DECIMAL,
    total_engagement BIGINT,
    engagement_rate DECIMAL,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.author_id,
        p.content,
        COALESCE(p.likes_count, 0) as likes_count,
        COALESCE(p.comments_count, 0) as comments_count,
        COALESCE(p.shares_count, 0) as shares_count,
        calculate_trending_score(p.id) as trending_score,
        (COALESCE(p.likes_count, 0) + COALESCE(p.comments_count, 0) + COALESCE(p.shares_count, 0)) as total_engagement,
        CASE
            WHEN p.created_at > NOW() - INTERVAL '1 hour' THEN
                (COALESCE(p.likes_count, 0) + COALESCE(p.comments_count, 0) + COALESCE(p.shares_count, 0))::DECIMAL / 60
            ELSE
                (COALESCE(p.likes_count, 0) + COALESCE(p.comments_count, 0) + COALESCE(p.shares_count, 0))::DECIMAL /
                EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 3600
        END as engagement_rate,
        p.created_at
    FROM posts p
    WHERE p.visibility = 'public'
    AND NOT p.is_archived
    AND p.created_at >= NOW() - INTERVAL '1 hour' * hours_ago
    ORDER BY trending_score DESC, total_engagement DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get competition leaderboard with detailed scoring
CREATE OR REPLACE FUNCTION get_competition_leaderboard_with_scores(
    competition_uuid UUID,
    limit_count INTEGER DEFAULT 50,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE(
    entry_id UUID,
    participant_id UUID,
    participant_username TEXT,
    participant_avatar TEXT,
    entry_title VARCHAR(200),
    votes_count BIGINT,
    average_score DECIMAL,
    total_score DECIMAL,
    comments_count BIGINT,
    shares_count BIGINT,
    rank_position INTEGER,
    submitted_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ce.id as entry_id,
        ce.participant_id,
        u.username as participant_username,
        u.avatar_url as participant_avatar,
        ce.title as entry_title,
        ce.votes_count,
        ce.average_score,
        ce.total_score,
        ce.comments_count,
        ce.shares_count,
        ROW_NUMBER() OVER (ORDER BY ce.average_score DESC, ce.total_score DESC, ce.votes_count DESC) as rank_position,
        ce.submitted_at
    FROM competition_entries ce
    JOIN users u ON ce.participant_id = u.id
    WHERE ce.competition_id = competition_uuid
    AND ce.status IN ('submitted', 'approved', 'featured')
    ORDER BY ce.average_score DESC, ce.total_score DESC, ce.votes_count DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- MIGRATION COMPLETION
-- ============================================================================

-- Create migration log table
CREATE TABLE IF NOT EXISTS migration_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(100) NOT NULL,
    version VARCHAR(20) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('started', 'completed', 'failed', 'rolled_back')),
    tables_created TEXT[] DEFAULT '{}',
    indexes_created TEXT[] DEFAULT '{}',
    functions_created TEXT[] DEFAULT '{}',
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Log this migration
INSERT INTO migration_log (
    migration_name,
    version,
    description,
    status,
    tables_created,
    indexes_created,
    functions_created
) VALUES (
    'gamification_and_engagement_schema',
    '1.0.0',
    'P0 Tables for gamification and engagement tracking including post_engagement, competition_entries, votes, points_transactions, and feed_settings',
    'completed',
    ARRAY['post_engagement', 'competition_entries', 'votes', 'points_transactions', 'feed_settings', 'migration_log'],
    ARRAY[
        'idx_post_engagement_post_id', 'idx_post_engagement_user_id', 'idx_post_engagement_type',
        'idx_competition_entries_competition_id', 'idx_competition_entries_participant_id',
        'idx_votes_entry_id', 'idx_votes_voter_id', 'idx_points_transactions_user_id',
        'idx_feed_settings_key', 'idx_feed_settings_category'
    ],
    ARRAY[
        'update_post_engagement_updated_at', 'update_entry_vote_counts', 'update_user_points_balance',
        'get_user_points_balance', 'award_points_to_user', 'get_trending_posts_with_engagement',
        'get_competition_leaderboard_with_scores'
    ]
);

-- Grant permissions
GRANT ALL ON post_engagement TO authenticated;
GRANT ALL ON competition_entries TO authenticated;
GRANT ALL ON votes TO authenticated;
GRANT ALL ON points_transactions TO authenticated;
GRANT SELECT ON feed_settings TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Migration completed successfully
DO $$
BEGIN
    RAISE NOTICE '✅ Gamification and Engagement Schema Migration completed successfully!';
    RAISE NOTICE '📊 Created 5 P0 tables: post_engagement, competition_entries, votes, points_transactions, feed_settings';
    RAISE NOTICE '🔧 Created 20+ indexes for optimal performance';
    RAISE NOTICE '⚡ Created 7 utility functions for gamification features';
    RAISE NOTICE '🎮 Points system, voting system, and trending calculations are now ready';
    RAISE NOTICE '⚙️  Feed algorithm settings are configurable via feed_settings table';
END $$;