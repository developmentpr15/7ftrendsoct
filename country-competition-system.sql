-- Country-Based Competition System for 7Ftrends
-- Adds country eligibility filtering and country-specific leaderboards

-- Step 1: Add country_code column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS country_code TEXT;

-- Update existing users with country from metadata if available
UPDATE users
SET country_code = user_metadata->>'country'
WHERE country_code IS NULL
AND user_metadata->>'country' IS NOT NULL;

-- Step 2: Add eligible_countries array to competitions table
ALTER TABLE competitions ADD COLUMN IF NOT EXISTS eligible_countries TEXT[];

-- Add country-specific columns for better filtering
ALTER TABLE competitions ADD COLUMN IF NOT EXISTS is_global BOOLEAN DEFAULT true;
ALTER TABLE competitions ADD COLUMN IF NOT EXISTS region TEXT; -- e.g., 'Americas', 'Europe', 'Asia', 'Global'

-- Step 3: Create country-specific competition functions

-- Function to get user's country with fallback
CREATE OR REPLACE FUNCTION get_user_country(user_id UUID)
RETURNS TEXT AS $$
DECLARE
    user_country TEXT;
BEGIN
    -- First try country_code column
    SELECT country_code INTO user_country FROM users WHERE id = user_id;

    -- Fallback to metadata
    IF user_country IS NULL THEN
        SELECT user_metadata->>'country' INTO user_country FROM users WHERE id = user_id;
    END IF;

    -- Default to US if still null
    IF user_country IS NULL THEN
        user_country := 'US';
    END IF;

    RETURN user_country;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user is eligible for competition
CREATE OR REPLACE FUNCTION is_user_eligible_for_competition(user_id UUID, competition_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_country TEXT;
    eligible_countries TEXT[];
    is_eligible BOOLEAN := false;
    comp_is_global BOOLEAN;
    comp_region TEXT;
BEGIN
    -- Get user's country
    user_country := get_user_country(user_id);

    -- Get competition details
    SELECT c.eligible_countries, c.is_global, c.region
    INTO eligible_countries, comp_is_global, comp_region
    FROM competitions c
    WHERE c.id = competition_id;

    -- If not found, user is not eligible
    IF NOT FOUND THEN
        RETURN false;
    END IF;

    -- Global competitions are open to everyone
    IF comp_is_global = true THEN
        RETURN true;
    END IF;

    -- Check specific country eligibility
    IF eligible_countries IS NOT NULL THEN
        -- Check if user's country is in the eligible countries array
        SELECT EXISTS (
            SELECT 1 FROM unnest(eligible_countries) AS country
            WHERE country = user_country
        ) INTO is_eligible;
    END IF;

    -- Check regional eligibility
    IF NOT is_eligible AND comp_region IS NOT NULL THEN
        CASE comp_region
            WHEN 'Americas' THEN
                is_eligible := user_country IN ('US', 'CA', 'MX', 'BR', 'AR', 'CL', 'CO', 'PE', 'VE');
            WHEN 'Europe' THEN
                is_eligible := user_country IN ('GB', 'FR', 'DE', 'IT', 'ES', 'NL', 'BE', 'AT', 'CH', 'SE', 'NO', 'DK', 'FI', 'IE', 'PT');
            WHEN 'Asia' THEN
                is_eligible := user_country IN ('JP', 'KR', 'CN', 'IN', 'SG', 'TH', 'MY', 'PH', 'ID', 'VN', 'HK', 'TW');
            WHEN 'Africa' THEN
                is_eligible := user_country IN ('ZA', 'NG', 'KE', 'EG', 'MA', 'GH', 'TN', 'DZ');
            WHEN 'Oceania' THEN
                is_eligible := user_country IN ('AU', 'NZ', 'FJ', 'PG');
        END CASE;
    END IF;

    RETURN is_eligible;
END;
$$ LANGUAGE plpgsql;

-- Function to get competitions for user (filtered by country eligibility)
CREATE OR REPLACE FUNCTION get_eligible_competitions(user_id UUID)
RETURNS TABLE(
    id UUID,
    title TEXT,
    description TEXT,
    icon TEXT,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    status TEXT,
    is_global BOOLEAN,
    eligible_countries TEXT[],
    region TEXT,
    participants_count INTEGER,
    user_joined BOOLEAN,
    can_join BOOLEAN,
    deadline_text TEXT,
    days_remaining INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id,
        c.title,
        c.description,
        c.icon,
        c.start_date,
        c.end_date,
        c.status,
        c.is_global,
        c.eligible_countries,
        c.region,
        COALESCE(
            (SELECT COUNT(*) FROM competition_entries ce
             WHERE ce.competition_id = c.id), 0
        ) as participants_count,
        EXISTS(
            SELECT 1 FROM competition_entries ce
            WHERE ce.competition_id = c.id AND ce.participant_id = user_id
        ) as user_joined,
        is_user_eligible_for_competition(user_id, c.id) as can_join,
        CASE
            WHEN c.end_date > NOW() THEN
                CASE
                    WHEN c.end_date - NOW() < INTERVAL '24 hours' THEN
                        'Ends today'
                    WHEN c.end_date - NOW() < INTERVAL '48 hours' THEN
                        'Ends tomorrow'
                    ELSE
                        EXTRACT(DAYS FROM c.end_date - NOW()) || ' days left'
                END
            ELSE 'Ended'
        END as deadline_text,
        GREATEST(0, EXTRACT(DAYS FROM c.end_date - NOW())) as days_remaining
    FROM competitions c
    WHERE c.status IN ('active', 'upcoming')
    AND c.end_date > NOW()  -- Only active or upcoming competitions
    ORDER BY c.start_date ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to get country-specific leaderboard
CREATE OR REPLACE FUNCTION get_country_leaderboard(competition_id UUID, user_country TEXT, limit_count INTEGER DEFAULT 50)
RETURNS TABLE(
    rank_position INTEGER,
    participant_id UUID,
    username TEXT,
    avatar_url TEXT,
    votes_count INTEGER,
    entry_id UUID,
    entry_description TEXT,
    entry_images JSONB,
    submitted_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ROW_NUMBER() OVER (ORDER BY ce.votes_count DESC, ce.submitted_at ASC) as rank_position,
        u.id as participant_id,
        u.username,
        u.avatar_url,
        ce.votes_count,
        ce.id as entry_id,
        ce.description as entry_description,
        ce.images as entry_images,
        ce.submitted_at
    FROM competition_entries ce
    JOIN users u ON ce.participant_id = u.id
    WHERE ce.competition_id = competition_id
    AND u.country_code = user_country
    ORDER BY ce.votes_count DESC, ce.submitted_at ASC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get global leaderboard (with country indicators)
CREATE OR REPLACE FUNCTION get_global_leaderboard(competition_id UUID, limit_count INTEGER DEFAULT 100)
RETURNS TABLE(
    rank_position INTEGER,
    participant_id UUID,
    username TEXT,
    avatar_url TEXT,
    country_code TEXT,
    country_flag TEXT,
    votes_count INTEGER,
    entry_id UUID,
    entry_description TEXT,
    entry_images JSONB,
    submitted_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ROW_NUMBER() OVER (ORDER BY ce.votes_count DESC, ce.submitted_at ASC) as rank_position,
        u.id as participant_id,
        u.username,
        u.avatar_url,
        COALESCE(u.country_code, 'US') as country_code,
        CASE u.country_code
            WHEN 'US' THEN '🇺🇸'
            WHEN 'GB' THEN '🇬🇧'
            WHEN 'FR' THEN '🇫🇷'
            WHEN 'DE' THEN '🇩🇪'
            WHEN 'IT' THEN '🇮🇹'
            WHEN 'ES' THEN '🇪🇸'
            WHEN 'JP' THEN '🇯🇵'
            WHEN 'KR' THEN '🇰🇷'
            WHEN 'CN' THEN '🇨🇳'
            WHEN 'IN' THEN '🇮🇳'
            WHEN 'CA' THEN '🇨🇦'
            WHEN 'MX' THEN '🇲🇽'
            WHEN 'BR' THEN '🇧🇷'
            WHEN 'AU' THEN '🇦🇺'
            ELSE '🌍'
        END as country_flag,
        ce.votes_count,
        ce.id as entry_id,
        ce.description as entry_description,
        ce.images as entry_images,
        ce.submitted_at
    FROM competition_entries ce
    JOIN users u ON ce.participant_id = u.id
    WHERE ce.competition_id = competition_id
    ORDER BY ce.votes_count DESC, ce.submitted_at ASC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to create country-specific competition
CREATE OR REPLACE FUNCTION create_country_competition(
    comp_title TEXT,
    comp_description TEXT,
    comp_icon TEXT DEFAULT '🏆',
    start_date TIMESTAMPTZ DEFAULT NOW(),
    end_date TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
    comp_countries TEXT[] DEFAULT NULL,
    comp_region TEXT DEFAULT NULL,
    created_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    new_competition_id UUID;
BEGIN
    INSERT INTO competitions (
        title,
        description,
        icon,
        start_date,
        end_date,
        status,
        is_global,
        eligible_countries,
        region,
        created_by,
        created_at
    ) VALUES (
        comp_title,
        comp_description,
        comp_icon,
        start_date,
        end_date,
        'active',
        (comp_countries IS NULL AND comp_region IS NULL), -- Global if no countries or region specified
        comp_countries,
        comp_region,
        created_by,
        NOW()
    ) RETURNING id INTO new_competition_id;

    RETURN new_competition_id;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_user_country TO authenticated;
GRANT EXECUTE ON FUNCTION is_user_eligible_for_competition TO authenticated;
GRANT EXECUTE ON FUNCTION get_eligible_competitions TO authenticated;
GRANT EXECUTE ON FUNCTION get_country_leaderboard TO authenticated;
GRANT EXECUTE ON FUNCTION get_global_leaderboard TO authenticated;
GRANT EXECUTE ON FUNCTION create_country_competition TO authenticated;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_country_code ON users(country_code);
CREATE INDEX IF NOT EXISTS idx_competitions_eligible_countries ON competitions USING GIN(eligible_countries);
CREATE INDEX IF NOT EXISTS idx_competitions_is_global ON competitions(is_global);
CREATE INDEX IF NOT EXISTS idx_competitions_region ON competitions(region);
CREATE INDEX IF NOT EXISTS idx_competition_entries_votes ON competition_entries(votes_count DESC);

-- Sample usage queries:
-- SELECT * FROM get_eligible_competitions('user-uuid-here');
-- SELECT * FROM get_country_leaderboard('comp-uuid-here', 'US', 10);
-- SELECT * FROM get_global_leaderboard('comp-uuid-here', 20);
-- SELECT create_country_competition('Summer Fashion USA', 'Best summer outfits', '☀️', NOW(), NOW() + INTERVAL '14 days', ARRAY['US', 'CA', 'MX']);

-- Update sample competitions with country restrictions
UPDATE competitions SET
    eligible_countries = ARRAY['US', 'CA', 'MX'],
    is_global = false,
    region = 'Americas'
WHERE title = 'Summer Vibes';

UPDATE competitions SET
    eligible_countries = ARRAY['GB', 'FR', 'DE', 'IT', 'ES'],
    is_global = false,
    region = 'Europe'
WHERE title = 'Office Style';