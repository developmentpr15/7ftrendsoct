import React from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  NativeSyntheticEvent,
  TextInputFocusEventData,
} from 'react-native';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../utils/constants';

import { KeyboardTypeOptions } from 'react-native';

const Input = ({
  label,
  placeholder,
  value,
  onChangeText,
  onFocus,
  onBlur,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  autoCorrect = true,
  error,
  disabled = false,
  multiline = false,
  numberOfLines,
  style,
  inputStyle,
  labelStyle,
  errorStyle,
  leftIcon,
  rightIcon,
  placeholderTextColor,
}: {
  label?: string;
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  onFocus?: (e: any) => void;
  onBlur?: (e: any) => void;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  error?: string;
  disabled?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  errorStyle?: TextStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  placeholderTextColor?: string;
}) => {
  const [isFocused, setIsFocused] = React.useState(false);

  const handleFocus = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const getContainerStyle = (): ViewStyle => {
    return {
      marginBottom: SIZES.md,
    };
  };

  const getInputContainerStyle = (): ViewStyle => {
    return {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: COLORS.surface,
      borderWidth: 1,
      borderColor: error
        ? COLORS.error
        : isFocused
        ? COLORS.accent
        : COLORS.border,
      borderRadius: SIZES.sm,
      paddingHorizontal: SIZES.md,
      ...SHADOWS.sm,
    };
  };

  const getInputStyle = (): TextStyle => {
    return {
      flex: 1,
      fontSize: FONTS.sizes.md,
      fontFamily: FONTS.regular,
      color: COLORS.text,
      paddingVertical: multiline ? SIZES.sm : SIZES.md,
      minHeight: multiline ? (numberOfLines || 1) * 20 : 44,
    };
  };

  const getLabelStyle = (): TextStyle => {
    return {
      fontSize: FONTS.sizes.sm,
      fontFamily: FONTS.medium,
      color: error ? COLORS.error : COLORS.text,
      marginBottom: SIZES.xs,
      ...labelStyle,
    };
  };

  const getErrorStyle = (): TextStyle => {
    return {
      fontSize: FONTS.sizes.xs,
      fontFamily: FONTS.regular,
      color: COLORS.error,
      marginTop: SIZES.xs,
      ...errorStyle,
    };
  };

  return (
    <View style={getContainerStyle()}>
      {label && (
        <Text style={getLabelStyle()}>
          {label}
        </Text>
      )}

      <View style={getInputContainerStyle()}>
        {leftIcon && (
          <View style={{ marginRight: SIZES.sm }}>
            {leftIcon}
          </View>
        )}

        <TextInput
          style={[getInputStyle(), inputStyle]}
          placeholder={placeholder}
          placeholderTextColor={placeholderTextColor || COLORS.textSecondary}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          editable={!disabled}
          multiline={multiline}
          numberOfLines={numberOfLines}
        />

        {rightIcon && (
          <View style={{ marginLeft: SIZES.sm }}>
            {rightIcon}
          </View>
        )}
      </View>

      {error && (
        <Text style={getErrorStyle()}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  // Additional styles if needed
});

export default Input;