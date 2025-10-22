// Backup of original App.js
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import ErrorBoundary from './src/components/ErrorBoundary';
import AppNavigator from './src/navigation/AppNavigator';
import useAuthStore from './src/store/authStore';

export default function App() {
  useEffect(() => {
    const unsubscribe = useAuthStore.getState().initAuth();

    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  return (
    <ErrorBoundary>
      <>
        <StatusBar style="light" backgroundColor="#2c2c2c" />
        <AppNavigator />
      </>
    </ErrorBoundary>
  );
}