import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { Pacifico_400Regular } from '@expo-google-fonts/pacifico';

// Import extracted screen components
import HomeScreen from '../screens/social/HomeScreen';
import WardrobeScreen from '../screens/wardrobe/WardrobeScreen';
import ARScreen from '../screens/ar/ARScreen';
import CompetitionScreen from '../screens/social/CompetitionScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

// Import auth and app stores
import useAuthStore from '../store/authStore';
import AuthNavigator from './AuthNavigator';
import { COLORS, SIZES, FONTS } from '../utils/constants';

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const WardrobeStack = createNativeStackNavigator();
const ARStack = createNativeStackNavigator();
const CompetitionStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();

// Stack Navigators for each tab
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

const TabNavigatorComponent = () => {
  let [fontsLoaded] = useFonts({
    Pacifico_400Regular,
  });

  if (!fontsLoaded) {
    return null;
  }

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

const TabNavigator = () => {
  return <TabNavigatorComponent />;
};

export default TabNavigator;