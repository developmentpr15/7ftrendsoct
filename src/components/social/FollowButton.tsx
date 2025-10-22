/**
 * FollowButton Component
 * Toggles follows table row in Supabase with optimistic UI updates
 * Luxury purple and gold theme with instant state reflection
 */

import React, { useState, useCallback } from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  Animated,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

// Import luxury theme constants
import { COLORS, SIZES, FONTS, COMPONENT_STYLES, StyleHelpers } from '@/utils/constants';

// Import Supabase and stores
import { supabase } from '@/utils/supabase';
import { useSessionStore } from '@/store/sessionStore';

// Types
interface FollowButtonProps {
  targetUserId: string;
  initialIsFollowing?: boolean;
  size?: 'small' | 'medium' | 'large';
  style?: any;
  disabled?: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
}

export const FollowButton: React.FC<FollowButtonProps> = ({
  targetUserId,
  initialIsFollowing = false,
  size = 'medium',
  style,
  disabled = false,
  onFollowChange,
  variant = 'primary',
}) => {
  // Store state
  const { user, isAuthenticated } = useSessionStore();

  // Local state
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(1));

  // Get size configuration
  const getSizeConfig = useCallback(() => {
    switch (size) {
      case 'small':
        return {
          paddingVertical: SIZES.xs,
          paddingHorizontal: SIZES.sm,
          fontSize: FONTS.sizes.sm,
          iconSize: 12,
        };
      case 'large':
        return {
          paddingVertical: SIZES.lg,
          paddingHorizontal: SIZES.xl,
          fontSize: FONTS.sizes.lg,
          iconSize: 20,
        };
      default: // medium
        return {
          paddingVertical: SIZES.sm,
          paddingHorizontal: SIZES.md,
          fontSize: FONTS.sizes.md,
          iconSize: 16,
        };
    }
  }, [size]);

  // Handle follow/unfollow with optimistic UI
  const handleFollowToggle = useCallback(async () => {
    if (!isAuthenticated || !user || disabled) {
      // Show sign in prompt
      return;
    }

    // Prevent multiple simultaneous requests
    if (isLoading) return;

    const previousState = isFollowing;
    const newState = !previousState;

    // Optimistic UI update
    setIsFollowing(newState);
    setIsLoading(true);

    // Animate button
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1.05,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      // Check if follow relationship already exists
      const { data: existingFollow, error: checkError } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId)
        .single();

      const relationshipExists = !!existingFollow;

      if (newState && !relationshipExists) {
        // Follow user
        const { error: followError } = await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            following_id: targetUserId,
            created_at: new Date().toISOString(),
          });

        if (followError) {
          throw followError;
        }

        console.log('✅ Successfully followed user:', targetUserId);
      } else if (!newState && relationshipExists) {
        // Unfollow user
        const { error: unfollowError } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId);

        if (unfollowError) {
          throw unfollowError;
        }

        console.log('❌ Successfully unfollowed user:', targetUserId);
      }

      // Callback
      onFollowChange?.(newState);

    } catch (error) {
      console.error('Follow toggle error:', error);

      // Revert optimistic update on error
      setIsFollowing(previousState);

      // Show error message
      // In a real app, you might want to show a toast or alert
      console.error('Failed to update follow status');

    } finally {
      setIsLoading(false);
    }
  }, [
    isAuthenticated,
    user,
    disabled,
    isLoading,
    isFollowing,
    targetUserId,
    onFollowChange,
    scaleAnim,
  ]);

  // Check follow status when screen focuses
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated && user && targetUserId) {
        const checkFollowStatus = async () => {
          try {
            const { data: followData } = await supabase
              .from('follows')
              .select('id')
              .eq('follower_id', user.id)
              .eq('following_id', targetUserId)
              .single();

            const isCurrentlyFollowing = !!followData;
            setIsFollowing(isCurrentlyFollowing);
          } catch (error) {
            console.error('Error checking follow status:', error);
          }
        };

        checkFollowStatus();
      }
    }, [isAuthenticated, user, targetUserId])
  );

  // Get button styles based on variant and state
  const getButtonStyle = useCallback(() => {
    const sizeConfig = getSizeConfig();
    const baseStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: SIZES.radius.md,
      borderWidth: variant !== 'primary' ? 1 : 0,
      paddingVertical: sizeConfig.paddingVertical,
      paddingHorizontal: sizeConfig.paddingHorizontal,
      gap: SIZES.xs,
      ...StyleHelpers.createShadow(COLORS.shadow, 2),
      transform: [{ scale: scaleAnim }],
    };

    let buttonStyle: any = {};

    switch (variant) {
      case 'primary':
        buttonStyle = {
          ...baseStyle,
          backgroundColor: isFollowing ? COLORS.surface : COLORS.primary,
          borderColor: COLORS.primary,
        };
        break;
      case 'secondary':
        buttonStyle = {
          ...baseStyle,
          backgroundColor: isFollowing ? COLORS.surface : COLORS.accent,
          borderColor: COLORS.accent,
        };
        break;
      case 'outline':
        buttonStyle = {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderColor: isFollowing ? COLORS.textSecondary : COLORS.primary,
        };
        break;
      case 'text':
        buttonStyle = {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 0,
          paddingVertical: SIZES.xs,
          paddingHorizontal: SIZES.sm,
        };
        break;
    }

    // Add disabled state
    if (disabled) {
      buttonStyle.opacity = 0.5;
    }

    return [buttonStyle, style];
  }, [variant, isFollowing, disabled, sizeConfig, scaleAnim, style]);

  // Get text styles
  const getTextStyle = useCallback(() => {
    const sizeConfig = getSizeConfig();

    let textStyle: any = {
      fontSize: sizeConfig.fontSize,
      fontFamily: FONTS.families.primary,
      fontWeight: FONTS.weight.semibold,
    };

    switch (variant) {
      case 'primary':
        textStyle = {
          ...textStyle,
          color: isFollowing ? COLORS.primary : COLORS.textOnPrimary,
        };
        break;
      case 'secondary':
        textStyle = {
          ...textStyle,
          color: isFollowing ? COLORS.accent : COLORS.textOnPrimary,
        };
        break;
      case 'outline':
        textStyle = {
          ...textStyle,
          color: isFollowing ? COLORS.textSecondary : COLORS.primary,
        };
        break;
      case 'text':
        textStyle = {
          ...textStyle,
          color: isFollowing ? COLORS.textSecondary : COLORS.primary,
        };
        break;
    }

    return textStyle;
  }, [variant, isFollowing, getSizeConfig]);

  // Render loading indicator
  const renderLoadingIndicator = useCallback(() => {
    if (variant === 'text') {
      return null;
    }

    return (
      <ActivityIndicator
        size="small"
        color={
          variant === 'primary'
            ? (isFollowing ? COLORS.primary : COLORS.textOnPrimary)
            : variant === 'secondary'
            ? (isFollowing ? COLORS.accent : COLORS.textOnPrimary)
            : COLORS.primary
        }
        style={styles.loadingIndicator}
      />
    );
  }, [variant, isFollowing]);

  // Render button content
  const renderButtonContent = useCallback(() => {
    const sizeConfig = getSizeConfig();
    const isFollowingText = isFollowing ? 'Following' : 'Follow';
    const followIcon = isFollowing ? '✓' : '➕';

    return (
      <>
        {variant !== 'text' && (
          <Text style={[styles.buttonIcon, { fontSize: sizeConfig.iconSize, color: getTextStyle().color }]}>
            {followIcon}
          </Text>
        )}
        {!isLoading && (
          <Text style={getTextStyle()}>
            {isFollowingText}
          </Text>
        )}
        {isLoading && renderLoadingIndicator()}
      </>
    );
  }, [isFollowing, isLoading, renderLoadingIndicator, getSizeConfig, getTextStyle]);

  return (
    <Animated.View style={getButtonStyle()}>
      <TouchableOpacity
        onPress={handleFollowToggle}
        disabled={disabled || isLoading || !isAuthenticated}
        activeOpacity={0.8}
      >
        {renderButtonContent()}
      </TouchableOpacity>
    </Animated.View>
  );
};

// Compact version for inline use
export const CompactFollowButton: React.FC<Omit<FollowButtonProps, 'size' | 'variant'>> = (props) => (
  <FollowButton size="small" variant="outline" {...props} />
);

// Large version for profile headers
export const ProfileFollowButton: React.FC<Omit<FollowButtonProps, 'size'>> = (props) => (
  <FollowButton size="large" {...props} />
);

// ===== STYLES =====
const styles = StyleSheet.create({
  loadingIndicator: {
    marginLeft: SIZES.xs,
  },
  buttonIcon: {
    textAlign: 'center',
  },
});

export default FollowButton;