# AI Auto-Tagging Test Guide

## Overview
This guide outlines how to test the AI auto-tagging functionality implemented with Gemini 2.5 Pro.

## Prerequisites

1. **Environment Variables** - Make sure these are set in your Supabase Edge Function environment:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

2. **Database Migration** - Ensure the AI tagging migration has been applied:
   ```sql
   -- The migration should have already added these fields to wardrobe_items:
   -- ai_tags, ai_category, ai_colors, ai_occasions, ai_seasons,
   -- ai_style, ai_materials, ai_confidence, ai_status, ai_processed_at, ai_error_message
   ```

## Testing Steps

### 1. Deploy the Edge Function

```bash
# From your project root
npx supabase functions deploy wardrobe-ai-tagging
```

### 2. Test the Edge Function Directly

You can test the Edge Function with a curl command:

```bash
curl -X POST 'https://your-project-ref.supabase.co/functions/v1/wardrobe-ai-tagging' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "imageUrl": "https://example.com/clothing-item.jpg",
    "itemId": "test-item-id"
  }'
```

### 3. Test via the Mobile App

#### Using the EnhancedImageUpload Component:

```typescript
import React, { useState } from 'react';
import { TouchableOpacity } from 'react-native';
import EnhancedImageUpload from '@/components/wardrobe/EnhancedImageUpload';

export const TestScreen = () => {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <TouchableOpacity onPress={() => setModalVisible(true)}>
      <Text>Test AI Tagging</Text>

      <EnhancedImageUpload
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onUploadComplete={(itemId) => {
          console.log('Upload completed for item:', itemId);
        }}
      />
    </TouchableOpacity>
  );
};
```

#### Using the AITaggingDemo Component:

```typescript
import AITaggingDemo from '@/components/wardrobe/AITaggingDemo';

// Simply render the component in any screen
<AITaggingDemo />
```

### 4. Test via Store Actions

```typescript
import { useAITaggingActions } from '@/store/wardrobeStore';

const { triggerAITagging, monitorAITaggingProgress } = useAITaggingActions();

// Test manual AI tagging
const testAITagging = async (itemId: string, imageUrl: string) => {
  const result = await triggerAITagging(itemId, imageUrl);

  if (result.success) {
    // Monitor progress
    monitorAITaggingProgress(itemId, (status) => {
      console.log('AI Status:', status);

      if (status.status === 'completed') {
        console.log('AI tagging completed successfully!');
      } else if (status.status === 'failed') {
        console.error('AI tagging failed:', status.error);
      }
    });
  }
};
```

### 5. Verify Database Updates

After successful AI tagging, check your database:

```sql
-- Check AI tagging results
SELECT
  id,
  name,
  ai_status,
  ai_confidence,
  ai_category,
  ai_colors,
  ai_tags,
  ai_materials,
  ai_processed_at
FROM wardrobe_items
WHERE ai_status = 'completed'
ORDER BY ai_processed_at DESC;

-- Check for any failed attempts
SELECT
  id,
  name,
  ai_status,
  ai_error_message,
  ai_processed_at
FROM wardrobe_items
WHERE ai_status = 'failed'
ORDER BY ai_processed_at DESC;
```

## Expected Results

### Successful AI Tagging Should Produce:

1. **Category Detection**: One of: top, bottom, dress, outerwear, shoes, accessories, underwear
2. **Color Analysis**: Array of detected colors (e.g., ['white', 'blue'])
3. **Material Detection**: Array of materials (e.g., ['cotton', 'denim'])
4. **Style Classification**: Style type (casual, formal, sporty, elegant, vintage, modern, classic)
5. **Occasion Suggestions**: Appropriate occasions (casual, formal, party, sports, beach, outdoor, work, date, travel)
6. **Season Recommendations**: Suitable seasons (spring, summer, fall, winter)
7. **Descriptive Tags**: Array of descriptive tags
8. **Confidence Score**: Float between 0 and 1
9. **Status**: Should be 'completed'

### Example Response:

```json
{
  "tags": ["white cotton shirt", "button-up collar", "long sleeves"],
  "category": "top",
  "colors": ["white"],
  "occasions": ["casual", "work", "date"],
  "seasons": ["spring", "summer", "fall"],
  "style": "casual",
  "materials": ["cotton"],
  "confidence": 0.92,
  "description": "A clean white cotton shirt perfect for casual and semi-formal occasions"
}
```

## Troubleshooting

### Common Issues:

1. **Gemini API Key Not Found**
   - Ensure `GEMINI_API_KEY` is set in Supabase Edge Function secrets
   - Check that the API key is valid and has the necessary permissions

2. **Image Processing Fails**
   - Verify the image URL is accessible and public
   - Check image format (JPEG/PNG recommended)
   - Ensure image size is reasonable (under 10MB)

3. **Edge Function Timeouts**
   - Gemini API calls can take time for complex images
   - Consider increasing timeout limits in Supabase settings

4. **Database Update Failures**
   - Check Row Level Security policies on wardrobe_items table
   - Verify user has proper permissions
   - Check that all required AI fields exist in the table

### Debug Steps:

1. **Check Edge Function Logs**:
   ```bash
   npx supabase functions logs wardrobe-ai-tagging
   ```

2. **Monitor Database Changes**:
   ```sql
   -- Real-time monitoring
   SELECT * FROM wardrobe_items WHERE ai_status = 'processing';
   ```

3. **Test API Response**:
   Add logging in the Edge Function to see Gemini API responses

## Performance Considerations

- **Rate Limiting**: Gemini API has rate limits - implement delays between batch requests
- **Image Size**: Optimize images before processing for faster responses
- **Caching**: Consider caching AI results for similar items
- **Cost Management**: Monitor API usage to control costs

## Next Steps

1. **Batch Processing**: Implement batch AI tagging for existing wardrobe items
2. **Confidence Thresholds**: Set minimum confidence levels for auto-acceptance
3. **User Overrides**: Allow users to correct AI-generated tags
4. **Learning System**: Track user corrections to improve future suggestions
5. **Advanced Features**: Implement outfit suggestions based on AI analysis