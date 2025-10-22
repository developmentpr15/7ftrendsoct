/**
 * Usage Examples for 7Ftrends Luxury Theme Constants
 * Demonstrates how to use the modular design across components
 */

import { COLORS, SIZES, FONTS, COMPONENT_STYLES, StyleHelpers } from './constants';

// ===== BUTTON EXAMPLES =====
export const ButtonExamples = {
  // Primary purple button
  primaryButton: {
    ...COMPONENT_STYLES.button.primary,
    // Custom overrides
    shadowColor: COLORS.primary,
    elevation: 6,
  },

  // Gold accent button
  goldButton: {
    ...COMPONENT_STYLES.button.secondary,
    // Custom overrides
    shadowColor: COLORS.goldShadow,
    elevation: 8,
  },

  // Outline button with custom size
  outlineLarge: {
    ...COMPONENT_STYLES.button.outline,
    height: SIZES.buttonLarge,
    paddingHorizontal: SIZES.xxl,
  },

  // Custom button using helper
  customButton: StyleHelpers.getButtonStyle('primary', {
    backgroundColor: COLORS.primaryDark,
    borderRadius: SIZES.radius.xl,
  }),
};

// ===== CARD EXAMPLES =====
export const CardExamples = {
  // Standard card for posts
  postCard: {
    ...COMPONENT_STYLES.card.default,
    marginBottom: SIZES.md,
  },

  // Premium card for featured content
  featuredCard: {
    ...COMPONENT_STYLES.card.premium,
    marginVertical: SIZES.lg,
  },

  // Minimal card for UI elements
  minimalCard: {
    ...COMPONENT_STYLES.card.minimal,
    padding: SIZES.sm,
  },

  // Custom elevated card
  customElevated: StyleHelpers.getCardStyle('elevated', {
    backgroundColor: COLORS.surfaceVariant,
  }),
};

// ===== TEXT EXAMPLES =====
export const TextExamples = {
  // Main heading
  title: {
    ...COMPONENT_STYLES.text.heading.h2,
    color: COLORS.primary,
    marginBottom: SIZES.sm,
  },

  // Gold accent text
  goldAccent: {
    ...COMPONENT_STYLES.text.accent.gold,
    fontSize: FONTS.sizes.lg,
  },

  // Body text with custom spacing
  description: {
    ...COMPONENT_STYLES.text.body.default,
    lineHeight: FONTS.lineHeight.relaxed,
    marginBottom: SIZES.md,
  },

  // Small caption text
  caption: {
    ...COMPONENT_STYLES.text.body.small,
    color: COLORS.textLight,
    textAlign: 'center',
  },

  // Custom text style
  customHeading: StyleHelpers.getTextStyle(COMPONENT_STYLES.text.heading.h3, {
    color: COLORS.accent,
    letterSpacing: FONTS.letterSpacing.wide,
  }),
};

// ===== INPUT EXAMPLES =====
export const InputExamples = {
  // Default input
  default: COMPONENT_STYLES.input.default,

  // Focused input state
  focused: COMPONENT_STYLES.input.focused,

  // Error input state
  error: COMPONENT_STYLES.input.error,

  // Custom input with luxury theme
  luxuryInput: {
    ...COMPONENT_STYLES.input.default,
    backgroundColor: COLORS.surfaceVariant,
    borderColor: COLORS.borderLight,
    borderRadius: SIZES.radius.lg,
    paddingHorizontal: SIZES.lg,
    fontSize: FONTS.sizes.lg,
  },
};

// ===== LAYOUT EXAMPLES =====
export const LayoutExamples = {
  // Screen container
  screenContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SIZES.lg,
  },

  // Section container
  section: {
    marginBottom: SIZES.xl,
    paddingHorizontal: SIZES.md,
  },

  // Card grid layout
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: -SIZES.sm,
  },

  // Card grid item
  cardGridItem: {
    width: '48%',
    marginBottom: SIZES.md,
    marginHorizontal: SIZES.sm,
  },

  // Centered content
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SIZES.xl,
  },

  // Row with spacing
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SIZES.sm,
  },

  // Row with space between
  rowSpaceBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: SIZES.sm,
  },
};

// ===== SHADOW EXAMPLES =====
export const ShadowExamples = {
  // Subtle shadow
  subtle: StyleHelpers.createShadow(COLORS.shadow, 2),

  // Standard shadow
  standard: StyleHelpers.createShadow(COLORS.shadow, 4),

  // Heavy shadow
  heavy: StyleHelpers.createShadow(COLORS.shadow, 8),

  // Gold shadow for premium elements
  goldShadow: StyleHelpers.createShadow(COLORS.goldShadow, 6),

  // Purple shadow for primary elements
  purpleShadow: StyleHelpers.createShadow(COLORS.primary, 4),
};

// ===== COMPONENT COMPOSITION EXAMPLES =====
export const ComponentExamples = {
  // Luxury button with shadow and text
  luxuryButton: {
    ...ButtonExamples.primaryButton,
    ...ShadowExamples.standard,
  },

  // Premium card with gold accent
  premiumCard: {
    ...CardExamples.featuredCard,
    ...ShadowExamples.goldShadow,
  },

  // Section with title and content
  sectionWithTitle: {
    ...LayoutExamples.section,
  },

  // Input field with label
  inputWithLabel: {
    marginBottom: SIZES.lg,
  },

  // Social interaction button
  likeButton: {
    ...COMPONENT_STYLES.button.text,
    color: COLORS.like,
    paddingVertical: SIZES.sm,
  },

  // Comment button
  commentButton: {
    ...COMPONENT_STYLES.button.text,
    color: COLORS.comment,
    paddingVertical: SIZES.sm,
  },
};

// ===== THEME SWITCHING EXAMPLES =====
export const ThemeExamples = {
  // Light theme (default)
  lightTheme: {
    background: COLORS.background,
    surface: COLORS.surface,
    text: COLORS.text,
    primary: COLORS.primary,
    accent: COLORS.accent,
  },

  // Dark theme override example
  darkThemeOverride: {
    background: '#1a1a1a',
    surface: '#2a2a2a',
    text: COLORS.textOnPrimary,
    primary: COLORS.primaryLight,
    accent: COLORS.accent,
  },
};

// ===== USAGE IN REACT COMPONENTS =====
export const ReactUsageExamples = `
// Example usage in React Native components

import React from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { COLORS, SIZES, FONTS, COMPONENT_STYLES } from '@/utils/constants';

const LuxuryButton = ({ title, onPress, variant = 'primary' }) => (
  <TouchableOpacity
    style={COMPONENT_STYLES.button[variant]}
    onPress={onPress}
  >
    <Text style={COMPONENT_STYLES.text.accent.primary}>{title}</Text>
  </TouchableOpacity>
);

const LuxuryCard = ({ children, variant = 'default' }) => (
  <View style={COMPONENT_STYLES.card[variant]}>
    {children}
  </View>
);

const Title = ({ children, variant = 'h3', style }) => (
  <Text style={[COMPONENT_STYLES.text.heading[variant], style]}>
    {children}
  </Text>
);

// Usage in screens:
const ExampleScreen = () => (
  <View style={{ flex: 1, backgroundColor: COLORS.background, padding: SIZES.lg }}>
    <Title variant="h2">Luxury Fashion Feed</Title>

    <LuxuryCard variant="premium">
      <Text style={COMPONENT_STYLES.text.body.default}>
        Premium content with gold accents
      </Text>
    </LuxuryCard>

    <LuxuryButton
      title="Get Started"
      variant="primary"
      onPress={() => console.log('Pressed')}
    />
  </View>
);
`;

export default {
  ButtonExamples,
  CardExamples,
  TextExamples,
  InputExamples,
  LayoutExamples,
  ShadowExamples,
  ComponentExamples,
  ThemeExamples,
  ReactUsageExamples,
};