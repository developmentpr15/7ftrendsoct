import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Anon Key exists:', !!supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:');
  console.error('EXPO_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('EXPO_PUBLIC_SUPABASE_ANON_KEY:', !!supabaseAnonKey);
  throw new Error('Missing Supabase environment variables');
}

// Create Supabase client with additional options for better error handling
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 2,
    },
  },
});

// Retry utility function
const retryWithBackoff = async (fn, maxRetries = 3, delay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      console.log(`Attempt ${i + 1} failed:`, error.message);

      if (i === maxRetries - 1) {
        throw error;
      }

      // Exponential backoff
      const backoffDelay = delay * Math.pow(2, i);
      console.log(`Retrying in ${backoffDelay}ms...`);
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
    }
  }
};

// Test function to check Supabase connectivity
export const testSupabaseConnection = async () => {
  const testConnection = async () => {
    console.log('Testing Supabase connection...');

    try {
      // First test: Check if we can reach the Supabase project at all
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'HEAD',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
      });

      if (!response.ok) {
        // If we get a 401 or 403, that's actually expected behavior
        // because we're trying to access the root endpoint
        if (response.status === 401 || response.status === 403) {
          console.log('✅ Supabase server reachable (auth response expected)');
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      }

      // Second test: Try the auth endpoint
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        // Check for specific auth errors that indicate connection issues
        if (error.message.includes('Failed to fetch') ||
            error.message.includes('Network request failed') ||
            error.message.includes('fetch') ||
            error.status === 0) {
          throw new Error('Network connectivity issue');
        }

        // Auth errors are expected if not logged in, that's ok
        if (error.message.includes('Invalid Refresh Token') ||
            error.message.includes('no session found')) {
          console.log('✅ Supabase connection successful (no active session)');
          return { success: true, error: null };
        }

        // Other auth errors might indicate API key issues
        if (error.message.includes('Invalid API key') ||
            error.message.includes('Invalid') ||
            error.status === 401) {
          throw new Error('Invalid API key - please check your Supabase configuration');
        }

        throw error;
      }

      console.log('✅ Supabase connection successful');
      return { success: true, error: null };
    } catch (error) {
      // Handle fetch errors specifically
      if (error.message.includes('Failed to fetch') ||
          error.message.includes('Network request failed') ||
          error.message.includes('fetch')) {
        throw new Error('Network connectivity issue - please check your internet connection');
      }
      throw error;
    }
  };

  try {
    return await retryWithBackoff(testConnection, 3, 1000);
  } catch (error) {
    console.error('❌ Supabase connection failed after retries:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      status: error.status,
    });

    // Provide more helpful error messages
    let userFriendlyMessage = error.message;
    if (error.message.includes('Invalid API key')) {
      userFriendlyMessage = 'Invalid Supabase API key. Please check your .env.local file.';
    } else if (error.message.includes('Network connectivity')) {
      userFriendlyMessage = 'Network connection failed. Please check your internet connection.';
    }

    return {
      success: false,
      error: {
        ...error,
        message: userFriendlyMessage
      }
    };
  }
};