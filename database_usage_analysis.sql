-- DATABASE USAGE ANALYSIS
-- Run this to identify unused database functions and tables

-- Step 1: Show all current functions
SELECT '=== ALL DATABASE FUNCTIONS ===' as section;
SELECT
    routine_name,
    routine_type,
    security_type,
    external_language
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- Step 2: Show all current tables
SELECT '=== ALL DATABASE TABLES ===' as section;
SELECT
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Step 3: Show function call statistics (if available)
SELECT '=== FUNCTION USAGE STATISTICS ===' as section;
SELECT
    'Function usage stats may not be available in this PostgreSQL version' as note,
    'Check application logs for actual usage patterns' as recommendation;

-- Step 4: Identify potentially unused functions based on naming patterns
SELECT '=== POTENTIALLY UNUSED FUNCTIONS ===' as section;
SELECT
    routine_name,
    'Potentially unused (old/broken naming)' as reason
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_type = 'FUNCTION'
AND (
    routine_name LIKE '%test%'
    OR routine_name LIKE '%temp%'
    OR routine_name LIKE '%old%'
    OR routine_name LIKE '%backup%'
    OR routine_name LIKE '%_v1'  -- Version 1 functions
    OR routine_name LIKE '%_v2'  -- Version 2 functions
)
ORDER BY routine_name;

-- Step 5: Show indexes that might be unused
SELECT '=== INDEX USAGE ANALYSIS ===' as section;
SELECT
    relname as tablename,
    indexrelname as indexname,
    idx_scan as index_scans,
    CASE
        WHEN idx_scan = 0 THEN 'UNUSED - Safe to drop'
        WHEN idx_scan < 10 THEN 'Low usage - Review'
        ELSE 'Active - Keep'
    END as recommendation
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan ASC;

-- Step 6: Check for foreign key relationships that might indicate unused tables
SELECT '=== TABLE RELATIONSHIPS ===' as section;
SELECT
    tc.table_name as table_name,
    tc.constraint_name as constraint_name,
    ccu.table_name as foreign_table_name,
    tc.constraint_type
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu
  ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name;

SELECT '✅ Database analysis completed!' as status;
SELECT '📊 Review the results above to identify unused database resources' as info;