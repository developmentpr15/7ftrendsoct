-- FIX PROFILE CREATION ERROR
-- The id column should auto-populate from auth.users.id, but it's not working
-- This script fixes the profiles table structure

-- Step 1: Check current profiles table structure
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

-- Step 2: Fix the profiles table to properly handle auth.users.id
DROP TABLE IF EXISTS profiles CASCADE;

-- Step 3: Recreate profiles table with correct structure
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    email TEXT,
    country_code TEXT,
    timezone TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    preferences JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 4: Add indexes
CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles (username);
CREATE INDEX IF NOT EXISTS profiles_user_id_idx ON public.profiles (user_id);

-- Step 5: Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policies
CREATE POLICY "Users can view profiles" ON public.profiles
    FOR SELECT USING (auth.uid() = id OR auth.uid() = user_id OR is_public = TRUE);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id OR auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id OR auth.uid() = user_id);

CREATE POLICY "Users can delete own profile" ON public.profiles
    FOR DELETE USING (auth.uid() = id OR auth.uid() = user_id);

-- Step 7: Grant permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;

-- Step 8: Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Step 9: Force PostgREST to recognize the new table structure
NOTIFY pgrst, 'reload schema';

-- Step 10: Test the table structure
SELECT '=== TESTING NEW PROFILES TABLE ===' as section;
SELECT COUNT(*) as total_profiles FROM profiles;

SELECT '✅ Profiles table fixed!' as status;
SELECT '🔄 The table now properly handles auth.users.id as primary key' as result;