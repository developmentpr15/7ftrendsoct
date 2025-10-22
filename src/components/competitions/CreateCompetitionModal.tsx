/**
 * src/components/competitions/CreateCompetitionModal.tsx
 *
 * Modal for creating new competitions with comprehensive form validation
 * Luxury themed with smooth animations and proper error handling
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { AntDesign, MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { COLORS, SIZES, FONTS, StyleHelpers } from '@/utils/constants';
import { competitionsService, CreateCompetitionRequest, PrizePool } from '@/services/competitionsService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const MODAL_HEIGHT = screenHeight * 0.9;

interface CreateCompetitionModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (competition: any) => void;
}

const CreateCompetitionModal: React.FC<CreateCompetitionModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  // Form state
  const [formData, setFormData] = useState<Partial<CreateCompetitionRequest>>({
    country: 'US',
    title: '',
    theme: '',
    description: '',
    rules: '',
    max_entries: 100,
    start_at: new Date().toISOString(),
    end_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
  });

  const [prizePool, setPrizePool] = useState<PrizePool>({
    points: 1000,
    rewards: [],
    sponsor: '',
    sponsor_logo: '',
  });

  const [bannerImage, setBannerImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Available countries
  const countries = [
    { code: 'US', name: 'United States' },
    { code: 'UK', name: 'United Kingdom' },
    { code: 'FR', name: 'France' },
    { code: 'DE', name: 'Germany' },
    { code: 'IT', name: 'Italy' },
    { code: 'ES', name: 'Spain' },
    { code: 'JP', name: 'Japan' },
    { code: 'KR', name: 'South Korea' },
    { code: 'BR', name: 'Brazil' },
    { code: 'CA', name: 'Canada' },
  ];

  // Handle form field changes
  const updateFormData = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([]);
    }
  }, [errors]);

  // Handle prize pool changes
  const updatePrizePool = useCallback((field: string, value: any) => {
    setPrizePool(prev => ({ ...prev, [field]: value }));
  }, []);

  // Pick banner image
  const pickBannerImage = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setBannerImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  }, []);

  // Date picker for Android
  const showDatePicker = useCallback((field: 'start_at' | 'end_at') => {
    const currentDate = new Date(formData[field] || Date.now());
    DateTimePickerAndroid.open({
      value: currentDate,
      mode: 'date',
      is24Hour: true,
      minimumDate: field === 'start_at' ? new Date() : new Date(formData.start_at || Date.now()),
      onChange: (event, selectedDate) => {
        if (event.type === 'set' && selectedDate) {
          updateFormData(field, selectedDate.toISOString());
        }
      },
    });
  }, [formData, updateFormData]);

  // Validate form
  const validateForm = useCallback((): boolean => {
    const validation = competitionsService.validateCompetitionData(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return false;
    }

    // Additional custom validations
    if (formData.prize_pool && (!prizePool.points || prizePool.points <= 0)) {
      setErrors(['Prize pool points must be greater than 0']);
      return false;
    }

    return true;
  }, [formData, prizePool]);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors([]);

    try {
      // Prepare submission data
      const submissionData: CreateCompetitionRequest = {
        ...formData as CreateCompetitionRequest,
        prize_pool: prizePool.points ? prizePool : undefined,
        banner_image_url: bannerImage || undefined,
      };

      const competition = await competitionsService.createCompetition(submissionData);
      onSuccess(competition);

      // Reset form
      setFormData({
        country: 'US',
        title: '',
        theme: '',
        description: '',
        rules: '',
        max_entries: 100,
        start_at: new Date().toISOString(),
        end_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });
      setPrizePool({ points: 1000, rewards: [], sponsor: '', sponsor_logo: '' });
      setBannerImage(null);

    } catch (error) {
      console.error('Create competition failed:', error);
      setErrors([error.message || 'Failed to create competition. Please try again.']);
    } finally {
      setLoading(false);
    }
  }, [formData, prizePool, bannerImage, validateForm, onSuccess]);

  // Format date for display
  const formatDateForDisplay = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryDark]}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <AntDesign name="close" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Create Competition</Text>
            <View style={styles.headerRight} />
          </View>
        </LinearGradient>

        {/* Form Content */}
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
        >
          {/* Errors */}
          {errors.length > 0 && (
            <View style={styles.errorContainer}>
              {errors.map((error, index) => (
                <Text key={index} style={styles.errorText}>
                  • {error}
                </Text>
              ))}
            </View>
          )}

          {/* Basic Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>

            {/* Country */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Country *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.countryContainer}>
                  {countries.map((country) => (
                    <TouchableOpacity
                      key={country.code}
                      style={[
                        styles.countryChip,
                        formData.country === country.code && styles.selectedCountryChip,
                      ]}
                      onPress={() => updateFormData('country', country.code)}
                    >
                      <Text style={[
                        styles.countryChipText,
                        formData.country === country.code && styles.selectedCountryChipText,
                      ]}>
                        {country.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Title */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Title *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Competition title"
                placeholderTextColor={COLORS.textSecondary}
                value={formData.title}
                onChangeText={(text) => updateFormData('title', text)}
                maxLength={200}
              />
            </View>

            {/* Theme */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Theme</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., Summer Fashion, Street Style"
                placeholderTextColor={COLORS.textSecondary}
                value={formData.theme}
                onChangeText={(text) => updateFormData('theme', text)}
                maxLength={100}
              />
            </View>

            {/* Description */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Description</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Describe your competition..."
                placeholderTextColor={COLORS.textSecondary}
                value={formData.description}
                onChangeText={(text) => updateFormData('description', text)}
                multiline
                numberOfLines={4}
                maxLength={1000}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Banner Image */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Banner Image</Text>
            <TouchableOpacity
              style={styles.imageUploadContainer}
              onPress={pickBannerImage}
            >
              {bannerImage ? (
                <>
                  <Image source={{ uri: bannerImage }} style={styles.bannerImagePreview} />
                  <View style={styles.imageOverlay}>
                    <AntDesign name="camera" size={24} color="white" />
                    <Text style={styles.imageOverlayText}>Change Image</Text>
                  </View>
                </>
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="image-outline" size={48} color={COLORS.textSecondary} />
                  <Text style={styles.imagePlaceholderText}>
                    Add Banner Image
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Competition Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Competition Settings</Text>

            {/* Start Date */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Start Date *</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => showDatePicker('start_at')}
              >
                <Text style={styles.dateText}>
                  {formatDateForDisplay(formData.start_at || '')}
                </Text>
                <AntDesign name="calendar" size={20} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            {/* End Date */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>End Date *</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => showDatePicker('end_at')}
              >
                <Text style={styles.dateText}>
                  {formatDateForDisplay(formData.end_at || '')}
                </Text>
                <AntDesign name="calendar" size={20} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            {/* Max Entries */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Max Entries</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Maximum number of entries"
                placeholderTextColor={COLORS.textSecondary}
                value={formData.max_entries?.toString()}
                onChangeText={(text) => updateFormData('max_entries', parseInt(text) || 0)}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Prize Pool */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Prize Pool</Text>

            {/* Points */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Points</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Points awarded to winners"
                placeholderTextColor={COLORS.textSecondary}
                value={prizePool.points?.toString()}
                onChangeText={(text) => updatePrizePool('points', parseInt(text) || 0)}
                keyboardType="numeric"
              />
            </View>

            {/* Sponsor */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Sponsor (Optional)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Sponsor name"
                placeholderTextColor={COLORS.textSecondary}
                value={prizePool.sponsor}
                onChangeText={(text) => updatePrizePool('sponsor', text)}
              />
            </View>
          </View>

          {/* Rules */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rules & Guidelines</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Competition rules and guidelines..."
              placeholderTextColor={COLORS.textSecondary}
              value={formData.rules}
              onChangeText={(text) => updateFormData('rules', text)}
              multiline
              numberOfLines={5}
              maxLength={2000}
              textAlignVertical="top"
            />
          </View>

          {/* Submit Button */}
          <View style={styles.submitContainer}>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={loading}
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                style={styles.submitButtonGradient}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <AntDesign name="plus" size={20} color="white" />
                    <Text style={styles.submitButtonText}>Create Competition</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.md,
    borderBottomLeftRadius: SIZES.radius.xl,
    borderBottomRightRadius: SIZES.radius.xl,
    ...StyleHelpers.createShadow(COLORS.shadow, 3),
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.bold,
    color: 'white',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SIZES.lg,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: SIZES.radius.md,
    padding: SIZES.md,
    marginBottom: SIZES.lg,
  },
  errorText: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.families.primary,
    color: '#DC2626',
    marginBottom: SIZES.xs,
  },
  section: {
    marginBottom: SIZES.xl,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text,
    marginBottom: SIZES.md,
  },
  fieldContainer: {
    marginBottom: SIZES.md,
  },
  fieldLabel: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.text,
    marginBottom: SIZES.sm,
  },
  countryContainer: {
    flexDirection: 'row',
    gap: SIZES.sm,
  },
  countryChip: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.radius.full,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  selectedCountryChip: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  countryChipText: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.medium,
    color: COLORS.textSecondary,
  },
  selectedCountryChipText: {
    color: 'white',
  },
  textInput: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius.md,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.md,
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.families.primary,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  dateInput: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius.md,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  dateText: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.families.primary,
    color: COLORS.text,
  },
  imageUploadContainer: {
    width: '100%',
    height: 200,
    borderRadius: SIZES.radius.lg,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.borderLight,
    borderStyle: 'dashed',
  },
  bannerImagePreview: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageOverlayText: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.semibold,
    color: 'white',
    marginTop: SIZES.xs,
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.families.primary,
    color: COLORS.textSecondary,
    marginTop: SIZES.sm,
  },
  submitContainer: {
    paddingTop: SIZES.lg,
    paddingBottom: SIZES.xl,
  },
  submitButton: {
    borderRadius: SIZES.radius.lg,
    overflow: 'hidden',
    ...StyleHelpers.createShadow(COLORS.primary, 3),
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.md,
    gap: SIZES.sm,
  },
  submitButtonText: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.bold,
    color: 'white',
  },
});

export default CreateCompetitionModal;