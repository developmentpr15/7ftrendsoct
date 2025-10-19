// Optimized Post Card Component
// Features: Blurhash placeholders, memoization, performance optimization

import React, { memo, useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Image,
  Share,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Blurhash from 'react-native-blurhash';

const { width: screenWidth } = Dimensions.get('window');
const POST_IMAGE_WIDTH = screenWidth - 32; // Account for padding
const POST_IMAGE_HEIGHT = POST_IMAGE_WIDTH * 1.2; // 4:5 aspect ratio

// Memoized post card to prevent unnecessary re-renders
const OptimizedPostCard = memo(({
  post,
  onLike,
  onComment,
  onShare,
  onSave,
  onPress,
  style,
}) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [likeAnimation] = useState(new Animated.Value(1));

  // Memoize computed values to prevent recalculation
  const timeAgo = useMemo(() => {
    const date = new Date(post.created_at);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  }, [post.created_at]);

  const engagementText = useMemo(() => {
    const total = post.likes_count + post.comments_count + post.shares_count;
    if (total === 0) return '';
    if (total < 100) return `${total} engagements`;
    if (total < 1000) return `${Math.floor(total / 10) * 10} engagements`;
    return `${(total / 1000).toFixed(1)}k engagements`;
  }, [post.likes_count, post.comments_count, post.shares_count]);

  // Optimized interaction handlers
  const handleLike = useCallback(() => {
    // Animate like button
    Animated.sequence([
      Animated.timing(likeAnimation, {
        toValue: 1.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(likeAnimation, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    onLike?.(post.id);
  }, [post.id, onLike, likeAnimation]);

  const handleComment = useCallback(() => {
    onComment?.(post.id);
  }, [post.id, onComment]);

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: `${post.content}\n\nvia 7Ftrends`,
        url: post.images?.[0],
      });
      onShare?.(post.id);
    } catch (error) {
      console.error('Share error:', error);
    }
  }, [post.content, post.images, post.id, onShare]);

  const handleSave = useCallback(() => {
    onSave?.(post.id);
  }, [post.id, onSave]);

  const handlePress = useCallback(() => {
    onPress?.(post);
  }, [post, onPress]);

  const handleImageLoad = useCallback(() => {
    setImageLoading(false);
  }, []);

  const handleImageError = useCallback(() => {
    setImageLoading(false);
    setImageError(true);
  }, []);

  // Render feed type indicator
  const renderFeedTypeIndicator = () => {
    if (post.feed_type === 'trending') {
      return (
        <View style={[styles.feedTypeIndicator, styles.trendingIndicator]}>
          <Ionicons name="trending-up" size={12} color="#FF6B6B" />
          <Text style={[styles.feedTypeText, styles.trendingText]}>Trending</Text>
        </View>
      );
    }
    if (post.feed_type === 'mutual_friend') {
      return (
        <View style={[styles.feedTypeIndicator, styles.friendIndicator]}>
          <Ionicons name="people" size={12} color="#4ECDC4" />
          <Text style={[styles.feedTypeText, styles.friendText]}>Friend</Text>
        </View>
      );
    }
    if (post.feed_type === 'competition') {
      return (
        <View style={[styles.feedTypeIndicator, styles.competitionIndicator]}>
          <Ionicons name="ribbon" size={12} color="#FFD700" />
          <Text style={[styles.feedTypeText, styles.competitionText]}>Competition</Text>
        </View>
      );
    }
    return null;
  };

  // Render image with blurhash placeholder
  const renderImage = () => {
    if (!post.images || post.images.length === 0) return null;

    const imageUrl = post.images[0];
    const blurhash = post.blurhash || 'LEHV6nWB2yk8pyoJadR*.7kCMdnj'; // Default blurhash

    return (
      <View style={styles.imageContainer}>
        {/* Blurhash placeholder */}
        {imageLoading && (
          <View style={styles.blurhashContainer}>
            <Blurhash
              hash={blurhash}
              style={styles.blurhash}
              blurhashAsImage={true}
            />
          </View>
        )}

        {/* Actual image */}
        <Image
          source={{ uri: imageUrl }}
          style={[
            styles.postImage,
            imageLoading && { opacity: 0 },
            imageError && { display: 'none' },
          ]}
          onLoad={handleImageLoad}
          onError={handleImageError}
          resizeMode="cover"
        />

        {/* Error placeholder */}
        {imageError && (
          <View style={styles.imageErrorPlaceholder}>
            <Text style={styles.imageErrorText}>Image unavailable</Text>
          </View>
        )}

        {/* Feed type overlay */}
        <View style={styles.imageOverlay}>
          {renderFeedTypeIndicator()}
        </View>
      </View>
    );
  };

  // Render engagement bar
  const renderEngagementBar = () => {
    if (post.likes_count === 0 && post.comments_count === 0) return null;

    return (
      <View style={styles.engagementBar}>
        {post.likes_count > 0 && (
          <View style={styles.engagementItem}>
            <Ionicons name="heart" size={12} color="#FF6B6B" />
            <Text style={styles.engagementText}>{post.likes_count}</Text>
          </View>
        )}
        {post.comments_count > 0 && (
          <View style={styles.engagementItem}>
            <Ionicons name="chatbubble-outline" size={12} color="#666" />
            <Text style={styles.engagementText}>{post.comments_count}</Text>
          </View>
        )}
        {post.shares_count > 0 && (
          <View style={styles.engagementItem}>
            <Ionicons name="share-outline" size={12} color="#666" />
            <Text style={styles.engagementText}>{post.shares_count}</Text>
          </View>
        )}
        {engagementText && (
          <Text style={styles.totalEngagementText}>{engagementText}</Text>
        )}
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={handlePress}
      activeOpacity={0.95}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.authorInfo}>
          <Image
            source={
              post.author.avatar_url
                ? { uri: post.author.avatar_url }
                : { uri: 'https://via.placeholder.com/40x40/4ECDC4/FFFFFF?text=U' }
            }
            style={styles.avatar}
            defaultSource={{ uri: 'https://via.placeholder.com/40x40/4ECDC4/FFFFFF?text=U' }}
          />
          <View style={styles.authorDetails}>
            <Text style={styles.username}>{post.author.username}</Text>
            <View style={styles.metadata}>
              <Ionicons name="time" size={10} color="#999" />
              <Text style={styles.timeAgo}>{timeAgo}</Text>
              {post.feed_type !== 'general' && renderFeedTypeIndicator()}
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {post.content && (
        <Text style={styles.content} numberOfLines={3}>
          {post.content}
        </Text>
      )}

      {/* Image */}
      {renderImage()}

      {/* Engagement Bar */}
      {renderEngagementBar()}

      {/* Actions */}
      <View style={styles.actions}>
        <Animated.View style={[styles.actionButton, { transform: [{ scale: likeAnimation }] }]}>
          <TouchableOpacity onPress={handleLike} style={styles.likeButton}>
            <Ionicons
              name="heart"
              size={20}
              color={post.is_liked ? '#FF6B6B' : '#666'}
            />
          </TouchableOpacity>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleComment} style={styles.actionButton}>
          <Ionicons name="chatbubble-outline" size={20} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity onPress={handleShare} style={styles.actionButton}>
          <Ionicons name="share-outline" size={20} color="#666" />
        </TouchableOpacity>

        <View style={styles.flexSpacer} />

        <TouchableOpacity onPress={handleSave} style={styles.actionButton}>
          <Ionicons name="bookmark-outline" size={20} color="#666" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for memoization
  return (
    prevProps.post.id === nextProps.post.id &&
    prevProps.post.is_liked === nextProps.post.is_liked &&
    prevProps.post.likes_count === nextProps.post.likes_count &&
    prevProps.post.comments_count === nextProps.post.comments_count &&
    prevProps.post.shares_count === nextProps.post.shares_count &&
    prevProps.style === nextProps.style
  );
});

OptimizedPostCard.displayName = 'OptimizedPostCard';

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 12,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  authorDetails: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeAgo: {
    fontSize: 12,
    color: '#999',
  },
  feedTypeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  trendingIndicator: {
    backgroundColor: '#fff0f0',
  },
  friendIndicator: {
    backgroundColor: '#f0fdf4',
  },
  competitionIndicator: {
    backgroundColor: '#fffbeb',
  },
  feedTypeText: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 2,
  },
  trendingText: {
    color: '#FF6B6B',
  },
  friendText: {
    color: '#4ECDC4',
  },
  competitionText: {
    color: '#FFA500',
  },
  moreButton: {
    padding: 4,
  },
  content: {
    fontSize: 15,
    color: '#1a1a1a',
    lineHeight: 22,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  imageContainer: {
    width: POST_IMAGE_WIDTH,
    height: POST_IMAGE_HEIGHT,
    marginHorizontal: 16,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f8f8f8',
    position: 'relative',
  },
  blurhashContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  blurhash: {
    flex: 1,
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  imageErrorPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  imageErrorText: {
    fontSize: 14,
    color: '#999',
  },
  imageOverlay: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
  },
  engagementBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  engagementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  engagementText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  totalEngagementText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 'auto',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    padding: 8,
    marginRight: 8,
  },
  likeButton: {
    padding: 8,
  },
  flexSpacer: {
    flex: 1,
  },
});

export default OptimizedPostCard;