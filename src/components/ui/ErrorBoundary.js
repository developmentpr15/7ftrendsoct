import React, { Component } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS } from '../../utils/constants';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo,
    });

    // Check if it's a network error
    const isNetworkError = error.message?.includes('Network request failed') ||
                          error.message?.includes('Failed to fetch') ||
                          error.message?.includes('timeout');

    if (isNetworkError) {
      console.log('Network error detected in ErrorBoundary');
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      const isNetworkError = this.state.error?.message?.includes('Network request failed') ||
                            this.state.error?.message?.includes('Failed to fetch') ||
                            this.state.error?.message?.includes('timeout');

      if (isNetworkError) {
        return (
          <View style={styles.container}>
            <View style={styles.content}>
              <Ionicons name="wifi-off" size={64} color={COLORS.textSecondary} />
              <Text style={styles.title}>Network seems to be having issues</Text>
              <Text style={styles.subtitle}>Please try again later</Text>
              <TouchableOpacity style={styles.retryButton} onPress={this.handleRetry}>
                <Ionicons name="refresh" size={20} color={COLORS.surface} />
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      }

      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <Ionicons name="alert-circle" size={64} color={COLORS.error} />
            <Text style={styles.title}>App encountered a problem</Text>
            <Text style={styles.subtitle}>Please restart the app</Text>
            <TouchableOpacity style={styles.retryButton} onPress={this.handleRetry}>
              <Ionicons name="refresh" size={20} color={COLORS.surface} />
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

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
  },
  retryButtonText: {
    color: COLORS.surface,
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.medium,
    marginLeft: SIZES.sm,
  },
});

export default ErrorBoundary;