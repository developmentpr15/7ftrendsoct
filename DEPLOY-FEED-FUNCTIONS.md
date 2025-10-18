# 🚀 Deploy Intelligent Feed Functions to Supabase

## **Problem**
The app is showing this error:
```
Could not find the function public.get_user_feed(current_user_id, limit_count, offset_count, user_country) in the schema cache
```

## **Solution: Deploy Database Functions**

### **Step 1: Open Supabase Dashboard**
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your 7Ftrends project
3. Click on **SQL Editor** in the left sidebar

### **Step 2: Copy the SQL Code**
1. Open `supabase-feed-algorithm.sql` in your code editor
2. Copy the entire content (all 379 lines)

### **Step 3: Execute in Supabase**
1. In the SQL Editor, click **"New query"**
2. Paste the entire SQL code from `supabase-feed-algorithm.sql`
3. Click **"Run"** or press `Ctrl/Cmd + Enter`

### **Step 4: Verify Deployment**
After running the SQL, you should see:
- ✅ Functions created successfully
- ✅ Indexes created for performance
- ✅ Permissions granted to authenticated users

### **Step 5: Test the Functions**
You can test the functions in the SQL Editor:

```sql
-- Test the main feed function (replace with your actual user ID)
SELECT * FROM get_user_feed('92791356-7240-4945-9bc3-3582949a26ad', 5, 0, 'US');

-- Test recommendations function
SELECT * FROM get_user_recommendations('92791356-7240-4945-9bc3-3582949a26ad', 3);
```

## **What These Functions Do**

### **`get_user_feed`** - Main Intelligent Feed
- **67% Friends Posts** - From users you follow
- **23% Trending Posts** - High engagement content with time-decay
- **10% Competition Posts** - Active competition entries
- **Country Boosting** - Local content gets priority
- **Time-Decay Scoring** - Fresh content gets boosted

### **`get_user_recommendations`** - User Suggestions
- Finds users to follow based on mutual friends
- Personalized recommendations
- Shows why each user is recommended

### **Helper Functions**
- `calculate_trending_score()` - Time-decay engagement scoring
- `get_country_boost()` - Local content boosting
- `refresh_feed_scores()` - Batch score updates

## **Performance Features**
- ⚡ **Optimized indexes** for fast queries
- 🗄️ **Temporary tables** for efficient sorting
- 🎯 **Weighted distribution** algorithm
- 🌍 **Country-based content relevance**
- ⏰ **Fresh content prioritization**

## **After Deployment**
Once deployed, your app will:
- ✅ Load intelligent feed content
- ✅ Show personalized recommendations
- ✅ Display feed composition analytics
- ✅ Support country-based content boosting
- ✅ Provide smooth scrolling and performance

## **Troubleshooting**
If you get errors during deployment:
1. **Table not found**: Make sure your database has the required tables (`posts`, `users`, `follows`, `likes`, `comments`, `competition_entries`, `competitions`)
2. **Permission denied**: Ensure you're running as the database owner
3. **Syntax error**: Check that the entire SQL file was copied correctly

## **Expected Results**
After deployment, your app logs should show:
```
✅ Feed loaded successfully: {"totalPosts": 20, "friends": 13, "trending": 5, "competitions": 2}
🤖 Your personalized mix of fashion content
```

Instead of the current error messages! 🎉