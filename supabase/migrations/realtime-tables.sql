-- Real-time Tables Migration
-- Creates tables required for real-time subscriptions and notifications

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('like', 'comment', 'follow', 'competition_update', 'competition_winner', 'new_follower', 'post_mention', 'competition_end', 'trending_post')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create post_interactions table for tracking user interactions
CREATE TABLE IF NOT EXISTS post_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('view', 'like', 'comment', 'share', 'save')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for real-time performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS notifications_unread_idx ON notifications(user_id, read) WHERE read = FALSE;

CREATE INDEX IF NOT EXISTS idx_post_interactions_user_post ON post_interactions(user_id, post_id);
CREATE INDEX IF NOT EXISTS idx_post_interactions_post_id ON post_interactions(post_id);

-- Create post engagement triggers for real-time updates
CREATE OR REPLACE FUNCTION update_post_engagement()
RETURNS TRIGGER AS $$
BEGIN
  -- Update post engagement counts
  UPDATE posts
  SET
    likes_count = (
      SELECT COUNT(*)::INTEGER
      FROM likes
      WHERE likes.post_id = NEW.post_id
    ),
    comments_count = (
      SELECT COUNT(*)::INTEGER
      FROM comments
      WHERE comments.post_id = NEW.post_id
    ),
    shares_count = (
      SELECT COUNT(*)::INTEGER
      FROM shares
      WHERE shares.post_id = NEW.post_id
    ),
    updated_at = NOW()
  WHERE posts.id = NEW.post_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for like events
CREATE OR REPLACE TRIGGER trigger_post_like_engagement
AFTER INSERT OR UPDATE OR DELETE ON likes
FOR EACH ROW
EXECUTE FUNCTION update_post_engagement();

-- Create trigger for comment events
CREATE OR REPLACE TRIGGER trigger_post_comment_engagement
AFTER INSERT OR UPDATE OR DELETE ON comments
FOR EACH ROW
EXECUTE FUNCTION update_post_engagement();

-- Create trigger for share events
CREATE OR REPLACE TRIGGER trigger_post_share_engagement
AFTER INSERT OR UPDATE OR DELETE ON shares
FOR EACH ROW
EXECUTE FUNCTION update_post_engagement();

-- Create notification functions
CREATE OR REPLACE FUNCTION create_like_notification()
RETURNS TRIGGER AS $$
DECLARE
  post_author_id UUID;
BEGIN
  -- Get the post author
  SELECT posts.user_id INTO post_author_id
  FROM posts
  WHERE posts.id = NEW.post_id;

  -- Don't create notification for self-like
  IF post_author_id IS NOT NULL AND post_author_id != NEW.user_id THEN
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      data,
      created_at
    ) VALUES (
      post_author_id,
      'like',
      'New Like',
      (SELECT u.username || ' liked your post' FROM auth.users u WHERE u.id = NEW.user_id),
      jsonb_build_object(
        'post_id', NEW.post_id,
        'liker_id', NEW.user_id,
        'liker_username', (SELECT u.username FROM auth.users u WHERE u.id = NEW.user_id)
      ),
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create notification for new comments
CREATE OR REPLACE FUNCTION create_comment_notification()
RETURNS TRIGGER AS $$
DECLARE
  post_author_id UUID;
BEGIN
  -- Get the post author
  SELECT posts.user_id INTO post_author_id
  FROM posts
  WHERE posts.id = NEW.post_id;

  -- Don't create notification for self-comment
  IF post_author_id IS NOT NULL AND post_author_id != NEW.user_id THEN
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      data,
      created_at
    ) VALUES (
      post_author_id,
      'comment',
      'New Comment',
      (SELECT u.username || ' commented on your post' FROM auth.users u WHERE u.id = NEW.user_id),
      jsonb_build_object(
        'post_id', NEW.post_id,
        'comment_id', NEW.id,
        'commenter_id', NEW.user_id,
        'commenter_username', (SELECT u.username FROM auth.users u WHERE u.id = NEW.user_id),
        'comment_content', LEFT(NEW.content, 100)
      ),
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plIGGER;

-- Create notification for new followers
CREATE OR REPLACE FUNCTION create_follow_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    data,
    created_at
  ) VALUES (
      NEW.following_id,
      'follow',
      'New Follower',
      (SELECT u.username || ' started following you' FROM auth.users u WHERE u.id = NEW.follower_id),
      jsonb_build_object(
        'follower_id', NEW.follower_id,
        'follower_username', (SELECT u.username FROM auth.users u WHERE u.id = NEW.follower_id),
        'following_id', NEW.following_id
      ),
      NOW()
    );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create notification for competition updates
CREATE OR REPLACE FUNCTION create_competition_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create notification for status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      data,
      created_at
    )
    SELECT
      cu.user_id,
      'competition_update',
      CASE
        WHEN NEW.status = 'ended' THEN 'Competition Ended'
        WHEN NEW.status = 'judging' THEN 'Competition Judging'
        WHEN NEW.status = 'completed' THEN 'Competition Complete'
        ELSE 'Competition Update'
      END,
      'Competition "' || NEW.title || '" has been updated',
      jsonb_build_object(
        'competition_id', NEW.id,
        'competition_title', NEW.title,
        'old_status', OLD.status,
        'new_status', NEW.status,
        'ended_at', NEW.ended_at
      ),
      NOW()
    FROM competition_entries cu
    WHERE cu.competition_id = NEW.id;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for notifications
CREATE TRIGGER trigger_like_notification
AFTER INSERT ON likes
FOR EACH ROW
WHEN (NEW.created_at = NOW() OR NEW.created_at IS NULL) -- Only for new likes
EXECUTE FUNCTION create_like_notification();

CREATE TRIGGER trigger_comment_notification
AFTER INSERT ON comments
FOR EACH ROW
WHEN (NEW.created_at = NOW() OR NEW.created_at IS NULL) -- Only for new comments
EXECUTE FUNCTION create_comment_notification();

CREATE TRIGGER trigger_follow_notification
AFTER INSERT ON follows
FOR EACH ROW
WHEN (NEW.created_at = NOW() OR NEW.created_at IS NULL) -- Only for new follows
EXECUTE FUNCTION create_follow_notification();

CREATE TRIGGER trigger_competition_notification
AFTER UPDATE ON competitions
FOR EACH ROW
EXECUTE FUNCTION create_competition_notification();

-- Function to clean up old notifications (keep last 1000 per user)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM notifications
  WHERE id NOT IN (
    SELECT id FROM (
      SELECT id,
        ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
      FROM notifications
    ) ranked
    WHERE rn <= 1000
  );
END;
$$ LANGUAGE plpgsql;

-- Create a function to get real-time subscription filters
CREATE OR REPLACE FUNCTION get_realtime_subscription_filters(
  p_user_id UUID,
  p_table_name TEXT
)
RETURNS TEXT
LANGUAGE plpgsql AS $$
DECLARE
  v_filter TEXT;
BEGIN
  CASE p_table_name
    WHEN 'notifications' THEN
      v_filter := 'user_id=eq.' || p_user_id;
    WHEN 'posts' THEN
      v_filter := 'user_id=in.(SELECT following_id FROM follows WHERE follower_id=' || p_user_id || ') OR ' ||
                  'id=in.(SELECT post_id FROM post_interactions WHERE user_id=' || p_user_id || ')';
    WHEN 'likes' THEN
      v_filter := 'post_id=in.(SELECT post_id FROM post_interactions WHERE user_id=' || p_user_id || ')';
    WHEN 'comments' THEN
      v_filter := 'post_id=in.(SELECT post_id FROM post_interactions WHERE user_id=' || p_user_id || ')';
    WHEN 'competitions' THEN
      v_filter := 'id=in.(SELECT competition_id FROM competition_entries WHERE user_id=' || p_user_id || ')';
    WHEN 'follows' THEN
      v_filter := 'following_id=eq.' || p_user_id;
    ELSE
      v_filter := '1=0'; -- No filter for unsupported tables
  END CASE;

  RETURN v_filter;
END;
$$ LANGUAGE plpgsql;

-- Add RLS policies for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notifications" ON notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications" ON notifications
  FOR DELETE USING (auth.uid() = user_id);

-- Add RLS policies for post_interactions
ALTER TABLE post_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own interactions" ON post_interactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own interactions" ON post_interactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interactions" ON post_interactions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interactions" ON post_interactions
  FOR DELETE USING (auth.uid() = user_id);

-- Create view for unread notification count
CREATE OR REPLACE VIEW unread_notifications_count AS
SELECT
  user_id,
  COUNT(*) as unread_count,
  MAX(created_at) as latest_notification_at
FROM notifications
WHERE read = FALSE
GROUP BY user_id;

-- Create view for real-time statistics
CREATE OR REPLACE VIEW realtime_statistics AS
SELECT
  (SELECT COUNT(*) FROM notifications WHERE read = FALSE) as total_unread_notifications,
  (SELECT COUNT(*) FROM notifications WHERE created_at > NOW() - INTERVAL '1 hour') as notifications_last_hour,
  (SELECT COUNT(*) FROM notifications WHERE created_at > NOW() - INTERVAL '24 hours') as notifications_last_day,
  (SELECT COUNT(*) FROM post_interactions WHERE created_at > NOW() - INTERVAL '1 hour') as interactions_last_hour,
  (SELECT COUNT(DISTINCT user_id) FROM post_interactions WHERE created_at > NOW() - INTERVAL '1 hour') as active_users_last_hour;

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON post_interactions TO authenticated;
GRANT SELECT ON unread_notifications_count TO authenticated;
GRANT SELECT ON realtime_statistics TO authenticated;

COMMENT ON TABLE notifications IS 'Real-time notifications for user engagement';
COMMENT ON TABLE post_interactions IS 'Tracks user interactions for real-time subscriptions';
COMMENT ON COLUMN notifications.type IS 'Type of notification: like, comment, follow, competition_update, etc.';
COMMENT ON COLUMN notifications.data IS 'Additional data for the notification in JSON format';
COMMENT ON COLUMN post_interactions.interaction_type IS 'Type of interaction: view, like, comment, share, save';