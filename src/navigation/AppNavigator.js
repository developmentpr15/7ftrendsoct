import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, Text } from 'react-native';
import { COLORS, SIZES, FONTS } from '../utils/constants';
import AuthNavigator from './AuthNavigator';
import TabNavigator from './TabNavigator';
import { useAuthStore } from '../store/authStore';
import { testSupabaseConnection } from '../utils/supabase';
import { initializeStores } from '../store';
import { useRealtimeConnection } from '../store/realtimeStore';
import { authService } from '../services/authService'; // Import authService

const AppNavigator = () => {
  const { user, isLoading, isAuthenticated, initAuth } = useAuthStore();
  const { isConnected: realtimeConnected, initialize: initializeRealtime } = useRealtimeConnection();
  const [connectionStatus, setConnectionStatus] = useState('loading');
  const [connectionError, setConnectionError] = useState(null);
  const [isOnboarded, setIsOnboarded] = useState(null); // null: not checked, false: not onboarded, true: onboarded

  useEffect(() => {
    // Test connection first
    const checkConnection = async () => {
      try {
        setConnectionStatus('loading');
        const result = await testSupabaseConnection();
        if (result.success) {
          setConnectionStatus('connected');
          setConnectionError(null);
        } else {
          setConnectionStatus('error');
          setConnectionError(result.error.message);
        }
      } catch (error) {
        setConnectionStatus('error');
        setConnectionError(error.message);
      }
    };

    checkConnection();

    // Initialize stores and real-time connections
    const initializeApp = async () => {
      try {
        // Initialize all stores
        await initializeStores();

        // Initialize real-time service
        await initializeRealtime();
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
    };

    // Initialize auth state when component mounts
    const subscription = initAuth();

    // Initialize app stores and real-time
    initializeApp();

    // Cleanup subscription on unmount
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (isAuthenticated && user && isOnboarded === null) {
        const profile = await authService.getCurrentUserProfile();
        setIsOnboarded(!!profile);
      } else if (!isAuthenticated) {
        setIsOnboarded(null); // Reset onboarding status if user logs out
      }
    };
    checkOnboardingStatus();
  }, [isAuthenticated, user, isOnboarded]);

  // Show connection error if connection fails
  if (connectionStatus === 'error') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background, padding: SIZES.lg }}>
        <Text style={{ fontSize: FONTS.sizes.lg, fontFamily: FONTS.bold, color: COLORS.text, marginBottom: SIZES.md }}>
          Network Error
        </Text>
        <Text style={{ fontSize: FONTS.sizes.md, color: COLORS.textSecondary, textAlign: 'center', marginBottom: SIZES.lg }}>
          {connectionError || 'Failed to connect to services. Please check your internet connection.'}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <ActivityIndicator size="small" color={COLORS.accent} />
          <Text style={{ fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginLeft: SIZES.sm }}>
            Retrying...
          </Text>
        </View>
      </View>
    );
  }

  // Show loading while checking connection or auth or onboarding status
  if (isLoading || connectionStatus === 'loading' || (isAuthenticated && isOnboarded === null)) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={{ fontSize: FONTS.sizes.md, color: COLORS.textSecondary, marginTop: SIZES.md }}>
          {connectionStatus === 'loading' ? 'Checking connection...' : 'Loading...'}
        </Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" backgroundColor={COLORS.primary} />
      {isAuthenticated ? (
        isOnboarded ? (
          <TabNavigator />
        ) : (
          <AuthNavigator initialRouteName="Onboarding" />
        )
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
};

export default AppNavigator;