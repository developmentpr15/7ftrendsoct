// Enhanced Social Authentication Screen
// Integrates Google, Facebook, and Instagram authentication with onboarding

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ChevronLeft,
  Heart,
  AlertCircle,
} from 'lucide-react-native';

import { authService } from '../../services/authService';
import OnboardingFlow from './OnboardingFlow';
import { supabase } from '../../lib/supabase';

const SocialAuthScreen = ({ initialMode = 'signin' }) => {
  const navigation = useNavigation();

  // UI states
  const [mode, setMode] = useState(initialMode); // 'signin' or 'signup'
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState({
    google: false,
    facebook: false,
    instagram: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [socialUser, setSocialUser] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });

  // Error states
  const [errors, setErrors] = useState({});

  // Social icons (you would need to add actual icons)
  const SocialIcons = {
    google: () => (
      <View style={[styles.socialIcon, styles.googleIcon]}>
        <Text style={styles.socialIconText}>G</Text>
      </View>
    ),
    facebook: () => (
      <View style={[styles.socialIcon, styles.facebookIcon]}>
        <Text style={styles.socialIconText}>f</Text>
      </View>
    ),
    instagram: () => (
      <View style={[styles.socialIcon, styles.instagramIcon]}>
        <Text style={styles.socialIconText}>📷</Text>
      </View>
    ),
  };

  // Handle social sign in
  const handleSocialSignIn = async (provider) => {
    setSocialLoading(prev => ({ ...prev, [provider]: true }));

    try {
      let result;

      switch (provider) {
        case 'google':
          result = await authService.signInWithGoogle();
          break;
        case 'facebook':
          result = await authService.signInWithFacebook();
          break;
        case 'instagram':
          result = await authService.signInWithInstagram();
          break;
        default:
          throw new Error('Invalid provider');
      }

      if (result.success) {
        if (result.requiresOnboarding) {
          // User needs to complete onboarding
          setSocialUser(result.user);
          setShowOnboarding(true);
        } else {
          // User already has profile, sign them in
          navigation.reset({
            index: 0,
            routes: [{ name: 'MainTabs' }],
          });
        }
      } else {
        Alert.alert('Sign In Error', result.error || 'Failed to sign in');
      }
    } catch (error) {
      console.error(`${provider} sign-in error:`, error);
      Alert.alert('Error', `Failed to sign in with ${provider}`);
    } finally {
      setSocialLoading(prev => ({ ...prev, [provider]: false }));
    }
  };

  // Handle email/password sign in
  const handleEmailSignIn = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      // Check if user has completed onboarding
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', data.user.id)
        .single();

      if (profileError || !profile) {
        // User needs onboarding
        setSocialUser(data.user);
        setShowOnboarding(true);
      } else {
        // User is fully onboarded
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainTabs' }],
        });
      }
    } catch (error) {
      console.error('Email sign-in error:', error);
      Alert.alert('Sign In Error', error.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  // Handle email/password sign up
  const handleEmailSignUp = async () => {
    if (!validateForm(true)) return;

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.email.split('@')[0], // Temporary name
          },
        },
      });

      if (error) throw error;

      // New user needs onboarding
      setSocialUser(data.user);
      setShowOnboarding(true);
    } catch (error) {
      console.error('Email sign-up error:', error);
      Alert.alert('Sign Up Error', error.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  // Validate form
  const validateForm = (isSignUp = false) => {
    const newErrors = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Confirm password validation (sign up only)
    if (isSignUp && !formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (isSignUp && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form input changes
  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  // Handle onboarding completion
  const handleOnboardingComplete = (result) => {
    setShowOnboarding(false);
    setSocialUser(null);

    // Reset navigation to main app
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' }],
    });
  };

  // Handle onboarding cancel
  const handleOnboardingCancel = () => {
    setShowOnboarding(false);
    setSocialUser(null);

    // Sign out the user since they cancelled onboarding
    authService.signOut();
  };

  // If showing onboarding, render onboarding flow
  if (showOnboarding) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <OnboardingFlow
          initialSocialUser={socialUser}
          onComplete={handleOnboardingComplete}
        />

        {/* Cancel button for onboarding */}
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleOnboardingCancel}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <ChevronLeft size={24} color="#666" />
            </TouchableOpacity>

            <View style={styles.logoContainer}>
              <View style={styles.logo}>
                <Heart size={40} color="#FF6B6B" />
              </View>
              <Text style={styles.appName}>7Ftrends</Text>
              <Text style={styles.tagline}>Style Without Borders</Text>
            </View>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>
              {mode === 'signin' ? 'Welcome Back' : 'Join 7Ftrends'}
            </Text>
            <Text style={styles.formSubtitle}>
              {mode === 'signin'
                ? 'Sign in to continue your style journey'
                : 'Create your account to get started'
              }
            </Text>

            {/* Email Input */}
            <View style={styles.inputGroup}>
              <View style={[styles.inputContainer, errors.email && styles.inputError]}>
                <Mail size={20} color="#999" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={formData.email}
                  onChangeText={(text) => updateFormData('email', text)}
                  placeholder="Email address"
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              {errors.email && (
                <Text style={styles.errorText}>{errors.email}</Text>
              )}
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <View style={[styles.inputContainer, errors.password && styles.inputError]}>
                <Lock size={20} color="#999" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={formData.password}
                  onChangeText={(text) => updateFormData('password', text)}
                  placeholder="Password"
                  placeholderTextColor="#999"
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff size={20} color="#999" />
                  ) : (
                    <Eye size={20} color="#999" />
                  )}
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}
            </View>

            {/* Confirm Password (Sign Up Only) */}
            {mode === 'signup' && (
              <View style={styles.inputGroup}>
                <View style={[styles.inputContainer, errors.confirmPassword && styles.inputError]}>
                  <Lock size={20} color="#999" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={formData.confirmPassword}
                    onChangeText={(text) => updateFormData('confirmPassword', text)}
                    placeholder="Confirm password"
                    placeholderTextColor="#999"
                    secureTextEntry={!showPassword}
                  />
                </View>
                {errors.confirmPassword && (
                  <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                )}
              </View>
            )}

            {/* Forgot Password (Sign In Only) */}
            {mode === 'signin' && (
              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot password?</Text>
              </TouchableOpacity>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={mode === 'signin' ? handleEmailSignIn : handleEmailSignUp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {mode === 'signin' ? 'Sign In' : 'Create Account'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Sign In Buttons */}
            <View style={styles.socialButtons}>
              <TouchableOpacity
                style={[styles.socialButton, styles.googleButton]}
                onPress={() => handleSocialSignIn('google')}
                disabled={socialLoading.google}
              >
                {socialLoading.google ? (
                  <ActivityIndicator color="#666" size="small" />
                ) : (
                  <>
                    <SocialIcons.google />
                    <Text style={styles.googleButtonText}>Continue with Google</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.socialButton, styles.facebookButton]}
                onPress={() => handleSocialSignIn('facebook')}
                disabled={socialLoading.facebook}
              >
                {socialLoading.facebook ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <SocialIcons.facebook />
                    <Text style={styles.facebookButtonText}>Continue with Facebook</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.socialButton, styles.instagramButton]}
                onPress={() => handleSocialSignIn('instagram')}
                disabled={socialLoading.instagram}
              >
                {socialLoading.instagram ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <SocialIcons.instagram />
                    <Text style={styles.instagramButtonText}>Continue with Instagram</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Switch Mode */}
            <View style={styles.switchMode}>
              <Text style={styles.switchModeText}>
                {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
              </Text>
              <TouchableOpacity onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
                <Text style={styles.switchModeLink}>
                  {mode === 'signin' ? 'Sign Up' : 'Sign In'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  tagline: {
    fontSize: 16,
    color: '#666',
  },
  formContainer: {
    paddingHorizontal: 20,
    flex: 1,
  },
  formTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    lineHeight: 22,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 12,
    backgroundColor: '#fafafa',
  },
  inputError: {
    borderColor: '#FF6B6B',
    backgroundColor: '#fff5f5',
  },
  inputIcon: {
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: '#1a1a1a',
  },
  eyeButton: {
    padding: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#FF6B6B',
    marginTop: 8,
    marginLeft: 16,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#4ECDC4',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#4ECDC4',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  submitButtonDisabled: {
    backgroundColor: '#e5e5e5',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e5e5',
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#999',
  },
  socialButtons: {
    gap: 12,
    marginBottom: 32,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  socialIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleIcon: {
    backgroundColor: '#fff',
  },
  facebookIcon: {
    backgroundColor: '#1877f2',
  },
  instagramIcon: {
    backgroundColor: '#fff',
  },
  socialIconText: {
    fontSize: 14,
    fontWeight: '700',
  },
  googleButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  facebookButton: {
    backgroundColor: '#1877f2',
  },
  facebookButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  instagramButton: {
    backgroundColor: '#E4405F',
  },
  instagramButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  switchMode: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    paddingVertical: 24,
  },
  switchModeText: {
    fontSize: 14,
    color: '#666',
  },
  switchModeLink: {
    fontSize: 14,
    color: '#4ECDC4',
    fontWeight: '600',
  },
  cancelButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    zIndex: 10,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
});

export default SocialAuthScreen;