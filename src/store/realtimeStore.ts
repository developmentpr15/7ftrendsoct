// Real-time Store
// Manages real-time updates and subscription state

import { create } from 'zustand';
import { persist, createJSONStorage, subscribeWithSelector } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { realtimeService, RealtimeEvent } from '../services/realtimeService';
import { useSessionStore } from './sessionStore';
import { useFeedStore } from './feedStore';
import { useCompetitionStore } from './competitionStore';

export type { RealtimeEvent } from '../services/realtimeService';

// Real-time notification types
export interface RealtimeNotification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'competition_update' | 'competition_winner' | 'new_follower';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  created_at: string;
  user_id: string;
}

// Real-time connection state
export interface RealtimeConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  reconnectAttempts: number;
  lastConnectedAt: number | null;
  error: string | null;
}

// Real-time subscription state
export interface RealtimeSubscriptionState {
  activeSubscriptions: string[];
  subscriptionStatus: Record<string, 'connected' | 'connecting' | 'disconnected' | 'error'>;
}

// Real-time events state
export interface RealtimeEventsState {
  pendingEvents: RealtimeEvent[];
  processedEvents: RealtimeEvent[];
  lastEventAt: number | null;
}

interface RealtimeStore extends RealtimeConnectionState, RealtimeSubscriptionState, RealtimeEventsState {
  // Notifications
  notifications: RealtimeNotification[];
  unreadCount: number;

  // Connection management
  initializeRealtime: () => Promise<void>;
  disconnectRealtime: () => Promise<void>;
  reconnectRealtime: () => Promise<void>;

  // Notification management
  addNotification: (notification: RealtimeNotification) => void;
  markNotificationAsRead: (notificationId: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotifications: () => void;

  // Subscription management
  subscribeToPost: (postId: string) => Promise<void>;
  unsubscribeFromPost: (postId: string) => Promise<void>;

  // Event handling
  handleRealtimeEvent: (event: RealtimeEvent) => void;
  clearPendingEvents: () => void;

  // Utility
  clearError: () => void;
  getConnectionInfo: () => {
    isConnected: boolean;
    activeSubscriptions: number;
    pendingEvents: number;
    unreadNotifications: number;
  };
}

// Storage configuration for persistence
const storageConfig = {
  name: '7ftrends-realtime-storage',
  storage: createJSONStorage(() => AsyncStorage),
  partialize: (state: RealtimeStore) => ({
    notifications: state.notifications.slice(0, 50), // Keep last 50 notifications
    unreadCount: state.unreadCount,
    lastConnectedAt: state.lastConnectedAt,
  }),
};

export const useRealtimeStore = create<RealtimeStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Connection state
        isConnected: false,
        isConnecting: false,
        reconnectAttempts: 0,
        lastConnectedAt: null,
        error: null,

        // Subscription state
        activeSubscriptions: [],
        subscriptionStatus: {},

        // Events state
        pendingEvents: [],
        processedEvents: [],
        lastEventAt: null,

        // Notifications
        notifications: [],
        unreadCount: 0,

        // Initialize real-time service
        initializeRealtime: async () => {
          try {
            set({ isConnecting: true, error: null });

            console.log('🔄 Initializing real-time store...');

            // Initialize the real-time service
            await realtimeService.initialize();

            // Set up event listeners
            setupEventListeners();

            set({
              isConnecting: false,
              isConnected: realtimeService.getConnectionStatus(),
              lastConnectedAt: Date.now(),
            });

            console.log('✅ Real-time store initialized');

          } catch (error: any) {
            console.error('❌ Failed to initialize real-time store:', error);
            set({
              isConnecting: false,
              isConnected: false,
              error: error.message,
            });
          }
        },

        // Disconnect real-time service
        disconnectRealtime: async () => {
          try {
            console.log('🔕 Disconnecting real-time store...');

            await realtimeService.unsubscribeAll();

            set({
              isConnected: false,
              isConnecting: false,
              activeSubscriptions: [],
              subscriptionStatus: {},
            });

            console.log('✅ Real-time store disconnected');

          } catch (error: any) {
            console.error('❌ Failed to disconnect real-time store:', error);
            set({ error: error.message });
          }
        },

        // Reconnect real-time service
        reconnectRealtime: async () => {
          try {
            set({ isConnecting: true, error: null });

            await realtimeService.initialize();

            set({
              isConnecting: false,
              isConnected: realtimeService.getConnectionStatus(),
              lastConnectedAt: Date.now(),
            });

          } catch (error: any) {
            console.error('❌ Failed to reconnect real-time store:', error);
            set({
              isConnecting: false,
              isConnected: false,
              error: error.message,
            });
          }
        },

        // Add notification
        addNotification: (notification: RealtimeNotification) => {
          const state = get();
          const existingNotification = state.notifications.find(n => n.id === notification.id);

          if (!existingNotification) {
            const updatedNotifications = [notification, ...state.notifications];
            const newUnreadCount = state.unreadCount + 1;

            set({
              notifications: updatedNotifications,
              unreadCount: newUnreadCount,
            });

            // Limit notifications to prevent memory issues
            if (updatedNotifications.length > 100) {
              set({
                notifications: updatedNotifications.slice(0, 100),
              });
            }
          }
        },

        // Mark notification as read
        markNotificationAsRead: (notificationId: string) => {
          const state = get();
          const updatedNotifications = Array.isArray(state.notifications) ? state.notifications.map(notification =>
            notification.id === notificationId
              ? { ...notification, read: true }
              : notification
          ) : [];

          const unreadCount = updatedNotifications.filter(n => !n.read).length;

          set({
            notifications: updatedNotifications,
            unreadCount,
          });
        },

        // Mark all notifications as read
        markAllNotificationsAsRead: () => {
          const state = get();
          const updatedNotifications = Array.isArray(state.notifications) ? state.notifications.map(notification => ({
            ...notification,
            read: true,
          })) : [];

          set({
            notifications: updatedNotifications,
            unreadCount: 0,
          });
        },

        // Clear notifications
        clearNotifications: () => {
          set({
            notifications: [],
            unreadCount: 0,
          });
        },

        // Subscribe to specific post
        subscribeToPost: async (postId: string) => {
          try {
            const state = get();
            const subscriptionKey = `post_${postId}`;

            if (!Array.isArray(state.activeSubscriptions) || !state.activeSubscriptions.includes(subscriptionKey)) {
              set({
                activeSubscriptions: [...(state.activeSubscriptions || []), subscriptionKey],
                subscriptionStatus: {
                  ...(state.subscriptionStatus || {}),
                  [subscriptionKey]: 'connecting',
                },
              });

              await realtimeService.subscribeToPost(postId);

              set({
                subscriptionStatus: {
                  ...state.subscriptionStatus,
                  [subscriptionKey]: 'connected',
                },
              });
            }
          } catch (error: any) {
            console.error(`Failed to subscribe to post ${postId}:`, error);
            set({ error: error.message });
          }
        },

        // Unsubscribe from specific post
        unsubscribeFromPost: async (postId: string) => {
          try {
            const state = get();
            const subscriptionKey = `post_${postId}`;

            await realtimeService.unsubscribe(subscriptionKey);

            const updatedSubscriptions = Array.isArray(state.activeSubscriptions) ? state.activeSubscriptions.filter(s => s !== subscriptionKey) : [];
            const updatedStatus = { ...(state.subscriptionStatus || {}) };
            delete updatedStatus[subscriptionKey];

            set({
              activeSubscriptions: updatedSubscriptions,
              subscriptionStatus: updatedStatus,
            });
          } catch (error: any) {
            console.error(`Failed to unsubscribe from post ${postId}:`, error);
            set({ error: error.message });
          }
        },

        // Handle real-time events
        handleRealtimeEvent: (event: RealtimeEvent) => {
          const state = get();

          // Add to pending events
          set({
            pendingEvents: [...state.pendingEvents, event],
            lastEventAt: Date.now(),
          });

          // Process the event
          processRealtimeEvent(event);

          // Move to processed events after a delay
          setTimeout(() => {
            const currentState = get();
            const updatedPending = currentState.pendingEvents.filter(e => e !== event);
            const updatedProcessed = [...currentState.processedEvents, event];

            set({
              pendingEvents: updatedPending,
              processedEvents: updatedProcessed.slice(-50), // Keep last 50 processed events
            });
          }, 100);
        },

        // Clear pending events
        clearPendingEvents: () => {
          set({
            pendingEvents: [],
            processedEvents: [],
            lastEventAt: null,
          });
        },

        // Clear error
        clearError: () => set({ error: null }),

        // Get connection info
        getConnectionInfo: () => {
          const state = get();
          return {
            isConnected: state.isConnected,
            activeSubscriptions: state.activeSubscriptions.length,
            pendingEvents: state.pendingEvents.length,
            unreadNotifications: state.unreadCount,
          };
        },
      }),
      storageConfig
    )
  )
);

// Process real-time events
function processRealtimeEvent(event: RealtimeEvent) {
  console.log('🔄 Processing real-time event:', event.type, event.table);

  switch (event.type) {
    case 'INSERT':
    case 'UPDATE':
      switch (event.table) {
        case 'notifications':
          handleNotificationEvent(event);
          break;
        case 'likes':
          handleLikeEvent(event);
          break;
        case 'comments':
          handleCommentEvent(event);
          break;
        case 'competitions':
          handleCompetitionEvent(event);
          break;
        case 'follows':
          handleFollowEvent(event);
          break;
        case 'posts':
          handlePostEvent(event);
          break;
      }
      break;
    case 'DELETE':
      switch (event.table) {
        case 'likes':
          handleUnlikeEvent(event);
          break;
        case 'comments':
          handleCommentDeleteEvent(event);
          break;
      }
      break;
  }
}

// Event handlers
function handleNotificationEvent(event: RealtimeEvent) {
  const notification = event.record;

  // Create notification object
  const realtimeNotification: RealtimeNotification = {
    id: notification.id,
    type: notification.type,
    title: getNotificationTitle(notification),
    message: notification.message || notification.content || '',
    data: notification.data,
    read: false,
    created_at: notification.created_at,
    user_id: notification.user_id,
  };

  // Add to store
  useRealtimeStore.getState().addNotification(realtimeNotification);
}

function handleLikeEvent(event: RealtimeEvent) {
  const like = event.record;
  const feedStore = useFeedStore.getState();

  // Update post in feed if it exists
  if (like.post_id) {
    // Optimistically update the post in the feed
    const updatedPosts = Array.isArray(feedStore.posts) ? feedStore.posts.map((post) => {
      if (post.id === like.post_id) {
        const isLiked = like.user_id === useSessionStore.getState().user?.id;
        return {
          ...post,
          likes_count: isLiked ? post.likes_count + 1 : post.likes_count,
          is_liked: isLiked,
        };
      }
      return post;
    }) : [];

    feedStore.posts = updatedPosts;
  }

  // Create notification if it's not the current user's like
  if (like.user_id !== useSessionStore.getState().user?.id) {
    const notification: RealtimeNotification = {
      id: `like_${like.id}`,
      type: 'like',
      title: 'New Like',
      message: `${like.user?.username || 'Someone'} liked your post`,
      data: { post_id: like.post_id, user_id: like.user_id },
      read: false,
      created_at: like.created_at,
      user_id: like.user_id,
    };

    useRealtimeStore.getState().addNotification(notification);
  }
}

function handleCommentEvent(event: RealtimeEvent) {
  const comment = event.record;
  const feedStore = useFeedStore.getState();

  // Update post in feed if it exists
  if (comment.post_id) {
    const updatedPosts = Array.isArray(feedStore.posts) ? feedStore.posts.map((post) => {
      if (post.id === comment.post_id) {
        return {
          ...post,
          comments_count: post.comments_count + 1,
        };
      }
      return post;
    }) : [];

    feedStore.posts = updatedPosts;
  }

  // Create notification if it's not the current user's comment
  if (comment.user_id !== useSessionStore.getState().user?.id) {
    const notification: RealtimeNotification = {
      id: `comment_${comment.id}`,
      type: 'comment',
      title: 'New Comment',
      message: `${comment.user?.username || 'Someone'} commented: ${comment.content?.substring(0, 50)}...`,
      data: { post_id: comment.post_id, user_id: comment.user_id },
      read: false,
      created_at: comment.created_at,
      user_id: comment.user_id,
    };

    useRealtimeStore.getState().addNotification(notification);
  }
}

function handleCompetitionEvent(event: RealtimeEvent) {
  const competition = event.record;
  const competitionStore = useCompetitionStore.getState();

  // Update competition in store
  const updatedCompetitions = Array.isArray(competitionStore.competitions) ? competitionStore.competitions.map(comp => {
    if (comp.id === competition.id) {
      return { ...comp, ...competition };
    }
    return comp;
  }) : [];

  competitionStore.competitions = updatedCompetitions;

  // Create notification for competition updates
  if (competition.status === 'ended') {
    const notification: RealtimeNotification = {
      id: `competition_ended_${competition.id}`,
      type: 'competition_update',
      title: 'Competition Ended',
      message: `The competition "${competition.title}" has ended. Check out the winners!`,
      data: { competition_id: competition.id },
      read: false,
      created_at: competition.updated_at,
      user_id: competition.created_by,
    };

    useRealtimeStore.getState().addNotification(notification);
  }
}

function handleFollowEvent(event: RealtimeEvent) {
  const follow = event.record;

  // Create notification for new follower
  if (follow.following_id === useSessionStore.getState().user?.id) {
    const notification: RealtimeNotification = {
      id: `follow_${follow.id}`,
      type: 'follow',
      title: 'New Follower',
      message: `${follow.follower?.username || 'Someone'} started following you`,
      data: { follower_id: follow.follower_id },
      read: false,
      created_at: follow.created_at,
      user_id: follow.follower_id,
    };

    useRealtimeStore.getState().addNotification(notification);
  }
}

function handlePostEvent(event: RealtimeEvent) {
  const post = event.record;
  const feedStore = useFeedStore.getState();

  // Update post in feed if it exists
  const updatedPosts = feedStore.posts.map(p => {
    if (p.id === post.id) {
      return { ...p, ...post };
    }
    return p;
  });

  feedStore.posts = updatedPosts;
}

function handleUnlikeEvent(event: RealtimeEvent) {
  const like = event.old_record;
  const feedStore = useFeedStore.getState();

  // Update post in feed if it exists
  if (like?.post_id) {
    const updatedPosts = Array.isArray(feedStore.posts) ? feedStore.posts.map(post => {
      if (post.id === like.post_id) {
        const isLiked = like.user_id === useSessionStore.getState().user?.id;
        return {
          ...post,
          likes_count: isLiked ? Math.max(0, post.likes_count - 1) : post.likes_count,
          is_liked: isLiked ? false : post.is_liked
        };
      }
      return post;
    }) : [];

    feedStore.posts = updatedPosts;
  }
}

function handleCommentDeleteEvent(event: RealtimeEvent) {
  const comment = event.old_record;
  const feedStore = useFeedStore.getState();

  // Update post in feed if it exists
  if (comment?.post_id) {
    const updatedPosts = Array.isArray(feedStore.posts) ? feedStore.posts.map(post => {
      if (post.id === comment.post_id) {
        return {
          ...post,
          comments_count: Math.max(0, post.comments_count - 1),
        };
      }
      return post;
    }) : [];

    feedStore.posts = updatedPosts;
  }
}

function getNotificationTitle(notification: any): string {
  switch (notification.type) {
    case 'like':
      return 'New Like';
    case 'comment':
      return 'New Comment';
    case 'follow':
      return 'New Follower';
    case 'competition_update':
      return 'Competition Update';
    case 'competition_winner':
      return 'Competition Winner';
    case 'new_follower':
      return 'New Follower';
    default:
      return 'Notification';
  }
}

// Set up event listeners for the real-time service
function setupEventListeners() {
  // Listen to all real-time events
  realtimeService.on('*', (event: RealtimeEvent) => {
    useRealtimeStore.getState().handleRealtimeEvent(event);
  });

  // Listen to specific event types
  realtimeService.on('notification', (event: RealtimeEvent) => {
    console.log('🔔 Notification received:', event);
  });

  realtimeService.on('like', (event: RealtimeEvent) => {
    console.log('❤️ Like event received:', event);
  });

  realtimeService.on('comment', (event: RealtimeEvent) => {
    console.log('💬 Comment event received:', event);
  });

  realtimeService.on('competition_update', (event: RealtimeEvent) => {
    console.log('🏆 Competition update received:', event);
  });

  realtimeService.on('follow', (event: RealtimeEvent) => {
    console.log('👥 Follow event received:', event);
  });
}

// Selectors for commonly used state
export const useRealtime = () => ({
  isConnected: useRealtimeStore((state) => state.isConnected),
  isConnecting: useRealtimeStore((state) => state.isConnecting),
  error: useRealtimeStore((state) => state.error),
  notifications: useRealtimeStore((state) => state.notifications),
  unreadCount: useRealtimeStore((state) => state.unreadCount),
  activeSubscriptions: useRealtimeStore((state) => state.activeSubscriptions),
});

export const useRealtimeNotifications = () => ({
  notifications: useRealtimeStore((state) => state.notifications),
  unreadCount: useRealtimeStore((state) => state.unreadCount),
  addNotification: useRealtimeStore((state) => state.addNotification),
  markAsRead: useRealtimeStore((state) => state.markNotificationAsRead),
  markAllAsRead: useRealtimeStore((state) => state.markAllNotificationsAsRead),
  clearNotifications: useRealtimeStore((state) => state.clearNotifications),
});

export const useRealtimeConnection = () => ({
  isConnected: useRealtimeStore((state) => state.isConnected),
  isConnecting: useRealtimeStore((state) => state.isConnecting),
  error: useRealtimeStore((state) => state.error),
  initialize: useRealtimeStore((state) => state.initializeRealtime),
  disconnect: useRealtimeStore((state) => state.disconnectRealtime),
  reconnect: useRealtimeStore((state) => state.reconnectRealtime),
  clearError: useRealtimeStore((state) => state.clearError),
});

export const useRealtimeSubscriptions = () => ({
  activeSubscriptions: useRealtimeStore((state) => state.activeSubscriptions),
  subscribeToPost: useRealtimeStore((state) => state.subscribeToPost),
  unsubscribeFromPost: useRealtimeStore((state) => state.unsubscribeFromPost),
});

export default useRealtimeStore;
