import React, { Component } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, SIZES, FONTS, SHADOWS } from '../utils/constants';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console and save error info
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <View style={styles.container}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
            <Text style={styles.errorMessage}>
              The app encountered an unexpected error. Please try again.
            </Text>

            {__DEV__ && this.state.error && (
              <View style={styles.debugInfo}>
                <Text style={styles.debugTitle}>Error Details (Debug Mode):</Text>
                <Text style={styles.errorText}>
                  {this.state.error.toString()}
                </Text>
                {this.state.errorInfo && (
                  <Text style={styles.errorText}>
                    {this.state.errorInfo.componentStack}
                  </Text>
                )}
              </View>
            )}

            <TouchableOpacity style={styles.retryButton} onPress={this.handleRetry}>
              <Text style={styles.retryButtonText}>Try Again</Text>
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
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.lg,
  },
  errorContainer: {
    backgroundColor: COLORS.surface,
    padding: SIZES.xl,
    borderRadius: SIZES.md,
    alignItems: 'center',
    maxWidth: 400,
    ...SHADOWS.lg,
  },
  errorTitle: {
    fontSize: FONTS.sizes.xl,
    fontFamily: FONTS.bold,
    color: COLORS.error,
    marginBottom: SIZES.md,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: FONTS.sizes.md,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SIZES.lg,
    lineHeight: 22,
  },
  debugInfo: {
    width: '100%',
    backgroundColor: COLORS.background,
    padding: SIZES.md,
    borderRadius: SIZES.sm,
    marginBottom: SIZES.lg,
  },
  debugTitle: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginBottom: SIZES.sm,
  },
  errorText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    fontFamily: 'monospace',
    marginBottom: SIZES.xs,
  },
  retryButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: SIZES.xl,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.sm,
  },
  retryButtonText: {
    color: COLORS.surface,
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.medium,
  },
});

export default ErrorBoundary;