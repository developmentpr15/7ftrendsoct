export const COLORS = {
  // Primary Colors
  primary: '#2c2c2c',        // Deep Charcoal
  accent: '#ff7e67',         // Warm Coral
  success: '#4ade80',        // Emerald Green
  warning: '#fbbf24',        // Yellow
  error: '#ef4444',          // Red

  // Neutral Colors
  background: '#f8f8f8',     // Off-white
  surface: '#ffffff',        // White
  text: '#2c2c2c',          // Dark text
  textSecondary: '#6b7280',  // Gray
  border: '#e5e7eb',        // Light gray

  // Social Colors
  like: '#ef4444',           // Red for likes
  comment: '#3b82f6',        // Blue for comments
  share: '#10b981',          // Green for shares
};

export const SIZES = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 24,
    xxl: 32,
  },
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
};

export const CATEGORIES = [
  { id: 'top', name: 'Tops', icon: '👕' },
  { id: 'bottom', name: 'Bottoms', icon: '👖' },
  { id: 'dress', name: 'Dresses', icon: '👗' },
  { id: 'outerwear', name: 'Outerwear', icon: '🧥' },
  { id: 'shoes', name: 'Shoes', icon: '👟' },
  { id: 'accessories', name: 'Accessories', icon: '🎒' },
  { id: 'bag', name: 'Bags', icon: '👜' },
  { id: 'jewelry', name: 'Jewelry', icon: '💍' },
  { id: 'other', name: 'Other', icon: '📦' },
];

export const SEASONS = [
  { id: 'spring', name: 'Spring', icon: '🌸' },
  { id: 'summer', name: 'Summer', icon: '☀️' },
  { id: 'fall', name: 'Fall', icon: '🍂' },
  { id: 'winter', name: 'Winter', icon: '❄️' },
];

export const APP_INFO = {
  name: '7Ftrends',
  tagline: 'Your Fashion Feed',
  logo: '👗', // Using emoji as logo, can be replaced with actual image later
  version: '1.0.0',
};