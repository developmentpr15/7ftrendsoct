import { create } from 'zustand';
import { persist, createJSONStorage, subscribeWithSelector } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../utils/supabase';
import { useSessionStore } from './sessionStore';

// Types
export interface Post {
  id: string;
  author_id: string;
  author: {
    id: string;
    username: string;
    avatar_url?: string;
    full_name?: string;
  };
  content: string;
  images: string[];
  created_at: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  is_liked: boolean;
  feed_type: 'mutual_friend' | 'following' | 'own' | 'trending' | 'competition' | 'fallback';
  relationship_type: string;
  friendship_boost: number;
  trending_score: number;
  competition?: {
    id: string;
    title: string;
  };
  metadata: {
    engagement_rate: number;
    time_ago: string;
    is_trending: boolean;
    is_mutual_friend: boolean;
    is_following: boolean;
    is_own_post: boolean;
    is_discover: boolean;
    is_competition_entry: boolean;
  };
}

export interface FeedAnalytics {
  total_posts: number;
  mutual_friends_posts: number;
  following_posts: number;
  own_posts: number;
  trending_posts: number;
  competition_posts: number;
  average_engagement: number;
  top_performing_posts: Post[];
}

export interface PaginationState {
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  cursor: string | null;
  nextCursor: string | null;
  hasMore: boolean;
}

export interface FeedFilter {
  feedType?: 'all' | 'friends' | 'trending' | 'competitions';
  timeRange?: 'today' | 'week' | 'month' | 'all';
  hasImages?: boolean;
  contentType?: 'posts' | 'competitions' | 'all';
}

interface FeedStore {
  // State
  posts: Post[];
  loading: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  error: string | null;
  analytics: FeedAnalytics | null;
  pagination: PaginationState;
  filters: FeedFilter;
  lastFetchTime: number;
  offlineMode: boolean;
  cachedPosts: Post[];

  // Feed Composition
  feedComposition: {
    mutual_friends: number;
    following: number;
    own: number;
    trending: number;
    competitions: number;
    total: number;
  } | null;

  // Actions
  fetchFeed: (refresh?: boolean) => Promise<void>;
  fetchMorePosts: () => Promise<void>;
  refreshFeed: () => Promise<void>;
  likePost: (postId: string) => Promise<void>;
  unlikePost: (postId: string) => Promise<void>;
  reportPost: (postId: string, reason: string) => Promise<void>;
  sharePost: (postId: string, platform: string) => Promise<void>;
  savePost: (postId: string) => Promise<void>;

  // Filter and Search
  setFilters: (filters: Partial<FeedFilter>) => void;
  clearFilters: () => void;
  searchPosts: (query: string) => Promise<Post[]>;

  // Pagination
  setPagination: (pagination: Partial<PaginationState>) => void;
  resetPagination: () => void;

  // Offline Support
  syncOfflineChanges: () => Promise<void>;
  clearCache: () => void;
  addToOfflineQueue: (action: string, data: any) => void;

  // Utility
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

// Storage configuration for persistence
const storageConfig = {
  name: '7ftrends-feed-storage',
  storage: createJSONStorage(() => AsyncStorage),
  partialize: (state: FeedStore) => ({
    cachedPosts: state.posts.slice(0, 50), // Cache first 50 posts
    filters: state.filters,
    lastFetchTime: state.lastFetchTime,
  }),
};

export const useFeedStore = create<FeedStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Initial State
        posts: [],
        loading: false,
        refreshing: false,
        loadingMore: false,
        error: null,
        analytics: null,
        pagination: {
          currentPage: 1,
          hasNextPage: true,
          hasPreviousPage: false,
          totalPages: 1,
          totalItems: 0,
          itemsPerPage: 10, // Optimized for mobile
          cursor: null,
          nextCursor: null,
          hasMore: true,
        },
        filters: {
          feedType: 'all',
          timeRange: 'all',
          contentType: 'all',
        },
        lastFetchTime: 0,
        offlineMode: false,
        cachedPosts: [],
        feedComposition: null,

        // Core Actions
        fetchFeed: async (refresh = false) => {
          const state = get();
          const user = useSessionStore.getState().user;

          if (!user) {
            set({ error: 'Not authenticated', loading: false });
            return;
          }

          try {
            if (refresh) {
              set({ refreshing: true, error: null });
            } else {
              set({ loading: true, error: null });
            }

            // Check network connectivity
            const isOnline = navigator.onLine;
            if (!isOnline && state.cachedPosts.length > 0) {
              set({
                posts: state.cachedPosts,
                offlineMode: true,
                loading: false,
                refreshing: false
              });
              return;
            }

            const limit = state.pagination.itemsPerPage;
            const cursor = refresh ? null : state.pagination.cursor;

            // Prepare filters for RPC
            const filters = {
              country: state.filters.feedType === 'regional' ? user.country : undefined,
              style: undefined, // Can be added later
              time_range: state.filters.timeRange === 'all' ? undefined : state.filters.timeRange,
            };

            // Call new cursor-based pagination RPC function
            const { data, error } = await supabase.rpc('get_paginated_feed', {
              p_user_id: user.id,
              p_cursor: cursor,
              p_limit: limit,
              p_feed_type: state.filters.feedType || 'all',
              p_filters: filters,
            });

            if (error) {
              console.error('Feed fetch error:', error);

              // Try fallback feed
              const fallbackData = await getFallbackFeed(user.id, limit, 0);
              set({
                posts: fallbackData,
                offlineMode: true,
                loading: false,
                refreshing: false
              });
              return;
            }

            if (data && data.length > 0) {
              // Transform data
              const transformedPosts = data.map(transformPostData);

              // Update posts state
              if (refresh) {
                set({ posts: transformedPosts });
              } else {
                set({ posts: [...state.posts, ...transformedPosts] });
              }

              // Cache posts (keep most recent 100)
              const updatedCache = refresh
                ? transformedPosts
                : [...state.cachedPosts, ...transformedPosts].slice(0, 100);

              set({
                cachedPosts: updatedCache,
                lastFetchTime: Date.now(),
                offlineMode: false,
              });

              // Calculate analytics
              const analytics = calculateFeedAnalytics(refresh ? transformedPosts : [...state.posts, ...transformedPosts]);
              set({ analytics });

              // Update cursor-based pagination
              const lastPost = data[data.length - 1];
              const newCursor = lastPost?.created_at;
              const hasMore = data.length === limit;

              set({
                pagination: {
                  ...state.pagination,
                  cursor: refresh ? newCursor : state.pagination.cursor,
                  nextCursor: newCursor,
                  hasMore,
                  currentPage: refresh ? 1 : state.pagination.currentPage + 1,
                  totalItems: refresh ? transformedPosts.length : state.pagination.totalItems + transformedPosts.length,
                },
              });
            } else if (data && data.length === 0) {
              // No more posts
              set({
                pagination: {
                  ...state.pagination,
                  hasMore: false,
                  nextCursor: null,
                },
              });
            }

          } catch (error: any) {
            console.error('Feed fetch error:', error);
            set({
              error: error.message,
              loading: false,
              refreshing: false,
              offlineMode: true
            });
          } finally {
            set({ loading: false, refreshing: false });
          }
        },

        fetchMorePosts: async () => {
          const state = get();
          if (state.loadingMore || !state.pagination.hasMore) return;

          try {
            set({ loadingMore: true });

            await state.fetchFeed(false);

          } catch (error: any) {
            console.error('Load more posts error:', error);
            set({ error: error.message });
          } finally {
            set({ loadingMore: false });
          }
        },

        refreshFeed: async () => {
          const state = get();
          set({
            posts: [],
            pagination: { ...state.pagination, currentPage: 1 }
          });
          await state.fetchFeed(true);
        },

        // Interaction Actions
        likePost: async (postId: string) => {
          const state = get();
          const user = useSessionStore.getState().user;

          if (!user) return;

          try {
            // Optimistic update
            set({
              posts: state.posts.map(post =>
                post.id === postId
                  ? {
                      ...post,
                      is_liked: true,
                      likes_count: post.likes_count + 1
                    }
                  : post
              ),
            });

            // API call
            const { error } = await supabase
              .from('likes')
              .insert({
                user_id: user.id,
                post_id: postId,
              });

            if (error) {
              // Revert on error
              set({
                posts: state.posts.map(post =>
                  post.id === postId
                    ? {
                        ...post,
                        is_liked: false,
                        likes_count: post.likes_count - 1
                      }
                    : post
                ),
              });

              // Add to offline queue if network error
              if (error.message.includes('network')) {
                get().addToOfflineQueue('like_post', { postId });
              }
            }

          } catch (error: any) {
            console.error('Like post error:', error);
            // Revert optimistic update
            set({
              posts: state.posts.map(post =>
                post.id === postId
                  ? {
                      ...post,
                      is_liked: false,
                      likes_count: post.likes_count - 1
                    }
                  : post
              ),
            });
          }
        },

        unlikePost: async (postId: string) => {
          const state = get();
          const user = useSessionStore.getState().user;

          if (!user) return;

          try {
            // Optimistic update
            set({
              posts: state.posts.map(post =>
                post.id === postId
                  ? {
                      ...post,
                      is_liked: false,
                      likes_count: Math.max(0, post.likes_count - 1)
                    }
                  : post
              ),
            });

            // API call
            const { error } = await supabase
              .from('likes')
              .delete()
              .eq('user_id', user.id)
              .eq('post_id', postId);

            if (error) {
              // Revert on error
              set({
                posts: state.posts.map(post =>
                  post.id === postId
                    ? {
                        ...post,
                        is_liked: true,
                        likes_count: post.likes_count + 1
                      }
                    : post
                ),
              });
            }

          } catch (error: any) {
            console.error('Unlike post error:', error);
            // Revert optimistic update
            set({
              posts: state.posts.map(post =>
                post.id === postId
                  ? {
                      ...post,
                      is_liked: true,
                      likes_count: post.likes_count + 1
                    }
                  : post
              ),
            });
          }
        },

        reportPost: async (postId: string, reason: string) => {
          const state = get();
          const user = useSessionStore.getState().user;

          if (!user) return;

          try {
            const { error } = await supabase
              .from('reports')
              .insert({
                reporter_id: user.id,
                post_id: postId,
                reason,
              });

            if (error) {
              set({ error: error.message });
              return;
            }

            // Remove post from feed
            set({
              posts: state.posts.filter(post => post.id !== postId),
            });

          } catch (error: any) {
            set({ error: error.message });
          }
        },

        sharePost: async (postId: string, platform: string) => {
          const state = get();

          try {
            // Optimistic update
            set({
              posts: state.posts.map(post =>
                post.id === postId
                  ? { ...post, shares_count: post.shares_count + 1 }
                  : post
              ),
            });

            // Track share in database
            const { error } = await supabase
              .from('shares')
              .insert({
                post_id: postId,
                platform,
                user_id: useSessionStore.getState().user?.id,
              });

            if (error) {
              // Revert on error
              set({
                posts: state.posts.map(post =>
                  post.id === postId
                    ? { ...post, shares_count: post.shares_count - 1 }
                    : post
                ),
              });
            }

          } catch (error: any) {
            console.error('Share post error:', error);
          }
        },

        savePost: async (postId: string) => {
          const user = useSessionStore.getState().user;

          if (!user) return;

          try {
            const { error } = await supabase
              .from('post_saves')
              .insert({
                user_id: user.id,
                post_id: postId,
              });

            if (error) {
              console.error('Save post error:', error);
            }

          } catch (error: any) {
            console.error('Save post error:', error);
          }
        },

        // Filter and Search
        setFilters: (filters: Partial<FeedFilter>) => {
          set({ filters: { ...get().filters, ...filters } });
        },

        clearFilters: () => {
          set({
            filters: {
              feedType: 'all',
              timeRange: 'all',
              contentType: 'all',
            },
          });
        },

        searchPosts: async (query: string) => {
          const user = useSessionStore.getState().user;

          if (!user || !query.trim()) return [];

          try {
            const { data, error } = await supabase
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
              .or(`content.ilike.%${query}%,users.username.ilike.%${query}%`)
              .eq('visibility', 'public')
              .order('created_at', { ascending: false })
              .limit(20);

            if (error) throw error;

            return data.map(transformPostData);

          } catch (error: any) {
            console.error('Search posts error:', error);
            return [];
          }
        },

        // Pagination
        setPagination: (pagination: Partial<PaginationState>) => {
          set({
            pagination: { ...get().pagination, ...pagination },
          });
        },

        resetPagination: () => {
          set({
            pagination: {
              currentPage: 1,
              hasNextPage: true,
              hasPreviousPage: false,
              totalPages: 1,
              totalItems: 0,
              itemsPerPage: 20,
            },
          });
        },

        // Offline Support
        syncOfflineChanges: async () => {
          // Implementation for syncing offline changes when back online
          try {
            const offlineActions = await AsyncStorage.getItem('offline-actions');
            if (offlineActions) {
              const actions = JSON.parse(offlineActions);

              for (const action of actions) {
                // Replay each action
                switch (action.type) {
                  case 'like_post':
                    await get().likePost(action.data.postId);
                    break;
                  case 'unlike_post':
                    await get().unlikePost(action.data.postId);
                    break;
                  // Add other action types as needed
                }
              }

              // Clear offline actions
              await AsyncStorage.removeItem('offline-actions');
            }
          } catch (error) {
            console.error('Sync offline changes error:', error);
          }
        },

        clearCache: () => {
          set({
            cachedPosts: [],
            lastFetchTime: 0,
          });
        },

        addToOfflineQueue: async (action: string, data: any) => {
          try {
            const existingActions = await AsyncStorage.getItem('offline-actions');
            const actions = existingActions ? JSON.parse(existingActions) : [];

            actions.push({ type: action, data, timestamp: Date.now() });

            await AsyncStorage.setItem('offline-actions', JSON.stringify(actions));
          } catch (error) {
            console.error('Add to offline queue error:', error);
          }
        },

        // Utility
        clearError: () => set({ error: null }),
        setLoading: (loading: boolean) => set({ loading }),
      }),
      storageConfig
    )
  )
);

// Helper functions
function transformPostData(data: any): Post {
  return {
    id: data.id || data.post_id,
    author_id: data.user_id || data.author_id,
    author: {
      id: data.user_id || data.author_id,
      username: data.username || data.author_username || 'Anonymous',
      avatar_url: data.avatar_url || data.author_avatar_url,
      full_name: data.full_name || data.author_full_name,
    },
    content: data.content || '',
    images: data.image_url ? [data.image_url] : (Array.isArray(data.images) ? data.images : []),
    created_at: data.created_at,
    likes_count: data.likes_count || 0,
    comments_count: data.comments_count || 0,
    shares_count: data.shares_count || 0,
    is_liked: data.is_liked || false,
    feed_type: data.feed_type || 'general',
    relationship_type: data.relationship_status || 'other',
    friendship_boost: data.relationship_status === 'friend' ? 1.5 : 1.0,
    trending_score: calculateEngagementRate(data),
    competition: data.competition_id ? {
      id: data.competition_id,
      title: data.competition_title || 'Competition',
    } : undefined,
    metadata: {
      engagement_rate: calculateEngagementRate(data),
      time_ago: getTimeAgo(data.created_at),
      is_trending: data.feed_type === 'trending',
      is_mutual_friend: data.relationship_status === 'friend',
      is_following: data.relationship_status === 'following',
      is_own_post: data.user_id === useSessionStore.getState().user?.id,
      is_discover: data.feed_type === 'trending',
      is_competition_entry: data.feed_type === 'competition',
    },
  };
}

function calculateEngagementRate(post: any): number {
  const totalEngagement = (post.likes_count || 0) + (post.comments_count || 0) + (post.shares_count || 0);
  const hoursSinceCreation = (Date.now() - new Date(post.created_at).getTime()) / (1000 * 60 * 60);

  if (hoursSinceCreation <= 0) return totalEngagement;
  return totalEngagement / hoursSinceCreation;
}

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now - date) / (1000 * 60));

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return date.toLocaleDateString();
}

function calculateFeedAnalytics(posts: Post[]): FeedAnalytics {
  const analytics = {
    total_posts: posts.length,
    mutual_friends_posts: 0,
    following_posts: 0,
    own_posts: 0,
    trending_posts: 0,
    competition_posts: 0,
    average_engagement: 0,
    top_performing_posts: [] as Post[],
  };

  let totalEngagement = 0;
  let maxEngagement = 0;
  let topPost: Post | null = null;

  posts.forEach(post => {
    // Count by type
    if (post.feed_type === 'mutual_friend') analytics.mutual_friends_posts++;
    else if (post.feed_type === 'following') analytics.following_posts++;
    else if (post.feed_type === 'own') analytics.own_posts++;
    else if (post.feed_type === 'trending') analytics.trending_posts++;
    else if (post.feed_type === 'competition') analytics.competition_posts++;

    // Calculate engagement
    const engagement = post.likes_count + post.comments_count + post.shares_count;
    totalEngagement += engagement;

    // Track top performing posts
    if (engagement > maxEngagement) {
      maxEngagement = engagement;
      topPost = { ...post, engagement };
    }
  });

  analytics.average_engagement = analytics.total_posts > 0 ? totalEngagement / analytics.total_posts : 0;
  analytics.top_performing_posts = [topPost].filter(Boolean);

  return analytics;
}

async function getFallbackFeed(userId: string, limit: number, offset: number): Promise<Post[]> {
  try {
    const { data, error } = await supabase
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
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return data.map(post => ({
      ...transformPostData(post),
      feed_type: 'fallback',
      metadata: {
        ...transformPostData(post).metadata,
        is_trending: false,
        is_mutual_friend: false,
        is_competition_entry: false,
      },
    }));

  } catch (error) {
    console.error('Fallback feed error:', error);
    return [];
  }
}

// Selectors for commonly used state
export const useFeed = () => ({
  posts: useFeedStore((state) => state.posts),
  loading: useFeedStore((state) => state.loading),
  refreshing: useFeedStore((state) => state.refreshing),
  loadingMore: useFeedStore((state) => state.loadingMore),
  error: useFeedStore((state) => state.error),
  analytics: useFeedStore((state) => state.analytics),
  offlineMode: useFeedStore((state) => state.offlineMode),
});

export const useFeedActions = () => ({
  fetchFeed: useFeedStore((state) => state.fetchFeed),
  fetchMorePosts: useFeedStore((state) => state.fetchMorePosts),
  refreshFeed: useFeedStore((state) => state.refreshFeed),
  likePost: useFeedStore((state) => state.likePost),
  unlikePost: useFeedStore((state) => state.unlikePost),
  sharePost: useFeedStore((state) => state.sharePost),
  savePost: useFeedStore((state) => state.savePost),
  reportPost: useFeedStore((state) => state.reportPost),
});

export const useFeedFilters = () => ({
  filters: useFeedStore((state) => state.filters),
  setFilters: useFeedStore((state) => state.setFilters),
  clearFilters: useFeedStore((state) => state.clearFilters),
});

export const useFeedPagination = () => ({
  pagination: useFeedStore((state) => state.pagination),
  hasNextPage: useFeedStore((state) => state.pagination.hasNextPage),
  currentPage: useFeedStore((state) => state.pagination.currentPage),
});