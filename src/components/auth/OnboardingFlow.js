// Complete Onboarding Flow Component
// Handles country selection, profile creation, and preferences setup

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { COUNTRIES, TIMEZONES, STYLE_PREFERENCES } from '../../services/authService';
import { authService } from '../../services/authService';

const OnboardingFlow = ({ initialSocialUser = null, onComplete }) => {
  const navigation = useNavigation();

  // Screen states
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    bio: '',
    country_code: 'US',
    timezone: 'America/New_York',
    is_public: true,
    style_preferences: {
      colors: [],
      styles: [],
      occasions: [],
    },
    size_preferences: {
      tops: '',
      bottoms: '',
      shoes: '',
    },
    notification_settings: {
      new_followers: true,
      competition_updates: true,
      outfit_suggestions: true,
      friend_activities: true,
    },
  });

  // UI states
  const [usernameValid, setUsernameValid] = useState(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedTimezone, setSelectedTimezone] = useState(null);

  const totalSteps = 5;
  const steps = [
    { title: 'Welcome', icon: 'person-outline' },
    { title: 'Country', icon: 'globe-outline' },
    { title: 'Profile', icon: 'person-outline' },
    { title: 'Style', icon: 'color-palette-outline' },
    { title: 'Notifications', icon: 'notifications-outline' },
  ];

  // Auto-select country based on phone locale
  useEffect(() => {
    const detectUserCountry = async () => {
      try {
        // In a real app, you might use a geolocation service
        // For now, default to US
        const usCountry = COUNTRIES.find(c => c.code === 'US');
        setSelectedCountry(usCountry);
        setFormData(prev => ({
          ...prev,
          country_code: 'US',
          timezone: 'America/New_York',
        }));

        const usTimezone = TIMEZONES.find(t => t.value === 'America/New_York');
        setSelectedTimezone(usTimezone);
      } catch (error) {
        console.error('Error detecting country:', error);
      }
    };

    detectUserCountry();
  }, []);

  // Check username availability
  const checkUsername = async (username) => {
    if (!username || username.length < 3) {
      setUsernameValid(false);
      return;
    }

    if (username.length > 20) {
      setUsernameValid(false);
      return;
    }

    setCheckingUsername(true);

    try {
      const isAvailable = await authService.checkUsernameAvailability(username);
      setUsernameValid(isAvailable);
    } catch (error) {
      console.error('Error checking username:', error);
      setUsernameValid(false);
    } finally {
      setCheckingUsername(false);
    }
  };

  // Debounced username check
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.username) {
        checkUsername(formData.username);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.username]);

  // Handle form input changes
  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateStylePreferences = (type, value) => {
    setFormData(prev => ({
      ...prev,
      style_preferences: {
        ...prev.style_preferences,
        [type]: value,
      },
    }));
  };

  const updateSizePreferences = (field, value) => {
    setFormData(prev => ({
      ...prev,
      size_preferences: {
        ...prev.size_preferences,
        [field]: value,
      },
    }));
  };

  const updateNotificationSettings = (field, value) => {
    setFormData(prev => ({
      ...prev,
      notification_settings: {
        ...prev.notification_settings,
        [field]: value,
      },
    }));
  };

  // Validation
  const validateStep = (step) => {
    switch (step) {
      case 0: // Welcome
        return true;

      case 1: // Country
        return !!selectedCountry && !!selectedTimezone;

      case 2: // Profile
        return formData.username.length >= 3 && usernameValid;

      case 3: // Style
        return true; // Style preferences are optional

      case 4: // Notifications
        return true; // Notifications are optional

      default:
        return false;
    }
  };

  // Navigation
  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < totalSteps - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        completeOnboarding();
      }
    } else {
      Alert.alert('Validation Error', 'Please complete all required fields');
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Complete onboarding
  const completeOnboarding = async () => {
    setLoading(true);

    try {
      const result = await authService.completeOnboarding(formData);

      if (result.success) {
        onComplete?.(result);
      } else {
        Alert.alert('Error', result.error || 'Failed to complete onboarding');
      }
    } catch (error) {
      console.error('Onboarding completion error:', error);
      Alert.alert('Error', 'Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  };

  // Render individual steps
  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return renderWelcomeStep();
      case 1:
        return renderCountryStep();
      case 2:
        return renderProfileStep();
      case 3:
        return renderStyleStep();
      case 4:
        return renderNotificationsStep();
      default:
        return null;
    }
  };

  const renderWelcomeStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.welcomeHeader}>
        <View style={styles.welcomeIcon}>
          <Ionicons name="heart" size={60} color="#FF6B6B" />
        </View>
        <Text style={styles.welcomeTitle}>Welcome to 7Ftrends!</Text>
        <Text style={styles.welcomeSubtitle}>
          Your personal fashion companion powered by AI and community style
        </Text>
      </View>

      <View style={styles.featuresContainer}>
        <View style={styles.feature}>
          <View style={styles.featureIcon}>
            <Ionicons name="person-outline" size={24} color="#4ECDC4" />
          </View>
          <View>
            <Text style={styles.featureTitle}>Style Profile</Text>
            <Text style={styles.featureDescription}>
              Create your unique fashion identity
            </Text>
          </View>
        </View>

        <View style={styles.feature}>
          <View style={styles.featureIcon}>
            <Ionicons name="globe-outline" size={24} color="#4ECDC4" />
          </View>
          <View>
            <Text style={styles.featureTitle}>Global Competitions</Text>
            <Text style={styles.featureDescription}>
              Join style challenges from around the world
            </Text>
          </View>
        </View>

        <View style={styles.feature}>
          <View style={styles.featureIcon}>
            <Ionicons name="color-palette-outline" size={24} color="#4ECDC4" />
          </View>
          <View>
            <Text style={styles.featureTitle}>AI Recommendations</Text>
            <Text style={styles.featureDescription}>
              Get personalized outfit suggestions daily
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderCountryStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Where are you from?</Text>
      <Text style={styles.stepSubtitle}>
        Select your country to join regional competitions
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Country</Text>
        <ScrollView style={styles.countryList} showsVerticalScrollIndicator={false}>
          {COUNTRIES.map((country) => (
            <TouchableOpacity
              key={country.code}
              style={[
                styles.countryItem,
                selectedCountry?.code === country.code && styles.selectedCountry,
              ]}
              onPress={() => {
                setSelectedCountry(country);
                updateFormData('country_code', country.code);
              }}
            >
              <Text style={styles.countryFlag}>{country.flag}</Text>
              <Text style={[
                styles.countryName,
                selectedCountry?.code === country.code && styles.selectedCountryText,
              ]}>
                {country.name}
              </Text>
              {selectedCountry?.code === country.code && (
                <Ionicons name="checkmark" size={20} color="#4ECDC4" />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Timezone</Text>
        <ScrollView style={styles.timezoneList} showsVerticalScrollIndicator={false}>
          {TIMEZONES.map((timezone) => (
            <TouchableOpacity
              key={timezone.value}
              style={[
                styles.timezoneItem,
                selectedTimezone?.value === timezone.value && styles.selectedTimezone,
              ]}
              onPress={() => {
                setSelectedTimezone(timezone);
                updateFormData('timezone', timezone.value);
              }}
            >
              <Text style={[
                styles.timezoneName,
                selectedTimezone?.value === timezone.value && styles.selectedTimezoneText,
              ]}>
                {timezone.label}
              </Text>
              {selectedTimezone?.value === timezone.value && (
                <Ionicons name="checkmark" size={20} color="#4ECDC4" />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );

  const renderProfileStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Create Your Profile</Text>
      <Text style={styles.stepSubtitle}>
        This is how others will see you in the community
      </Text>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Username *</Text>
          <TextInput
            style={[
              styles.input,
              usernameValid === false && styles.inputError,
              usernameValid === true && styles.inputSuccess,
            ]}
            value={formData.username}
            onChangeText={(text) => {
              const cleanUsername = text.toLowerCase().replace(/[^a-z0-9_]/g, '');
              updateFormData('username', cleanUsername);
            }}
            placeholder="Choose a username"
            placeholderTextColor="#999"
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={20}
          />
          {checkingUsername && (
            <Text style={styles.helperText}>Checking availability...</Text>
          )}
          {usernameValid === true && (
            <Text style={styles.successText}>✓ Username is available</Text>
          )}
          {usernameValid === false && (
            <Text style={styles.errorText}>✗ Username is taken or invalid</Text>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={formData.full_name}
            onChangeText={(text) => updateFormData('full_name', text)}
            placeholder="Enter your full name"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.bio}
            onChangeText={(text) => updateFormData('bio', text)}
            placeholder="Tell us about your style..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            maxLength={150}
          />
          <Text style={styles.charCount}>{formData.bio.length}/150</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Profile Visibility</Text>
          <View style={styles.visibilityOptions}>
            <TouchableOpacity
              style={[
                styles.visibilityOption,
                formData.is_public && styles.selectedVisibility,
              ]}
              onPress={() => updateFormData('is_public', true)}
            >
              <Text style={[
                styles.visibilityText,
                formData.is_public && styles.selectedVisibilityText,
              ]}>
                Public
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.visibilityOption,
                !formData.is_public && styles.selectedVisibility,
              ]}
              onPress={() => updateFormData('is_public', false)}
            >
              <Text style={[
                styles.visibilityText,
                !formData.is_public && styles.selectedVisibilityText,
              ]}>
                Private
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  const renderStyleStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Your Style Preferences</Text>
      <Text style={styles.stepSubtitle}>
        Help us understand your fashion taste
      </Text>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Favorite Colors</Text>
          <View style={styles.colorGrid}>
            {STYLE_PREFERENCES.colors.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorChip,
                  formData.style_preferences.colors.includes(color) && styles.selectedColor,
                ]}
                onPress={() => {
                  const colors = formData.style_preferences.colors.includes(color)
                    ? formData.style_preferences.colors.filter(c => c !== color)
                    : [...formData.style_preferences.colors, color];
                  updateStylePreferences('colors', colors);
                }}
              >
                <Text style={[
                  styles.colorText,
                  formData.style_preferences.colors.includes(color) && styles.selectedColorText,
                ]}>
                  {color}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Style Preferences</Text>
          <View style={styles.styleGrid}>
            {STYLE_PREFERENCES.styles.map((style) => (
              <TouchableOpacity
                key={style}
                style={[
                  styles.styleChip,
                  formData.style_preferences.styles.includes(style) && styles.selectedStyle,
                ]}
                onPress={() => {
                  const styles = formData.style_preferences.styles.includes(style)
                    ? formData.style_preferences.styles.filter(s => s !== style)
                    : [...formData.style_preferences.styles, style];
                  updateStylePreferences('styles', styles);
                }}
              >
                <Text style={[
                  styles.styleText,
                  formData.style_preferences.styles.includes(style) && styles.selectedStyleText,
                ]}>
                  {style}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Occasions</Text>
          <View style={styles.styleGrid}>
            {STYLE_PREFERENCES.occasions.map((occasion) => (
              <TouchableOpacity
                key={occasion}
                style={[
                  styles.styleChip,
                  formData.style_preferences.occasions.includes(occasion) && styles.selectedStyle,
                ]}
                onPress={() => {
                  const occasions = formData.style_preferences.occasions.includes(occasion)
                    ? formData.style_preferences.occasions.filter(o => o !== occasion)
                    : [...formData.style_preferences.occasions, occasion];
                  updateStylePreferences('occasions', occasions);
                }}
              >
                <Text style={[
                  styles.styleText,
                  formData.style_preferences.occasions.includes(occasion) && styles.selectedStyleText,
                ]}>
                  {occasion}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );

  const renderNotificationsStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Notification Preferences</Text>
      <Text style={styles.stepSubtitle}>
        Choose what updates you want to receive
      </Text>

      <View style={styles.notificationList}>
        <View style={styles.notificationItem}>
          <View style={styles.notificationContent}>
            <Text style={styles.notificationTitle}>New Followers</Text>
            <Text style={styles.notificationDescription}>
              Get notified when someone follows you
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.toggle,
              formData.notification_settings.new_followers && styles.toggleActive,
            ]}
            onPress={() => updateNotificationSettings('new_followers', !formData.notification_settings.new_followers)}
          >
            <View style={[
              styles.toggleCircle,
              formData.notification_settings.new_followers && styles.toggleCircleActive,
            ]} />
          </TouchableOpacity>
        </View>

        <View style={styles.notificationItem}>
          <View style={styles.notificationContent}>
            <Text style={styles.notificationTitle}>Competition Updates</Text>
            <Text style={styles.notificationDescription}>
              Updates on competitions you've joined
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.toggle,
              formData.notification_settings.competition_updates && styles.toggleActive,
            ]}
            onPress={() => updateNotificationSettings('competition_updates', !formData.notification_settings.competition_updates)}
          >
            <View style={[
              styles.toggleCircle,
              formData.notification_settings.competition_updates && styles.toggleCircleActive,
            ]} />
          </TouchableOpacity>
        </View>

        <View style={styles.notificationItem}>
          <View style={styles.notificationContent}>
            <Text style={styles.notificationTitle}>Outfit Suggestions</Text>
            <Text style={styles.notificationDescription}>
              Daily AI-powered outfit recommendations
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.toggle,
              formData.notification_settings.outfit_suggestions && styles.toggleActive,
            ]}
            onPress={() => updateNotificationSettings('outfit_suggestions', !formData.notification_settings.outfit_suggestions)}
          >
            <View style={[
              styles.toggleCircle,
              formData.notification_settings.outfit_suggestions && styles.toggleCircleActive,
            ]} />
          </TouchableOpacity>
        </View>

        <View style={styles.notificationItem}>
          <View style={styles.notificationContent}>
            <Text style={styles.notificationTitle}>Friend Activities</Text>
            <Text style={styles.notificationDescription}>
              See what your friends are up to
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.toggle,
              formData.notification_settings.friend_activities && styles.toggleActive,
            ]}
            onPress={() => updateNotificationSettings('friend_activities', !formData.notification_settings.friend_activities)}
          >
            <View style={[
              styles.toggleCircle,
              formData.notification_settings.friend_activities && styles.toggleCircleActive,
            ]} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${((currentStep + 1) / totalSteps) * 100}%` }
            ]}
          />
        </View>
        <View style={styles.progressSteps}>
          {steps.map((step, index) => (
            <View key={index} style={styles.progressStep}>
              <View style={[
                styles.stepIcon,
                index <= currentStep && styles.stepIconActive,
              ]}>
                <Ionicons
                  name={step.icon}
                  size={16}
                  color={index <= currentStep ? '#4ECDC4' : '#999'}
                />
              </View>
                <Text style={[
                  styles.stepLabel,
                  index <= currentStep && styles.stepLabelActive,
                ]}>
                  {step.title}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderStep()}
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navigation}>
        <TouchableOpacity
          style={[styles.navButton, styles.navButtonSecondary]}
          onPress={prevStep}
          disabled={currentStep === 0}
        >
          <Ionicons name="chevron-back" size={20} color="#666" />
          <Text style={styles.navButtonText}>Previous</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.navButton,
            styles.navButtonPrimary,
            loading && styles.navButtonDisabled,
          ]}
          onPress={nextStep}
          disabled={loading || !validateStep(currentStep)}
        >
          <Text style={styles.navButtonPrimaryText}>
            {loading ? 'Completing...' : currentStep === totalSteps - 1 ? 'Complete' : 'Next'}
          </Text>
          <Ionicons name="chevron-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  progressBar: {
    height: 2,
    backgroundColor: '#f0f0f0',
    borderRadius: 1,
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4ECDC4',
    borderRadius: 1,
  },
  progressSteps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressStep: {
    alignItems: 'center',
    flex: 1,
  },
  stepIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepIconActive: {
    backgroundColor: '#4ECDC4',
  },
  stepLabel: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
  },
  stepLabelActive: {
    color: '#4ECDC4',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stepContent: {
    paddingVertical: 32,
  },
  // Welcome step
  welcomeHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  welcomeIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#fff0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  featuresContainer: {
    gap: 20,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  // Common step styles
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
    marginBottom: 32,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  // Country step
  countryList: {
    maxHeight: 200,
    marginBottom: 24,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    marginBottom: 8,
  },
  selectedCountry: {
    backgroundColor: '#f0fdf4',
    borderColor: '#4ECDC4',
  },
  countryFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  countryName: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
  },
  selectedCountryText: {
    color: '#4ECDC4',
    fontWeight: '600',
  },
  timezoneList: {
    maxHeight: 150,
  },
  timezoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    marginBottom: 8,
  },
  selectedTimezone: {
    backgroundColor: '#f0fdf4',
    borderColor: '#4ECDC4',
  },
  timezoneName: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
  },
  selectedTimezoneText: {
    color: '#4ECDC4',
    fontWeight: '600',
  },
  // Profile step
  form: {
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1a1a1a',
    backgroundColor: '#fafafa',
  },
  inputError: {
    borderColor: '#FF6B6B',
    backgroundColor: '#fff5f5',
  },
  inputSuccess: {
    borderColor: '#4ECDC4',
    backgroundColor: '#f0fdf4',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 14,
    color: '#666',
  },
  successText: {
    fontSize: 14,
    color: '#4ECDC4',
    fontWeight: '600',
  },
  errorText: {
    fontSize: 14,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
  },
  visibilityOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  visibilityOption: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    alignItems: 'center',
  },
  selectedVisibility: {
    backgroundColor: '#4ECDC4',
    borderColor: '#4ECDC4',
  },
  visibilityText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  selectedVisibilityText: {
    color: '#fff',
  },
  // Style step
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    backgroundColor: '#fafafa',
  },
  selectedColor: {
    backgroundColor: '#4ECDC4',
    borderColor: '#4ECDC4',
  },
  colorText: {
    fontSize: 14,
    color: '#666',
  },
  selectedColorText: {
    color: '#fff',
    fontWeight: '600',
  },
  styleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  styleChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    backgroundColor: '#fafafa',
  },
  selectedStyle: {
    backgroundColor: '#4ECDC4',
    borderColor: '#4ECDC4',
  },
  styleText: {
    fontSize: 14,
    color: '#666',
  },
  selectedStyleText: {
    color: '#fff',
    fontWeight: '600',
  },
  // Notifications step
  notificationList: {
    gap: 20,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fafafa',
  },
  notificationContent: {
    flex: 1,
    marginRight: 16,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  notificationDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e5e5e5',
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: '#4ECDC4',
  },
  toggleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    marginLeft: 2,
  },
  toggleCircleActive: {
    marginLeft: 22,
  },
  // Navigation
  navigation: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
  },
  navButtonSecondary: {
    backgroundColor: '#f8f8f8',
  },
  navButtonPrimary: {
    backgroundColor: '#4ECDC4',
  },
  navButtonDisabled: {
    backgroundColor: '#e5e5e5',
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  navButtonPrimaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default OnboardingFlow;