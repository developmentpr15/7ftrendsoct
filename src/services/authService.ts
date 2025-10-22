// Comprehensive Authentication Service
// Handles social authentication and profile creation for 7Ftrends

import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import { supabase } from '../utils/supabase';
import { Platform, Alert } from 'react-native';

function toHexString(bytes: Uint8Array): string {
  return bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');
}

// Social auth result types
export interface SocialAuthResult {
  success: boolean;
  user?: any;
  profile?: any;
  error?: string;
  requiresOnboarding?: boolean;
  message?: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  country_code: string;
  timezone: string;
  is_public: boolean;
  preferences?: any;
  created_at: string;
  updated_at: string;
}

export interface OnboardingData {
  username: string;
  full_name?: string;
  bio?: string;
  country_code: string;
  timezone: string;
  is_public: boolean;
  style_preferences?: {
    colors: string[];
    styles: string[];
    occasions: string[];
  };
  size_preferences?: {
    tops?: string;
    bottoms?: string;
    shoes?: string;
  };
  notification_settings?: {
    new_followers: boolean;
    competition_updates: boolean;
    outfit_suggestions: boolean;
    friend_activities: boolean;
  };
}

// Country and timezone data for onboarding
export const COUNTRIES = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
  { code: 'NO', name: 'Norway', flag: '🇳🇴' },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰' },
  { code: 'FI', name: 'Finland', flag: '🇫🇮' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
];

export const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)' },
  { value: 'Europe/Paris', label: 'Central European Time (CET)' },
  { value: 'Europe/Berlin', label: 'Central European Time (CET)' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)' },
  { value: 'Asia/Seoul', label: 'Korea Standard Time (KST)' },
  { value: 'Asia/Shanghai', label: 'China Standard Time (CST)' },
  { value: 'Asia/Kolkata', label: 'India Standard Time (IST)' },
  { value: 'America/Sao_Paulo', label: 'Brasília Time (BRT)' },
  { value: 'America/Mexico_City', label: 'Central Standard Time (CST)' },
  { value: 'America/Buenos_Aires', label: 'Argentina Time (ART)' },
];

export const STYLE_PREFERENCES = {
  colors: [
    'Black', 'White', 'Gray', 'Navy', 'Brown', 'Beige', 'Olive', 'Burgundy',
    'Pink', 'Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Orange', 'Khaki'
  ],
  styles: [
    'Casual', 'Business', 'Formal', 'Streetwear', 'Athletic', 'Vintage',
    'Minimalist', 'Bohemian', 'Preppy', 'Gothic', 'Punk', 'Retro'
  ],
  occasions: [
    'Work', 'Weekend', 'Party', 'Date', 'Casual', 'Sport', 'Travel', 'Holiday'
  ],
};

class AuthService {
  constructor() {
    // No initialization needed for expo-auth-session
  }

  // Google OAuth configuration
  private getGoogleOAuthConfig() {
    return {
      clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      redirectUri: AuthSession.makeRedirectUri({
        scheme: undefined, // Use default scheme
        path: 'auth',
        preferLocalhost: true,
      }),
      scopes: ['openid', 'profile', 'email'],
      responseType: 'id_token',
    };
  }

  // Check if username is available
  async checkUsernameAvailability(username: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username.toLowerCase())
        .single();

      return !data; // If no data found, username is available
    } catch (error) {
      console.error('Error checking username availability:', error);
      return false;
    }
  }

  // Create user profile
  async createUserProfile(userId: string, onboardingData: OnboardingData): Promise<UserProfile | null> {
    try {
      // Check username availability first
      const isAvailable = await this.checkUsernameAvailability(onboardingData.username);
      if (!isAvailable) {
        throw new Error('Username is already taken');
      }

      const profileData = {
        // Remove explicit id - let database auto-generate it
        user_id: userId, // Keep user_id for compatibility and link to auth.users
        username: onboardingData.username.toLowerCase(),
        full_name: onboardingData.full_name || '',
        bio: onboardingData.bio || '',
        country_code: onboardingData.country_code,
        timezone: onboardingData.timezone,
        is_public: onboardingData.is_public,
        preferences: {
          style_preferences: onboardingData.style_preferences || {},
          size_preferences: onboardingData.size_preferences || {},
          notification_settings: onboardingData.notification_settings || {
            new_followers: true,
            competition_updates: true,
            outfit_suggestions: true,
            friend_activities: true,
          },
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single();

      if (error) throw error;

      return data as UserProfile;
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  }

  // Google Sign-In using expo-auth-session
  async signInWithGoogle(): Promise<SocialAuthResult> {
    try {
      const config = this.getGoogleOAuthConfig();

      if (!config.clientId) {
        throw new Error('Google Web Client ID not configured');
      }

      // Generate state parameter for security
      const state = toHexString(await Crypto.getRandomBytesAsync(32));

      // Create auth request
      const authRequest = new AuthSession.AuthRequest({
        clientId: config.clientId,
        redirectUri: config.redirectUri,
        scopes: config.scopes,
        responseType: config.responseType,
        state: state,
        extraParams: {
          nonce: toHexString(await Crypto.getRandomBytesAsync(32)),
        },
      });

      // Start the auth session
      const result = await authRequest.promptAsync({});

      if (result.type === 'success') {
        // Get the ID token from the response
        const { params } = result;
        const idToken = params.id_token;

        if (!idToken) {
          throw new Error('No ID token received from Google');
        }

        // Decode the ID token to get user info (basic decode without verification)
        const userInfo = this.decodeJWT(idToken);

        // Check if user exists in Supabase
        // @ts-ignore - Temporary fix for API compatibility
        const { data: existingUser, error: userError } = await supabase
          .from('profiles')
          .single();

        if (userError && userError.code !== 'PGRST116') {
          throw userError;
        }

        // Sign in to Supabase with ID token
        const { error: signInError } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: idToken,
        });

        if (signInError) throw signInError;

        return {
          success: true,
          user: {
            id: userInfo.sub,
            email: userInfo.email,
            name: userInfo.name,
            picture: userInfo.picture,
          },
          profile: existingUser,
          requiresOnboarding: !existingUser,
        };
      } else {
        return {
          success: false,
          error: 'Google sign-in was cancelled',
        };
      }
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      return {
        success: false,
        error: error.message || 'Google sign-in failed',
      };
    }
  }

  // Simple JWT decoder (for getting user info from ID token)
  private decodeJWT(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT token');
      }

      const payload = parts[1];
      const decoded = Buffer.from(payload, 'base64').toString('utf-8');
      return JSON.parse(decoded);
    } catch (error) {
      console.error('Error decoding JWT:', error);
      throw new Error('Failed to decode ID token');
    }
  }

  // Facebook Sign-In
  async signInWithFacebook(): Promise<SocialAuthResult> {
    try {
      const redirectUri = AuthSession.makeRedirectUri({
        scheme: undefined, // Use default scheme
        path: 'auth',
        preferLocalhost: true,
      });

      const authUrl =
        `https://www.facebook.com/v13.0/dialog/oauth?client_id=${process.env.EXPO_PUBLIC_FACEBOOK_APP_ID}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&scope=email,public_profile` +
        `&response_type=token`;

      // @ts-ignore - Temporary fix for API compatibility
        const result = await AuthSession.startAsync({ authUrl });

      if (result.type === 'success' && result.params.access_token) {
        const accessToken = result.params.access_token;

        // Sign in to Supabase with access token
        const { error: signInError } = await supabase.auth.signInWithIdToken({
          provider: 'facebook',
          token: accessToken,
        });

        if (signInError) throw signInError;

        // Get user profile from Supabase
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          throw new Error('Could not get user from Supabase.');
        }

        // Check if user exists in profiles table
        const { data: existingUser, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (userError && userError.code !== 'PGRST116') {
          throw userError;
        }

        return {
          success: true,
          user: user,
          profile: existingUser,
          requiresOnboarding: !existingUser,
        };
      } else {
        return {
          success: false,
          error: 'Facebook sign-in was cancelled or failed',
        };
      }
    } catch (error: any) {
      console.error('Facebook sign-in error:', error);
      return {
        success: false,
        error: error.message || 'Facebook sign-in failed',
      };
    }
  }

  // TODO: Implement Instagram Sign-In using a method compatible with Expo's managed workflow.
  // This may require using a different OAuth flow or a web-based authentication approach.
  async signInWithInstagram(): Promise<SocialAuthResult> {
    console.warn('Instagram sign-in is not yet implemented for Expo managed workflow.');
    return {
      success: false,
      error: 'Instagram sign-in is not available at this time.',
    };
  }


  // Complete onboarding process
  async completeOnboarding(onboardingData: OnboardingData): Promise<SocialAuthResult> {
    try {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      // Create profile
      const profile = await this.createUserProfile(user.id, onboardingData);

      return {
        success: true,
        user,
        profile,
        requiresOnboarding: false,
      };
    } catch (error: any) {
      console.error('Onboarding completion error:', error);
      return {
        success: false,
        error: error.message || 'Failed to complete onboarding',
      };
    }
  }

  // Sign out
  async signOut(): Promise<void> {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }

  // Get current user profile
  async getCurrentUserProfile(): Promise<UserProfile | null> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return null;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        return null;
      }

      return profile as UserProfile;
    } catch (error) {
      console.error('Error getting current user profile:', error);
      return null;
    }
  }

  // Update user profile
  async updateUserProfile(updates: Partial<OnboardingData>): Promise<UserProfile | null> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      // If username is being updated, check availability
      if (updates.username) {
        const isAvailable = await this.checkUsernameAvailability(updates.username);
        if (!isAvailable) {
          throw new Error('Username is already taken');
        }
      }

      const updateData = {
        ...updates,
        username: updates.username ? updates.username.toLowerCase() : undefined,
        updated_at: new Date().toISOString(),
      };

      const { data: profile, error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      return profile as UserProfile;
    } catch (error: any) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }
  // Sign in with magic link
  async signInWithMagicLink(email: string): Promise<SocialAuthResult> {
    try {
      console.log('Sending magic link to:', email);

      const { data, error } = await supabase.auth.signInWithOtp({
        email: email.toLowerCase().trim(),
        options: {
          // Redirect to app scheme for deep linking
          emailRedirectTo: '7ftrends://auth/callback',
        },
      });

      if (error) {
        console.error('Magic link error:', error);

        let errorMessage = 'Failed to send magic link. Please try again.';
        if (error.message?.includes('rate_limit')) {
          errorMessage = 'Too many requests. Please wait a moment and try again.';
        } else if (error.message?.includes('network')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (error.message?.includes('Invalid email')) {
          errorMessage = 'Invalid email address. Please check and try again.';
        }

        return {
          success: false,
          error: errorMessage,
        };
      }

      console.log('Magic link sent successfully');
      return {
        success: true,
        message: `Magic link sent to ${email.toLowerCase().trim()}. Check your email to complete sign-in.`,
      };

    } catch (error: any) {
      console.error('Magic link send failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to send magic link. Please try again.',
      };
    }
  }

  // Sign in with email or username
  async signInWithEmailOrUsername(loginIdentifier: string, password: string): Promise<SocialAuthResult> {
    try {
      console.log('Attempting sign in for:', loginIdentifier);
      let emailToSignIn = loginIdentifier;

      // Check if the loginIdentifier is an email
      const isEmail = /\S+@\S+\.\S+/.test(loginIdentifier);
      console.log('Is loginIdentifier an email?', isEmail);

      if (!isEmail) {
        // If it's not an email, assume it's a username and try to find the associated email
        console.log('Login identifier is not an email, attempting username lookup...');
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .eq('username', loginIdentifier.toLowerCase())
          .single();

        if (profileError) {
          console.error('Profile lookup error:', profileError);
          throw new Error('Invalid username or password.');
        }
        if (!profile) {
          console.log('No profile found for username:', loginIdentifier);
          throw new Error('Invalid username or password.');
        }
        emailToSignIn = profile.email;
        console.log('Found email for username:', emailToSignIn);
      }

      console.log('Attempting Supabase sign in with email:', emailToSignIn);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailToSignIn,
        password: password,
      });

      if (error) {
        console.error('Supabase signInWithPassword error:', error);
        // Handle specific network errors
        if (error.message.includes('Failed to fetch') ||
            error.message.includes('Network request failed') ||
            error.status === 0) {
          return {
            success: false,
            error: 'Network connection failed, please check your network settings',
          };
        }

        // Handle invalid credentials specifically
        if (error.message.includes('Invalid login credentials') ||
            error.message.includes('invalid_credentials')) {
          return {
            success: false,
            error: 'Invalid email/username or password. Please check your credentials.',
          };
        }
        throw error;
      }

      console.log('Supabase sign in successful. Checking onboarding status...');
      // Check if user has completed onboarding
      const { data: existingProfile, error: profileCheckError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', data.user.id)
        .single();

      if (profileCheckError && profileCheckError.code !== 'PGRST116') { // PGRST116 means no rows found
        console.error('Onboarding profile check error:', profileCheckError);
        throw profileCheckError;
      }

      console.log('Onboarding status:', !existingProfile ? 'Requires Onboarding' : 'Onboarded');
      return {
        success: true,
        user: data.user,
        profile: existingProfile,
        requiresOnboarding: !existingProfile,
      };
    } catch (error: any) {
      console.error('Sign in process failed:', error);

      // Provide more specific error messages
      let errorMessage = 'Login failed, please try again later';

      if (error?.code === 'PGRST204') {
        errorMessage = 'Database schema error. Please try again in a few moments.';
      } else if (error?.code === 'PGRST205') {
        errorMessage = 'Profile setup incomplete. Please complete onboarding.';
      } else if (error?.message?.includes('Invalid login')) {
        errorMessage = 'Invalid email or password. Please check your credentials.';
      } else if (error?.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }
}

// Create singleton instance
export const authService = new AuthService();

// Export convenience functions
export const {
  signInWithGoogle,
  signInWithFacebook,
  signInWithInstagram,
  completeOnboarding,
  signOut,
  getCurrentUserProfile,
  updateUserProfile,
  checkUsernameAvailability,
  signInWithEmailOrUsername,
  signInWithMagicLink,
} = authService;

export default authService;
