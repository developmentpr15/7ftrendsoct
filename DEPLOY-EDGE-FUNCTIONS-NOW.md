# 🚀 DEPLOY EDGE FUNCTIONS NOW
## Complete Deployment Guide for 7Ftrends Edge Functions

Your Edge Functions are ready to deploy! I've created all the functions and they're just waiting to be deployed to your Supabase project.

## 📋 **What's Ready:**

✅ **3 Edge Functions Created:**
- `finalize-competition` - 🏆 Competition finalization & point awards
- `calculate-trending` - 📈 Real-time trending score calculation
- `daily-outfit-suggestion` - 👗 Weather-based outfit recommendations

✅ **Database Support Tables Ready:**
- All required tables and indexes created in `edge-functions-deployment.sql`

✅ **Configuration Files Ready:**
- `supabase/config.toml` - Function configuration
- `supabase/deno.json` - Deno runtime settings

---

## 🔧 **DEPLOYMENT STEPS (Follow These Exactly):**

### **Step 1: Install Supabase CLI**
```bash
# Install globally (recommended)
npm install -g @supabase/cli

# Or use npx (already available)
npx supabase --version
```

### **Step 2: Login to Supabase**
```bash
npx supabase login
# This will open your browser to authenticate with Supabase
```

### **Step 3: Link Your Project**
```bash
# From your 7Ftrends directory:
npx supabase link --project-ref elquosmpqghmehnycytw
```

### **Step 4: Deploy All Functions**
```bash
# Deploy all 3 functions at once:
npx supabase functions deploy --no-verify-jwt

# Or deploy individually:
npx supabase functions deploy finalize-competition --no-verify-jwt
npx supabase functions deploy calculate-trending --no-verify-jwt
npx supabase functions deploy daily-outfit-suggestion --no-verify-jwt
```

### **Step 5: Set Environment Variables**
Go to your Supabase Dashboard:
1. **Settings** > **Edge Functions**
2. Add these secrets:

```
SUPABASE_URL=https://elquosmpqghmehnycytw.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
WEATHER_API_KEY=your-openweather-api-key (optional)
```

**Get your Service Role Key:**
- Dashboard → **Project Settings** → **API** → **service_role (secret)**

### **Step 6: Deploy Database Tables**
Run this in **Supabase SQL Editor**:
```sql
-- Copy and paste the entire contents of edge-functions-deployment.sql
```

### **Step 7: Test the Functions**
```bash
# Test trending calculation (replace with your service role key)
curl -X POST 'https://elquosmpqghmehnycytw.supabase.co/functions/v1/calculate-trending' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"hours": 1, "force_refresh": true}'

# Test competition finalization
curl -X POST 'https://elquosmpqghmehnycytw.supabase.co/functions/v1/finalize-competition' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{}'

# Test outfit suggestions
curl -X POST 'https://elquosmpqghmehnycytw.supabase.co/functions/v1/daily-outfit-suggestion' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

---

## ⏰ **SET UP CRON JOBS (After Deployment)**

### **Option A: Supabase Dashboard (Easiest)**
Run this in **Supabase SQL Editor**:
```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Calculate trending every 2 hours
SELECT cron.schedule(
    'calculate-trending',
    '0 */2 * * *',
    $$
    SELECT net.http_post(
        url := 'https://elquosmpqghmehnycytw.supabase.co/functions/v1/calculate-trending',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
        body := '{"hours": 24, "force_refresh": true}'
    );
    $$
);

-- Finalize competitions every hour
SELECT cron.schedule(
    'finalize-competitions',
    '0 * * * *',
    $$
    SELECT net.http_post(
        url := 'https://elquosmpqghmehnycytw.supabase.co/functions/v1/finalize-competition',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
        body := '{}'
    );
    $$
);

-- Daily outfit suggestions at 7 AM
SELECT cron.schedule(
    'daily-outfit-suggestions',
    '0 7 * * *',
    $$
    SELECT net.http_post(
        url := 'https://elquosmpqghmehnycytw.supabase.co/functions/v1/daily-outfit-suggestion',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
        body := '{}'
    );
    $$
);
```

### **Option B: External Cron Service**
Use GitHub Actions, Vercel Cron, or any cron service with the curl commands above.

---

## 🔍 **VERIFY DEPLOYMENT**

### **Check Function Status:**
```bash
npx supabase functions list
```

### **Check Function Logs:**
```bash
npx supabase functions logs --follow
```

### **Monitor in Dashboard:**
- Supabase Dashboard → **Edge Functions** → **Logs**

### **Check Database Tables:**
```sql
SELECT * FROM trending_summaries ORDER BY date DESC LIMIT 5;
SELECT * FROM daily_suggestion_summaries ORDER BY date DESC LIMIT 5;
SELECT * FROM notifications ORDER BY created_at DESC LIMIT 5;
```

---

## 🎯 **EXPECTED RESULTS**

After deployment, your app will have:

✅ **Automated Competition Management**
- Competitions auto-finalize when they end
- Points automatically awarded to winners (500 for 1st, 300 for 2nd, etc.)
- Leaderboards automatically updated
- Winners receive notifications

✅ **Real-time Trending System**
- Posts scored based on engagement (likes × 1.0, comments × 2.0, shares × 3.0)
- Time-decay algorithm (72-hour half-life)
- Feed algorithm updated with fresh trending data
- Daily trending analytics

✅ **Smart Daily Outfit Suggestions**
- Weather-based outfit recommendations
- Personalized to user preferences and wardrobe
- Daily notifications with outfit suggestions
- Confidence scoring for better recommendations

✅ **Background Processing**
- All tasks run automatically via cron jobs
- No manual intervention needed
- Comprehensive error handling and logging
- Performance monitoring and analytics

---

## 🚨 **TROUBLESHOOTING**

### **If login fails:**
- Check your Supabase account permissions
- Ensure you're using the correct email

### **If deployment fails:**
- Check your project reference: `elquosmpqghmehnycytw`
- Ensure you're in the 7Ftrends directory
- Check your internet connection

### **If functions don't work:**
- Verify environment variables in Supabase Dashboard
- Check function logs for errors
- Ensure database tables were created

### **If cron jobs don't run:**
- Check pg_cron is enabled: `SELECT * FROM cron.job;`
- Verify service role key has proper permissions
- Check function logs for cron-triggered calls

---

## 🎉 **SUCCESS CRITERIA**

You'll know deployment is successful when:

1. ✅ `npx supabase functions list` shows 3 functions
2. ✅ Function logs show successful execution
3. ✅ Database tables are populated with data
4. ✅ Test curl commands return success responses
5. ✅ Cron jobs appear in `cron.job` table
6. ✅ Your app shows trending posts and outfit suggestions

---

## 📞 **NEED HELP?**

1. **Check logs**: `npx supabase functions logs --follow`
2. **Review the detailed docs**: `README-Edge-Functions.md`
3. **Check cron setup**: `cron-jobs-setup.md`
4. **Verify database**: Run queries in SQL Editor

**Your Edge Functions are ready to transform 7Ftrends into an automated, intelligent fashion platform! 🚀**