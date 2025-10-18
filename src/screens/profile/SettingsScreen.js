import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../utils/constants';

const SettingsScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState(true);
  const [locationServices, setLocationServices] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [dataCollection, setDataCollection] = useState(true);

  const settingsOptions = [
    {
      id: 1,
      title: 'Account',
      icon: 'person-outline',
      items: [
        { id: 1, title: 'Edit Profile', subtitle: 'Update your profile information' },
        { id: 2, title: 'Privacy Settings', subtitle: 'Control your privacy preferences' },
        { id: 3, title: 'Security', subtitle: 'Password and authentication' },
      ],
    },
    {
      id: 2,
      title: 'Preferences',
      icon: 'settings-outline',
      items: [
        { id: 1, title: 'Language', subtitle: 'English (US)' },
        { id: 2, title: 'Theme', subtitle: 'Light' },
        { id: 3, title: 'Font Size', subtitle: 'Medium' },
      ],
    },
    {
      id: 3,
      title: 'Notifications',
      icon: 'notifications-outline',
      items: [
        { id: 1, title: 'Push Notifications', subtitle: 'Receive app notifications' },
        { id: 2, title: 'Email Updates', subtitle: 'Weekly fashion digest' },
        { id: 3, title: 'Message Alerts', subtitle: 'New messages' },
      ],
    },
    {
      id: 4,
      title: 'Support',
      icon: 'help-circle-outline',
      items: [
        { id: 1, title: 'Help Center', subtitle: 'Get help and support' },
        { id: 2, title: 'Contact Us', subtitle: 'Reach out to our team' },
        { id: 3, title: 'About', subtitle: 'Version 1.0.0' },
      ],
    },
  ];

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: () => {} },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* User Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>U</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.username}>Username</Text>
            <Text style={styles.email}>user@example.com</Text>
          </View>
          <TouchableOpacity style={styles.editProfileButton}>
            <Ionicons name="create-outline" size={20} color={COLORS.accent} />
          </TouchableOpacity>
        </View>

        {/* Settings Sections */}
        {settingsOptions.map((section) => (
          <View key={section.id} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons
                name={section.icon}
                size={24}
                color={COLORS.text}
                style={styles.sectionIcon}
              />
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
            <View style={styles.sectionItems}>
              {section.items.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.settingItem}
                  onPress={() => {}}
                >
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingTitle}>{item.title}</Text>
                    <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={COLORS.textSecondary}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Quick Toggles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Settings</Text>
          <View style={styles.toggleContainer}>
            <View style={styles.toggleItem}>
              <Text style={styles.toggleTitle}>Push Notifications</Text>
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: COLORS.border, true: COLORS.accent }}
                thumbColor={COLORS.surface}
              />
            </View>
            <View style={styles.toggleItem}>
              <Text style={styles.toggleTitle}>Location Services</Text>
              <Switch
                value={locationServices}
                onValueChange={setLocationServices}
                trackColor={{ false: COLORS.border, true: COLORS.accent }}
                thumbColor={COLORS.surface}
              />
            </View>
            <View style={styles.toggleItem}>
              <Text style={styles.toggleTitle}>Dark Mode</Text>
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: COLORS.border, true: COLORS.accent }}
                thumbColor={COLORS.surface}
              />
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    margin: SIZES.md,
    padding: SIZES.lg,
    borderRadius: SIZES.sm,
    ...SHADOWS.sm,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.md,
  },
  avatarText: {
    fontSize: FONTS.sizes.xl,
    fontFamily: FONTS.bold,
    color: COLORS.surface,
  },
  profileInfo: {
    flex: 1,
  },
  username: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginBottom: 2,
  },
  email: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
  editProfileButton: {
    padding: SIZES.sm,
  },
  section: {
    backgroundColor: COLORS.surface,
    margin: SIZES.md,
    marginTop: 0,
    borderRadius: SIZES.sm,
    paddingVertical: SIZES.sm,
    ...SHADOWS.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sectionIcon: {
    marginRight: SIZES.sm,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  sectionItems: {
    paddingVertical: SIZES.xs,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.md,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: FONTS.sizes.md,
    color: COLORS.text,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
  toggleContainer: {
    paddingVertical: SIZES.sm,
  },
  toggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.md,
  },
  toggleTitle: {
    fontSize: FONTS.sizes.md,
    color: COLORS.text,
  },
  logoutButton: {
    backgroundColor: COLORS.error,
    margin: SIZES.md,
    padding: SIZES.md,
    borderRadius: SIZES.sm,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  logoutButtonText: {
    color: COLORS.surface,
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.bold,
  },
});

export default SettingsScreen;