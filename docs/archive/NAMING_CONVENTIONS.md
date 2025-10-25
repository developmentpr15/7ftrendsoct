# 7Ftrends - Naming Conventions & Standards Guide

This document outlines the naming conventions and coding standards for the 7Ftrends fashion try-on + social app.

## 📁 File & Folder Naming

### Directory Structure
```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Basic UI elements (Button, Input, etc.)
│   ├── forms/          # Form-related components
│   ├── lists/          # List and grid components
│   ├── modals/         # Modal components
│   └── features/       # Complex feature components
├── screens/            # Screen components
│   ├── auth/           # Authentication screens
│   ├── social/         # Social feature screens
│   ├── wardrobe/       # Wardrobe management screens
│   ├── ar/             # AR try-on screens
│   ├── profile/        # User profile screens
│   └── core/           # Core app screens (Splash, Onboarding)
├── services/           # Business logic and API calls
│   ├── api/            # API client and endpoints
│   ├── auth/           # Authentication services
│   ├── storage/        # Local storage services
│   └── ai/             # AI/ML services
├── hooks/              # Custom React hooks
│   ├── api/            # API-related hooks
│   ├── ui/             # UI-related hooks
│   └── utils/          # Utility hooks
├── store/              # State management (Zustand)
├── utils/              # Utility functions
├── types/              # TypeScript definitions
├── config/             # Configuration files
├── styles/             # Global styles and themes
└── assets/             # Static assets
    ├── images/         # Images and icons
    ├── fonts/          # Custom fonts
    └── data/           # Mock data
```

### File Naming Rules

#### 1. Component Files
- **PascalCase** for React component files
- **Descriptive names** that clearly indicate purpose
- **Include feature name** for feature-specific components

```javascript
// ✅ Good
UserProfileHeader.js
WardrobeItemCard.js
CompetitionEntryForm.js
StoryCircle.js

// ❌ Bad
userprofile.js
wardrobecard.js
form.js
story.js
```

#### 2. Hook Files
- **camelCase** with `use` prefix
- **Descriptive names** indicating functionality

```javascript
// ✅ Good
useUserProfile.js
useWardrobeItems.js
useCameraPermissions.js
useDebounce.js

// ❌ Bad
Userprofile.js
wardrobe.js
camera.js
debounce.js
```

#### 3. Service Files
- **camelCase** for service files
- **Descriptive names** ending with service type

```javascript
// ✅ Good
wardrobeService.js
authService.js
apiClient.js
imageStorageService.js

// ❌ Bad
wardrobe.js
auth.js
client.js
storage.js
```

#### 4. Utility Files
- **camelCase** for utility functions
- **Group related utilities** in single files

```javascript
// ✅ Good
imageUtils.js
formatters.js
validators.js
constants.js

// ❌ Bad
image.js
format.js
validate.js
const.js
```

#### 5. Style Files
- **kebab-case** for style files
- **Match component/screen names**

```javascript
// ✅ Good
user-profile-header.styles.js
wardrobe-screen.styles.js
competition-form.styles.js

// ❌ Bad
UserProfileHeader.styles.js
wardrobeScreen.styles.js
CompetitionForm.styles.js
```

## 🏷️ Variable & Function Naming

### 1. Variables
- **camelCase** for all variables
- **Descriptive names** that indicate purpose
- **Avoid abbreviations** unless widely understood

```javascript
// ✅ Good
const userProfile = getUserProfile();
const wardrobeItems = getWardrobeItems();
const isCameraPermissionGranted = true;

// ❌ Bad
const up = getUserProfile();
const wi = getWardrobeItems();
const camPerm = true;
```

### 2. Functions
- **camelCase** with descriptive verbs
- **Clear action/purpose indication**

```javascript
// ✅ Good
function fetchUserProfile() { }
function uploadWardrobeItem() { }
function validateLoginForm() { }

// ❌ Bad
function getUser() { }
function upload() { }
function validate() { }
```

### 3. Constants
- **UPPER_SNAKE_CASE** for constants
- **Group related constants** in objects

```javascript
// ✅ Good
const API_ENDPOINTS = {
  USER_PROFILE: '/user/profile',
  WARDROBE_ITEMS: '/wardrobe/items',
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;

// ❌ Bad
const endpoints = {
  userProfile: '/user/profile',
  wardrobeItems: '/wardrobe/items',
};

const maxSize = 5242880;
```

### 4. Boolean Variables
- **Prefix with `is`, `has`, `can`, `should`**

```javascript
// ✅ Good
const isLoading = false;
const hasPermission = true;
const canEdit = true;
const shouldShowModal = false;

// ❌ Bad
const loading = false;
const permission = true;
const edit = true;
const modal = false;
```

## 🎨 Component Naming

### 1. Component Names
- **PascalCase** for component names
- **Descriptive and clear**
- **Include feature context** when needed

```javascript
// ✅ Good
export const UserProfileHeader = () => { };
export const WardrobeItemCard = () => { };
export const CompetitionEntryModal = () => { };

// ❌ Bad
export const Header = () => { };
export const Card = () => { };
export const Modal = () => { };
```

### 2. Props Naming
- **camelCase** for props
- **Descriptive names**
- **Use `on` prefix for event handlers**

```javascript
// ✅ Good
interface Props {
  userName: string;
  profileImage: string;
  onProfilePress: () => void;
  onSettingsPress: () => void;
  isLoading: boolean;
}

// ❌ Bad
interface Props {
  name: string;
  img: string;
  profilePress: () => void;
  settingsPress: () => void;
  loading: boolean;
}
```

## 🔧 API & Service Naming

### 1. API Endpoints
- **kebab-case** for endpoint paths
- **RESTful conventions**
- **Plural nouns for collections**

```javascript
// ✅ Good
GET /api/users/profile
GET /api/wardrobe/items
POST /api/social/posts
PUT /api/competitions/{id}/enter

// ❌ Bad
GET /api/getUserProfile
GET /api/getWardrobeItems
POST /api/createPost
PUT /api/competition/enter/{id}
```

### 2. Service Functions
- **camelCase** with HTTP method prefix
- **Resource name** second
- **Descriptive action** third

```javascript
// ✅ Good
const getUserProfile = () => api.get('/users/profile');
const postWardrobeItem = (item) => api.post('/wardrobe/items', item);
const updateCompetitionEntry = (id, data) => api.put(`/competitions/${id}`, data);

// ❌ Bad
const profile = () => api.get('/users/profile');
const wardrobe = (item) => api.post('/wardrobe/items', item);
const competition = (id, data) => api.put(`/competitions/${id}`, data);
```

## 📱 Screen & Navigation Naming

### 1. Screen Names
- **PascalCase** ending with "Screen"
- **Descriptive and clear**

```javascript
// ✅ Good
UserProfileScreen.js
WardrobeManagementScreen.js
CompetitionEntryScreen.js
ARTryOnScreen.js

// ❌ Bad
UserProfile.js
Wardrobe.js
Competition.js
AR.js
```

### 2. Navigation Parameters
- **camelCase** for navigation params
- **Descriptive names**

```javascript
// ✅ Good
navigation.navigate('UserProfileScreen', {
  userId: '123',
  userName: 'fashionista'
});

// ❌ Bad
navigation.navigate('UserProfile', {
  id: '123',
  name: 'fashionista'
});
```

## 🎨 Style & Theme Naming

### 1. Style Objects
- **camelCase** for style objects
- **Descriptive names**

```javascript
// ✅ Good
const userProfileHeaderStyles = {
  container: { },
  avatar: { },
  userName: { },
  bio: { },
};

// ❌ Bad
const styles = {
  container: { },
  avatar: { },
  name: { },
  bio: { },
};
```

### 2. Theme Colors
- **camelCase** with semantic meaning**
- **Group related colors**

```javascript
// ✅ Good
const COLORS = {
  primary: '#FF6B6B',
  secondary: '#4ECDC4',
  accent: '#45B7D1',
  text: {
    primary: '#2C3E50',
    secondary: '#7F8C8D',
    light: '#ECF0F1',
  },
  background: {
    primary: '#FFFFFF',
    secondary: '#F8F9FA',
  },
};

// ❌ Bad
const COLORS = {
  red: '#FF6B6B',
  blue: '#4ECDC4',
  lightBlue: '#45B7D1',
  darkGray: '#2C3E50',
  gray: '#7F8C8D',
  lightGray: '#ECF0F1',
  white: '#FFFFFF',
  offWhite: '#F8F9FA',
};
```

## 📝 Documentation & Comments

### 1. File Headers
- **Consistent header format** for all files

```javascript
/**
 * Component: UserProfileHeader
 * Purpose: Displays user profile information with avatar and stats
 * Dependencies: Ionicons, useAppStore
 * Used in: ProfileScreen, UserProfileScreen
 */

// or

/**
 * Hook: useWardrobeItems
 * Purpose: Manages wardrobe item state and operations
 * Returns: { wardrobeItems, addItem, removeItem, updateItem }
 */

// or

/**
 * Service: wardrobeService
 * Purpose: Handles all wardrobe-related API calls
 * Methods: fetchItems, createItem, updateItem, deleteItem
 */
```

### 2. Function Documentation
- **JSDoc format** for complex functions
- **Clear parameter and return descriptions**

```javascript
/**
 * Fetches wardrobe items from the API with optional filtering
 * @param {Object} options - Filter and pagination options
 * @param {string} options.category - Filter by category
 * @param {string} options.color - Filter by color
 * @param {number} options.page - Page number for pagination
 * @param {number} options.limit - Number of items per page
 * @returns {Promise<WardrobeItem[]>} Array of wardrobe items
 */
async function fetchWardrobeItems(options = {}) {
  // Implementation
}
```

## 🚀 Import & Export Naming

### 1. Import Order
1. React and React Native imports
2. Third-party library imports
3. Internal imports (from '../...')
4. Relative imports ('./')
5. Type imports

```javascript
// ✅ Good
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { api } from '../services';
import { useAppStore } from '../store';
import { UserProfileHeader } from '../components';
import { COLORS, SIZES } from '../utils/constants';

import { WardrobeItemCard } from './WardrobeItemCard';
import styles from './styles';
```

### 2. Export Naming
- **Named exports** for components
- **Default exports** for screens
- **Consistent patterns**

```javascript
// ✅ Good - Component (named export)
export const UserProfileHeader = () => { };

// ✅ Good - Screen (default export)
const ProfileScreen = () => { };
export default ProfileScreen;

// ✅ Good - Service functions
export const fetchUserProfile = () => { };
export const updateProfile = () => { };

// ✅ Good - Index file re-exports
export { default as UserProfileHeader } from './UserProfileHeader';
export { default as WardrobeItemCard } from './WardrobeItemCard';
```

## 🔍 Best Practices Summary

1. **Be descriptive** - Names should clearly indicate purpose
2. **Be consistent** - Follow the same patterns throughout
3. **Avoid abbreviations** - Use full words unless widely understood
4. **Use context** - Include feature/domain context in names
5. **Follow conventions** - Stick to established patterns
6. **Document exceptions** - Comment when deviating from standards
7. **Review regularly** - Ensure new code follows guidelines

This guide ensures maintainable, readable, and scalable code for the 7Ftrends application.