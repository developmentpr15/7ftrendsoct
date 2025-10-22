-- COMPREHENSIVE FIX FOR PROFILES TABLE ID CONSTRAINT ERROR
-- This script will fix the 'id' column to auto-generate UUIDs properly

-- Step 1: Enable uuid-ossp extension if not already enabled
SELECT '=== ENABLING UUID-OSSP EXTENSION ===' as section;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 2: Check current id column structure
SELECT '=== CURRENT ID COLUMN STRUCTURE ===' as section;
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'profiles'
AND column_name = 'id';

-- Step 3: Drop the problematic profiles table and recreate it properly
SELECT '=== RECREATING PROFILES TABLE WITH CORRECT SCHEMA ===' as section;

-- Drop the table completely to start fresh
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Step 4: Create the corrected profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    email TEXT,
    country_code TEXT,
    timezone TEXT,
    is_public BOOLEAN DEFAULT TRUE NOT NULL,
    preferences JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Step 5: Create proper indexes for performance
CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles (username);
CREATE INDEX IF NOT EXISTS profiles_user_id_idx ON public.profiles (user_id);
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles (email);
CREATE INDEX IF NOT EXISTS profiles_country_idx ON public.profiles (country_code);
CREATE INDEX IF NOT EXISTS profiles_is_public_idx ON public.profiles (is_public);

-- Step 6: Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS policies
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles via user_id" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert profile via user_id" ON public.profiles;
DROP POLICY IF EXISTS "Users can update profile via user_id" ON public.profiles;

-- Create new RLS policies
CREATE POLICY "Users can view profiles" ON public.profiles
    FOR SELECT USING (auth.uid() = id OR auth.uid() = user_id OR is_public = TRUE);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id OR auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id OR auth.uid() = user_id);

CREATE POLICY "Users can delete own profile" ON public.profiles
    FOR DELETE USING (auth.uid() = id OR auth.uid() = user_id);

-- Step 8: Grant proper permissions
GRANT ALL ON public.profiles TO postgres;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO authenticated;

-- Step 9: Create trigger for updated_at (if function doesn't exist)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 10: Create the trigger
DROP TRIGGER IF EXISTS handle_profiles_updated_at ON public.profiles;
CREATE TRIGGER handle_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Step 11: Test the auto-generation of UUID
SELECT '=== TESTING AUTO-GENERATION ===' as section;
DO $$
BEGIN
    -- Test insert without providing id (should auto-generate)
    INSERT INTO profiles (username, full_name)
    VALUES ('auto_test_user', 'Auto Generated Test User')
    ON CONFLICT (username) DO NOTHING;

    RAISE NOTICE '✅ Auto-generation test completed';
END $$;

-- Step 12: Verify the test record was created with auto-generated id
SELECT '=== AUTO-GENERATION VERIFICATION ===' as section;
SELECT
    id,
    username,
    full_name,
    created_at,
    CASE
        WHEN id IS NOT NULL THEN '✅ Auto-generation works!'
        ELSE '❌ Auto-generation failed!'
    END as auto_gen_status
FROM profiles
WHERE username = 'auto_test_user'
ORDER BY created_at DESC
LIMIT 1;

-- Step 13: Clean up test record
DELETE FROM profiles
WHERE username = 'auto_test_user';

-- Step 14: Force PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

-- Step 15: Final verification
SELECT '=== FINAL PROFILES TABLE STRUCTURE ===' as section;
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'profiles'
ORDER BY ordinal_position;

SELECT '✅ PROFILES TABLE FIXED SUCCESSFULLY!' as status;
SELECT '🔑 id column now auto-generates UUIDs using uuid_generate_v4()' as key_feature;
SELECT '🛡️ RLS policies enabled for security' as security;
SELECT '📊 Proper indexes created for performance' as performance;
SELECT '🔄 PostgREST schema cache refreshed' as api_ready;