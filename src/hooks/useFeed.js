import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import feedService from '../services/feedService';

// Custom hook for intelligent feed management
export const useFeed = (options = {}) => {
  const {
    limit = 20,
    refreshInterval = 60000, // 1 minute refresh
    autoRefresh = true,
    preload = true
  } = options;

  const user = useAuthStore((state) => state.user);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState(null);

  const offsetRef = useRef(0);
  const refreshTimeoutRef = useRef(null);

  
  // Fetch posts from feed service
  const fetchPosts = useCallback(async (loadMore = false, refresh = false) => {
    if (!user?.id) {
      console.log('No user ID available for feed fetch');
      return;
    }

    try {
      if (loadMore) {
        setLoadingMore(true);
      } else if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
        setError(null);
      }

      const currentOffset = refresh ? 0 : offsetRef.current;

      console.log(`Fetching feed - Load more: ${loadMore}, Refresh: ${refresh}, Offset: ${currentOffset}`);

      const feedData = await feedService.getUserFeed(user.id, {
        limit: loadMore ? limit : limit,
        offset: currentOffset,
        refresh
      });

      // Update posts state
      if (refresh || !loadMore) {
        setPosts(feedData);
        offsetRef.current = feedData.length;
      } else {
        setPosts(prev => [...prev, ...feedData]);
        offsetRef.current += feedData.length;
      }

      // Check if there are more posts
      setHasMore(feedData.length === limit);

      // Update analytics
      const feedAnalytics = feedService.getFeedAnalytics(feedData);
      setAnalytics(feedAnalytics);

      console.log('Feed loaded successfully:', {
        totalPosts: feedData.length,
        mutual_friends: feedAnalytics.mutual_friends_posts,
        following: feedAnalytics.following_posts,
        own: feedAnalytics.own_posts,
        trending: feedAnalytics.trending_posts,
        competitions: feedAnalytics.competition_posts,
        hasMore: feedData.length === limit
      });

    } catch (err) {
      console.error('Error fetching feed:', err);
      setError(err.message || 'Failed to load feed');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [user?.id, limit]);

  // Initial load
  useEffect(() => {
    if (user?.id) {
      if (preload) {
        // Preload feed data for better UX
        feedService.preloadFeed(user.id);
      }
      fetchPosts(false, true); // Initial refresh
    }
  }, [user?.id, fetchPosts, preload]);

  // Auto-refresh setup
  useEffect(() => {
    if (autoRefresh && user?.id && refreshInterval > 0) {
      refreshTimeoutRef.current = setInterval(() => {
        fetchPosts(false, true); // Refresh without clearing current posts
      }, refreshInterval);

      return () => {
        if (refreshTimeoutRef.current) {
          clearInterval(refreshTimeoutRef.current);
        }
      };
    }
  }, [autoRefresh, user?.id, refreshInterval, fetchPosts]);

  // Pull to refresh
  const onRefresh = useCallback(() => {
    offsetRef.current = 0;
    return fetchPosts(false, true);
  }, [fetchPosts]);

  // Load more posts
  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore && !loading) {
      fetchPosts(true, false);
    }
  }, [loadingMore, hasMore, loading, fetchPosts]);

  // Like post
  const likePost = useCallback(async (postId) => {
    if (!user?.id) return;

    try {
      // Update local state optimistically
      setPosts(prev => Array.isArray(prev) ? prev.map(post =>
        post.id === postId
          ? { ...post, is_liked: true, likes_count: post.likes_count + 1 }
          : post
      ) : []);

      // Call service
      await feedService.likePost(user.id, postId);

      console.log('Post liked successfully:', postId);
    } catch (error) {
      // Revert on error
      setPosts(prev => Array.isArray(prev) ? prev.map(post =>
        post.id === postId
          ? { ...post, is_liked: false, likes_count: post.likes_count - 1 }
          : post
      ) : []);
      console.error('Error liking post:', error);
    }
  }, [user?.id]);

  // Unlike post
  const unlikePost = useCallback(async (postId) => {
    if (!user?.id) return;

    try {
      // Update local state optimistically
      setPosts(prev => Array.isArray(prev) ? prev.map(post =>
        post.id === postId
          ? { ...post, is_liked: false, likes_count: Math.max(0, post.likes_count - 1) }
          : post
      ) : []);

      // Call service
      await feedService.unlikePost(user.id, postId);

      console.log('Post unliked successfully:', postId);
    } catch (error) {
      // Revert on error
      setPosts(prev => Array.isArray(prev) ? prev.map(post =>
        post.id === postId
          ? { ...post, is_liked: true, likes_count: post.likes_count + 1 }
          : post
      ));
      console.error('Error unliking post:', error);
    }
  }, [user?.id]);

  // Vote for competition entry
  const voteForEntry = useCallback(async (postId, score = 5) => {
    if (!user?.id) return;

    try {
      // Update local state optimistically
      setPosts(prev => Array.isArray(prev) ? prev.map(post =>
        post.id === postId && post.feed_type === 'competition'
          ? { ...post, is_liked: true, likes_count: post.likes_count + 1 }
          : post
      ));

      // Call service
      await feedService.voteForEntry(user.id, postId, score);

      console.log('Vote submitted successfully:', postId);
    } catch (error) {
      // Revert on error
      setPosts(prev => Array.isArray(prev) ? prev.map(post =>
        post.id === postId
          ? { ...post, is_liked: false, likes_count: Math.max(0, post.likes_count - 1) }
          : post
      ));
      console.error('Error voting for entry:', error);
    }
  }, [user?.id]);

  // Report post
  const reportPost = useCallback(async (postId, reason) => {
    if (!user?.id) return;

    try {
      await feedService.reportPost(user.id, postId, reason);

      // Remove post from local state
      setPosts(prev => Array.isArray(prev) ? prev.filter(post => post.id !== postId) : []);

      console.log('Post reported successfully:', postId);
      return { success: true };
    } catch (error) {
      console.error('Error reporting post:', error);
      return { success: false, error: error.message };
    }
  }, [user?.id]);

  // Clear cache and refresh
  const clearCacheAndRefresh = useCallback(() => {
    if (user?.id) {
      feedService.clearUserCache(user.id);
      return fetchPosts(false, true);
    }
  }, [user?.id, fetchPosts]);

  return {
    // Data
    posts,
    analytics,

    // Loading states
    loading,
    refreshing,
    loadingMore,
    hasMore,
    error,

    // Actions
    fetchPosts,
    onRefresh,
    loadMore,
    likePost,
    unlikePost,
    voteForEntry,
    reportPost,
    clearCacheAndRefresh,

    // Computed values
    isEmpty: !loading && posts.length === 0,
    hasError: !!error && posts.length === 0,
    feedComposition: analytics ? {
      mutual_friends: analytics.mutual_friends_posts,
      following: analytics.following_posts,
      own: analytics.own_posts,
      trending: analytics.trending_posts,
      competitions: analytics.competition_posts,
      total: analytics.total_posts
    } : null
  };
};

// Hook for user recommendations
export const useRecommendations = (userId, limit = 10) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRecommendations = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const data = await feedService.getUserRecommendations(userId, limit);
      setRecommendations(data);
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError(err.message || 'Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  }, [userId, limit]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  return {
    recommendations,
    loading,
    error,
    refetch: fetchRecommendations
  };
};

// Hook for feed real-time updates
export const useFeedRealtime = (userId) => {
  const [realtimePosts, setRealtimePosts] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!userId) return;

    // Setup real-time subscription
    const subscription = supabase
      .channel('feed-updates')
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts',
          filter: `author_id=eq.${userId}` // Only for user's own posts initially
        },
        (payload) => {
          console.log('New post received:', payload);
          // Handle new posts (could be added to top of feed)
          setRealtimePosts(prev => [payload.new, ...prev.slice(0, 9)]);
        }
      )
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'posts'
        },
        (payload) => {
          console.log('Post updated:', payload);
          // Handle post updates (likes, comments, etc.)
          // This would update the feed state
        }
      )
      .subscribe((status) => {
        setConnected(status === 'SUBSCRIBED');
      });

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  return {
    realtimePosts,
    connected
  };
};

export default useFeed;