import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  TextInput,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS, SHADOWS } from '../utils/constants';
import useAuthStore from '../store/authStore';
import { signOut } from '../utils/auth';

const ProfileScreen = () => {
  const { user, logout } = useAuthStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioText, setBioText] = useState('Fashion enthusiast | Style explorer | Trendsetter 🌟');
  const [tempBio, setTempBio] = useState(bioText);

  const handleEditBio = () => {
    setIsEditingBio(true);
    setTempBio(bioText);
  };

  const handleSaveBio = () => {
    if (tempBio.trim()) {
      setBioText(tempBio.trim());
      setIsEditingBio(false);
      Alert.alert('Success', 'Bio updated successfully!');
    }
  };

  const handleCancelBio = () => {
    setTempBio(bioText);
    setIsEditingBio(false);
  };

  const handleLogout = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            setIsLoggingOut(true);
            try {
              logout();
              await signOut();
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
              setIsLoggingOut(false);
            }
          }
        }
      ]
    );
  };

  // Sample user stats data
  const userStats = {
    posts: 0,
    followers: 0,
    following: 0,
    likes: 0,
    comments: 0,
    shares: 0,
  };

  // Sample recent activity data
  const recentActivity = [
    { id: 1, type: 'like', text: 'Your post received 10 likes', time: '2 hours ago', icon: 'heart' },
    { id: 2, type: 'comment', text: 'New comment on your post', time: '5 hours ago', icon: 'chatbubble' },
    { id: 3, type: 'follow', text: 'Someone started following you', time: '1 day ago', icon: 'person-add' },
    { id: 4, type: 'like', text: 'Your photo was liked', time: '2 days ago', icon: 'heart' },
  ];

  // Sample achievements data
  const achievements = [
    { id: 1, name: 'First Post', icon: '📝', description: 'Made your first post', unlocked: true },
    { id: 2, name: 'Trendsetter', icon: '🔥', description: 'Got 100 likes', unlocked: false },
    { id: 3, name: 'Style Icon', icon: '⭐', description: '500 followers', unlocked: false },
    { id: 4, name: 'Fashion Expert', icon: '👗', description: 'Posted 50 times', unlocked: false },
  ];

  // Sample settings options
  const settingsOptions = [
    { id: 1, title: 'Edit Profile', icon: 'person-outline', onPress: () => Alert.alert('Edit Profile', 'Profile editing coming soon!') },
    { id: 2, title: 'Notifications', icon: 'notifications-outline', onPress: () => Alert.alert('Notifications', 'Notification settings coming soon!') },
    { id: 3, title: 'Privacy', icon: 'lock-closed-outline', onPress: () => Alert.alert('Privacy', 'Privacy settings coming soon!') },
    { id: 4, title: 'Help & Support', icon: 'help-circle-outline', onPress: () => Alert.alert('Help', 'Help center coming soon!') },
    { id: 5, title: 'About', icon: 'information-circle-outline', onPress: () => Alert.alert('About', '7Ftrends v1.0.0') },
  ];

  const renderActivityItem = ({ item }) => (
    <View key={item.id} style={styles.activityItem}>
      <View style={[styles.activityIcon, { backgroundColor: COLORS.accent + '20' }]}>
        <Ionicons
          name={item.icon}
          size={16}
          color={item.type === 'like' ? COLORS.error : COLORS.accent}
        />
      </View>
      <View style={styles.activityContent}>
        <Text style={styles.activityText}>{item.text}</Text>
        <Text style={styles.activityTime}>{item.time}</Text>
      </View>
    </View>
  );

  const renderAchievement = ({ item }) => (
    <View key={item.id} style={[styles.achievementItem, !item.unlocked && styles.lockedAchievement]}>
      <Text style={styles.achievementIcon}>{item.icon}</Text>
      <View style={styles.achievementInfo}>
        <Text style={[styles.achievementName, !item.unlocked && styles.lockedText]}>
          {item.name}
        </Text>
        <Text style={styles.achievementDescription}>{item.description}</Text>
      </View>
      {item.unlocked && (
        <Ionicons name="checkmark-circle" size={20} color={COLORS.accent} />
      )}
      {!item.unlocked && (
        <Ionicons name="lock-closed" size={20} color={COLORS.textSecondary} />
      )}
    </View>
  );

  const renderSettingOption = ({ item }) => (
    <TouchableOpacity
      key={item.id}
      style={styles.settingOption}
      onPress={item.onPress}
    >
      <View style={styles.settingLeft}>
        <Ionicons name={item.icon} size={20} color={COLORS.textSecondary} />
        <Text style={styles.settingTitle}>{item.title}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.coverPhoto}>
            <View style={styles.coverPlaceholder}>
              <Ionicons name="image-outline" size={40} color={COLORS.textSecondary} />
            </View>
            <TouchableOpacity style={styles.changeCoverButton}>
              <Ionicons name="camera" size={16} color={COLORS.surface} />
            </TouchableOpacity>
          </View>

          <View style={styles.profileInfo}>
            <View style={styles.avatarContainer}>
              <View style={[styles.avatar, { backgroundColor: COLORS.primary }]}>
                <Text style={styles.avatarText}>{user?.avatar || '👤'}</Text>
              </View>
              <TouchableOpacity style={styles.changeAvatarButton}>
                <Ionicons name="camera" size={16} color={COLORS.surface} />
              </TouchableOpacity>
            </View>

            <Text style={styles.username}>{user?.username || 'Anonymous'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>

            {/* Bio Section */}
            <View style={styles.bioSection}>
              {isEditingBio ? (
                <View style={styles.bioEditContainer}>
                  <TextInput
                    style={styles.bioInput}
                    value={tempBio}
                    onChangeText={setTempBio}
                    multiline
                    maxLength={150}
                    autoFocus
                  />
                  <View style={styles.bioEditActions}>
                    <TouchableOpacity
                      style={[styles.bioButton, styles.cancelButton]}
                      onPress={handleCancelBio}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.bioButton, styles.saveButton]}
                      onPress={handleSaveBio}
                    >
                      <Text style={styles.saveButtonText}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.bioDisplay}>
                  <Text style={styles.bioText}>{bioText}</Text>
                  <TouchableOpacity onPress={handleEditBio}>
                    <Ionicons name="create-outline" size={16} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{userStats.posts}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{userStats.followers}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{userStats.following}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{userStats.likes}</Text>
            <Text style={styles.statLabel}>Likes</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="share-outline" size={18} color={COLORS.accent} />
            <Text style={styles.actionButtonText}>Share Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="qr-code-outline" size={18} color={COLORS.accent} />
            <Text style={styles.actionButtonText}>QR Code</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityList}>
            {recentActivity.map(renderActivityItem)}
          </View>
        </View>

        {/* Achievements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <View style={styles.achievementsList}>
            {achievements.map(renderAchievement)}
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.settingsList}>
            {settingsOptions.map(renderSettingOption)}
          </View>
        </View>

        {/* Sign Out Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.signOutButton, isLoggingOut && styles.disabledButton]}
            onPress={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <Text style={styles.signOutButtonText}>Signing Out...</Text>
            ) : (
              <>
                <Ionicons name="log-out-outline" size={18} color={COLORS.error} />
                <Text style={styles.signOutButtonText}>Sign Out</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* App Version */}
        <View style={styles.versionInfo}>
          <Text style={styles.versionText}>7Ftrends v1.0.0</Text>
          <Text style={styles.versionSubtext}>Made with ❤️ for fashion lovers</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  profileHeader: {
    position: 'relative',
  },
  coverPhoto: {
    height: 120,
    backgroundColor: COLORS.surface,
    position: 'relative',
  },
  coverPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changeCoverButton: {
    position: 'absolute',
    bottom: SIZES.sm,
    right: SIZES.sm,
    backgroundColor: COLORS.accent,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    alignItems: 'center',
    paddingHorizontal: SIZES.lg,
    paddingBottom: SIZES.lg,
    marginTop: -40,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: SIZES.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.surface,
    ...SHADOWS.md,
  },
  avatarText: {
    fontSize: 32,
  },
  changeAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.accent,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  username: {
    fontSize: FONTS.sizes.xl,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginBottom: SIZES.xs,
  },
  userEmail: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: SIZES.md,
  },
  bioSection: {
    width: '100%',
  },
  bioDisplay: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: SIZES.sm,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.md,
    minHeight: 60,
  },
  bioText: {
    flex: 1,
    fontSize: FONTS.sizes.sm,
    color: COLORS.text,
    lineHeight: 18,
    marginRight: SIZES.sm,
  },
  bioEditContainer: {
    padding: SIZES.sm,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.md,
  },
  bioInput: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text,
    backgroundColor: COLORS.background,
    borderRadius: SIZES.sm,
    padding: SIZES.sm,
    minHeight: 60,
    textAlignVertical: 'top',
    marginBottom: SIZES.sm,
  },
  bioEditActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SIZES.sm,
  },
  bioButton: {
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.sm,
  },
  cancelButton: {
    backgroundColor: COLORS.background,
  },
  cancelButtonText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text,
  },
  saveButton: {
    backgroundColor: COLORS.accent,
  },
  saveButtonText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.surface,
    fontFamily: FONTS.medium,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: SIZES.lg,
    backgroundColor: COLORS.surface,
    marginHorizontal: SIZES.lg,
    borderRadius: SIZES.md,
    marginBottom: SIZES.md,
    ...SHADOWS.sm,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: FONTS.sizes.xl,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  statLabel: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: SIZES.xs,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SIZES.sm,
    marginHorizontal: SIZES.lg,
    marginBottom: SIZES.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.sm,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.md,
    gap: SIZES.xs,
    ...SHADOWS.sm,
  },
  actionButtonText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.accent,
    fontFamily: FONTS.medium,
  },
  section: {
    marginHorizontal: SIZES.lg,
    marginBottom: SIZES.lg,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginBottom: SIZES.md,
  },
  activityList: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.md,
    padding: SIZES.sm,
    ...SHADOWS.sm,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.sm,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text,
  },
  activityTime: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  achievementsList: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.md,
    padding: SIZES.sm,
    ...SHADOWS.sm,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  lockedAchievement: {
    opacity: 0.6,
  },
  achievementIcon: {
    fontSize: 24,
    marginRight: SIZES.sm,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementName: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.medium,
    color: COLORS.text,
  },
  lockedText: {
    color: COLORS.textSecondary,
  },
  achievementDescription: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  settingsList: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.md,
    ...SHADOWS.sm,
  },
  settingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.md,
  },
  settingTitle: {
    fontSize: FONTS.sizes.md,
    color: COLORS.text,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.md,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.md,
    gap: SIZES.sm,
    borderWidth: 1,
    borderColor: COLORS.error,
    ...SHADOWS.sm,
  },
  disabledButton: {
    opacity: 0.5,
  },
  signOutButtonText: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.medium,
    color: COLORS.error,
  },
  versionInfo: {
    alignItems: 'center',
    paddingVertical: SIZES.xl,
  },
  versionText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
  versionSubtext: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    marginTop: SIZES.xs,
  },
});

export default ProfileScreen;