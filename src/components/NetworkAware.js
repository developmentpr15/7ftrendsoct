import React, { useState, useEffect } from 'react';
import { View, NetInfo } from 'react-native';
import { testSupabaseConnection } from '../utils/supabase';
import NetworkError from './NetworkError';

const withNetworkAware = (WrappedComponent) => {
  return (props) => {
    const [isOnline, setIsOnline] = useState(true);
    const [isRetrying, setIsRetrying] = useState(false);
    const [hasNetworkError, setHasNetworkError] = useState(false);

    useEffect(() => {
      checkNetworkStatus();
      const interval = setInterval(checkNetworkStatus, 30000); // Check every 30 seconds

      return () => clearInterval(interval);
    }, []);

    const checkNetworkStatus = async () => {
      try {
        // Test Supabase connectivity
        const result = await testSupabaseConnection();

        if (result.success) {
          setHasNetworkError(false);
          setIsOnline(true);
        } else {
          setHasNetworkError(true);
          setIsOnline(false);
        }
      } catch (error) {
        setHasNetworkError(true);
        setIsOnline(false);
      }
    };

    const handleRetry = async () => {
      setIsRetrying(true);
      await checkNetworkStatus();
      setIsRetrying(false);
    };

    if (hasNetworkError) {
      return <NetworkError onRetry={handleRetry} isRetrying={isRetrying} />;
    }

    return <WrappedComponent {...props} />;
  };
};

export default withNetworkAware;