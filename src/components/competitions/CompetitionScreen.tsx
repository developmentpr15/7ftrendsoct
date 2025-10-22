/**
 * src/components/competitions/CompetitionScreen.tsx
 *
 * Main competition screen listing active competitions by region
 * Features top entries display with Lottie-powered like animations
 * Luxury purple (#6a2fb0) and gold (#f2c94c) themed UI
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  StatusBar,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AntDesign, MaterialIcons, Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';

import { COLORS, SIZES, FONTS, StyleHelpers } from '@/utils/constants';
import { competitionsService, Competition, CompetitionEntry } from '@/services/competitionsService';
import CompetitionCard from './CompetitionCard';
import TopEntriesSection from './TopEntriesSection';
import RegionFilter from './RegionFilter';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface CompetitionScreenProps {
  onCompetitionPress?: (competition: Competition) => void;
  onEntryPress?: (entry: CompetitionEntry) => void;
}

interface Region {
  code: string;
  name: string;
  flag: string;
  competitionsCount?: number;
}

interface TopEntry extends CompetitionEntry {
  rank: number;
  isLiked: boolean;
  isAnimating: boolean;
}

export const CompetitionScreen: React.FC<CompetitionScreenProps> = ({
  onCompetitionPress,
  onEntryPress,
}) => {
  // State management
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [topEntries, setTopEntries] = useState<TopEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('global');
  const [sortBy, setSortBy] = useState<'most_liked' | 'recent' | 'ending_soon'>('most_liked');
  const [showFilters, setShowFilters] = useState(false);

  // Animation states
  const [headerHeight, setHeaderHeight] = useState(0);
  const scrollY = new Animated.Value(0);

  // Available regions
  const regions: Region[] = [
    { code: 'global', name: 'Global', flag: '🌍' },
    { code: 'US', name: 'United States', flag: '🇺🇸' },
    { code: 'UK', name: 'United Kingdom', flag: '🇬🇧' },
    { code: 'FR', name: 'France', flag: '🇫🇷' },
    { code: 'DE', name: 'Germany', flag: '🇩🇪' },
    { code: 'IT', name: 'Italy', flag: '🇮🇹' },
    { code: 'ES', name: 'Spain', flag: '🇪🇸' },
    { code: 'JP', name: 'Japan', flag: '🇯🇵' },
    { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
    { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
    { code: 'CA', name: 'Canada', flag: '🇨🇦' },
    { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  ];

  // Lottie animation sources
  const likeAnimation = useMemo(() => require('../../../assets/animations/like-animation.json'), []);
  const heartPopAnimation = useMemo(() => require('../../../assets/animations/heart-pop.json'), []);
  const sparkleAnimation = useMemo(() => require('../../../assets/animations/sparkle.json'), []);

  // Load competitions and top entries
  const loadData = useCallback(async (region?: string) => {
    try {
      setLoading(true);

      // Load competitions
      const countryFilter = region === 'global' ? undefined : region;
      const competitionsResponse = await competitionsService.getActiveCompetitions(countryFilter);

      // Filter competitions by search query
      let filteredCompetitions = competitionsResponse.competitions;
      if (searchQuery.trim()) {
        filteredCompetitions = filteredCompetitions.filter(comp =>
          comp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          comp.theme?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          comp.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      // Sort competitions based on selected criteria
      const sortedCompetitions = [...filteredCompetitions].sort((a, b) => {
        switch (sortBy) {
          case 'most_liked':
            return (b.entries_count || 0) - (a.entries_count || 0);
          case 'recent':
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          case 'ending_soon':
            return new Date(a.end_at).getTime() - new Date(b.end_at).getTime();
          default:
            return 0;
        }
      });

      setCompetitions(sortedCompetitions);

      // Load top entries (get entries from all competitions and sort by likes)
      const topEntriesData: TopEntry[] = [];
      for (const competition of sortedCompetitions.slice(0, 5)) { // Top 5 competitions
        try {
          const entriesResponse = await competitionsService.getCompetitionEntries(
            competition.id,
            { sortBy: 'likes', sortOrder: 'DESC', limit: 3 }
          );

          entriesResponse.entries.forEach((entry, index) => {
            topEntriesData.push({
              ...entry,
              rank: index + 1,
              isLiked: false, // TODO: Get actual like status
              isAnimating: false,
            });
          });
        } catch (error) {
          console.error('Failed to load entries for competition:', competition.id);
        }
      }

      // Sort top entries by likes and take top 10
      const sortedTopEntries = topEntriesData
        .sort((a, b) => b.likes - a.likes)
        .slice(0, 10)
        .map((entry, index) => ({ ...entry, rank: index + 1 }));

      setTopEntries(sortedTopEntries);

    } catch (error) {
      console.error('❌ Failed to load competition data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, sortBy]);

  // Initial load
  useEffect(() => {
    loadData(selectedRegion);
  }, [loadData, selectedRegion]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadData(selectedRegion);
  }, [loadData, selectedRegion]);

  // Handle like animation
  const handleLike = useCallback(async (entryId: string, entryIndex: number) => {
    // Set animation state
    setTopEntries(prev => prev.map((entry, index) =>
      index === entryIndex
        ? { ...entry, isAnimating: true, isLiked: !entry.isLiked }
        : entry
    ));

    // Simulate API call for like/unlike
    try {
      // TODO: Implement actual like API call
      // await competitionsService.likeEntry(entryId);

      // Update likes count
      setTimeout(() => {
        setTopEntries(prev => prev.map((entry, index) =>
          index === entryIndex
            ? {
                ...entry,
                likes: entry.isLiked ? entry.likes - 1 : entry.likes + 1,
                isAnimating: false
              }
            : entry
        ));
      }, 800); // Duration of animation
    } catch (error) {
      console.error('❌ Failed to like entry:', error);
      // Reset animation state on error
      setTopEntries(prev => prev.map((entry, index) =>
        index === entryIndex
          ? { ...entry, isAnimating: false }
          : entry
      ));
    }
  }, []);

  // Handle competition press
  const handleCompetitionPress = useCallback((competition: Competition) => {
    onCompetitionPress?.(competition);
  }, [onCompetitionPress]);

  // Handle entry press
  const handleEntryPress = useCallback((entry: TopEntry) => {
    onEntryPress?.(entry);
  }, [onEntryPress]);

  // Render header
  const renderHeader = () => (
    <Animated.View
      style={[
        styles.header,
        {
          transform: [
            {
              translateY: scrollY.interpolate({
                inputRange: [0, 100],
                outputRange: [0, -50],
                extrapolate: 'clamp',
              }),
            },
          ],
        },
      ]}
      onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}
    >
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        style={styles.headerGradient}
      >
        {/* App Title */}
        <View style={styles.appHeader}>
          <Text style={styles.appTitle}>7FTrends</Text>
          <Text style={styles.appSubtitle}>Fashion Competitions</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <AntDesign name="search" size={20} color="rgba(255, 255, 255, 0.7)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search competitions..."
            placeholderTextColor="rgba(255, 255, 255, 0.7)"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setShowFilters(false)}
          />
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <MaterialIcons name="filter-list" size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* Region Filter */}
        <RegionFilter
          regions={regions}
          selectedRegion={selectedRegion}
          onRegionChange={setSelectedRegion}
        />

        {/* Sort Options */}
        <View style={styles.sortContainer}>
          <Text style={styles.sortLabel}>Sort by:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.sortScroll}
          >
            <View style={styles.sortOptions}>
              {[
                { key: 'most_liked', label: 'Most Liked', icon: 'heart' },
                { key: 'recent', label: 'Recent', icon: 'clockcircle' },
                { key: 'ending_soon', label: 'Ending Soon', icon: 'clockcircleo' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.sortChip,
                    sortBy === option.key && styles.selectedSortChip,
                  ]}
                  onPress={() => setSortBy(option.key as any)}
                >
                  <AntDesign
                    name={option.icon as any}
                    size={16}
                    color={sortBy === option.key ? 'white' : COLORS.primary}
                  />
                  <Text
                    style={[
                      styles.sortChipText,
                      sortBy === option.key && styles.selectedSortChipText,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </LinearGradient>

      {/* Filters Panel */}
      {showFilters && (
        <Animated.View
          style={[
            styles.filtersPanel,
            {
              opacity: scrollY.interpolate({
                inputRange: [0, 100],
                outputRange: [1, 0],
                extrapolate: 'clamp',
              }),
            },
          ]}
        >
          <View style={styles.filtersContent}>
            <Text style={styles.filtersTitle}>Advanced Filters</Text>
            {/* TODO: Add more filter options */}
            <View style={styles.filterOption}>
              <Text style={styles.filterOptionText}>Coming soon: Prize range, Categories</Text>
            </View>
          </View>
        </Animated.View>
      )}
    </Animated.View>
  );

  // Render top entries section
  const renderTopEntries = () => {
    if (topEntries.length === 0) return null;

    return (
      <TopEntriesSection
        entries={topEntries}
        onLike={handleLike}
        onEntryPress={handleEntryPress}
        onShowAll={() => {
          // TODO: Navigate to all top entries screen
        }}
      />
    );
  };

  // Render competitions list
  const renderCompetitionsList = () => {
    if (competitions.length === 0 && !loading) {
      return (
        <View style={styles.emptyState}>
          <LottieView
            source={sparkleAnimation}
            autoPlay
            loop
            style={styles.emptyAnimation}
          />
          <Text style={styles.emptyStateTitle}>
            {selectedRegion === 'global'
              ? 'No Active Competitions'
              : `No Competitions in ${regions.find(r => r.code === selectedRegion)?.name}`
            }
          </Text>
          <Text style={styles.emptyStateText}>
            Be the first to create a competition in your region!
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={competitions}
        renderItem={({ item, index }) => (
          <View style={styles.competitionItem}>
            <CompetitionCard
              competition={item}
              onPress={() => handleCompetitionPress(item)}
              onEntryPress={handleEntryPress}
            />
            {index === 0 && (
              <View style={styles.firstEntryBadge}>
                <MaterialIcons name="emoji-events" size={16} color={COLORS.accent} />
                <Text style={styles.firstEntryText}>Trending</Text>
              </View>
            )}
          </View>
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      />
    );
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        <LottieView
          source={sparkleAnimation}
          autoPlay
          loop
          style={styles.loadingAnimation}
        />
        <Text style={styles.loadingText}>Loading competitions...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {renderHeader()}

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
        {renderTopEntries()}
        {renderCompetitionsList()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    zIndex: 10,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: SIZES.lg,
    paddingHorizontal: SIZES.lg,
  },
  appHeader: {
    alignItems: 'center',
    marginBottom: SIZES.lg,
  },
  appTitle: {
    fontSize: FONTS.sizes.xxxl,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.black,
    color: 'white',
    marginBottom: SIZES.xs,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
  },
  appSubtitle: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.families.primary,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: SIZES.radius.lg,
    paddingHorizontal: SIZES.md,
    marginBottom: SIZES.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  searchInput: {
    flex: 1,
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.families.primary,
    color: 'white',
    marginLeft: SIZES.sm,
  },
  filterButton: {
    padding: SIZES.sm,
    borderRadius: SIZES.radius.sm,
  },
  sortContainer: {
    marginBottom: SIZES.sm,
  },
  sortLabel: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.semibold,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: SIZES.sm,
  },
  sortScroll: {
    flexDirection: 'row',
  },
  sortOptions: {
    flexDirection: 'row',
    gap: SIZES.sm,
  },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.radius.full,
    gap: SIZES.xs,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  selectedSortChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: 'white',
  },
  sortChipText: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.medium,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  selectedSortChipText: {
    color: 'white',
  },
  filtersPanel: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SIZES.lg,
    borderRadius: SIZES.radius.lg,
    padding: SIZES.md,
    marginBottom: SIZES.md,
    ...StyleHelpers.createShadow(COLORS.shadow, 2),
  },
  filtersContent: {
    gap: SIZES.sm,
  },
  filtersTitle: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text,
    marginBottom: SIZES.sm,
  },
  filterOption: {
    padding: SIZES.sm,
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radius.md,
  },
  filterOptionText: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.families.primary,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  scrollView: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: SIZES.lg,
    paddingBottom: SIZES.xl,
  },
  competitionItem: {
    marginBottom: SIZES.md,
    position: 'relative',
  },
  firstEntryBadge: {
    position: 'absolute',
    top: SIZES.md,
    right: SIZES.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.radius.full,
    gap: SIZES.xs,
    ...StyleHelpers.createShadow(COLORS.shadow, 2),
  },
  firstEntryText: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.bold,
    color: COLORS.accent,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SIZES.xxl,
  },
  emptyAnimation: {
    width: 200,
    height: 200,
    marginBottom: SIZES.lg,
  },
  emptyStateTitle: {
    fontSize: FONTS.sizes.xl,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SIZES.sm,
  },
  emptyStateText: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.families.primary,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: FONTS.lineHeight.relaxed,
    paddingHorizontal: SIZES.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingAnimation: {
    width: 150,
    height: 150,
    marginBottom: SIZES.lg,
  },
  loadingText: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.textSecondary,
  },
});

export default CompetitionScreen;