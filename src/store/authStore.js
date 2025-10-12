import { create } from 'zustand';
import { getCurrentUser, onAuthStateChange } from '../utils/auth';

const useAuthStore = create((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  // Initialize auth state
  initAuth: () => {
    set({ isLoading: true });

    // Check current user on startup
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
      }
    });

    // Listen for auth changes
    const { data: authListener } = onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);

      if (session?.user) {
        set({
          user: session.user,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    });

    return authListener.subscription;
  },

  // Manual login method
  login: (user) => {
    set({
      user,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  // Manual logout method
  logout: () => {
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  // Set loading state
  setLoading: (isLoading) => {
    set({ isLoading });
  },
}));

export default useAuthStore;