-- 7FTRENDS SCHEMA FIX MIGRATIONS
-- Execute this script to fix database schema to match code expectations
--
-- CRITICAL: Make a backup of your database before running this script!

-- ============================================================================
-- MIGRATION 1: PROFILES TABLE SCHEMA FIX
-- ============================================================================

-- Check if profiles table exists and create/update it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
        -- Create profiles table if it doesn't exist
        CREATE TABLE public.profiles (
            id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Add user_id column for compatibility
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

        RAISE NOTICE 'Created profiles table with user_id column';
    ELSE
        -- Add user_id column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'user_id' AND table_schema = 'public') THEN
            ALTER TABLE public.profiles ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
            RAISE NOTICE 'Added user_id column to profiles table';
        END IF;

        -- Add email column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'email' AND table_schema = 'public') THEN
            ALTER TABLE public.profiles ADD COLUMN email TEXT;
            RAISE NOTICE 'Added email column to profiles table';
        END IF;

        -- Add other missing columns if they don't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'country_code' AND table_schema = 'public') THEN
            ALTER TABLE public.profiles ADD COLUMN country_code TEXT;
            ALTER TABLE public.profiles ADD COLUMN timezone TEXT;
            ALTER TABLE public.profiles ADD COLUMN is_public BOOLEAN DEFAULT TRUE;
            ALTER TABLE public.profiles ADD COLUMN preferences JSONB DEFAULT '{}'::jsonb;
            RAISE NOTICE 'Added missing columns to profiles table';
        END IF;
    END IF;
END $$;

-- Add indexes for profiles table
CREATE INDEX IF NOT EXISTS profiles_user_id_idx ON public.profiles (user_id);
CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles (username);
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles (email);
CREATE INDEX IF NOT EXISTS profiles_country_idx ON public.profiles (country_code);

-- Update user_id values to match id values for existing records
UPDATE public.profiles SET user_id = id WHERE user_id IS NULL;

-- ============================================================================
-- MIGRATION 2: POSTS TABLE CREATION/FIXES
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'posts' AND table_schema = 'public') THEN
        CREATE TABLE public.posts (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            content TEXT,
            images JSONB DEFAULT '[]'::jsonb,
            image_url TEXT, -- Legacy support
            visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'followers', 'private')),
            likes_count INTEGER DEFAULT 0,
            comments_count INTEGER DEFAULT 0,
            shares_count INTEGER DEFAULT 0,
            is_archived BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        RAISE NOTICE 'Created posts table';
    ELSE
        -- Add missing columns if they don't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'images' AND table_schema = 'public') THEN
            ALTER TABLE public.posts ADD COLUMN images JSONB DEFAULT '[]'::jsonb;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'visibility' AND table_schema = 'public') THEN
            ALTER TABLE public.posts ADD COLUMN visibility TEXT DEFAULT 'public';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'is_archived' AND table_schema = 'public') THEN
            ALTER TABLE public.posts ADD COLUMN is_archived BOOLEAN DEFAULT FALSE;
        END IF;
    END IF;
END $$;

-- Add indexes for posts table
CREATE INDEX IF NOT EXISTS posts_author_id_idx ON public.posts (author_id);
CREATE INDEX IF NOT EXISTS posts_created_at_idx ON public.posts (created_at DESC);
CREATE INDEX IF NOT EXISTS posts_visibility_idx ON public.posts (visibility);
CREATE INDEX IF NOT EXISTS posts_is_archived_idx ON public.posts (is_archived);

-- ============================================================================
-- MIGRATION 3: FOLLOWS TABLE CREATION/FIXES
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'follows' AND table_schema = 'public') THEN
        CREATE TABLE public.follows (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
            requested_at TIMESTAMPTZ DEFAULT NOW(),
            accepted_at TIMESTAMPTZ,

            CONSTRAINT follows_unique UNIQUE (follower_id, following_id),
            CONSTRAINT follows_no_self_follow CHECK (follower_id != following_id)
        );

        RAISE NOTICE 'Created follows table';
    ELSE
        -- Add missing columns if they don't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'follows' AND column_name = 'accepted_at' AND table_schema = 'public') THEN
            ALTER TABLE public.follows ADD COLUMN accepted_at TIMESTAMPTZ;
        END IF;
    END IF;
END $$;

-- Add indexes for follows table
CREATE INDEX IF NOT EXISTS follows_follower_id_idx ON public.follows (follower_id);
CREATE INDEX IF NOT EXISTS follows_following_id_idx ON public.follows (following_id);
CREATE INDEX IF NOT EXISTS follows_status_idx ON public.follows (status);
CREATE INDEX IF NOT EXISTS follows_follower_status_idx ON public.follows (follower_id, status);

-- ============================================================================
-- MIGRATION 4: LIKES TABLE CREATION/FIXES
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'likes' AND table_schema = 'public') THEN
        CREATE TABLE public.likes (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
            created_at TIMESTAMPTZ DEFAULT NOW(),

            CONSTRAINT likes_unique UNIQUE (user_id, post_id)
        );

        RAISE NOTICE 'Created likes table';
    END IF;
END $$;

-- Add indexes for likes table
CREATE INDEX IF NOT EXISTS likes_user_id_idx ON public.likes (user_id);
CREATE INDEX IF NOT EXISTS likes_post_id_idx ON public.likes (post_id);

-- ============================================================================
-- MIGRATION 5: COMPETITIONS TABLE CREATION/FIXES
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'competitions' AND table_schema = 'public') THEN
        CREATE TABLE public.competitions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title TEXT NOT NULL,
            description TEXT,
            banner_image TEXT,
            icon TEXT,
            category TEXT DEFAULT 'style',
            type TEXT DEFAULT 'photo',
            status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'voting', 'completed', 'cancelled')),
            start_date TIMESTAMPTZ,
            end_date TIMESTAMPTZ,
            voting_end_date TIMESTAMPTZ,
            timezone TEXT,
            is_global BOOLEAN DEFAULT TRUE,
            eligible_countries JSONB DEFAULT '[]'::jsonb,
            excluded_countries JSONB DEFAULT '[]'::jsonb,
            age_restriction JSONB DEFAULT '{}::jsonb,
            prize_pool JSONB DEFAULT '{}::jsonb,
            rules JSONB DEFAULT '{}'::jsonb,
            judging_criteria JSONB DEFAULT '{}'::jsonb,
            requirements JSONB DEFAULT '{}'::jsonb,
            metadata JSONB DEFAULT '{}'::jsonb,
            created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        RAISE NOTICE 'Created competitions table';
    END IF;
END $$;

-- Add indexes for competitions table
CREATE INDEX IF NOT EXISTS competitions_status_idx ON public.competitions (status);
CREATE INDEX IF NOT EXISTS competitions_start_date_idx ON public.competitions (start_date);
CREATE INDEX IF NOT EXISTS competitions_created_by_idx ON public.competitions (created_by);

-- ============================================================================
-- MIGRATION 6: WARDROBE_ITEMS TABLE CREATION/FIXES
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wardrobe_items' AND table_schema = 'public') THEN
        CREATE TABLE public.wardrobe_items (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            description TEXT,
            category TEXT NOT NULL CHECK (category IN ('top', 'bottom', 'dress', 'outerwear', 'shoes', 'accessories', 'underwear')),
            subcategory TEXT,
            brand TEXT,
            color TEXT NOT NULL,
            secondary_colors JSONB DEFAULT '[]'::jsonb,
            size TEXT,
            material TEXT,
            style TEXT,
            occasion JSONB DEFAULT '[]'::jsonb,
            season JSONB DEFAULT '[]'::jsonb,
            pattern TEXT,
            images JSONB DEFAULT '[]'::jsonb,
            tags JSONB DEFAULT '[]'::jsonb,
            purchase_date DATE,
            purchase_price DECIMAL(10,2),
            purchase_location TEXT,
            care_instructions JSONB DEFAULT '[]'::jsonb,
            is_favorite BOOLEAN DEFAULT FALSE,
            is_available BOOLEAN DEFAULT TRUE,
            is_clean BOOLEAN DEFAULT TRUE,
            last_worn DATE,
            wear_count INTEGER DEFAULT 0,
            condition TEXT DEFAULT 'good',
            quality_score INTEGER CHECK (quality_score >= 1 AND quality_score <= 10),
            sustainability_score INTEGER CHECK (sustainability_score >= 1 AND sustainability_score <= 10),
            metadata JSONB DEFAULT '{}'::jsonb,

            -- AI Fields
            ai_tags JSONB DEFAULT '[]'::jsonb,
            ai_category TEXT,
            ai_colors JSONB DEFAULT '[]'::jsonb,
            ai_occasions JSONB DEFAULT '[]'::jsonb,
            ai_seasons JSONB DEFAULT '[]'::jsonb,
            ai_style TEXT,
            ai_materials JSONB DEFAULT '[]'::jsonb,
            ai_confidence DECIMAL(3,2),
            ai_processed_at TIMESTAMPTZ,
            ai_status TEXT DEFAULT 'pending' CHECK (ai_status IN ('pending', 'processing', 'completed', 'failed')),
            ai_error_message TEXT,

            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        RAISE NOTICE 'Created wardrobe_items table';
    END IF;
END $$;

-- Add indexes for wardrobe_items table
CREATE INDEX IF NOT EXISTS wardrobe_items_user_id_idx ON public.wardrobe_items (user_id);
CREATE INDEX IF NOT EXISTS wardrobe_items_category_idx ON public.wardrobe_items (category);
CREATE INDEX IF NOT EXISTS wardrobe_items_color_idx ON public.wardrobe_items (color);
CREATE INDEX IF NOT EXISTS wardrobe_items_is_favorite_idx ON public.wardrobe_items (is_favorite);
CREATE INDEX IF NOT EXISTS wardrobe_items_is_available_idx ON public.wardrobe_items (is_available);

-- ============================================================================
-- MIGRATION 7: ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wardrobe_items ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- MIGRATION 8: CREATE RLS POLICIES
-- ============================================================================

-- Profiles RLS policies
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;

CREATE POLICY "Users can view profiles" ON public.profiles
    FOR SELECT USING (auth.uid() = id OR auth.uid() = user_id OR is_public = TRUE);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id OR auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id OR auth.uid() = user_id);

CREATE POLICY "Users can delete own profile" ON public.profiles
    FOR DELETE USING (auth.uid() = id OR auth.uid() = user_id);

-- Posts RLS policies
DROP POLICY IF EXISTS "Users can view posts" ON public.posts;
DROP POLICY IF EXISTS "Users can create posts" ON public.posts;
DROP POLICY IF EXISTS "Users can update own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON public.posts;

CREATE POLICY "Users can view posts" ON public.posts
    FOR SELECT USING (
        visibility = 'public' OR
        author_id = auth.uid() OR
        (visibility = 'followers' AND EXISTS (
            SELECT 1 FROM public.follows
            WHERE follower_id = posts.author_id
            AND following_id = auth.uid()
            AND status = 'accepted'
        ))
    );

CREATE POLICY "Users can create posts" ON public.posts
    FOR INSERT WITH CHECK (author_id = auth.uid());

CREATE POLICY "Users can update own posts" ON public.posts
    FOR UPDATE USING (author_id = auth.uid());

CREATE POLICY "Users can delete own posts" ON public.posts
    FOR DELETE USING (author_id = auth.uid());

-- Wardrobe Items RLS policies
DROP POLICY IF EXISTS "Users can view own wardrobe items" ON public.wardrobe_items;
DROP POLICY IF EXISTS "Users can create wardrobe items" ON public.wardrobe_items;
DROP POLICY IF EXISTS "Users can update own wardrobe items" ON public.wardrobe_items;
DROP POLICY IF EXISTS "Users can delete own wardrobe items" ON public.wardrobe_items;

CREATE POLICY "Users can view own wardrobe items" ON public.wardrobe_items
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create wardrobe items" ON public.wardrobe_items
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own wardrobe items" ON public.wardrobe_items
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own wardrobe items" ON public.wardrobe_items
    FOR DELETE USING (user_id = auth.uid());

-- Likes RLS policies
DROP POLICY IF EXISTS "Users can view likes" ON public.likes;
DROP POLICY IF EXISTS "Users can create likes" ON public.likes;
DROP POLICY IF EXISTS "Users can delete own likes" ON public.likes;

CREATE POLICY "Users can view likes" ON public.likes
    FOR SELECT USING (user_id = auth.uid() OR post_id IN (
        SELECT id FROM public.posts WHERE author_id = auth.uid()
    ));

CREATE POLICY "Users can create likes" ON public.likes
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own likes" ON public.likes
    FOR DELETE USING (user_id = auth.uid());

-- Follows RLS policies
DROP POLICY IF EXISTS "Users can view follows" ON public.follows;
DROP POLICY IF EXISTS "Users can create follows" ON public.follows;
DROP POLICY IF EXISTS "Users can update follows" ON public.follows;
DROP POLICY IF EXISTS "Users can delete follows" ON public.follows;

CREATE POLICY "Users can view follows" ON public.follows
    FOR SELECT USING (
        follower_id = auth.uid() OR
        following_id = auth.uid()
    );

CREATE POLICY "Users can create follows" ON public.follows
    FOR INSERT WITH CHECK (follower_id = auth.uid());

CREATE POLICY "Users can update follows" ON public.follows
    FOR UPDATE USING (
        follower_id = auth.uid() OR
        following_id = auth.uid()
    );

CREATE POLICY "Users can delete follows" ON public.follows
    FOR DELETE USING (follower_id = auth.uid());

-- Competitions RLS policies (public for viewing, restricted for creation/modification)
DROP POLICY IF EXISTS "Users can view competitions" ON public.competitions;
DROP POLICY IF EXISTS "Users can create competitions" ON public.competitions;
DROP POLICY IF EXISTS "Users can update own competitions" ON public.competitions;

CREATE POLICY "Users can view competitions" ON public.competitions
    FOR SELECT USING (true); -- Public viewing

CREATE POLICY "Users can create competitions" ON public.competitions
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own competitions" ON public.competitions
    FOR UPDATE USING (created_by = auth.uid());

-- ============================================================================
-- MIGRATION 9: GRANT PERMISSIONS
-- ============================================================================

-- Grant permissions to authenticated users
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.posts TO authenticated;
GRANT ALL ON public.follows TO authenticated;
GRANT ALL ON public.likes TO authenticated;
GRANT ALL ON public.wardrobe_items TO authenticated;
GRANT SELECT ON public.competitions TO authenticated;

-- Grant select permissions to anonymous users for public content
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT ON public.posts TO anon;
GRANT SELECT ON public.competitions TO anon;

-- ============================================================================
-- MIGRATION 10: CREATE UPDATED AT TRIGGER
-- ============================================================================

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all tables
DROP TRIGGER IF EXISTS handle_profiles_updated_at ON public.profiles;
CREATE TRIGGER handle_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_posts_updated_at ON public.posts;
CREATE TRIGGER handle_posts_updated_at
    BEFORE UPDATE ON public.posts
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_wardrobe_items_updated_at ON public.wardrobe_items;
CREATE TRIGGER handle_wardrobe_items_updated_at
    BEFORE UPDATE ON public.wardrobe_items
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- SUCCESS VERIFICATION
-- ============================================================================

SELECT '✅ Schema migration completed successfully!' as status;
SELECT '📊 Tables created/updated: profiles, posts, follows, likes, competitions, wardrobe_items' as tables;
SELECT '🔐 RLS policies applied to all tables' as security;
SELECT '📈 Indexes created for performance optimization' as performance;

-- Show final table structure
SELECT
    table_name,
    COUNT(*) as column_count
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name IN ('profiles', 'posts', 'follows', 'likes', 'competitions', 'wardrobe_items')
GROUP BY table_name
ORDER BY table_name;