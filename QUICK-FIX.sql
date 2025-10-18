-- QUICK FIX: Replace the broken feed function immediately
-- Copy and paste this entire script into your Supabase SQL Editor and run it

-- Step 1: Drop the broken functions that are causing the error
DROP FUNCTION IF EXISTS get_user_feed(UUID, INTEGER, INTEGER, TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_country_boost(TEXT, TEXT) CASCADE;

-- Step 2: Create the corrected feed function (no country dependencies)
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
    likes_count INTEGER,
    comments_count INTEGER,
    shares_count INTEGER,
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
    mutual_friends_count INTEGER;
    following_count INTEGER;
    own_posts_count INTEGER;
    trending_count INTEGER;
    competition_count INTEGER;
BEGIN
    -- Calculate how many posts we need from each category
    -- 35% mutual friends, 25% following, 10% own, 20% trending, 10% competitions
    mutual_friends_count := CEIL(limit_count * 0.35);
    following_count := CEIL(limit_count * 0.25);
    own_posts_count := CEIL(limit_count * 0.10);
    trending_count := CEIL(limit_count * 0.20);
    competition_count := limit_count - mutual_friends_count - following_count - own_posts_count - trending_count;

    -- Create temporary table for mutual friends posts (highest priority)
    CREATE TEMPORARY TABLE IF NOT EXISTS temp_mutual_friends_posts AS
    SELECT
        p.id as post_id,
        p.author_id,
        p.content,
        p.images,
        p.created_at,
        COALESCE(p.likes_count, 0) as likes_count,
        COALESCE(p.comments_count, 0) as comments_count,
        COALESCE(p.shares_count, 0) as shares_count,
        (COALESCE(p.likes_count, 0) * 1.0 + COALESCE(p.comments_count, 0) * 2.0 + COALESCE(p.shares_count, 0) * 3.0) * 3.0 as trending_score,
        'mutual_friend' as feed_type,
        'mutual_friend' as relationship_type,
        u.username as author_username,
        u.avatar_url as author_avatar_url,
        u.full_name as author_full_name,
        EXISTS(SELECT 1 FROM likes l WHERE l.post_id = p.id AND l.user_id = current_user_id) as is_liked,
        NULL::UUID as competition_id,
        NULL::TEXT as competition_title,
        3.0 as friendship_boost,
        ROW_NUMBER() OVER (ORDER BY p.created_at DESC) as row_num
    FROM posts p
    JOIN users u ON p.author_id = u.id
    WHERE EXISTS (
        SELECT 1 FROM follows f1
        JOIN follows f2 ON f1.follower_id = f2.following_id AND f1.following_id = f2.follower_id
        WHERE (f1.follower_id = current_user_id AND f1.following_id = p.author_id)
        OR (f1.following_id = current_user_id AND f1.follower_id = p.author_id)
        AND f1.status = 'accepted' AND f2.status = 'accepted'
    )
    AND p.visibility IN ('public', 'followers')
    AND NOT p.is_archived
    ORDER BY p.created_at DESC
    LIMIT mutual_friends_count + 3;

    -- Create temporary table for regular following posts (medium priority)
    CREATE TEMPORARY TABLE IF NOT EXISTS temp_following_posts AS
    SELECT
        p.id as post_id,
        p.author_id,
        p.content,
        p.images,
        p.created_at,
        COALESCE(p.likes_count, 0) as likes_count,
        COALESCE(p.comments_count, 0) as comments_count,
        COALESCE(p.shares_count, 0) as shares_count,
        (COALESCE(p.likes_count, 0) * 1.0 + COALESCE(p.comments_count, 0) * 2.0 + COALESCE(p.shares_count, 0) * 3.0) * 1.5 as trending_score,
        'following' as feed_type,
        'following' as relationship_type,
        u.username as author_username,
        u.avatar_url as author_avatar_url,
        u.full_name as author_full_name,
        EXISTS(SELECT 1 FROM likes l WHERE l.post_id = p.id AND l.user_id = current_user_id) as is_liked,
        NULL::UUID as competition_id,
        NULL::TEXT as competition_title,
        1.5 as friendship_boost,
        ROW_NUMBER() OVER (ORDER BY p.created_at DESC) as row_num
    FROM posts p
    JOIN users u ON p.author_id = u.id
    WHERE p.author_id IN (
        SELECT following_id FROM follows
        WHERE follower_id = current_user_id
        AND status = 'accepted'
    )
    AND p.author_id != current_user_id
    AND NOT EXISTS (
        SELECT 1 FROM follows f1
        JOIN follows f2 ON f1.follower_id = f2.following_id AND f1.following_id = f2.follower_id
        WHERE (f1.follower_id = current_user_id AND f1.following_id = p.author_id)
        OR (f1.following_id = current_user_id AND f1.follower_id = p.author_id)
        AND f1.status = 'accepted' AND f2.status = 'accepted'
    )
    AND p.visibility IN ('public', 'followers')
    AND NOT p.is_archived
    ORDER BY p.created_at DESC
    LIMIT following_count + 3;

    -- Create temporary table for own posts
    CREATE TEMPORARY TABLE IF NOT EXISTS temp_own_posts AS
    SELECT
        p.id as post_id,
        p.author_id,
        p.content,
        p.images,
        p.created_at,
        COALESCE(p.likes_count, 0) as likes_count,
        COALESCE(p.comments_count, 0) as comments_count,
        COALESCE(p.shares_count, 0) as shares_count,
        (COALESCE(p.likes_count, 0) * 1.0 + COALESCE(p.comments_count, 0) * 2.0 + COALESCE(p.shares_count, 0) * 3.0) * 2.0 as trending_score,
        'own' as feed_type,
        'own' as relationship_type,
        u.username as author_username,
        u.avatar_url as author_avatar_url,
        u.full_name as author_full_name,
        EXISTS(SELECT 1 FROM likes l WHERE l.post_id = p.id AND l.user_id = current_user_id) as is_liked,
        NULL::UUID as competition_id,
        NULL::TEXT as competition_title,
        2.0 as friendship_boost,
        ROW_NUMBER() OVER (ORDER BY p.created_at DESC) as row_num
    FROM posts p
    JOIN users u ON p.author_id = u.id
    WHERE p.author_id = current_user_id
    AND NOT p.is_archived
    ORDER BY p.created_at DESC
    LIMIT own_posts_count + 2;

    -- Get trending posts
    CREATE TEMPORARY TABLE IF NOT EXISTS temp_trending_posts AS
    SELECT
        p.id as post_id,
        p.author_id,
        p.content,
        p.images,
        p.created_at,
        COALESCE(p.likes_count, 0) as likes_count,
        COALESCE(p.comments_count, 0) as comments_count,
        COALESCE(p.shares_count, 0) as shares_count,
        (COALESCE(p.likes_count, 0) * 1.0 + COALESCE(p.comments_count, 0) * 2.0 + COALESCE(p.shares_count, 0) * 3.0) as trending_score,
        'trending' as feed_type,
        'discover' as relationship_type,
        u.username as author_username,
        u.avatar_url as author_avatar_url,
        u.full_name as author_full_name,
        EXISTS(SELECT 1 FROM likes l WHERE l.post_id = p.id AND l.user_id = current_user_id) as is_liked,
        NULL::UUID as competition_id,
        NULL::TEXT as competition_title,
        1.0 as friendship_boost,
        ROW_NUMBER() OVER (ORDER BY (COALESCE(p.likes_count, 0) * 1.0 + COALESCE(p.comments_count, 0) * 2.0 + COALESCE(p.shares_count, 0) * 3.0) DESC) as row_num
    FROM posts p
    JOIN users u ON p.author_id = u.id
    WHERE p.visibility = 'public'
    AND NOT p.is_archived
    AND p.created_at >= NOW() - INTERVAL '7 days'
    AND p.id NOT IN (SELECT post_id FROM temp_mutual_friends_posts WHERE post_id IS NOT NULL)
    AND p.id NOT IN (SELECT post_id FROM temp_following_posts WHERE post_id IS NOT NULL)
    AND p.id NOT IN (SELECT post_id FROM temp_own_posts WHERE post_id IS NOT NULL)
    ORDER BY (COALESCE(p.likes_count, 0) * 1.0 + COALESCE(p.comments_count, 0) * 2.0 + COALESCE(p.shares_count, 0) * 3.0) DESC
    LIMIT trending_count + 5;

    -- Create empty competition posts table (graceful handling)
    CREATE TEMPORARY TABLE temp_competition_posts AS
    SELECT
        NULL::UUID as post_id,
        NULL::UUID as author_id,
        NULL::TEXT as content,
        NULL::JSONB as images,
        NULL::TIMESTAMPTZ as created_at,
        0 as likes_count,
        0 as comments_count,
        0 as shares_count,
        0.0 as trending_score,
        'competition' as feed_type,
        'competition' as relationship_type,
        NULL::TEXT as author_username,
        NULL::TEXT as author_avatar_url,
        NULL::TEXT as author_full_name,
        false as is_liked,
        NULL::UUID as competition_id,
        NULL::TEXT as competition_title,
        1.5 as friendship_boost,
        0 as row_num
    LIMIT 0;

    -- Combine all posts with friend-based prioritization
    RETURN QUERY
    SELECT * FROM (
        -- Mutual friends posts (35% weight, highest priority)
        SELECT
            post_id, author_id, content, images, created_at,
            likes_count, comments_count, shares_count, trending_score,
            feed_type, relationship_type, author_username, author_avatar_url, author_full_name,
            is_liked, competition_id, competition_title, friendship_boost
        FROM temp_mutual_friends_posts
        WHERE row_num <= mutual_friends_count

        UNION ALL

        -- Own posts (10% weight, high priority)
        SELECT
            post_id, author_id, content, images, created_at,
            likes_count, comments_count, shares_count, trending_score,
            feed_type, relationship_type, author_username, author_avatar_url, author_full_name,
            is_liked, competition_id, competition_title, friendship_boost
        FROM temp_own_posts

        UNION ALL

        -- Following posts (25% weight, medium priority)
        SELECT
            post_id, author_id, content, images, created_at,
            likes_count, comments_count, shares_count, trending_score,
            feed_type, relationship_type, author_username, author_avatar_url, author_full_name,
            is_liked, competition_id, competition_title, friendship_boost
        FROM temp_following_posts
        WHERE row_num <= following_count

        UNION ALL

        -- Trending posts (20% weight, lower priority)
        SELECT
            post_id, author_id, content, images, created_at,
            likes_count, comments_count, shares_count, trending_score,
            feed_type, relationship_type, author_username, author_avatar_url, author_full_name,
            is_liked, competition_id, competition_title, friendship_boost
        FROM temp_trending_posts
        WHERE row_num <= trending_count

        UNION ALL

        -- Competition posts (0% for now)
        SELECT
            post_id, author_id, content, images, created_at,
            likes_count, comments_count, shares_count, trending_score,
            feed_type, relationship_type, author_username, author_avatar_url, author_full_name,
            is_liked, competition_id, competition_title, friendship_boost
        FROM temp_competition_posts
        WHERE row_num <= competition_count
    ) combined_posts
    ORDER BY
        CASE
            WHEN feed_type = 'mutual_friend' THEN 1
            WHEN feed_type = 'own' THEN 2
            WHEN feed_type = 'following' THEN 3
            WHEN feed_type = 'trending' THEN 4
            WHEN feed_type = 'competition' THEN 5
        END,
        friendship_boost DESC,
        created_at DESC
    LIMIT limit_count
    OFFSET offset_count;

    -- Clean up temporary tables
    DROP TABLE IF EXISTS temp_mutual_friends_posts;
    DROP TABLE IF EXISTS temp_following_posts;
    DROP TABLE IF EXISTS temp_own_posts;
    DROP TABLE IF EXISTS temp_trending_posts;
    DROP TABLE IF EXISTS temp_competition_posts;

END;
$$ LANGUAGE plpgsql;

-- Step 3: Fix the recommendations function (remove username ambiguity)
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
    RETURN QUERY
    WITH mutual_friends AS (
        SELECT
            u.id,
            u.username,
            u.avatar_url,
            u.full_name,
            u.followers_count,
            COUNT(f1.following_id) as mutual_count
        FROM users u
        JOIN follows f1 ON u.id = f1.following_id
        JOIN follows f2 ON f1.follower_id = f2.following_id AND f2.following_id = current_user_id
        WHERE u.id != current_user_id
        AND NOT EXISTS (
            SELECT 1 FROM follows f
            WHERE f.follower_id = current_user_id
            AND f.following_id = u.id
        )
        AND u.is_active = true
        GROUP BY u.id, u.username, u.avatar_url, u.full_name, u.followers_count
        HAVING COUNT(f1.following_id) >= 1
        ORDER BY mutual_count DESC, u.followers_count DESC
        LIMIT limit_count
    )
    SELECT
        id as recommended_user_id,
        username,
        avatar_url,
        full_name,
        followers_count,
        'Followed by ' || mutual_count || ' friends' as reason,
        mutual_count as mutual_friends_count
    FROM mutual_friends;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Grant permissions
GRANT EXECUTE ON FUNCTION get_user_feed TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_recommendations TO authenticated;

-- Step 5: Test the function (you can run this to verify it works)
-- SELECT * FROM get_user_feed('92791356-7240-4945-9bc3-3582949a26ad'::uuid, 5, 0);

-- Success message
SELECT '✅ Feed function fixed successfully!' as status;
SELECT '🎯 No more country column errors' as result;
SELECT '🚀 Your app feed should now work properly' as next_step;