-- Sample Data for Gamification and Engagement System
-- Use this to test the newly created P0 tables

-- ============================================================================
-- SAMPLE POST ENGAGEMENT DATA
-- ============================================================================

-- Note: This assumes you have existing posts and users
-- Replace UUIDs with actual user and post IDs from your database

-- Sample post engagement records (example UUIDs - replace with real ones)
INSERT INTO post_engagement (post_id, user_id, engagement_type, engagement_value, metadata) VALUES
-- Post 1 engagement
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'like', 1.0, '{"source": "feed"}'),
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', 'like', 1.0, '{"source": "profile"}'),
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004', 'comment', 2.0, '{"comment_length": 45, "source": "feed"}'),
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440005', 'share', 3.0, '{"platform": "instagram", "source": "feed"}'),
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440006', 'view', 0.1, '{"source": "hashtag"}'),
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440007', 'save', 1.5, '{"source": "feed"}'),

-- Post 2 engagement
('550e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440009', 'like', 1.0, '{"source": "trending"}'),
('550e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440010', 'like', 1.0, '{"source": "competition"}'),
('550e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440011', 'comment', 2.0, '{"comment_length": 23, "source": "trending"}'),
('550e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440012', 'share', 3.0, '{"platform": "twitter", "source": "profile"}')

ON CONFLICT DO NOTHING;

-- ============================================================================
-- SAMPLE COMPETITION ENTRIES
-- ============================================================================

-- Note: This assumes you have existing competitions and users
-- Replace UUIDs with actual competition and user IDs

INSERT INTO competition_entries (
    competition_id,
    participant_id,
    post_id,
    title,
    description,
    images,
    outfit_items,
    style_tags,
    status
) VALUES
-- Summer Vibes USA Competition entries
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440001', 'Beach Day Chic', 'Perfect summer outfit for a beach day with friends', '["https://picsum.photos/seed/summer1/400/500"]', '["white sundress", "straw hat", "sandals", "sunglasses"]', ARRAY['casual', 'summer', 'beach'], 'submitted'),

('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440008', 'Urban Summer Style', 'City-friendly summer look that keeps you cool and stylish', '["https://picsum.photos/seed/summer2/400/500"]', '["linen shirt", "chinos", "loafers", "canvas belt"]', ARRAY['urban', 'summer', 'smart-casual'], 'approved'),

-- Office Style Europe Competition entries
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440015', NULL, 'Professional Parisian', 'Elegant business attire with European sophistication', '["https://picsum.photos/seed/office1/400/500", "https://picsum.photos/seed/office1-detail/400/500"]', '["navy blazer", "white shirt", "gray trousers", "oxford shoes", "leather belt"]', ARRAY['professional', 'business', 'european'], 'submitted'),

('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440016', NULL, 'Modern Milan Look', 'Contemporary Italian office style with a creative twist', '["https://picsum.photos/seed/office2/400/500"]', '["charcoal suit", "blue shirt", "patterned tie", "brown shoes", "watch"]', ARRAY['professional', 'modern', 'italian'], 'featured')

ON CONFLICT (competition_id, participant_id) WHERE status NOT IN ('withdrawn', 'rejected') DO NOTHING;

-- ============================================================================
-- SAMPLE VOTES
-- ============================================================================

INSERT INTO votes (
    entry_id,
    voter_id,
    competition_id,
    score,
    vote_type,
    feedback,
    criteria_scores,
    is_anonymous
) VALUES
-- Votes for Summer Vibes entries
('770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440017', '660e8400-e29b-41d4-a716-446655440001', 8, 'public', 'Love the beach vibes! Perfect for summer', '{"creativity": 8, "style": 8, "appropriateness": 9}', false),

('770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440018', '660e8400-e29b-41d4-a716-446655440001', 7, 'public', 'Great color choices!', '{"creativity": 7, "style": 7, "appropriateness": 8}', true),

('770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440019', '660e8400-e29b-41d4-a716-446655440001', 9, 'public', 'Very stylish and professional look', '{"creativity": 9, "style": 9, "appropriateness": 9}', false),

-- Votes for Office Style entries (judge votes)
('770e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440020', '660e8400-e29b-41d4-a716-446655440002', 9, 'judge', 'Excellent professional presentation with European elegance', '{"professionalism": 9, "creativity": 8, "brand_representation": 9, "overall_appeal": 9}', false),

('770e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440021', '660e8400-e29b-41d4-a716-446655440002', 8, 'judge', 'Strong Italian influence, well-coordinated outfit', '{"professionalism": 8, "creativity": 9, "brand_representation": 8, "overall_appeal": 8}', false)

ON CONFLICT (entry_id, voter_id) WHERE vote_type = 'public' DO NOTHING;

-- ============================================================================
-- SAMPLE POINTS TRANSACTIONS
-- ============================================================================

INSERT INTO points_transactions (
    user_id,
    transaction_type,
    points_amount,
    reference_id,
    reference_type,
    description,
    balance_before,
    balance_after
) VALUES
-- Points for receiving likes
('550e8400-e29b-41d4-a716-446655440013', 'post_like_received', 5, '550e8400-e29b-41d4-a716-446655440001', 'post', 'Received a like on your post', 0, 5),
('550e8400-e29b-41d4-a716-446655440013', 'post_like_received', 5, '550e8400-e29b-41d4-a716-446655440001', 'post', 'Received another like on your post', 5, 10),

-- Points for receiving comments
('550e8400-e29b-41d4-a716-446655440013', 'post_comment_received', 10, '550e8400-e29b-41d4-a716-446655440001', 'post', 'Received a comment on your post', 10, 20),

-- Points for shares
('550e8400-e29b-41d4-a716-446655440013', 'post_share_received', 15, '550e8400-e29b-41d4-a716-446655440001', 'post', 'Someone shared your post', 20, 35),

-- Points for competition entry
('550e8400-e29b-41d4-a716-446655440015', 'competition_entry', 25, '660e8400-e29b-41d4-a716-446655440002', 'competition', 'Entered Office Style Europe competition', 0, 25),

-- Points for receiving competition votes
('550e8400-e29b-41d4-a716-446655440015', 'competition_vote_received', 3, '770e8400-e29b-41d4-a716-446655440003', 'competition_entry', 'Received a vote on your competition entry', 25, 28),

-- Points for daily login (for multiple users)
('550e8400-e29b-41d4-a716-446655440022', 'daily_login', 2, NULL, NULL, 'Daily login bonus', 0, 2),
('550e8400-e29b-41d4-a716-446655440023', 'daily_login', 2, NULL, NULL, 'Daily login bonus', 0, 2),

-- Points for first post
('550e8400-e29b-41d4-a716-446655440024', 'first_post', 50, '550e8400-e29b-41d4-a716-446655440010', 'post', 'Welcome bonus for your first post!', 0, 50),

-- Points for profile completion
('550e8400-e29b-41d4-a716-446655440025', 'profile_complete', 20, NULL, NULL, 'Completed your profile setup', 0, 20),

-- Points for trending post
('550e8400-e29b-41d4-a716-446655440014', 'trending_post', 100, '550e8400-e29b-41d4-a716-446655440008', 'post', 'Your post made it to trending!', 0, 100)

ON CONFLICT DO NOTHING;

-- ============================================================================
-- UPDATE FEED SETTINGS (SAMPLE CONFIGURATION)
-- ============================================================================

-- Example of updating feed settings for different environments
UPDATE feed_settings SET setting_value = 0.40 WHERE setting_key = 'mutual_friends_weight'; -- Increase friends weight
UPDATE feed_settings SET setting_value = 0.15 WHERE setting_key = 'trending_weight'; -- Decrease trending weight
UPDATE feed_settings SET setting_value = 2.5 WHERE setting_key = 'mutual_friends_boost'; -- Increase friends boost
UPDATE feed_settings SET setting_value = 48.0 WHERE setting_key = 'trending_decay_hours'; -- Faster decay for trending

-- ============================================================================
-- TEST THE NEW FUNCTIONS
-- ============================================================================

-- Test user points balance calculation
SELECT
    user_id::text as user_id,
    get_user_points_balance(user_id) as calculated_balance,
    COALESCE(SUM(points_amount), 0) as raw_sum
FROM points_transactions
GROUP BY user_id
ORDER BY calculated_balance DESC;

-- Test awarding points to a user
SELECT award_points_to_user(
    '550e8400-e29b-41d4-a716-446655440026'::uuid,
    15,
    'streak_bonus',
    NULL,
    NULL,
    '3-day login streak bonus!'
) as new_transaction_id;

-- Test trending posts calculation
SELECT * FROM get_trending_posts_with_engagement(5, 0, 72); -- Top 5 posts from last 72 hours

-- Test competition leaderboard
SELECT * FROM get_competition_leaderboard_with_scores('660e8400-e29b-41d4-a716-446655440001'::uuid, 10, 0);

-- Test engagement rates
SELECT
    p.id::text as post_id,
    p.content,
    COUNT(pe.id) as total_engagements,
    AVG(pe.engagement_value) as avg_engagement_value,
    CASE
        WHEN p.created_at > NOW() - INTERVAL '1 hour' THEN
            COUNT(pe.id)::DECIMAL / 60
        ELSE
            COUNT(pe.id)::DECIMAL / EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 3600
    END as engagement_rate_per_hour
FROM posts p
LEFT JOIN post_engagement pe ON p.id = pe.post_id
WHERE p.created_at >= NOW() - INTERVAL '7 days'
GROUP BY p.id, p.content, p.created_at
ORDER BY engagement_rate_per_hour DESC
LIMIT 10;

-- ============================================================================
-- SUMMARY REPORT
-- ============================================================================

SELECT 'Sample Data Insertion Complete!' as status,
       NOW() as insertion_time;

-- Show counts for each table
SELECT 'post_engagement' as table_name, COUNT(*) as record_count FROM post_engagement
UNION ALL
SELECT 'competition_entries', COUNT(*) FROM competition_entries
UNION ALL
SELECT 'votes', COUNT(*) FROM votes
UNION ALL
SELECT 'points_transactions', COUNT(*) FROM points_transactions
UNION ALL
SELECT 'feed_settings', COUNT(*) FROM feed_settings
ORDER BY table_name;