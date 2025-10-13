/**
 * Environment Configuration
 * Centralized environment variable management for 7ftrends
 */

// Environment detection
const getEnvironment = () => {
  if (__DEV__) {
    return 'development';
  }
  // In production, this could be set via build constants
  return 'production';
};

const ENV = getEnvironment();

// API Configuration
export const API_CONFIG = {
  // Base URLs for different environments
  BASE_URL: ENV === 'development'
    ? 'http://localhost:3000/api'  // Your Go backend
    : 'https://api.7ftrends.com/v1', // Production API

  // Supabase configuration (move from utils/supabase.js)
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co',
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key',

  // API endpoints
  ENDPOINTS: {
    // User endpoints
    USER: {
      PROFILE: '/user/profile',
      PREFERENCES: '/user/preferences',
      STATS: '/user/stats',
    },

    // Wardrobe endpoints
    WARDROBE: {
      ITEMS: '/wardrobe/items',
      CATEGORIES: '/wardrobe/categories',
      OUTFITS: '/wardrobe/outfits',
      SUGGESTIONS: '/wardrobe/suggestions',
    },

    // Social endpoints
    SOCIAL: {
      POSTS: '/social/posts',
      FEED: '/social/feed',
      COMMENTS: '/social/comments',
      LIKES: '/social/likes',
      FOLLOWERS: '/social/followers',
    },

    // AR endpoints
    AR: {
      TRY_ON: '/ar/try-on',
      PHOTOS: '/ar/photos',
      GALLERY: '/ar/gallery',
    },

    // Competition endpoints
    COMPETITION: {
      CHALLENGES: '/competition/challenges',
      PARTICIPATE: '/competition/participate',
      VOTE: '/competition/vote',
    },

    // AI endpoints
    AI: {
      EDIT_IMAGE: '/ai/edit-image',
      RECOMMEND_OUTFIT: '/ai/recommend-outfit',
      GENERATE_STYLE: '/ai/generate-style',
    },
  },

  // Request configuration
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
};

// App Configuration
export const APP_CONFIG = {
  // App metadata
  NAME: '7ftrends',
  VERSION: '1.0.0',
  DESCRIPTION: 'Fashion Try-On & Social App',

  // Feature flags
  FEATURES: {
    AR_TRY_ON: true,
    SOCIAL_FEED: true,
    COMPETITIONS: true,
    AI_STYLING: ENV === 'production', // Enable AI in production only
    PUSH_NOTIFICATIONS: true,
    ANALYTICS: ENV === 'production',
  },

  // UI Configuration
  UI: {
    THEME: 'light', // Can be 'light', 'dark', or 'auto'
    ANIMATIONS: true,
    HAPTICS: true,
  },

  // Performance settings
  PERFORMANCE: {
    CACHE_SIZE: 50, // Number of items to cache
    LAZY_LOAD_THRESHOLD: 10,
    DEBOUNCE_DELAY: 300,
  },

  // Business logic
  BUSINESS: {
    MAX_OUTFIT_ITEMS: 10,
    MAX_WARDROBE_ITEMS: 1000,
    COMPETITION_DURATION_DAYS: 7,
    STORY_DURATION_HOURS: 24,
  },
};

// Security Configuration
export const SECURITY_CONFIG = {
  // Rate limiting
  RATE_LIMIT: {
    MAX_REQUESTS: 100,
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  },

  // Image upload limits
  UPLOAD: {
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
    MAX_DIMENSION: 2048,
  },

  // Session management
  SESSION: {
    TOKEN_REFRESH_BUFFER: 5 * 60 * 1000, // 5 minutes before expiry
    MAX_SESSION_AGE: 30 * 24 * 60 * 60 * 1000, // 30 days
  },
};

// Development Configuration
export const DEV_CONFIG = ENV === 'development' ? {
  // Debug settings
  DEBUG: {
    ENABLE_LOGGING: true,
    LOG_LEVEL: 'info', // 'error', 'warn', 'info', 'debug'
    NETWORK_LOGGING: true,
    PERFORMANCE_MONITORING: true,
  },

  // Mock data
  MOCK_DATA: {
    ENABLED: true,
    API_DELAY: 1000, // Simulate network delay
  },

  // Development tools
  TOOLS: {
    FLIPPER: true,
    REACTotron: false,
    REDUX_DEVTOOLS: false,
  },
} : {};

// Export environment info
export const ENV_INFO = {
  current: ENV,
  isDevelopment: ENV === 'development',
  isProduction: ENV === 'production',
};

// Export all configurations
export const CONFIG = {
  ...API_CONFIG,
  ...APP_CONFIG,
  ...SECURITY_CONFIG,
  ...DEV_CONFIG,
  ENV_INFO,
};

export default CONFIG;