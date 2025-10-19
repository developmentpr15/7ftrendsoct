import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SocialAuthScreen from '../components/auth/SocialAuthScreen';

const Stack = createNativeStackNavigator();

const AuthNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SocialAuth" component={SocialAuthScreen} initialParams={{ initialMode: 'signin' }} />
    </Stack.Navigator>
  );
};

export default AuthNavigator;