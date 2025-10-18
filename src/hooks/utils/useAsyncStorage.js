import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async';

export const useAsyncStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(null);
  const [loading, setLoading] = useState(true);

  const getValue = useCallback(async () => {
    try {
      setLoading(true);
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : initialValue;
    } catch (error) {
      console.error(`Error reading AsyncStorage key "${key}":`, error);
      return initialValue;
    } finally {
      setLoading(false);
    }
  }, [key, initialValue]);

  const setValue = useCallback(async (value) => {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
      setStoredValue(value);
    } catch (error) {
      console.error(`Error setting AsyncStorage key "${key}":`, error);
    }
  }, []);

  // Initialize on mount
  useState(() => {
    getValue().then(setStoredValue);
  });

  return [storedValue, setValue, loading];
};

export default useAsyncStorage;