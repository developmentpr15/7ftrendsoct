// Legacy App Store - Compatibility Layer
// This file provides backward compatibility while migrating to modular stores

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import from new modular stores
import {
  useSessionStore,
  useFeedStore,
  useCompetitionStore,
  useWardrobeStore,
  User as SessionUser,
  Competition,
  WardrobeItem,
  Outfit,
} from './index';

// Legacy interfaces for backward compatibility
export interface LegacyUser {
  id: string;
  username: string;
  avatar: string;
  full_name?: string;
  location?: string;
  country?: string;
  preferences?: any;
}

export interface LegacyPost {
  id: number;
  username: string;
  avatar: string;
  outfit: string;
  items: string[];
  likes: number;
  comments: number;
  isLiked: boolean;
  image: string;
  timestamp: string;
}

export interface LegacyCompetition {
  id: number;
  title: string;
  description: string;
  icon: string;
  participants: number;
  deadline: string;
  isActive: boolean;
  isGlobal: boolean;
  eligibleCountries?: string[];
  region?: string;
  userJoined: boolean;
  canJoin: boolean;
  daysRemaining: number;
  countryFlag?: string;
  prize?: string;
  requirements?: string[];
}

// Legacy App Store (for backward compatibility)
interface LegacyAppStore {
  // Legacy wardrobe items
  wardrobeItems: any[];
  // Legacy posts
  posts: LegacyPost[];
  // Legacy competitions
  competitions: LegacyCompetition[];
  // Country-specific leaderboards
  competitionLeaderboards: Record<string, any>;
  // User's country
  userCountry: string;
  // AR Photos
  arPhotos: any[];
  // Selected category
  selectedCategory: string | null;

  // Legacy actions (maintained for compatibility)
  addWardrobeItem: (item: any) => void;
  removeWardrobeItem: (id: number) => void;
  updateWardrobeItem: (id: number, updates: any) => void;
  toggleLike: (postId: number) => void;
  addComment: (postId: number, comment: string) => void;
  joinCompetition: (competitionId: number) => void;
  setUserCountry: (country: string) => void;
  updateCompetitionLeaderboard: (competitionId: number, leaderboard: any) => void;
  createCompetition: (competitionData: any) => void;
  captureARPhoto: (photo: any) => void;
  deleteARPhoto: (id: number) => void;
  setSelectedCategory: (category: string | null) => void;
  pickImage: () => Promise<any>;
  takePhoto: () => Promise<any>;
  getWardrobeStats: () => any;
  getFavoriteItems: () => any[];
  getOutfitSuggestions: () => any[];
}

export const useAppStore = create<LegacyAppStore>()(
  persist(
    (set, get) => ({
      // Legacy data - maintained for backward compatibility
      wardrobeItems: [],
      posts: [],
      competitions: [],
      competitionLeaderboards: {},
      userCountry: 'US',
      arPhotos: [],
      selectedCategory: null,

      // Legacy actions - compatibility layer
      addWardrobeItem: (item) => {
        // Convert legacy item to new format and add to wardrobe store
        const modernItem: Partial<WardrobeItem> = {
          name: item.name || 'New Item',
          description: item.description,
          category: item.category || 'top',
          color: item.color || 'unknown',
          images: item.images || [],
          tags: item.tags || [],
          is_favorite: item.isFavorite || false,
          is_available: true,
          wear_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        // Use the new wardrobe store
        const { addItem } = useWardrobeStore.getState();
        addItem(modernItem);
      },

      removeWardrobeItem: (id) => {
        const { wardrobeItems } = get();
        const updatedItems = wardrobeItems.filter(item => item.id !== id);
        set({ wardrobeItems: updatedItems });
      },

      updateWardrobeItem: (id, updates) => {
        const { wardrobeItems } = get();
        const updatedItems = wardrobeItems.map(item =>
          item.id === id ? { ...item, ...updates } : item
        );
        set({ wardrobeItems: updatedItems });
      },

      toggleLike: (postId) => {
        const { posts } = get();
        const updatedPosts = posts.map(post =>
          post.id === postId
            ? {
                ...post,
                isLiked: !post.isLiked,
                likes: post.isLiked ? post.likes - 1 : post.likes + 1
              }
            : post
        );
        set({ posts: updatedPosts });
      },

      addComment: (postId, comment) => {
        const { posts } = get();
        const updatedPosts = posts.map(post =>
          post.id === postId ? { ...post, comments: post.comments + 1 } : post
        );
        set({ posts: updatedPosts });
      },

      joinCompetition: (competitionId) => {
        const { competitions } = get();
        const updatedCompetitions = competitions.map(competition =>
          competition.id === competitionId
            ? {
                ...competition,
                participants: competition.participants + 1,
                userJoined: true
              }
            : competition
        );
        set({ competitions: updatedCompetitions });
      },

      setUserCountry: (country) => {
        set({ userCountry: country });
        // Also update user profile in session store
        const { updateProfile } = useSessionStore.getState();
        updateProfile({ country });
      },

      updateCompetitionLeaderboard: (competitionId, leaderboard) => {
        set({
          competitionLeaderboards: {
            ...get().competitionLeaderboards,
            [competitionId]: leaderboard
          }
        });
      },

      createCompetition: (competitionData) => {
        const newCompetition = {
          id: Date.now(),
          ...competitionData,
          participants: 0,
          userJoined: false,
          isActive: true,
          daysRemaining: competitionData.daysRemaining || 7,
        };
        set({
          competitions: [newCompetition, ...get().competitions]
        });
        return newCompetition.id;
      },

      captureARPhoto: (photo) => {
        const { arPhotos } = get();
        set({
          arPhotos: [
            ...arPhotos,
            {
              ...photo,
              id: Date.now(),
              timestamp: new Date().toISOString(),
            }
          ]
        });
      },

      deleteARPhoto: (id) => {
        const { arPhotos } = get();
        set({
          arPhotos: arPhotos.filter(photo => photo.id !== id)
        });
      },

      setSelectedCategory: (category) => {
        set({ selectedCategory: category });
      },

      pickImage: async () => {
        // Use existing image picker logic
        try {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 5],
            quality: 1,
          });

          return result;
        } catch (error) {
          console.error('Error picking image:', error);
          return null;
        }
      },

      takePhoto: async () => {
        try {
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 5],
            quality: 1,
          });

          return result;
        } catch (error) {
          console.error('Error taking photo:', error);
          return null;
        }
      },

      getWardrobeStats: () => {
        const { wardrobeItems } = get();
        const stats = {
          total: wardrobeItems.length,
          byCategory: wardrobeItems.reduce((acc, item) => {
            acc[item.category] = (acc[item.category] || 0) + 1;
            return acc;
          }, {})
        };
        return stats;
      },

      getFavoriteItems: () => {
        const { wardrobeItems } = get();
        return wardrobeItems.filter(item => item.is_favorite);
      },

      getOutfitSuggestions: () => {
        const { wardrobeItems } = get();
        const categories = ['top', 'bottom', 'shoes'];
        const suggestions = [];

        for (let i = 0; i < 5; i++) {
          const outfit = categories.map(category => {
            const categoryItems = wardrobeItems.filter(item => item.category === category);
            return categoryItems.length > 0
              ? categoryItems[Math.floor(Math.random() * categoryItems.length)]
              : null;
          }).filter(Boolean);

          if (outfit.length > 0) {
            suggestions.push({
              id: Date.now() + i,
              items: outfit,
              name: `Outfit ${i + 1}`,
              occasion: ['Casual', 'Business', 'Weekend'][Math.floor(Math.random() * 3)]
            });
          }
        }

        return suggestions;
      },
    }),
    {
      name: '7ftrends-app-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        wardrobeItems: state.wardrobeItems,
        posts: state.posts,
        competitions: state.competitions,
        userCountry: state.userCountry,
        selectedCategory: state.selectedCategory,
      }),
    }
  )
);

// Migration utilities
export const migrateToModularStores = async () => {
  try {
    console.log('🔄 Migrating legacy app store to modular stores...');

    const legacyStore = useAppStore.getState();

    // Migrate wardrobe items
    if (legacyStore.wardrobeItems.length > 0) {
      console.log(`Migrating ${legacyStore.wardrobeItems.length} wardrobe items`);
      const { addItem } = useWardrobeStore.getState();

      for (const legacyItem of legacyStore.wardrobeItems) {
        await addItem({
          name: legacyItem.name || 'Migrated Item',
          description: legacyItem.description,
          category: legacyItem.category || 'top',
          color: legacyItem.color || 'unknown',
          images: legacyItem.images || [],
          tags: legacyItem.tags || [],
          is_favorite: legacyItem.isFavorite || false,
          created_at: legacyItem.created_at || new Date().toISOString(),
          metadata: {
            migrated_from_legacy: true,
            original_id: legacyItem.id,
          },
        });
      }
    }

    // Migrate competitions
    if (legacyStore.competitions.length > 0) {
      console.log(`Migrating ${legacyStore.competitions.length} competitions`);
      // Competition migration logic here
    }

    // Clear legacy store after migration
    // This can be uncommented when migration is complete
    // useAppStore.persist.clearStorage();

    console.log('✅ Migration to modular stores completed');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
};

// Enhanced hooks that combine legacy and new stores
export const useEnhancedSession = () => {
  const legacy = useAppStore();
  const modern = useSessionStore();

  return {
    // Legacy compatibility
    userCountry: legacy.userCountry,
    selectedCategory: legacy.selectedCategory,

    // Modern session state
    user: modern.user,
    isAuthenticated: modern.isAuthenticated,
    isLoading: modern.isLoading,

    // Combined
    userCountryOrLegacy: modern.user?.country || legacy.userCountry,
  };
};

export const useEnhancedFeed = () => {
  const legacy = useAppStore();
  const modern = useFeedStore();

  return {
    // Legacy posts (for backward compatibility)
    legacyPosts: legacy.posts,

    // Modern feed state
    posts: modern.posts,
    loading: modern.loading,
    analytics: modern.analytics,
    offlineMode: modern.offlineMode,

    // Actions
    toggleLike: legacy.toggleLike,
    addComment: legacy.addComment,
    fetchFeed: modern.fetchFeed,
    refreshFeed: modern.refreshFeed,
    likePost: modern.likePost,
    unlikePost: modern.unlikePost,
  };
};

export const useEnhancedCompetitions = () => {
  const legacy = useAppStore();
  const modern = useCompetitionStore();

  return {
    // Legacy competitions
    legacyCompetitions: legacy.competitions,

    // Modern competition state
    competitions: modern.competitions,
    userEntries: modern.userEntries,
    leaderboard: modern.leaderboard,

    // Actions
    joinCompetition: legacy.joinCompetition,
    fetchCompetitions: modern.fetchCompetitions,
    submitEntry: modern.submitEntry,
    voteForEntry: modern.voteForEntry,
  };
};

export const useEnhancedWardrobe = () => {
  const legacy = useAppStore();
  const modern = useWardrobeStore();

  return {
    // Legacy wardrobe items
    legacyItems: legacy.wardrobeItems,

    // Modern wardrobe state
    items: modern.wardrobeItems,
    outfits: modern.outfits,
    stats: modern.stats,

    // AR
    arPhotos: legacy.arPhotos,
    currentARSession: modern.currentARSession,

    // Actions
    addWardrobeItem: legacy.addWardrobeItem,
    removeWardrobeItem: legacy.removeWardrobeItem,
    updateWardrobeItem: legacy.updateWardrobeItem,
    addItem: modern.addWardrobeItem,
    createOutfit: modern.createOutfit,
    createARSession: modern.createARSession,
  };
};

// Default export for backward compatibility
export default useAppStore;