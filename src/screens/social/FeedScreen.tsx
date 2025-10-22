/**
 * 7Ftrends FeedScreen
 * Advanced feed algorithm: 67% friends posts, 33% trending posts
 * Real-time updates with Supabase Realtime
 * Caching with Zustand store
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

// Import luxury theme constants
import { COLORS, SIZES, FONTS, COMPONENT_STYLES, StyleHelpers } from '@/utils/constants';

// Import Supabase and real-time functionality
import { supabase } from '@/utils/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

// Import stores and hooks
import { useFeedStore } from '@/store/feedStore';
import { useSessionStore } from '@/store/sessionStore';

// Import components
import { PostCard } from '@/components/feed/PostCard';
import { ShimmerLoader, PostSkeletonLoader, CompactSkeletonLoader } from '@/components/feed/ShimmerLoader';
import { RealtimeConnectionStatus } from '@/components/ui/RealtimeConnectionStatus';

// Types
interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url?: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  created_at: string;
  updated_at: string;
  users: {
    id: string;
    username: string;
    full_name?: string;
    avatar_url?: string;
  };
  is_liked?: boolean;
  is_bookmarked?: boolean;
  trending_score?: number;
}

interface FeedItem {
  type: 'friend_post' | 'trending_post';
  post: Post;
  score: number;
}

// Constants
const { width: screenWidth } = Dimensions.get('window');
const POSTS_PER_PAGE = 10;
const FRIEND_POSTS_RATIO = 0.67; // 67%
const TRENDING_POSTS_RATIO = 0.33; // 33%
const TRENDING_TIME_WINDOW_HOURS = 24; // Trending posts from last 24 hours

export const FeedScreen: React.FC = () => {
  // Store state
  const {
    posts,
    loading,
    error,
    pagination,
    refreshing,
    lastFetchTime,
    setPosts,
    setLoading,
    setError,
    setRefreshing,
    appendPosts,
    prependPosts,
    updatePost,
    deletePost,
    setHasMore,
  } = useFeedStore();

  const hasMore = pagination?.hasMore || false;

  const { user, isAuthenticated } = useSessionStore();

  // Local state
  const [realtimeChannel, setRealtimeChannel] = useState<RealtimeChannel | null>(null);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [friendPostIds, setFriendPostIds] = useState<Set<string>>(new Set());
  const [trendingPostIds, setTrendingPostIds] = useState<Set<string>>(new Set());
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [page, setPage] = useState(1);

  // ===== FEED ALGORITHM =====

  /**
   * Calculate trending score for posts
   * Formula: (likes * 2 + comments * 1.5 + shares) / time_decay
   */
  const calculateTrendingScore = useCallback((post: Post): number => {
    const now = new Date();
    const createdAt = new Date(post.created_at);
    const hoursAgo = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

    // Time decay factor (newer posts get higher scores)
    const timeDecay = Math.max(1, TRENDING_TIME_WINDOW_HOURS - hoursAgo) / TRENDING_TIME_WINDOW_HOURS;

    // Engagement score
    const engagementScore = (post.likes_count * 2) +
                           (post.comments_count * 1.5) +
                           (post.shares_count * 1);

    return engagementScore * timeDecay;
  }, []);

  /**
   * Fetch friends posts (67% of feed)
   */
  const fetchFriendsPosts = useCallback(async (limit: number = 10): Promise<Post[]> => {
    if (!isAuthenticated || !user) {
      return [];
    }

    try {
      // Get users that current user follows
      const { data: following, error: followingError } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);

      if (followingError) throw followingError;

      if (!following || following.length === 0) {
        console.log('User follows no one, returning empty friends posts');
        return [];
      }

      const followingIds = following.map(f => f.following_id);

      // Fetch posts from followed users
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select(`
          *,
          users!posts_user_id_fkey (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .in('user_id', followingIds)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (postsError) throw postsError;

      // Check if current user liked these posts
      if (posts && posts.length > 0) {
        const postIds = posts.map(p => p.id);
        const { data: likes } = await supabase
          .from('likes')
          .select('post_id')
          .eq('user_id', user.id)
          .in('post_id', postIds);

        const likedPostIds = new Set(likes?.map(l => l.post_id) || []);

        // Add is_liked flag
        const postsWithLikes = posts.map(post => ({
          ...post,
          is_liked: likedPostIds.has(post.id),
        }));

        return postsWithLikes;
      }

      return posts || [];
    } catch (error) {
      console.error('Error fetching friends posts:', error);
      throw error;
    }
  }, [isAuthenticated, user]);

  /**
   * Fetch trending posts (33% of feed)
   */
  const fetchTrendingPosts = useCallback(async (limit: number = 5): Promise<Post[]> => {
    try {
      // Calculate time threshold for trending posts
      const timeThreshold = new Date();
      timeThreshold.setHours(timeThreshold.getHours() - TRENDING_TIME_WINDOW_HOURS);

      // Fetch posts from the last 24 hours with engagement metrics
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select(`
          *,
          users!posts_user_id_fkey (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .gte('created_at', timeThreshold.toISOString())
        .order('likes_count', { ascending: false })
        .order('comments_count', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit * 2); // Fetch more to calculate trending scores

      if (postsError) throw postsError;

      if (!posts || posts.length === 0) {
        return [];
      }

      // Calculate trending scores and sort
      const postsWithScores = posts.map(post => ({
        ...post,
        trending_score: calculateTrendingScore(post),
      }));

      // Sort by trending score and take top posts
      const trendingPosts = postsWithScores
        .sort((a, b) => (b.trending_score || 0) - (a.trending_score || 0))
        .slice(0, limit);

      // Check if current user liked these posts (if authenticated)
      if (isAuthenticated && user && trendingPosts.length > 0) {
        const postIds = trendingPosts.map(p => p.id);
        const { data: likes } = await supabase
          .from('likes')
          .select('post_id')
          .eq('user_id', user.id)
          .in('post_id', postIds);

        const likedPostIds = new Set(likes?.map(l => l.post_id) || []);

        // Add is_liked flag
        return trendingPosts.map(post => ({
          ...post,
          is_liked: likedPostIds.has(post.id),
        }));
      }

      return trendingPosts;
    } catch (error) {
      console.error('Error fetching trending posts:', error);
      throw error;
    }
  }, [calculateTrendingScore, isAuthenticated, user]);

  /**
   * Mix friends and trending posts according to algorithm
   */
  const mixFeedPosts = useCallback(async (page: number = 1): Promise<Post[]> => {
    try {
      const totalPosts = POSTS_PER_PAGE;
      const friendPostsCount = Math.floor(totalPosts * FRIEND_POSTS_RATIO);
      const trendingPostsCount = totalPosts - friendPostsCount;

      console.log(`Fetching feed: ${friendPostsCount} friend posts, ${trendingPostsCount} trending posts`);

      // Fetch posts in parallel
      const [friendsPosts, trendingPosts] = await Promise.all([
        fetchFriendsPosts(friendPostsCount),
        fetchTrendingPosts(trendingPostsCount),
      ]);

      // Combine and mix posts
      const allPosts: Post[] = [];

      // Alternate between friend and trending posts
      const maxPosts = Math.max(friendsPosts.length, trendingPosts.length);
      for (let i = 0; i < maxPosts; i++) {
        if (i < friendsPosts.length) {
          allPosts.push({
            ...friendsPosts[i],
            // Add metadata for tracking
            _sourceType: 'friend' as const,
          });
        }
        if (i < trendingPosts.length) {
          allPosts.push({
            ...trendingPosts[i],
            // Add metadata for tracking
            _sourceType: 'trending' as const,
          });
        }
      }

      // Update tracking sets
      const newFriendIds = new Set(friendsPosts.map(p => p.id));
      const newTrendingIds = new Set(trendingPosts.map(p => p.id));
      setFriendPostIds(prev => new Set([...prev, ...newFriendIds]));
      setTrendingPostIds(prev => new Set([...prev, ...newTrendingIds]));

      console.log(`Mixed feed: ${allPosts.length} total posts (${friendsPosts.length} friends, ${trendingPosts.length} trending)`);

      return allPosts;
    } catch (error) {
      console.error('Error mixing feed posts:', error);
      throw error;
    }
  }, [fetchFriendsPosts, fetchTrendingPosts]);

  // ===== DATA FETCHING =====

  /**
   * Fetch initial feed data
   */
  const fetchFeed = useCallback(async (refresh: boolean = false, resetPage: boolean = true) => {
    if (!isAuthenticated) {
      setLoading(false);
      setIsInitialLoading(false);
      return;
    }

    try {
      setError(null);

      if (resetPage) {
        setPage(1);
        setPosts([]);
        setHasMore(true);
      }

      if (refresh) {
        setRefreshing(true);
      } else {
        setIsInitialLoading(true);
      }

      const currentPage = resetPage ? 1 : page;
      const posts = await mixFeedPosts(currentPage);

      if (resetPage || refresh) {
        setPosts(posts);
      } else {
        appendPosts(posts);
      }

      // Update pagination state
      if (posts.length < POSTS_PER_PAGE) {
        setHasMore(false);
      }

      if (!refresh) {
        setPage(prev => prev + 1);
      }

      console.log(`Feed loaded: ${posts.length} posts, page ${currentPage}`);
    } catch (error) {
      console.error('Error fetching feed:', error);
      setError('Failed to load feed. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setIsInitialLoading(false);
      setIsLoadingMore(false);
    }
  }, [isAuthenticated, page, mixFeedPosts, setLoading, setError, setPosts, setRefreshing, appendPosts, setHasMore]);

  /**
   * Load more posts (pagination)
   */
  const loadMorePosts = useCallback(async () => {
    if (isLoadingMore || !hasMore || !isAuthenticated || loading) return;

    try {
      setIsLoadingMore(true);
      const nextPage = page;
      const newPosts = await mixFeedPosts(nextPage);

      if (newPosts.length > 0) {
        appendPosts(newPosts);
        setPage(prev => prev + 1);
      } else {
        // No more posts available
        setHasMore(false);
      }

      console.log(`Loaded more posts: ${newPosts.length} posts, page ${nextPage}`);
    } catch (error) {
      console.error('Error loading more posts:', error);
      setError('Failed to load more posts.');
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, isAuthenticated, loading, page, mixFeedPosts, appendPosts, setHasMore]);

  /**
   * Refresh feed
   */
  const onRefresh = useCallback(() => {
    fetchFeed(true, true);
  }, [fetchFeed]);

  // ===== REALTIME SETUP =====

  /**
   * Setup Supabase Realtime subscriptions
   */
  const setupRealtimeSubscriptions = useCallback(() => {
    if (!isAuthenticated || !user) return;

    console.log('Setting up realtime subscriptions for feed...');

    // Subscribe to posts table
    const postsChannel = supabase
      .channel('feed_posts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'posts',
          filter: `user_id=eq.${user.id}`, // User's own posts
        },
        (payload) => {
          console.log('Realtime post update:', payload);
          handleRealtimePostUpdate(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'likes',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Realtime like update:', payload);
          handleRealtimeLikeUpdate(payload);
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
        setRealtimeConnected(status === 'SUBSCRIBED');
      });

    setRealtimeChannel(postsChannel);

    return () => {
      console.log('Cleaning up realtime subscriptions...');
      supabase.removeChannel(postsChannel);
    };
  }, [isAuthenticated, user]);

  /**
   * Handle realtime post updates
   */
  const handleRealtimePostUpdate = useCallback((payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    switch (eventType) {
      case 'INSERT':
        // New post from user - add to top of feed
        if (newRecord.user_id === user?.id) {
          prependPosts([newRecord]);
        }
        break;

      case 'UPDATE':
        // Post updated - update in feed
        updatePost(newRecord.id, newRecord);
        break;

      case 'DELETE':
        // Post deleted - remove from feed
        deletePost(oldRecord.id);
        break;
    }
  }, [user?.id, prependPosts, updatePost, deletePost]);

  /**
   * Handle realtime like updates
   */
  const handleRealtimeLikeUpdate = useCallback((payload: any) => {
    const { eventType, new: newRecord } = payload;

    if (eventType === 'INSERT') {
      // User liked a post - update the post's like status
      updatePost(newRecord.post_id, {
        is_liked: true,
        likes_count: (posts.find(p => p.id === newRecord.post_id)?.likes_count || 0) + 1,
      });
    } else if (eventType === 'DELETE') {
      // User unliked a post - update the post's like status
      const post = posts.find(p => p.id === newRecord.post_id);
      if (post) {
        updatePost(newRecord.post_id, {
          is_liked: false,
          likes_count: Math.max(0, post.likes_count - 1),
        });
      }
    }
  }, [posts, updatePost]);

  // ===== LIFECYCLE =====

  // Initial load
  useEffect(() => {
    if (isAuthenticated) {
      fetchFeed();
    }
  }, [isAuthenticated, fetchFeed]);

  // Setup realtime when screen focused
  useFocusEffect(
    useCallback(() => {
      const cleanup = setupRealtimeSubscriptions();
      return cleanup;
    }, [setupRealtimeSubscriptions])
  );

  // ===== INTERACTION HANDLERS =====

  /**
   * Handle post like/unlike
   */
  const handleLike = useCallback(async (postId: string, currentIsLiked: boolean) => {
    if (!isAuthenticated || !user) {
      Alert.alert('Sign In Required', 'Please sign in to like posts');
      return;
    }

    try {
      if (currentIsLiked) {
        // Unlike
        await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        updatePost(postId, {
          is_liked: false,
          likes_count: Math.max(0, (posts.find(p => p.id === postId)?.likes_count || 0) - 1),
        });
      } else {
        // Like
        await supabase
          .from('likes')
          .insert({
            post_id: postId,
            user_id: user.id,
          });

        updatePost(postId, {
          is_liked: true,
          likes_count: (posts.find(p => p.id === postId)?.likes_count || 0) + 1,
        });
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      Alert.alert('Error', 'Failed to update like. Please try again.');
    }
  }, [isAuthenticated, user, posts, updatePost]);

  /**
   * Handle post share
   */
  const handleShare = useCallback(async (postId: string) => {
    try {
      // Implement share functionality
      console.log('Share post:', postId);
      Alert.alert('Share', 'Share functionality coming soon!');
    } catch (error) {
      console.error('Error sharing post:', error);
      Alert.alert('Error', 'Failed to share post. Please try again.');
    }
  }, []);

  // ===== RENDER HELPERS =====

  /**
   * Render post item
   */
  const renderPost = useCallback(({ item, index }: { item: Post; index: number }) => {
    const isFromFriend = friendPostIds.has(item.id);
    const isTrending = trendingPostIds.has(item.id);

    return (
      <PostCard
        post={item}
        onLike={() => handleLike(item.id, !!item.is_liked)}
        onShare={() => handleShare(item.id)}
        showSourceBadge={true}
        sourceBadge={isFromFriend ? 'Friend' : isTrending ? 'Trending' : undefined}
        sourceBadgeColor={isFromFriend ? COLORS.primary : COLORS.accent}
      />
    );
  }, [friendPostIds, trendingPostIds, handleLike, handleShare]);

  /**
   * Render loading skeleton
   */
  const renderSkeleton = useCallback(() => <ShimmerLoader count={3} />, []);

  /**
   * Render list header
   */
  const renderListHeader = useCallback(() => {
    if (!realtimeConnected) {
      return (
        <View style={styles.connectionWarning}>
          <Text style={styles.connectionWarningText}>
            Connecting to live updates...
          </Text>
        </View>
      );
    }
    return null;
  }, [realtimeConnected]);

  /**
   * Render list footer
   */
  const renderListFooter = useCallback(() => {
    if (isLoadingMore) {
      return <CompactSkeletonLoader />;
    }

    if (!hasMore && posts.length > 0) {
      return (
        <View style={styles.endOfFeedContainer}>
          <Text style={styles.endOfFeedText}>You've seen all posts</Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={onRefresh}
          >
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return null;
  }, [isLoadingMore, hasMore, posts.length, onRefresh]);

  /**
   * Render empty state
   */
  const renderEmptyState = useCallback(() => {
    if (isInitialLoading) {
      return <ShimmerLoader count={3} />;
    }

    if (!isAuthenticated) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>Welcome to 7Ftrends</Text>
          <Text style={styles.emptyStateText}>
            Sign in to see your personalized fashion feed
          </Text>
        </View>
      );
    }

    if (!loading && posts.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>No Posts Yet</Text>
          <Text style={styles.emptyStateText}>
            Follow more people to see their posts in your feed
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={onRefresh}
          >
            <Text style={styles.retryButtonText}>Refresh Feed</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return null;
  }, [isInitialLoading, isAuthenticated, loading, posts.length, onRefresh]);

  // ===== MEMOIZED VALUES =====

  const refreshControl = useMemo(() => (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      colors={[COLORS.primary]}
      tintColor={COLORS.primary}
    />
  ), [refreshing, onRefresh]);

  const keyExtractor = useCallback((item: Post) => item.id, []);

  // ===== MAIN RENDER =====

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={[COMPONENT_STYLES.button.primary, styles.retryButton]}
          onPress={() => fetchFeed()}
        >
          <Text style={COMPONENT_STYLES.text.accent.primary}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Connection Status */}
      <RealtimeConnectionStatus isConnected={realtimeConnected} />

      {/* Feed List */}
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={keyExtractor}
        refreshControl={refreshControl}
        ListHeaderComponent={renderListHeader}
        ListFooterComponent={renderListFooter}
        ListEmptyComponent={renderEmptyState}
        onEndReached={loadMorePosts}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        initialNumToRender={3}
        maxToRenderPerBatch={5}
        windowSize={7}
        removeClippedSubviews={true}
        updateCellsBatchingPeriod={50}
        getItemLayout={(data, index) => ({
          length: 500, // Approximate item height including margins
          offset: 500 * index,
          index,
        })}
        refreshControl={{
          colors: [COLORS.primary],
          tintColor: COLORS.primary,
          progressBackgroundColor: COLORS.surface,
        }}
      />
    </View>
  );
};

// ===== STYLES =====
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContainer: {
    paddingVertical: SIZES.sm,
  },
  connectionWarning: {
    backgroundColor: COLORS.warning + '20',
    paddingVertical: SIZES.xs,
    paddingHorizontal: SIZES.md,
    marginHorizontal: SIZES.md,
    marginBottom: SIZES.sm,
    borderRadius: SIZES.radius.sm,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.warning,
  },
  connectionWarningText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.warning,
    textAlign: 'center',
    fontFamily: FONTS.families.primary,
  },
  loadingFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SIZES.lg,
    gap: SIZES.sm,
  },
  loadingText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    fontFamily: FONTS.families.primary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SIZES.xl,
    paddingVertical: SIZES.xxxl,
  },
  emptyStateTitle: {
    fontSize: FONTS.sizes.xl,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SIZES.md,
  },
  emptyStateText: {
    fontSize: FONTS.sizes.base,
    fontFamily: FONTS.families.primary,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: FONTS.lineHeight.relaxed,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SIZES.xl,
  },
  errorText: {
    fontSize: FONTS.sizes.base,
    fontFamily: FONTS.families.primary,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: SIZES.lg,
  },
  retryButton: {
    paddingHorizontal: SIZES.xl,
    paddingVertical: SIZES.md,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius.md,
    marginTop: SIZES.md,
  },
  retryButtonText: {
    color: COLORS.textOnPrimary,
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.medium,
    textAlign: 'center',
  },
  endOfFeedContainer: {
    alignItems: 'center',
    paddingVertical: SIZES.xl,
    paddingHorizontal: SIZES.lg,
  },
  endOfFeedText: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.families.primary,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SIZES.md,
  },
  refreshButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radius.md,
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.sm,
  },
  refreshButtonText: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.medium,
    color: COLORS.primary,
  },
});

export default FeedScreen;