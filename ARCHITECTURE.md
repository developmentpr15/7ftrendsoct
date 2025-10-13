# 7Ftrends App Architecture

## 📱 Project Overview
7Ftrends is a React Native fashion app built with Expo that allows users to discover trends, manage their wardrobe, participate in challenges, and connect with other fashion enthusiasts.

## 🏗️ Architecture Overview

### Technology Stack
- **Framework**: React Native with Expo
- **Navigation**: React Navigation (Bottom Tabs + Stack Navigators)
- **State Management**: Zustand (hooks-based)
- **Backend**: Supabase (Authentication, Database)
- **Styling**: React Native StyleSheet
- **Icons**: Expo Vector Icons (Ionicons)
- **Fonts**: Google Fonts (Pacifico)

### Project Structure
```
7ftrends/
├── App.js                           # Main app entry point
├── app.json                       # Expo configuration
├── package.json                   # Dependencies and scripts
├── babel.config.js               # Babel configuration
├── .env.local                     # Environment variables
├── src/
│   ├── components/               # Reusable UI components
│   │   ├── ConnectionStatus.js  # Network connection indicator
│   │   └── ErrorBoundary.js     # Error handling wrapper
│   ├── navigation/               # Navigation structure
│   │   ├── AppNavigator.js      # Root navigator with auth logic
│   │   ├── AuthNavigator.js     # Authentication screens (Login/Register)
│   │   └── TabNavigator.js      # Main app navigation (3600+ lines)
│   ├── store/                   # State management (Zustand)
│   │   ├── authStore.js         # Authentication state
│   │   └── appStore.js          # Application state
│   └── utils/                   # Utility functions
│       ├── auth.js              # Authentication helpers
│       ├── constants.js         # App constants and styles
│       └── supabase.js          # Supabase connection helpers
├── docs/                         # Documentation
│   ├── ARCHITECTURE.md          # This file
│   ├── SETUP.md                 # Setup instructions
│   └── NETWORK_TROUBLESHOOTING.md
└── .expo/                        # Expo build files
```

## 🎯 Core Features Architecture

### 1. Authentication System
- **Location**: `src/navigation/AuthNavigator.js`, `src/store/authStore.js`, `src/utils/auth.js`
- **Flow**: Login/Register → Supabase Auth → State Management → App Navigation
- **Components**: LoginScreen, RegisterScreen

### 2. Main Navigation (TabNavigator.js)
**Massive component (3600+ lines) containing:**
- **HomeScreen**: Feed with posts, stories, search, messaging, notifications
- **WardrobeScreen**: Clothing management, outfit suggestions
- **ARScreen**: Camera integration for virtual try-on
- **CompetitionScreen**: Fashion challenges and contests
- **ProfileScreen**: User profile with bio and settings

### 3. State Management (Zustand)
- **authStore.js**: User authentication, login/logout, user data
- **appStore.js**: Application data, posts, challenges, wardrobe items

### 4. Component Architecture
- **ErrorBoundary.js**: Global error handling with fallback UI
- **ConnectionStatus.js**: Network status indicator (currently not used)

## 📱 Screen Breakdown

### Home Screen Features
- Instagram-style stories
- Trending hashtags with filtering
- Post feed with likes, comments, sharing
- Real-time search with suggestions
- Messaging system with conversations
- Notification center
- Post creation with images
- Country selector

### Wardrobe Screen Features
- Clothing item management
- Category organization
- Outfit suggestions
- Statistics dashboard
- Quick actions

### AR Screen Features
- Camera integration with permissions
- Virtual try-on functionality
- Photo gallery
- Camera controls

### Competition Screen Features
- Active and past challenges
- Challenge participation
- Admin challenge creation
- Leaderboard

### Profile Screen Features
- Editable bio
- User statistics
- Functional menu items with detailed options
- Settings and preferences

## 🔧 Data Flow

### Authentication Flow
1. User enters credentials in AuthNavigator
2. Supabase authentication via `src/utils/auth.js`
3. User data stored in `src/store/authStore.js`
4. Navigation switches to TabNavigator

### State Management
- **Global State**: Zustand stores with hooks
- **Local State**: React hooks for UI state
- **Real-time Updates**: State changes propagate to all components

### Navigation Flow
1. **App.js** → **ErrorBoundary** → **AppNavigator**
2. **AppNavigator** handles auth state → **AuthNavigator** or **TabNavigator**
3. **TabNavigator** manages bottom tabs and screen stacks

## 🎨 Styling Architecture

### Style System
- **Centralized**: All styles in `src/utils/constants.js`
- **Theming**: COLORS, SIZES, FONTS, SHADOWS constants
- **Consistency**: Shared styles across all components
- **Responsive**: Dynamic sizing based on screen dimensions

### Font System
- **Primary**: Pacifico (brand logo, section titles)
- **Secondary**: System fonts (content, buttons)
- **Weights**: Bold, Medium, Regular variants

## 🔗 API Integration

### Supabase Integration
- **Authentication**: User signup, login, session management
- **Database**: Posts, user data, challenges
- **Real-time**: Connection testing and status

### Network Handling
- **Connection Testing**: Periodic Supabase connectivity checks
- **Error States**: Graceful degradation for network issues
- **Retry Logic**: Automatic reconnection attempts

## 📊 Performance Considerations

### Large File Management
- **TabNavigator.js**: 3600+ lines (consider splitting)
- **Modal Management**: Efficient state handling for multiple modals
- **Image Optimization**: Lazy loading and caching

### Memory Management
- **State Cleanup**: Proper useEffect cleanup
- **Component Unmounting**: Safe state updates
- **Image Memory**: Optimized image handling

## 🔐 Security Architecture

### Authentication
- **Supabase Auth**: Secure session management
- **Token Storage**: Secure token handling
- **Session Validation**: Automatic token refresh

### Data Security
- **Environment Variables**: Sensitive data in .env.local
- **Input Validation**: Client-side validation
- **Error Handling**: No sensitive data exposure in errors

## 🚀 Deployment Architecture

### Expo Build System
- **Development**: `expo start` with Metro bundler
- **Production**: `expo build` for app store deployment
- **Environment**: Proper environment variable management

### Build Configuration
- **Babel**: Transpilation for React Native features
- **Metro**: Bundle optimization and asset management
- **Expo**: Platform-specific builds and deployment

## 📝 Development Guidelines

### Code Organization
- **Component-Based**: Reusable, single-responsibility components
- **Hook-Driven**: Functional components with React hooks
- **Style Separation**: Consistent styling patterns

### Best Practices
- **Error Boundaries**: Graceful error handling
- **Loading States**: Proper loading indicators
- **Accessibility**: Semantic components and screen readers

## 🔧 Recommended Improvements

### Code Splitting
- Split TabNavigator.js into separate screen components
- Create feature-based module structure
- Implement lazy loading for better performance

### Architecture Enhancements
- Add TypeScript for better type safety
- Implement proper testing framework
- Add API abstraction layer
- Create reusable UI component library

### Performance Optimizations
- Implement virtualization for long lists
- Add image caching and optimization
- Optimize bundle size and loading times