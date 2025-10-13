import { supabase, testSupabaseConnection } from './supabase';

export const signUp = async (email, password, username) => {
  try {
    console.log('Starting sign up process for:', email);

    // Test connection first
    const connectionTest = await testSupabaseConnection();
    if (!connectionTest.success) {
      console.error('Cannot proceed with sign up - connection failed');
      return { data: null, error: connectionTest.error };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
      },
    });

    if (error) {
      console.error('Supabase auth error during sign up:', error);
      throw error;
    }

    // Create user profile in the users table
    if (data.user) {
      console.log('Creating user profile for:', data.user.id);
      const { error: profileError } = await supabase
        .from('users')
        .insert([
          {
            id: data.user.id,
            username: username || email.split('@')[0],
            email: data.user.email,
            password_hash: 'handled_by_supabase_auth', // Placeholder for required field
            created_at: new Date().toISOString(),
          },
        ]);

      if (profileError) {
        console.error('Profile creation error:', profileError);

        // If it's just the password_hash issue, try without it
        if (profileError.message.includes('password_hash')) {
          console.log('Retrying without password_hash field...');
          const { error: retryError } = await supabase
            .from('users')
            .insert([
              {
                id: data.user.id,
                username: username || email.split('@')[0],
                email: data.user.email,
                created_at: new Date().toISOString(),
              },
            ]);

          if (retryError) {
            console.error('Profile creation retry error:', retryError);
            throw retryError;
          }
        } else {
          throw profileError;
        }
      }
    }

    return { data, error: null };
  } catch (error) {
    console.error('Sign up error:', error.message);
    console.error('Full error details:', error);
    return { data: null, error };
  }
};

export const signIn = async (email, password) => {
  try {
    console.log('Attempting sign in for:', email);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Sign in error:', error);

      // Handle specific network errors
      if (error.message.includes('Failed to fetch') ||
          error.message.includes('Network request failed') ||
          error.status === 0) {
        return {
          data: null,
          error: {
            message: 'Network connection failed, please check your network settings',
            isNetworkError: true
          }
        };
      }

      // Handle invalid credentials specifically
      if (error.message.includes('Invalid login credentials') ||
          error.message.includes('invalid_credentials')) {
        return {
          data: null,
          error: {
            message: 'Invalid email or password. Please check your credentials or create a new account.',
            isInvalidCredentials: true
          }
        };
      }

      throw error;
    }

    console.log('Sign in successful');
    return { data, error: null };
  } catch (error) {
    console.error('Sign in exception:', error);
    return {
      data: null,
      error: {
        message: error.message || 'Login failed, please try again later',
        isNetworkError: error.message?.includes('fetch') || error.message?.includes('network')
      }
    };
  }
};

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign out error:', error);

      // Handle network errors gracefully
      if (error.message.includes('Failed to fetch') ||
          error.message.includes('Network request failed') ||
          error.status === 0) {
        console.log('Network error during sign out, but continuing...');
        return { error: null }; // Don't fail sign out on network issues
      }

      throw error;
    }
    return { error: null };
  } catch (error) {
    console.error('Sign out exception:', error);
    return { error: null }; // Always succeed on sign out, even on error
  }
};

export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return { user, error: null };
  } catch (error) {
    return { user: null, error };
  }
};

export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange(callback);
};