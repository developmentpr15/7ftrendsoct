# Virtual Try-On Implementation

## Overview

This implementation provides a complete virtual try-on system using Google's Gemini 2.5 Flash Image API. It allows users to upload their photo and a garment image, then uses AI to create a realistic composite image showing how the garment would look on the user.

## Architecture

### Frontend (React Native/Expo)

- **VirtualTryOnScreen**: Luxury UI component with camera integration and wardrobe selection
- **imageEditService**: Service layer for Gemini API integration and image processing
- **Styling**: Luxury purple (#6a2fb0) and gold (#f2c94c) theme throughout

### Backend (Go)

- **imageEdit.go**: Secure API endpoint with authentication and validation
- **virtualTryon.sql.go**: Database schema for tracking virtual try-on history
- **Authentication**: JWT-based user authentication and authorization

### Database (Supabase/PostgreSQL)

- **virtual_tryon_history**: Table for tracking user virtual try-on attempts
- **Row Level Security**: Users can only access their own history
- **Storage**: Supabase Storage for composite image uploads

## Features

### Core Functionality
- ✅ Photo capture from camera or gallery selection
- ✅ Wardrobe integration for garment selection
- ✅ AI-powered image composition using Gemini 2.5 Flash
- ✅ Real-time processing with progress tracking
- ✅ History tracking and management
- ✅ Confidence scoring and processing metrics

### User Experience
- ✅ Luxury UI with smooth animations
- ✅ Intuitive tab-based navigation
- ✅ Multiple position options (full-body, upper-body, lower-body, accessory)
- ✅ Fit options (snug, regular, loose)
- ✅ Style options (realistic, stylized, enhanced)
- ✅ Custom instruction support
- ✅ Error handling with user-friendly messages

### Technical Features
- ✅ Comprehensive input validation
- ✅ Base64 image conversion and optimization
- ✅ Retry logic for network failures
- ✅ Exponential backoff for API rate limiting
- ✅ Secure file uploads with authentication
- ✅ TypeScript for type safety
- ✅ Comprehensive error handling

## API Endpoints

### POST /api/image-edit
Processes virtual try-on requests using Gemini API.

**Request Body:**
```json
{
  "userImage": "string",      // Base64 or URL
  "garmentImage": "string",   // Base64 or URL
  "instructions": "string",   // Optional custom instructions
  "position": "full-body",    // Options: upper-body, lower-body, full-body, accessory
  "fit": "regular",           // Options: snug, regular, loose
  "style": "realistic"        // Options: realistic, stylized, enhanced
}
```

**Response:**
```json
{
  "success": true,
  "compositeImageUrl": "https://...",
  "editedImageUrl": "data:image/jpeg;base64,...",
  "confidence": 0.92,
  "processingTime": 2500,
  "details": {
    "modelUsed": "gemini-2.5-flash-image",
    "inputDimensions": {"width": 512, "height": 768},
    "outputDimensions": {"width": 512, "height": 768},
    "appliedInstructions": ["Create realistic overlay..."]
  }
}
```

## Database Schema

### virtual_tryon_history Table
```sql
CREATE TABLE virtual_tryon_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  user_image_url TEXT NOT NULL,
  garment_image_url TEXT NOT NULL,
  composite_image_url TEXT,
  instructions TEXT NOT NULL,
  position TEXT NOT NULL DEFAULT 'full-body',
  fit TEXT NOT NULL DEFAULT 'regular',
  style TEXT NOT NULL DEFAULT 'realistic',
  confidence FLOAT,
  status TEXT NOT NULL DEFAULT 'pending',
  processing_time BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Configuration

### Environment Variables

**Frontend (.env):**
```
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Backend (.env):**
```
GEMINI_API_KEY=your_gemini_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
UPLOADS_DIR=./uploads
JWT_SECRET=your_jwt_secret
```

### Supabase Setup

1. Create the `virtual_tryon_history` table using the provided schema
2. Enable Row Level Security (RLS)
3. Create policies for user access control
4. Set up storage bucket `virtual-tryon-images`
5. Configure storage permissions

## Usage Examples

### Basic Usage
```typescript
import { imageEditService } from '@/services/imageEditService';

const request = {
  userImage: 'https://example.com/user-photo.jpg',
  garmentImage: 'https://example.com/shirt.jpg',
  position: 'full-body',
  fit: 'regular',
  style: 'realistic'
};

const result = await imageEditService.editImageWithGemini(request);

if (result.success) {
  console.log('Composite image:', result.compositeImageUrl);
  console.log('Confidence:', result.confidence);
} else {
  console.error('Error:', result.error);
}
```

### Using the VirtualTryOnScreen Component
```typescript
import { VirtualTryOnScreen } from '@/components/wardrobe/VirtualTryOnScreen';

function MyComponent() {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View>
      <Button
        title="Try Virtual Try-On"
        onPress={() => setModalVisible(true)}
      />

      <VirtualTryOnScreen
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        initialGarmentId="garment-123"
      />
    </View>
  );
}
```

## Error Handling

The implementation includes comprehensive error handling for:

- **API Errors**: Rate limiting, invalid API keys, network failures
- **Validation Errors**: Invalid image formats, missing required fields
- **File Upload Errors**: Storage permissions, quota limits, file size limits
- **Authentication Errors**: Missing or invalid user sessions

### Error Response Format
```json
{
  "success": false,
  "error": "Human-readable error message",
  "details": {
    "code": "ERROR_CODE",
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

## Testing

### Unit Tests
```bash
npm test -- __tests__/imageEditService.test.ts
```

### Integration Tests
```bash
npm test -- __tests__/virtualTryOn.integration.test.tsx
```

### Manual Testing
1. Open the VirtualTryOnScreen modal
2. Take a photo or select from gallery
3. Select a garment from wardrobe
4. Choose position, fit, and style options
5. Add custom instructions if desired
6. Tap "Create Virtual Try-On"
7. Verify processing state and final result

## Performance Considerations

### Image Optimization
- Images are compressed before API calls
- Base64 encoding adds ~33% size overhead
- Maximum file size: 20MB per image
- Supported formats: JPEG, PNG, WebP

### API Rate Limiting
- Exponential backoff for retries
- Maximum 3 retry attempts
- Progressive delay: 1s, 2s, 4s between retries

### Caching
- Composite images cached in Supabase Storage
- 1-hour cache control for uploaded images
- Local history caching for faster retrieval

## Security

### Authentication
- JWT-based user authentication
- Row Level Security for data access
- API key protection through environment variables

### Input Validation
- Server-side validation for all inputs
- Image format and size validation
- SQL injection prevention through parameterized queries

### File Security
- User-isolated storage buckets
- File type validation
- Upload size limits

## Future Enhancements

### Planned Features
- [ ] Batch processing for multiple garments
- [ ] Video try-on functionality
- [ ] Advanced style recommendations
- [ ] Social sharing integration
- [ ] Size prediction algorithm
- [ ] AR integration for live preview

### Performance Improvements
- [ ] Image preprocessing pipeline
- [ ] Edge computing for faster processing
- [ ] Progressive image loading
- [ ] Smart caching strategies

## Troubleshooting

### Common Issues

**Q: "Gemini API key not configured" error**
A: Ensure `EXPO_PUBLIC_GEMINI_API_KEY` is set in your environment variables

**Q: "Storage bucket not configured" error**
A: Create the `virtual-tryon-images` bucket in Supabase Storage

**Q: "Permission denied" errors**
A: Check RLS policies and storage permissions in Supabase

**Q: Slow processing times**
A: Consider optimizing image sizes before upload

### Debug Mode
Enable debug logging by setting:
```typescript
// In imageEditService.ts
console.log('Debug mode enabled');
```

## Support

For technical issues or questions:
1. Check the troubleshooting section above
2. Review the error logs in both frontend and backend
3. Verify all environment variables are correctly set
4. Ensure Supabase configuration is complete