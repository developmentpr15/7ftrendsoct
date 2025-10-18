import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS, SHADOWS } from '../utils/constants';
import useAuthStore from '../store/authStore';
import { signOut } from '../utils/auth';
import { ConnectionStatus } from '../components';
import {
  HomeScreen,
  ARScreen,
  ProfileScreen,
  WardrobeScreen,
  CompetitionScreen
} from '../screens';
import OptimizedFeedScreen from '../screens/social/OptimizedFeedScreen';

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const WardrobeStack = createNativeStackNavigator();
const CompetitionStack = createNativeStackNavigator();
const ARStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();




// Home Stack Navigator
const HomeStackNavigator = () => {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen
        name="HomeMain"
        component={OptimizedFeedScreen}
        options={{ headerShown: false }}
      />
    </HomeStack.Navigator>
  );
};


// Wardrobe Stack Navigator
const WardrobeStackNavigator = () => {
  return (
    <WardrobeStack.Navigator>
      <WardrobeStack.Screen
        name="WardrobeMain"
        component={WardrobeScreen}
        options={{
          title: 'My Wardrobe',
          headerStyle: { backgroundColor: COLORS.surface },
          headerTintColor: COLORS.text,
        }}
      />
    </WardrobeStack.Navigator>
  );
};

// Competition Stack Navigator
const CompetitionStackNavigator = () => {
  return (
    <CompetitionStack.Navigator>
      <CompetitionStack.Screen
        name="CompetitionMain"
        component={CompetitionScreen}
        options={{
          title: 'Competitions',
          headerStyle: { backgroundColor: COLORS.surface },
          headerTintColor: COLORS.text,
        }}
      />
    </CompetitionStack.Navigator>
  );
};

// AR Stack Navigator
const ARStackNavigator = () => {
  return (
    <ARStack.Navigator>
      <ARStack.Screen
        name="ARMain"
        component={ARScreen}
        options={{
          title: 'AR Try-On',
          headerStyle: { backgroundColor: COLORS.surface },
          headerTintColor: COLORS.text,
        }}
      />
    </ARStack.Navigator>
  );
};

// Profile Stack Navigator
const ProfileStackNavigator = () => {
  return (
    <ProfileStack.Navigator>
      <ProfileStack.Screen
        name="ProfileMain"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          headerStyle: { backgroundColor: COLORS.surface },
          headerTintColor: COLORS.text,
        }}
      />
    </ProfileStack.Navigator>
  );
};

// Main Tab Navigator
const TabNavigator = () => {
  return (
    <>
      <ConnectionStatus />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            switch (route.name) {
              case 'Home':
                iconName = focused ? 'home' : 'home-outline';
                break;
              case 'Wardrobe':
                iconName = focused ? 'shirt' : 'shirt-outline';
                break;
              case 'Competition':
                iconName = focused ? 'trophy' : 'trophy-outline';
                break;
              case 'AR':
                iconName = focused ? 'camera' : 'camera-outline';
                break;
              case 'Profile':
                iconName = focused ? 'person' : 'person-outline';
                break;
              default:
                iconName = 'ellipse-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: COLORS.accent,
          tabBarInactiveTintColor: COLORS.textSecondary,
          tabBarStyle: {
            backgroundColor: COLORS.surface,
            borderTopColor: COLORS.border,
            height: 60,
            paddingBottom: 5,
            paddingTop: 5,
            ...SHADOWS.md,
          },
          tabBarLabelStyle: {
            fontSize: FONTS.sizes.xs,
            fontFamily: FONTS.medium,
          },
          headerShown: false,
        })}
      >
        <Tab.Screen
          name="Home"
          component={HomeStackNavigator}
          options={{ tabBarLabel: 'Home' }}
        />
        <Tab.Screen
          name="Wardrobe"
          component={WardrobeStackNavigator}
          options={{ tabBarLabel: 'Wardrobe' }}
        />
        <Tab.Screen
          name="Competition"
          component={CompetitionStackNavigator}
          options={{ tabBarLabel: 'Compete' }}
        />
        <Tab.Screen
          name="AR"
          component={ARStackNavigator}
          options={{ tabBarLabel: 'AR Try-On' }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileStackNavigator}
          options={{ tabBarLabel: 'Profile' }}
        />
      </Tab.Navigator>
    </>
  );
};

export default TabNavigator;