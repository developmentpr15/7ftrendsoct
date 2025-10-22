-- QUICK TABLE CHECK - See what tables actually exist
SELECT '=== EXISTING TABLES ===' as section;
SELECT
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Common tables to check specifically
SELECT '=== CHECKING COMMON TABLES ===' as section;
SELECT
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN 'profiles EXISTS ✓'
        ELSE 'profiles NOT FOUND ✗'
    END as profiles_status,
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'posts') THEN 'posts EXISTS ✓'
        ELSE 'posts NOT FOUND ✗'
    END as posts_status,
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'likes') THEN 'likes EXISTS ✓'
        ELSE 'likes NOT FOUND ✗'
    END as likes_status,
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'comments') THEN 'comments EXISTS ✓'
        ELSE 'comments NOT FOUND ✗'
    END as comments_status,
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'shares') THEN 'shares EXISTS ✓'
        ELSE 'shares NOT FOUND ✗'
    END as shares_status,
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'follows') THEN 'follows EXISTS ✓'
        ELSE 'follows NOT FOUND ✗'
    END as follows_status,
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'competitions') THEN 'competitions EXISTS ✓'
        ELSE 'competitions NOT FOUND ✗'
    END as competitions_status;

SELECT '✅ Quick table check completed!' as status;