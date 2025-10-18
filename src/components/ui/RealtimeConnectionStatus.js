// Real-time Connection Status Component
// Shows real-time subscription connection status with visual indicators

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  AlertCircle,
  Check,
  Bell,
  BellOff,
} from 'lucide-react-native';

import { useRealtimeConnection } from '../../store/realtimeStore';

const RealtimeConnectionStatus = () => {
  const {
    isConnected,
    isConnecting,
    error,
    initialize,
    reconnect,
    clearError,
  } = useRealtimeConnection();

  const [showStatus, setShowStatus] = useState(false);
  const [animatedValue] = useState(new Animated.Value(0));

  useEffect(() => {
    // Show status when connection state changes
    const timer = setTimeout(() => {
      setShowStatus(true);
      animateIn();
    }, 500);

    return () => clearTimeout(timer);
  }, [isConnected, isConnecting, error]);

  // Animate status bar in
  const animateIn = () => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Auto hide after 3 seconds if no error
    if (!error) {
      setTimeout(() => {
        animateOut();
      }, 3000);
    }
  };

  // Animate status bar out
  const animateOut = () => {
    Animated.timing(animatedValue, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowStatus(false);
    });
  };

  // Handle reconnect button press
  const handleReconnect = () => {
    clearError();
    reconnect();
  };

  // Get status configuration
  const getStatusConfig = () => {
    if (isConnecting) {
      return {
        icon: RefreshCw,
        color: '#F59E0B',
        backgroundColor: '#FEF3C7',
        title: 'Connecting to Real-time',
        message: 'Establishing live updates...',
        showSpinner: true,
      };
    }

    if (error) {
      return {
        icon: WifiOff,
        color: '#EF4444',
        backgroundColor: '#FEE2E2',
        title: 'Real-time Connection Error',
        message: error || 'Failed to connect to real-time service',
        showRetry: true,
      };
    }

    if (isConnected) {
      return {
        icon: Bell,
        color: '#10B981',
        backgroundColor: '#D1FAE5',
        title: 'Real-time Active',
        message: 'Live updates enabled',
        showSpinner: false,
      };
    }

    return {
      icon: BellOff,
      color: '#6B7280',
      backgroundColor: '#F3F4F6',
      title: 'Real-time Offline',
      message: 'Live updates disabled',
      showRetry: true,
    };
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  if (!showStatus) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: animatedValue }],
          backgroundColor: config.backgroundColor,
        },
      ]}
    >
      <StatusBar
        barStyle={error || !isConnected ? 'dark-content' : 'light-content'}
        backgroundColor={config.backgroundColor}
      />

      <View style={styles.content}>
        {/* Status Icon */}
        <View style={[styles.iconContainer, { backgroundColor: config.color }]}>
          <Icon
            size={16}
            color="#fff"
            style={config.showSpinner && styles.spinning}
          />
        </View>

        {/* Status Text */}
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: config.color }]}>
            {config.title}
          </Text>
          <Text style={styles.message}>{config.message}</Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {config.showRetry && (
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: config.color }]}
              onPress={handleReconnect}
            >
              <RefreshCw size={16} color="#fff" />
            </TouchableOpacity>
          )}

          {!error && (
            <TouchableOpacity
              style={styles.dismissButton}
              onPress={animateOut}
            >
              <AlertCircle size={16} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  message: {
    fontSize: 12,
    opacity: 0.8,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  retryButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dismissButton: {
    padding: 8,
    borderRadius: 16,
    backgroundColor: '#f8f8f8',
  },
  spinning: {
    // Animation handled by parent component
  },
});

export default RealtimeConnectionStatus;