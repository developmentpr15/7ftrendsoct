/**
 * Theme Provider for 7Ftrends
 * Provides theme context to all components
 */

import React, { createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';
import theme, { colors, typography, spacing, borderRadius, shadows, components } from './theme';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const colorScheme = useColorScheme();

  // For now, we're using dark theme as default
  // Can extend this for light/dark mode switching later
  const isDark = true; // colorScheme === 'dark';

  const currentTheme = {
    ...theme,
    colors: {
      ...colors,
      isDark,
      // Dynamic colors based on theme
      text: isDark ? colors.text : {
        primary: '#1A1A1A',
        secondary: '#4A4A4A',
        tertiary: '#7A7A7A',
        inverse: '#FFFFFF',
        placeholder: '#9A9A9A',
        link: '#FF6B6B',
        success: '#4CAF50',
        warning: '#FF9800',
        error: '#F44336',
      },
      background: isDark ? colors.background : {
        primary: '#FFFFFF',
        secondary: '#F5F5F5',
        tertiary: '#E5E5E5',
        card: '#FFFFFF',
        modal: '#FFFFFF',
        input: '#F5F5F5',
      },
    },
  };

  // Theme utility functions
  const utils = {
    // Get color with fallback
    getColor: (path, fallback = colors.text.primary) => {
      const keys = path.split('.');
      let value = currentTheme.colors;
      for (const key of keys) {
        value = value?.[key];
      }
      return value || fallback;
    },

    // Get responsive spacing
    getSpacing: (size) => {
      if (typeof size === 'string') {
        return spacing[size] || size;
      }
      return size;
    },

    // Get responsive font size
    getFontSize: (size) => {
      if (typeof size === 'string') {
        return currentTheme.responsive.getFontSize(typography.fontSize[size] || size);
      }
      return currentTheme.responsive.getFontSize(size);
    },

    // Create button style
    getButtonStyle: (variant = 'primary', size = 'base', disabled = false) => {
      const baseStyle = components.button[variant] || components.button.primary;
      const disabledStyle = disabled ? {
        opacity: 0.5,
        backgroundColor: colors.background.tertiary,
      } : {};

      const sizeStyles = {
        sm: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
        base: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
        lg: { paddingHorizontal: spacing.xl, paddingVertical: spacing.lg },
      };

      return {
        ...baseStyle,
        ...sizeStyles[size],
        ...disabledStyle,
      };
    },

    // Create input style
    getInputStyle: (variant = 'default', error = false) => {
      const baseStyle = components.input[variant] || components.input.default;
      const errorStyle = error ? components.input.error : {};

      return {
        ...baseStyle,
        ...errorStyle,
      };
    },

    // Create card style
    getCardStyle: (variant = 'default') => {
      return components.card[variant] || components.card.default;
    },

    // Create text style
    getTextStyle: (variant = 'body', size = 'base', weight = 'normal', color = 'primary') => {
      return {
        fontFamily: typography.fontFamily[variant] || typography.fontFamily.body,
        fontSize: currentTheme.responsive.getFontSize(typography.fontSize[size] || size),
        fontWeight: typography.fontWeight[weight] || weight,
        color: currentTheme.utils.getColor(`text.${color}`) || color,
      };
    },

    // Get logo style
    getLogoStyle: (variant = 'brand') => {
      return components.logo[variant] || components.logo.brand;
    },
  };

  const value = {
    theme: currentTheme,
    isDark,
    utils,
    colors: currentTheme.colors,
    typography,
    spacing,
    borderRadius,
    shadows,
    components,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;