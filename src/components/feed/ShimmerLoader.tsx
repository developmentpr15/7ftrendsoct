/**
 * Shimmer Loader Component
 * Uses react-native-skeleton-placeholder for beautiful loading animations
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import { SIZES, screenWidth } from '@/utils/constants';

interface ShimmerLoaderProps {
  count?: number;
  showAvatar?: boolean;
  showImage?: boolean;
}

export const ShimmerLoader: React.FC<ShimmerLoaderProps> = ({
  count = 3,
  showAvatar = true,
  showImage = true,
}) => {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.postContainer}>
          {/* Header with avatar */}
          {showAvatar && (
            <View style={styles.header}>
              <SkeletonPlaceholder>
                <SkeletonPlaceholder.Item
                  width={40}
                  height={40}
                  borderRadius={20}
                  style={styles.avatar}
                />
              </SkeletonPlaceholder>
              <View style={styles.headerContent}>
                <SkeletonPlaceholder>
                  <SkeletonPlaceholder.Item
                    width={120}
                    height={16}
                    borderRadius={4}
                    style={styles.username}
                  />
                  <SkeletonPlaceholder.Item
                    width={80}
                    height={12}
                    borderRadius={4}
                    style={styles.timestamp}
                  />
                </SkeletonPlaceholder>
              </View>
            </View>
          )}

          {/* Content */}
          <View style={styles.content}>
            <SkeletonPlaceholder>
              <SkeletonPlaceholder.Item
                width={screenWidth - 64}
                height={16}
                borderRadius={4}
                style={styles.contentLine1}
              />
              <SkeletonPlaceholder.Item
                width={screenWidth - 100}
                height={16}
                borderRadius={4}
                style={styles.contentLine2}
              />
              <SkeletonPlaceholder.Item
                width={screenWidth - 140}
                height={16}
                borderRadius={4}
                style={styles.contentLine3}
              />
            </SkeletonPlaceholder>
          </View>

          {/* Image placeholder */}
          {showImage && (
            <SkeletonPlaceholder>
              <SkeletonPlaceholder.Item
                width={screenWidth - 64}
                height={screenWidth - 64}
                borderRadius={12}
                style={styles.image}
              />
            </SkeletonPlaceholder>
          )}

          {/* Engagement bar */}
          <View style={styles.engagementBar}>
            <SkeletonPlaceholder>
              <SkeletonPlaceholder.Item
                width={60}
                height={20}
                borderRadius={10}
                style={styles.likeButton}
              />
              <SkeletonPlaceholder.Item
                width={60}
                height={20}
                borderRadius={10}
                style={styles.commentButton}
              />
              <SkeletonPlaceholder.Item
                width={60}
                height={20}
                borderRadius={10}
                style={styles.shareButton}
              />
            </SkeletonPlaceholder>
          </View>

          {/* Divider */}
          <View style={styles.divider} />
        </View>
      ))}
    </View>
  );
};

// Post skeleton loader for inline loading
export const PostSkeletonLoader: React.FC = () => (
  <View style={styles.postContainer}>
    <View style={styles.header}>
      <SkeletonPlaceholder>
        <SkeletonPlaceholder.Item
          width={40}
          height={40}
          borderRadius={20}
          style={styles.avatar}
        />
      </SkeletonPlaceholder>
      <View style={styles.headerContent}>
        <SkeletonPlaceholder>
          <SkeletonPlaceholder.Item
            width={120}
            height={16}
            borderRadius={4}
            style={styles.username}
          />
          <SkeletonPlaceholder.Item
            width={80}
            height={12}
            borderRadius={4}
            style={styles.timestamp}
          />
        </SkeletonPlaceholder>
      </View>
    </View>

    <View style={styles.content}>
      <SkeletonPlaceholder>
        <SkeletonPlaceholder.Item
          width={screenWidth - 64}
          height={16}
          borderRadius={4}
          style={styles.contentLine1}
        />
        <SkeletonPlaceholder.Item
          width={screenWidth - 100}
          height={16}
          borderRadius={4}
          style={styles.contentLine2}
        />
      </SkeletonPlaceholder>
    </View>

    <SkeletonPlaceholder>
      <SkeletonPlaceholder.Item
        width={screenWidth - 64}
        height={screenWidth - 64}
        borderRadius={12}
        style={styles.image}
      />
    </SkeletonPlaceholder>

    <View style={styles.engagementBar}>
      <SkeletonPlaceholder>
        <SkeletonPlaceholder.Item
          width={60}
          height={20}
          borderRadius={10}
          style={styles.likeButton}
        />
        <SkeletonPlaceholder.Item
          width={60}
          height={20}
          borderRadius={10}
          style={styles.commentButton}
        />
      </SkeletonPlaceholder>
    </View>
  </View>
);

// Compact skeleton loader for list footer
export const CompactSkeletonLoader: React.FC = () => (
  <View style={styles.compactContainer}>
    {Array.from({ length: 2 }).map((_, index) => (
      <View key={index} style={styles.compactPost}>
        <SkeletonPlaceholder>
          <SkeletonPlaceholder.Item
            width={screenWidth - 64}
            height={120}
            borderRadius={12}
          />
        </SkeletonPlaceholder>
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  container: {
    paddingVertical: SIZES.sm,
  },
  postContainer: {
    backgroundColor: '#ffffff',
    marginBottom: SIZES.md,
    borderRadius: SIZES.radius.lg,
    padding: SIZES.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  avatar: {
    marginRight: SIZES.md,
  },
  headerContent: {
    flex: 1,
    gap: SIZES.xs / 2,
  },
  username: {
    marginBottom: 2,
  },
  timestamp: {
    alignSelf: 'flex-start',
  },
  content: {
    marginBottom: SIZES.md,
    gap: SIZES.xs / 2,
  },
  contentLine1: {
    marginBottom: 4,
  },
  contentLine2: {
    marginBottom: 4,
  },
  contentLine3: {
    alignSelf: 'flex-start',
  },
  image: {
    marginBottom: SIZES.md,
  },
  engagementBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  likeButton: {
    flex: 1,
    marginRight: SIZES.sm,
  },
  commentButton: {
    flex: 1,
    marginRight: SIZES.sm,
  },
  shareButton: {
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginTop: SIZES.md,
  },
  compactContainer: {
    paddingVertical: SIZES.sm,
  },
  compactPost: {
    marginBottom: SIZES.md,
  },
});

export default ShimmerLoader;