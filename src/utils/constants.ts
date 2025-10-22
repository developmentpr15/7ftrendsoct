/**
 * 7Ftrends Luxury Theme Constants
 * Purple (#6a2fb0) and Gold (#f2c94c) color scheme
 * Modular design for reusable styling across components
 */

// ===== COLOR PALETTE =====
export const COLORS = {
  // Primary Luxury Colors
  primary: '#6a2fb0',      // Luxury Purple
  primaryLight: '#8b4dc4',  // Light Purple
  primaryDark: '#4a1f7a',   // Dark Purple
  accent: '#f2c94c',        // Gold Accent
  accentLight: '#f5d675',   // Light Gold
  accentDark: '#d4af37',    // Dark Gold

  // Surface Colors
  surface: '#ffffff',        // White surfaces
  surfaceVariant: '#f8f5ff', // Very light purple tint
  background: '#fafbff',    // Light background
  card: '#ffffff',          // Card backgrounds

  // Text Colors
  text: '#1a1a1a',          // Primary text
  textSecondary: '#666666', // Secondary text
  textLight: '#999999',     // Light text
  textOnPrimary: '#ffffff', // Text on primary color
  textOnAccent: '#1a1a1a',  // Text on accent color

  // Status Colors
  success: '#4caf50',       // Success green
  warning: '#ff9800',       // Warning orange
  error: '#f44336',         // Error red
  info: '#2196f3',          // Info blue

  // Border & UI Colors
  border: '#e0e0e0',        // Light borders
  borderLight: '#f0f0f0',   // Very light borders
  divider: '#eeeeee',       // Dividers
  shadow: 'rgba(106, 47, 176, 0.1)', // Purple shadow tint
  goldShadow: 'rgba(242, 201, 76, 0.2)', // Gold shadow tint

  // Overlay Colors
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
};

// ===== SIZES & SPACING =====
export const SIZES = {
  // Base spacing unit (8px grid)
  base: 8,
  xs: 4,      // 0.5rem
  sm: 8,      // 1rem
  md: 16,     // 2rem
  lg: 24,     // 3rem
  xl: 32,     // 4rem
  xxl: 48,    // 6rem
  xxxl: 64,   // 8rem

  // Component specific
  padding: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },

  margin: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },

  // Border radius
  radius: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 24,
    full: 9999,
  },

  // Icon sizes
  icon: {
    xs: 12,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  // Component heights
  input: 48,
  button: 48,
  buttonSmall: 36,
  buttonLarge: 56,
  cardMinHeight: 120,
  listItem: 72,

  // Screen dimensions (will be overridden by actual screen size)
  screen: {
    width: 375,
    height: 812,
  },
};

// ===== TYPOGRAPHY =====
export const FONTS = {
  // Font families
  families: {
    primary: 'System',          // iOS system font
    secondary: 'System',        // Same as primary for consistency
    mono: 'Menlo',             // Monospace for numbers/codes
  },

  // Font weights
  weight: {
    thin: '100',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    heavy: '800',
    black: '900',
  },

  // Font sizes (modular scale)
  sizes: {
    xs: 12,      // Small captions
    sm: 14,      // Body text
    base: 16,    // Base text
    lg: 18,      // Large body
    xl: 20,      // Small headings
    xxl: 24,     // Medium headings
    xxxl: 32,    // Large headings
    huge: 40,    // Hero headings
    massive: 48, // Display headings
  },

  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
    loose: 1.8,
  },

  // Letter spacing
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
  },
};

// ===== COMPONENT STYLES (Modular) =====
export const COMPONENT_STYLES = {
  // Button styles
  button: {
    // Primary button (Purple)
    primary: {
      backgroundColor: COLORS.primary,
      color: COLORS.textOnPrimary,
      borderWidth: 0,
      borderRadius: SIZES.radius.md,
      paddingHorizontal: SIZES.xl,
      paddingVertical: SIZES.md,
      fontSize: FONTS.sizes.md,
      fontFamily: FONTS.families.primary,
      fontWeight: FONTS.weight.semibold,
    },

    // Secondary button (Gold)
    secondary: {
      backgroundColor: COLORS.accent,
      color: COLORS.textOnAccent,
      borderWidth: 0,
      borderRadius: SIZES.radius.md,
      paddingHorizontal: SIZES.xl,
      paddingVertical: SIZES.md,
      fontSize: FONTS.sizes.md,
      fontFamily: FONTS.families.primary,
      fontWeight: FONTS.weight.semibold,
    },

    // Outline button
    outline: {
      backgroundColor: 'transparent',
      color: COLORS.primary,
      borderWidth: 1,
      borderColor: COLORS.primary,
      borderRadius: SIZES.radius.md,
      paddingHorizontal: SIZES.xl,
      paddingVertical: SIZES.md,
      fontSize: FONTS.sizes.md,
      fontFamily: FONTS.families.primary,
      fontWeight: FONTS.weight.medium,
    },

    // Ghost button
    ghost: {
      backgroundColor: 'transparent',
      color: COLORS.textSecondary,
      borderWidth: 0,
      borderRadius: SIZES.radius.md,
      paddingHorizontal: SIZES.md,
      paddingVertical: SIZES.sm,
      fontSize: FONTS.sizes.sm,
      fontFamily: FONTS.families.primary,
      fontWeight: FONTS.weight.medium,
    },

    // Text button
    text: {
      backgroundColor: 'transparent',
      color: COLORS.primary,
      borderWidth: 0,
      borderRadius: SIZES.radius.sm,
      paddingHorizontal: SIZES.sm,
      paddingVertical: SIZES.sm,
      fontSize: FONTS.sizes.sm,
      fontFamily: FONTS.families.primary,
      fontWeight: FONTS.weight.medium,
    },
  },

  // Card styles
  card: {
    // Standard card
    default: {
      backgroundColor: COLORS.card,
      borderRadius: SIZES.radius.lg,
      padding: SIZES.lg,
      borderWidth: 1,
      borderColor: COLORS.borderLight,
      shadowColor: COLORS.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 8,
      elevation: 4,
    },

    // Elevated card
    elevated: {
      backgroundColor: COLORS.card,
      borderRadius: SIZES.radius.xl,
      padding: SIZES.xl,
      borderWidth: 0,
      shadowColor: COLORS.goldShadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 1,
      shadowRadius: 16,
      elevation: 8,
    },

    // Minimal card
    minimal: {
      backgroundColor: COLORS.surfaceVariant,
      borderRadius: SIZES.radius.md,
      padding: SIZES.md,
      borderWidth: 1,
      borderColor: COLORS.border,
    },

    // Premium card (with gold accent)
    premium: {
      backgroundColor: COLORS.card,
      borderRadius: SIZES.radius.xl,
      padding: SIZES.lg,
      borderWidth: 2,
      borderColor: COLORS.accent,
      shadowColor: COLORS.goldShadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 12,
      elevation: 6,
    },
  },

  // Text styles
  text: {
    // Heading styles
    heading: {
      h1: {
        fontSize: FONTS.sizes.xxxl,
        fontFamily: FONTS.families.primary,
        fontWeight: FONTS.weight.bold,
        color: COLORS.text,
        lineHeight: FONTS.lineHeight.tight,
      },
      h2: {
        fontSize: FONTS.sizes.xxl,
        fontFamily: FONTS.families.primary,
        fontWeight: FONTS.weight.bold,
        color: COLORS.text,
        lineHeight: FONTS.lineHeight.tight,
      },
      h3: {
        fontSize: FONTS.sizes.xl,
        fontFamily: FONTS.families.primary,
        fontWeight: FONTS.weight.semibold,
        color: COLORS.text,
        lineHeight: FONTS.lineHeight.normal,
      },
      h4: {
        fontSize: FONTS.sizes.lg,
        fontFamily: FONTS.families.primary,
        fontWeight: FONTS.weight.semibold,
        color: COLORS.text,
        lineHeight: FONTS.lineHeight.normal,
      },
    },

    // Body text styles
    body: {
      large: {
        fontSize: FONTS.sizes.lg,
        fontFamily: FONTS.families.primary,
        fontWeight: FONTS.weight.normal,
        color: COLORS.text,
        lineHeight: FONTS.lineHeight.relaxed,
      },
      default: {
        fontSize: FONTS.sizes.base,
        fontFamily: FONTS.families.primary,
        fontWeight: FONTS.weight.normal,
        color: COLORS.text,
        lineHeight: FONTS.lineHeight.normal,
      },
      small: {
        fontSize: FONTS.sizes.sm,
        fontFamily: FONTS.families.primary,
        fontWeight: FONTS.weight.normal,
        color: COLORS.textSecondary,
        lineHeight: FONTS.lineHeight.normal,
      },
    },

    // Special text styles
    accent: {
      primary: {
        fontSize: FONTS.sizes.base,
        fontFamily: FONTS.families.primary,
        fontWeight: FONTS.weight.semibold,
        color: COLORS.primary,
      },
      gold: {
        fontSize: FONTS.sizes.base,
        fontFamily: FONTS.families.primary,
        fontWeight: FONTS.weight.semibold,
        color: COLORS.accent,
      },
    },
  },

  // Input styles
  input: {
    default: {
      backgroundColor: COLORS.surface,
      borderWidth: 1,
      borderColor: COLORS.border,
      borderRadius: SIZES.radius.md,
      paddingHorizontal: SIZES.md,
      paddingVertical: SIZES.sm,
      fontSize: FONTS.sizes.base,
      fontFamily: FONTS.families.primary,
      color: COLORS.text,
    },

    focused: {
      backgroundColor: COLORS.surface,
      borderWidth: 2,
      borderColor: COLORS.primary,
      borderRadius: SIZES.radius.md,
      paddingHorizontal: SIZES.md,
      paddingVertical: SIZES.sm,
      fontSize: FONTS.sizes.base,
      fontFamily: FONTS.families.primary,
      color: COLORS.text,
    },

    error: {
      backgroundColor: COLORS.surface,
      borderWidth: 2,
      borderColor: COLORS.error,
      borderRadius: SIZES.radius.md,
      paddingHorizontal: SIZES.md,
      paddingVertical: SIZES.sm,
      fontSize: FONTS.sizes.base,
      fontFamily: FONTS.families.primary,
      color: COLORS.text,
    },
  },
};

// ===== HELPER FUNCTIONS =====
export const StyleHelpers = {
  // Create shadow style
  createShadow: (color: string = COLORS.shadow, height: number = 4) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: height / 2 },
    shadowOpacity: 0.2,
    shadowRadius: height,
    elevation: height,
  }),

  // Create gradient colors
  createGradient: (startColor: string, endColor: string) => ({
    start: startColor,
    end: endColor,
  }),

  // Responsive sizing
  responsiveSize: (base: number, factor: number = 1) => base * factor,

  // Get text style with overrides
  getTextStyle: (baseStyle: any, overrides: any = {}) => ({
    ...baseStyle,
    ...overrides,
  }),

  // Get button style with variants
  getButtonStyle: (variant: keyof typeof COMPONENT_STYLES.button, overrides: any = {}) => ({
    ...COMPONENT_STYLES.button[variant],
    ...overrides,
  }),

  // Get card style with variants
  getCardStyle: (variant: keyof typeof COMPONENT_STYLES.card, overrides: any = {}) => ({
    ...COMPONENT_STYLES.card[variant],
    ...overrides,
  }),
};

// ===== EXPORTS =====
export default {
  COLORS,
  SIZES,
  FONTS,
  COMPONENT_STYLES,
  StyleHelpers,
};