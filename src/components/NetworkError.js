import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS } from '../utils/constants';

const NetworkError = ({ onRetry, isRetrying }) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="wifi-off" size={64} color={COLORS.textSecondary} />
        <Text style={styles.title}>Network seems to be having issues</Text>
        <Text style={styles.subtitle}>Please try again later</Text>

        {isRetrying ? (
          <View style={styles.retryingContainer}>
            <ActivityIndicator size="small" color={COLORS.accent} />
            <Text style={styles.retryingText}>Retrying...</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
            <Ionicons name="refresh" size={20} color={COLORS.surface} />
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SIZES.lg,
  },
  content: {
    alignItems: 'center',
    maxWidth: 300,
  },
  title: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginTop: SIZES.lg,
    marginBottom: SIZES.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SIZES.xl,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.md,
    borderRadius: 8,
    marginTop: SIZES.md,
  },
  retryButtonText: {
    color: COLORS.surface,
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.medium,
    marginLeft: SIZES.sm,
  },
  retryingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SIZES.md,
  },
  retryingText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.md,
    marginLeft: SIZES.sm,
  },
});

export default NetworkError;