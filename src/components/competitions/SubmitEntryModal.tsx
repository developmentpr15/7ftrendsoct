/**
 * src/components/competitions/SubmitEntryModal.tsx
 *
 * Modal for submitting entries to competitions with image upload and form validation
 * Integrated with TryOnScreen for seamless outfit submission
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
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AntDesign, MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { COLORS, SIZES, FONTS, StyleHelpers } from '@/utils/constants';
import { competitionsService, Competition, CreateCompetitionEntryRequest } from '@/services/competitionsService';
import TryOnScreen from '../tryon/TryOnScreen';

interface SubmitEntryModalProps {
  visible: boolean;
  onClose: () => void;
  competition: Competition;
  onSuccess: () => void;
}

const SubmitEntryModal: React.FC<SubmitEntryModalProps> = ({
  visible,
  onClose,
  competition,
  onSuccess,
}) => {
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mainImage, setMainImage] = useState<string | null>(null);
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // TryOn integration
  const [showTryOn, setShowTryOn] = useState(false);

  // Handle image selection
  const pickMainImage = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 5],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setMainImage(result.assets[0].uri);
        setErrors([]); // Clear errors when user selects image
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  }, []);

  const pickAdditionalImages = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 5],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        if (additionalImages.length < 9) { // Max 9 additional images
          setAdditionalImages(prev => [...prev, result.assets[0].uri]);
        } else {
          Alert.alert('Limit Reached', 'Maximum 10 images allowed (1 main + 9 additional).');
        }
      }
    } catch (error) {
      console.error('Error picking additional image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  }, [additionalImages]);

  // Handle TryOn result
  const handleTryOnResult = useCallback((imageUrl: string) => {
    setMainImage(imageUrl);
    setShowTryOn(false);
  }, []);

  // Handle tag addition
  const addTag = useCallback(() => {
    const trimmedTag = tagInput.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 10) {
      setTags(prev => [...prev, trimmedTag]);
      setTagInput('');
    }
  }, [tagInput, tags]);

  const removeTag = useCallback((tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  }, []);

  // Remove additional image
  const removeAdditionalImage = useCallback((index: number) => {
    setAdditionalImages(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Validate form
  const validateForm = useCallback((): boolean => {
    const errors: string[] = [];

    if (!title.trim()) {
      errors.push('Title is required');
    } else if (title.length > 200) {
      errors.push('Title must be less than 200 characters');
    }

    if (!mainImage) {
      errors.push('Main image is required');
    }

    if (description && description.length > 1000) {
      errors.push('Description must be less than 1000 characters');
    }

    if (setErrors(errors.length > 0)) {
      return false;
    }

    // Validate with service
    const validation = competitionsService.validateEntryData({
      competition_id: competition.id,
      title,
      description,
      image_url: mainImage,
      images: additionalImages,
      tags,
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      return false;
    }

    return true;
  }, [title, description, mainImage, additionalImages, tags, competition.id]);

  // Handle submission
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors([]);

    try {
      // Upload main image
      const mainImageUrl = await competitionsService.uploadCompetitionImage(
        mainImage!,
        competition.id
      );

      // Upload additional images
      const additionalImageUrls: string[] = [];
      for (const image of additionalImages) {
        const url = await competitionsService.uploadCompetitionImage(
          image,
          competition.id
        );
        additionalImageUrls.push(url);
      }

      // Submit entry
      const entryData: CreateCompetitionEntryRequest = {
        competition_id: competition.id,
        title: title.trim(),
        description: description.trim() || undefined,
        image_url: mainImageUrl,
        images: additionalImageUrls.length > 0 ? additionalImageUrls : undefined,
        tags: tags.length > 0 ? tags : undefined,
      };

      await competitionsService.submitCompetitionEntry(entryData);

      // Reset form
      setTitle('');
      setDescription('');
      setMainImage(null);
      setAdditionalImages([]);
      setTags([]);
      setTagInput('');

      Alert.alert(
        'Success!',
        'Your entry has been submitted to the competition.',
        [
          {
            text: 'OK',
            onPress: onSuccess,
          },
        ]
      );

    } catch (error) {
      console.error('Submit entry failed:', error);
      setErrors([error.message || 'Failed to submit entry. Please try again.']);
    } finally {
      setLoading(false);
    }
  }, [title, description, mainImage, additionalImages, tags, competition, validateForm, onSuccess]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryDark]}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <AntDesign name="close" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Submit Entry</Text>
            <View style={styles.headerRight} />
          </View>
        </LinearGradient>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Competition Info */}
          <View style={styles.competitionInfo}>
            <Text style={styles.competitionName}>{competition.title}</Text>
            <Text style={styles.competitionTheme}>
              Theme: {competition.theme || 'Open Theme'}
            </Text>
          </View>

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

          {/* Main Image Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Main Image *</Text>

            <View style={styles.imageSection}>
              <TouchableOpacity
                style={styles.mainImageContainer}
                onPress={pickMainImage}
              >
                {mainImage ? (
                  <>
                    <Image source={{ uri: mainImage }} style={styles.mainImage} />
                    <View style={styles.imageOverlay}>
                      <AntDesign name="camera" size={20} color="white" />
                      <Text style={styles.imageOverlayText}>Change</Text>
                    </View>
                  </>
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="camera-outline" size={48} color={COLORS.textSecondary} />
                    <Text style={styles.imagePlaceholderText}>Select Main Image</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* TryOn Button */}
              <TouchableOpacity
                style={styles.tryOnButton}
                onPress={() => setShowTryOn(true)}
              >
                <LinearGradient
                  colors={[COLORS.accent, COLORS.accent + 'CC']}
                  style={styles.tryOnButtonGradient}
                >
                  <AntDesign name="camera" size={16} color="white" />
                  <Text style={styles.tryOnButtonText}>Try On First</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          {/* Additional Images */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Images (Optional)</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.additionalImagesContainer}>
                {/* Add Image Button */}
                <TouchableOpacity
                  style={styles.addImageButton}
                  onPress={pickAdditionalImages}
                  disabled={additionalImages.length >= 9}
                >
                  <AntDesign name="plus" size={24} color={COLORS.textSecondary} />
                  <Text style={styles.addImageText}>Add</Text>
                </TouchableOpacity>

                {/* Existing Images */}
                {additionalImages.map((image, index) => (
                  <View key={index} style={styles.additionalImageItem}>
                    <Image source={{ uri: image }} style={styles.additionalImage} />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => removeAdditionalImage(index)}
                    >
                      <AntDesign name="close" size={12} color="white" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Title */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Entry Title *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Give your entry a title..."
              placeholderTextColor={COLORS.textSecondary}
              value={title}
              onChangeText={setTitle}
              maxLength={200}
            />
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description (Optional)</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Describe your outfit, inspiration, or story..."
              placeholderTextColor={COLORS.textSecondary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              maxLength={1000}
              textAlignVertical="top"
            />
          </View>

          {/* Tags */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags (Optional)</Text>

            <View style={styles.tagsInputContainer}>
              <TextInput
                style={styles.tagInput}
                placeholder="Add tags..."
                placeholderTextColor={COLORS.textSecondary}
                value={tagInput}
                onChangeText={setTagInput}
                onSubmitEditing={addTag}
                maxLength={50}
              />
              <TouchableOpacity
                style={styles.addTagButton}
                onPress={addTag}
                disabled={!tagInput.trim()}
              >
                <AntDesign name="plus" size={16} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            {/* Tags Display */}
            {tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>#{tag}</Text>
                    <TouchableOpacity
                      style={styles.removeTagButton}
                      onPress={() => removeTag(tag)}
                    >
                      <AntDesign name="close" size={10} color="white" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
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
                    <AntDesign name="upload" size={20} color="white" />
                    <Text style={styles.submitButtonText}>Submit Entry</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* TryOn Modal */}
        <TryOnScreen
          visible={showTryOn}
          onClose={() => setShowTryOn(false)}
          onSaveToFeed={async (imageUrl, caption) => {
            // Optional: Save to feed functionality
            console.log('TryOn result:', imageUrl, caption);
          }}
        />
      </View>
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
    padding: SIZES.lg,
  },
  competitionInfo: {
    backgroundColor: COLORS.surface,
    padding: SIZES.md,
    borderRadius: SIZES.radius.lg,
    marginBottom: SIZES.lg,
    ...StyleHelpers.createShadow(COLORS.shadow, 1),
  },
  competitionName: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text,
    marginBottom: SIZES.xs,
  },
  competitionTheme: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.families.primary,
    color: COLORS.primary,
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
    marginBottom: SIZES.lg,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text,
    marginBottom: SIZES.md,
  },
  imageSection: {
    gap: SIZES.md,
  },
  mainImageContainer: {
    width: '100%',
    height: 300,
    borderRadius: SIZES.radius.lg,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.borderLight,
    borderStyle: 'dashed',
  },
  mainImage: {
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
  tryOnButton: {
    borderRadius: SIZES.radius.md,
    overflow: 'hidden',
    ...StyleHelpers.createShadow(COLORS.accent, 2),
  },
  tryOnButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.md,
    paddingHorizontal: SIZES.lg,
    gap: SIZES.sm,
  },
  tryOnButtonText: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.semibold,
    color: 'white',
  },
  additionalImagesContainer: {
    flexDirection: 'row',
    gap: SIZES.md,
  },
  addImageButton: {
    width: 100,
    height: 100,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius.md,
    borderWidth: 2,
    borderColor: COLORS.borderLight,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageText: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONTS.families.primary,
    color: COLORS.textSecondary,
    marginTop: SIZES.xs,
  },
  additionalImageItem: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: SIZES.radius.md,
    overflow: 'hidden',
  },
  additionalImage: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: SIZES.xs,
    right: SIZES.xs,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
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
  tagsInputContainer: {
    flexDirection: 'row',
    gap: SIZES.sm,
    alignItems: 'center',
  },
  tagInput: {
    flex: 1,
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
  addTagButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.sm,
    marginTop: SIZES.sm,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.radius.full,
    gap: SIZES.xs,
  },
  tagText: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.medium,
    color: 'white',
  },
  removeTagButton: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
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

export default SubmitEntryModal;