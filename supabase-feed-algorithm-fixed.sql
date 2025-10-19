 -- This script will replace the existing feed algorithm functions with a corrected version.
 -- Please run the entire script in your Supabase SQL Editor.
 
 -- Intelligent Feed Algorithm for 7Ftrends (Fixed Version)
 -- Weighted: 35% mutual friends + 25% following + 10% own + 20% trending + 10% competitions
 -- With time-decay scoring and friendship-based prioritization
 -- NO COUNTRY DEPENDENCIES - Compatible with existing database schema
 
 -- First, create necessary helper functions
 
 -- Function to calculate time-decay score for trending posts
 DROP FUNCTION IF EXISTS calculate_trending_score(uuid, timestamp with time zone);
 CREATE OR REPLACE FUNCTION calculate_trending_score(
     p_post_id UUID,
     base_time TIMESTAMPTZ DEFAULT NOW()
 )
 RETURNS DECIMAL AS $$
 DECLARE
     post_created TIMESTAMPTZ;
     hours_since_post DECIMAL;
     likes_count INTEGER;
     comments_count INTEGER;
     shares_count INTEGER;
     engagement_score DECIMAL;
     time_decay_factor DECIMAL;
     trending_score DECIMAL;
 BEGIN
     -- Get post data
     SELECT
         p.created_at,
         COALESCE(p.likes_count, 0),
         COALESCE(p.comments_count, 0),
         COALESCE(p.shares_count, 0)
     INTO post_created, likes_count, comments_count, shares_count
     FROM posts p
     WHERE p.id = p_post_id;

     IF NOT FOUND THEN
         RETURN 0;
     END IF;

     -- Calculate hours since post creation
     hours_since_post := EXTRACT(EPOCH FROM (base_time - post_created)) / 3600;

     -- Base engagement score (weighted engagement)
     engagement_score := (likes_count * 1.0) + (comments_count * 2.0) + (shares_count * 3.0);

     -- Time decay factor (posts lose value over time)
     -- Decay formula: e^(-hours/72) where 72 hours = 3 days half-life
     time_decay_factor := EXP(-hours_since_post / 72);

     -- Final trending score
     trending_score := engagement_score * time_decay_factor;

     RETURN trending_score;
 END;
 $$ LANGUAGE plpgsql IMMUTABLE;

 -- Main feed function (fixed - no country dependencies)
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
     v_mutual_friends_count INTEGER;
     v_following_count INTEGER;
     v_own_posts_count INTEGER;
     v_trending_count INTEGER;
     v_competition_count INTEGER;
 BEGIN
     -- Calculate how many posts we need from each category
     -- 35% mutual friends, 25% following, 10% own, 20% trending, 10% competitions
     v_mutual_friends_count := CEIL(limit_count * 0.35);
     v_following_count := CEIL(limit_count * 0.25);
     v_own_posts_count := CEIL(limit_count * 0.10);
     v_trending_count := CEIL(limit_count * 0.20);
     v_competition_count := limit_count - v_mutual_friends_count - v_following_count - v_own_posts_count - v_trending_count;

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
     LIMIT v_mutual_friends_count + 3;

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
     LIMIT v_following_count + 3;

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
     LIMIT v_own_posts_count + 2;

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
         calculate_trending_score(p.id) as trending_score,
         'trending' as feed_type,
         'discover' as relationship_type,
         u.username as author_username,
         u.avatar_url as author_avatar_url,
         u.full_name as author_full_name,
         EXISTS(SELECT 1 FROM likes l WHERE l.post_id = p.id AND l.user_id = current_user_id) as is_liked,
         NULL::UUID as competition_id,
         NULL::TEXT as competition_title,
         1.0 as friendship_boost,
         ROW_NUMBER() OVER (ORDER BY calculate_trending_score(p.id) DESC) as row_num
     FROM posts p
     JOIN users u ON p.author_id = u.id
     WHERE p.visibility = 'public'
     AND NOT p.is_archived
     AND p.created_at >= NOW() - INTERVAL '7 days' -- Only posts from last week for trending
     AND p.id NOT IN (SELECT post_id FROM temp_mutual_friends_posts WHERE post_id IS NOT NULL)
     AND p.id NOT IN (SELECT post_id FROM temp_following_posts WHERE post_id IS NOT NULL)
     AND p.id NOT IN (SELECT post_id FROM temp_own_posts WHERE post_id IS NOT NULL)
     ORDER BY trending_score DESC
     LIMIT v_trending_count + 5;

     -- Get competition posts (if competition_entries table exists)
     BEGIN
         -- Try to get competition posts, but handle gracefully if table doesn't exist
         CREATE TEMPORARY TABLE IF NOT EXISTS temp_competition_posts AS
         SELECT
             ce.id as post_id, -- Using competition entry as the "post"
             ce.participant_id as author_id,
             ce.description as content,
             ce.images,
             ce.submitted_at as created_at,
             ce.votes_count as likes_count,
             0 as comments_count,
             0 as shares_count,
             calculate_trending_score(ce.id, NOW()) * 1.5 as trending_score, -- Boost competition posts
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
         AND ce.submitted_at >= NOW() - INTERVAL '14 days' -- Competition entries from last 2 weeks
         AND ce.id NOT IN (SELECT post_id FROM temp_mutual_friends_posts WHERE post_id IS NOT NULL)
         AND ce.id NOT IN (SELECT post_id FROM temp_following_posts WHERE post_id IS NOT NULL)
         AND ce.id NOT IN (SELECT post_id FROM temp_own_posts WHERE post_id IS NOT NULL)
         AND ce.id NOT IN (SELECT post_id FROM temp_trending_posts WHERE post_id IS NOT NULL)
         ORDER BY ce.submitted_at DESC
         LIMIT v_competition_count + 3;
     EXCEPTION WHEN undefined_table THEN
         -- competition_entries table doesn't exist, create empty table
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
     END;

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
         WHERE row_num <= v_mutual_friends_count

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
         WHERE row_num <= v_following_count

         UNION ALL

         -- Trending posts (20% weight, lower priority)
         SELECT
             post_id, author_id, content, images, created_at,
             likes_count, comments_count, shares_count, trending_score,
             feed_type, relationship_type, author_username, author_avatar_url, author_full_name,
             is_liked, competition_id, competition_title, friendship_boost
         FROM temp_trending_posts
         WHERE row_num <= v_trending_count

         UNION ALL

         -- Competition posts (10% weight)
         SELECT
             post_id, author_id, content, images, created_at,
             likes_count, comments_count, shares_count, trending_score,
             feed_type, relationship_type, author_username, author_avatar_url, author_full_name,
             is_liked, competition_id, competition_title, friendship_boost
         FROM temp_competition_posts
         WHERE row_num <= v_competition_count
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

 -- Function to get personalized recommendations (fixed username ambiguity)
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

 -- Function to refresh feed scores (could be run periodically)
 CREATE OR REPLACE FUNCTION refresh_feed_scores()
 RETURNS VOID AS $$
 BEGIN
     -- Update posts with real-time engagement data using LEFT JOINs
     UPDATE posts p SET
         likes_count = COALESCE(like_counts.like_count, 0),
         comments_count = COALESCE(comment_counts.comment_count, 0),
         shares_count = COALESCE(share_counts.share_count, 0)
     FROM (
         SELECT
             post_id,
             COUNT(*) as like_count
         FROM likes
         GROUP BY post_id
     ) like_counts
     LEFT JOIN (
         SELECT
             post_id,
             COUNT(*) as comment_count
         FROM comments
         GROUP BY post_id
     ) comment_counts ON p.id = comment_counts.post_id
     LEFT JOIN (
         SELECT
             post_id,
             COUNT(*) as share_count
         FROM shares
         GROUP BY post_id
     ) share_counts ON p.id = share_counts.post_id
     WHERE p.id = like_counts.post_id;

     -- For posts with no engagement, ensure defaults
     UPDATE posts SET
         likes_count = 0,
         comments_count = 0,
         shares_count = 0
     WHERE likes_count IS NULL
     OR comments_count IS NULL
     OR shares_count IS NULL;

     RAISE NOTICE 'Feed scores refreshed successfully';
 END;
 $$ LANGUAGE plpgsql;

 -- Grant necessary permissions
 GRANT EXECUTE ON FUNCTION get_user_feed TO authenticated;
 GRANT EXECUTE ON FUNCTION get_user_recommendations TO authenticated;
 GRANT EXECUTE ON FUNCTION calculate_trending_score TO authenticated;
 GRANT EXECUTE ON FUNCTION refresh_feed_scores TO authenticated;

 -- Create indexes for better performance
 CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
 CREATE INDEX IF NOT EXISTS idx_posts_visibility ON posts(visibility);
 CREATE INDEX IF NOT EXISTS idx_posts_author_created ON posts(author_id, created_at DESC);
 CREATE INDEX IF NOT EXISTS idx_follows_follower_status ON follows(follower_id, status);
 CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
 CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
 CREATE INDEX IF NOT EXISTS idx_users_followers_count ON users(followers_count DESC);

 -- Create indexes for competition tables if they exist
 DO $$
 BEGIN
     BEGIN
         CREATE INDEX IF NOT EXISTS idx_competition_entries_submitted ON competition_entries(submitted_at DESC);
     EXCEPTION WHEN undefined_table THEN
         NULL; -- Table doesn't exist, skip index creation
     END;

     BEGIN
         CREATE INDEX IF NOT EXISTS idx_competitions_status ON competitions(status);
     EXCEPTION WHEN undefined_table THEN
         NULL; -- Table doesn't exist, skip index creation
     END;

     BEGIN
         CREATE INDEX IF NOT EXISTS idx_votes_entry_id ON votes(entry_id);
     EXCEPTION WHEN undefined_table THEN
         NULL; -- Table doesn't exist, skip index creation
     END;
 END $$;

 -- Sample usage queries:
 -- SELECT * FROM get_user_feed('user-uuid-here', 20, 0);
 -- SELECT * FROM get_user_recommendations('user-uuid-here', 10);

                                            