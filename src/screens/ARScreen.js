import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  Image,
  Modal,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Camera } from 'expo-camera';
import { COLORS, SIZES, FONTS, SHADOWS } from '../utils/constants';
import useAppStore from '../store/appStore';

const { width } = Dimensions.get('window');

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
  const [permission, requestPermission] = Camera.useCameraPermissions();
  const [facing, setFacing] = useState('front');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [showWardrobeSelector, setShowWardrobeSelector] = useState(false);
  const [selectedOutfitItems, setSelectedOutfitItems] = useState({});
  const [showAvatarPreview, setShowAvatarPreview] = useState(false);

  const availableItems = wardrobeItems.length > 0 ? wardrobeItems : sampleWardrobeItems;

  if (!permission) {
    // Camera permissions are still loading
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>AR Try-On</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.flipCameraButton}
              onPress={() => setFacing(current => current === 'back' ? 'front' : 'back')}
            >
              <Ionicons name="camera-reverse" size={20} color={COLORS.surface} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera" size={64} color={COLORS.textSecondary} />
          <Text style={styles.permissionText}>Requesting camera permission...</Text>
        </View>
      </View>
    );
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>AR Try-On</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.flipCameraButton}
              onPress={() => setFacing(current => current === 'back' ? 'front' : 'back')}
            >
              <Ionicons name="camera-reverse" size={20} color={COLORS.surface} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color={COLORS.error} />
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

  // Handle outfit item selection
  const handleOutfitItemSelect = (item) => {
    setSelectedOutfitItems(prev => {
      const isSelected = prev[item.category]?.id === item.id;
      if (isSelected) {
        const newSelection = { ...prev };
        delete newSelection[item.category];
        return newSelection;
      } else {
        return { ...prev, [item.category]: item };
      }
    });
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
      // Simulate photo capture
      const selectedItems = Object.values(selectedOutfitItems);
      const arPhoto = {
        uri: 'https://picsum.photos/seed/' + Date.now() + '/400/400',
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
    } catch (error) {
      console.error('Camera capture error:', error);
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    }
  };

  const handleGalleryItemPress = (photo) => {
    Alert.alert(
      'AR Photo',
      `Photo taken on ${new Date(photo.timestamp).toLocaleDateString()}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteARPhoto(photo.id) },
      ]
    );
  };

  const renderWardrobeItem = ({ item }) => {
    const isSelected = selectedOutfitItems[item.category]?.id === item.id;
    return (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.wardrobeItem,
          isSelected && styles.selectedWardrobeItem
        ]}
        onPress={() => handleOutfitItemSelect(item)}
      >
        <Image source={{ uri: item.image }} style={styles.wardrobeItemImage} />
        <Text style={styles.wardrobeItemName}>{item.name}</Text>
        {isSelected && (
          <View style={styles.selectionOverlay}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.accent} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderGalleryItem = ({ item }) => (
    <TouchableOpacity
      style={styles.galleryItem}
      onPress={() => handleGalleryItemPress(item)}
    >
      <Image source={{ uri: item.uri }} style={styles.galleryImage} />
      <View style={styles.galleryItemOverlay}>
        <Text style={styles.galleryItemDate}>
          {new Date(item.timestamp).toLocaleDateString()}
        </Text>
        {item.outfitItems && item.outfitItems.length > 0 && (
          <Text style={styles.galleryItems}>
            {item.outfitItems.length} items
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>AR Try-On</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.galleryButton}
            onPress={() => setShowGallery(true)}
          >
            <Ionicons name="images" size={20} color={COLORS.surface} />
            {arPhotos.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{arPhotos.length}</Text>
              </View>
            )}
          </TouchableOpacity>
          {isCameraActive && (
            <TouchableOpacity
              style={styles.flipCameraButton}
              onPress={() => setFacing(current => current === 'back' ? 'front' : 'back')}
            >
              <Ionicons name="camera-reverse" size={20} color={COLORS.surface} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isCameraActive ? (
        <View style={styles.camera}>
          <View style={styles.cameraOverlay}>
            <View style={styles.arFrame}>
              <View style={[styles.arCorner, { top: -2, left: -2 }]} />
              <View style={[styles.arCorner, { top: -2, right: -2 }]} />
              <View style={[styles.arCorner, { bottom: -2, left: -2 }]} />
              <View style={[styles.arCorner, { bottom: -2, right: -2 }]} />
            </View>
            <Text style={styles.arText}>Camera functionality temporarily disabled</Text>
            <TouchableOpacity style={styles.captureButton} onPress={() => setIsCameraActive(false)}>
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.exitCameraButton}
              onPress={() => setIsCameraActive(false)}
            >
              <Ionicons name="close" size={24} color={COLORS.surface} />
            </TouchableOpacity>
          </View>
        </View>
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

      {/* Wardrobe Selector Modal */}
      <Modal
        visible={showWardrobeSelector}
        transparent
        animationType="slide"
        onRequestClose={() => setShowWardrobeSelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.wardrobeModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Outfit Items</Text>
              <TouchableOpacity onPress={() => setShowWardrobeSelector(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {/* Selected Outfit Preview */}
            {Object.keys(selectedOutfitItems).length > 0 && (
              <View style={styles.selectedOutfitContainer}>
                <Text style={styles.selectedOutfitTitle}>Selected Outfit</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {Object.values(selectedOutfitItems).map(item => (
                    <View key={item.id} style={styles.selectedOutfitItem}>
                      <Image source={{ uri: item.image }} style={styles.selectedOutfitImage} />
                      <Text style={styles.selectedOutfitName}>{item.name}</Text>
                      <TouchableOpacity
                        style={styles.removeSelectedItem}
                        onPress={() => handleOutfitItemSelect(item)}
                      >
                        <Ionicons name="close-circle" size={16} color={COLORS.error} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Category Tabs */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryScroll}
            >
              <TouchableOpacity
                key="all"
                style={[styles.categoryChip, styles.activeCategoryChip]}
              >
                <Text style={styles.categoryChipText}>All</Text>
              </TouchableOpacity>
              {WARDROBE_CATEGORIES.map(category => (
                <TouchableOpacity key={category.id} style={styles.categoryChip}>
                  <Text style={styles.categoryChipText}>{category.emoji} {category.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Wardrobe Items Grid */}
            <FlatList
              data={availableItems}
              renderItem={renderWardrobeItem}
              keyExtractor={item => item.id}
              numColumns={2}
              contentContainerStyle={styles.wardrobeGrid}
              showsVerticalScrollIndicator={false}
            />

            {/* Action Buttons */}
            <View style={styles.wardrobeActions}>
              <TouchableOpacity
                style={[styles.wardrobeActionButton, styles.cancelButton]}
                onPress={() => setShowWardrobeSelector(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
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

      {/* Gallery Modal */}
      <Modal
        visible={showGallery}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGallery(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.galleryModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>AR Photos Gallery</Text>
              <TouchableOpacity onPress={() => setShowGallery(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {arPhotos.length === 0 ? (
              <View style={styles.emptyGallery}>
                <Ionicons name="camera-outline" size={64} color={COLORS.textSecondary} />
                <Text style={styles.emptyGalleryText}>No AR photos yet</Text>
                <Text style={styles.emptyGallerySubtext}>
                  Take your first AR try-on photo to see it here
                </Text>
                <TouchableOpacity
                  style={styles.startCameraButton}
                  onPress={() => {
                    setShowGallery(false);
                    setShowWardrobeSelector(true);
                  }}
                >
                  <Ionicons name="camera" size={20} color={COLORS.surface} />
                  <Text style={styles.startCameraButtonText}>Start AR Camera</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={arPhotos}
                renderItem={renderGalleryItem}
                keyExtractor={item => item.id}
                numColumns={2}
                contentContainerStyle={styles.galleryGrid}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingTop: 50,
    paddingHorizontal: SIZES.md,
    paddingBottom: SIZES.sm,
    ...SHADOWS.md,
  },
  title: {
    fontSize: FONTS.sizes.xl,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  headerActions: {
    flexDirection: 'row',
    gap: SIZES.sm,
  },
  galleryButton: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.surface,
    fontFamily: FONTS.bold,
  },
  flipCameraButton: {
    backgroundColor: COLORS.accent,
    padding: SIZES.sm,
    borderRadius: 20,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.xl,
  },
  permissionText: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.medium,
    color: COLORS.text,
    marginTop: SIZES.md,
  },
  permissionSubtext: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SIZES.sm,
    marginBottom: SIZES.lg,
  },
  startCameraButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.md,
    gap: SIZES.sm,
    ...SHADOWS.md,
  },
  wardrobeButton: {
    backgroundColor: COLORS.primary,
  },
  startCameraButtonText: {
    color: COLORS.surface,
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.medium,
  },
  cameraPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.xl,
  },
  cameraText: {
    fontSize: FONTS.sizes.xl,
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
    gap: SIZES.md,
  },
  // AR Camera Styles
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.lg,
  },
  arFrame: {
    width: 250,
    height: 350,
    borderWidth: 2,
    borderColor: COLORS.accent,
    borderRadius: SIZES.lg,
    position: 'relative',
    marginTop: SIZES.xl,
  },
  arCorner: {
    position: 'absolute',
    width: 20,
    height: 20,
    backgroundColor: COLORS.accent,
  },
  arText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.text,
    textAlign: 'center',
    marginVertical: SIZES.md,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: COLORS.accent,
    marginBottom: SIZES.xl,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.accent,
  },
  exitCameraButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  wardrobeModal: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: SIZES.xl,
    borderTopRightRadius: SIZES.xl,
    maxHeight: '90%',
    flex: 1,
  },
  galleryModal: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: SIZES.xl,
    borderTopRightRadius: SIZES.xl,
    height: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  selectedOutfitContainer: {
    padding: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  selectedOutfitTitle: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.medium,
    color: COLORS.text,
    marginBottom: SIZES.sm,
  },
  selectedOutfitItem: {
    alignItems: 'center',
    marginRight: SIZES.md,
    position: 'relative',
  },
  selectedOutfitImage: {
    width: 60,
    height: 80,
    borderRadius: SIZES.sm,
    backgroundColor: COLORS.background,
  },
  selectedOutfitName: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.text,
    marginTop: SIZES.xs,
    maxWidth: 80,
    textAlign: 'center',
  },
  removeSelectedItem: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  categoryScroll: {
    padding: SIZES.md,
  },
  categoryChip: {
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    marginRight: SIZES.sm,
  },
  activeCategoryChip: {
    backgroundColor: COLORS.accent,
  },
  categoryChipText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text,
  },
  wardrobeGrid: {
    padding: SIZES.md,
  },
  wardrobeItem: {
    backgroundColor: COLORS.background,
    borderRadius: SIZES.md,
    padding: SIZES.sm,
    margin: SIZES.xs,
    alignItems: 'center',
    position: 'relative',
    width: (width / 2) - SIZES.md,
    ...SHADOWS.sm,
  },
  selectedWardrobeItem: {
    borderColor: COLORS.accent,
    borderWidth: 2,
  },
  wardrobeItemImage: {
    width: 100,
    height: 120,
    borderRadius: SIZES.sm,
    backgroundColor: COLORS.surface,
  },
  wardrobeItemName: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text,
    marginTop: SIZES.xs,
    textAlign: 'center',
  },
  selectionOverlay: {
    position: 'absolute',
    top: SIZES.xs,
    right: SIZES.xs,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wardrobeActions: {
    flexDirection: 'row',
    padding: SIZES.md,
    gap: SIZES.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  wardrobeActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.md,
    borderRadius: SIZES.md,
    gap: SIZES.sm,
  },
  cancelButton: {
    backgroundColor: COLORS.background,
  },
  cancelButtonText: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.medium,
    color: COLORS.text,
  },
  tryOnButton: {
    backgroundColor: COLORS.accent,
  },
  tryOnButtonText: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.medium,
    color: COLORS.surface,
  },
  // Gallery Styles
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
    marginBottom: SIZES.xl,
  },
  galleryGrid: {
    padding: SIZES.md,
  },
  galleryItem: {
    margin: SIZES.xs,
    borderRadius: SIZES.md,
    overflow: 'hidden',
    width: (width / 2) - SIZES.md,
    height: 200,
    position: 'relative',
    ...SHADOWS.sm,
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  galleryItemOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: SIZES.xs,
  },
  galleryItemDate: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.surface,
  },
  galleryItems: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.accent,
    marginTop: 2,
  },
});

export default ARScreen;