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
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    backgroundColor: '#ff4444',
    borderRadius: 4,
  },
  countrySelector: {
    marginLeft: 8,
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  countryFlag: {
    fontSize: 18,
  },

  // Stories
  storiesContainer: {
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  storyItem: {
    alignItems: 'center',
    marginRight: 16,
  },
  firstStoryItem: {
    marginLeft: 16,
  },
  storyAdd: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  storyAddText: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  storyCircle: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#ff4757',
    padding: 2,
    marginBottom: 4,
  },
  storyImage: {
    width: '100%',
    height: '100%',
    borderRadius: 31,
  },
  storyUsername: {
    fontSize: 12,
    color: '#666666',
    maxWidth: 70,
    textAlign: 'center',
  },

  // Feed
  scrollView: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  trendingSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: '#1a1a1a',
    marginBottom: 12,
  },
  selectedHashtagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  selectedHashtagText: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: '#1a1a1a',
    flex: 1,
  },
  showingResultsText: {
    fontSize: 12,
    color: '#666666',
    fontStyle: 'italic',
  },
  trendingTag: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  trendingTagText: {
    fontSize: 14,
    color: '#1a1a1a',
    fontFamily: FONTS.medium,
  },
  feedContainer: {
    padding: 16,
  },

  // Post Styles
  postContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    ...SHADOWS.sm,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  postUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: 16,
    marginRight: 12,
  },
  postUsername: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: '#1a1a1a',
  },
  postTimestamp: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  postImage: {
    width: '100%',
    height: 400,
    backgroundColor: '#f8f9fa',
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  actionButton: {
    marginRight: 20,
  },
  postStats: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  likesCount: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: '#1a1a1a',
    marginRight: 16,
  },
  commentsCount: {
    fontSize: 14,
    color: '#666666',
  },
  postDescription: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  postUsernameText: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: '#1a1a1a',
    marginRight: 8,
  },
  postCaption: {
    fontSize: 14,
    color: '#1a1a1a',
    lineHeight: 20,
  },
  postTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  postTag: {
    fontSize: 14,
    color: COLORS.accent,
    marginRight: 8,
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
    fontFamily: FONTS.bold,
    color: '#1a1a1a',
  },

  // Search Modal
  searchModal: {
    backgroundColor: '#ffffff',
    width: '90%',
    height: '80%',
    borderRadius: 12,
  },
  searchContainer: {
    padding: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#1a1a1a',
  },
  searchResultsContainer: {
    flex: 1,
    padding: 16,
  },
  searchSuggestionsTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: '#1a1a1a',
    marginBottom: 12,
  },
  searchSuggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchSuggestionText: {
    fontSize: 16,
    color: '#1a1a1a',
    marginLeft: 12,
  },
  searchResultsTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: '#1a1a1a',
    marginBottom: 12,
  },
  searchResultItem: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchResultImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultUsername: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  searchResultCaption: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  searchResultStats: {
    fontSize: 12,
    color: '#999999',
  },
  noResults: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 16,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#999999',
    marginTop: 8,
  },

  // Message Modal
  messageModal: {
    backgroundColor: '#ffffff',
    width: '90%',
    height: '80%',
    borderRadius: 12,
  },
  messageList: {
    flex: 1,
  },
  messageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  messageAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  messageAvatarText: {
    fontSize: 20,
    color: '#ffffff',
  },
  messageContent: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  messageUsername: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: '#1a1a1a',
  },
  messageTime: {
    fontSize: 12,
    color: '#666666',
  },
  messageText: {
    fontSize: 14,
    color: '#666666',
  },
  unreadBadge: {
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    fontSize: 12,
    color: '#ffffff',
    fontFamily: FONTS.bold,
  },

  // Floating Action Button
  floatingActionButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.lg,
  },
});