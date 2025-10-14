import React from 'react';
import {
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { COLORS, SIZES, FONTS } from '../../utils/constants';

const Loading = ({
  size = 'small',
  color = COLORS.accent,
  text,
  overlay = false,
  style,
}) => {
  const getContainerStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      alignItems: 'center',
      justifyContent: 'center',
      padding: SIZES.lg,
    };

    if (overlay) {
      return {
        ...baseStyle,
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1000,
      };
    }

    return {
      ...baseStyle,
      ...style,
    };
  };

  const getSize = () => {
    switch (size) {
      case 'small':
        return 'small';
      case 'large':
        return 'large';
      default:
        return 'small';
    }
  };

  return (
    <View style={getContainerStyle()}>
      <ActivityIndicator
        size={getSize()}
        color={color}
      />
      {text && (
        <Text style={styles.loadingText}>
          {text}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  loadingText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: SIZES.sm,
    fontFamily: FONTS.medium,
  },
});

export default Loading;