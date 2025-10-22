# Virtual Try-On Usage Guide

## Overview

The TryOnScreen component provides a clean, focused virtual try-on experience where users can:
- Upload or choose a face/body photo
- Select clothing from their wardrobe
- Preview AI-generated try-on results
- Save results to their feed

## Quick Start

### Basic Usage

```tsx
import React, { useState } from 'react';
import TryOnScreen from '@/components/tryon/TryOnScreen';
import { feedService } from '@/services/feedService';

function MyComponent() {
  const [tryOnVisible, setTryOnVisible] = useState(false);

  const handleSaveToFeed = async (imageUrl: string, caption: string) => {
    await feedService.saveTryOnToFeed(imageUrl, caption, {
      source: 'virtual-try-on'
    });
  };

  return (
    <View>
      <TouchableOpacity onPress={() => setTryOnVisible(true)}>
        <Text>Start Virtual Try-On</Text>
      </TouchableOpacity>

      <TryOnScreen
        visible={tryOnVisible}
        onClose={() => setTryOnVisible(false)}
        onSaveToFeed={handleSaveToFeed}
      />
    </View>
  );
}
```

## Component Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `visible` | `boolean` | ✅ | Controls modal visibility |
| `onClose` | `() => void` | ✅ | Called when modal is closed |
| `onSaveToFeed` | `(imageUrl: string, caption: string) => Promise<void>` | ❌ | Called when user saves to feed |

## Features

### 1. Photo Upload
- **Camera Integration**: Take photos directly within the app
- **Gallery Selection**: Choose existing photos from device
- **Image Validation**: Automatic format and size validation
- **Retake Option**: Easy photo replacement

### 2. Clothing Selection
- **Wardrobe Integration**: Pulls from user's wardrobe items
- **Visual Preview**: Shows clothing images in a scrollable grid
- **Selection Indicator**: Clear visual feedback for selected items
- **Category Support**: Works with all clothing categories

### 3. Try-On Options
- **Position Selection**: Full body, upper body, lower body
- **Custom Instructions**: Optional text for specific requirements
- **Style Options**: Realistic, stylized, enhanced looks

### 4. AI Processing
- **Real-time Progress**: Visual progress bar during processing
- **Error Handling**: Graceful failure with user feedback
- **Confidence Scoring**: Shows AI confidence level
- **Processing Metrics**: Displays processing time

### 5. Save to Feed
- **Caption Support**: Add custom text to posts
- **Metadata Storage**: Tracks try-on details and settings
- **Feed Integration**: Seamless posting to user's feed
- **Social Sharing**: Foundation for future sharing features

## Workflow

1. **Photo Selection**: User takes or uploads their photo
2. **Clothing Choice**: Select garment from wardrobe
3. **Options Setup**: Choose position and add instructions (optional)
4. **AI Processing**: Generate virtual try-on result
5. **Review**: Preview the generated result
6. **Save to Feed**: Add caption and post to feed

## Environment Setup

Required environment variables:

```env
# Frontend (.env)
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Backend (.env)
GEMINI_API_KEY=your_gemini_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Dependencies

Make sure these packages are installed:

```bash
npm install expo-camera expo-image-picker expo-linear-gradient
npm install @expo/vector-icons
npm install react-native-svg
```

## Customization

### Styling

The component uses the app's design system:

```tsx
import { COLORS, SIZES, FONTS } from '@/utils/constants';
```

Primary colors:
- Primary: `#6a2fb0` (luxury purple)
- Accent: `#f2c94c` (gold)

### Feed Service

Customize the feed service for your needs:

```tsx
// src/services/feedService.ts
export interface FeedPost {
  id?: string;
  user_id: string;
  image_url: string;
  caption: string;
  type: 'outfit' | 'virtual-tryon' | 'inspiration';
  metadata?: {
    originalPhoto?: string;
    clothingItems?: string[];
    confidence?: number;
    processingTime?: number;
  };
}
```

## Error Handling

The component handles these common errors:

- **Camera Permission**: Requests permission if denied
- **Image Validation**: Checks format and size limits
- **API Failures**: Graceful degradation with user feedback
- **Network Issues**: Retry logic for failed requests
- **Authentication**: Validates user login state

## Testing

Run the test suite:

```bash
npm test TryOnScreen.test.tsx
```

Test cases cover:
- Component rendering
- Photo selection workflow
- Clothing selection
- Try-on processing
- Save to feed functionality
- Error handling
- Modal behavior

## Database Schema

Required tables for full functionality:

```sql
-- Feed posts table
CREATE TABLE feed_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  image_url TEXT NOT NULL,
  caption TEXT,
  type TEXT NOT NULL DEFAULT 'virtual-tryon',
  metadata JSONB,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Post likes table
CREATE TABLE post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Enable RLS
ALTER TABLE feed_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their posts" ON feed_posts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their posts" ON feed_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their posts" ON feed_posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their posts" ON feed_posts
  FOR DELETE USING (auth.uid() = user_id);
```

## Best Practices

1. **Image Quality**: Use good lighting and clear photos
2. **Clothing Selection**: Choose items with clear, high-quality images
3. **Instructions**: Be specific with custom instructions for better results
4. **Position**: Select the appropriate position for the clothing type
5. **Feed Posts**: Add meaningful captions to engage your audience

## Troubleshooting

### Common Issues

**"Camera permission denied"**
- Ensure camera permissions are granted in device settings
- Check that `expo-camera` has proper permissions

**"Processing failed"**
- Check internet connection
- Verify Gemini API key is valid
- Ensure images are under size limits (20MB)

**"Save to feed failed"**
- Check user authentication status
- Verify Supabase configuration
- Ensure database tables exist

**"No clothing items showing"**
- Check wardrobe store integration
- Verify clothing items have valid images
- Ensure user is logged in

### Debug Mode

Enable debug logging:

```tsx
// In development
if (__DEV__) {
  console.log('Try-On Debug:', { userPhoto, selectedClothing, position });
}
```

## Future Enhancements

Planned improvements:
- [ ] Multiple clothing combinations
- [ ] Video try-on support
- [ ] Style recommendations
- [ ] Social sharing features
- [ ] Size prediction AI
- [ ] AR live preview
- [ ] Outfit suggestions based on preferences

## Support

For technical issues:
1. Check the troubleshooting section
2. Verify environment variables
3. Ensure all dependencies are installed
4. Review database schema setup
5. Check network connectivity and API keys