# Supabase Edge Functions for 7Ftrends

This directory contains serverless background functions that automate key features of the 7Ftrends fashion app.

## 🚀 **Functions Overview**

### 1. **finalize-competition** `🏆`
Automatically finalizes ended competitions and awards points to winners.

**Features:**
- Calculates rankings based on votes and scores
- Awards points (500 for 1st place, 300 for 2nd, etc.)
- Updates competition status to 'completed'
- Creates leaderboard entries
- Sends notifications to winners
- Handles both individual and batch finalization

**Usage:**
```bash
# Finalize specific competition
curl -X POST 'https://your-project.supabase.co/functions/v1/finalize-competition' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -d '{"competition_id": "uuid-here"}'

# Auto-finalize all eligible competitions
curl -X POST 'https://your-project.supabase.co/functions/v1/finalize-competition' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -d '{}'
```

### 2. **calculate-trending** `📈`
Calculates and updates trending scores for posts based on engagement metrics.

**Features:**
- Processes posts from last 24 hours (configurable)
- Calculates weighted engagement (likes × 1.0, comments × 2.0, shares × 3.0)
- Applies time decay algorithm (72-hour half-life)
- Updates trending scores in real-time
- Creates detailed engagement records
- Generates daily trending summaries

**Usage:**
```bash
# Process last 24 hours
curl -X POST 'https://your-project.supabase.co/functions/v1/calculate-trending' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -d '{"hours": 24}'

# Custom time window
curl -X POST 'https://your-project.supabase.co/functions/v1/calculate-trending' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -d '{"hours": 12, "batch_size": 50}'
```

### 3. **daily-outfit-suggestion** `👗`
Generates personalized daily outfit suggestions based on weather and user preferences.

**Features:**
- Fetches weather data for user locations
- Analyzes user wardrobe and preferences
- Creates weather-appropriate outfit combinations
- Considers occasion (casual, work, formal, athletic)
- Applies user style preferences and favorite colors
- Calculates confidence scores for suggestions
- Sends daily notifications to users
- Supports batch processing for all users

**Usage:**
```bash
# Generate suggestion for specific user
curl -X POST 'https://your-project.supabase.co/functions/v1/daily-outfit-suggestion' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -d '{"user_id": "uuid-here", "occasion": "casual"}'

# Process all users (batch mode)
curl -X POST 'https://your-project.supabase.co/functions/v1/daily-outfit-suggestion' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -d '{}'
```

## 📁 **Directory Structure**

```
supabase/
├── functions/
│   ├── finalize-competition/
│   │   └── index.ts
│   ├── calculate-trending/
│   │   └── index.ts
│   ├── daily-outfit-suggestion/
│   │   └── index.ts
│   └── _shared/
│       └── cors.ts
├── config.toml
└── deno.json
```

## 🔧 **Installation**

### Prerequisites
- Supabase project with service role key
- Deno runtime installed locally
- Edge Functions enabled in Supabase project

### Step 1: Database Setup
Run the support tables migration:
```sql
-- In Supabase SQL Editor
\i edge-functions-deployment.sql
```

### Step 2: Configure Environment Variables
Set these in your Supabase project settings:
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
WEATHER_API_KEY=your-weather-api-key (optional)
```

### Step 3: Deploy Functions
```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Deploy all functions
supabase functions deploy

# Or deploy individual functions
supabase functions deploy finalize-competition
supabase functions deploy calculate-trending
supabase functions deploy daily-outfit-suggestion
```

### Step 4: Set Up Cron Jobs
See `cron-jobs-setup.md` for detailed instructions.

## 📊 **Database Tables Created**

- **`weather_cache`** - Caches weather data to reduce API calls
- **`outfit_suggestions`** - Stores generated outfit recommendations
- **`competition_leaderboards`** - Persistent competition rankings
- **`trending_summaries`** - Daily trending calculation reports
- **`daily_suggestion_summaries`** - Outfit suggestion batch reports
- **`notifications`** - User notifications system
- **`announcements`** - Public announcements
- **`post_saves`** - Post saves tracking

## ⏰ **Cron Schedule (Recommended)**

```bash
# Every 2 hours - Calculate trending scores
0 */2 * * * [calculate-trending]

# Every hour - Check for completed competitions
0 * * * * [finalize-competition]

# Daily at 7 AM - Generate outfit suggestions
0 7 * * * [daily-outfit-suggestion]

# Daily at 3 AM - Cleanup old data
0 3 * * * [cleanup-tasks]
```

## 🔍 **Monitoring & Debugging**

### Check Function Logs
```bash
# View recent function logs
supabase functions logs --follow

# View specific function logs
supabase functions logs finalize-competition --follow
```

### Monitor Results
Check these database tables:
```sql
-- Trending calculation results
SELECT * FROM trending_summaries ORDER BY date DESC LIMIT 10;

-- Outfit suggestion results
SELECT * FROM daily_suggestion_summaries ORDER BY date DESC LIMIT 10;

-- Recent notifications
SELECT * FROM notifications ORDER BY created_at DESC LIMIT 10;

-- Competition leaderboards
SELECT * FROM competition_leaderboards ORDER BY created_at DESC LIMIT 10;
```

### Error Handling
All functions include comprehensive error handling:
- Errors are logged to console and database
- Failed operations don't crash the entire batch
- Detailed error messages help with debugging
- Automatic retry logic for transient failures

## 🛡️ **Security Features**

- **Service Role Authentication**: Functions use service role keys for full database access
- **CORS Headers**: Properly configured for cross-origin requests
- **Input Validation**: All inputs are validated and sanitized
- **Rate Limiting**: Built-in throttling to prevent abuse
- **Secure Headers**: Security headers set on all responses

## 🎯 **Performance Optimizations**

- **Batch Processing**: Functions process data in configurable batches
- **Caching**: Weather data and expensive calculations are cached
- **Database Indexes**: Optimized queries for fast performance
- **Timeout Handling**: Graceful handling of long-running operations
- **Memory Management**: Efficient memory usage for large datasets

## 🧪 **Testing**

### Local Testing
```bash
# Start local development server
supabase functions serve --env-file .env

# Test function locally
curl -X POST 'http://localhost:54321/functions/v1/calculate-trending' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -d '{"hours": 1}'
```

### Production Testing
Always test in production with small batches first:
```bash
# Test with limited data
curl -X POST 'https://your-project.supabase.co/functions/v1/calculate-trending' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -d '{"hours": 1, "batch_size": 5}'
```

## 🚨 **Troubleshooting**

### Common Issues
1. **Function Timeout**: Increase timeout limits in Supabase settings
2. **Memory Issues**: Reduce batch sizes in function parameters
3. **Database Errors**: Ensure all required tables exist
4. **API Rate Limits**: Check external API limits (weather, etc.)
5. **Permission Errors**: Verify service role key permissions

### Health Checks
```bash
# Test all functions
curl -X POST 'https://your-project.supabase.co/functions/v1/calculate-trending' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -d '{"hours": 0.1}'

curl -X POST 'https://your-project.supabase.co/functions/v1/finalize-competition' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -d '{"competition_id": "00000000-0000-0000-0000-000000000000"}'
```

## 📈 **Metrics & Analytics**

The functions automatically track:
- Processing time and performance metrics
- Success/failure rates
- User engagement with suggestions
- Competition participation metrics
- Trending post performance
- System health indicators

## 🔄 **Future Enhancements**

- **Machine Learning**: AI-powered outfit recommendations
- **Social Features**: Trending suggestions based on friends
- **Weather Integration**: Real-time weather alerts
- **Competition Automation**: Fully automated competition lifecycle
- **Analytics Dashboard**: Real-time metrics visualization

## 📞 **Support**

For issues and questions:
1. Check function logs in Supabase dashboard
2. Review the troubleshooting section
3. Test functions with small datasets first
4. Monitor database tables for results
5. Check cron job execution logs