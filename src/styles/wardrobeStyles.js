import { StyleSheet } from 'react-native';
import { COLORS, SIZES, FONTS, SHADOWS } from '../utils/constants';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 30,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 1,
    backgroundColor: '#7C3AED',
    borderRadius: 8,
    marginRight: 15,
  },
  logoText: {
    fontSize: 20,
    fontFamily: 'Pacifico_400Regular',
    color: '#FDE047',
    fontWeight: '400',
    letterSpacing: 0.6,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.md,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#ffffff',
  },

  // Stats
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: '#f8f9fa',
    margin: 16,
    borderRadius: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },

  // Quick Actions
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  quickActionButton: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  quickActionText: {
    fontSize: 12,
    color: '#333',
    fontFamily: FONTS.medium,
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '600',
  },

  // Categories
  categoriesContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginBottom: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    ...SHADOWS.xs,
  },
  categoryItemSelected: {
    backgroundColor: `${COLORS.accent}20`,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  categoryIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  categoryEmoji: {
    fontSize: 24,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: COLORS.text,
    marginBottom: 4,
  },
  categoryCount: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  // Recent Items
  recentItemsContainer: {
    margin: 16,
  },
  recentItem: {
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 8,
    marginRight: 12,
    alignItems: 'center',
    width: 100,
    ...SHADOWS.sm,
  },
  recentItemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: COLORS.background,
  },
  recentItemName: {
    fontSize: 12,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  favoriteButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 2,
    ...SHADOWS.xs,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: FONTS.medium,
    color: COLORS.text,
  },

  // Add Item Modal
  addItemModal: {
    backgroundColor: COLORS.surface,
    width: '90%',
    maxHeight: '80%',
    borderRadius: 12,
    padding: 16,
  },
  addPhotoButton: {
    backgroundColor: COLORS.background,
    padding: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  addPhotoText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  formContainer: {
    marginBottom: 20,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 12,
    backgroundColor: '#ffffff',
  },
  submitButton: {
    backgroundColor: COLORS.accent,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    color: COLORS.surface,
    fontFamily: FONTS.medium,
  },

  // Outfit Suggestions Modal
  outfitModal: {
    backgroundColor: COLORS.surface,
    width: '90%',
    maxHeight: '80%',
    borderRadius: 12,
    padding: 16,
  },
  outfitSuggestionsList: {
    flex: 1,
  },
  outfitSuggestion: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  outfitName: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginBottom: 4,
  },
  outfitOccasion: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  outfitItems: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  outfitItem: {
    alignItems: 'center',
    marginRight: 12,
  },
  outfitItemImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginBottom: 4,
    backgroundColor: '#ffffff',
  },
  outfitItemName: {
    fontSize: 10,
    color: COLORS.text,
    textAlign: 'center',
    maxWidth: 60,
  },
  tryOutfitButton: {
    backgroundColor: COLORS.accent,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  tryOutfitButtonText: {
    fontSize: 14,
    color: COLORS.surface,
    fontFamily: FONTS.medium,
  },
});