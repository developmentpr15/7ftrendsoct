import { create } from 'zustand';
import * as ImagePicker from 'expo-image-picker';

const useAppStore = create((set, get) => ({
  // Wardrobe items
  wardrobeItems: [],

  // Posts
  posts: [
    {
      id: 1,
      username: 'fashionista_22',
      avatar: '👚',
      outfit: 'Summer casual with denim jacket',
      items: ['denim jacket', 'white t-shirt', 'black jeans'],
      likes: 245,
      comments: 18,
      isLiked: false,
      image: 'https://picsum.photos/seed/outfit1/400/500',
      timestamp: '2 hours ago'
    },
    {
      id: 2,
      username: 'styleguru',
      avatar: '👗',
      outfit: 'Business casual meeting look',
      items: ['navy blazer', 'white shirt', 'khaki pants'],
      likes: 189,
      comments: 12,
      isLiked: false,
      image: 'https://picsum.photos/seed/outfit2/400/500',
      timestamp: '4 hours ago'
    },
    {
      id: 3,
      username: 'trendsetter',
      avatar: '👔',
      outfit: 'Weekend brunch ready',
      items: ['linen shirt', 'chinos', 'loafers'],
      likes: 312,
      comments: 24,
      isLiked: true,
      image: 'https://picsum.photos/seed/outfit3/400/500',
      timestamp: '6 hours ago'
    }
  ],

  // Competitions with country awareness
  competitions: [
    {
      id: 1,
      title: 'Summer Vibes USA',
      description: 'Show your best summer outfit - Americas Only',
      icon: '☀️',
      participants: 156,
      deadline: '3 days left',
      isActive: true,
      isGlobal: false,
      eligibleCountries: ['US', 'CA', 'MX', 'BR', 'AR'],
      region: 'Americas',
      userJoined: false,
      canJoin: true,
      daysRemaining: 3,
      countryFlag: '🇺🇸'
    },
    {
      id: 2,
      title: 'Office Style Europe',
      description: 'Professional look for work - Europe Only',
      icon: '💼',
      participants: 89,
      deadline: '5 days left',
      isActive: true,
      isGlobal: false,
      eligibleCountries: ['GB', 'FR', 'DE', 'IT', 'ES', 'NL', 'BE'],
      region: 'Europe',
      userJoined: false,
      canJoin: false,
      daysRemaining: 5,
      countryFlag: '🇬🇧'
    },
    {
      id: 3,
      title: 'Global Fashion Week',
      description: 'Showcase your best outfit - Open to all countries',
      icon: '🌍',
      participants: 523,
      deadline: '1 week left',
      isActive: true,
      isGlobal: true,
      eligibleCountries: null,
      region: null,
      userJoined: false,
      canJoin: true,
      daysRemaining: 7,
      countryFlag: '🌍'
    },
    {
      id: 4,
      title: 'Date Night Asia',
      description: 'Perfect outfit for a special evening - Asia Pacific',
      icon: '💕',
      participants: 234,
      deadline: '4 days left',
      isActive: false,
      isGlobal: false,
      eligibleCountries: ['JP', 'KR', 'CN', 'IN', 'SG', 'TH', 'PH'],
      region: 'Asia',
      userJoined: false,
      canJoin: false,
      daysRemaining: 4,
      countryFlag: '🇯🇵'
    }
  ],

  // Country-specific leaderboards
  competitionLeaderboards: {},
  userCountry: 'US',

  // AR Photos
  arPhotos: [],
  selectedCategory: null,

  // Wardrobe Actions
  addWardrobeItem: (item) => {
    set((state) => ({
      wardrobeItems: [...state.wardrobeItems, { ...item, id: Date.now() }]
    }));
  },

  removeWardrobeItem: (id) => {
    set((state) => ({
      wardrobeItems: state.wardrobeItems.filter(item => item.id !== id)
    }));
  },

  updateWardrobeItem: (id, updates) => {
    set((state) => ({
      wardrobeItems: state.wardrobeItems.map(item =>
        item.id === id ? { ...item, ...updates } : item
      )
    }));
  },

  // Post Actions
  toggleLike: (postId) => {
    set((state) => ({
      posts: state.posts.map(post =>
        post.id === postId
          ? {
              ...post,
              isLiked: !post.isLiked,
              likes: post.isLiked ? post.likes - 1 : post.likes + 1
            }
          : post
      )
    }));
  },

  addComment: (postId, comment) => {
    set((state) => ({
      posts: state.posts.map(post =>
        post.id === postId
          ? { ...post, comments: post.comments + 1 }
          : post
      )
    }));
  },

  // Competition Actions
  joinCompetition: (competitionId) => {
    set((state) => ({
      competitions: state.competitions.map(competition =>
        competition.id === competitionId
          ? { ...competition, participants: competition.participants + 1, userJoined: true }
          : competition
      )
    }));
  },

  // Set user's country
  setUserCountry: (country) => {
    set({ userCountry: country });
  },

  // Update competition leaderboards
  updateCompetitionLeaderboard: (competitionId, leaderboard) => {
    set((state) => ({
      competitionLeaderboards: {
        ...state.competitionLeaderboards,
        [competitionId]: leaderboard
      }
    }));
  },

  // Create new competition with country settings
  createCompetition: (competitionData) => {
    const newCompetition = {
      id: Date.now(),
      ...competitionData,
      participants: 0,
      userJoined: false,
      isActive: true,
      daysRemaining: competitionData.daysRemaining || 7,
    };
    set((state) => ({
      competitions: [newCompetition, ...state.competitions]
    }));
    return newCompetition.id;
  },

  // AR Photo Actions
  captureARPhoto: (photo) => {
    set((state) => ({
      arPhotos: [...state.arPhotos, { ...photo, id: Date.now(), timestamp: new Date().toISOString() }]
    }));
  },

  deleteARPhoto: (id) => {
    set((state) => ({
      arPhotos: state.arPhotos.filter(photo => photo.id !== id)
    }));
  },

  // Category Actions
  setSelectedCategory: (category) => {
    set({ selectedCategory: category });
  },

  // Image Picker
  pickImage: async () => {
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

  // Stats
  getWardrobeStats: () => {
    const items = get().wardrobeItems;
    return {
      total: items.length,
      byCategory: items.reduce((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
      }, {})
    };
  },

  getFavoriteItems: () => {
    return get().wardrobeItems.filter(item => item.isFavorite);
  },

  getOutfitSuggestions: () => {
    const items = get().wardrobeItems;
    const categories = ['top', 'bottom', 'shoes'];
    const suggestions = [];

    for (let i = 0; i < 5; i++) {
      const outfit = categories.map(category => {
        const categoryItems = items.filter(item => item.category === category);
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
  }
}));

export default useAppStore;