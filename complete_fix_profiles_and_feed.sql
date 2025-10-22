-- COMPLETE FIX FOR PROFILES TABLE AND FEED FUNCTION
-- EXECUTE THIS ENTIRE SCRIPT IN SUPABASE SQL EDITOR

-- Step 1: First check what tables actually exist
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Step 2: Create the profiles table if it doesn't exist
-- This is critical for user authentication and profile management
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    country_code TEXT,
    timezone TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    preferences JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Add indexes for performance
CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles (username);
CREATE INDEX IF NOT EXISTS profiles_id_idx ON public.profiles (id);

-- Step 4: Enable Row Level Security (RLS) for the profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies for profiles
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile and public profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;

-- Create new policies
CREATE POLICY "Users can view their own profile and public profiles" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR is_public = TRUE);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can delete their own profile" ON public.profiles
  FOR DELETE USING (auth.uid() = id);

-- Step 6: Grant proper permissions
GRANT ALL ON public.profiles TO postgres;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO authenticated;

-- Step 7: Create trigger function for updated_at if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Create trigger for profiles table
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Step 9: Now fix the feed function to work with the profiles table
-- Drop all existing feed functions
DROP FUNCTION IF EXISTS get_user_feed CASCADE;
DROP FUNCTION IF EXISTS get_user_feed_simple CASCADE;
DROP FUNCTION IF EXISTS get_user_recommendations CASCADE;
DROP FUNCTION IF EXISTS get_user_recommendations_simple CASCADE;
DROP FUNCTION IF EXISTS get_country_boost CASCADE;

-- Step 10: Create a working feed function that uses the profiles table
CREATE OR REPLACE FUNCTION get_user_feed(
    current_user_id UUID,
    limit_count INTEGER DEFAULT 20,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE(
    post_id UUID,
    author_id UUID,
    content TEXT,
    images JSONB,
    created_at TIMESTAMPTZ,
    likes_count BIGINT,
    comments_count BIGINT,
    shares_count BIGINT,
    trending_score DECIMAL,
    feed_type TEXT,
    relationship_type TEXT,
    author_username TEXT,
    author_avatar_url TEXT,
    author_full_name TEXT,
    is_liked BOOLEAN,
    competition_id UUID,
    competition_title TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT
        p.id as post_id,
        p.author_id,
        p.content,
        p.images,
        p.created_at,
        COALESCE(p.likes_count, 0)::BIGINT as likes_count,
        COALESCE(p.comments_count, 0)::BIGINT as comments_count,
        COALESCE(p.shares_count, 0)::BIGINT as shares_count,
        (COALESCE(p.likes_count, 0) * 1.0 + COALESCE(p.comments_count, 0) * 2.0 + COALESCE(p.shares_count, 0) * 3.0) as trending_score,
        CASE
            WHEN p.author_id = current_user_id THEN 'own'
            WHEN EXISTS (
                SELECT 1 FROM follows f
                WHERE f.follower_id = current_user_id
                AND f.following_id = p.author_id
                AND f.status = 'accepted'
            ) THEN 'following'
            ELSE 'trending'
        END as feed_type,
        CASE
            WHEN p.author_id = current_user_id THEN 'own'
            WHEN EXISTS (
                SELECT 1 FROM follows f
                WHERE f.follower_id = current_user_id
                AND f.following_id = p.author_id
                AND f.status = 'accepted'
            ) THEN 'following'
            ELSE 'discover'
        END as relationship_type,
        COALESCE(pr.username, 'unknown') as author_username,
        pr.avatar_url as author_avatar_url,
        COALESCE(pr.full_name, '') as author_full_name,
        EXISTS(
            SELECT 1 FROM likes l
            WHERE l.post_id = p.id
            AND l.user_id = current_user_id
        ) as is_liked,
        NULL::UUID as competition_id,
        NULL::TEXT as competition_title
    FROM posts p
    LEFT JOIN profiles pr ON p.author_id = pr.id
    WHERE p.visibility = 'public'
    AND NOT p.is_archived
    AND (
        p.author_id = current_user_id
        OR EXISTS (
            SELECT 1 FROM follows f
            WHERE f.follower_id = current_user_id
            AND f.following_id = p.author_id
            AND f.status = 'accepted'
        )
        OR p.created_at >= NOW() - INTERVAL '7 days'
    )
    ORDER BY
        CASE
            WHEN p.author_id = current_user_id THEN 1
            WHEN EXISTS (
                SELECT 1 FROM follows f
                WHERE f.follower_id = current_user_id
                AND f.following_id = p.author_id
                AND f.status = 'accepted'
            ) THEN 2
            ELSE 3
        END,
        p.created_at DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 11: Create a simple recommendations function
CREATE OR REPLACE FUNCTION get_user_recommendations(
    current_user_id UUID,
    limit_count INTEGER DEFAULT 10
)
RETURNS TABLE(
    recommended_user_id UUID,
    username TEXT,
    avatar_url TEXT,
    full_name TEXT,
    followers_count BIGINT,
    reason TEXT,
    mutual_friends_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        pr.id as recommended_user_id,
        pr.username,
        pr.avatar_url,
        pr.full_name,
        0::BIGINT as followers_count,
        'Suggested for you' as reason,
        0::BIGINT as mutual_friends_count
    FROM profiles pr
    WHERE pr.id != current_user_id
    AND pr.is_public = TRUE
    AND pr.username IS NOT NULL
    AND NOT EXISTS (
        SELECT 1 FROM follows f
        WHERE f.follower_id = current_user_id
        AND f.following_id = pr.id
    )
    ORDER BY RANDOM()
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 12: Grant permissions to functions
GRANT EXECUTE ON FUNCTION get_user_feed TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_recommendations TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_feed TO anon;
GRANT EXECUTE ON FUNCTION get_user_recommendations TO anon;

-- Step 13: Verify everything was created
SELECT '✅ Profiles table created successfully!' as status;
SELECT '✅ Feed functions created successfully!' as status;
SELECT '✅ RLS policies created successfully!' as status;

-- Show what we created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'profiles';

SELECT routine_name, routine_type, security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND (routine_name LIKE '%feed%' OR routine_name LIKE '%recommendation%')
ORDER BY routine_name;

-- Test query (you can run this to verify it works)
-- SELECT * FROM get_user_feed('test-uuid'::uuid, 5, 0);