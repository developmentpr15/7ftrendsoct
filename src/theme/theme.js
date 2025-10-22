/**
 * 7Ftrends Theme System
 * Complete branding and design system for the app
 */

import { Platform, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// Brand Colors
export const colors = {
  // Primary Brand Colors
  primary: '#1A1A1A',        // Dark black - main brand color
  secondary: '#FFFFFF',      // White - secondary brand color
  accent: '#FF6B6B',         // Coral red - accent color

  // Extended Color Palette
  background: {
    primary: '#1A1A1A',      // Main background
    secondary: '#2D2D2D',    // Secondary background
    tertiary: '#404040',     // Tertiary background
    card: '#2D2D2D',         // Card background
    modal: '#1A1A1A',        // Modal background
    input: '#2D2D2D',        // Input field background
  },

  text: {
    primary: '#FFFFFF',       // Primary text
    secondary: '#B8B8B8',     // Secondary text
    tertiary: '#808080',      // Tertiary text
    inverse: '#1A1A1A',       // Inverse text
    placeholder: '#606060',   // Placeholder text
    link: '#FF6B6B',          // Link color
    success: '#4CAF50',       // Success text
    warning: '#FF9800',       // Warning text
    error: '#F44336',         // Error text
  },

  border: {
    primary: '#404040',       // Primary border
    secondary: '#606060',     // Secondary border
    accent: '#FF6B6B',        // Accent border
    focus: '#FF6B6B',         // Focus border
    error: '#F44336',         // Error border
    success: '#4CAF50',       // Success border
  },

  status: {
    active: '#4CAF50',        // Active/green
    inactive: '#9E9E9E',      // Inactive/gray
    pending: '#FF9800',       // Pending/orange
    error: '#F44336',         // Error/red
    warning: '#FFC107',       // Warning/yellow
    info: '#2196F3',          // Info/blue
  },

  gradients: {
    primary: ['#1A1A1A', '#2D2D2D'],
    accent: ['#FF6B6B', '#FF8E53'],
    success: ['#4CAF50', '#8BC34A'],
    dark: ['#1A1A1A', '#0D0D0D'],
  },

  social: {
    google: '#4285F4',
    facebook: '#1877F2',
    twitter: '#1DA1F2',
    instagram: '#E4405F',
    apple: '#000000',
  }
};

// Typography
export const typography = {
  // Font Families
  fontFamily: {
    logo: Platform.select({
      ios: 'Pacifico',
      android: 'Pacifico-Regular',
      default: 'Pacifico',
    }),
    heading: Platform.select({
      ios: 'SF Pro Display',
      android: 'Roboto',
      default: 'System',
    }),
    body: Platform.select({
      ios: 'SF Pro Text',
      android: 'Roboto',
      default: 'System',
    }),
    mono: Platform.select({
      ios: 'SF Mono',
      android: 'Roboto Mono',
      default: 'monospace',
    }),
  },

  // Font Sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
    '6xl': 60,
  },

  // Font Weights
  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },

  // Line Heights
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
    loose: 1.8,
  },
};

// Spacing
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
  '4xl': 96,
};

// Border Radius
export const borderRadius = {
  none: 0,
  sm: 4,
  base: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
};

// Shadows
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  base: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 15,
  },
};

// Animation
export const animation = {
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
    slower: 700,
  },

  easing: {
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    spring: 'spring',
  },
};

// Breakpoints
export const breakpoints = {
  sm: 375,
  md: 768,
  lg: 1024,
  xl: 1280,
};

// Z-Index
export const zIndex = {
  hidden: -1,
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
};

// Component-specific styles
export const components = {
  // Button Styles
  button: {
    primary: {
      backgroundColor: colors.accent,
      color: colors.text.primary,
      fontFamily: typography.fontFamily.body,
      fontSize: typography.fontSize.base,
      fontWeight: typography.fontWeight.semibold,
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      ...shadows.base,
    },
    secondary: {
      backgroundColor: 'transparent',
      color: colors.text.primary,
      fontFamily: typography.fontFamily.body,
      fontSize: typography.fontSize.base,
      fontWeight: typography.fontWeight.medium,
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderWidth: 1,
      borderColor: colors.border.primary,
    },
    ghost: {
      backgroundColor: 'transparent',
      color: colors.text.secondary,
      fontFamily: typography.fontFamily.body,
      fontSize: typography.fontSize.base,
      fontWeight: typography.fontWeight.medium,
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    link: {
      backgroundColor: 'transparent',
      color: colors.text.link,
      fontFamily: typography.fontFamily.body,
      fontSize: typography.fontSize.base,
      fontWeight: typography.fontWeight.medium,
      paddingHorizontal: 0,
      paddingVertical: 0,
    },
  },

  // Input Styles
  input: {
    default: {
      backgroundColor: colors.background.input,
      color: colors.text.primary,
      fontFamily: typography.fontFamily.body,
      fontSize: typography.fontSize.base,
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderWidth: 1,
      borderColor: colors.border.primary,
    },
    focused: {
      borderColor: colors.border.focus,
      ...shadows.sm,
    },
    error: {
      borderColor: colors.border.error,
    },
  },

  // Card Styles
  card: {
    default: {
      backgroundColor: colors.background.card,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      ...shadows.base,
    },
    elevated: {
      ...shadows.md,
    },
    flat: {
      ...shadows.none,
      borderWidth: 1,
      borderColor: colors.border.secondary,
    },
  },

  // Header Styles
  header: {
    default: {
      backgroundColor: colors.background.primary,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.primary,
      ...shadows.sm,
    },
    transparent: {
      backgroundColor: 'transparent',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
  },

  // Logo Styles
  logo: {
    brand: {
      fontFamily: typography.fontFamily.logo,
      fontSize: typography.fontSize['3xl'],
      color: colors.text.primary,
      fontWeight: typography.fontWeight.normal,
    },
    brandSmall: {
      fontFamily: typography.fontFamily.logo,
      fontSize: typography.fontSize.xl,
      color: colors.text.primary,
      fontWeight: typography.fontWeight.normal,
    },
    brandAccent: {
      fontFamily: typography.fontFamily.logo,
      fontSize: typography.fontSize['2xl'],
      color: colors.accent,
      fontWeight: typography.fontWeight.normal,
    },
  },
};

// Layout Utilities
export const layout = {
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },

  screen: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },

  safeArea: {
    flex: 1,
    backgroundColor: colors.background.primary,
    paddingTop: Platform.OS === 'ios' ? spacing.xl : spacing.md,
  },
};

// Responsive utilities
export const responsive = {
  isSmall: width < breakpoints.md,
  isMedium: width >= breakpoints.md && width < breakpoints.lg,
  isLarge: width >= breakpoints.lg,

  getSpacing: (size) => {
    if (responsive.isSmall) return Math.round(size * 0.8);
    if (responsive.isMedium) return size;
    return Math.round(size * 1.2);
  },

  getFontSize: (size) => {
    if (responsive.isSmall) return Math.round(size * 0.9);
    if (responsive.isMedium) return size;
    return Math.round(size * 1.1);
  },
};

// Export the complete theme
export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  animation,
  breakpoints,
  zIndex,
  components,
  layout,
  responsive,
};

// Default export
export default theme;