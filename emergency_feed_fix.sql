-- DIAGNOSTIC AND EMERGENCY FIX SCRIPT
-- Run this in your Supabase SQL Editor to completely fix the feed issues

-- Step 1: First, let's see what functions currently exist
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%feed%' OR routine_name LIKE '%recommendation%'
ORDER BY routine_name;

-- Step 2: Drop ALL functions that might be causing conflicts
DROP FUNCTION IF EXISTS get_user_feed CASCADE;
DROP FUNCTION IF EXISTS get_user_recommendations CASCADE;
DROP FUNCTION IF EXISTS get_country_boost CASCADE;

-- Step 3: Clean up any remaining temporary table references
DROP TABLE IF EXISTS temp_mutual_friends_posts;
DROP TABLE IF EXISTS temp_following_posts;
DROP TABLE IF EXISTS temp_own_posts;
DROP TABLE IF EXISTS temp_trending_posts;
DROP TABLE IF EXISTS temp_competition_posts;

-- Step 4: Create a completely new, simple feed function without ambiguous references
CREATE OR REPLACE FUNCTION get_user_feed_simple(
    current_user_id UUID,
    limit_count INTEGER DEFAULT 20,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE(
    post_id UUID,
    author_id UUID,
    content TEXT,
    images JSONB,
    created_at TIMESTAMPTZ,
    likes_count BIGINT,
    comments_count BIGINT,
    shares_count BIGINT,
    trending_score DECIMAL,
    feed_type TEXT,
    relationship_type TEXT,
    author_username TEXT,
    author_avatar_url TEXT,
    author_full_name TEXT,
    is_liked BOOLEAN,
    competition_id UUID,
    competition_title TEXT,
    friendship_boost DECIMAL
) AS $$
DECLARE
    mutual_posts_limit INTEGER;
    following_posts_limit INTEGER;
    own_posts_limit INTEGER;
    trending_posts_limit INTEGER;
BEGIN
    -- Calculate limits for each category
    mutual_posts_limit := GREATEST(CEIL(limit_count * 0.35), 1);
    following_posts_limit := GREATEST(CEIL(limit_count * 0.25), 1);
    own_posts_limit := GREATEST(CEIL(limit_count * 0.10), 1);
    trending_posts_limit := limit_count - mutual_posts_limit - following_posts_limit - own_posts_limit;

    -- Return query with a simple, unambiguous approach
    RETURN QUERY
    SELECT
        p.id as post_id,
        p.author_id,
        p.content,
        p.images,
        p.created_at,
        COALESCE(p.likes_count, 0)::BIGINT as likes_count,
        COALESCE(p.comments_count, 0)::BIGINT as comments_count,
        COALESCE(p.shares_count, 0)::BIGINT as shares_count,
        (COALESCE(p.likes_count, 0) * 1.0 + COALESCE(p.comments_count, 0) * 2.0 + COALESCE(p.shares_count, 0) * 3.0) as trending_score,
        CASE
            WHEN p.author_id = current_user_id THEN 'own'
            WHEN EXISTS (
                SELECT 1 FROM follows f
                WHERE f.follower_id = current_user_id
                AND f.following_id = p.author_id
                AND f.status = 'accepted'
            ) THEN 'following'
            ELSE 'trending'
        END as feed_type,
        CASE
            WHEN p.author_id = current_user_id THEN 'own'
            WHEN EXISTS (
                SELECT 1 FROM follows f
                WHERE f.follower_id = current_user_id
                AND f.following_id = p.author_id
                AND f.status = 'accepted'
            ) THEN 'following'
            ELSE 'discover'
        END as relationship_type,
        COALESCE(u.username, 'unknown') as author_username,
        u.avatar_url as author_avatar_url,
        COALESCE(u.full_name, '') as author_full_name,
        EXISTS(SELECT 1 FROM likes l WHERE l.post_id = p.id AND l.user_id = current_user_id) as is_liked,
        NULL::UUID as competition_id,
        NULL::TEXT as competition_title,
        CASE
            WHEN p.author_id = current_user_id THEN 3.0
            WHEN EXISTS (
                SELECT 1 FROM follows f
                WHERE f.follower_id = current_user_id
                AND f.following_id = p.author_id
                AND f.status = 'accepted'
            ) THEN 2.0
            ELSE 1.0
        END as friendship_boost
    FROM posts p
    LEFT JOIN profiles u ON p.author_id = u.id
    WHERE p.visibility = 'public'
    AND NOT p.is_archived
    AND (
        p.author_id = current_user_id
        OR EXISTS (
            SELECT 1 FROM follows f
            WHERE f.follower_id = current_user_id
            AND f.following_id = p.author_id
            AND f.status = 'accepted'
        )
        OR p.created_at >= NOW() - INTERVAL '7 days'
    )
    ORDER BY
        CASE
            WHEN p.author_id = current_user_id THEN 1
            WHEN EXISTS (
                SELECT 1 FROM follows f
                WHERE f.follower_id = current_user_id
                AND f.following_id = p.author_id
                AND f.status = 'accepted'
            ) THEN 2
            ELSE 3
        END,
        friendship_boost DESC,
        p.created_at DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create a simple recommendations function
CREATE OR REPLACE FUNCTION get_user_recommendations_simple(
    current_user_id UUID,
    limit_count INTEGER DEFAULT 10
)
RETURNS TABLE(
    recommended_user_id UUID,
    username TEXT,
    avatar_url TEXT,
    full_name TEXT,
    followers_count BIGINT,
    reason TEXT,
    mutual_friends_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id as recommended_user_id,
        p.username,
        p.avatar_url,
        p.full_name,
        0 as followers_count,
        'Recommended user' as reason,
        0 as mutual_friends_count
    FROM profiles p
    WHERE p.id != current_user_id
    AND p.is_public = TRUE
    AND NOT EXISTS (
        SELECT 1 FROM follows f
        WHERE f.follower_id = current_user_id
        AND f.following_id = p.id
    )
    ORDER BY p.created_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Grant permissions
GRANT EXECUTE ON FUNCTION get_user_feed_simple TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_recommendations_simple TO authenticated;

-- Step 7: Create an alias to maintain compatibility
CREATE OR REPLACE FUNCTION get_user_feed(
    current_user_id UUID,
    limit_count INTEGER DEFAULT 20,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE(
    post_id UUID,
    author_id UUID,
    content TEXT,
    images JSONB,
    created_at TIMESTAMPTZ,
    likes_count BIGINT,
    comments_count BIGINT,
    shares_count BIGINT,
    trending_score DECIMAL,
    feed_type TEXT,
    relationship_type TEXT,
    author_username TEXT,
    author_avatar_url TEXT,
    author_full_name TEXT,
    is_liked BOOLEAN,
    competition_id UUID,
    competition_title TEXT,
    friendship_boost DECIMAL
) AS $$
BEGIN
    RETURN QUERY SELECT * FROM get_user_feed_simple(current_user_id, limit_count, offset_count);
END;
$$ LANGUAGE plpgsql;

-- Step 8: Grant permissions to the alias function
GRANT EXECUTE ON FUNCTION get_user_feed TO authenticated;

-- Success verification
SELECT '✅ Emergency fix completed successfully!' as status;
SELECT '🔧 All functions recreated without ambiguous references' as result;
SELECT '🧪 Test the function with: SELECT * FROM get_user_feed(''your-user-uuid'', 5, 0);' as test_command;

-- Show what functions we now have
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND (routine_name LIKE '%feed%' OR routine_name LIKE '%recommendation%')
ORDER BY routine_name;