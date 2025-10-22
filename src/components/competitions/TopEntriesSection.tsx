/**
 * src/components/competitions/TopEntriesSection.tsx
 *
 * Section displaying top competition entries with most likes
 * Features Lottie animations for like interactions and rank badges
 */

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AntDesign, MaterialIcons, Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';

import { COLORS, SIZES, FONTS, StyleHelpers } from '@/utils/constants';

const { width: screenWidth } = Dimensions.get('window');

interface TopEntry {
  id: string;
  title: string;
  username?: string;
  image_url: string;
  likes: number;
  votes_count: number;
  rank: number;
  isLiked: boolean;
  isAnimating: boolean;
}

interface TopEntriesSectionProps {
  entries: TopEntry[];
  onLike: (entryId: string, index: number) => void;
  onEntryPress: (entry: TopEntry) => void;
  onShowAll: () => void;
}

const TopEntriesSection: React.FC<TopEntriesSectionProps> = ({
  entries,
  onLike,
  onEntryPress,
  onShowAll,
}) => {
  // Animation references
  const likeAnimations = useRef<{ [key: string]: LottieView | null }>({});
  const scaleAnimations = useRef<{ [key: string]: Animated.Value }>({});

  // Lottie animation sources
  const likeAnimation = useMemo(() => require('../../../assets/animations/like-heart.json'), []);
  const heartPopAnimation = useMemo(() => require('../../../assets/animations/heart-pop.json'), []);
  const goldMedalAnimation = useMemo(() => require('../../../assets/animations/gold-medal.json'), []);
  const silverMedalAnimation = useMemo(() => require('../../../assets/animations/silver-medal.json'), []);
  const bronzeMedalAnimation = useMemo(() => require('../../../assets/animations/bronze-medal.json'), []);
  const sparkleAnimation = useMemo(() => require('../../../assets/animations/sparkle.json'), []);

  // Initialize scale animations
  const initializeAnimations = useCallback(() => {
    entries.forEach((entry) => {
      if (!scaleAnimations.current[entry.id]) {
        scaleAnimations.current[entry.id] = new Animated.Value(1);
      }
    });
  }, [entries]);

  useEffect(() => {
    initializeAnimations();
  }, [initializeAnimations]);

  // Handle like press with animation
  const handleLikePress = useCallback((entryId: string, index: number) => {
    const entry = entries[index];

    // Trigger Lottie animation
    const lottieRef = likeAnimations.current[entryId];
    if (lottieRef) {
      lottieRef.play();
    }

    // Trigger scale animation
    const scaleAnim = scaleAnimations.current[entryId];
    if (scaleAnim) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }

    // Call parent handler
    onLike(entryId, index);
  }, [entries, onLike]);

  // Get medal animation based on rank
  const getMedalAnimation = (rank: number) => {
    switch (rank) {
      case 1:
        return goldMedalAnimation;
      case 2:
        return silverMedalAnimation;
      case 3:
        return bronzeMedalAnimation;
      default:
        return null;
    }
  };

  // Get medal colors based on rank
  const getMedalColors = (rank: number) => {
    switch (rank) {
      case 1:
        return { bg: '#FFD700', text: '#8B7500', icon: '#FFA500' }; // Gold
      case 2:
        return { bg: '#C0C0C0', text: '#808080', icon: '#696969' }; // Silver
      case 3:
        return { bg: '#CD7F32', text: '#8B4513', icon: '#A0522D' }; // Bronze
      default:
        return { bg: COLORS.background, text: COLORS.textSecondary, icon: COLORS.textLight };
    }
  };

  // Render rank badge
  const renderRankBadge = (rank: number) => {
    const colors = getMedalColors(rank);
    const animation = getMedalAnimation(rank);

    return (
      <View style={[styles.rankBadge, { backgroundColor: colors.bg }]}>
        {animation && rank <= 3 ? (
          <LottieView
            source={animation}
            autoPlay
            loop={false}
            style={styles.medalAnimation}
          />
        ) : (
          <Text style={[styles.rankText, { color: colors.text }]}>
            #{rank}
          </Text>
        )}
      </View>
    );
  };

  // Render top entry card
  const renderTopEntry = useCallback(({ item, index }: { item: TopEntry; index: number }) => {
    const colors = getMedalColors(item.rank);
    const scaleAnim = scaleAnimations.current[item.id];

    return (
      <Animated.View
        style={[
          styles.topEntryCard,
          {
            transform: scaleAnim ? [{ scale: scaleAnim }] : undefined,
          },
        ]}
      >
        {/* Rank Badge */}
        <View style={styles.rankContainer}>
          {renderRankBadge(item.rank)}
        </View>

        {/* Entry Image */}
        <TouchableOpacity
          style={styles.entryImageContainer}
          onPress={() => onEntryPress(item)}
          activeOpacity={0.9}
        >
          <Image source={{ uri: item.image_url }} style={styles.entryImage} />

          {/* Overlay */}
          <View style={styles.imageOverlay} />

          {/* Username */}
          {item.username && (
            <View style={styles.usernameContainer}>
              <Text style={styles.usernameText}>@{item.username}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Entry Info */}
        <View style={styles.entryInfo}>
          <Text style={styles.entryTitle} numberOfLines={2}>
            {item.title}
          </Text>

          {/* Stats */}
          <View style={styles.entryStats}>
            <TouchableOpacity
              style={[
                styles.likeButton,
                item.isLiked && styles.likedButton,
              ]}
              onPress={() => handleLikePress(item.id, index)}
              activeOpacity={0.7}
            >
              {item.isAnimating ? (
                <LottieView
                  ref={(ref) => {
                    if (ref) likeAnimations.current[item.id] = ref;
                  }}
                  source={likeAnimation}
                  autoPlay={false}
                  loop={false}
                  style={styles.likeAnimation}
                />
              ) : (
                <AntDesign
                  name={item.isLiked ? "heart" : "hearto"}
                  size={16}
                  color={item.isLiked ? '#FF6B6B' : colors.icon}
                />
              )}
            </TouchableOpacity>

            <View style={styles.likesContainer}>
              <Text style={[styles.likesText, { color: colors.text }]}>
                {item.likes.toLocaleString()}
              </Text>
            </View>

            {item.votes_count > 0 && (
              <View style={styles.votesContainer}>
                <AntDesign name="star" size={14} color={COLORS.accent} />
                <Text style={styles.votesText}>
                  {item.votes_count}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Animation indicator for top 3 */}
        {item.rank <= 3 && (
          <View style={styles.animationIndicator}>
            <LottieView
              source={sparkleAnimation}
              autoPlay
              loop
              style={styles.sparkleAnimation}
            />
          </View>
        )}
      </Animated.View>
    );
  }, [entries, handleLikePress, handleEntryPress]);

  // Render entry separator
  const renderSeparator = () => <View style={styles.separator} />;

  // Header
  const renderHeader = () => (
    <View style={styles.sectionHeader}>
      <View style={styles.headerLeft}>
        <MaterialIcons name="emoji-events" size={24} color={COLORS.accent} />
        <Text style={styles.sectionTitle}>Top Entries</Text>
      </View>
      <TouchableOpacity style={styles.seeAllButton} onPress={onShowAll}>
        <Text style={styles.seeAllText}>See All</Text>
        <AntDesign name="right" size={16} color={COLORS.primary} />
      </TouchableOpacity>
    </View>
  );

  if (entries.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {renderHeader()}

      <FlatList
        data={entries}
        renderItem={renderTopEntry}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={renderSeparator}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        scrollEnabled={false} // Parent will handle scrolling
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SIZES.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.sm,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.xs,
  },
  seeAllText: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.medium,
    color: COLORS.primary,
  },
  listContent: {
    paddingHorizontal: SIZES.lg,
  },
  topEntryCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius.lg,
    marginBottom: SIZES.md,
    overflow: 'hidden',
    ...StyleHelpers.createShadow(COLORS.shadow, 3),
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  rankContainer: {
    position: 'absolute',
    top: SIZES.md,
    left: SIZES.md,
    zIndex: 2,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
    ...StyleHelpers.createShadow(COLORS.shadow, 2),
  },
  medalAnimation: {
    width: 28,
    height: 28,
  },
  rankText: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.black,
  },
  entryImageContainer: {
    position: 'relative',
    height: 200,
  },
  entryImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: 'linear-gradient(transparent, rgba(0, 0, 0, 0.6))',
  },
  usernameContainer: {
    position: 'absolute',
    bottom: SIZES.sm,
    left: SIZES.md,
  },
  usernameText: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.semibold,
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
  },
  entryInfo: {
    padding: SIZES.md,
    paddingTop: SIZES.sm,
  },
  entryTitle: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text,
    marginBottom: SIZES.sm,
    lineHeight: FONTS.lineHeight.tight,
  },
  entryStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.radius.full,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: SIZES.xs,
  },
  likedButton: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  likeAnimation: {
    width: 24,
    height: 24,
  },
  likesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.xs,
  },
  likesText: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.semibold,
  },
  votesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.xs,
  },
  votesText: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.medium,
    color: COLORS.accent,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginHorizontal: SIZES.lg,
  },
  animationIndicator: {
    position: 'absolute',
    top: SIZES.sm,
    right: SIZES.sm,
    width: 30,
    height: 30,
  },
  sparkleAnimation: {
    width: 30,
    height: 30,
  },
});

export default TopEntriesSection;