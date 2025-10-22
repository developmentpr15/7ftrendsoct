-- SAFE CLEANUP SCRIPT FOR SUPABASE (Fixed Version)
-- EXECUTE IN SECTIONS AND VERIFY EACH STEP

-- ===================================================================
-- WARNING: This script will drop unused resources.
-- Review the analysis results first and comment out any items you want to keep.
-- ===================================================================

-- Step 1: Check what tables actually exist first
SELECT '🔍 Checking existing tables...' as status;

DO $$
DECLARE
    table_record RECORD;
    table_exists BOOLEAN;
BEGIN
    RAISE NOTICE '=== CHECKING TABLE EXISTENCE ===';
    FOR table_record IN
        SELECT 'profiles' as table_name UNION
        SELECT 'posts' UNION
        SELECT 'likes' UNION
        SELECT 'comments' UNION
        SELECT 'shares' UNION
        SELECT 'follows' UNION
        SELECT 'competitions' UNION
        SELECT 'competition_entries' UNION
        SELECT 'users' UNION
        SELECT 'wardrobe_items' UNION
        SELECT 'notifications' UNION
        SELECT 'points_transactions' UNION
        SELECT 'announcements' UNION
        SELECT 'post_saves'
    LOOP
        EXECUTE format('SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = %L AND table_name = %L)', 'public', table_record.table_name) INTO table_exists;
        IF table_exists THEN
            RAISE NOTICE 'Table % exists ✓', table_record.table_name;
        ELSE
            RAISE NOTICE 'Table % does not exist ✗', table_record.table_name;
        END IF;
    END LOOP;
END $$;

-- Step 2: Clean up duplicate or obsolete functions
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

-- Only try to drop triggers if the table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
        DROP TRIGGER IF EXISTS update_updated_at_column ON profiles;
        RAISE NOTICE 'Cleaned up profile triggers';
    END IF;
END $$;

-- Step 5: Optimize table storage (rebuild indexes and update statistics)
SELECT '📊 Optimizing table storage...' as status;

-- Safely analyze only existing tables
DO $$
DECLARE
    table_name TEXT;
    table_list TEXT[] := ARRAY['profiles', 'posts', 'likes', 'comments', 'follows', 'competitions', 'competition_entries', 'users', 'wardrobe_items'];
BEGIN
    FOREACH table_name IN ARRAY table_list
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = table_name) THEN
            EXECUTE format('ANALYZE %I', table_name);
            RAISE NOTICE 'Analyzed table: %', table_name;
        END IF;
    END LOOP;
END $$;

-- Step 6: Clean up old RLS policies that might be duplicated
SELECT '🔐 Cleaning up duplicate RLS policies...' as status;

-- Only attempt to clean up policies if profiles table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        DROP POLICY IF EXISTS "Users can view public profiles" ON profiles CASCADE;
        DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles CASCADE;
        DROP POLICY IF EXISTS "Users can update their own profile" ON profiles CASCADE;
        DROP POLICY IF EXISTS "Users can delete their own profile" ON profiles CASCADE;
        RAISE NOTICE 'Cleaned up old RLS policies';
    END IF;
END $$;

-- Step 7: VACUUM tables to reclaim space (only existing tables)
SELECT '🧹 Reclaiming disk space...' as status;

DO $$
DECLARE
    table_name TEXT;
    table_list TEXT[] := ARRAY['profiles', 'posts', 'likes', 'comments', 'follows'];
BEGIN
    FOREACH table_name IN ARRAY table_list
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = table_name) THEN
            EXECUTE format('VACUUM %I', table_name);
            RAISE NOTICE 'Vacuumed table: %', table_name;
        END IF;
    END LOOP;
END $$;

-- Step 8: Set up maintenance recommendations (only if needed views don't exist)
SELECT '📋 Creating maintenance recommendations...' as status;

-- Create monitoring views only if they don't already exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'table_sizes') THEN
        EXECUTE '
        CREATE VIEW table_sizes AS
        SELECT
            schemaname,
            relname as table_name,
            pg_size_pretty(pg_total_relation_size(schemaname||''.''||relname)) AS size,
            pg_total_relation_size(schemaname||''.''||relname) AS size_bytes,
            n_live_tup as live_rows,
            n_dead_tup as dead_rows
        FROM pg_stat_user_tables
        WHERE schemaname = ''public''
        ORDER BY pg_total_relation_size(schemaname||''.''||relname) DESC';
        RAISE NOTICE 'Created table_sizes view';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'index_usage') THEN
        EXECUTE '
        CREATE VIEW index_usage AS
        SELECT
            schemaname,
            relname as tablename,
            indexrelname as indexname,
            idx_scan as index_scans,
            idx_tup_read as tuples_read,
            idx_tup_fetch as tuples_fetched,
            pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
            CASE
                WHEN idx_scan = 0 THEN ''UNUSED - Consider dropping''
                WHEN idx_scan < 10 THEN ''Low usage - Review necessity''
                ELSE ''Active''
            END as recommendation
        FROM pg_stat_user_indexes
        WHERE schemaname = ''public''
        ORDER BY idx_scan ASC';
        RAISE NOTICE 'Created index_usage view';
    END IF;
END $$;

SELECT '✅ Safe cleanup completed!' as status;
SELECT '📊 Created monitoring views (if they didn''t exist): table_sizes and index_usage' as info;
SELECT '🔄 Regular maintenance: Run ANALYZE on busy tables weekly' as maintenance_tip;
SELECT '💾 Consider VACUUM FULL during maintenance windows for heavily updated tables' as space_tip;

-- Show final state
SELECT '=== FINAL FUNCTION LIST ===' as section;
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_type = 'FUNCTION'
ORDER BY routine_name;

SELECT '=== FINAL TABLE LIST ===' as section;
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;