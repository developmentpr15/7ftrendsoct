-- RLS Policy Testing Script
-- Run this in Supabase SQL Editor to test the new policies

-- ===========================================
-- IMPORTANT: Run these tests with different authenticated users
-- ===========================================

-- Setup test data (run once)
-- Note: Replace UUIDs with actual user IDs from your auth.users table

-- Test 1: Verify RLS is enabled on all tables
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = true
ORDER BY tablename;

-- Test 2: Check all policies are in place
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd,
    roles
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Test 3: Test helper functions
-- Replace these UUIDs with actual user IDs from your system
-- SELECT follows_user('user-uuid-1', 'user-uuid-2');
-- SELECT is_eligible_for_competition('user-uuid-1', 'competition-uuid-1');

-- Test 4: Test Post Visibility Policies

-- Test viewing public posts (should work for any authenticated user)
SELECT 'Public posts test' as test_name, COUNT(*) as count
FROM posts
WHERE visibility = 'public' AND NOT is_archived;

-- Test viewing followers-only posts (should only work if following)
SELECT 'Followers posts test' as test_name, COUNT(*) as count
FROM posts
WHERE visibility = 'followers'
AND NOT is_archived
AND follows_user(auth.uid(), author_id);

-- Test viewing own posts (should always work)
SELECT 'Own posts test' as test_name, COUNT(*) as count
FROM posts
WHERE author_id = auth.uid();

-- Test viewing mentioned posts (should work if mentioned)
SELECT 'Mentioned posts test' as test_name, COUNT(*) as count
FROM posts
WHERE auth.uid() = ANY(mentions) AND NOT is_archived;

-- Test 5: Test User Profile Visibility

-- Test viewing public profiles
SELECT 'Public profiles test' as test_name, COUNT(*) as count
FROM users
WHERE is_active = TRUE AND is_private = FALSE;

-- Test viewing followed private profiles
SELECT 'Followed private profiles test' as test_name, COUNT(*) as count
FROM users
WHERE is_active = TRUE
AND is_private = TRUE
AND follows_user(auth.uid(), id);

-- Test viewing own profile
SELECT 'Own profile test' as test_name, COUNT(*) as count
FROM users
WHERE id = auth.uid();

-- Test 6: Test Follow Policies

-- Test managing own follows (as follower)
SELECT 'Own follows (follower) test' as test_name, COUNT(*) as count
FROM follows
WHERE follower_id = auth.uid();

-- Test managing own follows (as following)
SELECT 'Own follows (following) test' as test_name, COUNT(*) as count
FROM follows
WHERE following_id = auth.uid();

-- Test 7: Test Competition Policies

-- Test viewing published competitions
SELECT 'Published competitions test' as test_name, COUNT(*) as count
FROM competitions
WHERE status IN ('upcoming', 'active', 'voting', 'completed');

-- Test viewing eligible competitions
SELECT 'Eligible competitions test' as test_name, COUNT(*) as count
FROM competitions
WHERE status IN ('upcoming', 'active')
AND is_eligible_for_competition(auth.uid(), id);

-- Test viewing own competitions
SELECT 'Own competitions test' as test_name, COUNT(*) as count
FROM competitions
WHERE organizer_id = auth.uid();

-- Test 8: Test Competition Entries Policies

-- Test viewing entries for accessible competitions
SELECT 'Competition entries test' as test_name, COUNT(*) as count
FROM competition_entries
WHERE EXISTS (
    SELECT 1 FROM competitions
    WHERE competitions.id = competition_entries.competition_id
    AND competitions.status IN ('active', 'voting', 'completed')
);

-- Test viewing own entries
SELECT 'Own competition entries test' as test_name, COUNT(*) as count
FROM competition_entries
WHERE participant_id = auth.uid();

-- Test 9: Test Vote Policies

-- Test viewing votes on eligible entries
SELECT 'Votes on eligible entries test' as test_name, COUNT(*) as count
FROM votes
WHERE EXISTS (
    SELECT 1 FROM competition_entries
    WHERE competition_entries.id = votes.entry_id
    AND EXISTS (
        SELECT 1 FROM competitions
        WHERE competitions.id = competition_entries.competition_id
        AND competitions.status IN ('voting', 'completed')
    )
);

-- Test viewing own votes
SELECT 'Own votes test' as test_name, COUNT(*) as count
FROM votes
WHERE voter_id = auth.uid();

-- Test 10: Test Wardrobe Items Policies

-- Test viewing own wardrobe items
SELECT 'Own wardrobe items test' as test_name, COUNT(*) as count
FROM wardrobe_items
WHERE owner_id = auth.uid();

-- Test viewing public wardrobe items
SELECT 'Public wardrobe items test' as test_name, COUNT(*) as count
FROM wardrobe_items
WHERE is_public = TRUE;

-- Test viewing items from followed users
SELECT 'Followed users wardrobe items test' as test_name, COUNT(*) as count
FROM wardrobe_items
WHERE is_public = TRUE AND follows_user(auth.uid(), owner_id);

-- Test 11: Test Likes Policies

-- Test viewing likes on accessible posts
SELECT 'Likes on accessible posts test' as test_name, COUNT(*) as count
FROM likes
WHERE EXISTS (
    SELECT 1 FROM posts
    WHERE posts.id = likes.post_id
    AND (
        posts.visibility = 'public' OR
        posts.author_id = auth.uid() OR
        (posts.visibility = 'followers' AND follows_user(auth.uid(), posts.author_id))
    )
);

-- Test viewing own likes
SELECT 'Own likes test' as test_name, COUNT(*) as count
FROM likes
WHERE user_id = auth.uid();

-- Test 12: Test Comments Policies

-- Test viewing comments on accessible posts
SELECT 'Comments on accessible posts test' as test_name, COUNT(*) as count
FROM comments
WHERE EXISTS (
    SELECT 1 FROM posts
    WHERE posts.id = comments.post_id
    AND (
        posts.visibility = 'public' OR
        posts.author_id = auth.uid() OR
        (posts.visibility = 'followers' AND follows_user(auth.uid(), posts.author_id))
    )
);

-- Test viewing own comments
SELECT 'Own comments test' as test_name, COUNT(*) as count
FROM comments
WHERE author_id = auth.uid();

-- Test 13: Test Notifications Policies

-- Test viewing own notifications
SELECT 'Own notifications test' as test_name, COUNT(*) as count
FROM notifications
WHERE recipient_id = auth.uid();

-- Test unread notifications count
SELECT 'Unread notifications test' as test_name, COUNT(*) as count
FROM notifications
WHERE recipient_id = auth.uid() AND is_read = FALSE;

-- ===========================================
-- INSERT/UPDATE/DELETE Tests (run carefully)
-- ===========================================

-- Test 14: Test Insert Restrictions

-- Test inserting own post (should succeed)
-- INSERT INTO posts (author_id, content, visibility)
-- VALUES (auth.uid(), 'Test post', 'public');

-- Test inserting post as another user (should fail)
-- INSERT INTO posts (author_id, content, visibility)
-- VALUES ('other-user-uuid', 'Test post', 'public');

-- Test inserting own follow (should succeed)
-- INSERT INTO follows (follower_id, following_id, status)
-- VALUES (auth.uid(), 'target-user-uuid', 'pending');

-- Test inserting follow for others (should fail)
-- INSERT INTO follows (follower_id, following_id, status)
-- VALUES ('other-user-uuid', 'target-user-uuid', 'pending');

-- Test 15: Test Vote Restrictions

-- Test voting for own entry (should fail)
-- INSERT INTO votes (voter_id, entry_id, score)
-- VALUES (auth.uid(), 'own-entry-uuid', 5);

-- Test duplicate voting (should fail on second attempt)
-- First vote (should succeed if eligible)
-- INSERT INTO votes (voter_id, entry_id, score)
-- VALUES (auth.uid(), 'eligible-entry-uuid', 5);
-- Second vote (should fail)
-- INSERT INTO votes (voter_id, entry_id, score)
-- VALUES (auth.uid(), 'eligible-entry-uuid', 7);

-- ===========================================
-- Performance Tests
-- ===========================================

-- Test 16: Query Performance with RLS

-- Check query plan for posts with RLS
EXPLAIN (ANALYZE, BUFFERS)
SELECT COUNT(*) FROM posts
WHERE visibility = 'public' AND NOT is_archived;

-- Check query plan for follows with RLS
EXPLAIN (ANALYZE, BUFFERS)
SELECT COUNT(*) FROM follows
WHERE follower_id = auth.uid() OR following_id = auth.uid();

-- ===========================================
-- Security Verification
-- ===========================================

-- Test 17: Verify No Data Leakage

-- Ensure users can't see private posts they shouldn't access
SELECT 'Private posts leakage test' as test_name, COUNT(*) as count
FROM posts
WHERE visibility = 'private'
AND author_id != auth.uid()
AND NOT (auth.uid() = ANY(mentions));

-- Ensure users can't see private profiles they don't follow
SELECT 'Private profiles leakage test' as test_name, COUNT(*) as count
FROM users
WHERE is_private = TRUE
AND id != auth.uid()
AND NOT follows_user(auth.uid(), id);

-- ===========================================
-- Summary Report
-- ===========================================

-- Generate a summary of all tests
SELECT 'RLS Policy Tests Summary' as test_type,
       'All tests completed' as status,
       NOW() as test_timestamp;