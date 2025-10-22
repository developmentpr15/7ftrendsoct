const { Client } = require('pg');
const fs = require('fs');

async function runSchemaRefresh() {
    const client = new Client({
        host: 'aws-0-eu-central-1.pooler.supabase.com',
        port: 6543,
        database: 'postgres',
        user: 'postgres.qyoytzqguxkxdhfhbbvg',
        password: 'HcD@4N8#=7^@Zc!:j^h@Q@&y^7^!3Xf=@',
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('🔗 Connecting to Supabase...');
        await client.connect();

        const sql = fs.readFileSync('force_schema_refresh.sql', 'utf8');
        console.log('📄 Read SQL file successfully');

        console.log('⚡ Executing schema refresh...');
        await client.query(sql);

        console.log('✅ Schema refresh completed successfully!');
        console.log('⏳ Please wait 2-3 minutes for PostgREST to recognize changes');

        // Test basic table access
        const result = await client.query('SELECT COUNT(*) as total_profiles FROM profiles LIMIT 1');
        console.log(`📊 Profiles table accessible, count: ${result.rows[0].total_profiles}`);

    } catch (error) {
        console.error('❌ Error executing schema refresh:', error);
        throw error;
    } finally {
        await client.end();
    }
}

runSchemaRefresh().catch(console.error);