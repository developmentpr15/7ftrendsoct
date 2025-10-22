/**
 * TryOnScreen.tsx
 *
 * Clean virtual try-on interface where users can:
 * - Upload/choose face or body photo
 * - Select clothing from wardrobe
 * - Preview AI-generated try-on result
 * - Save to feed
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  Modal,
  Dimensions,
  ActivityIndicator,
  StatusBar,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useCameraPermissions, CameraView } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { AntDesign, MaterialIcons, Ionicons } from '@expo/vector-icons';

import { COLORS, SIZES, FONTS, StyleHelpers } from '@/utils/constants';
import { imageEditService, ImageEditRequest } from '@/services/imageEditService';
import { useWardrobeStore } from '@/store/wardrobeStore';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface TryOnScreenProps {
  visible: boolean;
  onClose: () => void;
  onSaveToFeed?: (imageUrl: string, caption: string) => Promise<void>;
}

export const TryOnScreen: React.FC<TryOnScreenProps> = ({
  visible,
  onClose,
  onSaveToFeed,
}) => {
  // Camera and image state
  const [hasPermission, requestPermission] = useCameraPermissions();
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [selectedClothing, setSelectedClothing] = useState<any>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'front' | 'back'>('front');

  // Try-on options
  const [position, setPosition] = useState<'full-body' | 'upper-body' | 'lower-body'>('full-body');
  const [customInstructions, setCustomInstructions] = useState<string>('');

  // Processing and results
  const [isProcessing, setIsProcessing] = useState(false);
  const [tryOnResult, setTryOnResult] = useState<any>(null);
  const [progress, setProgress] = useState(0);

  // Save to feed
  const [feedCaption, setFeedCaption] = useState<string>('');
  const [showSaveOptions, setShowSaveOptions] = useState(false);

  // Store
  const { wardrobeItems } = useWardrobeStore();

  // Position options
  const positionOptions = [
    { id: 'full-body', name: 'Full Body', icon: '👤' },
    { id: 'upper-body', name: 'Upper Body', icon: '👔' },
    { id: 'lower-body', name: 'Lower Body', icon: '👖' },
  ];

  // Request camera permission
  const handleCameraPermission = useCallback(async () => {
    const permission = await requestPermission();
    if (!permission) {
      Alert.alert(
        'Camera Permission Required',
        'Please grant camera permission to take a photo.',
        [{ text: 'OK' }]
      );
      return;
    }
    setCameraActive(true);
  }, [requestPermission]);

  // Take photo with camera
  const takePhoto = useCallback(async () => {
    if (!hasPermission) {
      handleCameraPermission();
      return;
    }

    try {
      const photo = await CameraView.current?.takePictureAsync();
      if (photo) {
        setUserPhoto(photo.uri);
        setCameraActive(false);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  }, [hasPermission, handleCameraPermission]);

  // Pick photo from gallery
  const pickPhoto = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setUserPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking photo:', error);
      Alert.alert('Error', 'Failed to select photo. Please try again.');
    }
  }, []);

  // Select clothing item
  const selectClothing = useCallback((item: any) => {
    setSelectedClothing(item);
  }, []);

  // Process virtual try-on
  const processTryOn = useCallback(async () => {
    if (!userPhoto || !selectedClothing) {
      Alert.alert(
        'Missing Items',
        'Please select both your photo and a clothing item.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 15, 90));
      }, 200);

      const request: ImageEditRequest = {
        userImage: userPhoto,
        garmentImage: selectedClothing.images?.[0] || selectedClothing.image || '',
        instructions: customInstructions || `Create a realistic virtual try-on with ${selectedClothing.name}`,
        position,
        fit: 'regular',
        style: 'realistic',
      };

      const result = await imageEditService.editImageWithGemini(request);

      clearInterval(progressInterval);
      setProgress(100);

      if (result.success) {
        setTryOnResult(result);
        // Save to history
        await imageEditService.saveEditHistory(request, result);
      } else {
        throw new Error(result.error || 'Processing failed');
      }
    } catch (error) {
      console.error('Try-on error:', error);
      Alert.alert(
        'Processing Failed',
        error.message || 'Failed to process try-on. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsProcessing(false);
      setTimeout(() => setProgress(0), 1000);
    }
  }, [userPhoto, selectedClothing, customInstructions, position]);

  // Save to feed
  const handleSaveToFeed = useCallback(async () => {
    if (!tryOnResult?.compositeImageUrl) return;

    try {
      if (onSaveToFeed) {
        await onSaveToFeed(tryOnResult.compositeImageUrl, feedCaption);
        Alert.alert(
          'Saved to Feed!',
          'Your try-on has been posted to your feed.',
          [{ text: 'OK', onPress: () => handleClose() }]
        );
      } else {
        Alert.alert(
          'Feature Not Available',
          'Save to feed functionality is not configured.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Save to feed error:', error);
      Alert.alert(
        'Save Failed',
        'Failed to save to feed. Please try again.',
        [{ text: 'OK' }]
      );
    }
  }, [tryOnResult, feedCaption, onSaveToFeed]);

  // Reset and close
  const handleClose = useCallback(() => {
    setUserPhoto(null);
    setSelectedClothing(null);
    setTryOnResult(null);
    setIsProcessing(false);
    setProgress(0);
    setCustomInstructions('');
    setFeedCaption('');
    setPosition('full-body');
    setCameraActive(false);
    setShowSaveOptions(false);
    onClose();
  }, [onClose]);

  // Render camera view
  const renderCamera = () => (
    <View style={styles.cameraContainer}>
      {cameraActive && (
        <CameraView style={styles.camera} facing={facingMode} />
      )}

      <View style={styles.cameraControls}>
        <TouchableOpacity
          style={styles.flipButton}
          onPress={() => setFacingMode(facingMode === 'front' ? 'back' : 'front')}
        >
          <MaterialIcons name="flip-camera-android" size={24} color="white" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.captureButton} onPress={takePhoto}>
          <View style={styles.captureButtonInner} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => setCameraActive(false)}
        >
          <AntDesign name="close" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render photo upload section
  const renderPhotoSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Your Photo</Text>
      {!userPhoto ? (
        <View style={styles.photoPlaceholder}>
          <Ionicons name="camera-outline" size={48} color={COLORS.textSecondary} />
          <Text style={styles.placeholderText}>Add your photo</Text>
          <View style={styles.photoButtons}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => setCameraActive(true)}
            >
              <AntDesign name="camera" size={20} color="white" />
              <Text style={styles.primaryButtonText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={pickPhoto}
            >
              <AntDesign name="picture" size={20} color={COLORS.primary} />
              <Text style={styles.secondaryButtonText}>Choose Photo</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.photoPreview}>
          <Image source={{ uri: userPhoto }} style={styles.previewImage} />
          <TouchableOpacity
            style={styles.retakeButton}
            onPress={() => setUserPhoto(null)}
          >
            <AntDesign name="camera" size={16} color="white" />
            <Text style={styles.retakeText}>Retake</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  // Render clothing selection
  const renderClothingSelection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Select Clothing</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.clothingGrid}>
          {wardrobeItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.clothingItem,
                selectedClothing?.id === item.id && styles.selectedClothingItem,
              ]}
              onPress={() => selectClothing(item)}
            >
              <Image
                source={{
                  uri: item.images?.[0] || item.image || 'https://picsum.photos/seed/clothing/120/150'
                }}
                style={styles.clothingImage}
              />
              <Text style={styles.clothingName} numberOfLines={1}>
                {item.name}
              </Text>
              {selectedClothing?.id === item.id && (
                <View style={styles.selectedBadge}>
                  <AntDesign name="check" size={12} color="white" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  // Render try-on options
  const renderOptions = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Try-On Options</Text>

      <View style={styles.optionGroup}>
        <Text style={styles.optionLabel}>Position</Text>
        <View style={styles.positionOptions}>
          {positionOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.positionButton,
                position === option.id && styles.selectedPositionButton,
              ]}
              onPress={() => setPosition(option.id as any)}
            >
              <Text style={styles.positionIcon}>{option.icon}</Text>
              <Text style={[
                styles.positionText,
                position === option.id && styles.selectedPositionText,
              ]}>
                {option.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.optionGroup}>
        <Text style={styles.optionLabel}>Custom Instructions (Optional)</Text>
        <TextInput
          style={styles.instructionsInput}
          placeholder="e.g., Make it look more casual, adjust the fit..."
          value={customInstructions}
          onChangeText={setCustomInstructions}
          multiline
          numberOfLines={2}
          textAlignVertical="top"
        />
      </View>
    </View>
  );

  // Render processing state
  const renderProcessing = () => (
    <View style={styles.processingOverlay}>
      <View style={styles.processingContent}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.processingText}>Creating Your Try-On...</Text>
        <Text style={styles.processingSubtext}>
          Using AI to virtually try on the selected clothing
        </Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>{progress}%</Text>
      </View>
    </View>
  );

  // Render result
  const renderResult = () => {
    if (!tryOnResult?.success) return null;

    return (
      <View style={styles.resultContainer}>
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryDark]}
          style={styles.resultHeader}
        >
          <AntDesign name="checkcircle" size={24} color="white" />
          <Text style={styles.resultTitle}>Try-On Complete!</Text>
        </LinearGradient>

        <Image
          source={{ uri: tryOnResult.editedImageUrl }}
          style={styles.resultImage}
          resizeMode="contain"
        />

        <View style={styles.resultActions}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={() => setShowSaveOptions(true)}
          >
            <AntDesign name="save" size={20} color="white" />
            <Text style={styles.saveButtonText}>Save to Feed</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setTryOnResult(null);
              setUserPhoto(null);
            }}
          >
            <AntDesign name="reload1" size={20} color={COLORS.primary} />
            <Text style={styles.retryButtonText}>Try Another</Text>
          </TouchableOpacity>
        </View>

        {/* Save to Feed Modal */}
        <Modal
          visible={showSaveOptions}
          transparent
          animationType="fade"
          onRequestClose={() => setShowSaveOptions(false)}
        >
          <View style={styles.saveModalOverlay}>
            <View style={styles.saveModalContent}>
              <Text style={styles.saveModalTitle}>Save to Feed</Text>
              <Text style={styles.saveModalSubtext}>
                Add a caption for your post
              </Text>
              <TextInput
                style={styles.captionInput}
                placeholder="What do you think of this look?"
                value={feedCaption}
                onChangeText={setFeedCaption}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                maxLength={200}
              />
              <View style={styles.saveModalActions}>
                <TouchableOpacity
                  style={styles.cancelSaveButton}
                  onPress={() => setShowSaveOptions(false)}
                >
                  <Text style={styles.cancelSaveText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmSaveButton}
                  onPress={handleSaveToFeed}
                >
                  <Text style={styles.confirmSaveText}>Post to Feed</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <View style={styles.container}>
        {/* Header */}
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryDark]}
          style={styles.header}
        >
          <TouchableOpacity onPress={handleClose} style={styles.headerButton}>
            <AntDesign name="close" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Virtual Try-On</Text>
          <View style={styles.headerRight}>
            <Text style={styles.poweredBy}>AI Powered</Text>
          </View>
        </LinearGradient>

        {/* Content */}
        {!tryOnResult ? (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {renderPhotoSection()}
            {renderClothingSelection()}
            {userPhoto && selectedClothing && renderOptions()}

            {/* Process Button */}
            {userPhoto && selectedClothing && !isProcessing && (
              <View style={styles.processButtonContainer}>
                <TouchableOpacity
                  style={styles.processButton}
                  onPress={processTryOn}
                >
                  <LinearGradient
                    colors={[COLORS.primary, COLORS.primaryDark]}
                    style={styles.processButtonGradient}
                  />
                  <Text style={styles.processButtonText}>
                    Try On This Look
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        ) : (
          renderResult()
        )}

        {/* Camera View */}
        {cameraActive && renderCamera()}

        {/* Processing Overlay */}
        {isProcessing && renderProcessing()}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.md,
    ...StyleHelpers.createShadow(COLORS.shadow, 2),
  },
  headerButton: {
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
    alignItems: 'flex-end',
  },
  poweredBy: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONTS.families.primary,
    color: 'white',
    opacity: 0.8,
  },
  content: {
    flex: 1,
    padding: SIZES.lg,
  },
  section: {
    marginBottom: SIZES.lg,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.text,
    marginBottom: SIZES.md,
  },
  // Photo Section
  photoPlaceholder: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius.lg,
    padding: SIZES.xl,
    alignItems: 'center',
    ...StyleHelpers.createShadow(COLORS.shadow, 1),
  },
  placeholderText: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.families.primary,
    color: COLORS.textSecondary,
    marginTop: SIZES.sm,
    marginBottom: SIZES.lg,
  },
  photoButtons: {
    flexDirection: 'row',
    gap: SIZES.md,
    width: '100%',
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.md,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius.md,
    gap: SIZES.sm,
    ...StyleHelpers.createShadow(COLORS.primary, 2),
  },
  primaryButtonText: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.semibold,
    color: 'white',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.md,
    backgroundColor: 'transparent',
    borderRadius: SIZES.radius.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
    gap: SIZES.sm,
  },
  secondaryButtonText: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.primary,
  },
  photoPreview: {
    position: 'relative',
    borderRadius: SIZES.radius.lg,
    overflow: 'hidden',
    height: 300,
    ...StyleHelpers.createShadow(COLORS.shadow, 2),
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  retakeButton: {
    position: 'absolute',
    top: SIZES.md,
    right: SIZES.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.radius.sm,
    gap: SIZES.xs,
    ...StyleHelpers.createShadow(COLORS.primary, 2),
  },
  retakeText: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.semibold,
    color: 'white',
  },
  // Clothing Selection
  clothingGrid: {
    flexDirection: 'row',
    gap: SIZES.md,
    paddingHorizontal: SIZES.xs,
  },
  clothingItem: {
    width: 100,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius.md,
    overflow: 'hidden',
    ...StyleHelpers.createShadow(COLORS.shadow, 1),
  },
  selectedClothingItem: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  clothingImage: {
    width: '100%',
    height: 120,
  },
  clothingName: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.medium,
    color: COLORS.text,
    textAlign: 'center',
    padding: SIZES.xs,
  },
  selectedBadge: {
    position: 'absolute',
    top: SIZES.xs,
    right: SIZES.xs,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Options
  optionGroup: {
    marginBottom: SIZES.md,
  },
  optionLabel: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.text,
    marginBottom: SIZES.sm,
  },
  positionOptions: {
    flexDirection: 'row',
    gap: SIZES.sm,
  },
  positionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SIZES.sm,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  selectedPositionButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  positionIcon: {
    fontSize: FONTS.sizes.lg,
    marginBottom: SIZES.xs,
  },
  positionText: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.medium,
    color: COLORS.textSecondary,
  },
  selectedPositionText: {
    color: 'white',
  },
  instructionsInput: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: SIZES.md,
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.families.primary,
    color: COLORS.text,
    minHeight: 80,
  },
  // Process Button
  processButtonContainer: {
    paddingHorizontal: SIZES.lg,
    paddingBottom: SIZES.xl,
  },
  processButton: {
    height: 56,
    borderRadius: SIZES.radius.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  processButtonGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  processButtonText: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.bold,
    color: 'white',
    textAlign: 'center',
    position: 'relative',
    zIndex: 1,
    lineHeight: 56,
  },
  // Camera
  cameraContainer: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: SIZES.xl,
  },
  flipButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Processing
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingContent: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius.lg,
    padding: SIZES.xl,
    alignItems: 'center',
    ...StyleHelpers.createShadow(COLORS.shadow, 3),
  },
  processingText: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text,
    marginTop: SIZES.md,
    marginBottom: SIZES.xs,
  },
  processingSubtext: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.families.primary,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SIZES.lg,
  },
  progressBar: {
    width: 200,
    height: 8,
    backgroundColor: COLORS.borderLight,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: SIZES.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.families.primary,
    color: COLORS.textSecondary,
  },
  // Result
  resultContainer: {
    flex: 1,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.lg,
    gap: SIZES.sm,
  },
  resultTitle: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.bold,
    color: 'white',
  },
  resultImage: {
    width: screenWidth,
    height: screenWidth * 0.8,
    backgroundColor: COLORS.background,
  },
  resultActions: {
    flexDirection: 'row',
    padding: SIZES.lg,
    gap: SIZES.md,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.md,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius.md,
    gap: SIZES.sm,
    ...StyleHelpers.createShadow(COLORS.primary, 2),
  },
  saveButtonText: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.semibold,
    color: 'white',
  },
  retryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.md,
    backgroundColor: 'transparent',
    borderRadius: SIZES.radius.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
    gap: SIZES.sm,
  },
  retryButtonText: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.primary,
  },
  // Save to Feed Modal
  saveModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.lg,
  },
  saveModalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius.lg,
    padding: SIZES.lg,
    width: '100%',
    maxWidth: 400,
    ...StyleHelpers.createShadow(COLORS.shadow, 3),
  },
  saveModalTitle: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SIZES.xs,
  },
  saveModalSubtext: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.families.primary,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SIZES.lg,
  },
  captionInput: {
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radius.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: SIZES.md,
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.families.primary,
    color: COLORS.text,
    minHeight: 80,
    marginBottom: SIZES.lg,
  },
  saveModalActions: {
    flexDirection: 'row',
    gap: SIZES.md,
  },
  cancelSaveButton: {
    flex: 1,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radius.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignItems: 'center',
  },
  cancelSaveText: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.textSecondary,
  },
  confirmSaveButton: {
    flex: 1,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radius.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    ...StyleHelpers.createShadow(COLORS.primary, 2),
  },
  confirmSaveText: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.semibold,
    color: 'white',
  },
});

export default TryOnScreen;