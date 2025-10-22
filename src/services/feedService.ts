/**
 * src/services/feedService.ts
 *
 * Service for managing feed posts including virtual try-on results
 */

import { supabase } from '@/utils/supabase';

export interface FeedPost {
  id?: string;
  user_id: string;
  image_url: string;
  caption: string;
  type: 'outfit' | 'virtual-tryon' | 'inspiration';
  metadata?: {
    originalPhoto?: string;
    clothingItems?: string[];
    confidence?: number;
    processingTime?: number;
  };
  likes_count?: number;
  comments_count?: number;
  created_at?: string;
}

class FeedService {
  /**
   * Save a virtual try-on result to the feed
   */
  async saveTryOnToFeed(
    imageUrl: string,
    caption: string,
    metadata?: FeedPost['metadata']
  ): Promise<string> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const postData: Omit<FeedPost, 'id' | 'created_at'> = {
        user_id: user.id,
        image_url: imageUrl,
        caption: caption.trim(),
        type: 'virtual-tryon',
        metadata: {
          ...metadata,
          postedAt: new Date().toISOString(),
        },
      };

      const { data, error } = await supabase
        .from('feed_posts')
        .insert(postData)
        .select('id')
        .single();

      if (error) {
        console.error('Feed save error:', error);
        throw new Error(`Failed to save to feed: ${error.message}`);
      }

      console.log('✅ Try-on saved to feed:', data.id);
      return data.id;

    } catch (error) {
      console.error('❌ Save to feed failed:', error);
      throw error;
    }
  }

  /**
   * Get user's feed posts
   */
  async getUserFeed(limit: number = 20): Promise<FeedPost[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return [];
      }

      const { data, error } = await supabase
        .from('feed_posts')
        .select(`
          *,
          profiles:username,
          profiles:avatar_url
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Feed fetch error:', error);
        return [];
      }

      return data || [];

    } catch (error) {
      console.error('❌ Fetch feed failed:', error);
      return [];
    }
  }

  /**
   * Like a feed post
   */
  async likePost(postId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('post_likes')
        .insert({
          post_id: postId,
          user_id: user.id,
        });

      if (error) {
        // Handle duplicate like error gracefully
        if (error.code === '23505') {
          return false; // Already liked
        }
        throw error;
      }

      // Update likes count
      await supabase.rpc('increment_likes_count', { post_id: postId });

      return true;

    } catch (error) {
      console.error('❌ Like post failed:', error);
      return false;
    }
  }

  /**
   * Unlike a feed post
   */
  async unlikePost(postId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      // Update likes count
      await supabase.rpc('decrement_likes_count', { post_id: postId });

      return true;

    } catch (error) {
      console.error('❌ Unlike post failed:', error);
      return false;
    }
  }

  /**
   * Delete a feed post (only if owned by user)
   */
  async deletePost(postId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('feed_posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      console.log('✅ Post deleted:', postId);
      return true;

    } catch (error) {
      console.error('❌ Delete post failed:', error);
      return false;
    }
  }

  /**
   * Get virtual try-on history for a user
   */
  async getTryOnHistory(limit: number = 10): Promise<FeedPost[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return [];
      }

      const { data, error } = await supabase
        .from('feed_posts')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'virtual-tryon')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Try-on history fetch error:', error);
        return [];
      }

      return data || [];

    } catch (error) {
      console.error('❌ Fetch try-on history failed:', error);
      return [];
    }
  }
}

// Export singleton instance
export const feedService = new FeedService();
export default feedService;