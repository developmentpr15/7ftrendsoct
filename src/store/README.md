# 🗄️ 7Ftrends State Management Architecture

## 📋 Overview

This directory contains the complete modular Zustand state management system for the 7Ftrends fashion app. The architecture is designed to be scalable, maintainable, and provide excellent offline support.

## 🏗️ Store Architecture

### **Modular Stores**

1. **`sessionStore.ts`** - Authentication and user profile management
2. **`feedStore.ts`** - Posts, pagination, and real-time feed logic
3. **`competitionStore.ts`** - Competitions, entries, voting, and leaderboards
4. **`wardrobeStore.ts`** - Wardrobe items, outfits, and AR session state
5. **`index.ts`** - Store composition and utilities

### **Key Features**

- ✅ **Modular Architecture** - Separated concerns for maintainability
- ✅ **TypeScript Support** - Full type safety throughout
- ✅ **Persistence** - Automatic AsyncStorage persistence
- ✅ **Offline Support** - Graceful offline mode with sync
- ✅ **Real-time Updates** - Optimistic updates and sync
- ✅ **Performance Optimized** - Efficient re-renders with selectors
- ✅ **Error Handling** - Comprehensive error management
- ✅ **Migration Support** - Future-proof schema migrations

## 📦 Installation

Make sure you have these dependencies installed:

```bash
npm install zustand @react-native-async-storage/async-storage
```

## 🚀 Quick Start

### Basic Usage

```typescript
import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import {
  useAuth,
  useFeed,
  useFeedActions,
  initializeStores
} from '../store';

export const HomeScreen = () => {
  const { user, isAuthenticated } = useAuth();
  const { posts, loading, error } = useFeed();
  const { fetchFeed, likePost } = useFeedActions();

  useEffect(() => {
    // Initialize stores on app start
    initializeStores();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchFeed(true);
    }
  }, [isAuthenticated]);

  const handleLikePost = async (postId: string) => {
    await likePost(postId);
  };

  return (
    <View>
      {user && <Text>Welcome, {user.username}!</Text>}
      {loading && <Text>Loading feed...</Text>}
      {error && <Text>Error: {error}</Text>}
      {posts.map(post => (
        <PostCard
          key={post.id}
          post={post}
          onLike={() => handleLikePost(post.id)}
        />
      ))}
    </View>
  );
};
```

### Auth Example

```typescript
import { useAuth, useAuthActions } from '../store';

const LoginScreen = () => {
  const { isAuthenticated, error } = useAuth();
  const { signIn, signUp } = useAuthActions();

  const handleLogin = async () => {
    const result = await signIn(email, password);
    if (!result.success) {
      Alert.alert('Login Failed', result.error);
    }
  };

  const handleSignup = async () => {
    const result = await signUp(email, password, {
      username: 'newuser',
      full_name: 'New User',
    });
    if (!result.success) {
      Alert.alert('Signup Failed', result.error);
    }
  };

  return (
    // Your login UI
  );
};
```

### Competition Example

```typescript
import {
  useCompetitions,
  useCurrentCompetition,
  useCompetitionActions
} from '../store';

const CompetitionScreen = ({ competitionId }) => {
  const { competitions, loading } = useCompetitions();
  const { currentCompetition, userEntries } = useCurrentCompetition();
  const { joinCompetition, submitEntry, voteForEntry } = useCompetitionActions();

  useEffect(() => {
    if (competitionId) {
      // Fetch specific competition
      fetchCompetition(competitionId);
    }
  }, [competitionId]);

  const handleJoin = async () => {
    const result = await joinCompetition(competitionId);
    if (result.success) {
      Alert.alert('Success', 'Joined competition!');
    }
  };

  return (
    // Your competition UI
  );
};
```

### Wardrobe Example

```typescript
import {
  useWardrobe,
  useWardrobeActions,
  useARActions
} from '../store';

const WardrobeScreen = () => {
  const { items, loading, stats } = useWardrobe();
  const { addItem, uploadImage } = useWardrobeActions();
  const { createARSession, addCapture } = useARActions();

  const handleAddItem = async (itemData) => {
    const result = await addItem(itemData);
    if (result.success) {
      Alert.alert('Success', 'Item added to wardrobe!');
      if (result.itemId && itemData.imageUri) {
        await uploadImage(result.itemId, itemData.imageUri);
      }
    }
  };

  const handleStartAR = async () => {
    const result = await createARSession({
      session_type: 'try_on',
      items: selectedItems,
    });
    if (result.success) {
      navigation.navigate('ARCamera', { sessionId: result.sessionId });
    }
  };

  return (
    // Your wardrobe UI
  );
};
```

## 🔧 Advanced Usage

### Custom Selectors

```typescript
// Create custom hooks for specific state combinations
export const useUserProfile = () => {
  const user = useSessionStore((state) => state.user);
  const wardrobeItems = useWardrobeStore((state) => state.wardrobeItems);
  const userEntries = useCompetitionStore((state) => state.userEntries);

  return {
    username: user?.username,
    avatarUrl: user?.avatar_url,
    bio: user?.bio,
    totalItems: wardrobeItems.length,
    favoriteItems: wardrobeItems.filter(item => item.is_favorite).length,
    activeCompetitions: userEntries.filter(entry =>
      ['submitted', 'approved'].includes(entry.status)
    ).length,
  };
};

export const useFeedStats = () => {
  const posts = useFeedStore((state) => state.posts);
  const analytics = useFeedStore((state) => state.analytics);

  return {
    totalPosts: posts.length,
    mutualFriendPosts: posts.filter(p => p.feed_type === 'mutual_friend').length,
    trendingPosts: posts.filter(p => p.feed_type === 'trending').length,
    averageEngagement: analytics?.average_engagement || 0,
    topPerformingPosts: analytics?.top_performing_posts || [],
  };
};
```

### Store Subscriptions

```typescript
import { useFeedStore } from '../store';

const FeedListener = () => {
  const subscribeToFeedChanges = useFeedStore.subscribe(
    (state) => state.posts,
    (posts, previousPosts) => {
      // Handle new posts
      const newPosts = posts.filter(p =>
        !previousPosts.some(pp => pp.id === p.id)
      );

      if (newPosts.length > 0) {
        console.log(`Received ${newPosts.length} new posts`);
        // Show notification, update badge, etc.
      }
    }
  );

  useEffect(() => {
    subscribeToFeedChanges();

    return () => {
      subscribeToFeedChanges();
    };
  }, []);
};
```

### Offline Support

```typescript
import { useFeedStore } from '../store';

const OfflineSync = () => {
  const { offlineMode, syncOfflineChanges } = useFeedStore();

  useEffect(() => {
    const handleOnline = () => {
      if (offlineMode) {
        syncOfflineChanges();
      }
    };

    const handleOffline = () => {
      console.log('App is offline, using cached data');
    };

    // Listen to network status
    NetInfo.addEventListener('change', (state) => {
      state.isConnected ? handleOnline() : handleOffline();
    });

    return () => {
      NetInfo.removeEventListener('change');
    };
  }, [offlineMode]);
};
```

## 📊 Store Debugging

### Debug All Stores

```typescript
import { debugStores } from '../store';

const DevTools = () => {
  return (
    <View>
      <Button
        title="Debug Stores"
        onPress={() => debugStores()}
      />
    </View>
  );
};
```

### Store Health Monitoring

```typescript
import { getStoreHealth } from '../store';

const HealthCheck = () => {
  const health = getStoreHealth();

  return (
    <View>
      <Text>Session: {health.session.isAuthenticated ? '✅' : '❌'}</Text>
      <Text>Feed: {health.feed.hasPosts ? '✅' : '❌'}</Text>
      <Text>Competitions: {health.competitions.hasCompetitions ? '✅' : '❌'}</Text>
      <Text>Wardrobe: {health.wardrobe.hasItems ? '✅' : '❌'}</Text>
    </View>
  );
};
```

## 🔒 Persistence and Security

### What's Persisted

```typescript
// Session Store
- User profile data
- Authentication state
- User preferences
- Last activity timestamp

// Feed Store
- First 50 posts (cache)
- Filter preferences
- Last fetch time

// Competition Store
- Recent 10 user entries
- User votes
- Filter preferences

// Wardrobe Store
- First 50 wardrobe items
- First 20 outfits
- Filter preferences
- Statistics
```

### Sensitive Data (Not Persisted)

```typescript
- Session tokens
- Full post lists (cached separately)
- Temporary loading states
- Error messages
- Real-time data
```

## 🚨 Error Handling

### Global Error Handler

```typescript
import { useSessionStore, useFeedStore, useCompetitionStore, useWardrobeStore } from '../store';

const ErrorHandler = () => {
  const { error: authError } = useSessionStore();
  const { error: feedError } = useFeedStore();
  const { error: competitionError } = useCompetitionStore();
  const { error: wardrobeError } = useWardrobeStore();

  const errors = [authError, feedError, competitionError, wardrobeError].filter(Boolean);

  useEffect(() => {
    if (errors.length > 0) {
      console.error('Store errors:', errors);
      // Send to error reporting service
      Crashlytics.recordError(new Error(errors.join(', ')));
    }
  }, [errors]);

  return null; // This component doesn't render anything
};
```

## 🔄 Migration

### Store Migration

```typescript
import { migrateStores, resetAllStores } from '../store';

// In your App.js or main entry point
const App = () => {
  useEffect(() => {
    // Run migrations on app start
    migrateStores();
  }, []);

  const handleReset = () => {
    Alert.alert(
      'Reset Stores',
      'This will clear all local data. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: resetAllStores
        },
      ]
    );
  };

  // Rest of your app
};
```

## 📈 Performance Tips

### Use Selectors Effectively

```typescript
// ❌ Bad - Creates new object every render
const badExample = () => {
  const feedState = useFeedStore();
  return (
    <View>
      <Text>{feedState.posts.length} posts</Text>
      <Text>{feedState.loading ? 'Loading...' : 'Ready'}</Text>
    </View>
  );
};

// ✅ Good - Selects only needed data
const goodExample = () => {
  const postsCount = useFeedStore((state) => state.posts.length);
  const isLoading = useFeedStore((state) => state.loading);

  return (
    <View>
      <Text>{postsCount} posts</Text>
      <Text>{isLoading ? 'Loading...' : 'Ready'}</Text>
    </View>
  );
};
```

### Batch Updates

```typescript
// Use batch updates for related state changes
const updateMultipleStates = () => {
  // This will trigger only one re-render
  useSessionStore.setState({
    user: updatedUser,
    lastActivity: Date.now()
  });

  // Instead of separate calls
  // useSessionStore.setState({ user: updatedUser });
  // useSessionStore.setState({ lastActivity: Date.now() });
};
```

## 🎯 Best Practices

1. **Use Custom Hooks** - Create custom hooks for complex state combinations
2. **Implement Optimistic Updates** - Update UI immediately, sync in background
3. **Handle Loading States** - Show appropriate loading indicators
4. **Provide Error Feedback** - Display user-friendly error messages
5. **Implement Offline Support** - Cache data and sync when online
6. **Use TypeScript** - Ensure type safety throughout
7. **Monitor Performance** - Use React DevTools Profiler
8. **Test Store Logic** - Unit test store actions and selectors

## 📚 API Reference

### Session Store

```typescript
// State
interface AuthState {
  user: User | null;
  session: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  lastActivity: number;
}

// Actions
signIn(email: string, password: string) => Promise<{ success: boolean; error?: string }>;
signUp(email: string, password: string, userData: Partial<User>) => Promise<{ success: boolean; error?: string }>;
signOut() => Promise<void>;
updateProfile(updates: Partial<User>) => Promise<{ success: boolean; error?: string }>;
updatePreferences(preferences: Partial<UserPreferences>) => Promise<{ success: boolean; error?: string }>;
uploadAvatar(imageUri: string) => Promise<{ success: boolean; url?: string; error?: string }>;
refreshSession() => Promise<void>;
checkAuthStatus() => Promise<void>;
```

### Feed Store

```typescript
// State
interface FeedState {
  posts: Post[];
  loading: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  error: string | null;
  analytics: FeedAnalytics | null;
  pagination: PaginationState;
  filters: FeedFilter;
  offlineMode: boolean;
}

// Actions
fetchFeed(refresh?: boolean) => Promise<void>;
fetchMorePosts() => Promise<void>;
refreshFeed() => Promise<void>;
likePost(postId: string) => Promise<void>;
unlikePost(postId: string) => Promise<void>;
sharePost(postId: string, platform: string) => Promise<void>;
savePost(postId: string) => Promise<void>;
reportPost(postId: string, reason: string) => Promise<void>;
searchPosts(query: string) => Promise<Post[]>;
```

### Competition Store

```typescript
// State
interface CompetitionState {
  competitions: Competition[];
  userEntries: CompetitionEntry[];
  leaderboard: LeaderboardEntry[];
  userVotes: Map<string, CompetitionVote>;
  currentCompetition: Competition | null;
  loading: boolean;
  submitting: boolean;
  voting: boolean;
  error: string | null;
}

// Actions
fetchCompetitions(refresh?: boolean) => Promise<void>;
fetchCompetition(competitionId: string) => Promise<void>;
joinCompetition(competitionId: string) => Promise<{ success: boolean; error?: string }>;
submitEntry(competitionId: string, entryData: Partial<CompetitionEntry>) => Promise<{ success: boolean; entryId?: string; error?: string }>;
voteForEntry(entryId: string, score: number, criteriaScores?: any) => Promise<{ success: boolean; error?: string }>;
fetchLeaderboard(competitionId: string) => Promise<void>;
```

### Wardrobe Store

```typescript
// State
interface WardrobeState {
  wardrobeItems: WardrobeItem[];
  outfits: Outfit[];
  outfitSuggestions: OutfitSuggestion[];
  arSessions: ARSession[];
  currentARSession: ARSession | null;
  loading: boolean;
  uploading: boolean;
  saving: boolean;
  error: string | null;
  stats: WardrobeStats | null;
}

// Actions
fetchWardrobeItems(refresh?: boolean) => Promise<void>;
addWardrobeItem(itemData: Partial<WardrobeItem>) => Promise<{ success: boolean; itemId?: string; error?: string }>;
updateWardrobeItem(itemId: string, updates: Partial<WardrobeItem>) => Promise<{ success: boolean; error?: string }>;
createOutfit(outfitData: Partial<Outfit>) => Promise<{ success: boolean; outfitId?: string; error?: string }>;
createARSession(sessionData: Partial<ARSession>) => Promise<{ success: boolean; sessionId?: string; error?: string }>;
generateOutfitIdeas(filters: any) => Promise<Outfit[]>;
```

## 🔗 Integration

The stores are designed to work together seamlessly. For example:

```typescript
// Cross-store interaction example
const CompetitionEntryScreen = ({ competitionId }) => {
  const { user } = useAuth();
  const { submitEntry } = useCompetitionActions();
  const { items, addItem } = useWardrobeActions();

  const handleSubmitEntry = async (entryData) => {
    // Check if user has required wardrobe items
    const requiredItems = ['top', 'bottom'];
    const hasRequiredItems = requiredItems.every(category =>
      items.some(item => item.category === category)
    );

    if (!hasRequiredItems) {
      Alert.alert('Missing Items', 'Please add required wardrobe items first');
      return;
    }

    // Submit the competition entry
    const result = await submitEntry(competitionId, {
      ...entryData,
      items: items.filter(item => entryData.items.includes(item.id)).map(item => item.id),
    });

    if (result.success) {
      navigation.navigate('CompetitionSuccess');
    }
  };

  return (
    // Component JSX
  );
};
```

This modular state management system provides a solid foundation for the 7Ftrends app with excellent scalability, performance, and developer experience. 🚀