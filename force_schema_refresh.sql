-- FORCE SCHEMA REFRESH FOR POSTGREST
-- Sometimes Supabase needs a force refresh to recognize new columns

-- Step 1: Check if user_id column exists
SELECT 'CHECKING USER_ID COLUMN' as section;
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'profiles'
AND column_name = 'user_id';

-- Step 2: Force PostgREST to reload schema (this is the critical step)
NOTIFY pgrst, 'reload schema';

-- Step 3: Wait a moment and test the table
SELECT 'TESTING PROFILES TABLE ACCESS' as section;
SELECT COUNT(*) as total_profiles FROM profiles LIMIT 1;

-- Step 4: Try a direct query with user_id to verify it works
SELECT 'TESTING USER_ID COLUMN ACCESS' as section;
SELECT id, user_id, username FROM profiles LIMIT 1;

-- Step 5: If user_id doesn't exist, add it manually
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE profiles ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        UPDATE profiles SET user_id = id WHERE user_id IS NULL;
        RAISE NOTICE '✅ Added user_id column manually';
    END IF;
END $$;

-- Step 6: Force another schema reload after adding column
NOTIFY pgrst, 'reload schema';

SELECT '✅ Schema refresh completed!' as status;
SELECT '⏳ Wait 2-3 minutes for PostgREST to recognize changes' as next_step;