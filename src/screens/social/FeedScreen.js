import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  Alert,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../../utils/supabase';
import { useAuthStore } from '../../store/authStore';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../utils/constants';
import PostCard from '../../components/feed/PostCard';
import SkeletonLoader from '../../components/feed/SkeletonLoader';

const POSTS_PER_PAGE = 10;

const FeedScreen = () => {
  const { user } = useAuthStore();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [likedPosts, setLikedPosts] = useState(new Set());

  // Fetch posts from Supabase
  const fetchPosts = useCallback(async (page = 0, append = false) => {
    try {
      if (!append) {
        setLoading(true);
        setError(null);
      }

      const from = page * POSTS_PER_PAGE;
      const to = from + POSTS_PER_PAGE - 1;

      // Fetch posts with author information - simplified query
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          *,
          users!posts_author_id_fkey(
            id,
            username,
            avatar_url,
            full_name
          )
        `)
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .range(from, to);

      console.log('Supabase query result:', postsData, postsError);

      let finalPostsData = postsData;

      // If the simplified query fails, try the old way
      if (postsError || !postsData) {
        console.log('Trying alternative query...');
        const { data: altData, error: altError } = await supabase
          .from('posts')
          .select('*')
          .eq('visibility', 'public')
          .order('created_at', { ascending: false })
          .range(from, to);

        if (altError) {
          console.error('Alternative query failed:', altError);
          throw altError;
        }

        // Manually fetch author data for each post
        const postsWithAuthors = [];
        for (const post of altData || []) {
          const { data: authorData } = await supabase
            .from('users')
            .select('id, username, avatar_url, full_name')
            .eq('id', post.author_id)
            .single();

          postsWithAuthors.push({
            ...post,
            author: authorData || {
              id: post.author_id,
              username: 'Anonymous',
              avatar_url: null,
              full_name: null,
            }
          });
        }

        console.log('Posts with manually fetched authors:', postsWithAuthors);
        finalPostsData = postsWithAuthors;
      } else {
        // Rename users field to author for consistency
        finalPostsData = postsData.map(post => ({
          ...post,
          author: post.users,
        }));
      }

      if (postsError) {
        console.error('Error fetching posts:', postsError);
        throw postsError;
      }

      console.log('Posts data from Supabase:', JSON.stringify(finalPostsData, null, 2));
      console.log('First post structure:', finalPostsData[0] ? JSON.stringify(finalPostsData[0], null, 2) : 'No posts');

      // If no data from Supabase, use mock data for testing
      if (!finalPostsData || finalPostsData.length === 0) {
        console.log('No posts from Supabase, using mock data');
        const mockPosts = [
          {
            id: 'mock-1',
            content: 'Check out my new outfit! #Fashion #Style',
            images: ['https://picsum.photos/seed/mock1/400/400'],
            created_at: new Date().toISOString(),
            likes_count: 42,
            comments_count: 8,
            author: {
              id: 'user-1',
              username: 'fashionista',
              avatar_url: null,
              full_name: 'Fashion Lover',
            },
            is_liked: false,
            latest_comments: [
              {
                id: 'comment-1',
                content: 'Love this outfit!',
                author: { username: 'styleguru' },
              },
            ],
          },
          {
            id: 'mock-2',
            content: 'Summer vibes ☀️ #SummerFashion',
            images: ['https://picsum.photos/seed/mock2/400/400'],
            created_at: new Date(Date.now() - 3600000).toISOString(),
            likes_count: 28,
            comments_count: 3,
            author: {
              id: 'user-2',
              username: 'trendsetter',
              avatar_url: null,
              full_name: 'Trend Setter',
            },
            is_liked: true,
            latest_comments: [],
          },
        ];

        setPosts(mockPosts);
        setHasMore(false);
        return;
      }

      // Transform the data to match our component's expected format
      const transformedPosts = finalPostsData.map(post => {
        console.log('Processing post:', post.id, 'author:', post.author);

        // Ensure author object exists with all required fields
        const safeAuthor = {
          id: post.author?.id || post.author_id || 'unknown',
          username: post.author?.username || 'Anonymous',
          avatar_url: post.author?.avatar_url || null,
          full_name: post.author?.full_name || null,
        };

        console.log('Safe author:', safeAuthor);

        return {
          ...post,
          author: safeAuthor,
          images: Array.isArray(post.images) ? post.images : [],
          is_liked: post.likes?.some(like => like.user_id === user?.id) || false,
          likes_count: post.likes_count || post.likes?.length || 0,
          comments_count: post.comments_count || 0,
          latest_comments: Array.isArray(post.comments) ? post.comments.slice(0, 2) : [],
        };
      });

      // Update liked posts set
      const newLikedPosts = new Set(likedPosts);
      transformedPosts.forEach(post => {
        if (post.is_liked) {
          newLikedPosts.add(post.id);
        } else {
          newLikedPosts.delete(post.id);
        }
      });
      setLikedPosts(newLikedPosts);

      if (append) {
        setPosts(prev => [...prev, ...transformedPosts]);
      } else {
        setPosts(transformedPosts);
      }

      // Check if there are more posts to load
      setHasMore(transformedPosts.length === POSTS_PER_PAGE);

    } catch (err) {
      console.error('Error in fetchPosts:', err);
      setError(err.message || 'Failed to load posts');
      Alert.alert('Error', err.message || 'Failed to load posts');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [user?.id, likedPosts]);

  // Handle like action
  const handleLike = async (postId) => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to like posts');
      return;
    }

    try {
      const isLiked = likedPosts.has(postId);

      if (isLiked) {
        // Unlike the post
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (error) throw error;

        // Update local state
        setLikedPosts(prev => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
        setPosts(prev => prev.map(post =>
          post.id === postId
            ? { ...post, is_liked: false, likes_count: Math.max(0, post.likes_count - 1) }
            : post
        ));
      } else {
        // Like the post
        const { error } = await supabase
          .from('likes')
          .insert({ post_id: postId, user_id: user.id });

        if (error) throw error;

        // Update local state
        setLikedPosts(prev => new Set([...prev, postId]));
        setPosts(prev => prev.map(post =>
          post.id === postId
            ? { ...post, is_liked: true, likes_count: post.likes_count + 1 }
            : post
        ));
      }
    } catch (err) {
      console.error('Error toggling like:', err);
      Alert.alert('Error', 'Failed to update like status');
    }
  };

  // Handle comment action
  const handleComment = (postId) => {
    // For now, just show a placeholder
    Alert.alert('Comments', 'Comments feature coming soon!');
  };

  // Pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPosts(0, false);
  }, [fetchPosts]);

  // Load more posts
  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore && !loading) {
      setLoadingMore(true);
      const nextPage = Math.floor(posts.length / POSTS_PER_PAGE);
      fetchPosts(nextPage, true);
    }
  }, [loadingMore, hasMore, loading, posts.length, fetchPosts]);

  // Initial load
  useEffect(() => {
    fetchPosts(0, false);
  }, [fetchPosts]);

  // Render post item
  const renderPost = useCallback(({ item }) => {
    console.log('renderPost called with:', item);

    // Additional safety check
    if (!item) {
      console.warn('renderPost received undefined item');
      return null;
    }

    if (!item.id) {
      console.warn('renderPost received item without id:', item);
      return null;
    }

    // Don't require author here since PostCard handles it
    console.log('Rendering post:', item.id, 'author exists:', !!item.author);

    return (
      <PostCard
        post={item}
        onLike={handleLike}
        onComment={handleComment}
        currentUserId={user?.id}
        isLoading={likedPosts.has(item.id) && likedPosts.size > 0}
      />
    );
  }, [handleLike, handleComment, user?.id, likedPosts]);

  // Render loading footer
  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={COLORS.accent} />
        <Text style={styles.footerText}>Loading more posts...</Text>
      </View>
    );
  };

  // Render empty state
  const renderEmptyState = () => {
    if (loading) return <SkeletonLoader count={3} />;

    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>No Posts Yet</Text>
        <Text style={styles.emptyMessage}>
          Be the first to share your fashion journey!
        </Text>
      </View>
    );
  };

  // Render error state
  if (error && posts.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorState}>
          <Text style={styles.errorTitle}>Oops!</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchPosts(0, false)}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Feed</Text>
      </View>

      <FlatList
        data={posts.filter(post => post && post.id)}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.feedContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.accent}
            colors={[COLORS.accent]}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmptyState}
        initialNumToRender={3}
        maxToRenderPerBatch={5}
        windowSize={10}
        getItemLayout={(data, index) => ({
          length: 500, // Approximate item height
          offset: 500 * index,
          index,
        })}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.surface,
    paddingVertical: SIZES.md,
    paddingHorizontal: SIZES.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    ...SHADOWS.sm,
  },
  headerTitle: {
    fontSize: FONTS.sizes.xl,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    textAlign: 'center',
  },
  feedContainer: {
    flexGrow: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.lg,
  },
  footerText: {
    marginLeft: SIZES.sm,
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.xxl,
  },
  emptyTitle: {
    fontSize: FONTS.sizes.xl,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginBottom: SIZES.sm,
  },
  emptyMessage: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.lg,
  },
  errorTitle: {
    fontSize: FONTS.sizes.xl,
    fontFamily: FONTS.bold,
    color: COLORS.error,
    marginBottom: SIZES.sm,
  },
  errorMessage: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SIZES.lg,
  },
  retryButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.sm,
  },
  retryButtonText: {
    color: COLORS.surface,
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.medium,
  },
});

export default FeedScreen;