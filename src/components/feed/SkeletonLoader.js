import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../../utils/constants';

const SkeletonLoader = ({ count = 3 }) => {
  return (
    <View>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.container}>
          {/* Header Skeleton */}
          <View style={styles.header}>
            <View style={styles.avatar} />
            <View style={styles.userInfo}>
              <View style={[styles.textLine, styles.username]} />
              <View style={[styles.textLine, styles.timestamp]} />
            </View>
            <View style={[styles.textLine, styles.moreButton]} />
          </View>

          {/* Content Skeleton */}
          <View style={styles.content}>
            <View style={[styles.textLine, { width: '90%' }]} />
            <View style={[styles.textLine, { width: '70%' }]} />
          </View>

          {/* Image Skeleton */}
          <View style={styles.image} />

          {/* Actions Skeleton */}
          <View style={styles.actions}>
            <View style={[styles.icon, styles.actionIcon]} />
            <View style={[styles.icon, styles.actionIcon]} />
            <View style={[styles.icon, styles.actionIcon]} />
            <View style={[styles.icon, styles.bookmarkIcon]} />
          </View>

          {/* Stats Skeleton */}
          <View style={styles.stats}>
            <View style={[styles.textLine, styles.likesText]} />
            <View style={[styles.textLine, styles.commentsText]} />
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    marginBottom: SIZES.sm,
    padding: SIZES.md,
    ...SHADOWS.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.border,
    marginRight: SIZES.sm,
  },
  userInfo: {
    flex: 1,
  },
  textLine: {
    height: 12,
    backgroundColor: COLORS.border,
    borderRadius: 6,
    marginBottom: SIZES.xs,
  },
  username: {
    width: 120,
    height: 16,
  },
  timestamp: {
    width: 60,
    height: 12,
  },
  moreButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  content: {
    marginBottom: SIZES.md,
  },
  image: {
    width: '100%',
    height: 300,
    backgroundColor: COLORS.border,
    borderRadius: 8,
    marginBottom: SIZES.md,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  icon: {
    width: 24,
    height: 24,
    backgroundColor: COLORS.border,
    borderRadius: 12,
    marginRight: SIZES.lg,
  },
  actionIcon: {
    width: 24,
    height: 24,
  },
  bookmarkIcon: {
    marginLeft: 'auto',
    marginRight: 0,
  },
  stats: {
    flexDirection: 'row',
  },
  likesText: {
    width: 80,
    height: 14,
    marginRight: SIZES.md,
  },
  commentsText: {
    width: 100,
    height: 14,
  },
});

export default SkeletonLoader;