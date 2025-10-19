// AI Status Indicator Component
// Shows AI processing status for wardrobe items

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAITaggingActions } from '../../store/wardrobeStore';
import { COLORS, SIZES } from '../../utils/constants';

const AIStatusIndicator = ({ itemId, compact = false, onPress }) => {
  const [aiStatus, setAiStatus] = useState(null);
  const [pulseAnim] = useState(new Animated.Value(1));

  const { getAITaggingStatus, monitorAITaggingProgress } = useAITaggingActions();

  useEffect(() => {
    if (itemId) {
      loadStatus();
      startMonitoring();
    }

    return () => {
      // Cleanup monitoring when component unmounts
    };
  }, [itemId]);

  const loadStatus = async () => {
    try {
      const status = await getAITaggingStatus(itemId);
      setAiStatus(status);
    } catch (error) {
      console.error('Error loading AI status:', error);
    }
  };

  const startMonitoring = () => {
    monitorAITaggingProgress(itemId, (status) => {
      setAiStatus(status);

      // Animate when processing
      if (status.status === 'processing') {
        startPulseAnimation();
      } else {
        stopPulseAnimation();
      }
    });
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopPulseAnimation = () => {
    pulseAnim.setValue(1);
  };

  const getStatusConfig = () => {
    if (!aiStatus) {
      return {
        icon: 'pulse',
        color: COLORS.textSecondary,
        backgroundColor: `${COLORS.textSecondary}20`,
        text: 'AI',
        showSpinner: false,
      };
    }

    switch (aiStatus.status) {
      case 'pending':
        return {
          icon: 'pulse',
          color: COLORS.textSecondary,
          backgroundColor: `${COLORS.textSecondary}20`,
          text: 'AI',
          showSpinner: false,
        };

      case 'processing':
        return {
          icon: 'refresh',
          color: COLORS.info,
          backgroundColor: `${COLORS.info}20`,
          text: 'AI',
          showSpinner: true,
        };

      case 'completed':
        return {
          icon: aiStatus.confidence > 0.8 ? 'sparkles' : 'checkmark-circle',
          color: aiStatus.confidence > 0.8 ? COLORS.accent : COLORS.success,
          backgroundColor: aiStatus.confidence > 0.8 ? `${COLORS.accent}20` : `${COLORS.success}20`,
          text: aiStatus.confidence > 0.8 ? 'AI+' : 'AI',
          showSpinner: false,
        };

      case 'failed':
        return {
          icon: 'close-circle',
          color: COLORS.error,
          backgroundColor: `${COLORS.error}20`,
          text: 'AI',
          showSpinner: false,
        };

      default:
        return {
          icon: 'pulse',
          color: COLORS.textSecondary,
          backgroundColor: `${COLORS.textSecondary}20`,
          text: 'AI',
          showSpinner: false,
        };
    }
  };

  const config = getStatusConfig();

  if (compact) {
    return (
      <Animated.View
        style={[
          styles.compactContainer,
          {
            backgroundColor: config.backgroundColor,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.compactTouchable}
          onPress={onPress}
          disabled={!onPress}
        >
          {config.showSpinner ? (
            <ActivityIndicator size={12} color={config.color} />
          ) : (
            <Ionicons name={config.icon} size={12} color={config.color} />
          )}
          <Text style={[styles.compactText, { color: config.color }]}>
            {config.text}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: config.backgroundColor,
        },
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.content}>
        {config.showSpinner ? (
          <ActivityIndicator size={16} color={config.color} />
        ) : (
          <Ionicons name={config.icon} size={16} color={config.color} />
        )}

        <Text style={[styles.text, { color: config.color }]}>
          {aiStatus?.status === 'processing' && 'Processing...'}
          {aiStatus?.status === 'completed' && `AI (${Math.round((aiStatus.confidence || 0) * 100)}%)`}
          {aiStatus?.status === 'failed' && 'AI Failed'}
          {!aiStatus && 'AI Pending'}
        </Text>

        {aiStatus?.error && (
          <Ionicons name="alert-circle" size={12} color={COLORS.error} />
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.sm,
    minWidth: 60,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.xs,
  },
  text: {
    fontSize: 10,
    fontWeight: '600',
  },
  compactContainer: {
    borderRadius: SIZES.sm,
    overflow: 'hidden',
  },
  compactTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.xs,
    paddingVertical: 2,
    gap: 2,
  },
  compactText: {
    fontSize: 8,
    fontWeight: '600',
  },
});

export default AIStatusIndicator;