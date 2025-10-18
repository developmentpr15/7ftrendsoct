import { supabase } from '../utils/supabase';

// Feed service for intelligent content delivery
// Weighted: 67% friends + 23% trending + 10% competitions

class FeedService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache
  }

  // Get user's personalized feed
  async getUserFeed(userId, options = {}) {
    const {
      limit = 20,
      offset = 0,
      refresh = false
    } = options;

    const cacheKey = `feed_${userId}_${limit}_${offset}`;

    // Check cache first
    if (!refresh && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      console.log('Fetching intelligent feed for user:', userId);

      // Call the Supabase RPC function
      const { data, error } = await supabase.rpc('get_user_feed', {
        current_user_id: userId,
        limit_count: limit,
        offset_count: offset
      });

      if (error) {
        console.error('Feed service error:', error);
        throw error;
      }

      // Transform data for frontend consumption
      const transformedFeed = this.transformFeedData(data);

      // Cache the result
      this.cache.set(cacheKey, {
        data: transformedFeed,
        timestamp: Date.now()
      });

      console.log(`Feed loaded: ${transformedFeed.length} posts`, {
        mutual_friends: transformedFeed.filter(p => p.feed_type === 'mutual_friend').length,
        following: transformedFeed.filter(p => p.feed_type === 'following').length,
        own: transformedFeed.filter(p => p.feed_type === 'own').length,
        trending: transformedFeed.filter(p => p.feed_type === 'trending').length,
        competitions: transformedFeed.filter(p => p.feed_type === 'competition').length
      });

      return transformedFeed;
    } catch (error) {
      console.error('Error fetching feed:', error);
      // Fallback to basic feed if algorithm fails
      return this.getFallbackFeed(userId, limit, offset);
    }
  }

  // Transform Supabase data to match frontend expectations
  transformFeedData(data) {
    return data.map(post => ({
      id: post.post_id,
      author_id: post.author_id,
      author: {
        id: post.author_id,
        username: post.author_username || 'Anonymous',
        avatar_url: post.author_avatar_url,
        full_name: post.author_full_name
      },
      content: post.content || '',
      images: Array.isArray(post.images) ? post.images : [],
      created_at: post.created_at,
      likes_count: post.likes_count || 0,
      comments_count: post.comments_count || 0,
      shares_count: post.shares_count || 0,
      is_liked: post.is_liked || false,
      feed_type: post.feed_type,
      relationship_type: post.relationship_type,
      friendship_boost: post.friendship_boost || 1.0,
      trending_score: parseFloat(post.trending_score) || 0,
      competition: post.competition_id ? {
        id: post.competition_id,
        title: post.competition_title
      } : null,
      // Additional metadata for UI
      metadata: {
        engagement_rate: this.calculateEngagementRate(post),
        time_ago: this.getTimeAgo(post.created_at),
        is_trending: post.feed_type === 'trending',
        is_mutual_friend: post.feed_type === 'mutual_friend',
        is_following: post.feed_type === 'following',
        is_own_post: post.feed_type === 'own',
        is_discover: post.feed_type === 'trending',
        is_competition_entry: post.feed_type === 'competition'
      }
    }));
  }

  // Calculate engagement rate for sorting/ranking
  calculateEngagementRate(post) {
    const totalEngagement = (post.likes_count || 0) + (post.comments_count || 0) + (post.shares_count || 0);
    const hoursSinceCreation = (Date.now() - new Date(post.created_at)) / (1000 * 60 * 60);

    if (hoursSinceCreation <= 0) return totalEngagement;

    return totalEngagement / hoursSinceCreation; // Engagement per hour
  }

  // Get time ago string for display
  getTimeAgo(dateString) {
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

  // Fallback feed in case algorithm fails
  async getFallbackFeed(userId, limit = 20, offset = 0) {
    console.log('Using fallback feed for user:', userId);

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
        ...post,
        author: post.users || {
          id: post.author_id,
          username: 'Anonymous',
          avatar_url: null,
          full_name: null
        },
        feed_type: 'fallback',
        metadata: {
          is_trending: false,
          is_from_friend: false,
          is_competition_entry: false
        }
      }));
    } catch (error) {
      console.error('Fallback feed failed:', error);
      return [];
    }
  }

  // Get user recommendations for discovery
  async getUserRecommendations(userId, limit = 10) {
    try {
      const { data, error } = await supabase.rpc('get_user_recommendations', {
        current_user_id: userId,
        limit_count: limit
      });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting recommendations:', error);
      return [];
    }
  }

  // Refresh feed scores (admin function)
  async refreshFeedScores() {
    try {
      const { error } = await supabase.rpc('refresh_feed_scores');
      if (error) throw error;

      // Clear cache to force refresh
      this.cache.clear();

      return { success: true };
    } catch (error) {
      console.error('Error refreshing feed scores:', error);
      return { success: false, error: error.message };
    }
  }

  // Like a post
  async likePost(userId, postId) {
    try {
      const { error } = await supabase
        .from('likes')
        .insert({
          user_id: userId,
          post_id: postId
        });

      if (error) throw error;

      // Clear cache to refresh feed
      this.clearUserCache(userId);

      return { success: true };
    } catch (error) {
      console.error('Error liking post:', error);
      return { success: false, error: error.message };
    }
  }

  // Unlike a post
  async unlikePost(userId, postId) {
    try {
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('user_id', userId)
        .eq('post_id', postId);

      if (error) throw error;

      // Clear cache to refresh feed
      this.clearUserCache(userId);

      return { success: true };
    } catch (error) {
      console.error('Error unliking post:', error);
      return { success: false, error: error.message };
    }
  }

  // Vote for competition entry
  async voteForEntry(userId, entryId, score = 5) {
    try {
      const { error } = await supabase
        .from('votes')
        .insert({
          voter_id: userId,
          entry_id: entryId,
          score: score
        });

      if (error) throw error;

      // Clear cache to refresh feed
      this.clearUserCache(userId);

      return { success: true };
    } catch (error) {
      console.error('Error voting for entry:', error);
      return { success: false, error: error.message };
    }
  }

  // Report a post
  async reportPost(userId, postId, reason) {
    try {
      const { error } = await supabase
        .from('reports')
        .insert({
          reporter_id: userId,
          post_id: postId,
          reason: reason
        });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error reporting post:', error);
      return { success: false, error: error.message };
    }
  }

  // Clear cache for specific user
  clearUserCache(userId) {
    for (const [key] of this.cache.entries()) {
      if (key.includes(`_${userId}_`)) {
        this.cache.delete(key);
      }
    }
  }

  // Get feed analytics (for debugging)
  getFeedAnalytics(feedData) {
    const analytics = {
      total_posts: feedData.length,
      mutual_friends_posts: 0,
      following_posts: 0,
      own_posts: 0,
      trending_posts: 0,
      competition_posts: 0,
      average_engagement: 0,
      top_performing_posts: []
    };

    let totalEngagement = 0;
    let maxEngagement = 0;
    let topPost = null;

    feedData.forEach(post => {
      // Count by type
      if (post.feed_type === 'mutual_friend') analytics.mutual_friends_posts++;
      else if (post.feed_type === 'following') analytics.following_posts++;
      else if (post.feed_type === 'own') analytics.own_posts++;
      else if (post.feed_type === 'trending') analytics.trending_posts++;
      else if (post.feed_type === 'competition') analytics.competition_posts++;

      // Calculate engagement
      const engagement = (post.likes_count || 0) + (post.comments_count || 0) + (post.shares_count || 0);
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

  // Get cached feed data
  getCachedFeed(userId, limit = 20, offset = 0) {
    const cacheKey = `feed_${userId}_${limit}_${offset}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    return null;
  }

  // Preload feed data for better UX
  async preloadFeed(userId) {
    try {
      // Load initial feed
      await this.getUserFeed(userId, { limit: 10 });

      // Load recommendations
      await this.getUserRecommendations(userId, 5);

      console.log('Feed preloaded successfully');
    } catch (error) {
      console.error('Error preloading feed:', error);
    }
  }
}

// Create singleton instance
export const feedService = new FeedService();
export default feedService;