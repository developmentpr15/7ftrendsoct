import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  Alert,
  StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import useAppStore from '../../store/appStore';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../utils/constants';

// Define wardrobe categories
const WARDROBE_CATEGORIES = [
  { id: 'top', name: 'Tops', icon: '👔', emoji: '👔' },
  { id: 'bottom', name: 'Bottoms', icon: '👖', emoji: '👖' },
  { id: 'shoes', name: 'Shoes', icon: '👟', emoji: '👟' },
  { id: 'accessories', name: 'Accessories', icon: '⌚', emoji: '⌚' },
  { id: 'outerwear', name: 'Outerwear', icon: '🧥', emoji: '🧥' },
  { id: 'hats', name: 'Hats', icon: '👒', emoji: '👒' }
];

// Sample wardrobe items if user doesn't have items
const sampleWardrobeItems = [
  { id: 'sample1', name: 'White T-Shirt', category: 'top', image: 'https://picsum.photos/seed/tshirt1/100/120' },
  { id: 'sample2', name: 'Blue Jeans', category: 'bottom', image: 'https://picsum.photos/seed/jeans1/100/120' },
  { id: 'sample3', name: 'Black Sneakers', category: 'shoes', image: 'https://picsum.photos/seed/shoes1/100/120' },
  { id: 'sample4', name: 'Leather Jacket', category: 'outerwear', image: 'https://picsum.photos/seed/jacket1/100/120' },
  { id: 'sample5', name: 'Baseball Cap', category: 'hats', image: 'https://picsum.photos/seed/cap1/100/120' },
  { id: 'sample6', name: 'Gold Watch', category: 'accessories', image: 'https://picsum.photos/seed/watch1/100/120' },
  { id: 'sample7', name: 'Black Shirt', category: 'top', image: 'https://picsum.photos/seed/shirt1/100/120' },
  { id: 'sample8', name: 'Khaki Pants', category: 'bottom', image: 'https://picsum.photos/seed/pants1/100/120' },
  { id: 'sample9', name: 'Brown Boots', category: 'shoes', image: 'https://picsum.photos/seed/boots1/100/120' },
];

const ARScreen = () => {
  const { captureARPhoto, arPhotos, deleteARPhoto, wardrobeItems } = useAppStore();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState('front');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [showWardrobeSelector, setShowWardrobeSelector] = useState(false);
  const [selectedOutfitItems, setSelectedOutfitItems] = useState({});
  const [showAvatarPreview, setShowAvatarPreview] = useState(false);
  const cameraRef = useRef(null);

  const availableItems = wardrobeItems.length > 0 ? wardrobeItems : sampleWardrobeItems;

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  if (!permission) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>AR Try-On</Text>
        </View>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera" size={64} color={COLORS.textSecondary} />
          <Text style={styles.permissionText}>Requesting camera permission...</Text>
        </View>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>AR Try-On</Text>
        </View>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-off" size={64} color={COLORS.error} />
          <Text style={styles.permissionText}>Camera permission denied</Text>
          <Text style={styles.permissionSubtext}>
            Please enable camera access in your device settings to use AR Try-On
          </Text>
          <TouchableOpacity style={styles.startCameraButton} onPress={requestPermission}>
            <Text style={styles.startCameraButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Handle outfit item selection (max 1 per category)
  const handleItemSelect = (item) => {
    setSelectedOutfitItems(prev => {
      const isCurrentlySelected = prev[item.category]?.id === item.id;
      if (isCurrentlySelected) {
        const newSelection = { ...prev };
        delete newSelection[item.category];
        return newSelection;
      } else {
        return {
          ...prev,
          [item.category]: item
        };
      }
    });
  };

  // Generate avatar from selected outfit items
  const generateAvatar = () => {
    const selectedCount = Object.keys(selectedOutfitItems).length;
    if (selectedCount === 0) {
      Alert.alert('No Selection', 'Please select at least one item to create your avatar.');
      return;
    }

    setShowAvatarPreview(true);
  };

  // Start camera with selected outfit
  const startCameraWithOutfit = () => {
    const selectedCount = Object.keys(selectedOutfitItems).length;
    if (selectedCount === 0) {
      Alert.alert('No Selection', 'Please select at least one item to try on.');
      return;
    }

    setShowWardrobeSelector(false);
    setIsCameraActive(true);
  };

  const takePicture = async () => {
    try {
      if (cameraRef.current) {
        const photo = await cameraRef.current.takePhotoAsync({
          quality: 0.8,
        });

        const selectedItems = Object.values(selectedOutfitItems);
        const arPhoto = {
          uri: photo.uri,
          timestamp: new Date().toISOString(),
          cameraType: facing,
          outfitItems: selectedItems.map(item => item.name),
          selectedOutfit: selectedOutfitItems,
        };

        captureARPhoto(arPhoto);
        setIsCameraActive(false);

        Alert.alert(
          'Photo Captured!',
          `Your AR try-on photo with ${selectedItems.length} items has been saved to your gallery.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Camera capture error:', error);
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    }
  };

  const handleGalleryItemPress = (photo) => {
    Alert.alert(
      'AR Photo',
      `Captured on ${new Date(photo.timestamp).toLocaleDateString()}`,
      [
        { text: 'Delete', style: 'destructive', onPress: () => handleDeletePhoto(photo.id) },
        { text: 'Share', onPress: () => handleSharePhoto(photo) },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleDeletePhoto = (photoId) => {
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteARPhoto(photoId) }
      ]
    );
  };

  const handleSharePhoto = (photo) => {
    Alert.alert('Share Photo', 'Share functionality coming soon!');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>7ftrends</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerIconButton}>
              <Ionicons name="search" size={20} color="#666666" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIconButton}>
              <Ionicons name="chatbubble-ellipses" size={20} color="#666666" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.notificationButton}>
              <Ionicons name="notifications" size={20} color="#666666" />
              <View style={styles.notificationDot} />
            </TouchableOpacity>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.flipCameraButton}
              onPress={() => setFacing(current => current === 'back' ? 'front' : 'back')}
            >
              <Ionicons name="camera-reverse" size={20} color={COLORS.surface} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.galleryButton}
              onPress={() => setShowGallery(true)}
            >
              <Ionicons name="images" size={20} color={COLORS.surface} />
              <Text style={styles.galleryButtonText}>{arPhotos.length}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {isCameraActive ? (
        <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
          <View style={styles.cameraOverlay}>
            <View style={styles.arFrame}>
              <View style={[styles.arCorner, { top: -2, left: -2 }]} />
              <View style={[styles.arCorner, { top: -2, right: -2 }]} />
              <View style={[styles.arCorner, { bottom: -2, left: -2 }]} />
              <View style={[styles.arCorner, { bottom: -2, right: -2 }]} />
            </View>
            <Text style={styles.arText}>Position clothing item here</Text>
            <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.exitCameraButton}
              onPress={() => setIsCameraActive(false)}
            >
              <Ionicons name="close" size={24} color={COLORS.surface} />
            </TouchableOpacity>
          </View>
        </CameraView>
      ) : (
        <View style={styles.cameraPlaceholder}>
          <Ionicons name="camera" size={64} color={COLORS.textSecondary} />
          <Text style={styles.cameraText}>Camera Ready</Text>
          <Text style={styles.cameraSubtext}>
            Select wardrobe items to try on clothes virtually
          </Text>
          <View style={styles.arButtonContainer}>
            <TouchableOpacity
              style={[styles.startCameraButton, styles.wardrobeButton]}
              onPress={() => setShowWardrobeSelector(true)}
            >
              <Ionicons name="shirt-outline" size={20} color={COLORS.surface} />
              <Text style={styles.startCameraButtonText}>Select Wardrobe</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.startCameraButton}
              onPress={() => setIsCameraActive(true)}
            >
              <Ionicons name="camera" size={20} color={COLORS.surface} />
              <Text style={styles.startCameraButtonText}>Start Camera</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* AR Photos Gallery Modal */}
      <Modal
        visible={showGallery}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowGallery(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.galleryModal}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowGallery(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>My AR Photos</Text>
              <TouchableOpacity onPress={() => setShowGallery(false)}>
                <Text style={styles.doneButton}>Done</Text>
              </TouchableOpacity>
            </View>

            {arPhotos.length === 0 ? (
              <View style={styles.emptyGallery}>
                <Ionicons name="camera-outline" size={48} color={COLORS.textSecondary} />
                <Text style={styles.emptyGalleryText}>No AR photos yet</Text>
                <Text style={styles.emptyGallerySubtext}>
                  Take photos to see them here
                </Text>
              </View>
            ) : (
              <ScrollView style={styles.galleryList}>
                {arPhotos.map((photo) => (
                  <TouchableOpacity
                    key={photo.id}
                    style={styles.galleryItem}
                    onPress={() => handleGalleryItemPress(photo)}
                  >
                    <Image source={{ uri: photo.uri }} style={styles.galleryImage} />
                    <View style={styles.galleryItemInfo}>
                      <Text style={styles.galleryItemDate}>
                        {new Date(photo.timestamp).toLocaleDateString()}
                      </Text>
                      <Text style={styles.galleryItemCamera}>
                        {photo.cameraType} camera
                      </Text>
                      {photo.outfitItems && photo.outfitItems.length > 0 && (
                        <Text style={styles.galleryItemOutfit}>
                          {photo.outfitItems.join(', ')}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Wardrobe Selector Modal */}
      <Modal
        visible={showWardrobeSelector}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowWardrobeSelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.wardrobeSelectorModal}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowWardrobeSelector(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Select Wardrobe Items</Text>
              <TouchableOpacity onPress={generateAvatar}>
                <Text style={styles.createAvatarButton}>Create Avatar</Text>
              </TouchableOpacity>
            </View>

            {/* Selected Items Summary */}
            <View style={styles.selectedItemsSummary}>
              <Text style={styles.selectedItemsText}>
                {Object.keys(selectedOutfitItems).length} items selected
              </Text>
              <Text style={styles.selectedCategoriesText}>
                {Object.keys(selectedOutfitItems).join(', ')}
              </Text>
            </View>

            {/* Categories and Items */}
            <ScrollView style={styles.wardrobeCategoriesList}>
              {WARDROBE_CATEGORIES.map((category) => {
                const categoryItems = availableItems.filter(item => item.category === category.id);
                const selectedItem = selectedOutfitItems[category.id];

                return (
                  <View key={category.id} style={styles.wardrobeCategorySection}>
                    <View style={styles.categoryHeader}>
                      <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                      <Text style={styles.categoryTitle}>{category.name}</Text>
                      {selectedItem && (
                        <View style={styles.selectedIndicator}>
                          <Ionicons name="checkmark-circle" size={16} color={COLORS.accent} />
                        </View>
                      )}
                    </View>

                    {categoryItems.length > 0 ? (
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.categoryItemsScroll}
                      >
                        {categoryItems.map((item) => {
                          const isSelected = selectedItem?.id === item.id;
                          return (
                            <TouchableOpacity
                              key={item.id}
                              style={[
                                styles.wardrobeItem,
                                isSelected && styles.wardrobeItemSelected
                              ]}
                              onPress={() => handleItemSelect(item)}
                            >
                              <Image source={{ uri: item.image }} style={styles.wardrobeItemImage} />
                              <Text style={styles.wardrobeItemName} numberOfLines={1}>
                                {item.name}
                              </Text>
                              {isSelected && (
                                <View style={styles.itemSelectedBadge}>
                                  <Ionicons name="checkmark" size={12} color={COLORS.surface} />
                                </View>
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    ) : (
                      <Text style={styles.noItemsText}>No items in this category</Text>
                    )}
                  </View>
                );
              })}
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.wardrobeActions}>
              <TouchableOpacity
                style={[styles.wardrobeActionButton, styles.cancelButton]}
                onPress={() => {
                  setSelectedOutfitItems({});
                  setShowWardrobeSelector(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Clear Selection</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.wardrobeActionButton, styles.tryOnButton]}
                onPress={startCameraWithOutfit}
              >
                <Ionicons name="camera" size={16} color={COLORS.surface} />
                <Text style={styles.tryOnButtonText}>Try On</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Avatar Preview Modal */}
      <Modal
        visible={showAvatarPreview}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowAvatarPreview(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.avatarPreviewModal}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowAvatarPreview(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Your Style Avatar</Text>
              <View style={{ width: 24 }} />
            </View>

            {/* Avatar Display */}
            <View style={styles.avatarDisplay}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarEmoji}>👤</Text>
              </View>
              <Text style={styles.avatarTitle}>Style Profile Created!</Text>
              <Text style={styles.avatarSubtitle}>
                Based on your selected {Object.keys(selectedOutfitItems).length} items
              </Text>
            </View>

            {/* Selected Items Display */}
            <View style={styles.avatarItemsDisplay}>
              <Text style={styles.avatarItemsTitle}>Selected Items:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {Object.values(selectedOutfitItems).map((item) => (
                  <View key={item.id} style={styles.avatarItem}>
                    <Image source={{ uri: item.image }} style={styles.avatarItemImage} />
                    <Text style={styles.avatarItemName} numberOfLines={1}>
                      {item.name}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>

            {/* Avatar Actions */}
            <View style={styles.avatarActions}>
              <TouchableOpacity
                style={[styles.avatarActionButton, styles.backToSelectionButton]}
                onPress={() => setShowAvatarPreview(false)}
              >
                <Text style={styles.backToSelectionButtonText}>Back to Selection</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.avatarActionButton, styles.startCameraButton]}
                onPress={() => {
                  setShowAvatarPreview(false);
                  setShowWardrobeSelector(false);
                  setIsCameraActive(true);
                }}
              >
                <Ionicons name="camera" size={16} color={COLORS.surface} />
                <Text style={styles.startCameraButtonText}>Start AR Camera</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    ...SHADOWS.sm,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.md,
  },
  logoContainer: {
    flex: 1,
  },
  logoText: {
    fontSize: FONTS.sizes.xl,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.sm,
  },
  headerIconButton: {
    padding: SIZES.xs,
  },
  notificationButton: {
    padding: SIZES.xs,
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.error,
  },
  flipCameraButton: {
    backgroundColor: COLORS.accent,
    borderRadius: SIZES.round,
    padding: SIZES.sm,
  },
  galleryButton: {
    backgroundColor: COLORS.accent,
    borderRadius: SIZES.round,
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.xs,
  },
  galleryButtonText: {
    color: COLORS.surface,
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.medium,
  },
  title: {
    fontSize: FONTS.sizes.xl,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    textAlign: 'center',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.xl,
  },
  permissionText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SIZES.md,
    marginBottom: SIZES.sm,
  },
  permissionSubtext: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SIZES.lg,
  },
  startCameraButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: SIZES.xl,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.sm,
    ...SHADOWS.sm,
  },
  startCameraButtonText: {
    color: COLORS.surface,
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.medium,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
  },
  arFrame: {
    flex: 1,
    margin: SIZES.xl,
    borderWidth: 2,
    borderColor: COLORS.accent,
    borderRadius: SIZES.sm,
    position: 'relative',
  },
  arCorner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: COLORS.accent,
  },
  arText: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -100 }, { translateY: -10 }],
    backgroundColor: 'rgba(0,0,0,0.7)',
    color: COLORS.surface,
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.xs,
    fontSize: FONTS.sizes.sm,
  },
  captureButton: {
    alignSelf: 'center',
    marginBottom: SIZES.xl,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.surface,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.surface,
  },
  exitCameraButton: {
    position: 'absolute',
    top: SIZES.xl,
    right: SIZES.lg,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: SIZES.round,
    padding: SIZES.sm,
  },
  cameraPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.xl,
  },
  cameraText: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.medium,
    color: COLORS.text,
    marginTop: SIZES.md,
  },
  cameraSubtext: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SIZES.sm,
    marginBottom: SIZES.xl,
  },
  arButtonContainer: {
    flexDirection: 'row',
    gap: SIZES.md,
  },
  wardrobeButton: {
    backgroundColor: COLORS.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryModal: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.lg,
    width: '90%',
    height: '80%',
    ...SHADOWS.lg,
  },
  wardrobeSelectorModal: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.lg,
    width: '95%',
    height: '85%',
    ...SHADOWS.lg,
  },
  avatarPreviewModal: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.lg,
    width: '90%',
    maxHeight: '70%',
    ...SHADOWS.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.medium,
    color: COLORS.text,
  },
  doneButton: {
    color: COLORS.accent,
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.medium,
  },
  createAvatarButton: {
    color: COLORS.accent,
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.medium,
  },
  emptyGallery: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.xl,
  },
  emptyGalleryText: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.medium,
    color: COLORS.text,
    marginTop: SIZES.md,
  },
  emptyGallerySubtext: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SIZES.sm,
  },
  galleryList: {
    flex: 1,
  },
  galleryItem: {
    flexDirection: 'row',
    padding: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  galleryImage: {
    width: 80,
    height: 100,
    borderRadius: SIZES.sm,
  },
  galleryItemInfo: {
    flex: 1,
    marginLeft: SIZES.md,
    justifyContent: 'center',
  },
  galleryItemDate: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.medium,
    color: COLORS.text,
  },
  galleryItemCamera: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: SIZES.xs,
  },
  galleryItemOutfit: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.accent,
    marginTop: SIZES.xs,
  },
  selectedItemsSummary: {
    padding: SIZES.md,
    backgroundColor: 'rgba(74, 20, 140, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  selectedItemsText: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.medium,
    color: COLORS.text,
  },
  selectedCategoriesText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: SIZES.xs,
  },
  wardrobeCategoriesList: {
    flex: 1,
  },
  wardrobeCategorySection: {
    marginBottom: SIZES.lg,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.sm,
    backgroundColor: 'rgba(74, 20, 140, 0.05)',
  },
  categoryEmoji: {
    fontSize: FONTS.sizes.xl,
    marginRight: SIZES.sm,
  },
  categoryTitle: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.medium,
    color: COLORS.text,
    flex: 1,
  },
  selectedIndicator: {
    marginLeft: SIZES.sm,
  },
  categoryItemsScroll: {
    paddingLeft: SIZES.lg,
  },
  wardrobeItem: {
    marginRight: SIZES.sm,
    alignItems: 'center',
    width: 100,
  },
  wardrobeItemSelected: {
    opacity: 0.8,
  },
  wardrobeItemImage: {
    width: 80,
    height: 100,
    borderRadius: SIZES.sm,
    marginBottom: SIZES.xs,
  },
  wardrobeItemName: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.text,
    textAlign: 'center',
  },
  itemSelectedBadge: {
    position: 'absolute',
    top: -5,
    right: 15,
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noItemsText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    padding: SIZES.sm,
  },
  wardrobeActions: {
    flexDirection: 'row',
    padding: SIZES.lg,
    gap: SIZES.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  wardrobeActionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SIZES.md,
    borderRadius: SIZES.sm,
    gap: SIZES.xs,
  },
  cancelButton: {
    backgroundColor: COLORS.textSecondary,
  },
  cancelButtonText: {
    color: COLORS.surface,
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.medium,
  },
  tryOnButton: {
    backgroundColor: COLORS.accent,
  },
  tryOnButtonText: {
    color: COLORS.surface,
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.medium,
  },
  avatarDisplay: {
    alignItems: 'center',
    padding: SIZES.xl,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.lg,
  },
  avatarEmoji: {
    fontSize: 50,
  },
  avatarTitle: {
    fontSize: FONTS.sizes.xl,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginBottom: SIZES.sm,
  },
  avatarSubtitle: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  avatarItemsDisplay: {
    padding: SIZES.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  avatarItemsTitle: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.medium,
    color: COLORS.text,
    marginBottom: SIZES.sm,
  },
  avatarItem: {
    alignItems: 'center',
    marginRight: SIZES.md,
  },
  avatarItemImage: {
    width: 60,
    height: 75,
    borderRadius: SIZES.xs,
    marginBottom: SIZES.xs,
  },
  avatarItemName: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.text,
    width: 70,
    textAlign: 'center',
  },
  avatarActions: {
    flexDirection: 'row',
    padding: SIZES.lg,
    gap: SIZES.md,
  },
  avatarActionButton: {
    flex: 1,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.sm,
  },
  backToSelectionButton: {
    backgroundColor: COLORS.textSecondary,
  },
  backToSelectionButtonText: {
    color: COLORS.surface,
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.medium,
    textAlign: 'center',
  },
});

export default ARScreen;