// Real-time Service
// Manages Supabase Realtime subscriptions for live updates

import { RealtimeChannel } from '@supabase/realtime-js';
import { supabase } from '../lib/supabase';
import { useSessionStore } from '../store/sessionStore';

// Subscription event types
export interface RealtimeEvent {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  schema: string;
  record: any;
  old_record?: any;
  timestamp: string;
}

// Subscription configuration
export interface SubscriptionConfig {
  userId?: string;
  postIds?: string[];
  competitionIds?: string[];
  filters?: Record<string, any>;
}

// Real-time notification types
export interface NotificationEvent {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'competition_update' | 'competition_winner' | 'new_follower';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  created_at: string;
  user_id: string;
}

// Post engagement update
export interface PostEngagementUpdate {
  post_id: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  is_liked: boolean;
  latest_like?: {
    user_id: string;
    username: string;
    avatar_url: string;
  };
  latest_comment?: {
    user_id: string;
    username: string;
    content: string;
    created_at: string;
  };
}

// Competition status update
export interface CompetitionStatusUpdate {
  competition_id: string;
  status: 'voting' | 'ended' | 'judging' | 'completed';
  winner_id?: string;
  winner_username?: string;
  voting_deadline?: string;
  ended_at?: string;
  participant_count?: number;
  total_votes?: number;
}

class RealtimeService {
  private subscriptions: Map<string, RealtimeChannel> = new Map();
  private eventListeners: Map<string, ((event: RealtimeEvent) => void)[]> = new Map();
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;

  constructor() {
    this.setupConnectionListeners();
  }

  // Initialize real-time connection
  async initialize() {
    try {
      console.log('🔄 Initializing real-time service...');

      // Set up connection state listener
      supabase.realtime.onOpen(() => {
        console.log('✅ Real-time connection opened');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.reconnectSubscriptions();
      });

      supabase.realtime.onClose(() => {
        console.log('❌ Real-time connection closed');
        this.isConnected = false;
        this.handleReconnect();
      });

      supabase.realtime.onError((error) => {
        console.error('❌ Real-time connection error:', error);
        this.isConnected = false;
        this.handleReconnect();
      });

    } catch (error) {
      console.error('Failed to initialize real-time service:', error);
    }
  }

  // Set up connection listeners
  private setupConnectionListeners() {
    // Listen for auth state changes to manage subscriptions
    const { unsubscribe } = useSessionStore.subscribe(
      (state) => state.isAuthenticated,
      (isAuthenticated) => {
        if (isAuthenticated) {
          this.initializeUserSubscriptions();
        } else {
          this.unsubscribeAll();
        }
      }
    );
  }

  // Handle automatic reconnection
  private async handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(async () => {
      try {
        await this.initialize();
        const user = useSessionStore.getState().user;
        if (user) {
          await this.initializeUserSubscriptions();
        }
      } catch (error) {
        console.error('Reconnection failed:', error);
      }
    }, delay);
  }

  // Initialize user-specific subscriptions
  private async initializeUserSubscriptions() {
    const user = useSessionStore.getState().user;
    if (!user) return;

    console.log('🔔 Initializing user subscriptions for:', user.id);

    // Subscribe to user's notifications
    await this.subscribeToNotifications(user.id);

    // Subscribe to posts engagement for posts user interacted with
    await this.subscribeToPostEngagement(user.id);

    // Subscribe to competition updates for competitions user joined
    await this.subscribeToCompetitionUpdates(user.id);

    // Subscribe to follower updates
    await this.subscribeToFollowerUpdates(user.id);
  }

  // Subscribe to notifications
  async subscribeToNotifications(userId: string): Promise<RealtimeChannel> {
    const channelName = `notifications_${userId}`;

    if (this.subscriptions.has(channelName)) {
      return this.subscriptions.get(channelName)!;
    }

    console.log('🔔 Subscribing to notifications for user:', userId);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          this.handleNotificationEvent('INSERT', payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          this.handleNotificationEvent('UPDATE', payload);
        }
      )
      .subscribe((status) => {
        console.log('🔔 Notifications subscription status:', status);
      });

    this.subscriptions.set(channelName, channel);
    return channel;
  }

  // Subscribe to post engagement updates
  async subscribeToPostEngagement(userId: string): Promise<RealtimeChannel> {
    const channelName = `post_engagement_${userId}`;

    if (this.subscriptions.has(channelName)) {
      return this.subscriptions.get(channelName)!;
    }

    console.log('💬 Subscribing to post engagement for user:', userId);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'likes',
          filter: `post_id=in.(SELECT post_id FROM post_interactions WHERE user_id=${userId})`,
        },
        (payload) => {
          this.handleLikeEvent(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `post_id=in.(SELECT post_id FROM post_interactions WHERE user_id=${userId})`,
        },
        (payload) => {
          this.handleCommentEvent(payload);
        }
      )
      .subscribe((status) => {
        console.log('💬 Post engagement subscription status:', status);
      });

    this.subscriptions.set(channelName, channel);
    return channel;
  }

  // Subscribe to competition updates
  async subscribeToCompetitionUpdates(userId: string): Promise<RealtimeChannel> {
    const channelName = `competitions_${userId}`;

    if (this.subscriptions.has(channelName)) {
      return this.subscriptions.get(channelName)!;
    }

    console.log('🏆 Subscribing to competition updates for user:', userId);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'competitions',
          filter: `id=in.(SELECT competition_id FROM competition_entries WHERE user_id=${userId})`,
        },
        (payload) => {
          this.handleCompetitionUpdateEvent(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'competition_entries',
          filter: `competition_id=in.(SELECT competition_id FROM competition_entries WHERE user_id=${userId})`,
        },
        (payload) => {
          this.handleCompetitionEntryEvent(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'competition_entries',
          filter: `competition_id=in.(SELECT competition_id FROM competition_entries WHERE user_id=${userId})`,
        },
        (payload) => {
          this.handleCompetitionEntryEvent(payload);
        }
      )
      .subscribe((status) => {
        console.log('🏆 Competition subscription status:', status);
      });

    this.subscriptions.set(channelName, channel);
    return channel;
  }

  // Subscribe to follower updates
  async subscribeToFollowerUpdates(userId: string): Promise<RealtimeChannel> {
    const channelName = `followers_${userId}`;

    if (this.subscriptions.has(channelName)) {
      return this.subscriptions.get(channelName)!;
    }

    console.log('👥 Subscribing to follower updates for user:', userId);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'follows',
          filter: `following_id=eq.${userId}`,
        },
        (payload) => {
          this.handleFollowEvent(payload);
        }
      )
      .subscribe((status) => {
        console.log('👥 Follower subscription status:', status);
      });

    this.subscriptions.set(channelName, channel);
    return channel;
  }

  // Subscribe to specific post updates
  async subscribeToPost(postId: string): Promise<RealtimeChannel> {
    const channelName = `post_${postId}`;

    if (this.subscriptions.has(channelName)) {
      return this.subscriptions.get(channelName)!;
    }

    console.log('📝 Subscribing to post updates:', postId);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'posts',
          filter: `id=eq.${postId}`,
        },
        (payload) => {
          this.handlePostUpdateEvent(payload);
        }
      )
      .subscribe((status) => {
        console.log('📝 Post subscription status:', status);
      });

    this.subscriptions.set(channelName, channel);
    return channel;
  }

  // Event handlers
  private handleNotificationEvent(eventType: string, payload: any) {
    console.log('🔔 Notification event:', eventType, payload);

    const event: RealtimeEvent = {
      type: eventType as 'INSERT' | 'UPDATE' | 'DELETE',
      table: 'notifications',
      schema: 'public',
      record: payload.new || payload.record,
      old_record: payload.old,
      timestamp: new Date().toISOString(),
    };

    this.emitEvent('notification', event);
  }

  private handleLikeEvent(payload: any) {
    console.log('❤️ Like event:', payload);

    const event: RealtimeEvent = {
      type: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
      table: 'likes',
      schema: 'public',
      record: payload.new || payload.record,
      old_record: payload.old,
      timestamp: new Date().toISOString(),
    };

    this.emitEvent('like', event);
  }

  private handleCommentEvent(payload: any) {
    console.log('💬 Comment event:', payload);

    const event: RealtimeEvent = {
      type: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
      table: 'comments',
      schema: 'public',
      record: payload.new || payload.record,
      old_record: payload.old,
      timestamp: new Date().toISOString(),
    };

    this.emitEvent('comment', event);
  }

  private handleCompetitionUpdateEvent(payload: any) {
    console.log('🏆 Competition update event:', payload);

    const event: RealtimeEvent = {
      type: 'UPDATE',
      table: 'competitions',
      schema: 'public',
      record: payload.new || payload.record,
      old_record: payload.old,
      timestamp: new Date().toISOString(),
    };

    this.emitEvent('competition_update', event);
  }

  private handleCompetitionEntryEvent(payload: any) {
    console.log('🎯 Competition entry event:', payload);

    const event: RealtimeEvent = {
      type: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
      table: 'competition_entries',
      schema: 'public',
      record: payload.new || payload.record,
      old_record: payload.old,
      timestamp: new Date().toISOString(),
    };

    this.emitEvent('competition_entry', event);
  }

  private handleFollowEvent(payload: any) {
    console.log('👥 Follow event:', payload);

    const event: RealtimeEvent = {
      type: 'INSERT',
      table: 'follows',
      schema: 'public',
      record: payload.new || payload.record,
      old_record: payload.old,
      timestamp: new Date().toISOString(),
    };

    this.emitEvent('follow', event);
  }

  private handlePostUpdateEvent(payload: any) {
    console.log('📝 Post update event:', payload);

    const event: RealtimeEvent = {
      type: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
      table: 'posts',
      schema: 'public',
      record: payload.new || payload.record,
      old_record: payload.old,
      timestamp: new Date().toISOString(),
    };

    this.emitEvent('post_update', event);
  }

  // Event emission system
  on(eventType: string, listener: (event: RealtimeEvent) => void) {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(listener);
  }

  off(eventType: string, listener: (event: RealtimeEvent) => void) {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emitEvent(eventType: string, event: RealtimeEvent) {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error(`Error in event listener for ${eventType}:`, error);
        }
      });
    }
  }

  // Unsubscribe from specific channel
  async unsubscribe(channelName: string) {
    const channel = this.subscriptions.get(channelName);
    if (channel) {
      console.log('🔕 Unsubscribing from:', channelName);
      await supabase.removeChannel(channel);
      this.subscriptions.delete(channelName);
    }
  }

  // Unsubscribe from all channels
  async unsubscribeAll() {
    console.log('🔕 Unsubscribing from all channels');

    const unsubscribePromises = Array.from(this.subscriptions.entries()).map(
      async ([channelName]) => {
        await this.unsubscribe(channelName);
      }
    );

    await Promise.all(unsubscribePromises);
    this.eventListeners.clear();
  }

  // Reconnect all subscriptions after reconnection
  private async reconnectSubscriptions() {
    console.log('🔄 Reconnecting subscriptions...');

    const user = useSessionStore.getState().user;
    if (user) {
      await this.initializeUserSubscriptions();
    }
  }

  // Get connection status
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  // Get active subscriptions count
  getActiveSubscriptionsCount(): number {
    return this.subscriptions.size;
  }

  // Get subscription info for debugging
  getSubscriptionInfo(): Array<{ name: string; status: string }> {
    return Array.from(this.subscriptions.entries()).map(([name, channel]) => ({
      name,
      status: channel.state || 'unknown',
    }));
  }
}

// Create singleton instance
export const realtimeService = new RealtimeService();

// Export convenience functions
export const {
  initialize,
  subscribeToNotifications,
  subscribeToPostEngagement,
  subscribeToCompetitionUpdates,
  subscribeToFollowerUpdates,
  subscribeToPost,
  unsubscribe,
  unsubscribeAll,
  on,
  off,
  getConnectionStatus,
  getActiveSubscriptionsCount,
  getSubscriptionInfo,
} = realtimeService;

export default realtimeService;