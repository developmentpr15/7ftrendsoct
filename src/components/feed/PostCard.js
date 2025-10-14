import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../utils/constants';

const PostCard = ({
  post,
  onLike,
  onComment,
  currentUserId,
  isLoading = false,
}) => {
  // Multiple safety checks
  if (!post) {
    console.warn('PostCard received undefined post');
    return null;
  }

  // Use optional chaining and provide defaults for every property
  const id = post?.id;
  const author = post?.author;
  const content = post?.content;
  const images = post?.images || [];
  const likes_count = post?.likes_count || 0;
  const comments_count = post?.comments_count || 0;
  const created_at = post?.created_at;
  const is_liked = post?.is_liked || false;
  const latest_comments = post?.latest_comments || [];

  // Safety check for id
  if (!id) {
    console.warn('PostCard received post without id:', post);
    return null;
  }

  // Create safe author object with maximum safety
  const safeAuthor = {
    id: author?.id || 'unknown',
    username: author?.username || 'Anonymous',
    avatar_url: author?.avatar_url || null,
    full_name: author?.full_name || null,
  };

  const handleLike = () => {
    if (!isLoading && onLike && id) {
      onLike(id);
    }
  };

  const handleComment = () => {
    if (!isLoading && onComment && id) {
      onComment(id);
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const renderHashtags = (text) => {
    if (!text || typeof text !== 'string') {
      return <Text style={styles.captionText}>{text || ''}</Text>;
    }

    try {
      const hashtagRegex = /#\w+/g;
      const parts = text.split(hashtagRegex);
      const matches = text.match(hashtagRegex) || [];

      let result = [];
      parts.forEach((part, index) => {
        result.push(
          <Text key={`text-${index}`} style={styles.captionText}>
            {part}
          </Text>
        );
        if (matches[index]) {
          result.push(
            <Text key={`hashtag-${index}`} style={styles.hashtag}>
              {matches[index]}
            </Text>
          );
        }
      });
      return result;
    } catch (error) {
      console.warn('Error rendering hashtags:', error);
      return <Text style={styles.captionText}>{text}</Text>;
    }
  };

  try {
    return (
      <View style={styles.container}>
        {/* Post Header */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              {safeAuthor.avatar_url ? (
                <Image source={{ uri: safeAuthor.avatar_url }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarEmoji}>
                  {safeAuthor.username?.charAt(0)?.toUpperCase() || 'U'}
                </Text>
              )}
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.username}>{safeAuthor.username || 'Anonymous'}</Text>
              <Text style={styles.timestamp}>{formatTimeAgo(created_at)}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.moreButton}>
            <Ionicons name="ellipsis-horizontal" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

      {/* Post Content */}
      {content && (
        <View style={styles.contentContainer}>
          <Text style={styles.content}>{renderHashtags(content)}</Text>
        </View>
      )}

      {/* Post Images */}
      {images && images.length > 0 && (
        <View style={styles.imageContainer}>
          {images.length === 1 ? (
            <Image source={{ uri: images[0] }} style={styles.singleImage} />
          ) : images.length === 2 ? (
            <View style={styles.doubleImageContainer}>
              {images.map((image, index) => (
                <Image key={index} source={{ uri: image }} style={styles.doubleImage} />
              ))}
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.multipleImageContainer}>
                {images.map((image, index) => (
                  <Image key={index} source={{ uri: image }} style={styles.multipleImage} />
                ))}
              </View>
            </ScrollView>
          )}
        </View>
      )}

      {/* Post Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, isLoading && styles.disabledButton]}
          onPress={handleLike}
          disabled={isLoading}
        >
          <Ionicons
            name={is_liked ? "heart" : "heart-outline"}
            size={24}
            color={is_liked ? COLORS.like : COLORS.textSecondary}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, isLoading && styles.disabledButton]}
          onPress={handleComment}
          disabled={isLoading}
        >
          <Ionicons name="chatbubble-outline" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="paper-plane-outline" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.bookmarkButton]}>
          <Ionicons name="bookmark-outline" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Post Stats */}
      <View style={styles.stats}>
        <Text style={styles.likesCount}>
          {likes_count} {likes_count === 1 ? 'like' : 'likes'}
        </Text>
        {comments_count > 0 && (
          <Text style={styles.commentsCount}>
            {comments_count} {comments_count === 1 ? 'comment' : 'comments'}
          </Text>
        )}
      </View>

      {/* Comments Preview */}
      {latest_comments && latest_comments.length > 0 && (
        <View style={styles.commentsPreview}>
          {latest_comments.slice(0, 2).map((comment) => (
            <View key={comment.id} style={styles.commentItem}>
              <Text style={styles.commentUsername}>
                {comment.author?.username || 'Anonymous'}
              </Text>
              <Text style={styles.commentText}>{comment.content || ''}</Text>
            </View>
          ))}
          {comments_count > 2 && (
            <TouchableOpacity style={styles.viewAllComments} onPress={handleComment}>
              <Text style={styles.viewAllText}>View all {comments_count} comments</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
    );
  } catch (error) {
    console.error('PostCard render error:', error);
    return (
      <View style={[styles.container, { padding: SIZES.md }]}>
        <Text style={styles.username}>Error loading post</Text>
      </View>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    marginBottom: SIZES.sm,
    ...SHADOWS.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SIZES.md,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.sm,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  avatarEmoji: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  userDetails: {
    flex: 1,
  },
  username: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginBottom: 2,
  },
  timestamp: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
  moreButton: {
    padding: SIZES.xs,
  },
  contentContainer: {
    paddingHorizontal: SIZES.md,
    paddingBottom: SIZES.sm,
  },
  content: {
    fontSize: FONTS.sizes.md,
    color: COLORS.text,
    lineHeight: 20,
  },
  captionText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.text,
    lineHeight: 20,
  },
  hashtag: {
    fontSize: FONTS.sizes.md,
    color: COLORS.accent,
    fontFamily: FONTS.medium,
    lineHeight: 20,
  },
  imageContainer: {
    backgroundColor: COLORS.background,
  },
  singleImage: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  doubleImageContainer: {
    flexDirection: 'row',
    height: 200,
  },
  doubleImage: {
    flex: 1,
    height: '100%',
    resizeMode: 'cover',
    marginHorizontal: 1,
  },
  multipleImageContainer: {
    flexDirection: 'row',
    height: 200,
  },
  multipleImage: {
    width: 200,
    height: '100%',
    resizeMode: 'cover',
    marginRight: SIZES.xs,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
  },
  actionButton: {
    marginRight: SIZES.lg,
    padding: SIZES.xs,
  },
  disabledButton: {
    opacity: 0.5,
  },
  bookmarkButton: {
    marginLeft: 'auto',
    marginRight: 0,
  },
  stats: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.md,
    paddingBottom: SIZES.sm,
  },
  likesCount: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginRight: SIZES.md,
  },
  commentsCount: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
  },
  commentsPreview: {
    paddingHorizontal: SIZES.md,
    paddingBottom: SIZES.md,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: SIZES.xs,
  },
  commentUsername: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginRight: SIZES.xs,
  },
  commentText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.text,
    flex: 1,
  },
  viewAllComments: {
    marginTop: SIZES.xs,
  },
  viewAllText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
});

export default PostCard;