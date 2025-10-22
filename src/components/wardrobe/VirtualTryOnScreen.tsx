/**
 * VirtualTryOnScreen.tsx
 *
 * Premium virtual try-on interface using Gemini 2.5 Flash Image API
 * Luxury purple (#6a2fb0) and gold (#f2c94c) theme with advanced UI
 * Real-time image composition and garment overlay functionality
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
  Animated,
  StatusBar,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useCameraPermissions, CameraView } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';

import { COLORS, SIZES, FONTS, StyleHelpers } from '@/utils/constants';
import { imageEditService, ImageEditRequest, ImageEditResponse } from '@/services/imageEditService';
import { useWardrobeStore } from '@/store/wardrobeStore';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const MODAL_HEIGHT = screenHeight * 0.85;

interface VirtualTryOnProps {
  visible: boolean;
  onClose: () => void;
  initialGarmentId?: string;
}

interface PositionOption {
  id: string;
  name: string;
  icon: string;
  description: string;
}

interface FitOption {
  id: string;
  name: string;
  icon: string;
  description: string;
}

interface StyleOption {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export const VirtualTryOnScreen: React.FC<VirtualTryOnProps> = ({
  visible,
  onClose,
  initialGarmentId,
}) => {
  // Camera and image state
  const [hasPermission, requestPermission] = useCameraPermissions();
  const [userImage, setUserImage] = useState<string | null>(null);
  const [selectedGarment, setSelectedGarment] = useState<any>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'front' | 'back'>('front');

  // Edit parameters
  const [position, setPosition] = useState<string>('full-body');
  const [fit, setFit] = useState<string>('regular');
  const [style, setStyle] = useState<string>('realistic');
  const [customInstructions, setCustomInstructions] = useState<string>('');

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [editResult, setEditResult] = useState<ImageEditResponse | null>(null);
  const [progress, setProgress] = useState(0);

  // UI state
  const [activeTab, setActiveTab] = useState<'camera' | 'wardrobe'>('camera');
  const [showOptions, setShowOptions] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Store
  const { wardrobeItems } = useWardrobeStore();

  // Position options
  const positionOptions: PositionOption[] = [
    { id: 'full-body', name: 'Full Body', icon: '👤', description: 'Show entire outfit' },
    { id: 'upper-body', name: 'Upper Body', icon: '👔', description: 'Focus on tops and jackets' },
    { id: 'lower-body', name: 'Lower Body', icon: '👖', description: 'Focus on pants and skirts' },
    { id: 'accessory', name: 'Accessory', icon: '👜', description: 'Bags, hats, jewelry' },
  ];

  // Fit options
  const fitOptions: FitOption[] = [
    { id: 'snug', name: 'Snug', icon: '✨', description: 'Close fit to body' },
    { id: 'regular', name: 'Regular', icon: '👌', description: 'Standard fit' },
    { id: 'loose', name: 'Loose', icon: '🍃', description: 'Relaxed fit' },
  ];

  // Style options
  const styleOptions: StyleOption[] = [
    { id: 'realistic', name: 'Realistic', icon: '📸', description: 'Photorealistic result' },
    { id: 'stylized', name: 'Stylized', icon: '🎨', description: 'Artistic enhancement' },
    { id: 'enhanced', name: 'Enhanced', icon: '✨', description: 'Light improvements' },
  ];

  // Animation effects
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: visible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [visible, fadeAnim]);

  // Set initial garment if provided
  useEffect(() => {
    if (initialGarmentId && wardrobeItems.length > 0) {
      const garment = wardrobeItems.find(item => item.id === initialGarmentId);
      if (garment) {
        setSelectedGarment(garment);
        setActiveTab('wardrobe');
      }
    }
  }, [initialGarmentId, wardrobeItems]);

  // Camera permission handler
  const handleCameraPermission = useCallback(async () => {
    const permission = await requestPermission();
    if (!permission) {
      Alert.alert(
        'Camera Permission Required',
        'Please grant camera permission to take a photo for virtual try-on.',
        [{ text: 'Cancel', style: 'cancel' }]
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
        setUserImage(photo.uri);
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
        setUserImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking photo:', error);
      Alert.alert('Error', 'Failed to select photo. Please try again.');
    }
  }, []);

  // Select garment from wardrobe
  const selectGarment = useCallback((garment: any) => {
    setSelectedGarment(garment);
    setShowOptions(false);
  }, []);

  // Process virtual try-on
  const processVirtualTryOn = useCallback(async () => {
    if (!userImage || !selectedGarment) {
      Alert.alert(
        'Missing Images',
        'Please select both your photo and a garment to continue.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const request: ImageEditRequest = {
        userImage,
        garmentImage: selectedGarment.images[0] || '',
        instructions: customInstructions,
        position,
        fit,
        style,
      };

      const result = await imageEditService.editImageWithGemini(request);

      clearInterval(progressInterval);
      setProgress(100);

      if (result.success) {
        setEditResult(result);
        // Save to history
        await imageEditService.saveEditHistory(request, result);
      } else {
        throw new Error(result.error || 'Processing failed');
      }
    } catch (error) {
      console.error('Virtual try-on error:', error);
      Alert.alert(
        'Processing Failed',
        error.message || 'Failed to process virtual try-on. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsProcessing(false);
      setTimeout(() => setProgress(0), 1000);
    }
  }, [userImage, selectedGarment, customInstructions, position, fit, style]);

  // Reset state
  const resetState = useCallback(() => {
    setUserImage(null);
    setSelectedGarment(null);
    setEditResult(null);
    setIsProcessing(false);
    setProgress(0);
    setCustomInstructions('');
    setPosition('full-body');
    setFit('regular');
    setStyle('realistic');
    setActiveTab('camera');
    setCameraActive(false);
  }, []);

  // Close modal
  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [resetState, onClose]);

  // Render camera view
  const renderCameraView = () => (
    <View style={styles.cameraContainer}>
      {cameraActive && (
        <CameraView
          style={styles.camera}
          facing={facingMode}
          ref={CameraView.current}
        />
      )}

      <View style={styles.cameraControls}>
        <TouchableOpacity
          style={styles.flipCameraButton}
          onPress={() => setFacingMode(facingMode === 'front' ? 'back' : 'front')}
        >
          <MaterialIcons name="flip-camera-android" size={24} color={COLORS.textOnPrimary} />
        </TouchableOpacity>

        <View style={styles.cameraActions}>
          <TouchableOpacity
            style={styles.cameraActionButton}
            onPress={takePhoto}
          >
            <MaterialIcons name="camera-alt" size={32} color={COLORS.textOnPrimary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.closeCameraButton}
          onPress={() => setCameraActive(false)}
        >
          <AntDesign name="close" size={20} color={COLORS.textOnPrimary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render wardrobe selector
  const renderWardrobeSelector = () => (
    <View style={styles.wardrobeContainer}>
      <Text style={styles.sectionTitle}>Select Garment</Text>
      <ScrollView style={styles.garmentGrid} showsVerticalScrollIndicator={false}>
        {wardrobeItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.garmentItem,
              selectedGarment?.id === item.id && styles.selectedGarmentItem,
            ]}
            onPress={() => selectGarment(item)}
            activeOpacity={0.8}
          >
            <Image
              source={{ uri: item.images[0] || 'https://picsum.photos/seed/garment/100/120' }}
              style={styles.garmentImage}
              resizeMode="cover"
            />
            <View style={styles.garmentInfo}>
              <Text style={styles.garmentName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.garmentCategory}>
                {item.category}
              </Text>
            </View>
            {selectedGarment?.id === item.id && (
              <View style={styles.selectionBadge}>
                <AntDesign name="check" size={12} color={COLORS.textOnPrimary} />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  // Render edit options
  const renderEditOptions = () => (
    <View style={styles.optionsContainer}>
      <Text style={styles.sectionTitle}>Edit Options</Text>

      {/* Position Selection */}
      <View style={styles.optionSection}>
        <Text style={styles.optionLabel}>Position</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {positionOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionButton,
                position === option.id && styles.selectedOptionButton,
              ]}
              onPress={() => setPosition(option.id)}
              activeOpacity={0.8}
            >
              <Text style={styles.optionIcon}>{option.icon}</Text>
              <Text style={styles.optionText}>{option.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Fit Selection */}
      <View style={styles.optionSection}>
        <Text style={styles.optionLabel}>Fit</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {fitOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionButton,
                fit === option.id && styles.selectedOptionButton,
              ]}
              onPress={() => setFit(option.id)}
              activeOpacity={0.8}
            >
              <Text style={styles.optionIcon}>{option.icon}</Text>
              <Text style={styles.optionText}>{option.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Style Selection */}
      <View style={styles.optionSection}>
        <Text style={styles.optionLabel}>Style</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {styleOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionButton,
                style === option.id && styles.selectedOptionButton,
              ]}
              onPress={() => setStyle(option.id)}
              activeOpacity={0.8}
            >
              <Text style={styles.optionIcon}>{option.icon}</Text>
              <Text style={styles.optionText}>{option.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Custom Instructions */}
      <View style={styles.optionSection}>
        <Text style={styles.optionLabel}>Custom Instructions (Optional)</Text>
        <TextInput
          style={styles.customInstructionsInput}
          placeholder="e.g., Make the fit a bit looser, add more realistic shadows"
          value={customInstructions}
          onChangeText={setCustomInstructions}
          multiline
          numberOfLines={3}
        />
      </View>
    </View>
  );

  // Render processing state
  const renderProcessingState = () => (
    <View style={styles.processingContainer}>
      <View style={styles.processingContent}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.processingText}>Creating Virtual Try-On...</Text>
        <Text style={styles.processingSubtext}>
          Using AI to overlay garment on your photo
        </Text>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[styles.progressFill, { width: `${progress}%` }]}
            />
          </View>
          <Text style={styles.progressText}>{progress}%</Text>
        </View>

        <Text style={styles.processingNote}>
          This may take a few moments...
        </Text>
      </View>
    </View>
  );

  // Render result
  const renderResult = () => {
    if (!editResult?.success) return null;

    return (
      <View style={styles.resultContainer}>
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryDark]}
          style={styles.resultHeader}
        >
          <AntDesign name="checkcircle" size={24} color={COLORS.textOnPrimary} />
          <Text style={styles.resultTitle}>Virtual Try-On Complete!</Text>
        </LinearGradient>

        <Image
          source={{ uri: editResult.editedImageUrl }}
          style={styles.resultImage}
          resizeMode="contain"
        />

        <View style={styles.resultDetails}>
          <Text style={styles.confidenceText}>
            Confidence: {Math.round((editResult.confidence || 0) * 100)}%
          </Text>
          <Text style={styles.processingTimeText}>
            Processing time: {(editResult.processingTime || 0) / 1000}s
          </Text>
        </View>

        <View style={styles.resultActions}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={() => {
              // Handle saving result
              Alert.alert(
                'Image Saved',
                'Your virtual try-on has been saved to your history.',
                [{ text: 'OK' }]
              );
            }}
          >
            <Text style={styles.saveButtonText}>Save to History</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shareButton}
            onPress={() => {
              // Handle sharing
              Alert.alert(
                'Share Image',
                'Sharing functionality coming soon!',
                [{ text: 'OK' }]
              );
            }}
          >
            <Text style={styles.shareButtonText}>Share</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setEditResult(null);
              setUserImage(null);
            }}
          >
            <Text style={styles.retryButtonText}>Try Different</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Main render
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        {/* Header */}
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryDark]}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <AntDesign name="close" size={24} color={COLORS.textOnPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Virtual Try-On</Text>
            <View style={styles.headerRight}>
              <Text style={styles.poweredBy}>✨ Powered by AI</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Main Content */}
        {!editResult ? (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Tab Selector */}
            <View style={styles.tabSelector}>
              <TouchableOpacity
                style={[
                  styles.tabButton,
                  activeTab === 'camera' && styles.activeTabButton,
                ]}
                onPress={() => setActiveTab('camera')}
              >
                <AntDesign name="camera" size={20} color={activeTab === 'camera' ? COLORS.primary : COLORS.textSecondary} />
                <Text
                  style={[
                    styles.tabText,
                    { color: activeTab === 'camera' ? COLORS.primary : COLORS.textSecondary },
                  ]}
                >
                  Your Photo
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tabButton,
                  activeTab === 'wardrobe' && styles.activeTabButton,
                ]}
                onPress={() => setActiveTab('wardrobe')}
              >
                <AntDesign name="appstore-o" size={20} color={activeTab === 'wardrobe' ? COLORS.primary : COLORS.textSecondary} />
                <Text
                  style={[
                    styles.tabText,
                    { color: activeTab === 'wardrobe' ? COLORS.primary : COLORS.textSecondary },
                  ]}
                >
                  Wardrobe
                </Text>
              </TouchableOpacity>
            </View>

            {/* Tab Content */}
            {activeTab === 'camera' ? (
              <>
                {!userImage ? (
                  <View style={styles.imageCapturePrompt}>
                    <Text style={styles.promptTitle}>Take Your Photo</Text>
                    <Text style={styles.promptText}>
                      Position yourself in good lighting with the outfit area visible
                    </Text>
                    <View style={styles.promptActions}>
                      <TouchableOpacity
                        style={styles.primaryActionButton}
                        onPress={() => setCameraActive(true)}
                      >
                        <AntDesign name="camera" size={24} color={COLORS.textOnPrimary} />
                        <Text style={styles.primaryActionText}>Take Photo</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.secondaryActionButton}
                        onPress={pickPhoto}
                      >
                        <AntDesign name="picture" size={24} color={COLORS.primary} />
                        <Text style={styles.secondaryActionText}>Choose from Gallery</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={styles.userImagePreview}>
                    <Image source={{ uri: userImage }} style={styles.userImage} resizeMode="cover" />
                    <TouchableOpacity
                      style={styles.retakeButton}
                      onPress={() => setUserImage(null)}
                    >
                      <AntDesign name="camera" size={20} color={COLORS.textOnPrimary} />
                      <Text style={styles.retakeText}>Retake</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            ) : (
              renderWardrobeSelector()
            )}

            {/* Camera View */}
            {cameraActive && renderCameraView()}

            {/* Edit Options */}
            {userImage && selectedGarment && renderEditOptions()}

            {/* Process Button */}
            {userImage && selectedGarment && !isProcessing && (
              <View style={styles.processButtonContainer}>
                <TouchableOpacity
                  style={styles.processButton}
                  onPress={processVirtualTryOn}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[COLORS.primary, COLORS.primaryDark]}
                    style={styles.processButtonGradient}
                  />
                  <Text style={styles.processButtonText}>
                    {isProcessing ? 'Processing...' : 'Create Virtual Try-On'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        ) : (
          renderResult()
        )}

        {/* Processing Overlay */}
        {isProcessing && renderProcessingState()}
      </Animated.View>
    </Modal>
  );
};

// Styles
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
    color: COLORS.textOnPrimary,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  poweredBy: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONTS.families.primary,
    color: COLORS.textOnPrimary,
    opacity: 0.8,
  },
  content: {
    flex: 1,
    padding: SIZES.lg,
  },
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius.lg,
    padding: SIZES.xs,
    marginBottom: SIZES.lg,
    ...StyleHelpers.createShadow(COLORS.shadow, 1),
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.radius.md,
    marginHorizontal: SIZES.xs,
    gap: SIZES.xs,
  },
  activeTabButton: {
    backgroundColor: COLORS.primary + '15',
  },
  tabText: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.semibold,
  },
  // Image Capture Prompt
  imageCapturePrompt: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius.lg,
    padding: SIZES.xl,
    alignItems: 'center',
    marginBottom: SIZES.lg,
    ...StyleHelpers.createShadow(COLORS.shadow, 2),
  },
  promptTitle: {
    fontSize: FONTS.sizes.xl,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text,
    marginBottom: SIZES.sm,
    textAlign: 'center',
  },
  promptText: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.families.primary,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: FONTS.lineHeight.relaxed,
    marginBottom: SIZES.lg,
  },
  promptActions: {
    gap: SIZES.md,
    flexDirection: 'row',
  },
  primaryActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.md,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius.md,
    ...StyleHelpers.createShadow(COLORS.primary, 3),
  },
  primaryActionText: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.textOnPrimary,
    marginLeft: SIZES.sm,
  },
  secondaryActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.md,
    backgroundColor: 'transparent',
    borderRadius: SIZES.radius.md,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  secondaryActionText: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.primary,
    marginLeft: SIZES.sm,
  },
  // User Image Preview
  userImagePreview: {
    width: screenWidth - SIZES.lg * 2,
    height: screenWidth * 1.2,
    borderRadius: SIZES.radius.lg,
    overflow: 'hidden',
    marginBottom: SIZES.lg,
    backgroundColor: COLORS.background,
    ...StyleHelpers.createShadow(COLORS.shadow, 3),
  },
  userImage: {
    width: '100%',
    height: '100%',
  },
  retakeButton: {
    position: 'absolute',
    top: SIZES.md,
    right: SIZES.md,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius.md,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.xs,
    ...StyleHelpers.createShadow(COLORS.primary, 2),
  },
  retakeText: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.textOnPrimary,
  },
  // Camera View
  cameraContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    position: 'relative',
    marginBottom: SIZES.lg,
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.lg,
  },
  flipCameraButton: {
    position: 'absolute',
    top: SIZES.lg,
    right: SIZES.lg,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeCameraButton: {
    position: 'absolute',
    top: SIZES.lg,
    left: SIZES.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.lg,
  },
  cameraActionButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...StyleHelpers.createShadow(COLORS.primary, 4),
  },
  // Wardrobe Selector
  wardrobeContainer: {
    marginBottom: SIZES.lg,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text,
    marginBottom: SIZES.md,
  },
  garmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.md,
  },
  garmentItem: {
    width: (screenWidth - SIZES.lg * 2 - SIZES.md) / 2,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius.lg,
    overflow: 'hidden',
    marginBottom: SIZES.md,
    ...StyleHelpers.createShadow(COLORS.shadow, 2),
  },
  selectedGarmentItem: {
    borderColor: COLORS.primary,
    borderWidth: 3,
    backgroundColor: COLORS.primary + '10',
  },
  garmentImage: {
    width: '100%',
    height: 150,
  },
  garmentInfo: {
    padding: SIZES.sm,
  },
  garmentName: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.text,
    marginBottom: SIZES.xs,
  },
  garmentCategory: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONTS.families.primary,
    color: COLORS.textSecondary,
  },
  selectionBadge: {
    position: 'absolute',
    top: SIZES.xs,
    right: SIZES.xs,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...StyleHelpers.createShadow(COLORS.primary, 2),
  },
  // Edit Options
  optionsContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius.lg,
    padding: SIZES.lg,
    marginBottom: SIZES.lg,
    ...StyleHelpers.createShadow(COLORS.shadow, 2),
  },
  optionSection: {
    marginBottom: SIZES.lg,
  },
  optionLabel: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.text,
    marginBottom: SIZES.sm,
  },
  optionButton: {
    alignItems: 'center',
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.lg,
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radius.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginRight: SIZES.sm,
    minWidth: 100,
  },
  selectedOptionButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionIcon: {
    fontSize: FONTS.sizes.lg,
    marginBottom: SIZES.xs,
  },
  optionText: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.medium,
  },
  customInstructionsInput: {
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radius.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: SIZES.md,
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.families.primary,
    color: COLORS.text,
    textAlignVertical: 'top',
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
    color: COLORS.textOnPrimary,
    textAlign: 'center',
    position: 'relative',
    zIndex: 1,
  },
  // Processing State
  processingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  processingContent: {
    alignItems: 'center',
    padding: SIZES.xl,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius.lg,
    ...StyleHelpers.createShadow(COLORS.shadow, 4),
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
  progressContainer: {
    width: '100%',
    marginBottom: SIZES.lg,
  },
  progressBar: {
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
    textAlign: 'center',
  },
  processingNote: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONTS.families.primary,
    color: COLORS.textLight,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  // Result Display
  resultContainer: {
    flex: 1,
    paddingHorizontal: SIZES.lg,
    paddingBottom: SIZES.xl,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.lg,
    paddingHorizontal: SIZES.lg,
    borderTopLeftRadius: SIZES.radius.lg,
    borderTopRightRadius: SIZES.radius.lg,
    gap: SIZES.sm,
  },
  resultTitle: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.bold,
    color: COLORS.textOnPrimary,
  },
  resultImage: {
    width: screenWidth - SIZES.lg * 2,
    height: screenWidth * 0.8,
    borderRadius: SIZES.radius.lg,
    backgroundColor: COLORS.background,
    marginBottom: SIZES.lg,
    ...StyleHelpers.createShadow(COLORS.shadow, 3),
  },
  resultDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SIZES.lg,
  },
  confidenceText: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.families.primary,
    color: COLORS.success,
    fontWeight: FONTS.weight.semibold,
  },
  processingTimeText: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.families.primary,
    color: COLORS.textSecondary,
  },
  resultActions: {
    gap: SIZES.md,
  },
  saveButton: {
    flex: 1,
    paddingVertical: SIZES.md,
    backgroundColor: COLORS.success,
    borderRadius: SIZES.radius.md,
    alignItems: 'center',
    ...StyleHelpers.createShadow(COLORS.success, 2),
  },
  saveButtonText: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.textOnPrimary,
  },
  shareButton: {
    flex: 1,
    paddingVertical: SIZES.md,
    backgroundColor: COLORS.accent,
    borderRadius: SIZES.radius.md,
    alignItems: 'center',
    ...StyleHelpers.createShadow(COLORS.accent, 2),
  },
  shareButtonText: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.textOnAccent,
  },
  retryButton: {
    flex: 1,
    paddingVertical: SIZES.md,
    backgroundColor: 'transparent',
    borderRadius: SIZES.radius.md,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
  },
  retryButtonText: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.primary,
  },
});

export default VirtualTryOnScreen;