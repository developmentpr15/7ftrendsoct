import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../utils/constants';

const OutfitBuilderScreen = ({ navigation }) => {
  const [selectedItems, setSelectedItems] = useState([]);

  const wardrobeItems = [
    { id: 1, name: 'White T-Shirt', category: 'top', color: '#FFFFFF', image: 'https://picsum.photos/seed/shirt1/100/100' },
    { id: 2, name: 'Blue Jeans', category: 'bottom', color: '#4169E1', image: 'https://picsum.photos/seed/jeans1/100/100' },
    { id: 3, name: 'Black Jacket', category: 'outerwear', color: '#000000', image: 'https://picsum.photos/seed/jacket1/100/100' },
    { id: 4, name: 'Red Dress', category: 'dress', color: '#FF0000', image: 'https://picsum.photos/seed/dress1/100/100' },
    { id: 5, name: 'White Sneakers', category: 'shoes', color: '#FFFFFF', image: 'https://picsum.photos/seed/shoes1/100/100' },
    { id: 6, name: 'Black Heels', category: 'shoes', color: '#000000', image: 'https://picsum.photos/seed/heels1/100/100' },
  ];

  const categories = ['top', 'bottom', 'outerwear', 'dress', 'shoes', 'accessories'];

  const handleItemSelect = (item) => {
    const itemIndex = selectedItems.findIndex(selected => selected.id === item.id);

    if (itemIndex >= 0) {
      // Remove item if already selected
      setSelectedItems(selectedItems.filter(selected => selected.id !== item.id));
    } else {
      // Check if category already has an item selected
      const categoryItem = selectedItems.find(selected => selected.category === item.category);
      if (categoryItem && item.category !== 'accessories') {
        Alert.alert('Category Full', `You already have a ${item.category} selected. Remove it first to add this item.`);
        return;
      }
      // Add new item
      setSelectedItems([...selectedItems, item]);
    }
  };

  const handleSaveOutfit = () => {
    if (selectedItems.length === 0) {
      Alert.alert('No Items', 'Please select at least one item for your outfit.');
      return;
    }

    Alert.alert(
      'Save Outfit',
      'Save this outfit to your wardrobe?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Save', onPress: () => {
          Alert.alert('Success', 'Outfit saved successfully!');
          setSelectedItems([]);
        }},
      ]
    );
  };

  const getCategoryIcon = (category) => {
    const icons = {
      top: 'tshirt-outline',
      bottom: 'person-outline',
      outerwear: 'shirt-outline',
      dress: 'woman-outline',
      shoes: 'footsteps-outline',
      accessories: 'key-outline',
    };
    return icons[category] || 'cube-outline';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {
          if (navigation.canGoBack()) {
            navigation.goBack();
          }
        }}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Outfit Builder</Text>
        <TouchableOpacity onPress={handleSaveOutfit} disabled={selectedItems.length === 0}>
          <Text style={[styles.saveButton, selectedItems.length === 0 && styles.saveButtonDisabled]}>
            Save
          </Text>
        </TouchableOpacity>
      </View>

      {/* Selected Items Preview */}
      <View style={styles.previewSection}>
        <Text style={styles.sectionTitle}>Your Outfit</Text>
        {selectedItems.length === 0 ? (
          <View style={styles.emptyPreview}>
            <Ionicons name="add-circle-outline" size={48} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>Start building your outfit</Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {selectedItems.map((item) => (
              <View key={item.id} style={styles.selectedItem}>
                <Image source={{ uri: item.image }} style={styles.selectedItemImage} />
                <Text style={styles.selectedItemName} numberOfLines={1}>{item.name}</Text>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleItemSelect(item)}
                >
                  <Ionicons name="close-circle" size={20} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Wardrobe Items */}
      <View style={styles.wardrobeSection}>
        <Text style={styles.sectionTitle}>Your Wardrobe</Text>
        <ScrollView showsVerticalScrollIndicator={false}>
          {categories.map((category) => {
            const categoryItems = wardrobeItems.filter(item => item.category === category);
            if (categoryItems.length === 0) return null;

            return (
              <View key={category} style={styles.categorySection}>
                <View style={styles.categoryHeader}>
                  <Ionicons name={getCategoryIcon(category)} size={20} color={COLORS.text} />
                  <Text style={styles.categoryTitle}>{category.charAt(0).toUpperCase() + category.slice(1)}</Text>
                </View>
                <View style={styles.itemsGrid}>
                  {categoryItems.map((item) => {
                    const isSelected = selectedItems.some(selected => selected.id === item.id);
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[styles.itemCard, isSelected && styles.itemCardSelected]}
                        onPress={() => handleItemSelect(item)}
                      >
                        <Image source={{ uri: item.image }} style={styles.itemImage} />
                        <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                        {isSelected && (
                          <View style={styles.selectedIndicator}>
                            <Ionicons name="checkmark-circle" size={20} color={COLORS.accent} />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </View>
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
    padding: SIZES.md,
    backgroundColor: COLORS.surface,
    ...SHADOWS.sm,
  },
  headerTitle: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  saveButton: {
    fontSize: FONTS.sizes.md,
    color: COLORS.accent,
    fontFamily: FONTS.bold,
  },
  saveButtonDisabled: {
    color: COLORS.textSecondary,
  },
  previewSection: {
    backgroundColor: COLORS.surface,
    margin: SIZES.md,
    padding: SIZES.md,
    borderRadius: SIZES.sm,
    ...SHADOWS.sm,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginBottom: SIZES.md,
  },
  emptyPreview: {
    alignItems: 'center',
    paddingVertical: SIZES.xl,
  },
  emptyText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: SIZES.sm,
  },
  selectedItems: {
    flexDirection: 'row',
  },
  selectedItem: {
    alignItems: 'center',
    marginRight: SIZES.md,
    position: 'relative',
  },
  selectedItemImage: {
    width: 60,
    height: 60,
    borderRadius: SIZES.sm,
    marginBottom: SIZES.xs,
  },
  selectedItemName: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.text,
    textAlign: 'center',
    maxWidth: 60,
  },
  removeButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
  },
  wardrobeSection: {
    flex: 1,
    margin: SIZES.md,
    marginTop: 0,
  },
  categorySection: {
    marginBottom: SIZES.lg,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  categoryTitle: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginLeft: SIZES.sm,
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  itemCard: {
    width: '48%',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.sm,
    padding: SIZES.sm,
    marginBottom: SIZES.sm,
    alignItems: 'center',
    position: 'relative',
    ...SHADOWS.sm,
  },
  itemCardSelected: {
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: SIZES.sm,
    marginBottom: SIZES.xs,
  },
  itemName: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.text,
    textAlign: 'center',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
  },
});

export default OutfitBuilderScreen;