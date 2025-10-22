// Real-time Notifications Component
// Displays live notification updates with smooth animations

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
  PanResponder,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useRealtimeNotifications } from '../../store/realtimeStore';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const NOTIFICATION_HEIGHT = 80;
const NOTIFICATION_WIDTH = screenWidth - 32;
const SWIPE_THRESHOLD = NOTIFICATION_WIDTH * 0.3;

// Notification types configuration
const NOTIFICATION_CONFIGS = {
  like: {
    icon: 'heart',
    color: '#FF6B6B',
    bgColor: '#fff0f0',
    title: 'New Like',
  },
  comment: {
    icon: 'chatbubble-outline',
    color: '#4ECDC4',
    bgColor: '#f0fdf4',
    title: 'New Comment',
  },
  follow: {
    icon: 'person-add',
    color: '#8B5CF6',
    bgColor: '#f3f0ff',
    title: 'New Follower',
  },
  competition_update: {
    icon: 'trophy',
    color: '#FFD700',
    bgColor: '#fffbeb',
    title: 'Competition Update',
  },
  competition_winner: {
    icon: 'trophy',
    color: '#FFD700',
    bgColor: '#fffbeb',
    title: 'Competition Winner',
  },
  new_follower: {
    icon: 'notifications',
    color: '#6B7280',
    bgColor: '#f9fafb',
    title: 'New Follower',
  },
  default: {
    icon: 'information-circle',
    color: '#6B7280',
    bgColor: '#f9fafb',
    title: 'Notification',
  },
};

const RealtimeNotifications = () => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  } = useRealtimeNotifications();

  const [visibleNotifications, setVisibleNotifications] = useState([]);
  const [expandedNotification, setExpandedNotification] = useState(null);
  const animatedValues = useRef(new Map()).current;
  const swipeAnimatedValues = useRef(new Map()).current;

  // Filter and limit notifications for display
  const displayNotifications = useMemo(() => {
    return Array.isArray(notifications) ? notifications.slice(0, 5) : []; // Show max 5 notifications at once
  }, [notifications]);

  // Initialize animations for new notifications
  useEffect(() => {
    Array.isArray(displayNotifications) && displayNotifications.forEach((notification, index) => {
      if (notification && notification.id && !animatedValues.has(notification.id)) {
        const animatedValue = new Animated.Value(-NOTIFICATION_WIDTH);
        animatedValues.set(notification.id, animatedValue);

        const swipeValue = new Animated.Value(0);
        swipeAnimatedValues.set(notification.id, swipeValue);

        // Animate in
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 300,
          delay: index * 100,
          useNativeDriver: true,
        }).start();
      }
    });

    // Clean up animations for removed notifications
    const currentIds = new Set(Array.isArray(displayNotifications) ? displayNotifications.map(n => n?.id).filter(Boolean) : []);
    animatedValues.forEach((_, id) => {
      if (!currentIds.has(id)) {
        animatedValues.delete(id);
        swipeAnimatedValues.delete(id);
      }
    });

    setVisibleNotifications(displayNotifications);
  }, [displayNotifications]);

  // Auto-dismiss notifications after 5 seconds
  useEffect(() => {
    const timers = new Map();

    Array.isArray(visibleNotifications) && visibleNotifications.forEach((notification) => {
      if (notification && notification.id && !timers.has(notification.id)) {
        const timer = setTimeout(() => {
          dismissNotification(notification.id);
        }, 5000);
        timers.set(notification.id, timer);
      }
    });

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [visibleNotifications]);

  // Dismiss notification with animation
  const dismissNotification = useCallback((notificationId) => {
    const animatedValue = animatedValues.get(notificationId);
    if (animatedValue) {
      Animated.timing(animatedValue, {
        toValue: NOTIFICATION_WIDTH,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setVisibleNotifications(prev => prev.filter(n => n.id !== notificationId));
        markAsRead(notificationId);
        animatedValues.delete(notificationId);
        swipeAnimatedValues.delete(notificationId);
      });
    }
  }, [animatedValues, markAsRead]);

  // Handle swipe gestures
  const createPanResponder = useCallback((notificationId) => {
    return PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        const swipeValue = swipeAnimatedValues.get(notificationId);
        if (swipeValue) {
          swipeValue.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const swipeValue = swipeAnimatedValues.get(notificationId);
        if (swipeValue) {
          if (gestureState.dx > SWIPE_THRESHOLD) {
            // Swiped right enough, dismiss
            Animated.timing(swipeValue, {
              toValue: NOTIFICATION_WIDTH,
              duration: 200,
              useNativeDriver: true,
            }).start(() => {
              setVisibleNotifications(prev => prev.filter(n => n.id !== notificationId));
              markAsRead(notificationId);
              animatedValues.delete(notificationId);
              swipeAnimatedValues.delete(notificationId);
            });
          } else {
            // Snap back
            Animated.spring(swipeValue, {
              toValue: 0,
              useNativeDriver: true,
              tension: 100,
              friction: 8,
            }).start();
          }
        }
      },
    });
  }, [swipeAnimatedValues, markAsRead]);

  // Get notification configuration
  const getNotificationConfig = useCallback((type) => {
    return NOTIFICATION_CONFIGS[type] || NOTIFICATION_CONFIGS.default;
  }, []);

  // Render individual notification
  const renderNotification = useCallback((notification, index) => {
    const config = getNotificationConfig(notification.type);
    const animatedValue = animatedValues.get(notification.id);
    const swipeValue = swipeAnimatedValues.get(notification.id);
    const panResponder = createPanResponder(notification.id);

    if (!animatedValue) return null;

    return (
      <Animated.View
        key={notification.id}
        style={[
          styles.notificationContainer,
          {
            transform: [
              { translateX: animatedValue },
              { translateX: swipeValue || new Animated.Value(0) },
            ],
            opacity: animatedValue.interpolate({
              inputRange: [-NOTIFICATION_WIDTH, 0, NOTIFICATION_WIDTH],
              outputRange: [0, 1, 0],
            }),
          },
        ]}
        {...panResponder.panHandlers}
      >
        <View style={[styles.notification, { backgroundColor: config.bgColor }]}>
          {/* Icon */}
          <View style={[styles.notificationIcon, { backgroundColor: config.color }]}>
            <Ionicons name={config.icon} size={16} color="#fff" />
          </View>

          {/* Content */}
          <View style={styles.notificationContent}>
            <View style={styles.notificationHeader}>
              <Text style={styles.notificationTitle}>{config.title}</Text>
              <Text style={styles.notificationTime}>
                {getTimeAgo(notification.created_at)}
              </Text>
            </View>
            <Text style={styles.notificationMessage} numberOfLines={2}>
              {notification.message}
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.notificationActions}>
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => dismissNotification(notification.id)}
            >
              <Ionicons name="close" size={16} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Swipe indicator */}
          <View style={styles.swipeIndicator}>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </View>
        </View>
      </Animated.View>
    );
  }, [getNotificationConfig, createPanResponder, dismissNotification, animatedValues, swipeAnimatedValues]);

  // Render notification center button
  const renderNotificationCenterButton = () => {
    if (unreadCount === 0) return null;

    return (
      <TouchableOpacity style={styles.notificationCenterButton}>
        <View style={styles.notificationCenterContent}>
          <Ionicons name="notifications" size={20} color="#fff" />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Notifications list */}
      <View style={styles.notificationsList}>
        {visibleNotifications.map((notification, index) =>
          renderNotification(notification, index)
        )}
      </View>

      {/* Notification center button */}
      {renderNotificationCenterButton()}

      {/* Clear all button */}
      {notifications.length > 0 && (
        <TouchableOpacity
          style={styles.clearAllButton}
          onPress={() => {
            clearNotifications();
            markAllAsRead();
          }}
        >
          <Text style={styles.clearAllText}>Clear All</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// Helper function to format time
function getTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now - date) / (1000 * 60));

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
  return `${Math.floor(diffInMinutes / 1440)}d ago`;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  notificationsList: {
    gap: 8,
  },
  notificationContainer: {
    marginBottom: 8,
  },
  notification: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: NOTIFICATION_HEIGHT,
  },
  notificationIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  notificationTime: {
    fontSize: 12,
    color: '#666',
  },
  notificationMessage: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  notificationActions: {
    marginLeft: 8,
  },
  notificationButton: {
    padding: 8,
    borderRadius: 16,
    backgroundColor: '#f8f8f8',
  },
  swipeIndicator: {
    position: 'absolute',
    right: 20,
    opacity: 0.3,
  },
  notificationCenterButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#4ECDC4',
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  notificationCenterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  clearAllButton: {
    alignSelf: 'flex-end',
    backgroundColor: '#f8f8f8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 8,
  },
  clearAllText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
});

export default RealtimeNotifications;