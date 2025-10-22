-- Competitions System Schema Migration
-- Creates competitions and competition_entries tables with proper RLS policies

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS competition_entries CASCADE;
DROP TABLE IF EXISTS competitions CASCADE;

-- Create competitions table
CREATE TABLE competitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country TEXT NOT NULL,
  title TEXT NOT NULL,
  theme TEXT,
  description TEXT,
  banner_image_url TEXT,
  rules TEXT,
  prize_pool JSONB DEFAULT '{}',
  max_entries INTEGER DEFAULT NULL,
  start_at TIMESTAMP WITH TIME ZONE NOT NULL,
  end_at TIMESTAMP WITH TIME ZONE NOT NULL,
  voting_start_at TIMESTAMP WITH TIME ZONE,
  voting_end_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'voting', 'completed', 'cancelled')),
  judge_panel UUID[],
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create competition_entries table
CREATE TABLE competition_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  likes INTEGER DEFAULT 0,
  votes_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'approved', 'featured', 'rejected', 'withdrawn')),
  final_placement INTEGER,
  final_points_awarded INTEGER,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  judged_at TIMESTAMP WITH TIME ZONE,
  judged_by UUID REFERENCES auth.users(id),
  judge_feedback TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for competitions table
CREATE INDEX idx_competitions_country ON competitions(country);
CREATE INDEX idx_competitions_status ON competitions(status);
CREATE INDEX idx_competitions_start_at ON competitions(start_at);
CREATE INDEX idx_competitions_end_at ON competitions(end_at);
CREATE INDEX idx_competitions_created_by ON competitions(created_by);
CREATE INDEX idx_competitions_created_at ON competitions(created_at DESC);

-- Indexes for competition_entries table
CREATE INDEX idx_competition_entries_user_id ON competition_entries(user_id);
CREATE INDEX idx_competition_entries_competition_id ON competition_entries(competition_id);
CREATE INDEX idx_competition_entries_status ON competition_entries(status);
CREATE INDEX idx_competition_entries_submitted_at ON competition_entries(submitted_at DESC);
CREATE INDEX idx_competition_entries_likes ON competition_entries(likes DESC);
CREATE INDEX idx_competition_entries_votes_count ON competition_entries(votes_count DESC);
CREATE UNIQUE INDEX idx_competition_entries_unique_entry ON competition_entries(user_id, competition_id) WHERE status NOT IN ('withdrawn', 'rejected');

-- Enable Row Level Security
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for competitions table
CREATE POLICY "Anyone can view active competitions" ON competitions
  FOR SELECT USING (
    status IN ('active', 'voting', 'completed')
  );

CREATE POLICY "Users can view their own draft competitions" ON competitions
  FOR SELECT USING (
    created_by = auth.uid()
  );

CREATE POLICY "Authenticated users can create competitions" ON competitions
  FOR INSERT WITH CHECK (
    created_by = auth.uid()
  );

CREATE POLICY "Users can update their own competitions" ON competitions
  FOR UPDATE USING (
    created_by = auth.uid()
  );

CREATE POLICY "Users can delete their own draft competitions" ON competitions
  FOR DELETE USING (
    created_by = auth.uid() AND status = 'draft'
  );

-- RLS Policies for competition_entries table
CREATE POLICY "Anyone can view approved entries" ON competition_entries
  FOR SELECT USING (
    status IN ('approved', 'featured')
  );

CREATE POLICY "Users can view their own entries" ON competition_entries
  FOR SELECT USING (
    user_id = auth.uid()
  );

CREATE POLICY "Authenticated users can create one entry per competition" ON competition_entries
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    NOT EXISTS (
      SELECT 1 FROM competition_entries
      WHERE competition_id = competition_entries.competition_id
      AND user_id = auth.uid()
      AND status NOT IN ('withdrawn', 'rejected')
    )
  );

CREATE POLICY "Users can update their own entries" ON competition_entries
  FOR UPDATE USING (
    user_id = auth.uid()
  );

CREATE POLICY "Users can withdraw their own entries" ON competition_entries
  FOR UPDATE USING (
    user_id = auth.uid() AND
    status IN ('submitted', 'approved', 'featured')
  );

-- Create or replace function to get active competitions
CREATE OR REPLACE FUNCTION get_active_competitions(p_country_filter TEXT DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  country TEXT,
  title TEXT,
  theme TEXT,
  description TEXT,
  banner_image_url TEXT,
  prize_pool JSONB,
  start_at TIMESTAMP WITH TIME ZONE,
  end_at TIMESTAMP WITH TIME ZONE,
  voting_start_at TIMESTAMP WITH TIME ZONE,
  voting_end_at TIMESTAMP WITH TIME ZONE,
  status TEXT,
  entries_count BIGINT,
  user_entered BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.country,
    c.title,
    c.theme,
    c.description,
    c.banner_image_url,
    c.prize_pool,
    c.start_at,
    c.end_at,
    c.voting_start_at,
    c.voting_end_at,
    c.status,
    COALESCE(ec.entries_count, 0) as entries_count,
    EXISTS(
      SELECT 1 FROM competition_entries
      WHERE competition_id = c.id AND user_id = auth.uid() AND status NOT IN ('withdrawn', 'rejected')
    ) as user_entered,
    c.created_at
  FROM competitions c
  LEFT JOIN (
    SELECT
      competition_id,
      COUNT(*) as entries_count
    FROM competition_entries
    WHERE status IN ('submitted', 'approved', 'featured')
    GROUP BY competition_id
  ) ec ON c.id = ec.competition_id
  WHERE c.status IN ('active', 'voting')
    AND (p_country_filter IS NULL OR c.country = p_country_filter)
    AND c.start_at <= NOW()
    AND c.end_at >= NOW()
  ORDER BY c.end_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace function to get competition entries with pagination
CREATE OR REPLACE FUNCTION get_competition_entries(
  p_competition_id UUID,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0,
  p_sort_by TEXT DEFAULT 'votes_count',
  p_sort_order TEXT DEFAULT 'DESC'
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  username TEXT,
  avatar_url TEXT,
  competition_id UUID,
  title TEXT,
  description TEXT,
  image_url TEXT,
  images TEXT[],
  tags TEXT[],
  likes INTEGER,
  votes_count INTEGER,
  status TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE,
  user_liked BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ce.id,
    ce.user_id,
    u.username,
    u.avatar_url,
    ce.competition_id,
    ce.title,
    ce.description,
    ce.image_url,
    ce.images,
    ce.tags,
    ce.likes,
    ce.votes_count,
    ce.status,
    ce.submitted_at,
    false as user_liked -- TODO: Implement user liked logic when likes are implemented
  FROM competition_entries ce
  JOIN auth.users u ON ce.user_id = u.id
  WHERE ce.competition_id = p_competition_id
    AND ce.status IN ('submitted', 'approved', 'featured')
  ORDER BY
    CASE
      WHEN p_sort_by = 'submitted_at' AND p_sort_order = 'ASC' THEN ce.submitted_at
      ELSE NULL
    END ASC,
    CASE
      WHEN p_sort_by = 'submitted_at' AND p_sort_order = 'DESC' THEN ce.submitted_at
      ELSE NULL
    END DESC,
    CASE
      WHEN p_sort_by = 'votes_count' AND p_sort_order = 'ASC' THEN ce.votes_count
      ELSE NULL
    END ASC,
    CASE
      WHEN p_sort_by = 'votes_count' AND p_sort_order = 'DESC' THEN ce.votes_count
      ELSE NULL
    END DESC,
    CASE
      WHEN p_sort_by = 'likes' AND p_sort_order = 'ASC' THEN ce.likes
      ELSE NULL
    END ASC,
    CASE
      WHEN p_sort_by = 'likes' AND p_sort_order = 'DESC' THEN ce.likes
      ELSE NULL
    END DESC,
    ce.submitted_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace function to submit competition entry
CREATE OR REPLACE FUNCTION submit_competition_entry(
  p_competition_id UUID,
  p_title TEXT,
  p_description TEXT DEFAULT NULL,
  p_image_url TEXT,
  p_images TEXT[] DEFAULT '{}',
  p_tags TEXT[] DEFAULT '{}'
)
RETURNS JSONB AS $$
DECLARE
  v_competition competitions%ROWTYPE;
  v_existing_entry competition_entries%ROWTYPE;
  v_result JSONB;
BEGIN
  -- Check if competition exists and is accepting entries
  SELECT * INTO v_competition
  FROM competitions
  WHERE id = p_competition_id AND status = 'active';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Competition not found or not accepting entries');
  END IF;

  -- Check if competition is still within entry period
  IF NOW() < v_competition.start_at OR NOW() > v_competition.end_at THEN
    RETURN jsonb_build_object('success', false, 'error', 'Competition entry period has ended');
  END IF;

  -- Check if user already has an entry
  SELECT * INTO v_existing_entry
  FROM competition_entries
  WHERE competition_id = p_competition_id
    AND user_id = auth.uid()
    AND status NOT IN ('withdrawn', 'rejected');

  IF v_existing_entry IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'You have already entered this competition');
  END IF;

  -- Check max entries limit if specified
  IF v_competition.max_entries IS NOT NULL THEN
    DECLARE
      v_current_entries INTEGER;
    BEGIN
      SELECT COUNT(*) INTO v_current_entries
      FROM competition_entries
      WHERE competition_id = p_competition_id
        AND status IN ('submitted', 'approved', 'featured');

      IF v_current_entries >= v_competition.max_entries THEN
        RETURN jsonb_build_object('success', false, 'error', 'Competition has reached maximum entries');
      END IF;
    END;
  END IF;

  -- Create the entry
  INSERT INTO competition_entries (
    user_id,
    competition_id,
    title,
    description,
    image_url,
    images,
    tags
  ) VALUES (
    auth.uid(),
    p_competition_id,
    p_title,
    p_description,
    p_image_url,
    p_images,
    p_tags
  ) RETURNING id INTO v_result;

  RETURN jsonb_build_object(
    'success', true,
    'entry_id', v_result,
    'message', 'Entry submitted successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_competitions_updated_at
    BEFORE UPDATE ON competitions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_competition_entries_updated_at
    BEFORE UPDATE ON competition_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON competitions TO authenticated;
GRANT ALL ON competition_entries TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_competitions TO authenticated;
GRANT EXECUTE ON FUNCTION get_competition_entries TO authenticated;
GRANT EXECUTE ON FUNCTION submit_competition_entry TO authenticated;

-- Create view for competition statistics
CREATE OR REPLACE VIEW competition_stats AS
SELECT
  c.id as competition_id,
  c.title as competition_title,
  c.country,
  c.status,
  c.start_at,
  c.end_at,
  COUNT(ce.id) as total_entries,
  COUNT(ce.id) FILTER (WHERE ce.status = 'approved') as approved_entries,
  COUNT(ce.id) FILTER (WHERE ce.status = 'featured') as featured_entries,
  COUNT(ce.id) FILTER (WHERE ce.user_id = c.created_by) as creator_entries,
  COALESCE(SUM(ce.votes_count), 0) as total_votes,
  COALESCE(AVG(ce.votes_count), 0) as avg_votes_per_entry,
  c.created_at
FROM competitions c
LEFT JOIN competition_entries ce ON c.id = ce.competition_id
GROUP BY c.id, c.title, c.country, c.status, c.start_at, c.end_at, c.created_at
ORDER BY c.created_at DESC;

GRANT SELECT ON competition_stats TO authenticated;

-- Comments for documentation
COMMENT ON TABLE competitions IS 'Main competitions table with country-based filtering and comprehensive competition management';
COMMENT ON COLUMN competitions.country IS 'Country for competition targeting and filtering';
COMMENT ON COLUMN competitions.prize_pool IS 'JSONB containing prize information (points, rewards, etc.)';
COMMENT ON COLUMN competitions.judge_panel IS 'Array of user IDs who can judge entries';
COMMENT ON TABLE competition_entries IS 'Entries submitted by users with one-entry-per-competition enforcement';
COMMENT ON COLUMN competition_entries.likes IS 'Like count for the entry (legacy, may be replaced with votes)';
COMMENT ON COLUMN competition_entries.votes_count IS 'Vote count from the voting system';
COMMENT ON COLUMN competition_entries.final_placement IS 'Final ranking after competition ends';
COMMENT ON COLUMN competition_entries.final_points_awarded IS 'Points awarded to the participant';
COMMENT ON FUNCTION submit_competition_entry IS 'Secure function to submit entries with validation and uniqueness enforcement';
COMMENT ON FUNCTION get_active_competitions IS 'Get active competitions with country filtering and user entry status';
COMMENT ON FUNCTION get_competition_entries IS 'Paginated entries retrieval with sorting options';
COMMENT ON VIEW competition_stats IS 'Statistical overview of competitions with participation metrics';