import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../utils/constants';

const ExploreScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 1, name: 'Casual', emoji: '👕', count: 234 },
    { id: 2, name: 'Formal', emoji: '👔', count: 156 },
    { id: 3, name: 'Streetwear', emoji: '👟', count: 189 },
    { id: 4, name: 'Vintage', emoji: '🕰️', count: 98 },
    { id: 5, name: 'Athletic', emoji: '🏃', count: 145 },
    { id: 6, name: 'Bohemian', emoji: '🌺', count: 67 },
  ];

  const trendingTags = [
    '#Minimalist',
    '#SummerVibes',
    '#StreetStyle',
    '#VintageVibes',
    '#BusinessCasual',
    '#EcoFashion',
  ];

  const trendingCreators = [
    { id: 1, username: '@fashionista', followers: '45.2K', avatar: '👗' },
    { id: 2, username: '@styleguru', followers: '32.8K', avatar: '👔' },
    { id: 3, username: '@trendsetter', followers: '28.1K', avatar: '👟' },
    { id: 4, username: '@vintage_vibes', followers: '19.5K', avatar: '🕰️' },
  ];

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search styles, users, hashtags..."
          placeholderTextColor={COLORS.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {categories.map((category) => (
              <TouchableOpacity key={category.id} style={styles.categoryCard}>
                <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                <Text style={styles.categoryName}>{category.name}</Text>
                <Text style={styles.categoryCount}>{category.count} posts</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Trending Tags */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trending Tags</Text>
          <View style={styles.tagsContainer}>
            {trendingTags.map((tag, index) => (
              <TouchableOpacity key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Trending Creators */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trending Creators</Text>
          {trendingCreators.map((creator) => (
            <TouchableOpacity key={creator.id} style={styles.creatorCard}>
              <View style={styles.creatorAvatar}>
                <Text style={styles.creatorAvatarText}>{creator.avatar}</Text>
              </View>
              <View style={styles.creatorInfo}>
                <Text style={styles.creatorUsername}>{creator.username}</Text>
                <Text style={styles.creatorFollowers}>{creator.followers} followers</Text>
              </View>
              <TouchableOpacity style={styles.followButton}>
                <Text style={styles.followButtonText}>Follow</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    margin: SIZES.md,
    padding: SIZES.md,
    borderRadius: SIZES.sm,
    ...SHADOWS.sm,
  },
  searchIcon: {
    marginRight: SIZES.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FONTS.sizes.md,
    color: COLORS.text,
  },
  section: {
    marginBottom: SIZES.lg,
    paddingHorizontal: SIZES.md,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginBottom: SIZES.md,
  },
  categoryCard: {
    backgroundColor: COLORS.surface,
    padding: SIZES.md,
    marginRight: SIZES.sm,
    borderRadius: SIZES.sm,
    alignItems: 'center',
    minWidth: 100,
    ...SHADOWS.sm,
  },
  categoryEmoji: {
    fontSize: 30,
    marginBottom: SIZES.xs,
  },
  categoryName: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.medium,
    color: COLORS.text,
    marginBottom: 2,
  },
  categoryCount: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.sm,
    marginRight: SIZES.sm,
    marginBottom: SIZES.sm,
    ...SHADOWS.sm,
  },
  tagText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.accent,
    fontFamily: FONTS.medium,
  },
  creatorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SIZES.md,
    borderRadius: SIZES.sm,
    marginBottom: SIZES.sm,
    ...SHADOWS.sm,
  },
  creatorAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.md,
  },
  creatorAvatarText: {
    fontSize: 20,
  },
  creatorInfo: {
    flex: 1,
  },
  creatorUsername: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.medium,
    color: COLORS.text,
  },
  creatorFollowers: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
  followButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.sm,
  },
  followButtonText: {
    color: COLORS.surface,
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.medium,
  },
});

export default ExploreScreen;