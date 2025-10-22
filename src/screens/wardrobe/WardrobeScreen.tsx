/**
 * WardrobeScreen.tsx
 * Premium wardrobe management with category-based display and SQLite caching
 * Luxury purple/gold theme with advanced selection logic and offline support
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  StyleSheet,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';

// Import luxury theme constants
import { COLORS, SIZES, FONTS, StyleHelpers } from '@/utils/constants';

// Import SQLite cache
import { sqliteCache, CachedWardrobeItem } from '@/utils/sqliteCache';

// Import Supabase and storage
import { supabase } from '@/utils/supabase';

// Import stores and types
import { useWardrobeStore, WardrobeItem } from '@/store/wardrobeStore';
import { useSessionStore } from '@/store/sessionStore';

// Import components
import { RealtimeConnectionStatus } from '@/components/ui/RealtimeConnectionStatus';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

// Types
interface CategoryConfig {
  id: string;
  name: string;
  icon: string;
  color: string;
  bgColor: string;
  gradientColors: string[];
}

interface SelectedItems {
  top: WardrobeItem | null;
  bottom: WardrobeItem | null;
  shoes: WardrobeItem | null;
  accessories: WardrobeItem | null;
  outerwear: WardrobeItem | null;
}

interface CacheStatus {
  isFromCache: boolean;
  lastUpdated: string | null;
  isStale: boolean;
  totalItems: number;
}

// Constants
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const ITEMS_PER_ROW = 2;
const PADDING = SIZES.lg;
const ITEM_SPACING = SIZES.md;
const ITEM_WIDTH = (screenWidth - (PADDING * 2) - (ITEM_SPACING * (ITEMS_PER_ROW - 1))) / ITEMS_PER_ROW;
const ITEM_HEIGHT = ITEM_WIDTH * 1.4;
const CACHE_EXPIRY_MINUTES = 30;

// Premium category configurations with luxury styling
const CATEGORIES: CategoryConfig[] = [
  {
    id: 'top',
    name: 'Tops',
    icon: '👔',
    color: COLORS.primary,
    bgColor: COLORS.primary + '15',
    gradientColors: [COLORS.primary, COLORS.primaryLight],
  },
  {
    id: 'bottom',
    name: 'Bottoms',
    icon: '👖',
    color: COLORS.accent,
    bgColor: COLORS.accent + '15',
    gradientColors: [COLORS.accent, COLORS.accentLight],
  },
  {
    id: 'shoes',
    name: 'Shoes',
    icon: '👟',
    color: '#4caf50',
    bgColor: '#4caf5015',
    gradientColors: ['#4caf50', '#66bb6a'],
  },
  {
    id: 'accessories',
    name: 'Accessories',
    icon: '👜',
    color: '#ff6b6b',
    bgColor: '#ff6b6b15',
    gradientColors: ['#ff6b6b', '#ff8787'],
  },
  {
    id: 'outerwear',
    name: 'Outerwear',
    icon: '🧥',
    color: '#4ecdc4',
    bgColor: '#4ecdc415',
    gradientColors: ['#4ecdc4', '#6ee7df'],
  },
];

export const WardrobeScreen: React.FC = () => {
  // Store state
  const { user, isAuthenticated } = useSessionStore();
  const {
    wardrobeItems,
    loading,
    error,
    fetchWardrobeItems,
    addItem,
    updateItem,
    deleteItem,
  } = useWardrobeStore();

  // Local state
  const [selectedItems, setSelectedItems] = useState<SelectedItems>({
    top: null,
    bottom: null,
    shoes: null,
    accessories: null,
    outerwear: null,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [localItems, setLocalItems] = useState<CachedWardrobeItem[]>([]);
  const [cacheStatus, setCacheStatus] = useState<CacheStatus>({
    isFromCache: false,
    lastUpdated: null,
    isStale: true,
    totalItems: 0,
  });
  const [dbInitialized, setDbInitialized] = useState(false);
  const [animatedValue] = useState(new Animated.Value(0));

  // ===== DATA FETCHING =====

  /**
   * Initialize SQLite database
   */
  const initializeDatabase = useCallback(async () => {
    try {
      await sqliteCache.init();
      setDbInitialized(true);
      console.log('✅ SQLite database initialized');
    } catch (error) {
      console.error('❌ Failed to initialize SQLite:', error);
    }
  }, []);

  /**
   * Fetch wardrobe items with SQLite caching
   */
  const fetchWardrobeItemsWithCache = useCallback(async (refresh: boolean = false) => {
    if (!isAuthenticated || !user || !dbInitialized) {
      return;
    }

    try {
      // Check cache first (unless forcing refresh)
      if (!refresh) {
        const isStale = await sqliteCache.isCacheStale(user.id, CACHE_EXPIRY_MINUTES);
        if (!isStale) {
          const cachedItems = await sqliteCache.getCachedWardrobeItems(user.id);
          if (cachedItems.length > 0) {
            setLocalItems(cachedItems);
            const stats = await sqliteCache.getCacheStats(user.id);
            setCacheStatus({
              isFromCache: true,
              lastUpdated: stats.lastUpdated,
              isStale: false,
              totalItems: stats.totalItems,
            });
            console.log(`📦 Loaded ${cachedItems.length} items from cache`);
            return;
          }
        }
      }

      // Fetch fresh data from Supabase
      setCacheStatus(prev => ({ ...prev, isFromCache: false }));
      console.log('🌐 Fetching fresh data from Supabase...');

      await fetchWardrobeItems(true);

      // Get updated items from store
      const freshItems = wardrobeItems || [];

      // Update SQLite cache
      await sqliteCache.cacheWardrobeItems(freshItems, user.id);

      // Update local state
      const cachedItems = await sqliteCache.getCachedWardrobeItems(user.id);
      setLocalItems(cachedItems);

      const stats = await sqliteCache.getCacheStats(user.id);
      setCacheStatus({
        isFromCache: false,
        lastUpdated: new Date().toISOString(),
        isStale: false,
        totalItems: stats.totalItems,
      });

      console.log(`✅ Fetched and cached ${freshItems.length} wardrobe items`);
    } catch (error) {
      console.error('❌ Error fetching wardrobe items:', error);

      // Fallback to cache if available
      if (!refresh) {
        try {
          const cachedItems = await sqliteCache.getCachedWardrobeItems(user.id);
          if (cachedItems.length > 0) {
            setLocalItems(cachedItems);
            setCacheStatus(prev => ({
              ...prev,
              isFromCache: true,
              isStale: true
            }));
            console.log('📦 Using stale cache as fallback');
          }
        } catch (cacheError) {
          console.error('❌ Cache fallback also failed:', cacheError);
        }
      }
    }
  }, [isAuthenticated, user, dbInitialized, fetchWardrobeItems, wardrobeItems]);

  /**
   * Refresh handler with cache invalidation
   */
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Clear cache and fetch fresh data
      if (user) {
        await sqliteCache.clearCache(user.id);
      }
      await fetchWardrobeItemsWithCache(true);
    } catch (error) {
      console.error('❌ Error refreshing wardrobe:', error);
      Alert.alert('Refresh Error', 'Failed to refresh wardrobe. Please check your connection and try again.');
    } finally {
      setRefreshing(false);
    }
  }, [fetchWardrobeItemsWithCache, user]);

  // ===== ITEM SELECTION =====

  /**
   * Toggle item selection with haptic feedback
   * Max 1 item per category with smooth animations
   */
  const toggleItemSelection = useCallback((item: CachedWardrobeItem) => {
    const { category } = item;
    const currentSelection = selectedItems[category as keyof SelectedItems];

    // Animate selection change
    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    if (currentSelection?.id === item.id) {
      // Deselect current item
      setSelectedItems(prev => ({
        ...prev,
        [category]: null,
      }));
    } else {
      // Select new item (deselect previous one in same category)
      setSelectedItems(prev => ({
        ...prev,
        [category]: item,
      }));
    }
  }, [selectedItems, animatedValue]);

  /**
   * Check if item is selected
   */
  const isItemSelected = useCallback((item: CachedWardrobeItem) => {
    return selectedItems[item.category as keyof SelectedItems]?.id === item.id;
  }, [selectedItems]);

  /**
   * Clear all selections with confirmation
   */
  const clearAllSelections = useCallback(() => {
    Alert.alert(
      'Clear Selections',
      'Remove all selected items from your outfit?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            setSelectedItems({
              top: null,
              bottom: null,
              shoes: null,
              accessories: null,
              outerwear: null,
            });
          },
        },
      ]
    );
  }, []);

  /**
   * Get selected outfit for display
   */
  const getSelectedOutfit = useCallback(() => {
    return Object.values(selectedItems).filter(Boolean);
  }, [selectedItems]);

  /**
   * Get outfit completion status
   */
  const getOutfitCompletion = useCallback(() => {
    const selected = Object.values(selectedItems).filter(Boolean);
    const total = Object.keys(selectedItems).length;
    const percentage = Math.round((selected.length / total) * 100);
    return {
      selected: selected.length,
      total,
      percentage,
      isComplete: selected.length >= 3, // Minimum 3 items for a complete outfit
    };
  }, [selectedItems]);

  // ===== CATEGORY FILTERING =====

  /**
   * Get filtered items by active category
   */
  const filteredItems = useMemo(() => {
    if (activeCategory === 'all') {
      return localItems;
    }
    return localItems.filter(item => item.category === activeCategory);
  }, [activeCategory, localItems]);

  /**
   * Get items by category with cache optimization
   */
  const getItemsByCategory = useCallback(async (category: string) => {
    if (user && dbInitialized) {
      try {
        return await sqliteCache.getItemsByCategory(user.id, category);
      } catch (error) {
        console.error(`❌ Error getting items by category ${category}:`, error);
        return localItems.filter(item => item.category === category);
      }
    }
    return localItems.filter(item => item.category === category);
  }, [user, dbInitialized, localItems]);

  /**
   * Get selection status by category
   */
  const getSelectionStatusByCategory = useCallback((category: string) => {
    return selectedItems[category as keyof SelectedItems] ? 'selected' : 'available';
  }, [selectedItems]);

  /**
   * Format last updated time
   */
  const formatLastUpdated = useCallback((timestamp: string | null) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  }, []);

  // ===== RENDER HELPERS =====

  /**
   * Render wardrobe item with luxury styling and AI indicators
   */
  const renderItem = useCallback(({ item }: { item: CachedWardrobeItem }) => {
    const isSelected = isItemSelected(item);
    const categoryConfig = CATEGORIES.find(cat => cat.id === item.category);
    const hasImage = item.images && item.images.length > 0;
    const hasAITags = item.ai_tags && item.ai_tags.length > 0;

    return (
      <TouchableOpacity
        style={[
          styles.itemContainer,
          isSelected && styles.selectedItemContainer,
        ]}
        onPress={() => toggleItemSelection(item)}
        activeOpacity={0.8}
      >
        {/* Favorite indicator */}
        {item.is_favorite && (
          <Text style={styles.favoriteIcon}>❤️</Text>
        )}

        {/* AI Tag Badge */}
        {hasAITags && (
          <View style={styles.aiTagBadge}>
            <Text style={styles.aiTagText}>AI</Text>
          </View>
        )}

        {/* Selection indicator */}
        {isSelected && (
          <View style={styles.selectionIndicator}>
            <Text style={styles.selectionIcon}>✓</Text>
          </View>
        )}

        {/* Item image */}
        <View style={styles.imageContainer}>
          {hasImage ? (
            <Image
              source={{ uri: item.images[0] }}
              style={styles.itemImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Text style={[styles.placeholderIcon, { color: categoryConfig?.color || COLORS.primary }]}>
                {categoryConfig?.icon || '👔'}
              </Text>
            </View>
          )}
        </View>

        {/* Item details */}
        <View style={styles.itemDetails}>
          <Text style={styles.itemName} numberOfLines={1}>
            {item.name || 'Unnamed Item'}
          </Text>

          {(item.brand || item.size) && (
            <Text style={styles.itemBrand} numberOfLines={1}>
              {item.brand && item.size
                ? `${item.brand} • ${item.size}`
                : item.brand || item.size}
            </Text>
          )}

          {/* Wear count */}
          {item.wear_count > 0 && (
            <Text style={styles.wearCount}>
              Worn {item.wear_count} {item.wear_count === 1 ? 'time' : 'times'}
            </Text>
          )}
        </View>

        {/* Color indicator */}
        {item.color && (
          <View
            style={[
              styles.colorIndicator,
              { backgroundColor: item.color.toLowerCase() },
            ]}
          />
        )}
      </TouchableOpacity>
    );
  }, [isItemSelected, toggleItemSelection, CATEGORIES]);

  /**
   * Render category selector with luxury styling
   */
  const renderCategorySelector = useCallback(({ category }: { category: CategoryConfig }) => {
    const itemCount = localItems.filter(item => item.category === category.id).length;
    const selectionStatus = getSelectionStatusByCategory(category.id);
    const isActive = activeCategory === category.id;
    const hasSelection = selectedItems[category.id as keyof SelectedItems] !== null;

    return (
      <TouchableOpacity
        style={[
          styles.categoryButton,
          isActive && styles.activeCategoryButton,
          hasSelection && { borderColor: category.color, borderWidth: 3 },
        ]}
        onPress={() => setActiveCategory(category.id)}
        activeOpacity={0.8}
      >
        {isActive && (
          <LinearGradient
            colors={category.gradientColors}
            style={styles.categoryGradient}
          />
        )}
        <Text
          style={[
            styles.categoryIcon,
            { color: isActive ? COLORS.textOnPrimary : category.color },
          ]}
        >
          {category.icon}
        </Text>
        <Text
          style={[
            styles.categoryName,
            { color: isActive ? COLORS.textOnPrimary : category.color },
          ]}
        >
          {category.name}
        </Text>
        {itemCount > 0 && (
          <View style={styles.categoryCountBadge}>
            <Text
              style={[
                styles.categoryCount,
                { color: isActive ? COLORS.textOnPrimary : category.color },
              ]}
            >
              {itemCount}
            </Text>
          </View>
        )}
        {hasSelection && (
          <View style={{
            position: 'absolute',
            top: 2,
            left: 2,
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: COLORS.success,
          }} />
        )}
      </TouchableOpacity>
    );
  }, [activeCategory, localItems, selectedItems, getSelectionStatusByCategory, CATEGORIES]);

  /**
   * Render outfit summary
   */
  const renderOutfitSummary = useCallback(() => {
    const selectedOutfit = getSelectedOutfit();
    const hasCompleteOutfit = selectedOutfit.length === 4;

    return (
      <View style={styles.outfitSummary}>
        <View style={styles.outfitHeader}>
          <Text style={styles.outfitTitle}>Selected Outfit</Text>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={clearAllSelections}
            disabled={selectedOutfit.length === 0}
          >
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.outfitItems}>
          {selectedOutfit.length === 0 ? (
            <Text style={styles.noSelectionText}>
              Select 1 item from each category
            </Text>
          ) : (
            selectedOutfit.map((item, index) => (
              <View key={item.id} style={styles.outfitItem}>
                <Text style={styles.outfitItemText}>
                  {CATEGORIES.find(cat => cat.id === item.category)?.icon} {item.name}
                </Text>
              </View>
            ))
          )}
        </View>

        {hasCompleteOutfit && (
          <TouchableOpacity
            style={styles.createOutfitButton}
            onPress={() => {
              Alert.alert(
                'Outfit Created',
                `You've created a complete outfit with ${selectedOutfit.length} items!`,
                [{ text: 'OK', style: 'default' }]
              );
            }}
          >
            <Text style={styles.createOutfitText}>Create Outfit</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }, [getSelectedOutfit, clearAllSelections]);

  /**
   * Render category header
   */
  const renderCategoryHeader = useCallback(({ category }: { category: CategoryConfig }) => {
    const items = getItemsByCategory(category.id);
    const selectionStatus = getSelectionStatusByCategory(category.id);

    return (
      <View style={[styles.categoryHeader, { borderBottomColor: category.color + '20' }]}>
        <View style={styles.categoryHeaderLeft}>
          <Text style={[styles.categoryHeaderIcon, { color: category.color }]}>
            {category.icon}
          </Text>
          <Text style={styles.categoryHeaderText}>
            {category.name} ({items.length})
          </Text>
        </View>

        <View style={styles.categoryHeaderRight}>
          <Text style={[styles.selectionStatusText, { color: category.color }]}>
            {selectionStatus === 'selected' ? 'Selected' : 'Tap to select'}
          </Text>
        </View>
      </View>
    );
  }, [getItemsByCategory, getSelectionStatusByCategory, CATEGORIES]);

  /**
   * Render empty state with luxury styling
   */
  const renderEmptyState = useCallback(() => {
    // Loading state
    if (loading && localItems.length === 0) {
      return (
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading your luxury wardrobe...</Text>
          {!dbInitialized && (
            <Text style={styles.dbStatusText}>Initializing local storage...</Text>
          )}
        </View>
      );
    }

    // Error state
    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>⚠️ Oops!</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchWardrobeItemsWithCache(true)}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Not authenticated state
    if (!isAuthenticated) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>👤</Text>
          <Text style={styles.emptyStateTitle}>Sign In Required</Text>
          <Text style={styles.emptyStateText}>
            Please sign in to view and manage your luxury wardrobe collection
          </Text>
        </View>
      );
    }

    // Empty wardrobe state
    if (localItems.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>👔</Text>
          <Text style={styles.emptyStateTitle}>Your Wardrobe Awaits</Text>
          <Text style={styles.emptyStateText}>
            Start building your luxury collection by adding your first clothing item
          </Text>
          {cacheStatus.isFromCache && (
            <View style={styles.cacheIndicator}>
              <Text style={styles.cacheIndicatorText}>
                📦 Using cached data
              </Text>
            </View>
          )}
        </View>
      );
    }

    return null;
  }, [loading, error, localItems.length, isAuthenticated, dbInitialized, fetchWardrobeItemsWithCache, cacheStatus.isFromCache]);

  /**
   * Render list item separator
   */
  const renderSeparator = useCallback(() => (
    <View style={styles.separator} />
  ), []);

  // ===== LIFECYCLE =====

  // Initialize database on mount
  useEffect(() => {
    initializeDatabase();
  }, [initializeDatabase]);

  // Initial load when user is authenticated and DB is ready
  useEffect(() => {
    if (isAuthenticated && user && dbInitialized) {
      fetchWardrobeItemsWithCache();
    }
  }, [isAuthenticated, user, dbInitialized, fetchWardrobeItemsWithCache]);

  // Refresh when screen focuses (with debouncing)
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated && user && dbInitialized && localItems.length === 0) {
        const timer = setTimeout(() => {
          fetchWardrobeItemsWithCache();
        }, 500);
        return () => clearTimeout(timer);
      }
    }, [isAuthenticated, user, dbInitialized, localItems.length, fetchWardrobeItemsWithCache])
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      sqliteCache.close();
    };
  }, []);

  // ===== MAIN RENDER =====

  const completion = getOutfitCompletion();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Connection Status */}
      <RealtimeConnectionStatus isConnected={true} />

      {/* Premium Header with Outfit Summary */}
      <View style={styles.premiumHeader}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>My Wardrobe</Text>
          <View style={styles.cacheStatusContainer}>
            {cacheStatus.isFromCache && (
              <View style={styles.cacheIndicator}>
                <Text style={styles.cacheIndicatorText}>
                  📦 Cached • {formatLastUpdated(cacheStatus.lastUpdated)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Outfit Progress */}
        <View style={styles.outfitProgress}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Today's Outfit</Text>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={clearAllSelections}
              disabled={completion.selected === 0}
            >
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${completion.percentage}%`,
                  backgroundColor: completion.isComplete ? COLORS.success : COLORS.primary,
                }
              ]}
            />
          </View>

          <Text style={styles.progressText}>
            {completion.selected}/{completion.total} items selected
            {completion.isComplete && ' • Ready to wear! ✨'}
          </Text>
        </View>

        {/* Selected Items Preview */}
        {completion.selected > 0 && (
          <View style={styles.selectedItemsPreview}>
            {getSelectedOutfit().map((item) => (
              <View key={item.id} style={styles.selectedItem}>
                <Text style={styles.selectedItemIcon}>
                  {CATEGORIES.find(cat => cat.id === item.category)?.icon}
                </Text>
                <Text style={styles.selectedItemName} numberOfLines={1}>
                  {item.name}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Luxury Category Selector */}
      <View style={styles.categorySelector}>
        {/* All Categories Button */}
        <TouchableOpacity
          style={[
            styles.categoryButton,
            styles.allCategoryButton,
            activeCategory === 'all' && styles.activeCategoryButton,
          ]}
          onPress={() => setActiveCategory('all')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={activeCategory === 'all' ? CATEGORIES[0].gradientColors : ['transparent']}
            style={styles.categoryGradient}
          />
          <Text
            style={[
              styles.categoryIcon,
              { color: activeCategory === 'all' ? COLORS.textOnPrimary : COLORS.primary },
            ]}
          >
            👔
          </Text>
          <Text
            style={[
              styles.categoryName,
              { color: activeCategory === 'all' ? COLORS.textOnPrimary : COLORS.primary },
            ]}
          >
            All
          </Text>
          <View style={styles.categoryCountBadge}>
            <Text
              style={[
                styles.categoryCount,
                { color: activeCategory === 'all' ? COLORS.textOnPrimary : COLORS.primary },
              ]}
            >
              {localItems.length}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Category Buttons */}
        {CATEGORIES.map(category => renderCategorySelector({ category }))}
      </View>

      {/* Cache Status Banner */}
      {cacheStatus.isStale && cacheStatus.isFromCache && (
        <View style={styles.staleCacheBanner}>
          <Text style={styles.staleCacheText}>
            🔄 Content may be outdated. Pull to refresh.
          </Text>
        </View>
      )}

      {/* Items List */}
      {filteredItems.length === 0 ? (
        renderEmptyState()
      ) : activeCategory === 'all' ? (
        <FlatList
          data={CATEGORIES}
          renderItem={({ item: category }) => (
            <View key={category.id}>
              {renderCategoryHeader({ category })}
              <FlatList
                data={getItemsByCategory(category.id)}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                numColumns={ITEMS_PER_ROW}
                contentContainerStyle={styles.categoryList}
                ItemSeparatorComponent={renderSeparator}
                scrollEnabled={false}
              />
            </View>
          )}
          keyExtractor={(category) => category.id}
          contentContainerStyle={styles.allCategoriesList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={filteredItems}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={ITEMS_PER_ROW}
          contentContainerStyle={styles.singleCategoryList}
          ItemSeparatorComponent={renderSeparator}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={() => renderCategoryHeader(CATEGORIES.find(cat => cat.id === activeCategory)!)}
        />
      )}
    </View>
  );
};

// ===== STYLES =====
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Premium Header
  premiumHeader: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: PADDING,
    paddingVertical: SIZES.lg,
    borderBottomLeftRadius: SIZES.radius.xl,
    borderBottomRightRadius: SIZES.radius.xl,
    marginBottom: SIZES.md,
    ...StyleHelpers.createShadow(COLORS.shadow, 3),
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  headerTitle: {
    fontSize: FONTS.sizes.xl,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  cacheStatusContainer: {
    alignItems: 'flex-end',
  },

  // Outfit Progress
  outfitProgress: {
    marginBottom: SIZES.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  progressTitle: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.text,
  },
  clearButton: {
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.xs,
    backgroundColor: 'transparent',
    borderRadius: SIZES.radius.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  clearButtonText: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONTS.families.primary,
    color: COLORS.textSecondary,
    fontWeight: FONTS.weight.medium,
  },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.borderLight,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: SIZES.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.families.primary,
    color: COLORS.textSecondary,
  },

  // Selected Items Preview
  selectedItemsPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.sm,
  },
  selectedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.xs,
    backgroundColor: COLORS.primary + '10',
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.radius.sm,
    borderLeftWidth: 2,
    borderLeftColor: COLORS.primary,
  },
  selectedItemIcon: {
    fontSize: FONTS.sizes.sm,
  },
  selectedItemName: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONTS.families.primary,
    color: COLORS.text,
    fontWeight: FONTS.weight.medium,
  },
  outfitItems: {
    gap: SIZES.sm,
  },
  outfitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.sm,
    paddingVertical: SIZES.xs,
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: SIZES.radius.sm,
    paddingHorizontal: SIZES.sm,
  },
  outfitItemText: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.families.primary,
    color: COLORS.text,
  },
  noSelectionText: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.families.primary,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  createOutfitButton: {
    marginTop: SIZES.md,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius.md,
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.lg,
    alignItems: 'center',
    ...StyleHelpers.createShadow(COLORS.primary, 4),
  },
  createOutfitText: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.textOnPrimary,
  },

  // Category Selector
  categorySelector: {
    flexDirection: 'row',
    paddingVertical: SIZES.md,
    paddingHorizontal: PADDING,
    backgroundColor: COLORS.surface,
    marginBottom: SIZES.md,
    gap: SIZES.sm,
    ...StyleHelpers.createShadow(COLORS.shadow, 2),
  },
  categoryButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.xs,
    borderRadius: SIZES.radius.lg,
    borderWidth: 2,
    borderColor: COLORS.borderLight,
    minWidth: 70,
    position: 'relative',
    overflow: 'hidden',
  },
  allCategoryButton: {
    marginRight: SIZES.md,
  },
  activeCategoryButton: {
    transform: [{ scale: 1.05 }],
    borderColor: COLORS.primary,
    ...StyleHelpers.createShadow(COLORS.primary, 3),
  },
  categoryGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: SIZES.radius.lg,
  },
  categoryIcon: {
    fontSize: FONTS.sizes.xl,
    marginBottom: 2,
    fontFamily: FONTS.families.primary,
    zIndex: 1,
  },
  categoryName: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.semibold,
    zIndex: 1,
  },
  categoryCountBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  categoryCount: {
    fontSize: FONTS.sizes.xxs,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.bold,
    color: COLORS.textOnAccent,
  },

  // Cache Indicators
  cacheIndicator: {
    backgroundColor: COLORS.primary + '10',
    paddingVertical: SIZES.xs,
    paddingHorizontal: SIZES.sm,
    borderRadius: SIZES.radius.sm,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  cacheIndicatorText: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONTS.families.primary,
    color: COLORS.primary,
    fontWeight: FONTS.weight.medium,
  },
  staleCacheBanner: {
    backgroundColor: COLORS.warning + '15',
    paddingVertical: SIZES.sm,
    paddingHorizontal: PADDING,
    marginHorizontal: PADDING,
    marginBottom: SIZES.sm,
    borderRadius: SIZES.radius.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.warning,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  staleCacheText: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.families.primary,
    color: COLORS.warning,
    fontWeight: FONTS.weight.medium,
  },

  // Category Headers
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.lg,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
  },
  categoryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.sm,
  },
  categoryHeaderIcon: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.families.primary,
  },
  categoryHeaderText: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.text,
  },
  categoryHeaderRight: {
    alignItems: 'center',
  },
  selectionStatusText: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.medium,
  },

  // Items List
  allCategoriesList: {
    paddingHorizontal: PADDING,
  },
  singleCategoryList: {
    paddingHorizontal: PADDING,
  },
  categoryList: {
    paddingHorizontal: PADDING,
  },
  itemContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius.lg,
    borderWidth: 2,
    borderColor: COLORS.borderLight,
    marginBottom: ITEM_SPACING,
    padding: SIZES.sm,
    ...StyleHelpers.createShadow(COLORS.shadow, 3),
    position: 'relative',
    overflow: 'hidden',
  },
  selectedItemContainer: {
    borderColor: COLORS.primary,
    borderWidth: 3,
    transform: [{ scale: 1.02 }],
    backgroundColor: COLORS.primary + '5',
    ...StyleHelpers.createShadow(COLORS.primary, 4),
  },
  selectionIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    ...StyleHelpers.createShadow(COLORS.shadow, 2),
  },
  selectionIcon: {
    color: COLORS.textOnPrimary,
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.bold,
  },
  imageContainer: {
    width: ITEM_WIDTH - (SIZES.sm * 2),
    height: ITEM_HEIGHT - 100,
    borderRadius: SIZES.radius.md,
    overflow: 'hidden',
    marginBottom: SIZES.sm,
    backgroundColor: COLORS.background,
  },
  itemImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceVariant,
  },
  placeholderIcon: {
    fontSize: FONTS.sizes.xxl,
    opacity: 0.3,
  },
  itemDetails: {
    flex: 1,
    gap: 2,
  },
  itemName: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.text,
    letterSpacing: -0.2,
  },
  itemBrand: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONTS.families.primary,
    color: COLORS.textSecondary,
    fontWeight: FONTS.weight.medium,
  },
  wearCount: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONTS.families.primary,
    color: COLORS.textLight,
    fontStyle: 'italic',
  },
  favoriteIcon: {
    fontSize: FONTS.sizes.sm,
    position: 'absolute',
    top: 8,
    left: 8,
    opacity: 0.8,
  },
  colorIndicator: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.surface,
    ...StyleHelpers.createShadow(COLORS.shadow, 1),
  },
  aiTagBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: COLORS.accent + '20',
    paddingHorizontal: SIZES.xs,
    paddingVertical: 2,
    borderRadius: SIZES.radius.xs,
  },
  aiTagText: {
    fontSize: FONTS.sizes.xxs,
    fontFamily: FONTS.families.primary,
    color: COLORS.accent,
    fontWeight: FONTS.weight.semibold,
  },

  // Separator
  separator: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginHorizontal: PADDING,
    marginVertical: SIZES.sm,
  },

  // Loading and Empty States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SIZES.xxxl,
  },
  loadingText: {
    marginTop: SIZES.md,
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.families.primary,
    color: COLORS.textSecondary,
    fontWeight: FONTS.weight.medium,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: PADDING * 2,
    paddingVertical: SIZES.xxxl,
  },
  emptyStateTitle: {
    fontSize: FONTS.sizes.xl,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SIZES.md,
    letterSpacing: -0.5,
  },
  emptyStateText: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.families.primary,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: FONTS.lineHeight.relaxed,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: SIZES.lg,
    opacity: 0.3,
  },

  // Error State
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: PADDING * 2,
    paddingVertical: SIZES.xxxl,
  },
  errorTitle: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: SIZES.md,
  },
  errorText: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.families.primary,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: FONTS.lineHeight.relaxed,
    marginBottom: SIZES.lg,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.xl,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radius.md,
    ...StyleHelpers.createShadow(COLORS.primary, 3),
  },
  retryButtonText: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.textOnPrimary,
  },

  // Database Status
  dbStatusIndicator: {
    position: 'absolute',
    top: SIZES.sm,
    right: SIZES.sm,
    paddingVertical: SIZES.xs,
    paddingHorizontal: SIZES.sm,
    borderRadius: SIZES.radius.sm,
    backgroundColor: COLORS.info + '20',
  },
  dbStatusText: {
    fontSize: FONTS.sizes.xxs,
    fontFamily: FONTS.families.primary,
    color: COLORS.info,
    fontWeight: FONTS.weight.semibold,
  },
});

export default WardrobeScreen;