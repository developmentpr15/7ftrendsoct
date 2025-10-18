-- Edge Functions Support Tables
-- These tables are needed for the Edge Functions to work properly

-- Weather cache table for daily outfit suggestions
CREATE TABLE IF NOT EXISTS weather_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location TEXT NOT NULL,
    weather_data JSONB NOT NULL,
    cached_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '2 hours'),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Outfit suggestions table
CREATE TABLE IF NOT EXISTS outfit_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    items JSONB NOT NULL,
    weather_data JSONB,
    occasion TEXT DEFAULT 'casual',
    style_tags TEXT[] DEFAULT '{}',
    confidence_score DECIMAL(3,2) DEFAULT 0.0,
    is_saved BOOLEAN DEFAULT FALSE,
    is_worn BOOLEAN DEFAULT FALSE,
    worn_date DATE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Competition leaderboards table
CREATE TABLE IF NOT EXISTS competition_leaderboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    placement INTEGER NOT NULL,
    score DECIMAL(5,2) NOT NULL,
    votes_received INTEGER DEFAULT 0,
    points_awarded INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(competition_id, user_id)
);

-- Trending summaries table
CREATE TABLE IF NOT EXISTS trending_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL UNIQUE,
    total_posts_processed INTEGER DEFAULT 0,
    posts_updated INTEGER DEFAULT 0,
    engagement_records_created INTEGER DEFAULT 0,
    trending_posts_count INTEGER DEFAULT 0,
    processing_time_ms INTEGER DEFAULT 0,
    top_trending_posts JSONB DEFAULT '[]',
    error_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily outfit suggestion summaries table
CREATE TABLE IF NOT EXISTS daily_suggestion_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL UNIQUE,
    total_users_processed INTEGER DEFAULT 0,
    suggestions_created INTEGER DEFAULT 0,
    users_with_suggestions INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0.0,
    processing_time_ms INTEGER DEFAULT 0,
    weather_distribution JSONB DEFAULT '{}',
    occasion_distribution JSONB DEFAULT '{}',
    popular_items JSONB DEFAULT '[]',
    error_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications table for user notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    is_seen BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Announcements table for public announcements
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_global BOOLEAN DEFAULT TRUE,
    target_audience TEXT[] DEFAULT '{}', -- User roles, countries, etc.
    metadata JSONB DEFAULT '{}',
    starts_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Post saves table for engagement tracking
CREATE TABLE IF NOT EXISTS post_saves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, post_id)
);

-- Additional columns for existing tables (if they don't exist)

-- Add columns to competitions table
DO $$
BEGIN
    -- Add finalization columns to competitions
    ALTER TABLE competitions ADD COLUMN IF NOT EXISTS finalized_at TIMESTAMPTZ;
    ALTER TABLE competitions ADD COLUMN IF NOT EXISTS total_participants INTEGER DEFAULT 0;
    ALTER TABLE competitions ADD COLUMN IF NOT EXISTS total_votes INTEGER DEFAULT 0;

    -- Add final placement columns to competition_entries
    ALTER TABLE competition_entries ADD COLUMN IF NOT EXISTS final_placement INTEGER;
    ALTER TABLE competition_entries ADD COLUMN IF NOT EXISTS final_points_awarded INTEGER DEFAULT 0;

EXCEPTION WHEN duplicate_column THEN
    NULL;
END $$;

-- Add engagement columns to posts if they don't exist
DO $$
BEGIN
    ALTER TABLE posts ADD COLUMN IF NOT EXISTS trending_score DECIMAL DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN
    NULL;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_weather_cache_location ON weather_cache(location);
CREATE INDEX IF NOT EXISTS idx_weather_cache_expires ON weather_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_outfit_suggestions_user ON outfit_suggestions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_outfit_suggestions_date ON outfit_suggestions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_competition_leaderboards_comp ON competition_leaderboards(competition_id, placement);
CREATE INDEX IF NOT EXISTS idx_competition_leaderboards_user ON competition_leaderboards(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trending_summaries_date ON trending_summaries(date);
CREATE INDEX IF NOT EXISTS idx_daily_suggestion_summaries_date ON daily_suggestion_summaries(date);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(is_active, starts_at, expires_at);
CREATE INDEX IF NOT EXISTS idx_post_saves_user ON post_saves(user_id, created_at DESC);

-- Grant permissions
GRANT ALL ON weather_cache TO authenticated;
GRANT ALL ON outfit_suggestions TO authenticated;
GRANT ALL ON competition_leaderboards TO authenticated;
GRANT ALL ON trending_summaries TO authenticated;
GRANT ALL ON daily_suggestion_summaries TO authenticated;
GRANT ALL ON notifications TO authenticated;
GRANT ALL ON announcements TO authenticated;
GRANT ALL ON post_saves TO authenticated;

-- Grant SELECT permissions to public for announcements
GRANT SELECT ON announcements TO anon, authenticated;

-- Function to cleanup old weather cache
CREATE OR REPLACE FUNCTION cleanup_weather_cache()
RETURNS VOID AS $$
BEGIN
    DELETE FROM weather_cache WHERE expires_at < NOW();
    RAISE NOTICE 'Cleaned up expired weather cache entries';
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup old notifications
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS VOID AS $$
BEGIN
    DELETE FROM notifications
    WHERE created_at < NOW() - INTERVAL '30 days'
    OR (expires_at IS NOT NULL AND expires_at < NOW());
    RAISE NOTICE 'Cleaned up old notifications';
END;
$$ LANGUAGE plpgsql;

-- Function to get user's notification count
CREATE OR REPLACE FUNCTION get_user_notification_count(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    notification_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO notification_count
    FROM notifications
    WHERE user_id = user_uuid
    AND is_read = FALSE
    AND (expires_at IS NULL OR expires_at > NOW());

    RETURN COALESCE(notification_count, 0);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Grant permissions for functions
GRANT EXECUTE ON FUNCTION cleanup_weather_cache TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_notifications TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_notification_count TO authenticated;

-- Create triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_outfit_suggestions_updated_at
    BEFORE UPDATE ON outfit_suggestions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trending_summaries_updated_at
    BEFORE UPDATE ON trending_summaries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_suggestion_summaries_updated_at
    BEFORE UPDATE ON daily_suggestion_summaries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at
    BEFORE UPDATE ON announcements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

RAISE NOTICE '✅ Edge Functions support tables created successfully';
RAISE NOTICE '📊 Tables: weather_cache, outfit_suggestions, competition_leaderboards, trending_summaries, daily_suggestion_summaries, notifications, announcements, post_saves';
RAISE NOTICE '🔧 Ready for Edge Functions deployment';