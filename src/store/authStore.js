import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUser, onAuthStateChange } from '../utils/auth';

const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      session: null,
      isLoading: true,
      isAuthenticated: false,
      initialized: false,

      // Actions
      setUser: (user) => set({ user }),
      setSession: (session) => set({ session }),
      setLoading: (isLoading) => set({ isLoading }),
      reset: () => set({
        user: null,
        session: null,
        isLoading: false,
        isAuthenticated: false,
        initialized: false,
      }),

      // Initialize auth state
      initAuth: () => {
        const state = get();
        if (state.initialized) {
          // Already initialized, just check current session
          console.log('Auth already initialized, checking current session...');
          getCurrentUser().then(({ user, error }) => {
            if (!error && user) {
              set({
                user,
                isAuthenticated: true,
                isLoading: false,
              });
            } else {
              set({
                user: null,
                isAuthenticated: false,
                isLoading: false,
              });
              if (error) {
                console.log('Auth re-check error:', error.message);
              }
            }
          }).catch(err => {
            console.log('Auth re-check failed:', err);
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
          });
          return;
        }

        set({ isLoading: true });

        // Check current user on startup
        getCurrentUser().then(({ user, error }) => {
          if (!error && user) {
            set({
              user,
              session: { user }, // Basic session structure
              isAuthenticated: true,
              isLoading: false,
              initialized: true,
            });
            console.log('Auth initialized successfully for user:', user.id);
          } else {
            // Clear any invalid session
            set({
              user: null,
              session: null,
              isAuthenticated: false,
              isLoading: false,
              initialized: true,
            });
            if (error) {
              console.log('Auth initialization error (expected if session expired):', error.message);
            }
          }
        }).catch(err => {
          console.log('Auth initialization failed:', err);
          set({
            user: null,
            session: null,
            isAuthenticated: false,
            isLoading: false,
            initialized: true,
          });
        });

        // Listen for auth changes
        const { data: authListener } = onAuthStateChange((event, session) => {
          console.log('Auth state changed:', event, session?.user?.id);

          if (event === 'TOKEN_REFRESHED' && session?.user) {
            set({
              user: session.user,
              session,
              isAuthenticated: true,
              isLoading: false,
            });
          } else if (event === 'SIGNED_OUT' || !session?.user) {
            set({
              user: null,
              session: null,
              isAuthenticated: false,
              isLoading: false,
            });
          } else if (event === 'SIGNED_IN' && session?.user) {
            set({
              user: session.user,
              session,
              isAuthenticated: true,
              isLoading: false,
            });
          }
        });

        return authListener.subscription;
      },

      // Manual login method
      login: (user, session = null) => {
        set({
          user,
          session: session || { user },
          isAuthenticated: true,
          isLoading: false,
        });
      },

      // Manual logout method
      logout: () => {
        set({
          user: null,
          session: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      // Update user metadata
      updateUserMetadata: (metadata) => {
        const state = get();
        if (state.user) {
          set({
            user: {
              ...state.user,
              user_metadata: {
                ...state.user.user_metadata,
                ...metadata,
              },
            },
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        session: state.session,
        isAuthenticated: state.isAuthenticated,
        initialized: state.initialized,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          console.log('Auth state rehydrated from storage');
          // Don't set isLoading to true during rehydration
          state.isLoading = false;
        }
      },
    }
  )
);

// Export as both named and default for compatibility
export { useAuthStore };
export default useAuthStore;