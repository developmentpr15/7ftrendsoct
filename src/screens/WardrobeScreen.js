import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
  TextInput,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS, SHADOWS } from '../utils/constants';
import useAppStore from '../store/appStore';

const WARDROBE_CATEGORIES = [
  { id: 'top', name: 'Tops', icon: '👔', emoji: '👔' },
  { id: 'bottom', name: 'Bottoms', icon: '👖', emoji: '👖' },
  { id: 'shoes', name: 'Shoes', icon: '👟', emoji: '👟' },
  { id: 'accessories', name: 'Accessories', icon: '⌚', emoji: '⌚' },
  { id: 'outerwear', name: 'Outerwear', icon: '🧥', emoji: '🧥' },
  { id: 'hats', name: 'Hats', icon: '👒', emoji: '👒' }
];

const WardrobeScreen = () => {
  const { wardrobeItems, addWardrobeItem, removeWardrobeItem } = useAppStore();
  const [showAddItem, setShowAddItem] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [newItem, setNewItem] = useState({
    name: '',
    category: 'top',
    brand: '',
    color: '',
    size: '',
    image: null
  });

  const filteredItems = selectedCategory === 'all'
    ? wardrobeItems
    : wardrobeItems.filter(item => item.category === selectedCategory);

  const handleAddItem = () => {
    if (newItem.name.trim()) {
      const item = {
        id: Date.now().toString(),
        ...newItem,
        image: newItem.image || `https://picsum.photos/seed/${Date.now()}/200/250`,
        dateAdded: new Date().toISOString()
      };

      addWardrobeItem(item);
      setNewItem({
        name: '',
        category: 'top',
        brand: '',
        color: '',
        size: '',
        image: null
      });
      setShowAddItem(false);
      Alert.alert('Success', 'Item added to your wardrobe!');
    } else {
      Alert.alert('Error', 'Please enter at least an item name.');
    }
  };

  const handleDeleteItem = (item) => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to remove ${item.name} from your wardrobe?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => removeWardrobeItem(item.id)
        }
      ]
    );
  };

  const renderWardrobeItem = ({ item }) => (
    <View key={item.id} style={styles.wardrobeItem}>
      <Image source={{ uri: item.image }} style={styles.wardrobeItemImage} />
      <View style={styles.wardrobeItemInfo}>
        <Text style={styles.wardrobeItemName}>{item.name}</Text>
        {item.brand && <Text style={styles.wardrobeItemBrand}>{item.brand}</Text>}
        <View style={styles.wardrobeItemDetails}>
          {item.color && <Text style={styles.wardrobeItemDetail}>{item.color}</Text>}
          {item.size && <Text style={styles.wardrobeItemDetail}>Size {item.size}</Text>}
        </View>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteItem(item)}
      >
        <Ionicons name="trash-outline" size={16} color={COLORS.error} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Wardrobe</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddItem(true)}
        >
          <Ionicons name="add" size={20} color={COLORS.surface} />
        </TouchableOpacity>
      </View>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
      >
        <TouchableOpacity
          style={[
            styles.categoryChip,
            selectedCategory === 'all' && styles.activeCategoryChip
          ]}
          onPress={() => setSelectedCategory('all')}
        >
          <Text style={[
            styles.categoryChipText,
            selectedCategory === 'all' && styles.activeCategoryChipText
          ]}>
            All
          </Text>
        </TouchableOpacity>
        {WARDROBE_CATEGORIES.map(category => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryChip,
              selectedCategory === category.id && styles.activeCategoryChip
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <Text style={[
              styles.categoryChipText,
              selectedCategory === category.id && styles.activeCategoryChipText
            ]}>
              {category.emoji} {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Wardrobe Items */}
      {filteredItems.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="shirt-outline" size={64} color={COLORS.textSecondary} />
          <Text style={styles.emptyStateText}>
            {selectedCategory === 'all' ? 'Your wardrobe is empty' : `No ${WARDROBE_CATEGORIES.find(c => c.id === selectedCategory)?.name.toLowerCase()} found`}
          </Text>
          <Text style={styles.emptyStateSubtext}>
            Add your first item to get started!
          </Text>
          <TouchableOpacity
            style={styles.emptyStateButton}
            onPress={() => setShowAddItem(true)}
          >
            <Ionicons name="add" size={20} color={COLORS.surface} />
            <Text style={styles.emptyStateButtonText}>Add First Item</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          renderItem={renderWardrobeItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.wardrobeList}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Add Item Modal */}
      <Modal
        visible={showAddItem}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddItem(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.addModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Wardrobe Item</Text>
              <TouchableOpacity onPress={() => setShowAddItem(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Item Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., White T-Shirt"
                  value={newItem.name}
                  onChangeText={(text) => setNewItem(prev => ({ ...prev, name: text }))}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Category</Text>
                <View style={styles.categoryGrid}>
                  {WARDROBE_CATEGORIES.map(category => (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.categoryOption,
                        newItem.category === category.id && styles.selectedCategoryOption
                      ]}
                      onPress={() => setNewItem(prev => ({ ...prev, category: category.id }))}
                    >
                      <Text style={styles.categoryOptionText}>{category.emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Brand</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Nike, Zara"
                  value={newItem.brand}
                  onChangeText={(text) => setNewItem(prev => ({ ...prev, brand: text }))}
                />
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: SIZES.sm }]}>
                  <Text style={styles.inputLabel}>Color</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., Blue"
                    value={newItem.color}
                    onChangeText={(text) => setNewItem(prev => ({ ...prev, color: text }))}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Size</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., M, L"
                    value={newItem.size}
                    onChangeText={(text) => setNewItem(prev => ({ ...prev, size: text }))}
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddItem(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.addButton]}
                onPress={handleAddItem}
              >
                <Text style={styles.addButtonText}>Add Item</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.md,
    paddingTop: 50,
    backgroundColor: COLORS.surface,
    ...SHADOWS.md,
  },
  title: {
    fontSize: FONTS.sizes.xl,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  addButton: {
    backgroundColor: COLORS.accent,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  categoryScroll: {
    padding: SIZES.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
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
    color: COLORS.textSecondary,
  },
  activeCategoryChipText: {
    color: COLORS.surface,
    fontFamily: FONTS.medium,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.xl,
  },
  emptyStateText: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.medium,
    color: COLORS.text,
    marginTop: SIZES.md,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SIZES.sm,
    marginBottom: SIZES.xl,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.md,
    gap: SIZES.sm,
    ...SHADOWS.md,
  },
  emptyStateButtonText: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.medium,
    color: COLORS.surface,
  },
  wardrobeList: {
    padding: SIZES.md,
  },
  wardrobeItem: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.md,
    padding: SIZES.md,
    marginBottom: SIZES.sm,
    flexDirection: 'row',
    ...SHADOWS.sm,
  },
  wardrobeItemImage: {
    width: 80,
    height: 100,
    borderRadius: SIZES.sm,
    backgroundColor: COLORS.background,
  },
  wardrobeItemInfo: {
    flex: 1,
    marginLeft: SIZES.md,
  },
  wardrobeItemName: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.medium,
    color: COLORS.text,
  },
  wardrobeItemBrand: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  wardrobeItemDetails: {
    flexDirection: 'row',
    gap: SIZES.md,
    marginTop: SIZES.xs,
  },
  wardrobeItemDetail: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
  deleteButton: {
    padding: SIZES.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  addModal: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: SIZES.xl,
    borderTopRightRadius: SIZES.xl,
    maxHeight: '80%',
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
  modalContent: {
    padding: SIZES.md,
  },
  inputGroup: {
    marginBottom: SIZES.md,
  },
  inputRow: {
    flexDirection: 'row',
  },
  inputLabel: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.medium,
    color: COLORS.text,
    marginBottom: SIZES.xs,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: SIZES.sm,
    padding: SIZES.sm,
    fontSize: FONTS.sizes.md,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.sm,
  },
  categoryOption: {
    width: 50,
    height: 50,
    borderRadius: SIZES.sm,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCategoryOption: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  categoryOptionText: {
    fontSize: 20,
  },
  modalActions: {
    flexDirection: 'row',
    padding: SIZES.md,
    gap: SIZES.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  modalButton: {
    flex: 1,
    padding: SIZES.md,
    borderRadius: SIZES.md,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.background,
  },
  cancelButtonText: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.medium,
    color: COLORS.text,
  },
  addButton: {
    backgroundColor: COLORS.accent,
  },
  addButtonText: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.medium,
    color: COLORS.surface,
  },
});

export default WardrobeScreen;