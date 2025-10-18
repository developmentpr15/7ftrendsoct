import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '../../store/authStore';
import { COLORS } from '../../utils/constants';
import styles from '../../styles/profileStyles';

const ProfileScreen = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
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
    }
  };

  const handleCancelBio = () => {
    setTempBio(bioText);
    setIsEditingBio(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            setIsLoggingOut(true);
            try {
              await logout();
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            } finally {
              setIsLoggingOut(false);
            }
          }
        }
      ]
    );
  };

  const menuItems = [
    {
      icon: 'person-outline',
      title: 'Edit Profile',
      subtitle: 'Update your profile information',
      onPress: () => Alert.alert('Edit Profile', 'Profile editing coming soon!')
    },
    {
      icon: 'settings-outline',
      title: 'Settings',
      subtitle: 'App preferences and privacy',
      onPress: () => Alert.alert('Settings', 'Settings panel coming soon!')
    },
    {
      icon: 'notifications-outline',
      title: 'Notifications',
      subtitle: 'Manage push notifications',
      onPress: () => Alert.alert('Notifications', 'Notification settings coming soon!')
    },
    {
      icon: 'shield-outline',
      title: 'Privacy',
      subtitle: 'Privacy and security settings',
      onPress: () => Alert.alert('Privacy', 'Privacy settings coming soon!')
    },
    {
      icon: 'help-circle-outline',
      title: 'Help & Support',
      subtitle: 'Get help with the app',
      onPress: () => Alert.alert('Help', 'Help center coming soon!')
    },
    {
      icon: 'information-circle-outline',
      title: 'About',
      subtitle: 'App version and information',
      onPress: () => Alert.alert('About', '7Ftrends v1.0.0\nFashion discovery app')
    },
    {
      icon: 'log-out-outline',
      title: 'Logout',
      subtitle: 'Sign out of your account',
      onPress: handleLogout,
      isDestructive: true
    }
  ];

  const stats = [
    { label: 'Posts', value: '42' },
    { label: 'Followers', value: '1.2K' },
    { label: 'Following', value: '856' }
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>7ftrends</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerIconButton}>
              <Ionicons name="settings-outline" size={20} color="#666666" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.user_metadata?.username?.[0]?.toUpperCase() ||
                 user?.email?.[0]?.toUpperCase() || 'U'}
              </Text>
            </View>
            <TouchableOpacity style={styles.editAvatarButton}>
              <Ionicons name="camera" size={16} color={COLORS.surface} />
            </TouchableOpacity>
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.username}>
              {user?.user_metadata?.username || user?.email?.split('@')[0] || 'User'}
            </Text>

            {/* Bio Section */}
            <View style={styles.bioContainer}>
              {isEditingBio ? (
                <View style={styles.bioEditContainer}>
                  <TextInput
                    style={styles.bioInput}
                    value={tempBio}
                    onChangeText={setTempBio}
                    multiline
                    autoFocus
                    maxLength={150}
                  />
                  <View style={styles.bioActions}>
                    <TouchableOpacity onPress={handleCancelBio}>
                      <Text style={styles.bioCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleSaveBio}>
                      <Text style={styles.bioSaveText}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity onPress={handleEditBio}>
                  <Text style={styles.bioText}>{bioText}</Text>
                  <Ionicons name="create-outline" size={14} color={COLORS.textSecondary} style={styles.editIcon} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statItem}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.onPress}
            >
              <View style={styles.menuIcon}>
                <Ionicons
                  name={item.icon}
                  size={24}
                  color={item.isDestructive ? COLORS.error : COLORS.textSecondary}
                />
              </View>
              <View style={styles.menuContent}>
                <Text style={[
                  styles.menuTitle,
                  item.isDestructive && styles.menuTitleDestructive
                ]}>
                  {item.title}
                </Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={COLORS.textSecondary}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>7Ftrends v1.0.0</Text>
          <Text style={styles.versionSubtext}>Made with ❤️ for fashion enthusiasts</Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default ProfileScreen;