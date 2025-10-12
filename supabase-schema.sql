-- First, let's clean up any existing data
DROP TABLE IF EXISTS competition_entries CASCADE;
DROP TABLE IF EXISTS votes CASCADE;
DROP TABLE IF EXISTS competitions CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS likes CASCADE;
DROP TABLE IF EXISTS shares CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS wardrobe_items CASCADE;
DROP TABLE IF EXISTS outfits CASCADE;
DROP TABLE IF EXISTS follows CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,

    -- Profile information
    avatar_url TEXT,
    bio TEXT,
    full_name TEXT,
    birth_date DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer-not-to-say')),
    size_top TEXT,
    size_bottom TEXT,
    size_shoes TEXT,
    style TEXT[] DEFAULT '{}',
    favorite_brands TEXT[] DEFAULT '{}',

    -- Statistics
    followers_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    posts_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    competitions_won INTEGER DEFAULT 0,

    -- Settings
    is_private BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMPTZ,
    verification_token TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wardrobe items table
CREATE TABLE wardrobe_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,

    -- Basic information
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL CHECK (category IN ('top', 'bottom', 'dress', 'outerwear', 'shoes', 'accessories', 'bag', 'jewelry', 'other')),
    subcategory TEXT,
    brand TEXT,
    size TEXT,
    color TEXT[] DEFAULT '{}',
    material TEXT[] DEFAULT '{}',
    pattern TEXT,
    style TEXT[] DEFAULT '{}',
    season TEXT[] DEFAULT '{}',

    -- Purchase information
    price_amount DECIMAL(10,2),
    price_currency TEXT DEFAULT 'USD',
    purchase_date DATE,
    purchase_from TEXT,

    -- Images
    images JSONB DEFAULT '[]',

    -- AR data
    ar_model_url TEXT,
    ar_model_file TEXT,
    ar_scale DECIMAL,
    ar_position JSONB,

    -- Tags and metadata
    tags TEXT[] DEFAULT '{}',
    is_favorite BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT FALSE,
    wear_count INTEGER DEFAULT 0,
    last_worn DATE,
    condition TEXT DEFAULT 'good' CHECK (condition IN ('new', 'like-new', 'good', 'fair', 'poor')),

    -- Sustainability
    is_sustainable BOOLEAN DEFAULT FALSE,
    eco_score INTEGER CHECK (eco_score >= 0 AND eco_score <= 100),
    recycled BOOLEAN DEFAULT FALSE,
    certifications TEXT[] DEFAULT '{}',

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Posts table for social feed
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID REFERENCES users(id) ON DELETE CASCADE,

    content TEXT,
    images JSONB DEFAULT '[]',
    items UUID[] DEFAULT '{}',
    outfit_id UUID,

    tags TEXT[] DEFAULT '{}',
    mentions UUID[] DEFAULT '{}',
    location TEXT,

    visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'followers', 'private')),
    is_archived BOOLEAN DEFAULT FALSE,

    -- Engagement counters
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Likes table
CREATE TABLE likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, post_id)
);

-- Comments table
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    author_id UUID REFERENCES users(id) ON DELETE CASCADE,

    content TEXT NOT NULL,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,

    likes_count INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Follows table
CREATE TABLE follows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID REFERENCES users(id) ON DELETE CASCADE,

    status TEXT DEFAULT 'accepted' CHECK (status IN ('pending', 'accepted', 'declined')),
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,

    UNIQUE(follower_id, following_id),
    CHECK(follower_id != following_id)
);

-- Competitions table
CREATE TABLE competitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    organizer_id UUID REFERENCES users(id) ON DELETE CASCADE,

    category TEXT NOT NULL CHECK (category IN ('outfit-design', 'styling-challenge', 'sustainable-fashion', 'vintage-style', 'seasonal-trend', 'creative-theme', 'brand-sponsored')),
    theme TEXT,
    rules TEXT[] NOT NULL,

    -- Prize information
    prize_description TEXT,
    prize_value DECIMAL(10,2),
    prize_currency TEXT DEFAULT 'USD',
    sponsored_by TEXT,

    -- Timeline
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    voting_start TIMESTAMPTZ,
    voting_end TIMESTAMPTZ,
    winner_announcement TIMESTAMPTZ,

    -- Requirements
    min_participants INTEGER DEFAULT 5,
    max_participants INTEGER,
    items_required INTEGER DEFAULT 1,
    must_use_own_items BOOLEAN DEFAULT TRUE,
    allow_ar_submission BOOLEAN DEFAULT TRUE,

    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'upcoming', 'active', 'voting', 'completed', 'cancelled')),
    is_featured BOOLEAN DEFAULT FALSE,

    -- Metrics
    participants_count INTEGER DEFAULT 0,
    submissions_count INTEGER DEFAULT 0,
    votes_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Competition entries table
CREATE TABLE competition_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    competition_id UUID REFERENCES competitions(id) ON DELETE CASCADE,
    participant_id UUID REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,

    title TEXT,
    description TEXT,
    images JSONB DEFAULT '[]',
    ar_submission JSONB,
    outfit_id UUID,
    items UUID[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',

    votes_count INTEGER DEFAULT 0,
    is_disqualified BOOLEAN DEFAULT FALSE,
    disqualification_reason TEXT,

    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(competition_id, participant_id)
);

-- Votes for competitions
CREATE TABLE votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    voter_id UUID REFERENCES users(id) ON DELETE CASCADE,
    entry_id UUID REFERENCES competition_entries(id) ON DELETE CASCADE,
    score INTEGER CHECK (score >= 1 AND score <= 10),
    comment TEXT,
    voted_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(voter_id, entry_id)
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_id UUID REFERENCES users(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,

    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,

    related_entity_type TEXT,
    related_entity_id UUID,
    data JSONB,

    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    action_url TEXT,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE wardrobe_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users RLS policies
CREATE POLICY "Users can view all profiles" ON users FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- Wardrobe items RLS policies
CREATE POLICY "Users can view own items" ON wardrobe_items FOR SELECT USING (owner_id = auth.uid());
CREATE POLICY "Users can view public items" ON wardrobe_items FOR SELECT USING (is_public = TRUE);
CREATE POLICY "Users can insert own items" ON wardrobe_items FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Users can update own items" ON wardrobe_items FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "Users can delete own items" ON wardrobe_items FOR DELETE USING (owner_id = auth.uid());

-- Posts RLS policies
CREATE POLICY "Users can view public posts" ON posts FOR SELECT USING (visibility = 'public');
CREATE POLICY "Users can view own posts" ON posts FOR SELECT USING (author_id = auth.uid());
CREATE POLICY "Users can insert own posts" ON posts FOR INSERT WITH CHECK (author_id = auth.uid());
CREATE POLICY "Users can update own posts" ON posts FOR UPDATE USING (author_id = auth.uid());
CREATE POLICY "Users can delete own posts" ON posts FOR DELETE USING (author_id = auth.uid());

-- Likes RLS policies
CREATE POLICY "Users can manage own likes" ON likes FOR ALL USING (user_id = auth.uid());

-- Comments RLS policies
CREATE POLICY "Users can view all comments" ON comments FOR SELECT;
CREATE POLICY "Users can insert own comments" ON comments FOR INSERT WITH CHECK (author_id = auth.uid());
CREATE POLICY "Users can update own comments" ON comments FOR UPDATE USING (author_id = auth.uid());
CREATE POLICY "Users can delete own comments" ON comments FOR DELETE USING (author_id = auth.uid());

-- Follows RLS policies
CREATE POLICY "Users can manage own follows" ON follows FOR ALL USING (follower_id = auth.uid() OR following_id = auth.uid());

-- Competitions RLS policies
CREATE POLICY "Everyone can view active competitions" ON competitions FOR SELECT USING (status IN ('active', 'voting', 'completed'));
CREATE POLICY "Users can view their own competition entries" ON competition_entries FOR SELECT USING (participant_id = auth.uid());
CREATE POLICY "Users can insert own competition entries" ON competition_entries FOR INSERT WITH CHECK (participant_id = auth.uid());

-- Votes RLS policies
CREATE POLICY "Users can manage own votes" ON votes FOR ALL USING (voter_id = auth.uid());

-- Notifications RLS policies
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (recipient_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (recipient_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_wardrobe_items_owner ON wardrobe_items(owner_id);
CREATE INDEX idx_wardrobe_items_category ON wardrobe_items(category);
CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_likes_post ON likes(post_id);
CREATE INDEX idx_likes_user ON likes(user_id);
CREATE INDEX idx_comments_post ON comments(post_id);
CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);
CREATE INDEX idx_competitions_status ON competitions(status);
CREATE INDEX idx_competitions_dates ON competitions(start_date, end_date);
CREATE INDEX idx_competition_entries_competition ON competition_entries(competition_id);
CREATE INDEX idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_wardrobe_items_updated_at BEFORE UPDATE ON wardrobe_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_competitions_updated_at BEFORE UPDATE ON competitions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_competition_entries_updated_at BEFORE UPDATE ON competition_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();