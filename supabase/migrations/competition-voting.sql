-- Competition Voting System Migration
-- Implements heart-based voting with RLS uniqueness enforcement and country-filtered leaderboards

-- Drop existing votes table if it exists (to avoid conflicts)
DROP TABLE IF EXISTS votes CASCADE;

-- Create simplified competition votes table
CREATE TABLE IF NOT EXISTS competition_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES competition_entries(id) ON DELETE CASCADE,
  voter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  vote_type TEXT DEFAULT 'heart' CHECK (vote_type IN ('heart', 'like')),
  is_anonymous BOOLEAN DEFAULT FALSE,
  voter_country TEXT,
  voter_ip INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint to ensure one vote per user per entry
ALTER TABLE competition_votes
ADD CONSTRAINT unique_vote_per_entry UNIQUE (entry_id, voter_id);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_competition_votes_entry_id ON competition_votes(entry_id);
CREATE INDEX IF NOT EXISTS idx_competition_votes_voter_id ON competition_votes(voter_id);
CREATE INDEX IF NOT EXISTS idx_competition_votes_competition_id ON competition_votes(competition_id);
CREATE INDEX IF NOT EXISTS idx_competition_votes_created_at ON competition_votes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_competition_votes_country ON competition_votes(voter_country);

-- Create or replace function to get real-time vote counts for entries
CREATE OR REPLACE FUNCTION get_entry_vote_counts(p_competition_id UUID)
RETURNS TABLE (
  entry_id UUID,
  votes_count BIGINT,
  voters_count BIGINT,
  country_votes JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ce.id as entry_id,
    COALESCE(cv.votes_count, 0) as votes_count,
    COALESCE(cv.voters_count, 0) as voters_count,
    COALESCE(cv.country_votes, '{}') as country_votes
  FROM competition_entries ce
  LEFT JOIN (
    SELECT
      entry_id,
      COUNT(*) as votes_count,
      COUNT(DISTINCT voter_id) as voters_count,
      jsonb_object_agg(
        COALESCE(voter_country, 'unknown'),
        COUNT(*)
      ) FILTER (WHERE voter_id IS NOT NULL) as country_votes
    FROM competition_votes
    WHERE competition_id = p_competition_id
    GROUP BY entry_id
  ) cv ON ce.id = cv.entry_id
  WHERE ce.competition_id = p_competition_id
    AND ce.status IN ('submitted', 'approved', 'featured')
  ORDER BY votes_count DESC, ce.submitted_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Create or replace function to get country-filtered leaderboard
CREATE OR REPLACE FUNCTION get_competition_leaderboard(
  p_competition_id UUID,
  p_country_filter TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
  rank INTEGER,
  entry_id UUID,
  participant_id UUID,
  participant_username TEXT,
  participant_avatar_url TEXT,
  entry_title TEXT,
  entry_images TEXT[],
  votes_count BIGINT,
  country_votes_count BIGINT,
  total_votes_count BIGINT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  WITH vote_counts AS (
    SELECT
      entry_id,
      COUNT(*) as total_votes,
      COUNT(*) FILTER (WHERE voter_country = p_country_filter OR p_country_filter IS NULL) as country_votes
    FROM competition_votes
    WHERE competition_id = p_competition_id
    GROUP BY entry_id
  ),
  ranked_entries AS (
    SELECT
      ce.id as entry_id,
      ce.participant_id,
      u.username as participant_username,
      u.avatar_url as participant_avatar_url,
      ce.title as entry_title,
      ce.images as entry_images,
      COALESCE(vc.total_votes, 0) as total_votes_count,
      COALESCE(vc.country_votes, 0) as country_votes_count,
      ce.submitted_at as created_at,
      ROW_NUMBER() OVER (ORDER BY
        COALESCE(vc.country_votes, 0) DESC,
        COALESCE(vc.total_votes, 0) DESC,
        ce.submitted_at ASC
      ) as rank
    FROM competition_entries ce
    JOIN auth.users u ON ce.participant_id = u.id
    LEFT JOIN vote_counts vc ON ce.id = vc.entry_id
    WHERE ce.competition_id = p_competition_id
      AND ce.status IN ('submitted', 'approved', 'featured')
  )
  SELECT
    rank,
    entry_id,
    participant_id,
    participant_username,
    participant_avatar_url,
    entry_title,
    entry_images,
    country_votes_count as votes_count,
    country_votes_count,
    total_votes_count,
    created_at
  FROM ranked_entries
  ORDER BY rank
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Create or replace function to determine competition winners
CREATE OR REPLACE FUNCTION determine_competition_winners(p_competition_id UUID)
RETURNS TABLE (
  entry_id UUID,
  participant_id UUID,
  final_rank INTEGER,
  final_votes BIGINT,
  points_awarded INTEGER,
  winner_type TEXT
) AS $$
DECLARE
  v_competition competitions%ROWTYPE;
  v_voting_closed BOOLEAN;
  v_winner_cutoff TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get competition details
  SELECT * INTO v_competition FROM competitions WHERE id = p_competition_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Competition not found';
  END IF;

  -- Check if voting period has ended + 6 hours grace period
  v_winner_cutoff := COALESCE(v_competition.voting_end_date, v_competition.end_date) + INTERVAL '6 hours';
  v_voting_closed := NOW() > v_winner_cutoff;

  IF NOT v_voting_closed THEN
    RAISE EXCEPTION 'Voting period has not ended yet';
  END IF;

  -- Determine winners based on final vote counts
  RETURN QUERY
  WITH final_rankings AS (
    SELECT
      ce.id as entry_id,
      ce.participant_id,
      ROW_NUMBER() OVER (ORDER BY COUNT(cv.id) DESC, ce.submitted_at ASC) as final_rank,
      COUNT(cv.id) as final_votes,
      CASE
        WHEN ROW_NUMBER() OVER (ORDER BY COUNT(cv.id) DESC, ce.submitted_at ASC) = 1 THEN 'grand_winner'
        WHEN ROW_NUMBER() OVER (ORDER BY COUNT(cv.id) DESC, ce.submitted_at ASC) <= 3 THEN 'top_3'
        WHEN ROW_NUMBER() OVER (ORDER BY COUNT(cv.id) DESC, ce.submitted_at ASC) <= 10 THEN 'top_10'
        ELSE 'participant'
      END as winner_type,
      CASE
        WHEN ROW_NUMBER() OVER (ORDER BY COUNT(cv.id) DESC, ce.submitted_at ASC) = 1 THEN
          COALESCE(v_competition.prize_pool->>'points', '0')::INTEGER
        WHEN ROW_NUMBER() OVER (ORDER BY COUNT(cv.id) DESC, ce.submitted_at ASC) <= 3 THEN
          COALESCE(v_competition.prize_pool->>'points', '0')::INTEGER / 2
        WHEN ROW_NUMBER() OVER (ORDER BY COUNT(cv.id) DESC, ce.submitted_at ASC) <= 10 THEN
          COALESCE(v_competition.prize_pool->>'points', '0')::INTEGER / 4
        ELSE 0
      END as points_awarded
    FROM competition_entries ce
    LEFT JOIN competition_votes cv ON ce.id = cv.entry_id
    WHERE ce.competition_id = p_competition_id
      AND ce.status IN ('submitted', 'approved', 'featured')
    GROUP BY ce.id, ce.participant_id
  )
  UPDATE competition_entries ce
  SET
    final_placement = fr.final_rank,
    final_points_awarded = fr.points_awarded
  FROM final_rankings fr
  WHERE ce.id = fr.entry_id
  RETURNING
    fr.entry_id,
    fr.participant_id,
    fr.final_rank,
    fr.final_votes,
    fr.points_awarded,
    fr.winner_type;
END;
$$ LANGUAGE plpgsql;

-- Create trigger function to update vote counts in real-time
CREATE OR REPLACE FUNCTION update_entry_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the votes_count in competition_entries table
  UPDATE competition_entries
  SET
    votes_count = (
      SELECT COUNT(*)
      FROM competition_votes
      WHERE entry_id = NEW.entry_id
    ),
    updated_at = NOW()
  WHERE id = NEW.entry_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for real-time vote counting
CREATE TRIGGER trigger_vote_count_insert
AFTER INSERT ON competition_votes
FOR EACH ROW
EXECUTE FUNCTION update_entry_vote_count();

CREATE TRIGGER trigger_vote_count_delete
AFTER DELETE ON competition_votes
FOR EACH ROW
EXECUTE FUNCTION update_entry_vote_count();

-- Enable RLS on competition_votes
ALTER TABLE competition_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for competition_votes
CREATE POLICY "Users can view votes for their own entries" ON competition_votes
  FOR SELECT USING (
    auth.uid() = voter_id OR
    auth.uid() IN (
      SELECT participant_id
      FROM competition_entries
      WHERE id = entry_id
    )
  );

CREATE POLICY "Users can insert their own votes" ON competition_votes
  FOR INSERT WITH CHECK (
    auth.uid() = voter_id AND
    voter_id NOT IN (
      SELECT participant_id
      FROM competition_entries
      WHERE id = entry_id
    )
  );

CREATE POLICY "Users can delete their own votes" ON competition_votes
  FOR DELETE USING (auth.uid() = voter_id);

-- Create view for public leaderboards
CREATE OR REPLACE VIEW public_leaderboards AS
SELECT
  c.id as competition_id,
  c.title as competition_title,
  c.status as competition_status,
  c.end_date,
  c.voting_end_date,
  cl.rank,
  cl.participant_username,
  cl.participant_avatar_url,
  cl.entry_title,
  cl.entry_images,
  cl.votes_count,
  cl.total_votes_count,
  cl.created_at,
  CASE
    WHEN NOW() > COALESCE(c.voting_end_date, c.end_date) + INTERVAL '6 hours' THEN true
    ELSE false
  END as winners_announced
FROM get_competition_leaderboard(c.id) cl
JOIN competitions c ON c.id = cl.competition_id
WHERE c.status IN ('voting', 'completed')
  AND c.end_date <= NOW() + INTERVAL '7 days'; -- Show recent competitions

-- Grant permissions
GRANT SELECT ON public_leaderboards TO authenticated;
GRANT SELECT ON competition_votes TO authenticated;
GRANT INSERT ON competition_votes TO authenticated;
GRANT DELETE ON competition_votes TO authenticated;

-- Function to handle voting (with uniqueness enforcement)
CREATE OR REPLACE FUNCTION vote_for_competition_entry(
  p_entry_id UUID,
  p_voter_country TEXT DEFAULT NULL,
  p_voter_ip INET DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_entry competition_entries%ROWTYPE;
  v_competition competitions%ROWTYPE;
  v_existing_vote competition_votes%ROWTYPE;
  v_can_vote BOOLEAN;
  v_result JSONB;
BEGIN
  -- Get entry and competition details
  SELECT * INTO v_entry FROM competition_entries WHERE id = p_entry_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Entry not found');
  END IF;

  SELECT * INTO v_competition FROM competitions WHERE id = v_entry.competition_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Competition not found');
  END IF;

  -- Check if voting is open
  v_can_vote :=
    v_competition.status = 'voting' AND
    NOW() >= v_competition.start_date AND
    NOW() <= COALESCE(v_competition.voting_end_date, v_competition.end_date);

  IF NOT v_can_vote THEN
    RETURN jsonb_build_object('success', false, 'error', 'Voting is not open for this competition');
  END IF;

  -- Check if user already voted for this entry
  SELECT * INTO v_existing_vote
  FROM competition_votes
  WHERE entry_id = p_entry_id AND voter_id = auth.uid();

  IF v_existing_vote IS NOT NULL THEN
    -- Remove existing vote (toggle functionality)
    DELETE FROM competition_votes WHERE id = v_existing_vote.id;
    v_result := jsonb_build_object(
      'success', true,
      'action', 'vote_removed',
      'votes_count', (SELECT COUNT(*) FROM competition_votes WHERE entry_id = p_entry_id)
    );
  ELSE
    -- Add new vote
    INSERT INTO competition_votes (
      entry_id,
      voter_id,
      competition_id,
      voter_country,
      voter_ip
    ) VALUES (
      p_entry_id,
      auth.uid(),
      v_entry.competition_id,
      p_voter_country,
      p_voter_ip
    );

    v_result := jsonb_build_object(
      'success', true,
      'action', 'vote_added',
      'votes_count', (SELECT COUNT(*) FROM competition_votes WHERE entry_id = p_entry_id)
    );
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user's voting status for a competition
CREATE OR REPLACE FUNCTION get_user_voting_status(p_competition_id UUID)
RETURNS TABLE (
  entry_id UUID,
  has_voted BOOLEAN,
  voted_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ce.id as entry_id,
    cv.id IS NOT NULL as has_voted,
    cv.created_at as voted_at
  FROM competition_entries ce
  LEFT JOIN competition_votes cv ON ce.id = cv.entry_id AND cv.voter_id = auth.uid()
  WHERE ce.competition_id = p_competition_id
    AND ce.status IN ('submitted', 'approved', 'featured');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments for documentation
COMMENT ON TABLE competition_votes IS 'Heart-based voting for competition entries with RLS enforcement';
COMMENT ON COLUMN competition_votes.vote_type IS 'Type of vote (currently only heart/like supported)';
COMMENT ON COLUMN competition_votes.voter_country IS 'Country of the voter for filtering';
COMMENT ON COLUMN competition_votes.voter_ip IS 'IP address of voter for fraud detection';
COMMENT ON FUNCTION vote_for_competition_entry IS 'Secure voting function with uniqueness enforcement and toggle functionality';
COMMENT ON FUNCTION get_competition_leaderboard IS 'Country-filtered leaderboard with ranking';
COMMENT ON FUNCTION determine_competition_winners IS 'Determines winners 6 hours after voting ends';
COMMENT ON VIEW public_leaderboards IS 'Public view of competition leaderboards';