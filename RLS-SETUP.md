# Supabase RLS (Row Level Security) Setup Guide

This guide provides comprehensive RLS policies for the 7ftrends application to ensure proper data security and access control.

## Overview

The enhanced RLS policies address these security requirements:

1. **Posts**: Read access based on visibility (public/followers/private) + ownership
2. **Follows**: Self-managed relationships with public readable follow status
3. **Competitions**: Country eligibility checks and proper visibility
4. **Votes**: One vote per user per entry enforcement during voting periods
5. **All tables**: Proper ownership and access controls

## Files Created

- `supabase-rls-policies.sql` - Complete policy definitions
- `deploy-rls-policies.sql` - Step-by-step deployment script
- `RLS-SETUP.md` - This setup guide

## Deployment Instructions

### 🚨 IMPORTANT: Backup First

Before deploying any changes, create a backup of your Supabase database:

```sql
-- Create a backup of your current policies
SELECT * FROM pg_policies WHERE schemaname = 'public';
```

### Step-by-Step Deployment

Follow these steps in your Supabase SQL Editor (`https://app.supabase.com/project/[your-project]/sql`):

#### Step 1: Add Missing Columns
```sql
-- Run the first section of deploy-rls-policies.sql
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
```

#### Step 2: Create Helper Functions
```sql
-- Run the helper functions section from deploy-rls-policies.sql
CREATE OR REPLACE FUNCTION follows_user(follower_uuid UUID, following_uuid UUID)
-- ... (copy from file)
```

#### Step 3: Create Trigger for Follower Counts
```sql
-- Run the trigger section from deploy-rls-policies.sql
CREATE OR REPLACE FUNCTION update_follower_count()
-- ... (copy from file)
```

#### Step 4: Drop Old Policies (Section by Section)
⚠️ **Critical**: Drop policies one table at a time to avoid timeouts:

```sql
-- Users policies
DROP POLICY IF EXISTS "Users can view all profiles" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- Then move to the next table, etc.
```

#### Step 5: Create New Policies
After all old policies are dropped, run the comprehensive policy creation section from `deploy-rls-policies.sql`.

#### Step 6: Create Performance Indexes
```sql
-- Run the final section for performance indexes
CREATE INDEX IF NOT EXISTS idx_posts_visibility_author ON posts(visibility, author_id);
-- ... (other indexes)
```

## Key Features of New Policies

### Posts Table
- **Public posts**: Everyone can see
- **Followers posts**: Only followers can see
- **Private posts**: Only author can see
- **Mentioned posts**: Mentioned users can see even if private
- **Archive support**: Archived posts are hidden from feeds

### Follows Table
- **Self-managed**: Users can only manage their own follow relationships
- **Public visibility**: Accepted follows are visible to the involved users
- **Automatic count updates**: Follower/following counts update automatically

### Competitions Table
- **Country eligibility**: Users can only see/enter competitions for their country
- **Status-based access**: Different access levels based on competition status
- **Ownership controls**: Only organizers can modify their competitions

### Votes Table
- **One vote per entry**: Prevents duplicate voting
- **Voting period only**: Can only vote during designated voting windows
- **Self-vote prevention**: Users cannot vote for their own entries
- **Eligibility checks**: Only eligible users can vote

### Additional Security Features
- **Helper functions**: Reusable functions for complex logic
- **Performance indexes**: Optimized queries for RLS checks
- **Automatic triggers**: Maintain data consistency
- **Comprehensive coverage**: All tables have proper access controls

## Testing the Policies

### Test Post Visibility
```sql
-- Test as different users by changing auth.uid()
SELECT COUNT(*) FROM posts WHERE visibility = 'public';
SELECT COUNT(*) FROM posts WHERE visibility = 'followers';
```

### Test Follow Relationships
```sql
-- Test follow relationship checking
SELECT follows_user('user-uuid-1', 'user-uuid-2');
```

### Test Competition Eligibility
```sql
-- Test country eligibility
SELECT is_eligible_for_competition('user-uuid', 'competition-uuid');
```

### Test Vote Enforcement
```sql
-- Try to insert duplicate votes (should fail)
INSERT INTO votes (voter_id, entry_id, score) VALUES ('user-uuid', 'entry-uuid', 5);
```

## Verification Queries

Run these queries to verify everything is working:

```sql
-- Check all policies are in place
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Check RLS is enabled on all tables
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check functions exist
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('follows_user', 'is_eligible_for_competition');
```

## Troubleshooting

### Common Issues

1. **Timeouts during deployment**: Deploy in smaller batches
2. **Function not found**: Ensure helper functions are created before policies
3. **Permission denied**: Check that functions have proper grants
4. **Policy not working**: Verify the user is authenticated (`auth.uid()`)

### Testing Tips

1. Test with real user authentication
2. Verify each policy with different user contexts
3. Check the Supabase logs for RLS violations
4. Use the Supabase auth simulator for testing

## Rollback Plan

If you need to rollback:
1. Restore from backup (if available)
2. Or manually recreate the original policies from the original schema file

## Security Benefits

✅ **Data Isolation**: Users can only access data they're authorized to see
✅ **Privacy Protection**: Private content stays private
✅ **Competition Integrity**: Fair voting with one vote per user
✅ **Geographic Compliance**: Country-based competition restrictions
✅ **Performance**: Optimized queries with proper indexes
✅ **Maintainability**: Clear, documented policies

## Maintenance

- Review policies regularly as features evolve
- Test new features against existing policies
- Monitor performance and add indexes as needed
- Keep documentation updated with policy changes