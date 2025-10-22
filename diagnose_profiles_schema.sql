-- DIAGNOSTIC SCRIPT FOR PROFILES TABLE ID COLUMN ISSUE
-- Run this in Supabase SQL Editor to check the current schema

-- Step 1: Check current profiles table structure
SELECT '=== CURRENT PROFILES TABLE STRUCTURE ===' as section;
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length,
    numeric_precision,
    numeric_scale
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Step 2: Check if uuid-ossp extension is available
SELECT '=== UUID EXTENSION STATUS ===' as section;
SELECT
    extname as extension_name,
    extversion as version,
    nspname as schema_name
FROM pg_extension
WHERE extname = 'uuid-ossp';

-- Step 3: Check if id column has a default value
SELECT '=== ID COLUMN DEFAULT VALUE ===' as section;
SELECT
    column_default,
    CASE
        WHEN column_default IS NULL THEN '❌ NO DEFAULT - This is the problem!'
        ELSE '✅ Has default value'
    END as default_status
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'profiles'
AND column_name = 'id';

-- Step 4: Check foreign key constraints
SELECT '=== FOREIGN KEY CONSTRAINTS ===' as section;
SELECT
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.update_rule,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.table_schema = 'public'
AND tc.table_name = 'profiles'
AND tc.constraint_type = 'FOREIGN KEY';

-- Step 5: Check RLS policies on profiles table
SELECT '=== RLS POLICIES ===' as section;
SELECT
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'profiles'
AND schemaname = 'public';

-- Step 6: Test if we can insert a record without providing id
SELECT '=== TEST INSERT WITHOUT ID ===' as section;
-- This will show us if auto-generation works
DO $$
BEGIN
    -- Create a test record without providing id
    INSERT INTO profiles (username, full_name)
    VALUES ('test_user_' || EXTRACT(EPOCH FROM NOW())::text, 'Test User')
    ON CONFLICT (username) DO NOTHING;

    RAISE NOTICE '✅ Test insert completed - check if auto-generation works';
END $$;

-- Step 7: Check if the test record was created and what id it got
SELECT '=== TEST RECORD VERIFICATION ===' as section;
SELECT
    id,
    username,
    full_name,
    created_at
FROM profiles
WHERE username LIKE 'test_user_%'
ORDER BY created_at DESC
LIMIT 1;

-- Step 8: Clean up test record
DELETE FROM profiles
WHERE username LIKE 'test_user_%'
AND username NOT IN ('pranjal17pokharna', 'admin', 'user');

SELECT '✅ DIAGNOSTIC SCRIPT COMPLETED' as status;
SELECT '📊 Review the results above to identify the exact issue' as info;