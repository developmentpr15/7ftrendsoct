import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS } from '../utils/constants';
import { testSupabaseConnection } from '../utils/supabase';

const ConnectionStatus = ({ showDetails = false }) => {
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);

  const checkConnection = async () => {
    try {
      setStatus('loading');
      setError(null);
      const result = await testSupabaseConnection();

      if (result.success) {
        setStatus('connected');
        setError(null);
      } else {
        setStatus('error');
        setError(result.error.message);
      }
    } catch (err) {
      setStatus('error');
      setError(err.message);
    } finally {
      setLastChecked(new Date().toLocaleTimeString());
    }
  };

  useEffect(() => {
    checkConnection();

    // Check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = () => {
    switch (status) {
      case 'connected':
        return <Ionicons name="wifi" size={20} color={COLORS.success} />;
      case 'error':
        return <Ionicons name="wifi-off" size={20} color={COLORS.error} />;
      case 'loading':
        return <ActivityIndicator size={16} color={COLORS.textSecondary} />;
      default:
        return <Ionicons name="help" size={20} color={COLORS.textSecondary} />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'error':
        return 'Connection Error';
      case 'loading':
        return 'Checking...';
      default:
        return 'Unknown';
    }
  };

  if (!showDetails) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.statusBar}>
        <View style={styles.statusInfo}>
          {getStatusIcon()}
          <Text style={[styles.statusText, { color: status === 'connected' ? COLORS.success : status === 'error' ? COLORS.error : COLORS.textSecondary }]}>
            {getStatusText()}
          </Text>
        </View>

        <TouchableOpacity style={styles.refreshButton} onPress={checkConnection}>
          <Ionicons name="refresh" size={16} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {lastChecked && (
        <Text style={styles.lastCheckedText}>
          Last checked: {lastChecked}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    padding: SIZES.md,
    margin: SIZES.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.medium,
    marginLeft: SIZES.sm,
  },
  refreshButton: {
    padding: SIZES.xs,
  },
  errorContainer: {
    marginTop: SIZES.sm,
    padding: SIZES.sm,
    backgroundColor: `${COLORS.error}10`,
    borderRadius: 4,
  },
  errorText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.error,
  },
  lastCheckedText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    marginTop: SIZES.sm,
    textAlign: 'center',
  },
});

export default ConnectionStatus;