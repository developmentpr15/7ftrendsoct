-- SIMPLE SUPABASE ANALYSIS - Compatible with all PostgreSQL versions
-- Run this to see what resources you have without complex queries

-- Step 1: List all tables
SELECT '=== ALL TABLES ===' as section;
SELECT
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Step 2: List all functions
SELECT '=== ALL FUNCTIONS ===' as section;
SELECT
    routine_name,
    routine_type,
    security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- Step 3: List all indexes
SELECT '=== ALL INDEXES ===' as section;
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Step 4: List RLS policies
SELECT '=== RLS POLICIES ===' as section;
SELECT
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Step 5: List triggers
SELECT '=== TRIGGERS ===' as section;
SELECT
    event_object_table,
    trigger_name,
    action_timing,
    action_orientation,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- Step 6: Show table sizes (basic version)
SELECT '=== TABLE SIZES ===' as section;
SELECT
    schemaname,
    relname as table_name,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||relname)) as total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||relname)) as table_size,
    (pg_total_relation_size(schemaname||'.'||relname) - pg_relation_size(schemaname||'.'||relname)) as index_size_bytes
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||relname) DESC;

-- Step 7: Show row counts for all tables
SELECT '=== ROW COUNTS ===' as section;
DO $$
DECLARE
    table_record RECORD;
    row_count BIGINT;
BEGIN
    RAISE NOTICE '=== ROW COUNTS FOR ALL TABLES ===';
    FOR table_record IN
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name
    LOOP
        EXECUTE format('SELECT COUNT(*) FROM %I', table_record.table_name) INTO row_count;
        RAISE NOTICE '%: % rows', table_record.table_name, row_count;
    END LOOP;
END $$;

SELECT '✅ Simple analysis completed!' as status;
SELECT '📊 Check the output above to see all your Supabase resources' as info;