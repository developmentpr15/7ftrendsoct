-- EMERGENCY FIX FOR USER_ID COLUMN ERROR
-- Run this script immediately in Supabase SQL Editor

-- Step 1: First, let's see what columns actually exist in profiles table
SELECT '=== CURRENT PROFILES TABLE STRUCTURE ===' as section;
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Step 2: Add user_id column if it doesn't exist (with error handling)
DO $$
BEGIN
    -- Check if column exists first
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'user_id'
    ) THEN
        -- Add the column
        ALTER TABLE public.profiles ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        RAISE NOTICE '✅ Added user_id column to profiles table';
    ELSE
        RAISE NOTICE 'ℹ️ user_id column already exists in profiles table';
    END IF;
END $$;

-- Step 3: Update existing records to set user_id = id for compatibility
UPDATE public.profiles
SET user_id = id
WHERE user_id IS NULL AND id IS NOT NULL;

-- Step 4: Make sure we have proper indexes
CREATE INDEX IF NOT EXISTS profiles_user_id_idx ON public.profiles (user_id);

-- Step 5: Refresh PostgREST schema cache (critical step)
-- This tells Supabase to refresh its API schema
NOTIFY pgrst, 'reload schema';

-- Step 6: Also verify RLS policies exist for user_id
DROP POLICY IF EXISTS "Users can view profiles via user_id" ON public.profiles;
CREATE POLICY "Users can view profiles via user_id" ON public.profiles
    FOR SELECT USING (auth.uid() = id OR auth.uid() = user_id OR is_public = TRUE);

DROP POLICY IF EXISTS "Users can insert profile via user_id" ON public.profiles;
CREATE POLICY "Users can insert profile via user_id" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update profile via user_id" ON public.profiles;
CREATE POLICY "Users can update profile via user_id" ON public.profiles
    FOR UPDATE USING (auth.uid() = id OR auth.uid() = user_id);

-- Step 7: Verify the final structure
SELECT '=== FINAL PROFILES TABLE STRUCTURE ===' as section;
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Step 8: Test query to verify column is accessible
SELECT '=== TESTING USER_ID ACCESS ===' as section;
SELECT
    COUNT(*) as total_profiles,
    COUNT(id) as profiles_with_id,
    COUNT(user_id) as profiles_with_user_id
FROM public.profiles;

SELECT '✅ Emergency fix completed!' as status;
SELECT '🔄 If you still get PGRST204, restart your app or wait 2-3 minutes for cache refresh' as next_step;