import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../utils/constants';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
  iconPosition = 'left',
}) => {
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: SIZES.sm,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: iconPosition === 'right' ? 'row-reverse' : 'row',
    };

    // Size styles
    const sizeStyles = {
      small: {
        paddingHorizontal: SIZES.md,
        paddingVertical: SIZES.sm,
        minHeight: 36,
      },
      medium: {
        paddingHorizontal: SIZES.lg,
        paddingVertical: SIZES.md,
        minHeight: 44,
      },
      large: {
        paddingHorizontal: SIZES.xl,
        paddingVertical: SIZES.lg,
        minHeight: 52,
      },
    };

    // Variant styles
    const variantStyles = {
      primary: {
        backgroundColor: COLORS.accent,
        ...SHADOWS.sm,
      },
      secondary: {
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: COLORS.accent,
      },
      ghost: {
        backgroundColor: 'transparent',
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      opacity: disabled || loading ? 0.6 : 1,
      ...style,
    };
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontFamily: FONTS.medium,
      textAlign: 'center',
    };

    const sizeStyles = {
      small: {
        fontSize: FONTS.sizes.sm,
      },
      medium: {
        fontSize: FONTS.sizes.md,
      },
      large: {
        fontSize: FONTS.sizes.lg,
      },
    };

    const variantStyles = {
      primary: {
        color: COLORS.surface,
      },
      secondary: {
        color: COLORS.text,
      },
      outline: {
        color: COLORS.accent,
      },
      ghost: {
        color: COLORS.accent,
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...textStyle,
    };
  };

  const renderContent = () => {
    if (loading) {
      return (
        <>
          <ActivityIndicator
            size="small"
            color={variant === 'primary' ? COLORS.surface : COLORS.accent}
          />
          <Text style={[getTextStyle(), { marginLeft: SIZES.sm }]}>
            {title}
          </Text>
        </>
      );
    }

    return (
      <>
        {icon && iconPosition === 'left' && (
          <View style={{ marginRight: SIZES.xs }}>
            {icon}
          </View>
        )}
        <Text style={getTextStyle()}>
          {title}
        </Text>
        {icon && iconPosition === 'right' && (
          <View style={{ marginLeft: SIZES.xs }}>
            {icon}
          </View>
        )}
      </>
    );
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Additional styles if needed
});

export default Button;