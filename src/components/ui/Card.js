import React from 'react';
import {
  View,
  TouchableOpacity,
  ViewStyle,
  StyleSheet,
} from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../../utils/constants';

const Card = ({
  children,
  style,
  onPress,
  padding = SIZES.md,
  margin = 0,
  shadow = 'md',
  borderRadius = SIZES.sm,
  backgroundColor = COLORS.surface,
}) => {
  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      backgroundColor,
      borderRadius,
      padding,
      margin,
    };

    // Add shadow if specified
    if (shadow && SHADOWS[shadow]) {
      Object.assign(baseStyle, SHADOWS[shadow]);
    }

    return {
      ...baseStyle,
      ...style,
    };
  };

  if (onPress) {
    return (
      <TouchableOpacity
        style={getCardStyle()}
        onPress={onPress}
        activeOpacity={0.8}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={getCardStyle()}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  // Additional styles if needed
});

export default Card;