// Comprehensive Authentication Service
// Handles social authentication and profile creation for 7Ftrends

import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { AccessToken, GraphRequest, GraphRequestManager, LoginManager } from 'react-native-fbsdk';
import { supabase } from '../utils/supabase';
import { Platform, Alert } from 'react-native';

// Social auth result types
export interface SocialAuthResult {
  success: boolean;
  user?: any;
  profile?: any;
  error?: string;
  requiresOnboarding?: boolean;
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
    this.initializeGoogleSignIn();
  }

  // Initialize Google Sign-In
  private initializeGoogleSignIn() {
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      offlineAccess: true,
      hostedDomain: '',
      forceCodeForRefreshToken: true,
    });
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
        user_id: userId,
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

  // Google Sign-In
  async signInWithGoogle(): Promise<SocialAuthResult> {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();

      // Check if user exists in Supabase
      const { data: existingUser, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userInfo.user.id)
        .single();

      if (userError && userError.code !== 'PGRST116') {
        throw userError;
      }

      // Sign in to Supabase
      const { error: signInError } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: userInfo.idToken,
      });

      if (signInError) throw signInError;

      return {
        success: true,
        user: userInfo.user,
        profile: existingUser,
        requiresOnboarding: !existingUser,
      };
    } catch (error: any) {
      console.error('Google sign-in error:', error);

      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        return {
          success: false,
          error: 'Google sign-in was cancelled',
        };
      } else if (error.code === statusCodes.IN_PROGRESS) {
        return {
          success: false,
          error: 'Google sign-in is already in progress',
        };
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        return {
          success: false,
          error: 'Google Play Services not available',
        };
      }

      return {
        success: false,
        error: error.message || 'Google sign-in failed',
      };
    }
  }

  // Facebook Sign-In
  async signInWithFacebook(): Promise<SocialAuthResult> {
    try {
      // Attempt login with limited permissions
      const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);

      if (result.isCancelled) {
        return {
          success: false,
          error: 'Facebook sign-in was cancelled',
        };
      }

      // Get access token
      const data = await AccessToken.getCurrentAccessToken();

      if (!data) {
        return {
          success: false,
          error: 'Failed to get access token',
        };
      }

      // Get user profile from Facebook Graph API
      const profile = await this.getFacebookProfile(data.accessToken);

      // Sign in to Supabase with access token
      const { error: signInError } = await supabase.auth.signInWithIdToken({
        provider: 'facebook',
        token: data.accessToken.toString(),
      });

      if (signInError) throw signInError;

      // Check if user exists in profiles table
      const { data: existingUser, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', profile.id)
        .single();

      return {
        success: true,
        user: profile,
        profile: existingUser,
        requiresOnboarding: !existingUser,
      };
    } catch (error: any) {
      console.error('Facebook sign-in error:', error);
      return {
        success: false,
        error: error.message || 'Facebook sign-in failed',
      };
    }
  }

  // Get Facebook user profile
  private getFacebookProfile(accessToken: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const request = new GraphRequest(
        '/me',
        {
          accessToken,
          parameters: {
            fields: {
              string: 'id,name,email,picture.type(large)',
            },
          },
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );

      new GraphRequestManager().addRequest(request).start();
    });
  }

  // Instagram Sign-In (using Facebook Login)
  async signInWithInstagram(): Promise<SocialAuthResult> {
    try {
      // Instagram requires Facebook Login
      const result = await LoginManager.logInWithPermissions([
        'public_profile',
        'email',
        'instagram_basic',
      ]);

      if (result.isCancelled) {
        return {
          success: false,
          error: 'Instagram sign-in was cancelled',
        };
      }

      const data = await AccessToken.getCurrentAccessToken();

      if (!data) {
        return {
          success: false,
          error: 'Failed to get access token',
        };
      }

      // Get Instagram profile
      const profile = await this.getInstagramProfile(data.accessToken.toString());

      // Sign in to Supabase
      const { error: signInError } = await supabase.auth.signInWithIdToken({
        provider: 'facebook', // Instagram uses Facebook auth
        token: data.accessToken.toString(),
      });

      if (signInError) throw signInError;

      // Check if user exists in profiles table
      const { data: existingUser, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', profile.id)
        .single();

      return {
        success: true,
        user: profile,
        profile: existingUser,
        requiresOnboarding: !existingUser,
      };
    } catch (error: any) {
      console.error('Instagram sign-in error:', error);
      return {
        success: false,
        error: error.message || 'Instagram sign-in failed',
      };
    }
  }

  // Get Instagram profile
  private getInstagramProfile(accessToken: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const request = new GraphRequest(
        '/me',
        {
          accessToken,
          parameters: {
            fields: {
              string: 'id,name,email,instagram_account',
            },
          },
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );

      new GraphRequestManager().addRequest(request).start();
    });
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

      if (Platform.OS === 'android') {
        await GoogleSignin.signOut();
      }

      await LoginManager.logOut();
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
} = authService;

export default authService;