/**
 * Branded UI Components for 7Ftrends
 * Consistent, branded components using the theme system
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

const { width } = Dimensions.get('window');

// Logo Component
export const Logo = ({ variant = 'brand', style, ...props }) => {
  const { utils } = useTheme();

  return (
    <Text style={[utils.getLogoStyle(variant), style]} {...props}>
      7Ftrends
    </Text>
  );
};

// Branded Button Component
export const BrandedButton = ({
  title,
  variant = 'primary',
  size = 'base',
  onPress,
  disabled = false,
  loading = false,
  style,
  textStyle,
  ...props
}) => {
  const { utils } = useTheme();

  const buttonStyle = utils.getButtonStyle(variant, size, disabled);
  const disabledStyle = disabled ? { opacity: 0.6 } : {};

  return (
    <TouchableOpacity
      style={[buttonStyle, disabledStyle, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'link' ? colors.accent : colors.text.primary}
        />
      ) : (
        <Text
          style={[
            {
              fontFamily: 'System',
              fontSize: 16,
              fontWeight: '600',
              textAlign: 'center',
              color: variant === 'link' ? colors.accent : colors.text.primary,
            },
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

// Branded Input Component
export const BrandedInput = ({
  placeholder,
  value,
  onChangeText,
  error,
  variant = 'default',
  style,
  ...props
}) => {
  const { utils } = useTheme();

  const inputStyle = utils.getInputStyle(variant, !!error);

  return (
    <View>
      <TextInput
        style={[inputStyle, style]}
        placeholder={placeholder}
        placeholderTextColor={colors.text.placeholder}
        value={value}
        onChangeText={onChangeText}
        {...props}
      />
      {error && (
        <Text style={[styles.errorText, { color: colors.text.error }]}>
          {error}
        </Text>
      )}
    </View>
  );
};

// Branded Card Component
export const BrandedCard = ({
  children,
  variant = 'default',
  style,
  ...props
}) => {
  const { utils } = useTheme();

  const cardStyle = utils.getCardStyle(variant);

  return (
    <View style={[cardStyle, style]} {...props}>
      {children}
    </View>
  );
};

// Empty State Component
export const EmptyState = ({
  title,
  subtitle,
  image,
  action,
  style,
}) => {
  const { colors, spacing } = useTheme();

  return (
    <View style={[styles.emptyState, style]}>
      {image && (
        <Image
          source={image}
          style={styles.emptyStateImage}
          resizeMode="contain"
        />
      )}
      <Text style={[styles.emptyStateTitle, { color: colors.text.primary }]}>
        {title}
      </Text>
      {subtitle && (
        <Text style={[styles.emptyStateSubtitle, { color: colors.text.secondary }]}>
          {subtitle}
        </Text>
      )}
      {action && (
        <View style={styles.emptyStateAction}>
          {action}
        </View>
      )}
    </View>
  );
};

// Error State Component
export const ErrorState = ({
  title = 'Something went wrong',
  subtitle = 'Please try again later',
  onRetry,
  style,
}) => {
  const { colors, spacing } = useTheme();

  return (
    <View style={[styles.errorState, style]}>
      <Text style={[styles.errorStateTitle, { color: colors.text.error }]}>
        ⚠️ {title}
      </Text>
      <Text style={[styles.errorStateSubtitle, { color: colors.text.secondary }]}>
        {subtitle}
      </Text>
      {onRetry && (
        <BrandedButton
          title="Try Again"
          variant="secondary"
          onPress={onRetry}
          style={styles.errorStateAction}
        />
      )}
    </View>
  );
};

// Loading State Component
export const LoadingState = ({
  title = 'Loading...',
  subtitle,
  style,
}) => {
  const { colors, spacing } = useTheme();

  return (
    <View style={[styles.loadingState, style]}>
      <ActivityIndicator
        size="large"
        color={colors.accent}
        style={styles.loadingSpinner}
      />
      <Text style={[styles.loadingTitle, { color: colors.text.primary }]}>
        {title}
      </Text>
      {subtitle && (
        <Text style={[styles.loadingSubtitle, { color: colors.text.secondary }]}>
          {subtitle}
        </Text>
      )}
    </View>
  );
};

// Screen Header Component
export const ScreenHeader = ({
  title,
  subtitle,
  leftAction,
  rightAction,
  transparent = false,
  style,
}) => {
  const { colors, spacing } = useTheme();

  const headerStyle = transparent
    ? { backgroundColor: 'transparent' }
    : { backgroundColor: colors.background.primary };

  return (
    <View style={[styles.header, headerStyle, style]}>
      <View style={styles.headerLeft}>
        {leftAction}
      </View>
      <View style={styles.headerCenter}>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.headerSubtitle, { color: colors.text.secondary }]}>
            {subtitle}
          </Text>
        )}
      </View>
      <View style={styles.headerRight}>
        {rightAction}
      </View>
    </View>
  );
};

// Tab Bar Component
export const BrandedTabBar = ({
  tabs,
  activeTab,
  onTabPress,
  style,
}) => {
  const { colors, spacing } = useTheme();

  return (
    <View style={[styles.tabBar, { backgroundColor: colors.background.card }, style]}>
      {tabs.map((tab, index) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tabItem,
              isActive && { borderBottomColor: colors.accent }
            ]}
            onPress={() => onTabPress(tab.key)}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: isActive ? colors.accent : colors.text.secondary,
                }
              ]}
            >
              {tab.title}
            </Text>
            {tab.badge && (
              <View style={[styles.tabBadge, { backgroundColor: colors.accent }]}>
                <Text style={styles.tabBadgeText}>{tab.badge}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

// Status Badge Component
export const StatusBadge = ({
  status,
  text,
  variant = 'default',
  style,
}) => {
  const { colors } = useTheme();

  const getStatusColor = () => {
    switch (status) {
      case 'active':
      case 'success':
        return colors.status.active;
      case 'pending':
      case 'warning':
        return colors.status.pending;
      case 'error':
      case 'failed':
        return colors.status.error;
      case 'inactive':
        return colors.status.inactive;
      default:
        return colors.status.info;
    }
  };

  return (
    <View
      style={[
        styles.statusBadge,
        { backgroundColor: getStatusColor() },
        style,
      ]}
    >
      <Text style={styles.statusBadgeText}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  // Button styles
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    minWidth: 120,
  },
  buttonText: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '600',
  },

  // Input styles
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },

  // Card styles
  card: {
    borderRadius: 12,
    padding: 16,
  },

  // Empty state styles
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateImage: {
    width: width * 0.6,
    height: width * 0.4,
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyStateAction: {
    marginTop: 16,
  },

  // Error state styles
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorStateSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  errorStateAction: {
    marginTop: 16,
  },

  // Loading state styles
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingSpinner: {
    marginBottom: 16,
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  loadingSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },

  // Header styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  headerCenter: {
    flex: 2,
    alignItems: 'center',
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 2,
  },

  // Tab bar styles
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  tabBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '600',
  },

  // Status badge styles
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default {
  Logo,
  BrandedButton,
  BrandedInput,
  BrandedCard,
  EmptyState,
  ErrorState,
  LoadingState,
  ScreenHeader,
  BrandedTabBar,
  StatusBadge,
};