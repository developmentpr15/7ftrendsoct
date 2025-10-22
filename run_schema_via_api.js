const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function runSchemaViaAPI() {
    // Use the anon key for now - we might need service role key for schema operations
    const supabase = createClient(
        'https://elquosmpqghmehnycytw.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVscXVvc21wcWdobWVobnljeXR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzOTEyOTQsImV4cCI6MjA3NDk2NzI5NH0.CgGn3r6cdP6RNUtWr3oRlfty3XwoC8oFYftmSIaQoco'
    );

    try {
        console.log('🔗 Connected to Supabase via API');

        // First, let's check if we can access the profiles table
        console.log('📊 Testing profiles table access...');
        const { data, error, count } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.error('❌ Error accessing profiles table:', error);

            if (error.message.includes('column "user_id" does not exist')) {
                console.log('✅ Found the issue: user_id column is missing');
                console.log('💡 Need to execute SQL to add user_id column and refresh schema');
            }

            return;
        }

        console.log(`✅ Profiles table accessible, total count: ${count}`);

        // Check if user_id column exists by trying to select it
        console.log('🔍 Checking for user_id column...');
        const { data: profilesWithUserId, error: userIdError } = await supabase
            .from('profiles')
            .select('id, user_id, username')
            .limit(1);

        if (userIdError && userIdError.message.includes('column "user_id" does not exist')) {
            console.log('❌ Confirmed: user_id column does not exist');
            console.log('🚨 This SQL script must be executed manually in Supabase dashboard:');
            console.log(`
-- SQL to execute in Supabase dashboard:
ALTER TABLE profiles ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
UPDATE profiles SET user_id = id WHERE user_id IS NULL;
NOTIFY pgrst, 'reload schema';
            `);
        } else if (profilesWithUserId) {
            console.log('✅ user_id column exists and is accessible');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

runSchemaViaAPI().catch(console.error);