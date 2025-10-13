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
  scrollView: {
    flex: 1,
    backgroundColor: '#ffffff',
  },

  // Profile Header
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 20,
    backgroundColor: '#ffffff',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontFamily: FONTS.bold,
    color: COLORS.surface,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  profileInfo: {
    flex: 1,
  },
  username: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    color: '#1a1a1a',
    marginBottom: 12,
  },

  // Bio
  bioContainer: {
    marginTop: 8,
  },
  bioText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 4,
  },
  editIcon: {
    marginLeft: 4,
  },
  bioEditContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
  },
  bioInput: {
    fontSize: 14,
    color: '#1a1a1a',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  bioActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  bioCancelText: {
    fontSize: 14,
    color: '#666666',
    marginRight: 16,
  },
  bioSaveText: {
    fontSize: 14,
    color: COLORS.accent,
    fontFamily: FONTS.medium,
  },

  // Stats
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: '#f8f9fa',
    marginHorizontal: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: '#1a1a1a',
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },

  // Menu
  menuContainer: {
    marginHorizontal: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: '#1a1a1a',
    marginBottom: 2,
  },
  menuTitleDestructive: {
    color: COLORS.error,
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#666666',
  },

  // Version
  versionContainer: {
    alignItems: 'center',
    padding: 40,
  },
  versionText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  versionSubtext: {
    fontSize: 12,
    color: '#999999',
  },
});