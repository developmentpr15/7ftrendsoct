-- SAFE CLEANUP SCRIPT FOR SUPABASE
-- EXECUTE IN SECTIONS AND VERIFY EACH STEP

-- ===================================================================
-- WARNING: This script will drop unused resources.
-- Review the analysis results first and comment out any items you want to keep.
-- ===================================================================

-- Step 1: Clean up unused indexes (safest operation)
SELECT '🔍 Checking unused indexes...' as status;

-- Find and drop unused indexes (commented out for safety - review first)
/*
DROP INDEX IF EXISTS CONCURRENTLY index_name_here;
DROP INDEX IF EXISTS CONCURRENTLY another_index_name_here;
*/

-- Step 2: Remove duplicate or obsolete functions
SELECT '🧹 Cleaning up duplicate functions...' as status;

-- Remove old feed function versions (if they exist)
DROP FUNCTION IF EXISTS get_user_feed_simple(UUID, INTEGER, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS get_user_recommendations_simple(UUID, INTEGER) CASCADE;

-- Remove country boost function (no longer used)
DROP FUNCTION IF EXISTS get_country_boost(TEXT, TEXT) CASCADE;

-- Step 3: Clean up old temporary tables that might exist
SELECT '🗑️ Cleaning up temporary tables...' as status;

DROP TABLE IF EXISTS temp_mutual_friends_posts CASCADE;
DROP TABLE IF EXISTS temp_following_posts CASCADE;
DROP TABLE IF EXISTS temp_own_posts CASCADE;
DROP TABLE IF EXISTS temp_trending_posts CASCADE;
DROP TABLE IF EXISTS temp_competition_posts CASCADE;

-- Step 4: Remove obsolete triggers if they exist
SELECT '⚙️ Cleaning up obsolete triggers...' as status;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_updated_at_column ON profiles;

-- Step 5: Optimize table storage (rebuild indexes and update statistics)
SELECT '📊 Optimizing table storage...' as status;

-- Analyze tables to update query planner statistics
ANALYZE profiles;
ANALYZE posts;
ANALYZE likes;
ANALYZE comments;
ANALYZE shares;
ANALYZE follows;
ANALYZE competitions;
ANALYZE competition_entries;

-- Step 6: Clean up old RLS policies that might be duplicated
SELECT '🔐 Cleaning up duplicate RLS policies...' as status;

-- Remove old policies if they exist (these will be recreated if needed)
DROP POLICY IF EXISTS "Users can view public profiles" ON profiles CASCADE;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles CASCADE;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles CASCADE;
DROP POLICY IF EXISTS "Users can delete their own profile" ON profiles CASCADE;

-- Step 7: VACUUM tables to reclaim space
SELECT '🧹 Reclaiming disk space...' as status;

-- Note: VACUUM FULL locks tables, so run during maintenance window
-- VACUUM FULL profiles;
-- VACUUM FULL posts;

-- Use regular VACUUM for maintenance (doesn't lock tables)
VACUUM profiles;
VACUUM posts;
VACUUM likes;
VACUUM comments;
VACUUM shares;
VACUUM follows;

-- Step 8: Set up maintenance recommendations
SELECT '📋 Creating maintenance recommendations...' as status;

-- Create a view for monitoring table sizes
CREATE OR REPLACE VIEW table_sizes AS
SELECT
    schemaname,
    relname as tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||relname)) AS size,
    pg_total_relation_size(schemaname||'.'||relname) AS size_bytes,
    n_live_tup as live_rows,
    n_dead_tup as dead_rows
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||relname) DESC;

-- Create a view for monitoring index usage
CREATE OR REPLACE VIEW index_usage AS
SELECT
    schemaname,
    relname as tablename,
    indexrelname as indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
    CASE
        WHEN idx_scan = 0 THEN 'UNUSED - Consider dropping'
        WHEN idx_scan < 10 THEN 'Low usage - Review necessity'
        ELSE 'Active'
    END as recommendation
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan ASC;

SELECT '✅ Safe cleanup completed!' as status;
SELECT '📊 Created monitoring views: table_sizes and index_usage' as info;
SELECT '🔄 Regular maintenance: Run ANALYZE on busy tables weekly' as maintenance_tip;
SELECT '💾 Consider VACUUM FULL during maintenance windows for heavily updated tables' as space_tip;

-- Show final state
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_type = 'FUNCTION'
ORDER BY routine_name;

SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;