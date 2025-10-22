import AsyncStorage from '@react-native-async-storage/async-storage';

// Main store export file
// This file exports all stores and provides a unified interface

// Store imports
import { useSessionStore, useAuth, useUserPreferences, useAuthActions, initializeSessionManagement, cleanupSessionManagement } from './sessionStore';
import type { User, UserPreferences } from './sessionStore';

import { useFeedStore, useFeed, useFeedActions, useFeedFilters, useFeedPagination } from './feedStore';
import type { Post, FeedAnalytics, PaginationState, FeedFilter } from './feedStore';

import { useCompetitionStore, useCompetitions, useCurrentCompetition, useCompetitionActions, useCompetitionSubmission, useCompetitionVoting, useCompetitionLeaderboard } from './competitionStore';
import type { Competition, CompetitionEntry, CompetitionVote, LeaderboardEntry, CompetitionFilter } from './competitionStore';

import { useWardrobeStore, useWardrobe, useOutfits, useAR, useWardrobeActions, useOutfitActions, useARActions, useWardrobeFilters, useAITaggingActions } from './wardrobeStore';
import type { WardrobeItem, Outfit, OutfitSuggestion, ARSession, WardrobeFilter, OutfitFilter } from './wardrobeStore';

import { useRealtimeStore, useRealtime, useRealtimeNotifications, useRealtimeConnection, useRealtimeSubscriptions } from './realtimeStore';
import type { RealtimeNotification, RealtimeEvent, RealtimeConnectionState } from './realtimeStore';

export {
    useSessionStore,
    useAuth,
    useUserPreferences,
    useAuthActions,
    initializeSessionManagement,
    cleanupSessionManagement,
    useFeedStore,
    useFeed,
    useFeedActions,
    useFeedFilters,
    useFeedPagination,
    useCompetitionStore,
    useCompetitions,
    useCurrentCompetition,
    useCompetitionActions,
    useCompetitionSubmission,
    useCompetitionVoting,
    useCompetitionLeaderboard,
    useWardrobeStore,
    useWardrobe,
    useOutfits,
    useAR,
    useWardrobeActions,
    useOutfitActions,
    useARActions,
    useWardrobeFilters,
    useAITaggingActions,
    useRealtimeStore,
    useRealtime,
    useRealtimeNotifications,
    useRealtimeConnection,
    useRealtimeSubscriptions,
};

export type {
    User,
    UserPreferences,
    Post,
    FeedAnalytics,
    PaginationState,
    FeedFilter,
    Competition,
    CompetitionEntry,
    CompetitionVote,
    LeaderboardEntry,
    CompetitionFilter,
    WardrobeItem,
    Outfit,
    OutfitSuggestion,
    ARSession,
    WardrobeFilter,
    OutfitFilter,
    RealtimeNotification,
    RealtimeEvent,
    RealtimeConnectionState,
};

// Re-export common types
export type {
  StoreApi,
  UseBoundStore,
} from 'zustand';

// Combined store hooks for common patterns
export const useAppStore = () => {
  const auth = useAuth();
  const feed = useFeed();
  const competitions = useCompetitions();
  const wardrobe = useWardrobe();

  return {
    // Auth state
    user: auth.user,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading || feed.loading,

    // Combined loading states
    isAppLoading: auth.isLoading,
    isFeedLoading: feed.loading,
    isCompetitionLoading: competitions.loading,
    isWardrobeLoading: wardrobe.loading,

    // Combined error states
    authError: auth.error,
    feedError: feed.error,
    competitionError: competitions.error,
    wardrobeError: wardrobe.error,

    // Quick access to user data
    username: auth.user?.username,
    avatarUrl: auth.user?.avatar_url,
    preferences: auth.user?.preferences,
  };
};

// Store initialization utilities
export const initializeStores = async () => {
  // Initialize session management (auto-refresh, inactivity checks)
  initializeSessionManagement();

  // Initialize other stores as needed
  try {
    // Check auth status first
    const { checkAuthStatus } = useSessionStore.getState();
    await checkAuthStatus();

    // Preload data if authenticated
    const { isAuthenticated } = useSessionStore.getState();
    if (isAuthenticated) {
      // Preload feed data
      const { fetchFeed } = useFeedStore.getState();
      await fetchFeed(true);

      // Preload competitions (with error handling)
      try {
        const { fetchCompetitions } = useCompetitionStore.getState();
        await fetchCompetitions(true);
      } catch (error: any) {
        console.warn('Failed to preload competitions:', error?.message || 'Unknown error');
      }

      // Preload wardrobe stats (with error handling)
      try {
        const { calculateStats } = useWardrobeStore.getState();
        calculateStats();
      } catch (error: any) {
        console.warn('Failed to calculate wardrobe stats:', error?.message || 'Unknown error');
      }
    }
  } catch (error) {
    console.error('Error initializing stores:', error);
  }
};

// Store cleanup utilities
export const cleanupStores = () => {
  cleanupSessionManagement();
  // Add other cleanup as needed
};

// Store monitoring utilities
export const getStoreHealth = () => {
  const sessionState = useSessionStore.getState();
  const feedState = useFeedStore.getState();
  const competitionState = useCompetitionStore.getState();
  const wardrobeState = useWardrobeStore.getState();

  return {
    session: {
      isAuthenticated: sessionState.isAuthenticated,
      hasUser: !!sessionState.user,
      hasError: !!sessionState.error,
      isLoading: sessionState.isLoading,
    },
    feed: {
      hasPosts: feedState.posts.length > 0,
      hasError: !!feedState.error,
      isLoading: feedState.loading,
      offlineMode: feedState.offlineMode,
    },
    competitions: {
      hasCompetitions: competitionState.competitions.length > 0,
      hasError: !!competitionState.error,
      isLoading: competitionState.loading,
      hasUserEntries: competitionState.userEntries.length > 0,
    },
    wardrobe: {
      hasItems: wardrobeState.wardrobeItems.length > 0,
      hasOutfits: wardrobeState.outfits.length > 0,
      hasError: !!wardrobeState.error,
      isLoading: wardrobeState.loading,
      hasStats: !!wardrobeState.stats,
    },
  };
};

// Store debugging utilities
export const debugStores = () => {
  console.group('📊 Store Debug Information');

  console.group('👤 Session Store');
  console.log('User:', useSessionStore.getState().user);
  console.log('Authenticated:', useSessionStore.getState().isAuthenticated);
  console.log('Loading:', useSessionStore.getState().isLoading);
  console.log('Error:', useSessionStore.getState().error);
  console.groupEnd();

  console.group('📱 Feed Store');
  console.log('Posts:', useFeedStore.getState().posts.length);
  console.log('Loading:', useFeedStore.getState().loading);
  console.log('Refreshing:', useFeedStore.getState().refreshing);
  console.log('Error:', useFeedStore.getState().error);
  console.log('Offline Mode:', useFeedStore.getState().offlineMode);
  console.groupEnd();

  console.group('🏆 Competition Store');
  console.log('Competitions:', useCompetitionStore.getState().competitions.length);
  console.log('User Entries:', useCompetitionStore.getState().userEntries.length);
  console.log('Leaderboard:', useCompetitionStore.getState().leaderboard.length);
  console.log('Loading:', useCompetitionStore.getState().loading);
  console.log('Error:', useCompetitionStore.getState().error);
  console.groupEnd();

  console.group('👗 Wardrobe Store');
  console.log('Items:', useWardrobeStore.getState().wardrobeItems.length);
  console.log('Outfits:', useWardrobeStore.getState().outfits.length);
  console.log('AR Sessions:', useWardrobeStore.getState().arSessions.length);
  console.log('Current AR Session:', !!useWardrobeStore.getState().currentARSession);
  console.log('Loading:', useWardrobeStore.getState().loading);
  console.log('Error:', useWardrobeStore.getState().error);
  console.groupEnd();

  console.groupEnd();
};

// Store performance monitoring
export const measureStorePerformance = () => {
  const startTime = performance.now();

  // Measure store subscription performance
  const unsubscribeSession = useSessionStore.subscribe((state) => {
    console.log('Session store updated:', {
      user: state.user?.username,
      authenticated: state.isAuthenticated,
      timestamp: Date.now(),
    });
  });

  const unsubscribeFeed = useFeedStore.subscribe((state) => {
    console.log('Feed store updated:', {
      postsCount: state.posts.length,
      loading: state.loading,
      timestamp: Date.now(),
    });
  });

  setTimeout(() => {
    const endTime = performance.now();
    console.log(`Store subscription setup took ${endTime - startTime}ms`);

    // Cleanup
    unsubscribeSession();
    unsubscribeFeed();
  }, 1000);
};

// Store migration utilities (for future schema changes)
export const migrateStores = async () => {
  try {
    console.log('🔄 Starting store migration...');

    // Check if migration is needed
    const sessionVersion = await AsyncStorage.getItem('store-version');
    const currentVersion = '1.0.0';

    if (sessionVersion !== currentVersion) {
      console.log(`Migrating from version ${sessionVersion} to ${currentVersion}`);

      // Perform migrations here
      // Example: Migrate old appStore data to new modular stores
      const oldAppStore = await AsyncStorage.getItem('7ftrends-app-storage');
      if (oldAppStore) {
        try {
          const parsed = JSON.parse(oldAppStore);
          console.log('Found old app store data, migrating...');

          // Migrate wardrobe items
          if (parsed.wardrobeItems && Array.isArray(parsed.wardrobeItems)) {
            console.log(`Migrating ${parsed.wardrobeItems.length} wardrobe items`);
            // Migration logic here
          }

          // Migrate competitions
          if (parsed.competitions && Array.isArray(parsed.competitions)) {
            console.log(`Migrating ${parsed.competitions.length} competitions`);
            // Migration logic here
          }

        } catch (error) {
          console.error('Error migrating old store data:', error);
        }
      }

      // Update version
      await AsyncStorage.setItem('store-version', currentVersion);
      console.log('✅ Store migration completed');
    } else {
      console.log('✅ Store version is up to date');
    }

  } catch (error) {
    console.error('❌ Store migration failed:', error);
  }
};

// Store reset utilities (for testing or troubleshooting)
export const resetAllStores = async () => {
  console.warn('🔄 Resetting all stores...');

  try {
    // Clear AsyncStorage
    const keys = [
      '7ftrends-session-storage',
      '7ftrends-feed-storage',
      '7ftrends-competition-storage',
      '7ftrends-wardrobe-storage',
      'store-version',
    ];

    for (const key of keys) {
      await AsyncStorage.removeItem(key);
    }

    // Reset store states (this will also clear persisted data)
    useSessionStore.setState({
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      lastActivity: Date.now(),
    });

    useFeedStore.setState({
      posts: [],
      loading: false,
      refreshing: false,
      loadingMore: false,
      error: null,
      analytics: null,
      offlineMode: false,
      cachedPosts: [],
    });

    useCompetitionStore.setState({
      competitions: [],
      userEntries: [],
      leaderboard: [],
      userVotes: new Map(),
      currentCompetition: null,
      loading: false,
      error: null,
    });

    useWardrobeStore.setState({
      wardrobeItems: [],
      outfits: [],
      outfitSuggestions: [],
      arSessions: [],
      currentARSession: null,
      loading: false,
      error: null,
      stats: null,
    });

    console.log('✅ All stores reset successfully');

  } catch (error) {
    console.error('❌ Error resetting stores:', error);
  }
};

// Export all stores as default for convenience
export default {
  // Session store
  useSessionStore,
  useAuth,
  useUserPreferences,
  useAuthActions,

  // Feed store
  useFeedStore,
  useFeed,
  useFeedActions,
  useFeedFilters,
  useFeedPagination,

  // Competition store
  useCompetitionStore,
  useCompetitions,
  useCurrentCompetition,
  useCompetitionActions,
  useCompetitionSubmission,
  useCompetitionVoting,

  // Wardrobe store
  useWardrobeStore,
  useWardrobe,
  useOutfits,
  useAR,
  useWardrobeActions,
  useOutfitActions,
  useARActions,
  useWardrobeFilters,

  // Utilities
  useAppStore,
  initializeStores,
  cleanupStores,
  getStoreHealth,
  debugStores,
  measureStorePerformance,
  migrateStores,
  resetAllStores,
};