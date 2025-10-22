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
        if (get().initialized) {
          console.log('Auth already initialized.');
          return;
        }

        console.log('Initializing auth state...');
        set({ isLoading: true });

        // Centralized function to handle session updates
        const handleSession = (session) => {
          const user = session?.user || null;
          set({
            user,
            session,
            isAuthenticated: !!user,
            isLoading: false,
            initialized: true,
          });
          if (user) {
            console.log('Session updated for user:', user.id);
          } else {
            console.log('Session cleared.');
          }
        };

        // Listen for auth state changes
        const { data: { subscription } } = onAuthStateChange((event, session) => {
          console.log(`Auth state changed: ${event}`);
          handleSession(session);
        });

        // Check the initial session
        getCurrentUser()
          .then(({ user, session, error }) => {
            if (error) {
              console.log('Initial session check error:', error.message);
              handleSession(null);
            } else {
              handleSession(session);
            }
          })
          .catch(err => {
            console.log('Initial session check failed:', err);
            handleSession(null);
          });

        return () => {
          if (subscription) {
            console.log('Unsubscribing from auth state changes.');
            subscription.unsubscribe();
          }
        };
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