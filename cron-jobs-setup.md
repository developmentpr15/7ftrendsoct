# Cron Jobs Setup for 7Ftrends Edge Functions

This document explains how to set up cron jobs to automatically trigger the background Edge Functions.

## Required Cron Jobs

### 1. Calculate Trending Scores (Nightly)
**Frequency**: Every 2 hours (or nightly at 2 AM)
**Function**: `calculate-trending`
**Purpose**: Update post engagement scores and trending rankings

```bash
# Every 2 hours
0 */2 * * * curl -X POST 'https://your-project.supabase.co/functions/v1/calculate-trending' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"hours": 24, "force_refresh": true}'

# Or nightly at 2 AM
0 2 * * * curl -X POST 'https://your-project.supabase.co/functions/v1/calculate-trending' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"hours": 24, "force_refresh": true}'
```

### 2. Finalize Competitions (Check hourly)
**Frequency**: Every hour
**Function**: `finalize-competition`
**Purpose**: Check for and finalize competitions that have ended

```bash
# Every hour
0 * * * * curl -X POST 'https://your-project.supabase.co/functions/v1/finalize-competition' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

### 3. Daily Outfit Suggestions (Morning)
**Frequency**: Daily at 7 AM in user's timezone
**Function**: `daily-outfit-suggestion`
**Purpose**: Generate daily outfit recommendations for all users

```bash
# Daily at 7 AM UTC (adjust for your target timezone)
0 7 * * * curl -X POST 'https://your-project.supabase.co/functions/v1/daily-outfit-suggestion' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

### 4. Cleanup Tasks (Daily)
**Frequency**: Daily at 3 AM
**Function**: Database cleanup functions
**Purpose**: Clean up expired cache entries and old notifications

```bash
# Daily at 3 AM
0 3 * * * curl -X POST 'https://your-project.supabase.co/rest/v1/rpc/cleanup_weather_cache' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json'

0 3 * * * curl -X POST 'https://your-project.supabase.co/rest/v1/rpc/cleanup_old_notifications' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json'
```

## Setup Instructions

### Option 1: Using Supabase Cron Jobs (Recommended)

Supabase supports cron jobs through their dashboard:

1. Go to your Supabase project dashboard
2. Navigate to **Settings** > **Database**
3. Scroll down to **Extensions** and enable `pg_cron` if not already enabled
4. Go to **SQL Editor** and run:

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create cron job for trending calculation
SELECT cron.schedule(
    'calculate-trending-hourly',
    '0 */2 * * *', -- Every 2 hours
    $$
    SELECT net.http_post(
        url := 'https://your-project.supabase.co/functions/v1/calculate-trending',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
        body := '{"hours": 24, "force_refresh": true}'
    );
    $$
);

-- Create cron job for competition finalization
SELECT cron.schedule(
    'finalize-competitions-hourly',
    '0 * * * *', -- Every hour
    $$
    SELECT net.http_post(
        url := 'https://your-project.supabase.co/functions/v1/finalize-competition',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
        body := '{}'
    );
    $$
);

-- Create cron job for daily outfit suggestions
SELECT cron.schedule(
    'daily-outfit-suggestions',
    '0 7 * * *', -- Daily at 7 AM UTC
    $$
    SELECT net.http_post(
        url := 'https://your-project.supabase.co/functions/v1/daily-outfit-suggestion',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
        body := '{}'
    );
    $$
);

-- Create cron job for cleanup tasks
SELECT cron.schedule(
    'daily-cleanup',
    '0 3 * * *', -- Daily at 3 AM UTC
    $$
    SELECT net.http_post(
        url := 'https://your-project.supabase.co/rest/v1/rpc/cleanup_weather_cache',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
        body := '{}'
    );
    SELECT net.http_post(
        url := 'https://your-project.supabase.co/rest/v1/rpc/cleanup_old_notifications',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
        body := '{}'
    );
    $$
);
```

### Option 2: Using External Cron Services

Use external services like:

- **GitHub Actions** (Free for public repos)
- **Vercel Cron Jobs** (Free tier available)
- **Cron-job.org** (Free tier available)
- **EasyCron** (Paid service)
- **Your own server** with cron

#### GitHub Actions Example

Create `.github/workflows/cron-jobs.yml`:

```yaml
name: Scheduled Tasks

on:
  schedule:
    # Every 2 hours - trending calculation
    - cron: '0 */2 * * *'
    # Every hour - competition finalization
    - cron: '0 * * * *'
    # Daily at 7 AM UTC - outfit suggestions
    - cron: '0 7 * * *'
    # Daily at 3 AM UTC - cleanup
    - cron: '0 3 * * *'
  workflow_dispatch: # Allow manual triggering

jobs:
  calculate-trending:
    if: github.event.schedule == '0 */2 * * *' || github.event_name == 'workflow_dispatch'
    runs-on: ubuntu-latest
    steps:
      - name: Calculate Trending Scores
        run: |
          curl -X POST '${{ secrets.SUPABASE_URL }}/functions/v1/calculate-trending' \
            -H 'Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}' \
            -H 'Content-Type: application/json' \
            -d '{"hours": 24, "force_refresh": true}'

  finalize-competitions:
    if: github.event.schedule == '0 * * * *' || github.event_name == 'workflow_dispatch'
    runs-on: ubuntu-latest
    steps:
      - name: Finalize Competitions
        run: |
          curl -X POST '${{ secrets.SUPABASE_URL }}/functions/v1/finalize-competition' \
            -H 'Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}' \
            -H 'Content-Type: application/json' \
            -d '{}'

  daily-outfit-suggestions:
    if: github.event.schedule == '0 7 * * *' || github.event_name == 'workflow_dispatch'
    runs-on: ubuntu-latest
    steps:
      - name: Generate Daily Outfit Suggestions
        run: |
          curl -X POST '${{ secrets.SUPABASE_URL }}/functions/v1/daily-outfit-suggestion' \
            -H 'Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}' \
            -H 'Content-Type: application/json' \
            -d '{}'

  cleanup-tasks:
    if: github.event.schedule == '0 3 * * *' || github.event.name == 'workflow_dispatch'
    runs-on: ubuntu-latest
    steps:
      - name: Cleanup Weather Cache
        run: |
          curl -X POST '${{ secrets.SUPABASE_URL }}/rest/v1/rpc/cleanup_weather_cache' \
            -H 'Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}' \
            -H 'Content-Type: application/json' \
            -d '{}'
      - name: Cleanup Old Notifications
        run: |
          curl -X POST '${{ secrets.SUPABASE_URL }}/rest/v1/rpc/cleanup_old_notifications' \
            -H 'Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}' \
            -H 'Content-Type: application/json' \
            -d '{}'
```

Add these secrets to your GitHub repository:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Your service role key

## Environment Variables Required

For the Edge Functions to work properly, set these environment variables in your Supabase project:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
WEATHER_API_KEY=your-weather-api-key (optional)
WEATHER_API_URL=https://api.openweathermap.org/data/2.5 (optional)
```

## Monitoring and Logging

The Edge Functions include comprehensive logging. You can monitor:

1. **Supabase Dashboard**: Go to **Functions** > **Logs**
2. **Database Tables**: Check summary tables:
   - `trending_summaries` for trending calculation results
   - `daily_suggestion_summaries` for outfit suggestion results
   - `notifications` for any error notifications

## Testing the Functions

Before setting up cron jobs, test the functions manually:

```bash
# Test trending calculation
curl -X POST 'https://your-project.supabase.co/functions/v1/calculate-trending' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"hours": 1, "force_refresh": true}'

# Test competition finalization
curl -X POST 'https://your-project.supabase.co/functions/v1/finalize-competition' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{}'

# Test outfit suggestions for a specific user
curl -X POST 'https://your-project.supabase.co/functions/v1/daily-outfit-suggestion' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"user_id": "your-user-id-here"}'
```

## Troubleshooting

1. **Functions not triggering**: Check cron job syntax and service role key
2. **Database errors**: Ensure all required tables exist (run `edge-functions-deployment.sql`)
3. **Permission errors**: Verify service role key has proper permissions
4. **Weather API errors**: Check weather API key and rate limits
5. **Timeout issues**: Increase function timeout limits in Supabase settings

## Security Notes

- Always use service role keys (not anon keys) for cron jobs
- Store secrets securely in environment variables
- Monitor function logs for unusual activity
- Set up alerts for failed function executions