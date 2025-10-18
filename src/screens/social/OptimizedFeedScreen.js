// Optimized Feed Screen
// Features: Cursor-based pagination, FlatList optimization, pull-to-refresh, infinite scroll

import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Animated,
  InteractionManager,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  Filter,
  TrendingUp,
  Users,
  Award,
  ChevronDown,
  X,
} from 'lucide-react-native';

import OptimizedPostCard from '../../components/feed/OptimizedPostCard';
import { useFeed, useFeedActions, useFeedFilters } from '../../store/feed';
import { useAuth } from '../../store/sessionStore';

// Optimized item dimensions
const ITEM_HEIGHT = 400; // Estimated item height for FlatList optimization
const LIST_HEADER_HEIGHT = 60;
const LIST_FOOTER_HEIGHT = 80;

const OptimizedFeedScreen = ({ navigation }) => {
  const flatListRef = useRef(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [renderedItems, setRenderedItems] = useState(0);

  // Store hooks
  const { user } = useAuth();
  const { posts, loading, refreshing, loadingMore, error, offlineMode } = useFeed();
  const { fetchFeed, fetchMorePosts, refreshFeed, likePost, unlikePost } = useFeedActions();
  const { filters, setFilters, clearFilters } = useFeedFilters();

  // Filter options
  const filterOptions = useMemo(() => [
    { key: 'all', label: 'All Posts', icon: Filter },
    { key: 'friends', label: 'Friends', icon: Users },
    { key: 'trending', label: 'Trending', icon: TrendingUp },
    { key: 'competitions', label: 'Competitions', icon: Award },
  ]), []);

  // Get current filter display
  const currentFilter = useMemo(() => {
    return filterOptions.find(option => option.key === filters.feedType) || filterOptions[0];
  }, [filters.feedType, filterOptions]);

  // Optimized refresh handler
  const handleRefresh = useCallback(async () => {
    try {
      await refreshFeed();
    } catch (error) {
      console.error('Refresh error:', error);
    }
  }, [refreshFeed]);

  // Optimized load more handler
  const handleLoadMore = useCallback(() => {
    if (!loadingMore && posts.length > 0) {
      InteractionManager.runAfterInteractions(() => {
        fetchMorePosts();
      });
    }
  }, [loadingMore, posts.length, fetchMorePosts]);

  // Filter change handler
  const handleFilterChange = useCallback((filterKey) => {
    setFilters({ feedType: filterKey });
    setIsFilterMenuOpen(false);
    // Trigger feed refresh with new filter
    InteractionManager.runAfterInteractions(() => {
      refreshFeed();
    });
  }, [setFilters, refreshFeed]);

  // Optimized interaction handlers
  const handleLikePost = useCallback(async (postId) => {
    try {
      // Optimistic update is handled in the store
      const post = posts.find(p => p.id === postId);
      if (post?.is_liked) {
        await unlikePost(postId);
      } else {
        await likePost(postId);
      }
    } catch (error) {
      console.error('Like post error:', error);
    }
  }, [posts, likePost, unlikePost]);

  const handleCommentPost = useCallback((postId) => {
    navigation.navigate('PostDetail', { postId });
  }, [navigation]);

  const handleSharePost = useCallback(async (postId) => {
    const post = posts.find(p => p.id === postId);
    if (post) {
      try {
        // Share functionality is handled in the post card
        console.log('Sharing post:', postId);
      } catch (error) {
        console.error('Share error:', error);
      }
    }
  }, [posts]);

  const handleSavePost = useCallback(async (postId) => {
    try {
      // Save post functionality
      console.log('Saving post:', postId);
    } catch (error) {
      console.error('Save error:', error);
    }
  }, []);

  const handlePostPress = useCallback((post) => {
    navigation.navigate('PostDetail', { postId: post.id });
  }, [navigation]);

  // Memoized key extractor for FlatList optimization
  const keyExtractor = useCallback((item) => item.id, []);

  // Memoized render item for FlatList
  const renderItem = useCallback(({ item, index }) => {
    return (
      <OptimizedPostCard
        post={item}
        onLike={handleLikePost}
        onComment={handleCommentPost}
        onShare={handleSharePost}
        onSave={handleSavePost}
        onPress={handlePostPress}
      />
    );
  }, [handleLikePost, handleCommentPost, handleSharePost, handleSavePost, handlePostPress]);

  // Memoized list header
  const ListHeaderComponent = useMemo(() => (
    <View style={styles.listHeader}>
      <View style={styles.headerContent}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Feed</Text>
          {offlineMode && (
            <View style={styles.offlineIndicator}>
              <Text style={styles.offlineText}>Offline Mode</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setIsFilterMenuOpen(true)}
        >
          <currentFilter.icon size={16} color="#4ECDC4" />
          <Text style={styles.filterText}>{currentFilter.label}</Text>
          <ChevronDown size={16} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Filter Menu Overlay */}
      {isFilterMenuOpen && (
        <View style={styles.filterOverlay}>
          <TouchableOpacity
            style={styles.filterOverlayBackdrop}
            activeOpacity={1}
            onPress={() => setIsFilterMenuOpen(false)}
          />
          <View style={styles.filterMenu}>
            <View style={styles.filterMenuHeader}>
              <Text style={styles.filterMenuTitle}>Filter Feed</Text>
              <TouchableOpacity onPress={() => setIsFilterMenuOpen(false)}>
                <X size={20} color="#666" />
              </TouchableOpacity>
            </View>
            {filterOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.filterOption,
                  filters.feedType === option.key && styles.selectedFilterOption,
                ]}
                onPress={() => handleFilterChange(option.key)}
              >
                <option.icon
                  size={16}
                  color={filters.feedType === option.key ? '#4ECDC4' : '#666'}
                />
                <Text style={[
                  styles.filterOptionText,
                  filters.feedType === option.key && styles.selectedFilterOptionText,
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  ), [currentFilter, offlineMode, isFilterMenuOpen, filters.feedType, filterOptions, handleFilterChange]);

  // Memoized list footer
  const ListFooterComponent = useMemo(() => (
    <View style={styles.listFooter}>
      {loadingMore && (
        <View style={styles.loadingMoreContainer}>
          <ActivityIndicator size="small" color="#4ECDC4" />
          <Text style={styles.loadingMoreText}>Loading more posts...</Text>
        </View>
      )}
      {!loadingMore && posts.length > 0 && (
        <Text style={styles.endOfFeedText}>You're all caught up!</Text>
      )}
    </View>
  ), [loadingMore, posts.length]);

  // Memoized empty state
  const ListEmptyComponent = useMemo(() => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4ECDC4" />
          <Text style={styles.loadingText}>Loading feed...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Something went wrong</Text>
          <Text style={styles.errorSubtext}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No posts yet</Text>
        <Text style={styles.emptySubtext}>
          {filters.feedType === 'all'
            ? 'Start following people to see their posts here'
            : `No ${currentFilter.label.toLowerCase()} posts found`}
        </Text>
      </View>
    );
  }, [loading, error, filters.feedType, currentFilter.label, handleRefresh]);

  // Optimized getItemLayout for FlatList
  const getItemLayout = useCallback((data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  }), []);

  // Optimized onEndReached threshold
  const onEndReachedThreshold = 0.5;

  // Focus effect to refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (posts.length === 0 && !loading) {
        InteractionManager.runAfterInteractions(() => {
          fetchFeed();
        });
      }
    }, [posts.length, loading, fetchFeed])
  );

  // Initial data fetch
  useEffect(() => {
    if (user && posts.length === 0 && !loading) {
      InteractionManager.runAfterInteractions(() => {
        fetchFeed();
      });
    }
  }, [user, posts.length, loading, fetchFeed]);

  // Header animation
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.8],
    extrapolate: 'clamp',
  });

  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [LIST_HEADER_HEIGHT, LIST_HEADER_HEIGHT * 0.8],
    extrapolate: 'clamp',
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <Animated.FlatList
        ref={flatListRef}
        data={posts}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={onEndReachedThreshold}
        ListHeaderComponent={ListHeaderComponent}
        ListFooterComponent={ListFooterComponent}
        ListEmptyComponent={ListEmptyComponent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#4ECDC4"
            colors={['#4ECDC4']}
          />
        }
        // Performance optimizations
        windowSize={7} // Render 7 items off-screen (3 above, 1 below, 3 above current)
        initialNumToRender={5} // Render 5 items initially
        maxToRenderPerBatch={3} // Render 3 items per batch
        updateCellsBatchingPeriod={100} // Update cells every 100ms
        removeClippedSubviews={true} // Remove clipped views for memory
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  listContent: {
    flexGrow: 1,
  },
  listHeader: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    height: LIST_HEADER_HEIGHT,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginRight: 12,
  },
  offlineIndicator: {
    backgroundColor: '#fff3cd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  offlineText: {
    fontSize: 12,
    color: '#856404',
    fontWeight: '600',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f8f8f8',
    borderRadius: 20,
    gap: 6,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4ECDC4',
  },
  filterOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
  },
  filterOverlayBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  filterMenu: {
    position: 'absolute',
    top: LIST_HEADER_HEIGHT + 8,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 200,
  },
  filterMenuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterMenuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  selectedFilterOption: {
    backgroundColor: '#f0fdf4',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#666',
  },
  selectedFilterOptionText: {
    color: '#4ECDC4',
    fontWeight: '600',
  },
  listFooter: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingMoreText: {
    fontSize: 14,
    color: '#666',
  },
  endOfFeedText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 40,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#4ECDC4',
    borderRadius: 20,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default OptimizedFeedScreen;