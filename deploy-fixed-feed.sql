-- Deploy Fixed Feed Algorithm
-- This script will replace the problematic feed functions with the corrected version

-- First, drop the old functions that have issues
DROP FUNCTION IF EXISTS get_user_feed(UUID, INTEGER, INTEGER, TEXT);
DROP FUNCTION IF EXISTS get_country_boost(TEXT, TEXT);

-- Now create the corrected functions (execute supabase-feed-algorithm-fixed.sql separately)

-- Verify the functions are working
SELECT 'Testing fixed feed algorithm...' as status;

-- Test the get_user_feed function with a sample UUID (replace with actual user ID)
-- SELECT * FROM get_user_feed('00000000-0000-0000-0000-000000000000'::uuid, 5, 0);

-- Test the get_user_recommendations function
-- SELECT * FROM get_user_recommendations('00000000-0000-0000-0000-000000000000'::uuid, 3);

SELECT '✅ Fixed feed algorithm deployment ready' as status;
SELECT '📋 Next steps:' as next_steps;
SELECT '1. Run supabase-feed-algorithm-fixed.sql in Supabase SQL Editor' as step1;
SELECT '2. Verify no more column errors in app logs' as step2;
SELECT '3. Test feed functionality in the app' as step3;