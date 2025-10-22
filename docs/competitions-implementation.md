# Competitions System Implementation

## Overview

Complete competitions system with country-based filtering, one-entry-per-competition enforcement, and comprehensive management features. Built with luxury purple (#6a2fb0) and gold (#f2c94c) theming throughout.

## Architecture

### Database Layer (PostgreSQL + Supabase)

#### Tables Created:

**competitions**
```sql
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
  status TEXT NOT NULL DEFAULT 'draft',
  judge_panel UUID[],
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**competition_entries**
```sql
CREATE TABLE competition_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  competition_id UUID NOT NULL REFERENCES competitions(id),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  likes INTEGER DEFAULT 0,
  votes_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'submitted',
  final_placement INTEGER,
  final_points_awarded INTEGER,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Additional fields for judging...
);
```

#### Key Features:
- ✅ **One Entry Per Competition**: Enforced by RLS policy and unique constraint
- ✅ **Country Filtering**: Competitions can be filtered by country
- ✅ **Status Management**: draft → active → voting → completed workflow
- ✅ **Prize Pool System**: JSONB structure for flexible prize configurations
- ✅ **Row Level Security**: Users can only manage their own entries

### Backend API (Go + Chi)

**File**: `7ftrends-api/internal/handlers/competitions.go`

#### Endpoints:
- `GET /api/competitions/active` - Get active competitions
- `GET /api/competitions/{id}` - Get competition details
- `POST /api/competitions` - Create competition
- `POST /api/competitions/entries` - Submit entry
- `GET /api/competitions/{id}/entries` - Get competition entries
- `GET /api/competitions/my-entries` - Get user's entries
- `PATCH /api/competitions/entries/{id}/withdraw` - Withdraw entry

#### Key Features:
- ✅ **Authentication**: JWT-based user authentication
- ✅ **Validation**: Comprehensive request validation
- ✅ **Error Handling**: Proper HTTP status codes and error messages
- ✅ **Type Safety**: Full TypeScript-style struct definitions
- ✅ **Pagination**: Offset/limit pagination for entries

### Frontend (React Native + Expo)

**Service Layer**: `src/services/competitionsService.ts`
- Complete API integration with error handling
- Image upload functionality
- Validation helpers
- Authentication token management

**Components**:
- `CompetitionsScreen` - Main competitions listing
- `CompetitionCard` - Individual competition display
- `CreateCompetitionModal` - Competition creation form
- `CompetitionDetailModal` - Competition details and entry management
- `SubmitEntryModal` - Entry submission with TryOn integration
- `CompetitionEntryCard` - Individual entry display

## Key Features Implemented

### ✅ Competition Management
- Create competitions with country targeting
- Theme-based competitions
- Prize pool configuration
- Start/end date management
- Status progression (draft → active → voting → completed)

### ✅ Entry System
- **One Entry Per Competition**: Enforced at database level
- Image upload (main + additional images)
- Title and description
- Tag system for categorization
- Entry status management (submitted → approved → featured)

### ✅ User Experience
- Country-based filtering
- Search functionality
- Sorting options (votes, likes, latest)
- Real-time entry counts
- User entry status indicators

### ✅ Virtual Try-On Integration
- Direct integration with TryOnScreen
- AI-powered outfit creation
- Seamless image transfer to competition entry
- "Try On First" functionality

### ✅ Security & Validation
- Row Level Security (RLS) policies
- Input validation on both client and server
- Authentication enforcement
- SQL injection prevention
- File upload security

## Usage Examples

### Basic Competition Listing
```tsx
import CompetitionsScreen from '@/components/competitions/CompetitionsScreen';

function MyApp() {
  return (
    <CompetitionsScreen
      onCompetitionPress={(competition) => {
        console.log('Selected:', competition.title);
      }}
      onEntryPress={(entry) => {
        console.log('Entry selected:', entry.title);
      }}
    />
  );
}
```

### Service Integration
```tsx
import { competitionsService } from '@/services/competitionsService';

// Get active competitions
const competitions = await competitionsService.getActiveCompetitions('US');

// Submit entry
const entry = await competitionsService.submitCompetitionEntry({
  competition_id: 'uuid',
  title: 'My Summer Look',
  image_url: 'https://example.com/image.jpg',
  tags: ['summer', 'casual', 'trendy']
});
```

### Create Competition Modal
```tsx
import { CreateCompetitionModal } from '@/components/competitions/CreateCompetitionModal';

function CompetitionCreator() {
  const [showModal, setShowModal] = useState(false);

  return (
    <CreateCompetitionModal
      visible={showModal}
      onClose={() => setShowModal(false)}
      onSuccess={(competition) => {
        console.log('Competition created:', competition.id);
      }}
    />
  );
}
```

## Database Schema Details

### Row Level Security Policies

**Competition Entries Policy**:
```sql
CREATE POLICY "Authenticated users can create one entry per competition"
ON competition_entries
FOR INSERT WITH CHECK (
  auth.uid() = user_id AND
  NOT EXISTS (
    SELECT 1 FROM competition_entries
    WHERE competition_id = competition_entries.competition_id
    AND user_id = auth.uid()
    AND status NOT IN ('withdrawn', 'rejected')
  )
);
```

This ensures each user can only submit one entry per competition, with withdrawn/rejected entries not counting toward the limit.

### Functions and Views

**Active Competitions Function**:
```sql
CREATE OR REPLACE FUNCTION get_active_competitions(p_country_filter TEXT DEFAULT NULL)
RETURNS TABLE (
  -- Competition fields plus user_entered boolean
);
```

**Competition Entries with Pagination**:
```sql
CREATE OR REPLACE FUNCTION get_competition_entries(
  p_competition_id UUID,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0,
  p_sort_by TEXT DEFAULT 'votes_count',
  p_sort_order TEXT DEFAULT 'DESC'
)
RETURNS TABLE (
  -- Entry fields with sorting options
);
```

## API Response Formats

### Competition Response
```json
{
  "id": "uuid",
  "country": "US",
  "title": "Summer Fashion Challenge",
  "theme": "Street Style",
  "description": "Show us your best summer street style",
  "banner_image_url": "https://example.com/banner.jpg",
  "prize_pool": {
    "points": 1000,
    "rewards": ["Gift card", "Feature on homepage"],
    "sponsor": "Fashion Brand"
  },
  "max_entries": 100,
  "start_at": "2024-06-01T00:00:00Z",
  "end_at": "2024-06-30T23:59:59Z",
  "status": "active",
  "entries_count": 45,
  "user_entered": false,
  "created_at": "2024-05-15T10:00:00Z"
}
```

### Entry Response
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "username": "fashionista",
  "competition_id": "uuid",
  "title": "Urban Summer Look",
  "description": "Casual street style perfect for summer",
  "image_url": "https://example.com/entry.jpg",
  "images": ["https://example.com/1.jpg", "https://example.com/2.jpg"],
  "tags": ["summer", "street", "casual"],
  "likes": 42,
  "votes_count": 128,
  "status": "approved",
  "submitted_at": "2024-06-10T14:30:00Z",
  "user_liked": false
}
```

## Environment Setup

### Required Environment Variables

**Frontend (.env)**:
```env
EXPO_PUBLIC_API_URL=http://localhost:8080/api
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Backend (.env)**:
```env
DATABASE_URL=your_database_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_jwt_secret
```

### Database Migration

Run the migration in order:
1. `supabase/migrations/competitions-schema.sql`
2. `supabase/migrations/competition-voting.sql` (if voting needed)

## Security Considerations

### Authentication
- All API endpoints require valid JWT tokens
- User context extracted from auth.uid()
- Row Level Security enforced at database level

### Input Validation
- Server-side validation for all inputs
- SQL injection prevention through parameterized queries
- File upload size and type restrictions

### Authorization
- Users can only modify their own entries
- Competition creators can manage their competitions
- Admin functions for judging and moderation

## Testing

### Unit Tests
```bash
# Test service layer
npm test competitionsService.test.ts

# Test components
npm test CompetitionCard.test.tsx
```

### Integration Tests
- Competition creation flow
- Entry submission workflow
- RLS policy enforcement
- Image upload functionality

## Future Enhancements

### Planned Features
- [ ] **Advanced Voting System**: Multiple voting criteria
- [ ] **Judge Panel**: Expert judging interface
- [ ] **Prize Distribution**: Automated point allocation
- [ ] **Analytics**: Competition performance metrics
- [ ] **Notifications**: Entry status updates
- [ ] **Social Sharing**: Share entries to social media
- [ ] **Live Results**: Real-time voting displays
- [ ] **Entry Categories**: Multiple category support

### Performance Optimizations
- [ ] **Image CDN**: Optimized image delivery
- [ ] **Caching**: Redis for frequently accessed data
- [ ] **Database Indexing**: Optimized queries
- [ ] **Pagination**: Cursor-based pagination for large datasets

## Troubleshooting

### Common Issues

**"One entry per competition" not working**
- Check RLS policies are enabled
- Verify unique constraint exists
- Ensure status filtering is correct

**Image upload failing**
- Check file size limits (20MB max)
- Verify storage bucket permissions
- Ensure user is authenticated

**Country filtering not working**
- Verify competition.country field is populated
- Check frontend country selection logic
- Ensure query parameters are passed correctly

### Debug Mode

Enable detailed logging:
```typescript
// In development
if (__DEV__) {
  console.log('Competitions Debug:', { competition, user, entry });
}
```

## Support

For technical issues:
1. Check database schema is properly migrated
2. Verify RLS policies are enabled
3. Ensure all environment variables are set
4. Check network connectivity to API
5. Review browser/React Native console for errors

---

This implementation provides a complete, production-ready competitions system with proper security, scalability, and user experience considerations. The luxury-themed UI and seamless TryOn integration create a compelling fashion competition platform.