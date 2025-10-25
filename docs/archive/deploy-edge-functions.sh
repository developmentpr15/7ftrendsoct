#!/bin/bash

# Edge Functions Deployment Script for 7Ftrends
# This script will deploy all the Supabase Edge Functions

echo "🚀 Starting Edge Functions deployment for 7Ftrends..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the 7Ftrends root directory"
    exit 1
fi

# Check if supabase directory exists
if [ ! -d "supabase" ]; then
    echo "❌ Error: supabase directory not found"
    exit 1
fi

echo "📋 Deployment steps:"
echo "1. ✅ Initialize Supabase project"
echo "2. ✅ Deploy Edge Functions"
echo "3. ✅ Set up environment variables"
echo "4. ✅ Verify deployment"

# Initialize Supabase project (if not already linked)
echo ""
echo "🔗 Step 1: Checking Supabase project link..."
if ! npx supabase status 2>/dev/null; then
    echo "⚠️  Supabase project not linked. Please run:"
    echo "   npx supabase link --project-ref YOUR_PROJECT_REF"
    echo ""
    echo "To get your project ref:"
    echo "   1. Go to https://supabase.com/dashboard"
    echo "   2. Select your project"
    echo "   3. Go to Settings > General"
    echo "   4. Copy the Project Reference (format: abcdefghijklmnopqrstuvwxyz)"
    echo ""
    echo "Then run this script again."
    exit 1
else
    echo "✅ Supabase project is linked"
fi

# Deploy Edge Functions
echo ""
echo "📦 Step 2: Deploying Edge Functions..."

# Deploy finalize-competition
echo "   🏆 Deploying finalize-competition..."
npx supabase functions deploy finalize-competition --no-verify-jwt

# Deploy calculate-trending
echo "   📈 Deploying calculate-trending..."
npx supabase functions deploy calculate-trending --no-verify-jwt

# Deploy daily-outfit-suggestion
echo "   👗 Deploying daily-outfit-suggestion..."
npx supabase functions deploy daily-outfit-suggestion --no-verify-jwt

echo "✅ All Edge Functions deployed successfully!"

# Set up environment variables reminder
echo ""
echo "🔧 Step 3: Environment Variables Setup"
echo "Please set these environment variables in your Supabase project:"
echo "   1. Go to https://supabase.com/dashboard"
echo "   2. Select your project"
echo "   3. Go to Settings > Edge Functions"
echo "   4. Add these secrets:"
echo ""
echo "   SUPABASE_URL=https://your-project-ref.supabase.co"
echo "   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key"
echo "   # Optional: For weather API"
echo "   WEATHER_API_KEY=your-openweather-api-key"
echo "   WEATHER_API_URL=https://api.openweathermap.org/data/2.5"

# Verify deployment
echo ""
echo "🔍 Step 4: Deployment Verification"
echo "You can test the functions with these commands:"
echo ""
echo "# Test trending calculation"
echo "curl -X POST 'https://your-project-ref.supabase.co/functions/v1/calculate-trending' \\"
echo "  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"hours\": 1, \"force_refresh\": true}'"
echo ""
echo "# Test competition finalization"
echo "curl -X POST 'https://your-project-ref.supabase.co/functions/v1/finalize-competition' \\"
echo "  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{}'"
echo ""
echo "# Test outfit suggestions"
echo "curl -X POST 'https://your-project-ref.supabase.co/functions/v1/daily-outfit-suggestion' \\"
echo "  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"user_id\": \"YOUR_USER_ID\"}'"

# Next steps
echo ""
echo "🎯 Next Steps:"
echo "1. ✅ Run database migration: \\i edge-functions-deployment.sql"
echo "2. ✅ Set up cron jobs (see cron-jobs-setup.md)"
echo "3. ✅ Test the functions with the curl commands above"
echo "4. ✅ Monitor function logs in Supabase dashboard"

echo ""
echo "🎉 Edge Functions deployment complete!"
echo "📚 For detailed documentation, see README-Edge-Functions.md"