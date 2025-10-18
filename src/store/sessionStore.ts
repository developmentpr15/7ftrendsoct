import { create } from 'zustand';
import { persist, createJSONStorage, subscribeWithSelector } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../utils/supabase';
import { authService } from '../services/authService';

// Types
export interface User {
  id: string;
  username: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  country?: string;
  timezone?: string;
  followers_count?: number;
  following_count?: number;
  posts_count?: number;
  points_balance?: number;
  preferences?: UserPreferences;
  created_at: string;
  updated_at: string;
  is_active?: boolean;
  email_verified?: boolean;
}

export interface UserPreferences {
  favorite_colors?: string[];
  preferred_styles?: string[];
  size_preferences?: {
    tops?: string;
    bottoms?: string;
    shoes?: string;
  };
  weather_notifications?: boolean;
  outfit_suggestions?: boolean;
  competition_notifications?: boolean;
  privacy_settings?: {
    profile_visibility?: 'public' | 'friends' | 'private';
    show_location?: boolean;
    allow_analytics?: boolean;
  };
  notification_preferences?: {
    push_enabled?: boolean;
    email_enabled?: boolean;
    in_app_enabled?: boolean;
  };
}

export interface AuthState {
  user: User | null;
  session: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  lastActivity: number;
  needsOnboarding: boolean;
  onboardingStep: number;
}

interface SessionStore extends AuthState {
  // Auth Actions
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string; needsOnboarding?: boolean }>;
  signUp: (email: string, password: string, userData: Partial<User>) => Promise<{ success: boolean; error?: string; needsOnboarding?: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;

  // Social Auth Actions
  signInWithGoogle: () => Promise<{ success: boolean; error?: string; needsOnboarding?: boolean }>;
  signInWithFacebook: () => Promise<{ success: boolean; error?: string; needsOnboarding?: boolean }>;
  signInWithInstagram: () => Promise<{ success: boolean; error?: string; needsOnboarding?: boolean }>;

  // Onboarding Actions
  completeOnboarding: (onboardingData: any) => Promise<{ success: boolean; error?: string }>;
  setOnboardingStep: (step: number) => void;
  skipOnboarding: () => void;

  // User Actions
  updateProfile: (updates: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  updatePreferences: (preferences: Partial<UserPreferences>) => Promise<{ success: boolean; error?: string }>;
  uploadAvatar: (imageUri: string) => Promise<{ success: boolean; url?: string; error?: string }>;

  // Session Management
  refreshSession: () => Promise<void>;
  updateLastActivity: () => void;
  checkAuthStatus: () => Promise<void>;

  // Utility Actions
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

// Storage configuration for persistence
const storageConfig = {
  name: '7ftrends-session-storage',
  storage: createJSONStorage(() => AsyncStorage),
  partialize: (state: SessionStore) => ({
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    lastActivity: state.lastActivity,
  }),
};

export const useSessionStore = create<SessionStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Initial State
        user: null,
        session: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        lastActivity: Date.now(),
        needsOnboarding: false,
        onboardingStep: 0,

        // Auth Actions
        signIn: async (email: string, password: string) => {
          try {
            set({ isLoading: true, error: null });

            const { data, error } = await supabase.auth.signInWithPassword({
              email,
              password,
            });

            if (error) {
              set({ error: error.message, isLoading: false });
              return { success: false, error: error.message };
            }

            if (data.user) {
              // Fetch full user profile
              const { data: profile, error: profileError } = await supabase
                .from('users')
                .select('*')
                .eq('id', data.user.id)
                .single();

              if (profileError) {
                console.warn('Could not fetch user profile:', profileError);
                // Use basic user data from auth
                set({
                  user: {
                    id: data.user.id,
                    username: data.user.user_metadata?.username || data.user.email?.split('@')[0],
                    email: data.user.email!,
                    full_name: data.user.user_metadata?.full_name,
                    avatar_url: data.user.user_metadata?.avatar_url,
                    created_at: data.user.created_at,
                    updated_at: data.user.updated_at || data.user.created_at,
                    email_verified: data.user.email_confirmed_at != null,
                  },
                  session: data.session,
                  isAuthenticated: true,
                  isLoading: false,
                  lastActivity: Date.now(),
                });
              } else {
                set({
                  user: profile,
                  session: data.session,
                  isAuthenticated: true,
                  isLoading: false,
                  lastActivity: Date.now(),
                });
              }

              return { success: true };
            }

            set({ isLoading: false });
            return { success: false, error: 'No user data returned' };

          } catch (error: any) {
            const errorMessage = error.message || 'Sign in failed';
            set({ error: errorMessage, isLoading: false });
            return { success: false, error: errorMessage };
          }
        },

        signUp: async (email: string, password: string, userData: Partial<User>) => {
          try {
            set({ isLoading: true, error: null });

            const { data, error } = await supabase.auth.signUp({
              email,
              password,
              options: {
                data: {
                  username: userData.username,
                  full_name: userData.full_name,
                },
              },
            });

            if (error) {
              set({ error: error.message, isLoading: false });
              return { success: false, error: error.message };
            }

            if (data.user) {
              // Create user profile in database
              const { error: profileError } = await supabase
                .from('users')
                .insert({
                  id: data.user.id,
                  username: userData.username,
                  email: data.user.email!,
                  full_name: userData.full_name,
                  avatar_url: userData.avatar_url,
                  location: userData.location,
                  country: userData.country,
                  timezone: userData.timezone,
                  preferences: userData.preferences || {},
                  is_active: true,
                  email_verified: false,
                  created_at: data.user.created_at,
                  updated_at: data.user.created_at,
                });

              if (profileError) {
                console.warn('Could not create user profile:', profileError);
              }

              set({
                user: {
                  id: data.user.id,
                  username: userData.username || data.user.email?.split('@')[0],
                  email: data.user.email!,
                  full_name: userData.full_name,
                  avatar_url: userData.avatar_url,
                  location: userData.location,
                  country: userData.country,
                  timezone: userData.timezone,
                  preferences: userData.preferences,
                  created_at: data.user.created_at,
                  updated_at: data.user.created_at,
                  is_active: true,
                  email_verified: false,
                },
                session: data.session,
                isAuthenticated: true,
                isLoading: false,
                lastActivity: Date.now(),
              });

              return { success: true };
            }

            set({ isLoading: false });
            return { success: false, error: 'Sign up failed' };

          } catch (error: any) {
            const errorMessage = error.message || 'Sign up failed';
            set({ error: errorMessage, isLoading: false });
            return { success: false, error: errorMessage };
          }
        },

        signOut: async () => {
          try {
            set({ isLoading: true });
            await supabase.auth.signOut();
            set({
              user: null,
              session: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
              lastActivity: Date.now(),
            });
          } catch (error: any) {
            console.error('Sign out error:', error);
            // Even if sign out fails, clear local state
            set({
              user: null,
              session: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
            });
          }
        },

        resetPassword: async (email: string) => {
          try {
            set({ isLoading: true, error: null });

            const { error } = await supabase.auth.resetPasswordForEmail(email);

            if (error) {
              set({ error: error.message, isLoading: false });
              return { success: false, error: error.message };
            }

            set({ isLoading: false });
            return { success: true };

          } catch (error: any) {
            const errorMessage = error.message || 'Password reset failed';
            set({ error: errorMessage, isLoading: false });
            return { success: false, error: errorMessage };
          }
        },

        // User Actions
        updateProfile: async (updates: Partial<User>) => {
          try {
            const state = get();
            if (!state.user) {
              return { success: false, error: 'Not authenticated' };
            }

            const { error } = await supabase
              .from('users')
              .update({
                ...updates,
                updated_at: new Date().toISOString(),
              })
              .eq('id', state.user.id);

            if (error) {
              return { success: false, error: error.message };
            }

            // Update local state
            set({
              user: { ...state.user, ...updates },
            });

            return { success: true };

          } catch (error: any) {
            return { success: false, error: error.message };
          }
        },

        updatePreferences: async (preferences: Partial<UserPreferences>) => {
          try {
            const state = get();
            if (!state.user) {
              return { success: false, error: 'Not authenticated' };
            }

            const updatedPreferences = { ...state.user.preferences, ...preferences };

            const { error } = await supabase
              .from('users')
              .update({
                preferences: updatedPreferences,
                updated_at: new Date().toISOString(),
              })
              .eq('id', state.user.id);

            if (error) {
              return { success: false, error: error.message };
            }

            // Update local state
            set({
              user: {
                ...state.user,
                preferences: updatedPreferences,
              },
            });

            return { success: true };

          } catch (error: any) {
            return { success: false, error: error.message };
          }
        },

        uploadAvatar: async (imageUri: string) => {
          try {
            const state = get();
            if (!state.user) {
              return { success: false, error: 'Not authenticated' };
            }

            // Upload image to Supabase Storage
            const fileName = `avatars/${state.user.id}/${Date.now()}.jpg`;
            const { error: uploadError } = await supabase.storage
              .from('avatars')
              .upload(fileName, {
                uri: imageUri,
                type: 'image/jpeg',
              });

            if (uploadError) {
              return { success: false, error: uploadError.message };
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
              .from('avatars')
              .getPublicUrl(fileName);

            // Update user profile
            const updateResult = await get().updateProfile({
              avatar_url: publicUrl,
            });

            if (!updateResult.success) {
              return updateResult;
            }

            return { success: true, url: publicUrl };

          } catch (error: any) {
            return { success: false, error: error.message };
          }
        },

        // Session Management
        refreshSession: async () => {
          try {
            const { data, error } = await supabase.auth.refreshSession();

            if (error) {
              console.error('Session refresh error:', error);
              // If refresh fails, sign out
              await get().signOut();
              return;
            }

            if (data.session) {
              set({
                session: data.session,
                lastActivity: Date.now(),
              });
            }

          } catch (error) {
            console.error('Session refresh error:', error);
          }
        },

        updateLastActivity: () => {
          set({ lastActivity: Date.now() });
        },

        checkAuthStatus: async () => {
          try {
            const { data: { session }, error } = await supabase.auth.getSession();

            if (error) {
              console.error('Auth status check error:', error);
              return;
            }

            if (session && session.user) {
              // Fetch full user profile
              const { data: profile } = await supabase
                .from('users')
                .select('*')
                .eq('id', session.user.id)
                .single();

              set({
                user: profile || {
                  id: session.user.id,
                  username: session.user.user_metadata?.username || session.user.email?.split('@')[0],
                  email: session.user.email!,
                  full_name: session.user.user_metadata?.full_name,
                  avatar_url: session.user.user_metadata?.avatar_url,
                  created_at: session.user.created_at,
                  updated_at: session.user.updated_at || session.user.created_at,
                  email_verified: session.user.email_confirmed_at != null,
                },
                session,
                isAuthenticated: true,
                lastActivity: Date.now(),
              });
            } else {
              set({
                user: null,
                session: null,
                isAuthenticated: false,
              });
            }

          } catch (error) {
            console.error('Auth status check error:', error);
          }
        },

        // Social Auth Actions
        signInWithGoogle: async () => {
          try {
            set({ isLoading: true, error: null });

            const result = await authService.signInWithGoogle();

            if (result.success) {
              if (result.requiresOnboarding) {
                set({
                  needsOnboarding: true,
                  onboardingStep: 0,
                  isLoading: false,
                });
                return { success: true, needsOnboarding: true };
              } else {
                set({
                  user: result.profile,
                  session: result.user.session,
                  isAuthenticated: true,
                  needsOnboarding: false,
                  isLoading: false,
                  lastActivity: Date.now(),
                });
                return { success: true };
              }
            } else {
              set({ error: result.error, isLoading: false });
              return { success: false, error: result.error };
            }
          } catch (error: any) {
            const errorMessage = error.message || 'Google sign-in failed';
            set({ error: errorMessage, isLoading: false });
            return { success: false, error: errorMessage };
          }
        },

        signInWithFacebook: async () => {
          try {
            set({ isLoading: true, error: null });

            const result = await authService.signInWithFacebook();

            if (result.success) {
              if (result.requiresOnboarding) {
                set({
                  needsOnboarding: true,
                  onboardingStep: 0,
                  isLoading: false,
                });
                return { success: true, needsOnboarding: true };
              } else {
                set({
                  user: result.profile,
                  session: result.user.session,
                  isAuthenticated: true,
                  needsOnboarding: false,
                  isLoading: false,
                  lastActivity: Date.now(),
                });
                return { success: true };
              }
            } else {
              set({ error: result.error, isLoading: false });
              return { success: false, error: result.error };
            }
          } catch (error: any) {
            const errorMessage = error.message || 'Facebook sign-in failed';
            set({ error: errorMessage, isLoading: false });
            return { success: false, error: errorMessage };
          }
        },

        signInWithInstagram: async () => {
          try {
            set({ isLoading: true, error: null });

            const result = await authService.signInWithInstagram();

            if (result.success) {
              if (result.requiresOnboarding) {
                set({
                  needsOnboarding: true,
                  onboardingStep: 0,
                  isLoading: false,
                });
                return { success: true, needsOnboarding: true };
              } else {
                set({
                  user: result.profile,
                  session: result.user.session,
                  isAuthenticated: true,
                  needsOnboarding: false,
                  isLoading: false,
                  lastActivity: Date.now(),
                });
                return { success: true };
              }
            } else {
              set({ error: result.error, isLoading: false });
              return { success: false, error: result.error };
            }
          } catch (error: any) {
            const errorMessage = error.message || 'Instagram sign-in failed';
            set({ error: errorMessage, isLoading: false });
            return { success: false, error: errorMessage };
          }
        },

        // Onboarding Actions
        completeOnboarding: async (onboardingData: any) => {
          try {
            set({ isLoading: true, error: null });

            const result = await authService.completeOnboarding(onboardingData);

            if (result.success) {
              set({
                user: result.profile,
                needsOnboarding: false,
                onboardingStep: 0,
                isLoading: false,
                lastActivity: Date.now(),
              });
              return { success: true };
            } else {
              set({ error: result.error, isLoading: false });
              return { success: false, error: result.error };
            }
          } catch (error: any) {
            const errorMessage = error.message || 'Onboarding completion failed';
            set({ error: errorMessage, isLoading: false });
            return { success: false, error: errorMessage };
          }
        },

        setOnboardingStep: (step: number) => {
          set({ onboardingStep: step });
        },

        skipOnboarding: () => {
          set({
            needsOnboarding: false,
            onboardingStep: 0,
          });
        },

        // Utility Actions
        clearError: () => set({ error: null }),
        setLoading: (loading: boolean) => set({ isLoading: loading }),
      }),
      storageConfig
    )
  )
);

// Auto-refresh session and check for inactivity
let sessionRefreshInterval: NodeJS.Timeout;
let inactivityCheckInterval: NodeJS.Timeout;

export const initializeSessionManagement = () => {
  // Refresh session every 30 minutes
  sessionRefreshInterval = setInterval(() => {
    useSessionStore.getState().refreshSession();
  }, 30 * 60 * 1000);

  // Check for inactivity every minute
  inactivityCheckInterval = setInterval(() => {
    const state = useSessionStore.getState();
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

    if (state.isAuthenticated && state.lastActivity < fiveMinutesAgo) {
      console.log('User inactive for 5 minutes, considering sign out');
      // You can implement auto sign-out here if desired
    }
  }, 60 * 1000);

  // Initial auth check
  useSessionStore.getState().checkAuthStatus();
};

export const cleanupSessionManagement = () => {
  if (sessionRefreshInterval) {
    clearInterval(sessionRefreshInterval);
  }
  if (inactivityCheckInterval) {
    clearInterval(inactivityCheckInterval);
  }
};

// Selectors for commonly used state
export const useAuth = () => ({
  user: useSessionStore((state) => state.user),
  isAuthenticated: useSessionStore((state) => state.isAuthenticated),
  isLoading: useSessionStore((state) => state.isLoading),
  error: useSessionStore((state) => state.error),
});

export const useUserPreferences = () =>
  useSessionStore((state) => state.user?.preferences);

export const useAuthActions = () => ({
  signIn: useSessionStore((state) => state.signIn),
  signUp: useSessionStore((state) => state.signUp),
  signOut: useSessionStore((state) => state.signOut),
  updateProfile: useSessionStore((state) => state.updateProfile),
  updatePreferences: useSessionStore((state) => state.updatePreferences),
  clearError: useSessionStore((state) => state.clearError),
});