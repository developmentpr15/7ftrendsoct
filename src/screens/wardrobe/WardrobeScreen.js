import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useAppStore from '../../store/appStore';
import { COLORS } from '../../utils/constants';
import styles from '../../styles/wardrobeStyles';

// Categories for wardrobe
const CATEGORIES = [
  { id: 'top', name: 'Tops', icon: '👔' },
  { id: 'bottom', name: 'Bottoms', icon: '👖' },
  { id: 'shoes', name: 'Shoes', icon: '👟' },
  { id: 'accessories', name: 'Accessories', icon: '⌚' },
  { id: 'outerwear', name: 'Outerwear', icon: '🧥' },
  { id: 'hats', name: 'Hats', icon: '👒' }
];

const WardrobeScreen = () => {
  const {
    wardrobeItems,
    addWardrobeItem,
    removeWardrobeItem,
    updateWardrobeItem,
    getWardrobeStats,
    getFavoriteItems,
    getOutfitSuggestions,
    pickImage,
    setSelectedCategory
  } = useAppStore();

  const [addItemModalVisible, setAddItemModalVisible] = useState(false);
  const [outfitSuggestionsVisible, setOutfitSuggestionsVisible] = useState(false);
  const [selectedCategory, setSelectedCategoryLocal] = useState(null);

  const stats = getWardrobeStats();
  const favoriteItems = getFavoriteItems();
  const outfitSuggestions = getOutfitSuggestions();

  const handleAddItem = async () => {
    const result = await pickImage();
    if (result && !result.canceled) {
      setAddItemModalVisible(true);
      setSelectedCategoryLocal(null);
    }
  };

  const handleSubmitItem = (name, category, color, brand) => {
    addWardrobeItem({
      name,
      category,
      color,
      brand,
      image: 'https://picsum.photos/seed/' + Date.now() + '/200/200',
      isFavorite: false,
      dateAdded: new Date().toISOString(),
    });
    setAddItemModalVisible(false);
  };

  const handleCategoryPress = (category) => {
    setSelectedCategory(category.id);
    setSelectedCategoryLocal(category.id);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>7ftrends</Text>
          </View>
          <View style={styles.headerActions}>
            {/* Wardrobe page header actions removed */}
          </View>
          <TouchableOpacity style={styles.addButton} onPress={handleAddItem}>
            <Ionicons name="add" size={24} color={COLORS.surface} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Items</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{Object.keys(stats.byCategory).length}</Text>
            <Text style={styles.statLabel}>Categories</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{favoriteItems.length}</Text>
            <Text style={styles.statLabel}>Favorites</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => setOutfitSuggestionsVisible(true)}
          >
            <Ionicons name="shirt-outline" size={24} color={COLORS.accent} />
            <Text style={styles.quickActionText}>Get Outfit Ideas</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton} onPress={handleAddItem}>
            <Ionicons name="camera-outline" size={24} color={COLORS.accent} />
            <Text style={styles.quickActionText}>Add Item</Text>
          </TouchableOpacity>
        </View>

        {/* Categories */}
        <View style={styles.categoriesContainer}>
          <Text style={styles.sectionTitle}>Categories</Text>
          {CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[styles.categoryItem, selectedCategory === category.id && styles.categoryItemSelected]}
              onPress={() => handleCategoryPress(category)}
            >
              <View style={styles.categoryIcon}>
                <Text style={styles.categoryEmoji}>{category.icon}</Text>
              </View>
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryName}>{category.name}</Text>
                <Text style={styles.categoryCount}>
                  {stats.byCategory[category.id] || 0} items
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Items */}
        {wardrobeItems.length > 0 && (
          <View style={styles.recentItemsContainer}>
            <Text style={styles.sectionTitle}>Recent Items</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {wardrobeItems.slice(-5).map((item) => (
                <View key={item.id} style={styles.recentItem}>
                  <Image source={{ uri: item.image }} style={styles.recentItemImage} />
                  <Text style={styles.recentItemName} numberOfLines={1}>{item.name}</Text>
                  <TouchableOpacity
                    style={styles.favoriteButton}
                    onPress={() => updateWardrobeItem(item.id, { isFavorite: !item.isFavorite })}
                  >
                    <Ionicons
                      name={item.isFavorite ? "heart" : "heart-outline"}
                      size={16}
                      color={item.isFavorite ? COLORS.like : COLORS.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* Add Item Modal */}
      <Modal
        visible={addItemModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAddItemModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.addItemModal}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setAddItemModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Add New Item</Text>
              <View style={{ width: 24 }} />
            </View>

            <TouchableOpacity
              style={styles.addPhotoButton}
              onPress={() => console.log('Add photo')}
            >
              <Ionicons name="camera" size={32} color={COLORS.textSecondary} />
              <Text style={styles.addPhotoText}>Add Photo</Text>
            </TouchableOpacity>

            <View style={styles.formContainer}>
              <TextInput
                style={styles.input}
                placeholder="Item name"
                placeholderTextColor={COLORS.textSecondary}
              />
              <TextInput
                style={styles.input}
                placeholder="Brand"
                placeholderTextColor={COLORS.textSecondary}
              />
              <TextInput
                style={styles.input}
                placeholder="Color"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={() => handleSubmitItem('New Item', 'top', 'Blue', 'Brand')}
            >
              <Text style={styles.submitButtonText}>Add Item</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Outfit Suggestions Modal */}
      <Modal
        visible={outfitSuggestionsVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setOutfitSuggestionsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.outfitModal}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setOutfitSuggestionsVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Outfit Suggestions</Text>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.outfitSuggestionsList}>
              {outfitSuggestions.map((outfit) => (
                <View key={outfit.id} style={styles.outfitSuggestion}>
                  <Text style={styles.outfitName}>{outfit.name}</Text>
                  <Text style={styles.outfitOccasion}>{outfit.occasion}</Text>
                  <View style={styles.outfitItems}>
                    {outfit.items.map((item, index) => (
                      <View key={index} style={styles.outfitItem}>
                        <Image source={{ uri: item.image }} style={styles.outfitItemImage} />
                        <Text style={styles.outfitItemName}>{item.name}</Text>
                      </View>
                    ))}
                  </View>
                  <TouchableOpacity style={styles.tryOutfitButton}>
                    <Text style={styles.tryOutfitButtonText}>Try This Outfit</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default WardrobeScreen;