import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Camera from 'expo-camera';
import { COLORS, SIZES, FONTS, SHADOWS, CATEGORIES, APP_INFO } from '../utils/constants';
import useAuthStore from '../store/authStore';
import { signOut } from '../utils/auth';
import ConnectionStatus from '../components/ConnectionStatus';

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const WardrobeStack = createNativeStackNavigator();
const CompetitionStack = createNativeStackNavigator();
const ARStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();

// Simple Home Screen
const HomeScreen = () => (
  <View style={styles.container}>
    <View style={styles.header}>
      <Text style={styles.title}>7Ftrends</Text>
      <Text style={styles.subtitle}>Your Fashion Feed</Text>
    </View>

    <ScrollView style={styles.scrollView}>
      <View style={styles.placeholder}>
        <Text style={styles.placeholderTitle}>📸 Feed Coming Soon</Text>
        <Text style={styles.placeholderText}>
          See what others are wearing and get inspired!
        </Text>
      </View>

      <View style={styles.placeholder}>
        <Text style={styles.placeholderTitle}>👗 Today's Outfit</Text>
        <Text style={styles.placeholderText}>
          AI-powered outfit suggestions based on your wardrobe
        </Text>
      </View>

      <View style={styles.placeholder}>
        <Text style={styles.placeholderTitle}>🔥 Trending Now</Text>
        <Text style={styles.placeholderText}>
          Discover latest fashion trends and styles
        </Text>
      </View>
    </ScrollView>
  </View>
);

// Simple Wardrobe Screen
const WardrobeScreen = () => (
  <View style={styles.container}>
    <View style={styles.header}>
      <Text style={styles.title}>My Wardrobe</Text>
    </View>

    <ScrollView style={styles.scrollView}>
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Items</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Outfits</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Favorites</Text>
        </View>
      </View>

      <View style={styles.categoriesContainer}>
        <Text style={styles.sectionTitle}>Categories</Text>
        {CATEGORIES.map((category) => (
          <View key={category.id} style={styles.categoryItem}>
            <View style={styles.categoryIcon}>
              <Text style={styles.categoryEmoji}>{category.icon}</Text>
            </View>
            <View style={styles.categoryInfo}>
              <Text style={styles.categoryName}>{category.name}</Text>
              <Text style={styles.categoryCount}>0 items</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
          </View>
        ))}
      </View>
    </ScrollView>
  </View>
);

// Enhanced AR Screen with Camera
const ARScreen = () => {
  const [hasPermission, setHasPermission] = useState(null);
  const [cameraType, setCameraType] = useState('front');
  const [isCameraActive, setIsCameraActive] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>AR Try-On</Text>
        </View>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera" size={64} color={COLORS.textSecondary} />
          <Text style={styles.permissionText}>Requesting camera permission...</Text>
        </View>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>AR Try-On</Text>
        </View>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-off" size={64} color={COLORS.error} />
          <Text style={styles.permissionText}>Camera permission denied</Text>
          <Text style={styles.permissionSubtext}>
            Please enable camera access in your device settings to use AR Try-On
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>AR Try-On</Text>
        <TouchableOpacity
          style={styles.flipCameraButton}
          onPress={() => setCameraType(cameraType === 'back' ? 'front' : 'back')}
        >
          <Ionicons name="camera-reverse" size={24} color={COLORS.surface} />
        </TouchableOpacity>
      </View>

      {isCameraActive ? (
        <Camera.Camera style={styles.camera} type={cameraType}>
          <View style={styles.cameraOverlay}>
            <View style={styles.arFrame}>
              <View style={styles.arCorner} />
              <View style={styles.arCorner} />
              <View style={styles.arCorner} />
              <View style={styles.arCorner} />
            </View>
            <Text style={styles.arText}>Position clothing item here</Text>
            <TouchableOpacity
              style={styles.captureButton}
              onPress={() => console.log('Capture AR photo')}
            >
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
          </View>
        </Camera.Camera>
      ) : (
        <View style={styles.cameraPlaceholder}>
          <Ionicons name="camera" size={64} color={COLORS.textSecondary} />
          <Text style={styles.cameraText}>Camera Ready</Text>
          <Text style={styles.cameraSubtext}>
            Point camera at yourself to try on clothes virtually
          </Text>
          <TouchableOpacity
            style={styles.startCameraButton}
            onPress={() => setIsCameraActive(true)}
          >
            <Ionicons name="camera" size={20} color={COLORS.surface} />
            <Text style={styles.startCameraButtonText}>Start Camera</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// Simple Competition Screen
const CompetitionScreen = () => (
  <View style={styles.container}>
    <View style={styles.header}>
      <Text style={styles.title}>Style Challenges</Text>
    </View>

    <ScrollView style={styles.scrollView}>
      <View style={styles.placeholder}>
        <Text style={styles.placeholderTitle}>🏆 Weekly Challenge</Text>
        <Text style={styles.placeholderText}>
          Theme: Summer Vibes - Show your best summer outfit!
        </Text>
      </View>

      <View style={styles.placeholder}>
        <Text style={styles.placeholderTitle}>🎯 Brand Challenge</Text>
        <Text style={styles.placeholderText}>
          Partner with sustainable brands for eco-friendly fashion
        </Text>
      </View>
    </ScrollView>
  </View>
);

// Enhanced Profile Screen
const ProfileScreen = () => {
  const { user, logout } = useAuthStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            setIsLoggingOut(true);
            try {
              const { error } = await signOut();
              if (!error) {
                logout();
              } else {
                Alert.alert('Logout Failed', 'Please try again later');
              }
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Logout Failed', 'Please try again later');
            } finally {
              setIsLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  const menuItems = [
    { id: 'wardrobe', title: 'My Wardrobe', icon: 'shirt-outline', color: COLORS.accent },
    { id: 'favorites', title: 'My Favorites', icon: 'heart-outline', color: COLORS.like },
    { id: 'outfits', title: 'Outfit History', icon: 'calendar-outline', color: COLORS.comment },
    { id: 'challenges', title: 'Style Challenges', icon: 'trophy-outline', color: COLORS.warning },
    { id: 'settings', title: 'Settings', icon: 'settings-outline', color: COLORS.textSecondary },
    { id: 'help', title: 'Help & Feedback', icon: 'help-circle-outline', color: COLORS.textSecondary },
    { id: 'about', title: 'About', icon: 'information-circle-outline', color: COLORS.textSecondary },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.email?.charAt(0)?.toUpperCase() || 'U'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {user?.user_metadata?.username || user?.email?.split('@')[0] || 'User'}
            </Text>
            <Text style={styles.profileEmail}>
              {user?.email || 'user@example.com'}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Connection Status */}
        <ConnectionStatus showDetails={true} />

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
        </View>

        <View style={styles.menuContainer}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={() => {
                // Handle menu item press
                console.log(`Pressed ${item.title}`);
              }}
            >
              <View style={[styles.menuIcon, { backgroundColor: `${item.color}20` }]}>
                <Ionicons name={item.icon} size={24} color={item.color} />
              </View>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.appInfoContainer}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>{APP_INFO.logo}</Text>
            <Text style={styles.appName}>{APP_INFO.name}</Text>
            <Text style={styles.appVersion}>Version {APP_INFO.version}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.logoutButton, isLoggingOut && styles.logoutButtonDisabled]}
          onPress={handleLogout}
          disabled={isLoggingOut}
        >
          <Ionicons name="log-out-outline" size={20} color={COLORS.surface} />
          <Text style={styles.logoutButtonText}>
            {isLoggingOut ? 'Logging out...' : 'Logout'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

// Stack Navigators
const HomeStackNavigator = () => (
  <HomeStack.Navigator screenOptions={{ headerShown: false }}>
    <HomeStack.Screen name="HomeScreen" component={HomeScreen} />
  </HomeStack.Navigator>
);

const WardrobeStackNavigator = () => (
  <WardrobeStack.Navigator screenOptions={{ headerShown: false }}>
    <WardrobeStack.Screen name="WardrobeScreen" component={WardrobeScreen} />
  </WardrobeStack.Navigator>
);

const ARStackNavigator = () => (
  <ARStack.Navigator screenOptions={{ headerShown: false }}>
    <ARStack.Screen name="ARScreen" component={ARScreen} />
  </ARStack.Navigator>
);

const CompetitionStackNavigator = () => (
  <CompetitionStack.Navigator screenOptions={{ headerShown: false }}>
    <CompetitionStack.Screen name="CompetitionScreen" component={CompetitionScreen} />
  </CompetitionStack.Navigator>
);

const ProfileStackNavigator = () => (
  <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
    <ProfileStack.Screen name="ProfileScreen" component={ProfileScreen} />
  </ProfileStack.Navigator>
);

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Wardrobe') {
            iconName = focused ? 'shirt' : 'shirt-outline';
          } else if (route.name === 'AR') {
            iconName = focused ? 'camera' : 'camera-outline';
          } else if (route.name === 'Competition') {
            iconName = focused ? 'trophy' : 'trophy-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'ellipse';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.accent,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeStackNavigator} options={{ title: 'Feed' }} />
      <Tab.Screen name="Wardrobe" component={WardrobeStackNavigator} options={{ title: 'Wardrobe' }} />
      <Tab.Screen name="AR" component={ARStackNavigator} options={{ title: 'Try On' }} />
      <Tab.Screen name="Competition" component={CompetitionStackNavigator} options={{ title: 'Challenges' }} />
      <Tab.Screen name="Profile" component={ProfileStackNavigator} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SIZES.lg,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: SIZES.xs,
  },
  // Profile specific styles
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.md,
  },
  avatarText: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    color: COLORS.surface,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginBottom: SIZES.xs,
  },
  profileEmail: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  menuContainer: {
    backgroundColor: COLORS.surface,
    margin: SIZES.md,
    borderRadius: 12,
    paddingVertical: SIZES.sm,
    ...SHADOWS.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.md,
    paddingHorizontal: SIZES.md,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.md,
  },
  menuTitle: {
    flex: 1,
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: COLORS.text,
  },
  appInfoContainer: {
    alignItems: 'center',
    padding: SIZES.lg,
    marginTop: SIZES.sm,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoText: {
    fontSize: 48,
    marginBottom: SIZES.sm,
  },
  appName: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginBottom: SIZES.xs,
  },
  appVersion: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.error,
    margin: SIZES.md,
    paddingVertical: SIZES.md,
    borderRadius: 8,
    ...SHADOWS.sm,
  },
  logoutButtonDisabled: {
    opacity: 0.6,
  },
  logoutButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontFamily: FONTS.medium,
    marginLeft: SIZES.sm,
  },
  scrollView: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    margin: SIZES.md,
    padding: SIZES.lg,
    borderRadius: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: SIZES.xs,
  },
  placeholder: {
    backgroundColor: COLORS.surface,
    margin: SIZES.md,
    padding: SIZES.lg,
    borderRadius: 12,
    marginBottom: SIZES.md,
    ...SHADOWS.sm,
  },
  placeholderTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginBottom: SIZES.sm,
  },
  placeholderText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  categoriesContainer: {
    padding: SIZES.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginBottom: SIZES.md,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SIZES.md,
    borderRadius: 8,
    marginBottom: SIZES.sm,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.md,
  },
  categoryEmoji: {
    fontSize: 20,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: COLORS.text,
  },
  categoryCount: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  cameraPlaceholder: {
    flex: 1,
    backgroundColor: COLORS.primary,
    margin: SIZES.md,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraText: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.surface,
    marginTop: SIZES.md,
  },
  cameraSubtext: {
    fontSize: 14,
    color: COLORS.surface,
    textAlign: 'center',
    marginTop: SIZES.sm,
    marginHorizontal: SIZES.lg,
  },
  // AR Camera Styles
  flipCameraButton: {
    backgroundColor: COLORS.accent,
    padding: SIZES.sm,
    borderRadius: 20,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
  },
  arFrame: {
    position: 'absolute',
    top: '30%',
    left: '20%',
    width: '60%',
    height: '30%',
    borderWidth: 2,
    borderColor: COLORS.accent,
    borderRadius: 8,
  },
  arCorner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: COLORS.accent,
  },
  arText: {
    position: 'absolute',
    top: '63%',
    left: 0,
    right: 0,
    textAlign: 'center',
    color: COLORS.surface,
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.medium,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: SIZES.sm,
  },
  captureButton: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.accent,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.accent,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.lg,
  },
  permissionText: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.medium,
    color: COLORS.text,
    marginTop: SIZES.md,
    textAlign: 'center',
  },
  permissionSubtext: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    marginTop: SIZES.sm,
    textAlign: 'center',
  },
  startCameraButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.md,
    borderRadius: 8,
    marginTop: SIZES.lg,
    ...SHADOWS.md,
  },
  startCameraButtonText: {
    color: COLORS.surface,
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.medium,
    marginLeft: SIZES.sm,
  },
});

export default TabNavigator;