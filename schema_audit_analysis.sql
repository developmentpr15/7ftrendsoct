-- SUPABASE SCHEMA AUDIT FOR 7FTRENDS
-- Run this to audit current database schema vs code expectations

-- Step 1: Check current profiles table structure
SELECT '=== PROFILES TABLE STRUCTURE ===' as section;
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Step 2: Check all tables that might need user_id column
SELECT '=== ALL TABLE STRUCTURES ===' as section;
SELECT
    t.table_name,
    c.column_name,
    c.data_type,
    c.is_nullable,
    c.column_default
FROM information_schema.tables t
LEFT JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_schema = 'public'
AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name, c.ordinal_position;

-- Step 3: Check for user_id columns specifically
SELECT '=== USER_ID COLUMN AUDIT ===' as section;
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND column_name LIKE '%user_id%'
ORDER BY table_name;

-- Step 4: Check for foreign key relationships
SELECT '=== FOREIGN KEY RELATIONSHIPS ===' as section;
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- Step 5: Check indexes that might be missing
SELECT '=== CURRENT INDEXES ===' as section;
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

SELECT '✅ Schema audit completed!' as status;
SELECT '📊 Review the results above to identify schema issues' as info;