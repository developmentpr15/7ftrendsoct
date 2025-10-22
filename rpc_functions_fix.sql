-- 7FTRENDS RPC FUNCTIONS
-- Create all required RPC functions that the codebase expects

-- ============================================================================
-- RPC FUNCTION 1: get_user_feed
-- ============================================================================

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
    competition_title TEXT
) AS $$
BEGIN
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
        COALESCE(pr.username, 'unknown') as author_username,
        pr.avatar_url as author_avatar_url,
        COALESCE(pr.full_name, '') as author_full_name,
        EXISTS(
            SELECT 1 FROM likes l
            WHERE l.post_id = p.id
            AND l.user_id = current_user_id
        ) as is_liked,
        NULL::UUID as competition_id,
        NULL::TEXT as competition_title
    FROM posts p
    LEFT JOIN profiles pr ON p.author_id = pr.id
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
        p.created_at DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RPC FUNCTION 2: get_user_recommendations
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_recommendations(
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
        pr.id as recommended_user_id,
        pr.username,
        pr.avatar_url,
        pr.full_name,
        0::BIGINT as followers_count,
        'Suggested for you' as reason,
        0::BIGINT as mutual_friends_count
    FROM profiles pr
    WHERE pr.id != current_user_id
    AND pr.is_public = TRUE
    AND pr.username IS NOT NULL
    AND NOT EXISTS (
        SELECT 1 FROM follows f
        WHERE f.follower_id = current_user_id
        AND f.following_id = pr.id
    )
    ORDER BY RANDOM()
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RPC FUNCTION 3: vote_for_competition_entry
-- ============================================================================

CREATE OR REPLACE FUNCTION vote_for_competition_entry(
    p_entry_id UUID,
    p_voter_country TEXT DEFAULT NULL,
    p_voter_ip TEXT DEFAULT NULL
)
RETURNS TABLE(
    success BOOLEAN,
    vote_id UUID,
    message TEXT
) AS $$
DECLARE
    v_vote_id UUID;
    v_competition_id UUID;
    v_competition_status TEXT;
    v_voter_id UUID := auth.uid();
    v_entry_exists BOOLEAN;
    v_already_voted BOOLEAN;
BEGIN
    -- Validate input
    IF p_entry_id IS NULL OR v_voter_id IS NULL THEN
        RETURN QUERY SELECT false, NULL::UUID, 'Invalid parameters'::TEXT;
        RETURN;
    END IF;

    -- Check if entry exists and get competition info
    SELECT
        competition_id,
        EXISTS (SELECT 1 FROM competition_entries WHERE id = p_entry_id) as entry_exists
    INTO v_competition_id, v_entry_exists
    FROM competition_entries
    WHERE id = p_entry_id;

    IF NOT v_entry_exists THEN
        RETURN QUERY SELECT false, NULL::UUID, 'Competition entry not found'::TEXT;
        RETURN;
    END IF;

    -- Get competition status
    SELECT status INTO v_competition_status
    FROM competitions
    WHERE id = v_competition_id;

    IF v_competition_status != 'voting' THEN
        RETURN QUERY SELECT false, NULL::UUID, 'Competition is not in voting phase'::TEXT;
        RETURN;
    END IF;

    -- Check if user already voted
    SELECT EXISTS (
        SELECT 1 FROM competition_votes
        WHERE entry_id = p_entry_id
        AND voter_id = v_voter_id
    ) INTO v_already_voted;

    IF v_already_voted THEN
        RETURN QUERY SELECT false, NULL::UUID, 'You have already voted for this entry'::TEXT;
        RETURN;
    END IF;

    -- Create the vote
    INSERT INTO competition_votes (
        entry_id,
        competition_id,
        voter_id,
        voter_country,
        voter_ip,
        score,
        created_at
    ) VALUES (
        p_entry_id,
        v_competition_id,
        v_voter_id,
        p_voter_country,
        p_voter_ip,
        1,
        NOW()
    ) RETURNING id INTO v_vote_id;

    -- Update vote count on entry
    UPDATE competition_entries
    SET votes_count = votes_count + 1
    WHERE id = p_entry_id;

    RETURN QUERY SELECT true, v_vote_id, 'Vote recorded successfully'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RPC FUNCTION 4: get_user_voting_status
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_voting_status(
    p_competition_id UUID
)
RETURNS TABLE(
    has_voted BOOLEAN,
    votes_remaining INTEGER,
    total_entries INTEGER
) AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_votes_cast INTEGER;
    v_total_entries INTEGER;
BEGIN
    IF v_user_id IS NULL THEN
        RETURN QUERY SELECT false, 0, 0;
        RETURN;
    END IF;

    -- Get votes cast by this user for this competition
    SELECT COUNT(*) INTO v_votes_cast
    FROM competition_votes cv
    JOIN competition_entries ce ON cv.entry_id = ce.id
    WHERE ce.competition_id = p_competition_id
    AND cv.voter_id = v_user_id;

    -- Get total entries in this competition
    SELECT COUNT(*) INTO v_total_entries
    FROM competition_entries
    WHERE competition_id = p_competition_id
    AND status = 'submitted';

    RETURN QUERY SELECT
        (v_votes_cast > 0) as has_voted,
        GREATEST(v_total_entries - v_votes_cast, 0) as votes_remaining,
        v_total_entries;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RPC FUNCTION 5: get_competition_leaderboard
-- ============================================================================

CREATE OR REPLACE FUNCTION get_competition_leaderboard(
    p_competition_id UUID,
    p_country_filter TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 50
)
RETURNS TABLE(
    entry_id UUID,
    participant_id UUID,
    title TEXT,
    images JSONB,
    votes_count INTEGER,
    final_placement INTEGER,
    participant_username TEXT,
    participant_avatar_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ce.id as entry_id,
        ce.participant_id,
        ce.title,
        ce.images,
        ce.votes_count,
        ce.final_placement,
        COALESCE(pr.username, 'anonymous') as participant_username,
        pr.avatar_url as participant_avatar_url
    FROM competition_entries ce
    LEFT JOIN profiles pr ON ce.participant_id = pr.id
    WHERE ce.competition_id = p_competition_id
    AND ce.status IN ('submitted', 'approved', 'featured')
    AND (
        p_country_filter IS NULL
        OR EXISTS (
            SELECT 1 FROM competition_votes cv
            WHERE cv.entry_id = ce.id
            AND cv.voter_country = p_country_filter
        )
        OR ce.final_placement IS NOT NULL
    )
    ORDER BY
        CASE
            WHEN ce.final_placement IS NOT NULL THEN ce.final_placement
            ELSE ce.votes_count DESC
        END,
        ce.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RPC FUNCTION 6: get_entry_vote_counts
-- ============================================================================

CREATE OR REPLACE FUNCTION get_entry_vote_counts(
    p_entry_id UUID
)
RETURNS TABLE(
    total_votes INTEGER,
    recent_votes INTEGER,
    unique_voters INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(COUNT(*), 0) as total_votes,
        COALESCE(COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 END), 0) as recent_votes,
        COALESCE(COUNT(DISTINCT voter_id), 0) as unique_voters
    FROM competition_votes
    WHERE entry_id = p_entry_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FRIENDSHIP FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION get_friendship_status(
    p_target_user_id UUID
)
RETURNS TABLE(
    status TEXT,
    is_mutual BOOLEAN,
    request_date TIMESTAMPTZ,
    can_request BOOLEAN
) AS $$
DECLARE
    v_current_user_id UUID := auth.uid();
    v_relationship RECORD;
BEGIN
    -- Get existing relationship
    SELECT
        status,
        requested_at,
        (
            SELECT EXISTS (
                SELECT 1 FROM follows f2
                WHERE f2.follower_id = p_target_user_id
                AND f2.following_id = v_current_user_id
                AND f2.status = 'accepted'
            )
        ) as is_mutual
    INTO v_relationship
    FROM follows
    WHERE follower_id = v_current_user_id
    AND following_id = p_target_user_id;

    RETURN QUERY SELECT
        COALESCE(v_relationship.status, 'none') as status,
        COALESCE(v_relationship.is_mutual, false) as is_mutual,
        v_relationship.requested_at,
        (v_relationship.status IS NULL) as can_request;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION are_mutual_friends(
    p_user1_id UUID,
    p_user2_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM follows f1
        JOIN follows f2 ON f1.following_id = f2.follower_id AND f1.follower_id = f2.following_id
        WHERE f1.follower_id = p_user1_id
        AND f1.following_id = p_user2_id
        AND f1.status = 'accepted' AND f2.status = 'accepted'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PERMISSIONS GRANTING
-- ============================================================================

GRANT EXECUTE ON FUNCTION get_user_feed TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_recommendations TO authenticated;
GRANT EXECUTE ON FUNCTION vote_for_competition_entry TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_voting_status TO authenticated;
GRANT EXECUTE ON FUNCTION get_competition_leaderboard TO authenticated;
GRANT EXECUTE ON FUNCTION get_entry_vote_counts TO authenticated;
GRANT EXECUTE ON FUNCTION get_friendship_status TO authenticated;
GRANT EXECUTE ON FUNCTION are_mutual_friends TO authenticated;

-- Grant read permissions to anonymous users where appropriate
GRANT EXECUTE ON FUNCTION get_competition_leaderboard TO anon;

-- ============================================================================
-- SUCCESS VERIFICATION
-- ============================================================================

SELECT '✅ RPC functions created successfully!' as status;
SELECT '📊 Functions created: get_user_feed, get_user_recommendations, voting functions, friendship functions' as functions;

-- Show all created functions
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_type = 'FUNCTION'
AND routine_name IN (
    'get_user_feed',
    'get_user_recommendations',
    'vote_for_competition_entry',
    'get_user_voting_status',
    'get_competition_leaderboard',
    'get_entry_vote_counts',
    'get_friendship_status',
    'are_mutual_friends'
)
ORDER BY routine_name;