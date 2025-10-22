-- SUPABASE CLEANUP RECOMMENDATIONS
-- Run this after executing the analysis script to identify cleanup opportunities

-- First, let's see what RPC functions are being called based on our code analysis
SELECT '=== POTENTIALLY UNUSED FUNCTIONS ===' as section;
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_type = 'FUNCTION'
AND routine_name NOT IN (
    -- Functions we know are being used in the codebase
    'get_user_feed',
    'get_user_recommendations',
    'merge_ai_tags',
    'retry_ai_tagging',
    'vote_for_competition_entry',
    'get_user_voting_status',
    'get_competition_leaderboard',
    'get_entry_vote_counts',
    'determine_competition_winners',
    'get_friendship_status',
    'are_mutual_friends',
    'get_mutual_friends',
    'get_friend_suggestions',
    'accept_friend_request',
    'refresh_feed_scores'
    -- Add more function names as you verify their usage
)
ORDER BY routine_name;

SELECT '=== POTENTIALLY UNUSED TABLES ===' as section;
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name NOT IN (
    -- Tables we know are being used in the codebase
    'profiles',
    'posts',
    'likes',
    'comments',
    'shares',
    'post_saves',
    'follows',
    'users',
    'competitions',
    'competition_entries',
    'competition_leaderboards',
    'points_transactions',
    'notifications',
    'announcements',
    'wardrobe_items',
    'outfit_suggestions',
    'weather_cache',
    'daily_suggestion_summaries',
    'post_engagement',
    'feed_settings',
    'trending_summaries'
    -- Add more table names as you verify their usage
)
ORDER BY table_name;

-- Check for indexes with zero or very low usage
SELECT '=== UNUSED INDEXES ===' as section;
SELECT
    schemaname,
    relname as tablename,
    indexrelname as indexname,
    idx_scan as index_scans,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
AND idx_scan = 0  -- Never used
ORDER BY pg_relation_size(indexrelid) DESC;

-- Check for functions that haven't been called (if available)
SELECT '=== FUNCTION USAGE INFO ===' as section;
SELECT
    routine_name,
    'Usage stats may not be available in this PostgreSQL version' as note
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- Find duplicate or similar functions
SELECT '=== POTENTIALLY DUPLICATE FUNCTIONS ===' as section;
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%feed%'
ORDER BY routine_name;

SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%recommend%'
ORDER BY routine_name;

SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%friend%'
ORDER BY routine_name;

-- Check for large tables that might need optimization
SELECT '=== LARGE TABLES ===' as section;
SELECT
    schemaname,
    relname as tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||relname)) AS total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||relname)) AS table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||relname) - pg_relation_size(schemaname||'.'||relname)) AS index_size,
    n_live_tup as live_rows,
    n_dead_tup as dead_rows
FROM pg_stat_user_tables
WHERE schemaname = 'public'
AND pg_total_relation_size(schemaname||'.'||relname) > 10 * 1024 * 1024  -- Larger than 10MB
ORDER BY pg_total_relation_size(schemaname||'.'||relname) DESC;

SELECT '🧹 Cleanup analysis completed!' as status;
SELECT 'Review the results above to identify cleanup opportunities' as next_step;