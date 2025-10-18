-- Friendship System with Mutual Follow Detection for 7Ftrends
-- Creates bidirectional friend detection and enhanced feed filtering

-- Function to check if two users are mutual friends (bidirectional follow)
CREATE OR REPLACE FUNCTION are_mutual_friends(
    user_a UUID,
    user_b UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    a_follows_b BOOLEAN;
    b_follows_a BOOLEAN;
BEGIN
    -- Check if user A follows user B
    SELECT EXISTS(
        SELECT 1 FROM follows
        WHERE follower_id = user_a
        AND following_id = user_b
        AND status = 'accepted'
    ) INTO a_follows_b;

    -- Check if user B follows user A
    SELECT EXISTS(
        SELECT 1 FROM follows
        WHERE follower_id = user_b
        AND following_id = user_a
        AND status = 'accepted'
    ) INTO b_follows_a;

    RETURN a_follows_b AND b_follows_a;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get all mutual friends for a user
CREATE OR REPLACE FUNCTION get_mutual_friends(
    current_user_id UUID,
    limit_count INTEGER DEFAULT 50,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE(
    friend_id UUID,
    username TEXT,
    avatar_url TEXT,
    full_name TEXT,
    followers_count INTEGER,
    following_count INTEGER,
    is_verified BOOLEAN,
    friendship_date TIMESTAMPTZ,
    last_interaction_date TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT
        CASE
            WHEN f1.follower_id = current_user_id THEN f1.following_id
            ELSE f1.follower_id
        END as friend_id,
        u.username,
        u.avatar_url,
        u.full_name,
        u.followers_count,
        u.following_count,
        u.is_verified,
        GREATEST(f1.accepted_at, f2.accepted_at) as friendship_date,
        GREATEST(
            COALESCE(f1.accepted_at, '1970-01-01'::TIMESTAMPTZ),
            COALESCE(f2.accepted_at, '1970-01-01'::TIMESTAMPTZ)
        ) as last_interaction_date
    FROM follows f1
    JOIN follows f2 ON (
        (f1.follower_id = f2.following_id AND f1.following_id = f2.follower_id) OR
        (f1.follower_id = f2.following_id AND f1.following_id = f2.follower_id)
    )
    JOIN users u ON (
        (f1.follower_id = current_user_id AND f1.following_id = u.id) OR
        (f1.following_id = current_user_id AND f1.follower_id = u.id)
    )
    WHERE (
        (f1.follower_id = current_user_id OR f1.following_id = current_user_id) AND
        (f2.follower_id = current_user_id OR f2.following_id = current_user_id) AND
        f1.status = 'accepted' AND
        f2.status = 'accepted' AND
        u.id != current_user_id AND
        u.is_active = TRUE
    )
    ORDER BY friendship_date DESC, last_interaction_date DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get friendship status between two users
CREATE OR REPLACE FUNCTION get_friendship_status(
    current_user_id UUID,
    target_user_id UUID
)
RETURNS TABLE(
    status TEXT,
    direction TEXT,
    is_mutual BOOLEAN,
    friendship_date TIMESTAMPTZ,
    request_sent_at TIMESTAMPTZ
) AS $$
DECLARE
    user_follows_target BOOLEAN := FALSE;
    target_follows_user BOOLEAN := FALSE;
    follow_status TEXT := 'none';
    direction_type TEXT := 'none';
    mutual_flag BOOLEAN := FALSE;
    friendship_date_time TIMESTAMPTZ := NULL;
    request_sent_time TIMESTAMPTZ := NULL;
BEGIN
    -- Check if current user follows target
    SELECT EXISTS(
        SELECT 1 FROM follows
        WHERE follower_id = current_user_id
        AND following_id = target_user_id
    ), status, requested_at
    INTO user_follows_target, follow_status, request_sent_time
    FROM follows
    WHERE follower_id = current_user_id
    AND following_id = target_user_id;

    -- Check if target follows current user
    SELECT EXISTS(
        SELECT 1 FROM follows
        WHERE follower_id = target_user_id
        AND following_id = current_user_id
    )
    INTO target_follows_user
    FROM follows
    WHERE follower_id = target_user_id
    AND following_id = current_user_id;

    -- Determine relationship direction and status
    IF user_follows_target AND target_follows_user THEN
        mutual_flag := TRUE;
        direction_type := 'mutual';

        -- Get friendship date (when both accepted)
        SELECT GREATEST(f1.accepted_at, f2.accepted_at)
        INTO friendship_date_time
        FROM follows f1, follows f2
        WHERE f1.follower_id = current_user_id AND f1.following_id = target_user_id
        AND f2.follower_id = target_user_id AND f2.following_id = current_user_id;

    ELSIF user_follows_target THEN
        direction_type := 'outgoing';
        IF follow_status = 'accepted' THEN
            follow_status := 'following';
        ELSIF follow_status = 'pending' THEN
            follow_status := 'request_sent';
        END IF;

    ELSIF target_follows_user THEN
        direction_type := 'incoming';
        SELECT status, accepted_at INTO follow_status, friendship_date_time
        FROM follows
        WHERE follower_id = target_user_id
        AND following_id = current_user_id;

        IF follow_status = 'pending' THEN
            follow_status := 'request_received';
        ELSIF follow_status = 'accepted' THEN
            follow_status := 'followed_by';
        END IF;
    END IF;

    RETURN QUERY SELECT follow_status, direction_type, mutual_flag, friendship_date_time, request_sent_time;
END;
$$ LANGUAGE plpgsql;

-- Enhanced feed function that prioritizes mutual friends
CREATE OR REPLACE FUNCTION get_user_feed_with_friends(
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
    trending_count INTEGER;
    competition_count INTEGER;
BEGIN
    -- Calculate post distribution: 40% mutual friends, 30% following, 20% trending, 10% competitions
    mutual_friends_count := CEIL(limit_count * 0.40);
    following_count := CEIL(limit_count * 0.30);
    trending_count := CEIL(limit_count * 0.20);
    competition_count := limit_count - mutual_friends_count - following_count - trending_count;

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
        calculate_trending_score(p.id) * 3.0 as trending_score, -- 3x boost for mutual friends
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
    WHERE p.author_id IN (
        SELECT friend_id FROM get_mutual_friends(current_user_id, 100)
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
        calculate_trending_score(p.id) * 1.5 as trending_score, -- 1.5x boost for following
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
        AND following_id NOT IN (
            SELECT friend_id FROM get_mutual_friends(current_user_id, 100)
        )
    )
    AND p.author_id != current_user_id
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
        calculate_trending_score(p.id) * 2.0 as trending_score, -- 2x boost for own posts
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
    LIMIT 3; -- Limit own posts

    -- Create temporary table for trending posts (lower priority)
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
        calculate_trending_score(p.id) * get_country_boost(user_country, COALESCE(u.user_metadata->>'country', 'US')) as trending_score,
        'trending' as feed_type,
        'discover' as relationship_type,
        u.username as author_username,
        u.avatar_url as author_avatar_url,
        u.full_name as author_full_name,
        EXISTS(SELECT 1 FROM likes l WHERE l.post_id = p.id AND l.user_id = current_user_id) as is_liked,
        NULL::UUID as competition_id,
        NULL::TEXT as competition_title,
        1.0 as friendship_boost,
        ROW_NUMBER() OVER (ORDER BY calculate_trending_score(p.id) * get_country_boost(user_country, COALESCE(u.user_metadata->>'country', 'US')) DESC) as row_num
    FROM posts p
    JOIN users u ON p.author_id = u.id
    WHERE p.visibility = 'public'
    AND NOT p.is_archived
    AND p.created_at >= NOW() - INTERVAL '7 days'
    AND p.author_id NOT IN (
        SELECT friend_id FROM get_mutual_friends(current_user_id, 100)
        UNION
        SELECT following_id FROM follows WHERE follower_id = current_user_id AND status = 'accepted'
    )
    AND p.id NOT IN (SELECT post_id FROM temp_mutual_friends_posts WHERE post_id IS NOT NULL)
    AND p.id NOT IN (SELECT post_id FROM temp_following_posts WHERE post_id IS NOT NULL)
    AND p.id NOT IN (SELECT post_id FROM temp_own_posts WHERE post_id IS NOT NULL)
    ORDER BY trending_score DESC
    LIMIT trending_count + 5;

    -- Create temporary table for competition posts
    CREATE TEMPORARY TABLE IF NOT EXISTS temp_competition_posts AS
    SELECT
        ce.id as post_id,
        ce.participant_id as author_id,
        ce.description as content,
        ce.images,
        ce.submitted_at as created_at,
        ce.votes_count as likes_count,
        0 as comments_count,
        0 as shares_count,
        calculate_trending_score(ce.id, NOW()) * 1.5 as trending_score,
        'competition' as feed_type,
        'competition' as relationship_type,
        u.username as author_username,
        u.avatar_url as author_avatar_url,
        u.full_name as author_full_name,
        EXISTS(SELECT 1 FROM votes v WHERE v.entry_id = ce.id AND v.voter_id = current_user_id) as is_liked,
        ce.competition_id,
        c.title as competition_title,
        1.5 as friendship_boost,
        ROW_NUMBER() OVER (ORDER BY ce.submitted_at DESC) as row_num
    FROM competition_entries ce
    JOIN users u ON ce.participant_id = u.id
    JOIN competitions c ON ce.competition_id = c.id
    WHERE c.status IN ('active', 'voting', 'completed')
    AND ce.submitted_at >= NOW() - INTERVAL '14 days'
    AND ce.id NOT IN (SELECT post_id FROM temp_mutual_friends_posts WHERE post_id IS NOT NULL)
    AND ce.id NOT IN (SELECT post_id FROM temp_following_posts WHERE post_id IS NOT NULL)
    AND ce.id NOT IN (SELECT post_id FROM temp_own_posts WHERE post_id IS NOT NULL)
    AND ce.id NOT IN (SELECT post_id FROM temp_trending_posts WHERE post_id IS NOT NULL)
    ORDER BY ce.submitted_at DESC
    LIMIT competition_count + 3;

    -- Combine all posts with friend-based prioritization
    RETURN QUERY
    SELECT * FROM (
        -- Mutual friends posts (40% weight, highest priority)
        SELECT
            post_id, author_id, content, images, created_at,
            likes_count, comments_count, shares_count, trending_score,
            feed_type, relationship_type, author_username, author_avatar_url, author_full_name,
            is_liked, competition_id, competition_title, friendship_boost
        FROM temp_mutual_friends_posts
        WHERE row_num <= mutual_friends_count

        UNION ALL

        -- Own posts (high priority)
        SELECT
            post_id, author_id, content, images, created_at,
            likes_count, comments_count, shares_count, trending_score,
            feed_type, relationship_type, author_username, author_avatar_url, author_full_name,
            is_liked, competition_id, competition_title, friendship_boost
        FROM temp_own_posts

        UNION ALL

        -- Following posts (30% weight, medium priority)
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

        -- Competition posts (10% weight)
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

-- Function to get friend suggestions based on mutual connections
CREATE OR REPLACE FUNCTION get_friend_suggestions(
    current_user_id UUID,
    limit_count INTEGER DEFAULT 15
)
RETURNS TABLE(
    suggested_user_id UUID,
    username TEXT,
    avatar_url TEXT,
    full_name TEXT,
    followers_count INTEGER,
    mutual_friends_count INTEGER,
    mutual_friends_names TEXT[],
    suggestion_score DECIMAL,
    reason TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH potential_friends AS (
        SELECT
            u.id as suggested_user_id,
            u.username,
            u.avatar_url,
            u.full_name,
            u.followers_count,
            COUNT(DISTINCT CASE
                WHEN mf1.friend_id IS NOT NULL THEN mf1.friend_id
                WHEN mf2.friend_id IS NOT NULL THEN mf2.friend_id
            END) as mutual_friends_count,
            ARRAY_AGG(DISTINCT CASE
                WHEN mf1.username IS NOT NULL THEN mf1.username
                WHEN mf2.username IS NOT NULL THEN mf2.username
            END) FILTER (WHERE mf1.username IS NOT NULL OR mf2.username IS NOT NULL) as mutual_friends_names,
            -- Calculate suggestion score based on mutual friends and popularity
            (COUNT(DISTINCT CASE
                WHEN mf1.friend_id IS NOT NULL THEN mf1.friend_id
                WHEN mf2.friend_id IS NOT NULL THEN mf2.friend_id
            END) * 10.0 +
            LOG(GREATEST(u.followers_count, 1)) * 2.0) as suggestion_score
        FROM users u
        LEFT JOIN follows f1 ON u.id = f1.following_id AND f1.follower_id IN (
            SELECT friend_id FROM get_mutual_friends(current_user_id, 100)
        )
        LEFT JOIN follows f2 ON u.id = f2.follower_id AND f2.following_id IN (
            SELECT friend_id FROM get_mutual_friends(current_user_id, 100)
        )
        LEFT JOIN get_mutual_friends(current_user_id, 100) mf1 ON f1.follower_id = mf1.friend_id
        LEFT JOIN get_mutual_friends(current_user_id, 100) mf2 ON f2.following_id = mf2.friend_id
        WHERE u.id != current_user_id
        AND u.is_active = TRUE
        AND NOT EXISTS (
            -- Exclude if already following or followed by
            SELECT 1 FROM follows
            WHERE (follower_id = current_user_id AND following_id = u.id)
            OR (follower_id = u.id AND following_id = current_user_id)
        )
        GROUP BY u.id, u.username, u.avatar_url, u.full_name, u.followers_count
        HAVING COUNT(DISTINCT CASE
            WHEN mf1.friend_id IS NOT NULL THEN mf1.friend_id
            WHEN mf2.friend_id IS NOT NULL THEN mf2.friend_id
        END) >= 1
        ORDER BY suggestion_score DESC, mutual_friends_count DESC
        LIMIT limit_count
    )
    SELECT
        suggested_user_id,
        username,
        avatar_url,
        full_name,
        followers_count,
        mutual_friends_count,
        mutual_friends_names,
        suggestion_score,
        CASE
            WHEN mutual_friends_count = 1 THEN 'Followed by ' || mutual_friends_count || ' mutual friend'
            WHEN mutual_friends_count <= 3 THEN 'Followed by ' || mutual_friends_count || ' mutual friends'
            ELSE 'Popular in your friend circle'
        END as reason
    FROM potential_friends;
END;
$$ LANGUAGE plpgsql;

-- Function to accept a friend request (creates mutual follow)
CREATE OR REPLACE FUNCTION accept_friend_request(
    from_user_id UUID,
    to_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    existing_request_exists BOOLEAN;
BEGIN
    -- Check if there's a pending follow request
    SELECT EXISTS(
        SELECT 1 FROM follows
        WHERE follower_id = from_user_id
        AND following_id = to_user_id
        AND status = 'pending'
    ) INTO existing_request_exists;

    IF NOT existing_request_exists THEN
        RETURN FALSE;
    END IF;

    -- Accept the existing follow request
    UPDATE follows
    SET status = 'accepted',
        accepted_at = NOW()
    WHERE follower_id = from_user_id
    AND following_id = to_user_id;

    -- Create reciprocal follow if it doesn't exist
    INSERT INTO follows (follower_id, following_id, status, accepted_at)
    VALUES (to_user_id, from_user_id, 'accepted', NOW())
    ON CONFLICT (follower_id, following_id)
    DO UPDATE SET
        status = 'accepted',
        accepted_at = NOW();

    -- Update follower counts
    UPDATE users SET followers_count = followers_count + 1 WHERE id = to_user_id;
    UPDATE users SET followers_count = followers_count + 1 WHERE id = from_user_id;
    UPDATE users SET following_count = following_count + 1 WHERE id = to_user_id;
    UPDATE users SET following_count = following_count + 1 WHERE id = from_user_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_follows_follower_following ON follows(follower_id, following_id);
CREATE INDEX IF NOT EXISTS idx_follows_mutual_lookup ON follows(follower_id, following_id, status, accepted_at);
CREATE INDEX IF NOT EXISTS idx_users_active_verified ON users(is_active, is_verified) WHERE is_active = TRUE;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION are_mutual_friends TO authenticated;
GRANT EXECUTE ON FUNCTION get_mutual_friends TO authenticated;
GRANT EXECUTE ON FUNCTION get_friendship_status TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_feed_with_friends TO authenticated;
GRANT EXECUTE ON FUNCTION get_friend_suggestions TO authenticated;
GRANT EXECUTE ON FUNCTION accept_friend_request TO authenticated;

-- Sample usage queries:
-- SELECT * FROM are_mutual_friends('user-uuid-1', 'user-uuid-2');
-- SELECT * FROM get_mutual_friends('current-user-uuid', 20);
-- SELECT * FROM get_friendship_status('current-user-uuid', 'target-user-uuid');
-- SELECT * FROM get_user_feed_with_friends('current-user-uuid', 20, 0, 'US');
-- SELECT * FROM get_friend_suggestions('current-user-uuid', 10);
-- SELECT accept_friend_request('requester-uuid', 'accepter-uuid');