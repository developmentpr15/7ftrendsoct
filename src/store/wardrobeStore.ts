import { create } from 'zustand';
import { persist, createJSONStorage, subscribeWithSelector } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../utils/supabase';
import { useSessionStore } from './sessionStore';
import { visionService, WardrobeAIFields } from '../services/visionService';

// Types
export interface WardrobeItem {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  category: 'top' | 'bottom' | 'dress' | 'outerwear' | 'shoes' | 'accessories' | 'underwear';
  subcategory?: string;
  brand?: string;
  color: string;
  secondary_colors?: string[];
  size?: string;
  material?: string;
  style?: string;
  occasion?: string[];
  season?: string[];
  pattern?: string;
  images: string[];
  tags: string[];
  purchase_date?: string;
  purchase_price?: number;
  purchase_location?: string;
  care_instructions?: string[];
  is_favorite: boolean;
  is_available: boolean;
  is_clean: boolean;
  last_worn?: string;
  wear_count: number;
  condition: 'new' | 'excellent' | 'good' | 'fair' | 'poor';
  quality_score: number; // 1-10
  sustainability_score?: number; // 1-10
  metadata?: {
    ar_model_url?: string;
    ar_thumbnail_url?: string;
    outfit_history?: string[];
    cleaning_schedule?: any;
    storage_location?: string;
    insurance_info?: any;
  };
  // AI-generated fields
  ai_tags: string[];
  ai_category: string | null;
  ai_colors: string[];
  ai_occasions: string[];
  ai_seasons: string[];
  ai_style: string | null;
  ai_materials: string[];
  ai_confidence: number | null;
  ai_processed_at: string | null;
  ai_status: 'pending' | 'processing' | 'completed' | 'failed';
  ai_error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface Outfit {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  items: string[]; // wardrobe item IDs
  occasion: string;
  season?: string;
  style_tags: string[];
  images: string[];
  is_favorite: boolean;
  is_public: boolean;
  likes_count: number;
  shares_count: number;
  wear_count: number;
  last_worn?: string;
  temperature_range?: {
    min: number;
    max: number;
  };
  weather_conditions?: string[];
  notes?: string;
  metadata?: {
    ar_config?: any;
    styling_tips?: string[];
    occasions_suitable?: string[];
    colorPalette?: string[];
    duplicated_from?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface OutfitSuggestion {
  id: string;
  user_id: string;
  title: string;
  description: string;
  items: string[];
  weather_data?: any;
  occasion: string;
  style_tags: string[];
  confidence_score: number;
  is_saved: boolean;
  is_worn: boolean;
  worn_date?: string;
  metadata?: any;
  created_at: string;
}

export interface ARSession {
  id: string;
  user_id: string;
  session_type: 'try_on' | 'outfit_preview' | 'styling' | 'shopping';
  items: string[];
  outfit_id?: string;
  camera_settings: {
    lighting?: string;
    background?: string;
    filters?: string[];
  };
  captures: {
    id: string;
    image_url: string;
    thumbnail_url: string;
    settings: any;
    created_at: string;
  }[];
  session_data: any;
  duration_seconds: number;
  is_completed: boolean;
  shared_to?: string[];
  created_at: string;
  updated_at: string;
}

export interface WardrobeFilter {
  category?: WardrobeItem['category'][];
  color?: string[];
  size?: string[];
  brand?: string[];
  occasion?: string[];
  season?: string[];
  style?: string[];
  material?: string[];
  availability?: 'all' | 'available' | 'in_use' | 'in_laundry';
  favorite_only?: boolean;
  search_query?: string;
}

export interface OutfitFilter {
  occasion?: string[];
  season?: string[];
  style?: string[];
  items_count?: {
    min?: number;
    max?: number;
  };
  favorite_only?: boolean;
  public_only?: boolean;
  search_query?: string;
}

interface WardrobeStore {
  // State
  wardrobeItems: WardrobeItem[];
  outfits: Outfit[];
  outfitSuggestions: OutfitSuggestion[];
  arSessions: ARSession[];
  currentARSession: ARSession | null;
  loading: boolean;
  refreshing: boolean;
  uploading: boolean;
  saving: boolean;
  error: string | null;
  wardrobeFilter: WardrobeFilter;
  outfitFilter: OutfitFilter;
  pagination: {
    items: {
      hasNextPage: boolean;
      currentPage: number;
      itemsPerPage: number;
    };
    outfits: {
      hasNextPage: boolean;
      currentPage: number;
      itemsPerPage: number;
    };
  };
  stats: {
    total_items: number;
    items_by_category: Record<string, number>;
    items_by_color: Record<string, number>;
    total_outfits: number;
    favorite_items: number;
    items_in_rotation: number;
    total_value: number;
  } | null;

  // Wardrobe Item Actions
  fetchWardrobeItems: (refresh?: boolean) => Promise<void>;
  addWardrobeItem: (itemData: Partial<WardrobeItem>) => Promise<{ success: boolean; itemId?: string; error?: string }>;
  updateWardrobeItem: (itemId: string, updates: Partial<WardrobeItem>) => Promise<{ success: boolean; error?: string }>;
  deleteWardrobeItem: (itemId: string) => Promise<{ success: boolean; error?: string }>;
  uploadItemImage: (itemId: string, imageUri: string) => Promise<{ success: boolean; url?: string; error?: string }>;

  // AI Tagging Actions
  triggerAITagging: (itemId: string, imageUrl: string) => Promise<{ success: boolean; error?: string }>;
  getAITaggingStatus: (itemId: string) => Promise<any>;
  getWardrobeAIFields: (itemId: string) => Promise<WardrobeAIFields | null>;
  mergeAITags: (itemId: string, manualOverride?: boolean) => Promise<{ success: boolean; mergedData?: any; error?: string }>;
  retryAITagging: (itemId: string) => Promise<{ success: boolean; error?: string }>;
  batchAITagging: (itemIds: string[]) => Promise<{ success: boolean; results?: any[]; error?: string }>;
  monitorAITaggingProgress: (itemId: string, onUpdate: (status: any) => void) => void;

  // Outfit Actions
  fetchOutfits: (refresh?: boolean) => Promise<void>;
  createOutfit: (outfitData: Partial<Outfit>) => Promise<{ success: boolean; outfitId?: string; error?: string }>;
  updateOutfit: (outfitId: string, updates: Partial<Outfit>) => Promise<{ success: boolean; error?: string }>;
  deleteOutfit: (outfitId: string) => Promise<{ success: boolean; error?: string }>;
  duplicateOutfit: (outfitId: string) => Promise<{ success: boolean; newOutfitId?: string; error?: string }>;
  wearOutfit: (outfitId: string) => Promise<{ success: boolean; error?: string }>;

  // Outfit Suggestion Actions
  fetchOutfitSuggestions: () => Promise<void>;
  saveOutfitSuggestion: (suggestionId: string) => Promise<{ success: boolean; error?: string }>;
  dismissOutfitSuggestion: (suggestionId: string) => Promise<void>;

  // AR Session Actions
  createARSession: (sessionData: Partial<ARSession>) => Promise<{ success: boolean; sessionId?: string; error?: string }>;
  updateARSession: (sessionId: string, updates: Partial<ARSession>) => Promise<{ success: boolean; error?: string }>;
  addARCapture: (sessionId: string, imageData: any) => Promise<{ success: boolean; captureId?: string; error?: string }>;
  completeARSession: (sessionId: string) => Promise<{ success: boolean; error?: string }>;
  fetchARSessions: () => Promise<void>;

  // Filter and Search
  setWardrobeFilter: (filter: Partial<WardrobeFilter>) => void;
  setOutfitFilter: (filter: Partial<OutfitFilter>) => void;
  clearFilters: () => void;
  searchWardrobe: (query: string) => Promise<WardrobeItem[]>;
  searchOutfits: (query: string) => Promise<Outfit[]>;

  // Analytics and Stats
  calculateStats: () => void;
  getWardrobeValue: () => Promise<number>;
  getItemUsageStats: (itemId: string) => Promise<any>;

  // Utility
  generateOutfitIdeas: (filters: any) => Promise<Outfit[]>;
  categorizeItems: () => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

// Storage configuration for persistence
const storageConfig = {
  name: '7ftrends-wardrobe-storage',
  storage: createJSONStorage(() => AsyncStorage),
  partialize: (state: WardrobeStore) => ({
    wardrobeItems: state.wardrobeItems.slice(0, 50), // Cache first 50 items
    outfits: state.outfits.slice(0, 20), // Cache first 20 outfits
    wardrobeFilter: state.wardrobeFilter,
    outfitFilter: state.outfitFilter,
    stats: state.stats,
  }),
};

export const useWardrobeStore = create<WardrobeStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Initial State
        wardrobeItems: [],
        outfits: [],
        outfitSuggestions: [],
        arSessions: [],
        currentARSession: null,
        loading: false,
        refreshing: false,
        uploading: false,
        saving: false,
        error: null,
        wardrobeFilter: {
          availability: 'all',
        },
        outfitFilter: {},
        pagination: {
          items: {
            hasNextPage: true,
            currentPage: 1,
            itemsPerPage: 20,
          },
          outfits: {
            hasNextPage: true,
            currentPage: 1,
            itemsPerPage: 20,
          },
        },
        stats: null,

        // Wardrobe Item Actions
        fetchWardrobeItems: async (refresh = false) => {
          const state = get();
          const user = useSessionStore.getState().user;

          if (!user) {
            set({ error: 'Not authenticated' });
            return;
          }

          try {
            if (refresh) {
              set({ refreshing: true, error: null });
            } else {
              set({ loading: true, error: null });
            }

            const { data, error } = await supabase
              .from('wardrobe_items')
              .select('*')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false })
              .range(0, state.pagination.items.itemsPerPage * state.pagination.items.currentPage - 1);

            if (error) throw error;

            set({
              wardrobeItems: refresh ? (data || []) : [...state.wardrobeItems, ...(data || [])],
              pagination: {
                ...state.pagination,
                items: {
                  ...state.pagination.items,
                  hasNextPage: (data?.length || 0) === state.pagination.items.itemsPerPage,
                  currentPage: refresh ? 1 : state.pagination.items.currentPage + 1,
                },
              },
            });

            // Update stats
            get().calculateStats();

          } catch (error: any) {
            console.error('Fetch wardrobe items error:', error);
            set({ error: error.message });
          } finally {
            set({ loading: false, refreshing: false });
          }
        },

        addWardrobeItem: async (itemData: Partial<WardrobeItem>) => {
          const user = useSessionStore.getState().user;

          if (!user) {
            return { success: false, error: 'Not authenticated' };
          }

          try {
            set({ uploading: true, error: null });

            const { data, error } = await supabase
              .from('wardrobe_items')
              .insert({
                user_id: user.id,
                name: itemData.name || 'New Item',
                description: itemData.description,
                category: itemData.category || 'top',
                subcategory: itemData.subcategory,
                brand: itemData.brand,
                color: itemData.color || 'unknown',
                secondary_colors: itemData.secondary_colors || [],
                size: itemData.size,
                material: itemData.material,
                style: itemData.style,
                occasion: itemData.occasion || [],
                season: itemData.season || [],
                pattern: itemData.pattern,
                images: itemData.images || [],
                tags: itemData.tags || [],
                purchase_date: itemData.purchase_date,
                purchase_price: itemData.purchase_price,
                purchase_location: itemData.purchase_location,
                care_instructions: itemData.care_instructions || [],
                is_favorite: itemData.is_favorite || false,
                is_available: true,
                is_clean: true,
                wear_count: 0,
                condition: itemData.condition || 'good',
                quality_score: itemData.quality_score || 5,
                sustainability_score: itemData.sustainability_score,
                metadata: itemData.metadata || {},
                // AI fields
                ai_tags: itemData.ai_tags || [],
                ai_category: itemData.ai_category || null,
                ai_colors: itemData.ai_colors || [],
                ai_occasions: itemData.ai_occasions || [],
                ai_seasons: itemData.ai_seasons || [],
                ai_style: itemData.ai_style || null,
                ai_materials: itemData.ai_materials || [],
                ai_confidence: itemData.ai_confidence || null,
                ai_processed_at: itemData.ai_processed_at || null,
                ai_status: itemData.ai_status || 'pending',
                ai_error_message: itemData.ai_error_message || null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .select()
              .single();

            if (error) {
              return { success: false, error: error.message };
            }

            // Update local state
            set({
              wardrobeItems: [data, ...get().wardrobeItems],
            });

            // Update stats
            get().calculateStats();

            return { success: true, itemId: data.id };

          } catch (error: any) {
            return { success: false, error: error.message };
          } finally {
            set({ uploading: false });
          }
        },

        updateWardrobeItem: async (itemId: string, updates: Partial<WardrobeItem>) => {
          try {
            const { error } = await supabase
              .from('wardrobe_items')
              .update({
                ...updates,
                updated_at: new Date().toISOString(),
              })
              .eq('id', itemId);

            if (error) {
              return { success: false, error: error.message };
            }

            // Update local state
            set({
              wardrobeItems: get().wardrobeItems.map(item =>
                item.id === itemId ? { ...item, ...updates } : item
              ),
            });

            // Update stats
            get().calculateStats();

            return { success: true };

          } catch (error: any) {
            return { success: false, error: error.message };
          }
        },

        deleteWardrobeItem: async (itemId: string) => {
          try {
            // Check if item is used in any outfits
            const { data: outfits } = await supabase
              .from('outfits')
              .select('id')
              .contains('items', [itemId]);

            if (outfits && outfits.length > 0) {
              return { success: false, error: 'Cannot delete item that is used in outfits' };
            }

            const { error } = await supabase
              .from('wardrobe_items')
              .delete()
              .eq('id', itemId);

            if (error) {
              return { success: false, error: error.message };
            }

            // Update local state
            set({
              wardrobeItems: get().wardrobeItems.filter(item => item.id !== itemId),
            });

            // Update stats
            get().calculateStats();

            return { success: true };

          } catch (error: any) {
            return { success: false, error: error.message };
          }
        },

        uploadItemImage: async (itemId: string, imageUri: string) => {
          const user = useSessionStore.getState().user;

          if (!user) {
            return { success: false, error: 'Not authenticated' };
          }

          try {
            // Upload to Supabase Storage
            const fileName = `wardrobe-items/${user.id}/${itemId}/${Date.now()}.jpg`;
            const { error: uploadError } = await supabase.storage
              .from('wardrobe-images')
              .upload(fileName, imageUri, {
                contentType: 'image/jpeg',
              });

            if (uploadError) {
              return { success: false, error: uploadError.message };
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
              .from('wardrobe-images')
              .getPublicUrl(fileName);

            // Update item with new image
            const updateResult = await get().updateWardrobeItem(itemId, {
              images: [publicUrl],
            });

            if (!updateResult.success) {
              return updateResult;
            }

            // Trigger AI tagging for the new image
            try {
              await visionService.processImageUpload(itemId, publicUrl, true);
            } catch (aiError) {
              console.warn('AI tagging failed:', aiError);
              // Don't fail the upload if AI tagging fails
            }

            return { success: true, url: publicUrl };

          } catch (error: any) {
            return { success: false, error: error.message };
          }
        },

        // AI Tagging Actions
        triggerAITagging: async (itemId: string, imageUrl: string) => {
          try {
            const result = await visionService.triggerAITagging(itemId, imageUrl);

            // Update local state with processing status
            if (result.success) {
              set({
                wardrobeItems: get().wardrobeItems.map(item =>
                  item.id === itemId
                    ? { ...item, ai_status: 'processing', ai_processed_at: new Date().toISOString() }
                    : item
                ),
              });
            }

            return result;
          } catch (error: any) {
            return { success: false, error: error.message };
          }
        },

        getAITaggingStatus: async (itemId: string) => {
          try {
            return await visionService.getAITaggingStatus(itemId);
          } catch (error: any) {
            console.error('Get AI tagging status error:', error);
            return null;
          }
        },

        getWardrobeAIFields: async (itemId: string) => {
          try {
            return await visionService.getWardrobeAIFields(itemId);
          } catch (error: any) {
            console.error('Get AI fields error:', error);
            return null;
          }
        },

        mergeAITags: async (itemId: string, manualOverride: boolean = false) => {
          try {
            const result = await visionService.mergeAITags(itemId, manualOverride);

            if (result.success && manualOverride) {
              // Refresh the item to get merged data
              await get().fetchWardrobeItems(true);
            }

            return result;
          } catch (error: any) {
            return { success: false, error: error.message };
          }
        },

        retryAITagging: async (itemId: string) => {
          try {
            const result = await visionService.retryAITagging(itemId);

            if (result.success) {
              // Update local state with processing status
              set({
                wardrobeItems: get().wardrobeItems.map(item =>
                  item.id === itemId
                    ? { ...item, ai_status: 'processing', ai_error_message: null }
                    : item
                ),
              });
            }

            return result;
          } catch (error: any) {
            return { success: false, error: error.message };
          }
        },

        batchAITagging: async (itemIds: string[]) => {
          try {
            const result = await visionService.batchAITagging(itemIds);

            // Update local status for all items
            if (result.success && result.results) {
              result.results.forEach((itemResult: any) => {
                if (itemResult.success) {
                  set({
                    wardrobeItems: get().wardrobeItems.map(item =>
                      item.id === itemResult.itemId
                        ? { ...item, ai_status: 'processing' }
                        : item
                    ),
                  });
                }
              });
            }

            return result;
          } catch (error: any) {
            return { success: false, error: error.message };
          }
        },

        monitorAITaggingProgress: (itemId: string, onUpdate: (status: any) => void) => {
          visionService.monitorAITaggingProgress(itemId, (status) => {
            // Update local state when status changes
            if (status.status === 'completed' || status.status === 'failed') {
              set({
                wardrobeItems: get().wardrobeItems.map(item =>
                  item.id === itemId
                    ? {
                        ...item,
                        ai_status: status.status,
                        ai_confidence: status.confidence,
                        ai_error_message: status.error || null,
                        ai_processed_at: status.processedAt || new Date().toISOString()
                      }
                    : item
                ),
              });

              // Refresh items to get AI data when completed
              if (status.status === 'completed') {
                setTimeout(() => get().fetchWardrobeItems(true), 1000);
              }
            }

            // Call the update callback
            onUpdate(status);
          });
        },

        // Outfit Actions
        fetchOutfits: async (refresh = false) => {
          const state = get();
          const user = useSessionStore.getState().user;

          if (!user) {
            set({ error: 'Not authenticated' });
            return;
          }

          try {
            if (refresh) {
              set({ refreshing: true, error: null });
            } else {
              set({ loading: true, error: null });
            }

            const { data, error } = await supabase
              .from('outfits')
              .select(`
                *,
                outfit_items:wardrobe_items(
                  id,
                  name,
                  category,
                  color,
                  images,
                  is_available
                )
              `)
              .eq('user_id', user.id)
              .order('created_at', { ascending: false })
              .range(0, state.pagination.outfits.itemsPerPage * state.pagination.outfits.currentPage - 1);

            if (error) throw error;

            set({
              outfits: refresh ? (data || []) : [...state.outfits, ...(data || [])],
              pagination: {
                ...state.pagination,
                outfits: {
                  ...state.pagination.outfits,
                  hasNextPage: (data?.length || 0) === state.pagination.outfits.itemsPerPage,
                  currentPage: refresh ? 1 : state.pagination.outfits.currentPage + 1,
                },
              },
            });

          } catch (error: any) {
            console.error('Fetch outfits error:', error);
            set({ error: error.message });
          } finally {
            set({ loading: false, refreshing: false });
          }
        },

        createOutfit: async (outfitData: Partial<Outfit>) => {
          const user = useSessionStore.getState().user;

          if (!user) {
            return { success: false, error: 'Not authenticated' };
          }

          try {
            set({ saving: true, error: null });

            const { data, error } = await supabase
              .from('outfits')
              .insert({
                user_id: user.id,
                name: outfitData.name || 'New Outfit',
                description: outfitData.description,
                items: outfitData.items || [],
                occasion: outfitData.occasion || 'casual',
                season: outfitData.season,
                style_tags: outfitData.style_tags || [],
                images: outfitData.images || [],
                is_favorite: outfitData.is_favorite || false,
                is_public: outfitData.is_public || false,
                likes_count: 0,
                shares_count: 0,
                wear_count: 0,
                temperature_range: outfitData.temperature_range,
                weather_conditions: outfitData.weather_conditions || [],
                notes: outfitData.notes,
                metadata: outfitData.metadata || {},
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .select()
              .single();

            if (error) {
              return { success: false, error: error.message };
            }

            // Update local state
            set({
              outfits: [data, ...get().outfits],
            });

            return { success: true, outfitId: data.id };

          } catch (error: any) {
            return { success: false, error: error.message };
          } finally {
            set({ saving: false });
          }
        },

        updateOutfit: async (outfitId: string, updates: Partial<Outfit>) => {
          try {
            const { error } = await supabase
              .from('outfits')
              .update({
                ...updates,
                updated_at: new Date().toISOString(),
              })
              .eq('id', outfitId);

            if (error) {
              return { success: false, error: error.message };
            }

            // Update local state
            set({
              outfits: get().outfits.map(outfit =>
                outfit.id === outfitId ? { ...outfit, ...updates } : outfit
              ),
            });

            return { success: true };

          } catch (error: any) {
            return { success: false, error: error.message };
          }
        },

        deleteOutfit: async (outfitId: string) => {
          try {
            const { error } = await supabase
              .from('outfits')
              .delete()
              .eq('id', outfitId);

            if (error) {
              return { success: false, error: error.message };
            }

            // Update local state
            set({
              outfits: get().outfits.filter(outfit => outfit.id !== outfitId),
            });

            return { success: true };

          } catch (error: any) {
            return { success: false, error: error.message };
          }
        },

        duplicateOutfit: async (outfitId: string) => {
          const originalOutfit = get().outfits.find(outfit => outfit.id === outfitId);

          if (!originalOutfit) {
            return { success: false, error: 'Outfit not found' };
          }

          try {
            const result = await get().createOutfit({
              name: `${originalOutfit.name} (Copy)`,
              description: originalOutfit.description,
              items: originalOutfit.items,
              occasion: originalOutfit.occasion,
              season: originalOutfit.season,
              style_tags: originalOutfit.style_tags,
              images: originalOutfit.images,
              is_favorite: false,
              is_public: false,
              temperature_range: originalOutfit.temperature_range,
              weather_conditions: originalOutfit.weather_conditions,
              notes: originalOutfit.notes,
              metadata: {
                ...originalOutfit.metadata,
                duplicated_from: outfitId,
              },
            });

            return result;

          } catch (error: any) {
            return { success: false, error: error.message };
          }
        },

        wearOutfit: async (outfitId: string) => {
          try {
            const today = new Date().toISOString().split('T')[0];

            // Update outfit wear count and last worn date
            await get().updateOutfit(outfitId, {
              wear_count: get().outfits.find(o => o.id === outfitId)?.wear_count! + 1,
              last_worn: today,
            });

            // Update wear count for all items in the outfit
            const outfit = get().outfits.find(o => o.id === outfitId);
            if (outfit) {
              for (const itemId of outfit.items) {
                await get().updateWardrobeItem(itemId, {
                  wear_count: get().wardrobeItems.find(item => item.id === itemId)?.wear_count! + 1,
                  last_worn: today,
                });
              }
            }

            return { success: true };

          } catch (error: any) {
            return { success: false, error: error.message };
          }
        },

        // Outfit Suggestion Actions
        fetchOutfitSuggestions: async () => {
          const user = useSessionStore.getState().user;

          if (!user) return;

          try {
            const { data, error } = await supabase
              .from('outfit_suggestions')
              .select('*')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false })
              .limit(10);

            if (error) throw error;

            set({ outfitSuggestions: data || [] });

          } catch (error: any) {
            console.error('Fetch outfit suggestions error:', error);
          }
        },

        saveOutfitSuggestion: async (suggestionId: string) => {
          try {
            const { error } = await supabase
              .from('outfit_suggestions')
              .update({ is_saved: true })
              .eq('id', suggestionId);

            if (error) {
              return { success: false, error: error.message };
            }

            // Update local state
            set({
              outfitSuggestions: get().outfitSuggestions.map(suggestion =>
                suggestion.id === suggestionId ? { ...suggestion, is_saved: true } : suggestion
              ),
            });

            return { success: true };

          } catch (error: any) {
            return { success: false, error: error.message };
          }
        },

        dismissOutfitSuggestion: async (suggestionId: string) => {
          set({
            outfitSuggestions: get().outfitSuggestions.filter(
              suggestion => suggestion.id !== suggestionId
            ),
          });
        },

        // AR Session Actions
        createARSession: async (sessionData: Partial<ARSession>) => {
          const user = useSessionStore.getState().user;

          if (!user) {
            return { success: false, error: 'Not authenticated' };
          }

          try {
            const { data, error } = await supabase
              .from('ar_sessions')
              .insert({
                user_id: user.id,
                session_type: sessionData.session_type || 'try_on',
                items: sessionData.items || [],
                outfit_id: sessionData.outfit_id,
                camera_settings: sessionData.camera_settings || {},
                captures: [],
                session_data: sessionData.session_data || {},
                duration_seconds: 0,
                is_completed: false,
                shared_to: [],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .select()
              .single();

            if (error) {
              return { success: false, error: error.message };
            }

            set({ currentARSession: data });

            return { success: true, sessionId: data.id };

          } catch (error: any) {
            return { success: false, error: error.message };
          }
        },

        updateARSession: async (sessionId: string, updates: Partial<ARSession>) => {
          try {
            const { error } = await supabase
              .from('ar_sessions')
              .update({
                ...updates,
                updated_at: new Date().toISOString(),
              })
              .eq('id', sessionId);

            if (error) {
              return { success: false, error: error.message };
            }

            // Update current session if it matches
            if (get().currentARSession?.id === sessionId) {
              set({
                currentARSession: { ...get().currentARSession!, ...updates },
              });
            }

            return { success: true };

          } catch (error: any) {
            return { success: false, error: error.message };
          }
        },

        addARCapture: async (sessionId: string, imageData: any) => {
          try {
            const captureData = {
              id: crypto.randomUUID(),
              image_url: imageData.image_url,
              thumbnail_url: imageData.thumbnail_url,
              settings: imageData.settings || {},
              created_at: new Date().toISOString(),
            };

            const currentSession = get().currentARSession;
            const updatedCaptures = [...(currentSession?.captures || []), captureData];

            await get().updateARSession(sessionId, {
              captures: updatedCaptures,
              duration_seconds: (currentSession?.duration_seconds || 0) + (imageData.duration || 0),
            });

            return { success: true, captureId: captureData.id };

          } catch (error: any) {
            return { success: false, error: error.message };
          }
        },

        completeARSession: async (sessionId: string) => {
          try {
            const result = await get().updateARSession(sessionId, {
              is_completed: true,
              duration_seconds: get().currentARSession?.duration_seconds,
            });

            if (result.success) {
              set({ currentARSession: null });
            }

            return result;

          } catch (error: any) {
            return { success: false, error: error.message };
          }
        },

        fetchARSessions: async () => {
          const user = useSessionStore.getState().user;

          if (!user) return;

          try {
            const { data, error } = await supabase
              .from('ar_sessions')
              .select('*')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false })
              .limit(20);

            if (error) throw error;

            set({ arSessions: data || [] });

          } catch (error: any) {
            console.error('Fetch AR sessions error:', error);
          }
        },

        // Filter and Search
        setWardrobeFilter: (filter: Partial<WardrobeFilter>) => {
          set({ wardrobeFilter: { ...get().wardrobeFilter, ...filter } });
        },

        setOutfitFilter: (filter: Partial<OutfitFilter>) => {
          set({ outfitFilter: { ...get().outfitFilter, ...filter } });
        },

        clearFilters: () => {
          set({
            wardrobeFilter: { availability: 'all' },
            outfitFilter: {},
          });
        },

        searchWardrobe: async (query: string) => {
          const user = useSessionStore.getState().user;

          if (!user || !query.trim()) return [];

          try {
            const { data, error } = await supabase
              .from('wardrobe_items')
              .select('*')
              .eq('user_id', user.id)
              .or(`name.ilike.%${query}%,description.ilike.%${query}%,brand.ilike.%${query}%,tags.cs.{${query}}`)
              .order('created_at', { ascending: false });

            if (error) throw error;

            return data || [];

          } catch (error: any) {
            console.error('Search wardrobe error:', error);
            return [];
          }
        },

        searchOutfits: async (query: string) => {
          const user = useSessionStore.getState().user;

          if (!user || !query.trim()) return [];

          try {
            const { data, error } = await supabase
              .from('outfits')
              .select('*')
              .eq('user_id', user.id)
              .or(`name.ilike.%${query}%,description.ilike.%${query}%,style_tags.cs.{${query}}`)
              .order('created_at', { ascending: false });

            if (error) throw error;

            return data || [];

          } catch (error: any) {
            console.error('Search outfits error:', error);
            return [];
          }
        },

        // Analytics and Stats
        calculateStats: () => {
          const items = get().wardrobeItems;
          const outfits = get().outfits;

          const stats = {
            total_items: items.length,
            items_by_category: {} as Record<string, number>,
            items_by_color: {} as Record<string, number>,
            total_outfits: outfits.length,
            favorite_items: items.filter(item => item.is_favorite).length,
            items_in_rotation: items.filter(item => item.is_available && !item.last_worn).length,
            total_value: items.reduce((sum, item) => sum + (item.purchase_price || 0), 0),
          };

          // Count by category
          items.forEach(item => {
            stats.items_by_category[item.category] = (stats.items_by_category[item.category] || 0) + 1;
            stats.items_by_color[item.color] = (stats.items_by_color[item.color] || 0) + 1;
          });

          set({ stats });
        },

        getWardrobeValue: async () => {
          const items = get().wardrobeItems;
          return items.reduce((sum, item) => sum + (item.purchase_price || 0), 0);
        },

        getItemUsageStats: async (itemId: string) => {
          try {
            // Find all outfits containing this item
            const outfits = get().outfits.filter(outfit => outfit.items.includes(itemId));
            const totalWears = outfits.reduce((sum, outfit) => sum + (outfit.wear_count || 0), 0);

            const item = get().wardrobeItems.find(item => item.id === itemId);
            const lastWorn = item?.last_worn;
            const daysSinceLastWorn = lastWorn ? Math.floor((Date.now() - new Date(lastWorn).getTime()) / (1000 * 60 * 60 * 24)) : null;

            return {
              totalWears,
              outfitsCount: outfits.length,
              lastWorn,
              daysSinceLastWorn,
              wearFrequency: lastWorn ? totalWears / Math.max(1, daysSinceLastWorn || 1) : 0,
            };

          } catch (error: any) {
            console.error('Get item usage stats error:', error);
            return null;
          }
        },

        // Utility
        generateOutfitIdeas: async (filters: any) => {
          const items = get().wardrobeItems;
          const filteredItems = items.filter(item => {
            if (filters.category && !filters.category.includes(item.category)) return false;
            if (filters.occasion && !filters.occasion.some((occ: string) => item.occasion?.includes(occ))) return false;
            if (filters.season && !filters.season.some((season: string) => item.season?.includes(season))) return false;
            if (filters.color && !filters.color.includes(item.color)) return false;
            return true;
          });

          // Generate outfit combinations (simplified algorithm)
          const ideas: Outfit[] = [];
          const categories = ['top', 'bottom', 'outerwear', 'shoes', 'accessories'];

          for (let i = 0; i < 5; i++) {
            const outfitItems: string[] = [];
            const outfitItemsData: WardrobeItem[] = [];

            categories.forEach(category => {
              const categoryItems = filteredItems.filter(item => item.category === category);
              if (categoryItems.length > 0) {
                const randomItem = categoryItems[Math.floor(Math.random() * categoryItems.length)];
                outfitItems.push(randomItem.id);
                outfitItemsData.push(randomItem);
              }
            });

            if (outfitItems.length > 0) {
              const colorPalette = [...new Set(outfitItemsData.map(item => item.color))];
              const styles = [...new Set(outfitItemsData.map(item => item.style).filter(Boolean))];

              ideas.push({
                id: `generated-${Date.now()}-${i}`,
                user_id: useSessionStore.getState().user?.id || '',
                name: `Generated Outfit ${i + 1}`,
                items: outfitItems,
                occasion: filters.occasion?.[0] || 'casual',
                style_tags: styles as string[],
                images: outfitItemsData.map(item => item.images[0]).filter(Boolean),
                is_favorite: false,
                is_public: false,
                likes_count: 0,
                shares_count: 0,
                wear_count: 0,
                metadata: {
                  colorPalette,
                  generated_at: new Date().toISOString(),
                },
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              } as Outfit);
            }
          }

          return ideas;
        },

        categorizeItems: () => {
          const items = get().wardrobeItems;
          const categories = {
            tops: items.filter(item => item.category === 'top'),
            bottoms: items.filter(item => item.category === 'bottom'),
            dresses: items.filter(item => item.category === 'dress'),
            outerwear: items.filter(item => item.category === 'outerwear'),
            shoes: items.filter(item => item.category === 'shoes'),
            accessories: items.filter(item => item.category === 'accessories'),
          };

          // This could be used for UI organization
          console.log('Wardrobe categories:', categories);
        },

        clearError: () => set({ error: null }),
        setLoading: (loading: boolean) => set({ loading }),
      }),
      storageConfig
    )
  )
);

// Selectors for commonly used state
export const useWardrobe = () => ({
  items: useWardrobeStore((state) => state.wardrobeItems),
  loading: useWardrobeStore((state) => state.loading),
  refreshing: useWardrobeStore((state) => state.refreshing),
  error: useWardrobeStore((state) => state.error),
  filter: useWardrobeStore((state) => state.wardrobeFilter),
  stats: useWardrobeStore((state) => state.stats),
});

export const useOutfits = () => ({
  outfits: useWardrobeStore((state) => state.outfits),
  loading: useWardrobeStore((state) => state.loading),
  saving: useWardrobeStore((state) => state.saving),
  filter: useWardrobeStore((state) => state.outfitFilter),
});

export const useAR = () => ({
  currentSession: useWardrobeStore((state) => state.currentARSession),
  sessions: useWardrobeStore((state) => state.arSessions),
});

export const useWardrobeActions = () => ({
  fetchItems: useWardrobeStore((state) => state.fetchWardrobeItems),
  addItem: useWardrobeStore((state) => state.addWardrobeItem),
  updateItem: useWardrobeStore((state) => state.updateWardrobeItem),
  deleteItem: useWardrobeStore((state) => state.deleteWardrobeItem),
  uploadImage: useWardrobeStore((state) => state.uploadItemImage),
});

export const useAITaggingActions = () => ({
  triggerAITagging: useWardrobeStore((state) => state.triggerAITagging),
  getAITaggingStatus: useWardrobeStore((state) => state.getAITaggingStatus),
  getWardrobeAIFields: useWardrobeStore((state) => state.getWardrobeAIFields),
  mergeAITags: useWardrobeStore((state) => state.mergeAITags),
  retryAITagging: useWardrobeStore((state) => state.retryAITagging),
  batchAITagging: useWardrobeStore((state) => state.batchAITagging),
  monitorAITaggingProgress: useWardrobeStore((state) => state.monitorAITaggingProgress),
});

export const useOutfitActions = () => ({
  fetchOutfits: useWardrobeStore((state) => state.fetchOutfits),
  createOutfit: useWardrobeStore((state) => state.createOutfit),
  updateOutfit: useWardrobeStore((state) => state.updateOutfit),
  deleteOutfit: useWardrobeStore((state) => state.deleteOutfit),
  duplicateOutfit: useWardrobeStore((state) => state.duplicateOutfit),
  wearOutfit: useWardrobeStore((state) => state.wearOutfit),
});

export const useARActions = () => ({
  createSession: useWardrobeStore((state) => state.createARSession),
  updateSession: useWardrobeStore((state) => state.updateARSession),
  addCapture: useWardrobeStore((state) => state.addARCapture),
  completeSession: useWardrobeStore((state) => state.completeARSession),
});

export const useWardrobeFilters = () => ({
  wardrobeFilter: useWardrobeStore((state) => state.wardrobeFilter),
  outfitFilter: useWardrobeStore((state) => state.outfitFilter),
  setWardrobeFilter: useWardrobeStore((state) => state.setWardrobeFilter),
  setOutfitFilter: useWardrobeStore((state) => state.setOutfitFilter),
  clearFilters: useWardrobeStore((state) => state.clearFilters),
});
