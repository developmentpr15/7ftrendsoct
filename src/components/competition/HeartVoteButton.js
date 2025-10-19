// Heart Vote Button Component
// Interactive heart button with real-time vote count updates and animations

import React, { useState, useEffect, useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  ActivityIndicator,
  Vibration,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { competitionVotingService } from '../../services/competitionVotingService';
import { useSessionStore } from '../../store/sessionStore';
import { COLORS, SIZES, FONTS } from '../../utils/constants';

const HeartVoteButton = ({
  entryId,
  competitionId,
  initialVoteCount = 0,
  size = 'medium',
  showCount = true,
  style,
  onVoteChange,
  disabled = false,
}) => {
  const [voteCount, setVoteCount] = useState(initialVoteCount);
  const [hasVoted, setHasVoted] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [error, setError] = useState(null);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const heartAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const { user } = useSessionStore();

  // Size configurations
  const sizeConfig = {
    small: {
      iconSize: 16,
      fontSize: 12,
      padding: SIZES.xs,
      spacing: SIZES.xs,
    },
    medium: {
      iconSize: 20,
      fontSize: 14,
      padding: SIZES.sm,
      spacing: SIZES.sm,
    },
    large: {
      iconSize: 24,
      fontSize: 16,
      padding: SIZES.md,
      spacing: SIZES.md,
    },
  };

  const config = sizeConfig[size] || sizeConfig.medium;

  // Check initial voting status
  useEffect(() => {
    if (entryId && user) {
      checkVotingStatus();
    }
  }, [entryId, user]);

  const checkVotingStatus = async () => {
    try {
      const hasVoted = await competitionVotingService.hasUserVotedForEntry(entryId);
      setHasVoted(hasVoted);
    } catch (error) {
      console.error('Error checking voting status:', error);
    }
  };

  const animateVote = (isAdding) => {
    // Heart animation
    if (isAdding) {
      // Scale up and fade in
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1.3,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(heartAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(heartAnim, {
            toValue: 0,
            duration: 200,
            delay: 100,
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      // Pulse animation
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      // Vibrate on vote
      Vibration.vibrate(50);
    } else {
      // Remove vote animation
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const handleVote = async () => {
    if (!user || isVoting || disabled) {
      if (!user) {
        setError('Please login to vote');
        setTimeout(() => setError(null), 3000);
      }
      return;
    }

    try {
      setIsVoting(true);
      setError(null);

      const previousVoteState = hasVoted;
      const previousCount = voteCount;

      // Optimistic update
      const newVoteState = !previousVoteState;
      const newCount = previousVoteState ? previousCount - 1 : previousCount + 1;

      setHasVoted(newVoteState);
      setVoteCount(newCount);

      // Animate
      animateVote(newVoteState);

      // Call API
      const result = await competitionVotingService.voteForEntry(entryId);

      if (result.success) {
        // Update with actual count from server
        if (result.votes_count !== undefined) {
          setVoteCount(result.votes_count);
        }

        // Notify parent component
        onVoteChange?.({
          entryId,
          hasVoted: newVoteState,
          voteCount: result.votes_count || newCount,
          action: result.action,
        });
      } else {
        // Revert optimistic update
        setHasVoted(previousVoteState);
        setVoteCount(previousCount);
        setError(result.error || 'Failed to vote');
        setTimeout(() => setError(null), 3000);
      }

    } catch (error) {
      // Revert optimistic update
      setHasVoted(!hasVoted);
      setVoteCount(hasVoted ? voteCount - 1 : voteCount + 1);
      setError('Failed to vote');
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsVoting(false);
    }
  };

  const HeartIcon = hasVoted ? 'heart' : 'heart-dislike';

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          padding: config.padding,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
      onPress={handleVote}
      disabled={isVoting || disabled}
      activeOpacity={0.8}
    >
      <Animated.View
        style={[
          styles.content,
          {
            transform: [
              { scale: scaleAnim },
              { scale: pulseAnim },
            ],
          },
        ]}
      >
        <Animated.View
          style={[
            styles.heartContainer,
            {
              opacity: heartAnim,
              transform: [
                {
                  translateY: heartAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -10],
                  }),
                },
              ],
            },
          ]}
        >
          <Ionicons
            name={HeartIcon}
            size={config.iconSize}
            color={hasVoted ? COLORS.error : COLORS.textSecondary}
          />
        </Animated.View>

        <Ionicons
          name={HeartIcon}
          size={config.iconSize}
          color={hasVoted ? COLORS.error : COLORS.textSecondary}
        />

        {showCount && (
          <Text
            style={[
              styles.voteCount,
              {
                fontSize: config.fontSize,
                color: hasVoted ? COLORS.error : COLORS.text,
                marginLeft: config.spacing,
              },
            ]}
          >
            {isVoting ? '...' : voteCount.toLocaleString()}
          </Text>
        )}

        {isVoting && (
          <ActivityIndicator
            size="small"
            color={hasVoted ? COLORS.error : COLORS.textSecondary}
            style={styles.loader}
          />
        )}
      </Animated.View>

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: SIZES.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    minHeight: 32,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voteCount: {
    fontWeight: '600',
    minWidth: 20,
    textAlign: 'center',
  },
  loader: {
    marginLeft: SIZES.xs,
  },
  errorText: {
    position: 'absolute',
    bottom: -20,
    fontSize: 10,
    color: COLORS.error,
    textAlign: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: SIZES.xs,
    paddingVertical: 2,
    borderRadius: SIZES.xs,
  },
});

export default HeartVoteButton;