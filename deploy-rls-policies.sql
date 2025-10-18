-- Safe RLS Policies Deployment Script
-- Run this script in your Supabase SQL editor step by step

-- STEP 1: Add missing columns first (safe operation)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'country') THEN
        ALTER TABLE users ADD COLUMN country TEXT DEFAULT 'US';
        RAISE NOTICE 'Added country column to users table';
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'competitions' AND column_name = 'eligible_countries') THEN
        ALTER TABLE competitions ADD COLUMN eligible_countries TEXT[] DEFAULT '{}';
        RAISE NOTICE 'Added eligible_countries column to competitions table';
    END IF;
END
$$;

-- STEP 2: Create helper functions (safe operation)
CREATE OR REPLACE FUNCTION follows_user(follower_uuid UUID, following_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM follows
        WHERE follower_id = follower_uuid
        AND following_id = following_uuid
        AND status = 'accepted'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_eligible_for_competition(user_uuid UUID, competition_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_country TEXT;
    competition_countries TEXT[];
BEGIN
    SELECT COALESCE(country, 'US') INTO user_country
    FROM users
    WHERE id = user_uuid;

    SELECT eligible_countries INTO competition_countries
    FROM competitions
    WHERE id = competition_uuid;

    IF competition_countries IS NULL OR array_length(competition_countries, 1) IS NULL THEN
        RETURN TRUE;
    END IF;

    RETURN user_country = ANY(competition_countries);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions for helper functions
GRANT EXECUTE ON FUNCTION follows_user TO authenticated;
GRANT EXECUTE ON FUNCTION is_eligible_for_competition TO authenticated;

-- STEP 3: Create trigger for follower count updates
CREATE OR REPLACE FUNCTION update_follower_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'accepted' THEN
        UPDATE users SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
        UPDATE users SET following_count = following_count + 1 WHERE id = NEW.follower_id;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status != 'accepted' AND NEW.status = 'accepted' THEN
            UPDATE users SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
            UPDATE users SET following_count = following_count + 1 WHERE id = NEW.follower_id;
        ELSIF OLD.status = 'accepted' AND NEW.status != 'accepted' THEN
            UPDATE users SET followers_count = followers_count - 1 WHERE id = NEW.following_id;
            UPDATE users SET following_count = following_count - 1 WHERE id = NEW.follower_id;
        END IF;
    ELSIF TG_OP = 'DELETE' AND OLD.status = 'accepted' THEN
        UPDATE users SET followers_count = followers_count - 1 WHERE id = OLD.following_id;
        UPDATE users SET following_count = following_count - 1 WHERE id = OLD.follower_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_follower_counts ON follows;

-- Create new trigger
CREATE TRIGGER update_follower_counts
    AFTER INSERT OR UPDATE OR DELETE ON follows
    FOR EACH ROW EXECUTE FUNCTION update_follower_count();

-- STEP 4: Drop old policies one by one
-- Uncomment and run each section separately to avoid timeouts

-- Drop Users policies
DROP POLICY IF EXISTS "Users can view all profiles" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- Drop Wardrobe Items policies
DROP POLICY IF EXISTS "Users can view own items" ON wardrobe_items;
DROP POLICY IF EXISTS "Users can view public items" ON wardrobe_items;
DROP POLICY IF EXISTS "Users can insert own items" ON wardrobe_items;
DROP POLICY IF EXISTS "Users can update own items" ON wardrobe_items;
DROP POLICY IF EXISTS "Users can delete own items" ON wardrobe_items;

-- Drop Posts policies
DROP POLICY IF EXISTS "Users can view public posts" ON posts;
DROP POLICY IF EXISTS "Users can view own posts" ON posts;
DROP POLICY IF EXISTS "Users can insert own posts" ON posts;
DROP POLICY IF EXISTS "Users can update own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON posts;

-- Drop Likes policies
DROP POLICY IF EXISTS "Users can manage own likes" ON likes;

-- Drop Comments policies
DROP POLICY IF EXISTS "Users can view all comments" ON comments;
DROP POLICY IF EXISTS "Users can insert own comments" ON comments;
DROP POLICY IF EXISTS "Users can update own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON comments;

-- Drop Follows policies
DROP POLICY IF EXISTS "Users can manage own follows" ON follows;

-- Drop Competitions policies
DROP POLICY IF EXISTS "Everyone can view active competitions" ON competitions;
DROP POLICY IF EXISTS "Users can view their own competition entries" ON competition_entries;
DROP POLICY IF EXISTS "Users can insert own competition entries" ON competition_entries;

-- Drop Votes policies
DROP POLICY IF EXISTS "Users can manage own votes" ON votes;

-- Drop Notifications policies
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;

-- STEP 5: Create new comprehensive policies
-- Run this section after all old policies are dropped

-- Enhanced Users RLS policies
CREATE POLICY "Users can view active public profiles" ON users FOR SELECT
USING (is_active = TRUE AND is_private = FALSE);

CREATE POLICY "Users can view followed private profiles" ON users FOR SELECT
USING (
    is_active = TRUE AND
    is_private = TRUE AND
    follows_user(auth.uid(), id)
);

CREATE POLICY "Users can view own profile" ON users FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users FOR INSERT
WITH CHECK (auth.uid() = id);

-- Enhanced Wardrobe Items RLS policies
CREATE POLICY "Users can view own wardrobe items" ON wardrobe_items FOR SELECT
USING (owner_id = auth.uid());

CREATE POLICY "Users can view public wardrobe items" ON wardrobe_items FOR SELECT
USING (is_public = TRUE);

CREATE POLICY "Users can view items from followed users" ON wardrobe_items FOR SELECT
USING (
    is_public = TRUE AND
    follows_user(auth.uid(), owner_id)
);

CREATE POLICY "Users can insert own wardrobe items" ON wardrobe_items FOR INSERT
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update own wardrobe items" ON wardrobe_items FOR UPDATE
USING (owner_id = auth.uid());

CREATE POLICY "Users can delete own wardrobe items" ON wardrobe_items FOR DELETE
USING (owner_id = auth.uid());

-- Enhanced Posts RLS policies
CREATE POLICY "Users can view public posts" ON posts FOR SELECT
USING (visibility = 'public' AND NOT is_archived);

CREATE POLICY "Users can view followers posts" ON posts FOR SELECT
USING (
    visibility = 'followers' AND
    NOT is_archived AND
    follows_user(auth.uid(), author_id)
);

CREATE POLICY "Users can view own posts" ON posts FOR SELECT
USING (author_id = auth.uid());

CREATE POLICY "Users can view mentioned posts" ON posts FOR SELECT
USING (
    auth.uid() = ANY(mentions) AND
    NOT is_archived
);

CREATE POLICY "Users can insert own posts" ON posts FOR INSERT
WITH CHECK (author_id = auth.uid());

CREATE POLICY "Users can update own posts" ON posts FOR UPDATE
USING (author_id = auth.uid());

CREATE POLICY "Users can delete own posts" ON posts FOR DELETE
USING (author_id = auth.uid());

-- Enhanced Likes RLS policies
CREATE POLICY "Users can view likes on accessible posts" ON likes FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM posts
        WHERE posts.id = likes.post_id
        AND (
            posts.visibility = 'public' OR
            posts.author_id = auth.uid() OR
            (posts.visibility = 'followers' AND follows_user(auth.uid(), posts.author_id))
        )
    )
);

CREATE POLICY "Users can insert own likes" ON likes FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own likes" ON likes FOR DELETE
USING (user_id = auth.uid());

-- Enhanced Comments RLS policies
CREATE POLICY "Users can view comments on accessible posts" ON comments FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM posts
        WHERE posts.id = comments.post_id
        AND (
            posts.visibility = 'public' OR
            posts.author_id = auth.uid() OR
            (posts.visibility = 'followers' AND follows_user(auth.uid(), posts.author_id))
        )
    )
);

CREATE POLICY "Users can insert own comments" ON comments FOR INSERT
WITH CHECK (author_id = auth.uid());

CREATE POLICY "Users can update own comments" ON comments FOR UPDATE
USING (author_id = auth.uid());

CREATE POLICY "Users can delete own comments" ON comments FOR DELETE
USING (author_id = auth.uid());

-- Enhanced Follows RLS policies
CREATE POLICY "Users can view public follow relationships" ON follows FOR SELECT
USING (
    status = 'accepted' AND
    (follower_id = auth.uid() OR following_id = auth.uid())
);

CREATE POLICY "Users can manage own follows as follower" ON follows FOR ALL
USING (follower_id = auth.uid());

CREATE POLICY "Users can manage own follows as following" ON follows FOR ALL
USING (following_id = auth.uid());

-- Enhanced Competitions RLS policies
CREATE POLICY "Everyone can view published competitions" ON competitions FOR SELECT
USING (status IN ('upcoming', 'active', 'voting', 'completed'));

CREATE POLICY "Users can view eligible competitions" ON competitions FOR SELECT
USING (
    status IN ('upcoming', 'active') AND
    is_eligible_for_competition(auth.uid(), id)
);

CREATE POLICY "Users can insert own competitions" ON competitions FOR INSERT
WITH CHECK (organizer_id = auth.uid());

CREATE POLICY "Users can update own competitions" ON competitions FOR UPDATE
USING (organizer_id = auth.uid());

CREATE POLICY "Users can delete own competitions" ON competitions FOR DELETE
USING (organizer_id = auth.uid());

-- Enhanced Competition Entries RLS policies
CREATE POLICY "Users can view competition entries for accessible competitions" ON competition_entries FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM competitions
        WHERE competitions.id = competition_entries.competition_id
        AND competitions.status IN ('active', 'voting', 'completed')
    )
);

CREATE POLICY "Users can view own competition entries" ON competition_entries FOR SELECT
USING (participant_id = auth.uid());

CREATE POLICY "Users can insert own competition entries" ON competition_entries FOR INSERT
WITH CHECK (
    participant_id = auth.uid() AND
    is_eligible_for_competition(auth.uid(), competition_id) AND
    EXISTS (
        SELECT 1 FROM competitions
        WHERE competitions.id = competition_id
        AND competitions.status = 'active'
    )
);

CREATE POLICY "Users can update own competition entries" ON competition_entries FOR UPDATE
USING (participant_id = auth.uid());

CREATE POLICY "Users can delete own competition entries" ON competition_entries FOR DELETE
USING (participant_id = auth.uid());

-- Enhanced Votes RLS policies
CREATE POLICY "Users can view votes on eligible entries" ON votes FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM competition_entries
        WHERE competition_entries.id = votes.entry_id
        AND EXISTS (
            SELECT 1 FROM competitions
            WHERE competitions.id = competition_entries.competition_id
            AND competitions.status IN ('voting', 'completed')
        )
    )
);

CREATE POLICY "Users can insert own votes once per entry" ON votes FOR INSERT
WITH CHECK (
    voter_id = auth.uid() AND
    NOT EXISTS (
        SELECT 1 FROM votes
        WHERE votes.voter_id = auth.uid()
        AND votes.entry_id = entry_id
    ) AND
    EXISTS (
        SELECT 1 FROM competition_entries
        WHERE competition_entries.id = votes.entry_id
        AND competition_entries.participant_id != auth.uid()
        AND EXISTS (
            SELECT 1 FROM competitions
            WHERE competitions.id = competition_entries.competition_id
            AND competitions.status = 'voting'
            AND is_eligible_for_competition(auth.uid(), competitions.id)
        )
    )
);

CREATE POLICY "Users can update own votes" ON votes FOR UPDATE
USING (voter_id = auth.uid());

CREATE POLICY "Users can delete own votes during voting period" ON votes FOR DELETE
USING (
    voter_id = auth.uid() AND
    EXISTS (
        SELECT 1 FROM competition_entries
        WHERE competition_entries.id = votes.entry_id
        AND EXISTS (
            SELECT 1 FROM competitions
            WHERE competitions.id = competition_entries.competition_id
            AND competitions.status = 'voting'
        )
    )
);

-- Enhanced Notifications RLS policies
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT
USING (recipient_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE
USING (recipient_id = auth.uid());

CREATE POLICY "Users can insert notifications" ON notifications FOR INSERT
WITH CHECK (recipient_id != auth.uid());

-- STEP 6: Create performance indexes
CREATE INDEX IF NOT EXISTS idx_posts_visibility_author ON posts(visibility, author_id);
CREATE INDEX IF NOT EXISTS idx_follows_status ON follows(status);
CREATE INDEX IF NOT EXISTS idx_follows_follower_status ON follows(follower_id, status);
CREATE INDEX IF NOT EXISTS idx_competitions_status_country ON competitions(status);
CREATE INDEX IF NOT EXISTS idx_votes_voter_entry ON votes(voter_id, entry_id);

-- STEP 7: Verification queries
-- Run these to verify the policies are working correctly

-- Check if policies exist
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

-- Check if RLS is enabled on all tables
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = true
ORDER BY tablename;