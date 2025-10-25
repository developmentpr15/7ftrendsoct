// Schema Verification Script
// Run this in your Supabase SQL Editor or with psql to verify the migration

const verificationQueries = [
    // Check if all P0 tables exist
    `
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN (
        'post_engagement',
        'competition_entries',
        'votes',
        'points_transactions',
        'feed_settings',
        'migration_log'
    )
    ORDER BY table_name;
    `,

    // Check table structures and row counts
    `
    SELECT
        schemaname,
        tablename,
        tableowner,
        hasindexes,
        hasrules,
        hastriggers
    FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename IN (
        'post_engagement',
        'competition_entries',
        'votes',
        'points_transactions',
        'feed_settings'
    )
    ORDER BY tablename;
    `,

    // Check if indexes were created
    `
    SELECT
        indexname,
        tablename,
        indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND tablename IN (
        'post_engagement',
        'competition_entries',
        'votes',
        'points_transactions',
        'feed_settings'
    )
    ORDER BY tablename, indexname;
    `,

    // Check if functions were created
    `
    SELECT
        proname as function_name,
        pronargs as argument_count,
        prorettype::regtype as return_type,
        pronamespace::regnamespace as schema_name
    FROM pg_proc
    WHERE proname IN (
        'update_post_engagement_updated_at',
        'update_entry_vote_counts',
        'update_user_points_balance',
        'get_user_points_balance',
        'award_points_to_user',
        'get_trending_posts_with_engagement',
        'get_competition_leaderboard_with_scores'
    )
    ORDER BY proname;
    `,

    // Check feed_settings default values
    `
    SELECT
        setting_key,
        setting_value,
        setting_type,
        category,
        description,
        is_active
    FROM feed_settings
    ORDER BY category, setting_key;
    `,

    // Test the get_user_points_balance function
    `
    SELECT 'Testing get_user_points_balance function' as test;
    -- This should return 0 for non-existent user or a valid number for existing user
    SELECT get_user_points_balance('00000000-0000-0000-0000-000000000000'::uuid) as test_balance;
    `,

    // Check migration log
    `
    SELECT
        migration_name,
        version,
        description,
        status,
        created_at,
        array_length(tables_created, 1) as tables_count,
        array_length(indexes_created, 1) as indexes_count,
        array_length(functions_created, 1) as functions_count
    FROM migration_log
    WHERE migration_name = 'gamification_and_engagement_schema'
    ORDER BY created_at DESC;
    `
];

// Generate a report
console.log('🔍 7Ftrends Database Schema Verification Report');
console.log('='.repeat(50));

verificationQueries.forEach((query, index) => {
    console.log(`\n📋 Query ${index + 1}:`);
    console.log(query.trim());
    console.log('\n' + '-'.repeat(50));
});

console.log('\n🚀 Instructions:');
console.log('1. Run database-schema-migration.sql in your Supabase SQL Editor');
console.log('2. Then run these verification queries to confirm everything is working');
console.log('3. Check that all tables, indexes, and functions are created successfully');
console.log('4. Verify the feed_settings table has default values');
console.log('5. Test the utility functions with sample data');

module.exports = { verificationQueries };