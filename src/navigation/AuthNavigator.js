import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SocialAuthScreen from '../components/auth/SocialAuthScreen';
import OnboardingFlow from '../components/auth/OnboardingFlow';
import MagicLinkAuth from '../components/auth/MagicLinkAuth';

const Stack = createNativeStackNavigator();

const AuthNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SocialAuth" component={SocialAuthScreen} initialParams={{ initialMode: 'signin' }} />
      <Stack.Screen name="MagicLinkAuth" component={MagicLinkAuth} />
      <Stack.Screen name="Onboarding" component={OnboardingFlow} />
    </Stack.Navigator>
  );
};

export default AuthNavigator;