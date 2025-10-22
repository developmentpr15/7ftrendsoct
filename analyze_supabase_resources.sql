-- SUPABASE RESOURCE ANALYSIS
-- Run this script to see what tables, functions, and queries exist
-- This will help identify unnecessary or unused resources

-- Step 1: Check all tables in the public schema
SELECT
    table_name,
    table_type,
    COALESCE(obj_description(c.oid), 'No description') as description
FROM information_schema.tables t
LEFT JOIN pg_class c ON c.relname = t.table_name
WHERE t.table_schema = 'public'
ORDER BY table_name;

-- Step 2: Check table sizes and row counts
SELECT
    schemaname,
    relname as tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||relname)) AS size,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_rows,
    n_dead_tup as dead_rows
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||relname) DESC;

-- Step 3: Check all custom functions
SELECT
    routine_name,
    routine_type,
    security_type,
    external_language,
    COALESCE(obj_description(p.oid), 'No description') as description
FROM information_schema.routines r
LEFT JOIN pg_proc p ON p.proname = r.routine_name
WHERE r.routine_schema = 'public'
ORDER BY routine_name;

-- Step 4: Check function usage statistics (if available)
SELECT
    schemaname,
    funcname,
    calls,
    total_time,
    mean_time,
    self_time
FROM pg_stat_user_functions
WHERE schemaname = 'public'
ORDER BY calls DESC;

-- Step 5: Check indexes that might be unnecessary
SELECT
    schemaname,
    relname as tablename,
    indexrelname as indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan ASC;

-- Step 6: Check for temporary tables that might not have been cleaned up
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
AND (tablename LIKE 'temp_%' OR tablename LIKE '%temp%')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Step 7: Check RLS policies on all tables
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Step 8: Check triggers that might be causing performance issues
SELECT
    event_object_schema,
    event_object_table,
    trigger_name,
    action_timing,
    action_orientation,
    action_condition,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- Step 9: Check for any stored procedures or complex queries
SELECT
    schemaname,
    viewname,
    definition
FROM pg_views
WHERE schemaname = 'public'
ORDER BY viewname;

-- Step 10: Check foreign key relationships that might be unused
SELECT
    tc.table_schema,
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema='public';

SELECT '📊 Supabase resource analysis completed!' as status;