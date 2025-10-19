-- Wardrobe AI Tagging Migration
-- Adds AI-generated fields to wardrobe_items table for automatic categorization

-- Add AI-related columns to wardrobe_items table
ALTER TABLE wardrobe_items
ADD COLUMN IF NOT EXISTS ai_tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS ai_category TEXT,
ADD COLUMN IF NOT EXISTS ai_colors TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS ai_occasions TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS ai_seasons TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS ai_style TEXT,
ADD COLUMN IF NOT EXISTS ai_materials TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS ai_confidence DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS ai_processed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS ai_status TEXT DEFAULT 'pending' CHECK (ai_status IN ('pending', 'processing', 'completed', 'failed')),
ADD COLUMN IF NOT EXISTS ai_error_message TEXT;

-- Create index for AI status filtering
CREATE INDEX IF NOT EXISTS idx_wardrobe_items_ai_status ON wardrobe_items(ai_status);

-- Create index for AI category filtering
CREATE INDEX IF NOT EXISTS idx_wardrobe_items_ai_category ON wardrobe_items(ai_category);

-- Create GIN index for AI array fields (PostgreSQL)
CREATE INDEX IF NOT EXISTS idx_wardrobe_items_ai_colors ON wardrobe_items USING GIN(ai_colors);
CREATE INDEX IF NOT EXISTS idx_wardrobe_items_ai_occasions ON wardrobe_items USING GIN(ai_occasions);
CREATE INDEX IF NOT EXISTS idx_wardrobe_items_ai_seasons ON wardrobe_files USING GIN(ai_seasons);
CREATE INDEX IF NOT EXISTS idx_wardrobe_items_ai_materials ON wardrobe_items USING GIN(ai_materials);

-- Create function to automatically trigger AI tagging when image is uploaded
CREATE OR REPLACE FUNCTION trigger_wardrobe_ai_tagging()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger if item has images and hasn't been processed yet
  IF NEW.images IS NOT NULL AND array_length(NEW.images, 1) > 0 AND
     (NEW.ai_status = 'pending' OR NEW.ai_status IS NULL) THEN
    -- Update status to processing
    UPDATE wardrobe_items
    SET ai_status = 'processing',
        ai_processed_at = NOW()
    WHERE id = NEW.id;

    -- Call the Edge Function asynchronously (this would be handled by the app)
    -- The actual function call will be made from the client side
    RAISE LOG 'AI tagging triggered for wardrobe item: %', NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic AI tagging
DROP TRIGGER IF EXISTS trigger_wardrobe_ai_tagging ON wardrobe_items;
CREATE TRIGGER trigger_wardrobe_ai_tagging
AFTER INSERT OR UPDATE ON wardrobe_items
FOR EACH ROW
WHEN (NEW.images IS NOT NULL AND (NEW.ai_status = 'pending' OR NEW.ai_status IS NULL))
EXECUTE FUNCTION trigger_wardrobe_ai_tagging();

-- Create view for items with AI tags
CREATE OR REPLACE VIEW wardrobe_items_with_ai AS
SELECT
  wi.*,
  -- AI-enhanced category (prefer AI-generated, fallback to manual)
  COALESCE(wi.ai_category, wi.category) as enhanced_category,
  -- Combined colors (manual + AI-detected)
  CASE
    WHEN wi.ai_colors IS NOT NULL AND array_length(wi.ai_colors, 1) > 0
    THEN COALESCE(wi.ai_colors, ARRAY[wi.color])
    ELSE ARRAY[wi.color]
  END as all_colors,
  -- Combined occasions
  CASE
    WHEN wi.ai_occasions IS NOT NULL AND array_length(wi.ai_occasions, 1) > 0
    THEN COALESCE(wi.ai_occasions, wi.occasion)
    ELSE wi.occasion
  END as all_occasions,
  -- AI processing status
  CASE
    WHEN wi.ai_status = 'completed' THEN true
    WHEN wi.ai_status = 'failed' THEN false
    ELSE NULL
  END as ai_processed,
  -- AI confidence score
  wi.ai_confidence,
  -- Time since AI processing
  EXTRACT(EPOCH FROM (NOW() - wi.ai_processed_at)) / 3600 as hours_since_ai_processing
FROM wardrobe_items wi;

-- Create function to merge AI tags with manual tags
CREATE OR REPLACE FUNCTION merge_ai_tags(
  p_item_id UUID,
  p_manual_override BOOLEAN DEFAULT false
)
RETURNS JSONB AS $$
DECLARE
  v_item wardrobe_items%ROWTYPE;
  v_merged_tags TEXT[];
  v_merged_colors TEXT[];
  v_merged_occasions TEXT[];
  v_merged_seasons TEXT[];
  v_result JSONB;
BEGIN
  -- Get the current item
  SELECT * INTO v_item FROM wardrobe_items WHERE id = p_item_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wardrobe item not found: %', p_item_id;
  END IF;

  -- Merge tags (manual + AI)
  v_merged_tags := COALESCE(v_item.tags, '{}') || COALESCE(v_item.ai_tags, '{}');
  v_merged_tags := (SELECT ARRAY_agg(DISTINCT unnest) FROM unnest(v_merged_tags));

  -- Merge colors
  v_merged_colors := ARRAY[v_item.color] || COALESCE(v_item.secondary_colors, '{}') || COALESCE(v_item.ai_colors, '{}');
  v_merged_colors := (SELECT ARRAY_agg(DISTINCT unnest) FROM unnest(v_merged_colors) WHERE unnest IS NOT NULL AND unnest != '');

  -- Merge occasions
  v_merged_occasions := COALESCE(v_item.occasion, '{}') || COALESCE(v_item.ai_occasions, '{}');
  v_merged_occasions := (SELECT ARRAY_agg(DISTINCT unnest) FROM unnest(v_merged_occasions) WHERE unnest IS NOT NULL AND unnest != '');

  -- Merge seasons
  v_merged_seasons := COALESCE(v_item.season, '{}') || COALESCE(v_item.ai_seasons, '{}');
  v_merged_seasons := (SELECT ARRAY_agg(DISTINCT unnest) FROM unnest(v_merged_seasons) WHERE unnest IS NOT NULL AND unnest != '');

  -- If manual override, update the main fields with merged data
  IF p_manual_override THEN
    UPDATE wardrobe_items SET
      tags = v_merged_tags,
      secondary_colors = v_merged_colors[2:array_length(v_merged_colors, 1)], -- Keep primary color separate
      occasion = v_merged_occasions,
      season = v_merged_seasons,
      -- If AI category is more specific, use it
      category = CASE
        WHEN v_item.ai_category IS NOT NULL AND v_item.ai_category != v_item.category
        THEN v_item.ai_category
        ELSE v_item.category
      END,
      updated_at = NOW()
    WHERE id = p_item_id;
  END IF;

  -- Return merged data
  v_result := jsonb_build_object(
    'item_id', p_item_id,
    'merged_tags', v_merged_tags,
    'merged_colors', v_merged_colors,
    'merged_occasions', v_merged_occasions,
    'merged_seasons', v_merged_seasons,
    'ai_confidence', v_item.ai_confidence,
    'ai_status', v_item.ai_status
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Create function to retry failed AI tagging
CREATE OR REPLACE FUNCTION retry_ai_tagging(p_item_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Reset AI status and clear previous results
  UPDATE wardrobe_items SET
    ai_status = 'pending',
    ai_tags = '{}',
    ai_category = NULL,
    ai_colors = '{}',
    ai_occasions = '{}',
    ai_seasons = '{}',
    ai_style = NULL,
    ai_materials = '{}',
    ai_confidence = NULL,
    ai_error_message = NULL,
    updated_at = NOW()
  WHERE id = p_item_id AND ai_status = 'failed';

  -- Return true if update was successful
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Add Row Level Security policies for AI fields
ALTER TABLE wardrobe_items ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see their own AI-processed items
CREATE POLICY "Users can view their own AI-processed items" ON wardrobe_items
  FOR SELECT USING (auth.uid() = user_id);

-- Policy to allow users to update their own AI fields
CREATE POLICY "Users can update their own AI fields" ON wardrobe_items
  FOR UPDATE USING (auth.uid() = user_id);

-- Create function to get AI tagging statistics
CREATE OR REPLACE VIEW ai_tagging_statistics AS
SELECT
  COUNT(*) as total_items,
  COUNT(CASE WHEN ai_status = 'completed' THEN 1 END) as ai_processed_items,
  COUNT(CASE WHEN ai_status = 'failed' THEN 1 END) as ai_failed_items,
  COUNT(CASE WHEN ai_status = 'pending' THEN 1 END) as ai_pending_items,
  COUNT(CASE WHEN ai_status = 'processing' THEN 1 END) as ai_processing_items,
  ROUND(AVG(ai_confidence), 2) as avg_confidence_score,
  -- Most common AI categories
  mode() WITHIN GROUP (ORDER BY ai_category) as most_common_ai_category,
  -- Most common AI colors
  array_agg(DISTINCT unnest(ai_colors)) as all_detected_colors,
  -- Processing success rate
  ROUND(
    COUNT(CASE WHEN ai_status = 'completed' THEN 1 END) * 100.0 /
    NULLIF(COUNT(CASE WHEN ai_status IN ('completed', 'failed') THEN 1 END), 0),
    2
  ) as success_rate
FROM wardrobe_items
WHERE ai_status IS NOT NULL;

-- Grant permissions for the new view
GRANT SELECT ON ai_tagging_statistics TO authenticated;
GRANT SELECT ON wardrobe_items_with_ai TO authenticated;

-- Comments for documentation
COMMENT ON COLUMN wardrobe_items.ai_tags IS 'AI-generated descriptive tags from Vision API';
COMMENT ON COLUMN wardrobe_items.ai_category IS 'AI-detected clothing category';
COMMENT ON COLUMN wardrobe_items.ai_colors IS 'AI-detected colors in the item';
COMMENT ON COLUMN wardrobe_items.ai_occasions IS 'AI-suggested appropriate occasions';
COMMENT ON COLUMN wardrobe_items.ai_seasons IS 'AI-suggested appropriate seasons';
COMMENT ON COLUMN wardrobe_items.ai_style IS 'AI-detected style (casual, formal, etc.)';
COMMENT ON COLUMN wardrobe_items.ai_materials IS 'AI-detected materials';
COMMENT ON COLUMN wardrobe_items.ai_confidence IS 'Confidence score (0-1) for AI detection';
COMMENT ON COLUMN wardrobe_items.ai_processed_at IS 'Timestamp when AI processing completed';
COMMENT ON COLUMN wardrobe_items.ai_status IS 'Status of AI processing: pending, processing, completed, failed';
COMMENT ON COLUMN wardrobe_items.ai_error_message IS 'Error message if AI processing failed';

-- Create notification function for AI tagging completion
CREATE OR REPLACE FUNCTION notify_ai_tagging_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify if status changed to completed or failed
  IF OLD.ai_status IS DISTINCT FROM NEW.ai_status AND NEW.ai_status IN ('completed', 'failed') THEN
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      data,
      created_at
    ) VALUES (
      NEW.user_id,
      'ai_tagging_complete',
      CASE
        WHEN NEW.ai_status = 'completed' THEN 'AI Tagging Complete'
        ELSE 'AI Tagging Failed'
      END,
      CASE
        WHEN NEW.ai_status = 'completed' THEN
          'Your wardrobe item has been automatically tagged with ' ||
          CASE
            WHEN array_length(NEW.ai_tags, 1) > 0 THEN array_length(NEW.ai_tags, 1) || ' tags'
            ELSE 'AI tags'
          END
        WHEN NEW.ai_status = 'failed' THEN
          'AI tagging failed for your wardrobe item. Please try again.'
      END,
      jsonb_build_object(
        'item_id', NEW.id,
        'item_name', NEW.name,
        'ai_status', NEW.ai_status,
        'ai_tags', NEW.ai_tags,
        'ai_category', NEW.ai_category,
        'ai_confidence', NEW.ai_confidence,
        'error_message', NEW.ai_error_message
      ),
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for AI tagging completion notifications
DROP TRIGGER IF EXISTS trigger_ai_tagging_notification ON wardrobe_items;
CREATE TRIGGER trigger_ai_tagging_notification
AFTER UPDATE ON wardrobe_items
FOR EACH ROW
WHEN (OLD.ai_status IS DISTINCT FROM NEW.ai_status AND NEW.ai_status IN ('completed', 'failed'))
EXECUTE FUNCTION notify_ai_tagging_completion();