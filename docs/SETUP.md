# 7Ftrends - Fashion App Setup Guide

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Supabase Database

1. **Go to your Supabase project:**
   - URL: https://elquosmpqghmehnycytw.supabase.co
   - Open the SQL Editor in your Supabase dashboard

2. **Run the database schema:**
   - Copy the contents of `supabase-schema.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute

This will:
- ✅ Clean up any existing data
- ✅ Create all necessary tables (users, wardrobe_items, posts, competitions, etc.)
- ✅ Set up proper security policies
- ✅ Create indexes for performance

### 3. Start the App
```bash
npm start
```

This will start the Expo development server and show you a QR code.

### 4. Test on Your Phone
1. Download **Expo Go** app from App Store/Play Store
2. Scan the QR code from your terminal
3. The app will open on your phone!

## 📱 Testing the App

### Create Account:
1. Open the app
2. Click "Sign Up"
3. Enter email, username, and password
4. Check your email for verification (optional for now)

### Login:
1. Use your credentials to login
2. You should see the main app with tabs:
   - 📱 Feed (Fashion posts)
   - 👔 Wardrobe (Your clothes)
   - 📸 AR Try-On
   - 🏆 Competitions
   - 👤 Profile

## 🗄️ Database Structure

### Main Tables:
- **users** - User profiles and authentication
- **wardrobe_items** - Digital wardrobe items
- **posts** - Social media posts
- **competitions** - Fashion challenges
- **competition_entries** - User submissions
- **likes, comments, follows** - Social interactions

### Security:
- Row Level Security (RLS) enabled
- Users can only access their own data
- Public posts are visible to everyone

## 🔧 Development

### Project Structure:
```
src/
├── components/     # Reusable UI components
├── screens/       # App screens
├── navigation/    # Navigation setup
├── services/      # API and business logic
├── store/         # State management
├── utils/         # Helper functions
└── types/         # TypeScript types
```

### Environment Variables:
- Supabase URL and Key are in `.env.local`
- App name and version configuration

## 🐛 Troubleshooting

### If app doesn't start:
1. Make sure you ran `npm install`
2. Check that `.env.local` exists with Supabase credentials
3. Try clearing Expo cache: `expo r -c`

### If login doesn't work:
1. Make sure you ran the SQL schema in Supabase
2. Check Supabase logs for errors
3. Verify email format is correct

### Database Issues:
1. Go to Supabase Dashboard > Table Editor
2. Check if tables exist
3. Look at Authentication settings

## 🎯 Next Steps

Once the basic app is working, we can add:

1. **Camera Integration** - Upload clothes to wardrobe
2. **Wardrobe Management** - Organize your items
3. **Social Features** - Post outfits, like, comment
4. **AR Features** - Virtual try-on
5. **Competitions** - Style challenges

## 📞 Support

If you run into any issues:
1. Check the terminal for error messages
2. Look at Expo development server logs
3. Check Supabase dashboard for database issues