-- Cursor-Based Pagination for Feed
-- Implements efficient feed fetching with performance optimizations

-- Enhanced feed function with cursor-based pagination
CREATE OR REPLACE FUNCTION get_paginated_feed(
    p_user_id UUID,
    p_cursor TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_limit INTEGER DEFAULT 10,
    p_feed_type TEXT DEFAULT 'all',
    p_filters JSONB DEFAULT '{}'
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    username TEXT,
    avatar_url TEXT,
    content TEXT,
    image_url TEXT,
    blurhash TEXT,
    likes_count BIGINT,
    comments_count BIGINT,
    shares_count BIGINT,
    is_liked BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    feed_type TEXT,
    relationship_status TEXT,
    cache_key TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_feed_score FLOAT;
    v_friend_ids UUID[];
    v_country_code TEXT;
    v_pagination_key TEXT;
BEGIN
    -- Get user's friends (mutual follows)
    SELECT ARRAY_AGG(following_id) INTO v_friend_ids
    FROM get_mutual_friends(p_user_id);

    -- Get user's country for regional content
    SELECT country INTO v_country_code
    FROM profiles
    WHERE user_id = p_user_id;

    -- Generate cache key for this pagination request
    v_pagination_key := COALESCE(p_cursor::TEXT, 'start') || '_' || p_limit || '_' || p_feed_type || '_' || COALESCE(p_user_id::TEXT, 'anonymous');

    -- Return paginated feed with cursor-based navigation
    RETURN QUERY
    SELECT
        p.id,
        p.user_id,
        COALESCE(u.username, u2.username) as username,
        COALESCE(u.avatar_url, u2.avatar_url) as avatar_url,
        p.content,
        p.image_url,
        p.blurhash,
        p.likes_count,
        p.comments_count,
        p.shares_count,
        EXISTS(
            SELECT 1 FROM likes l
            WHERE l.post_id = p.id AND l.user_id = p_user_id
        ) as is_liked,
        p.created_at,
        CASE
            -- Competition posts
            WHEN p.competition_id IS NOT NULL THEN 'competition'
            -- Friends' posts (mutual follows)
            WHEN p.user_id = ANY(v_friend_ids) THEN 'mutual_friend'
            -- Following posts (one-way follows)
            WHEN p.user_id IN (
                SELECT following_id FROM follows
                WHERE follower_id = p_user_id
            ) THEN 'following'
            -- Regional posts (same country)
            WHEN u.country = v_country_code THEN 'regional'
            -- Trending posts (high engagement)
            WHEN p.likes_count + p.comments_count + p.shares_count > 20 THEN 'trending'
            ELSE 'general'
        END as feed_type,
        CASE
            WHEN p.user_id = ANY(v_friend_ids) THEN 'friend'
            WHEN p.user_id IN (
                SELECT following_id FROM follows
                WHERE follower_id = p_user_id
            ) THEN 'following'
            ELSE 'other'
        END as relationship_status,
        v_pagination_key
    FROM posts p
    -- Join with user profiles for additional info
    LEFT JOIN profiles u ON p.user_id = u.user_id
    LEFT JOIN auth.users u2 ON p.user_id = u2.id AND u.user_id IS NULL
    WHERE
        -- Cursor-based pagination (get posts before the cursor)
        (p_cursor IS NULL OR p.created_at < p_cursor)
        -- Only show active posts
        AND p.is_active = true
        -- Respect blocking
        AND NOT EXISTS(
            SELECT 1 FROM blocks b
            WHERE (b.blocker_id = p_user_id AND b.blocked_id = p.user_id)
            OR (b.blocker_id = p.user_id AND b.blocked_id = p_user_id)
        )
        -- Feed type filtering
        AND (
            p_feed_type = 'all' OR
            (p_feed_type = 'friends' AND p.user_id = ANY(v_friend_ids)) OR
            (p_feed_type = 'following' AND p.user_id IN (
                SELECT following_id FROM follows
                WHERE follower_id = p_user_id
            )) OR
            (p_feed_type = 'competition' AND p.competition_id IS NOT NULL) OR
            (p_feed_type = 'trending' AND p.likes_count + p.comments_count + p.shares_count > 20)
        )
        -- Apply additional filters
        AND (
            p_filters IS NULL OR
            (
                -- Country filter
                (p_filters->>'country' IS NULL OR u.country = p_filters->>'country') AND
                -- Style filter
                (p_filters->>'style' IS NULL OR p.style = p_filters->>'style') AND
                -- Time range filter
                (p_filters->>'time_range' IS NULL OR
                 CASE
                    WHEN p_filters->>'time_range' = 'today' THEN p.created_at >= CURRENT_DATE
                    WHEN p_filters->>'time_range' = 'week' THEN p.created_at >= CURRENT_DATE - INTERVAL '7 days'
                    WHEN p_filters->>'time_range' = 'month' THEN p.created_at >= CURRENT_DATE - INTERVAL '30 days'
                    ELSE true
                 END
                )
            )
        )
    ORDER BY
        -- Priority scoring for better feed ordering
        CASE
            WHEN p.user_id = ANY(v_friend_ids) THEN 1.0
            WHEN p.user_id IN (
                SELECT following_id FROM follows
                WHERE follower_id = p_user_id
            ) THEN 0.7
            WHEN u.country = v_country_code THEN 0.6
            WHEN p.likes_count + p.comments_count + p.shares_count > 50 THEN 0.8
            WHEN p.competition_id IS NOT NULL THEN 0.9
            ELSE 0.5
        END * (1.0 + (p.likes_count + p.comments_count * 2 + p.shares_count * 3) * 0.01) DESC,
        p.created_at DESC
    LIMIT p_limit;
END;
$$;

-- Get next cursor for pagination
CREATE OR REPLACE FUNCTION get_feed_cursor(
    p_last_post_time TIMESTAMP WITH TIME ZONE
)
RETURNS TIMESTAMP WITH TIME ZONE
LANGUAGE sql
AS $$
    SELECT p_last_post_time - INTERVAL '1 microsecond';
$$;

-- Get feed pagination metadata
CREATE OR REPLACE FUNCTION get_feed_pagination_info(
    p_user_id UUID,
    p_cursor TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_limit INTEGER DEFAULT 10,
    p_feed_type TEXT DEFAULT 'all',
    p_filters JSONB DEFAULT '{}'
)
RETURNS TABLE (
    has_more BOOLEAN,
    next_cursor TIMESTAMP WITH TIME ZONE,
    total_count BIGINT,
    cache_key TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_count BIGINT;
    v_next_cursor TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Count total posts matching criteria (excluding pagination)
    SELECT COUNT(*) INTO v_count
    FROM posts p
    WHERE
        p.is_active = true
        AND NOT EXISTS(
            SELECT 1 FROM blocks b
            WHERE (b.blocker_id = p_user_id AND b.blocked_id = p.user_id)
            OR (b.blocker_id = p.user_id AND b.blocked_id = p_user_id)
        )
        AND (
            p_feed_type = 'all' OR
            (p_feed_type = 'friends' AND p.user_id IN (
                SELECT following_id FROM get_mutual_friends(p_user_id)
            )) OR
            (p_feed_type = 'following' AND p.user_id IN (
                SELECT following_id FROM follows
                WHERE follower_id = p_user_id
            )) OR
            (p_feed_type = 'competition' AND p.competition_id IS NOT NULL) OR
            (p_feed_type = 'trending' AND p.likes_count + p.comments_count + p.shares_count > 20)
        );

    -- Check if there are more posts beyond the current cursor
    SELECT p.created_at INTO v_next_cursor
    FROM posts p
    WHERE
        (p_cursor IS NULL OR p.created_at < p_cursor)
        AND p.is_active = true
        AND NOT EXISTS(
            SELECT 1 FROM blocks b
            WHERE (b.blocker_id = p_user_id AND b.blocked_id = p.user_id)
            OR (b.blocker_id = p.user_id AND b.blocked_id = p_user_id)
        )
    ORDER BY p.created_at DESC
    OFFSET p_limit
    LIMIT 1;

    RETURN QUERY
    SELECT
        v_next_cursor IS NOT NULL as has_more,
        COALESCE(v_next_cursor, p_cursor) as next_cursor,
        v_count as total_count,
        COALESCE(p_cursor::TEXT, 'start') || '_' || p_limit || '_' || p_feed_type as cache_key;
END;
$$;

-- Optimized post preview for list views
CREATE OR REPLACE FUNCTION get_post_preview(
    p_post_id UUID,
    p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    username TEXT,
    avatar_url TEXT,
    content_preview TEXT,
    image_url TEXT,
    blurhash TEXT,
    likes_count BIGINT,
    comments_count BIGINT,
    is_liked BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    time_ago TEXT,
    engagement_score FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.user_id,
        COALESCE(u.username, u2.username) as username,
        COALESCE(u.avatar_url, u2.avatar_url) as avatar_url,
        LEFT(p.content, 120) as content_preview,
        p.image_url,
        p.blurhash,
        p.likes_count,
        p.comments_count,
        EXISTS(
            SELECT 1 FROM likes l
            WHERE l.post_id = p.id AND l.user_id = p_user_id
        ) as is_liked,
        p.created_at,
        CASE
            WHEN p.created_at >= CURRENT_DATE THEN 'Today'
            WHEN p.created_at >= CURRENT_DATE - INTERVAL '1 day' THEN 'Yesterday'
            WHEN p.created_at >= CURRENT_DATE - INTERVAL '7 days' THEN EXTRACT(DAY FROM CURRENT_DATE - p.created_at) || ' days ago'
            ELSE EXTRACT(MONTH FROM p.created_at) || '/' || EXTRACT(DAY FROM p.created_at)
        END as time_ago,
        (p.likes_count + p.comments_count * 2 + p.shares_count * 3) as engagement_score
    FROM posts p
    LEFT JOIN profiles u ON p.user_id = u.user_id
    LEFT JOIN auth.users u2 ON p.user_id = u2.id AND u.user_id IS NULL
    WHERE p.id = p_post_id AND p.is_active = true;
END;
$$;

-- Batch update post engagement for caching
CREATE OR REPLACE FUNCTION update_post_engagement_batch(
    p_post_ids UUID[]
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_post_id UUID;
BEGIN
    FOREACH v_post_id IN ARRAY p_post_ids
    LOOP
        UPDATE posts
        SET
            engagement_score = (likes_count + comments_count * 2 + shares_count * 3),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = v_post_id;
    END LOOP;
END;
$$;

-- Add indexes for better pagination performance
CREATE INDEX IF NOT EXISTS idx_posts_feed_pagination
ON posts (created_at DESC, is_active, user_id)
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_posts_engagement
ON posts (engagement_score DESC, created_at DESC)
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_posts_competition_feed
ON posts (competition_id, created_at DESC)
WHERE competition_id IS NOT NULL AND is_active = true;

CREATE INDEX IF NOT EXISTS idx_posts_user_feed
ON posts (user_id, created_at DESC)
WHERE is_active = true;

-- Create materialized view for fast feed access
CREATE MATERIALIZED VIEW IF NOT EXISTS feed_cache AS
SELECT
    p.id,
    p.user_id,
    COALESCE(u.username, u2.username) as username,
    COALESCE(u.avatar_url, u2.avatar_url) as avatar_url,
    p.content,
    p.image_url,
    p.blurhash,
    p.likes_count,
    p.comments_count,
    p.shares_count,
    p.created_at,
    p.engagement_score,
    p.competition_id,
    u.country,
    CASE
        WHEN p.likes_count + p.comments_count + p.shares_count > 50 THEN true
        ELSE false
    END as is_trending
FROM posts p
LEFT JOIN profiles u ON p.user_id = u.user_id
LEFT JOIN auth.users u2 ON p.user_id = u2.id AND u.user_id IS NULL
WHERE p.is_active = true
ORDER BY p.created_at DESC;

-- Create unique index for materialized view refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_feed_cache_id
ON feed_cache (id);

-- Function to refresh feed cache
CREATE OR REPLACE FUNCTION refresh_feed_cache()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY feed_cache;
END;
$$;

-- Schedule periodic cache refresh (would need pg_cron extension)
-- SELECT cron.schedule('refresh-feed-cache', '*/5 * * * *', 'SELECT refresh_feed_cache();');

COMMENT ON FUNCTION get_paginated_feed IS 'Cursor-based pagination for feed with performance optimization';
COMMENT ON FUNCTION get_feed_cursor IS 'Get next cursor for feed pagination';
COMMENT ON FUNCTION get_feed_pagination_info IS 'Get pagination metadata including next cursor and counts';
COMMENT ON FUNCTION get_post_preview IS 'Get optimized post preview for list views';
COMMENT ON FUNCTION update_post_engagement_batch IS 'Batch update engagement scores for performance';
COMMENT ON MATERIALIZED VIEW feed_cache IS 'Materialized view for fast feed access';
COMMENT ON FUNCTION refresh_feed_cache IS 'Refresh feed cache materialized view';