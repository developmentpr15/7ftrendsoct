-- Minimal Intelligent Feed Algorithm for 7Ftrends
-- Simplified version that works with existing database structure

-- Main feed function - simplified for existing schema
CREATE OR REPLACE FUNCTION get_user_feed(
    current_user_id UUID,
    limit_count INTEGER DEFAULT 20,
    offset_count INTEGER DEFAULT 0,
    user_country TEXT DEFAULT 'US'
)
RETURNS TABLE(
    post_id UUID,
    author_id UUID,
    content TEXT,
    images JSONB,
    created_at TIMESTAMPTZ,
    likes_count INTEGER,
    comments_count INTEGER,
    shares_count INTEGER,
    trending_score DECIMAL,
    feed_type TEXT,
    author_username TEXT,
    author_avatar_url TEXT,
    author_full_name TEXT,
    is_liked BOOLEAN,
    competition_id UUID,
    competition_title TEXT
) AS $$
BEGIN
    -- Return a simple UNION ALL query with basic post data
    RETURN QUERY
    -- Friends and own posts
    SELECT
        p.id as post_id,
        p.author_id,
        p.content,
        p.images,
        p.created_at,
        COALESCE(p.likes_count, 0) as likes_count,
        COALESCE(p.comments_count, 0) as comments_count,
        COALESCE(p.shares_count, 0) as shares_count,
        p.created_at as trending_score, -- Use created_at as simple score
        'friend' as feed_type,
        u.username as author_username,
        u.avatar_url as author_avatar_url,
        u.full_name as author_full_name,
        EXISTS(SELECT 1 FROM likes l WHERE l.post_id = p.id AND l.user_id = current_user_id) as is_liked,
        NULL::UUID as competition_id,
        NULL::TEXT as competition_title
    FROM posts p
    JOIN users u ON p.author_id = u.id
    WHERE (p.author_id = current_user_id OR p.author_id IN (
        SELECT following_id FROM follows
        WHERE follower_id = current_user_id AND status = 'accepted'
    ))
    AND p.visibility IN ('public', 'followers')
    AND NOT p.is_archived
    ORDER BY p.created_at DESC
    LIMIT limit_count
    OFFSET offset_count;

    -- Clean up is handled automatically
END;
$$ LANGUAGE plpgsql;

-- Simplified recommendations function
CREATE OR REPLACE FUNCTION get_user_recommendations(
    current_user_id UUID,
    limit_count INTEGER DEFAULT 10
)
RETURNS TABLE(
    recommended_user_id UUID,
    username TEXT,
    avatar_url TEXT,
    full_name TEXT,
    followers_count INTEGER,
    reason TEXT,
    mutual_friends_count INTEGER
) AS $$
BEGIN
    -- Return empty results for now - can be expanded later
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Simple trending score function
CREATE OR REPLACE FUNCTION calculate_trending_score(
    post_id UUID,
    base_time TIMESTAMPTZ DEFAULT NOW()
)
RETURNS DECIMAL AS $$
BEGIN
    -- Simple implementation based on creation time
    DECLARE
        post_created TIMESTAMPTZ;
        hours_since_post DECIMAL;
    BEGIN
        SELECT p.created_at INTO post_created
        FROM posts p
        WHERE p.id = post_id;

        IF NOT FOUND THEN
            RETURN 0;
        END IF;

        hours_since_post := EXTRACT(EPOCH FROM (base_time - post_created)) / 3600;
        RETURN GREATEST(0, 100 - hours_since_post); -- Simple decay
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Country boost function (simplified)
CREATE OR REPLACE FUNCTION get_country_boost(
    user_country TEXT,
    post_country TEXT
)
RETURNS DECIMAL AS $$
BEGIN
    RETURN 1.0; -- No boost for now
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_user_feed TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_recommendations TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_trending_score TO authenticated;
GRANT EXECUTE ON FUNCTION get_country_boost TO authenticated;

-- Test query
-- SELECT * FROM get_user_feed('92791356-7240-4945-9bc3-3582949a26ad', 5, 0, 'US');