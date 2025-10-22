import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../utils/constants';
import { theme } from '../../theme/theme';
import Input from '../ui/Input';
import { supabase } from '../../utils/supabase';
import { useAuthStore } from '../../store/authStore';

const MagicLinkAuth = ({ navigation, onAuthSuccess }) => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [canResend, setCanResend] = useState(true);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [authState, setAuthState] = useState('input'); // 'input', 'sent', 'verifying', 'success'

  const { setUser, setSession } = useAuthStore();

  // Email validation
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Send magic link
  const sendMagicLink = useCallback(async () => {
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setEmailError('');

    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        email: email.toLowerCase().trim(),
        options: {
          // Redirect to app scheme for deep linking
          emailRedirectTo: '7ftrends://auth/callback',
        },
      });

      if (error) {
        throw error;
      }

      setMagicLinkSent(true);
      setAuthState('sent');
      startResendCountdown();

      // Show success message
      Alert.alert(
        'Magic Link Sent! 📧',
        `Check your email for a magic link to complete sign-in.\n\nEmail sent to: ${email.toLowerCase().trim()}`,
        [{ text: 'OK', style: 'default' }]
      );

    } catch (error) {
      console.error('Magic link error:', error);
      let errorMessage = 'Failed to send magic link. Please try again.';

      if (error.message?.includes('rate_limit')) {
        errorMessage = 'Too many requests. Please wait a moment and try again.';
      } else if (error.message?.includes('network')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message?.includes('Invalid email')) {
        errorMessage = 'Invalid email address. Please check and try again.';
      }

      setEmailError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [email]);

  // Start resend countdown
  const startResendCountdown = () => {
    setCanResend(false);
    setResendCountdown(60);

    const interval = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Resend magic link
  const resendMagicLink = useCallback(async () => {
    if (!canResend) return;

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.toLowerCase().trim(),
        options: {
          emailRedirectTo: '7ftrends://auth/callback',
        },
      });

      if (error) {
        throw error;
      }

      Alert.alert(
        'Magic Link Resent! 📧',
        'Check your email for the new magic link.',
        [{ text: 'OK', style: 'default' }]
      );

      startResendCountdown();
    } catch (error) {
      console.error('Resend error:', error);
      setEmailError('Failed to resend magic link. Please try again.');
    }
  }, [email, canResend]);

  // Check email input and handle changes
  const handleEmailChange = (text) => {
    setEmail(text);
    setEmailError('');
  };

  // Handle form submission
  const handleSubmit = () => {
    sendMagicLink();
  };

  // Reset to initial state
  const handleReset = () => {
    setEmail('');
    setEmailError('');
    setMagicLinkSent(false);
    setAuthState('input');
    setCanResend(true);
    setResendCountdown(0);
  };

  // Open email client
  const openEmailClient = () => {
    const emailProviders = [
      'mailto:',
      'gmail.com',
      'outlook.com',
      'yahoo.com',
    ];

    // Try to open the default email client
    Linking.openURL('mailto:').catch(() => {
      Alert.alert(
        'Open Email App',
        'Please open your email app and check for the magic link from 7Ftrends.',
        [{ text: 'OK', style: 'default' }]
      );
    });
  };

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        (async () => {
          if (event === 'SIGNED_IN' && session?.user) {
            setAuthState('success');

            // Update auth store
            setUser(session.user);
            setSession(session);

            // Show success message
            Alert.alert(
              'Welcome Back! 👋',
              'You have successfully signed in.',
              [
                {
                  text: 'Continue',
                  onPress: async () => {
                    try {
                      // Navigate based on whether user needs onboarding
                      const { data: profile } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('user_id', session.user.id)
                        .single();

                      if (profile) {
                        // User has completed onboarding, go to main app
                        navigation.reset({
                          index: 0,
                          routes: [{ name: 'MainTabs' }],
                        });
                      } else {
                        // User needs onboarding
                        navigation.replace('Onboarding', { initialSocialUser: session.user });
                      }
                    } catch (error) {
                      console.error('Profile check error:', error);
                      // Default to onboarding if there's an error
                      navigation.replace('Onboarding', { initialSocialUser: session.user });
                    }
                  },
                },
              ]
            );
          } else if (event === 'TOKEN_REFRESHED' && session?.user) {
            // Update session when token is refreshed
            setSession(session);
          }
        })();
      }
    );

    return () => subscription.unsubscribe();
  }, [onAuthSuccess, setUser, setSession]);

  // Render input screen
  const renderInputScreen = () => (
    <View style={styles.content}>
      {/* Logo and Title */}
      <View style={styles.header}>
        <Text style={styles.logo}>7Ftrends</Text>
        <Text style={styles.subtitle}>Sign in with Magic Link</Text>
        <Text style={styles.description}>
          Enter your email address and we'll send you a magic link to sign in instantly.
        </Text>
      </View>

      {/* Email Input */}
      <Input
        label="Email Address"
        placeholder="Enter your email"
        value={email}
        onChangeText={handleEmailChange}
        error={emailError}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        placeholderTextColor={COLORS.textSecondary}
        style={styles.input}
      />

      {/* Submit Button */}
      <TouchableOpacity
        style={[
          styles.button,
          styles.primaryButton,
          (!email || isLoading) && styles.buttonDisabled,
        ]}
        onPress={handleSubmit}
        disabled={!email || isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Sending...' : 'Send Magic Link'}
        </Text>
      </TouchableOpacity>

      {/* Alternative Options */}
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>OR</Text>
        <View style={styles.dividerLine} />
      </View>

      <TouchableOpacity
        style={[styles.button, styles.secondaryButton]}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.secondaryButtonText}>Back to Sign In</Text>
      </TouchableOpacity>
    </View>
  );

  // Render confirmation screen
  const renderConfirmationScreen = () => (
    <View style={styles.content}>
      {/* Success Icon */}
      <View style={styles.successIcon}>
        <Text style={styles.successIconText}>✉️</Text>
      </View>

      {/* Success Message */}
      <View style={styles.confirmationHeader}>
        <Text style={styles.logo}>7Ftrends</Text>
        <Text style={styles.confirmationTitle}>Check Your Email 📧</Text>
        <Text style={styles.confirmationDescription}>
          We've sent a magic link to:
        </Text>
        <Text style={styles.emailDisplay}>{email.toLowerCase().trim()}</Text>
        <Text style={styles.confirmationSubtext}>
          Click the link in the email to sign in. The link will expire in 24 hours.
        </Text>
      </View>

      {/* Open Email Button */}
      <TouchableOpacity
        style={[styles.button, styles.primaryButton]}
        onPress={openEmailClient}
      >
        <Text style={styles.buttonText}>Open Email App</Text>
      </TouchableOpacity>

      {/* Resend Section */}
      <View style={styles.resendSection}>
        <Text style={styles.resendText}>
          Didn't receive the email?
        </Text>
        <TouchableOpacity
          onPress={resendMagicLink}
          disabled={!canResend}
        >
          <Text style={[
            styles.resendLink,
            !canResend && styles.resendLinkDisabled,
          ]}>
            {canResend ? 'Resend Magic Link' : `Resend in ${resendCountdown}s`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Change Email */}
      <TouchableOpacity
        style={[styles.button, styles.ghostButton]}
        onPress={handleReset}
      >
        <Text style={styles.ghostButtonText}>Use Different Email</Text>
      </TouchableOpacity>
    </View>
  );

  // Render verifying screen
  const renderVerifyingScreen = () => (
    <View style={styles.content}>
      <View style={styles.verifyingIcon}>
        <Text style={styles.verifyingIconText}>⏳</Text>
      </View>
      <Text style={styles.verifyingTitle}>Verifying...</Text>
      <Text style={styles.verifyingDescription}>
        Please wait while we verify your magic link.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {authState === 'input' && renderInputScreen()}
          {authState === 'sent' && renderConfirmationScreen()}
          {authState === 'verifying' && renderVerifyingScreen()}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SIZES.lg,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: SIZES.xl,
  },
  logo: {
    fontFamily: theme.typography.fontFamily.logo,
    fontSize: theme.typography.fontSize['4xl'],
    color: theme.colors.text.primary,
    marginBottom: SIZES.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: theme.typography.fontSize.xl,
    color: theme.colors.text.primary,
    marginBottom: SIZES.sm,
    textAlign: 'center',
  },
  description: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.base,
  },
  input: {
    marginBottom: SIZES.lg,
  },
  button: {
    ...theme.components.button.primary,
    marginBottom: SIZES.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  primaryButton: {
    backgroundColor: theme.colors.accent,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
  },
  ghostButton: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  buttonDisabled: {
    backgroundColor: theme.colors.text.placeholder,
    opacity: 0.6,
  },
  buttonText: {
    ...theme.components.button.primary,
    color: theme.colors.text.primary,
  },
  secondaryButtonText: {
    ...theme.components.button.secondary,
    color: theme.colors.text.primary,
  },
  ghostButtonText: {
    ...theme.components.button.ghost,
    color: theme.colors.text.secondary,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SIZES.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border.secondary,
  },
  dividerText: {
    paddingHorizontal: SIZES.md,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.tertiary,
  },
  // Confirmation screen styles
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.status.success + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.lg,
    alignSelf: 'center',
  },
  successIconText: {
    fontSize: 40,
  },
  confirmationHeader: {
    alignItems: 'center',
    marginBottom: SIZES.xl,
  },
  confirmationTitle: {
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: theme.typography.fontSize.xl,
    color: theme.colors.text.primary,
    marginBottom: SIZES.sm,
    textAlign: 'center',
  },
  confirmationDescription: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: SIZES.xs,
  },
  emailDisplay: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.accent,
    fontWeight: theme.typography.fontWeight.semibold,
    textAlign: 'center',
    marginBottom: SIZES.sm,
  },
  confirmationSubtext: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.sm,
  },
  resendSection: {
    alignItems: 'center',
    marginVertical: SIZES.lg,
  },
  resendText: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    marginBottom: SIZES.xs,
  },
  resendLink: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.accent,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  resendLinkDisabled: {
    color: theme.colors.text.placeholder,
  },
  // Verifying screen styles
  verifyingIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.status.info + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.lg,
    alignSelf: 'center',
  },
  verifyingIconText: {
    fontSize: 40,
  },
  verifyingTitle: {
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: theme.typography.fontSize.xl,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: SIZES.sm,
  },
  verifyingDescription: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
});

export default MagicLinkAuth;