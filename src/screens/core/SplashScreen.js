import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
} from 'react-native';
import { COLORS, SIZES, FONTS } from '../../utils/constants';

const SplashScreen = ({ navigation }) => {
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    const fadeIn = Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    });

    const timer = setTimeout(() => {
      fadeIn.start(() => {
        // Navigate to main app after animation
        setTimeout(() => {
          navigation.replace('Auth');
        }, 500);
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [fadeAnim, navigation]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>👗</Text>
        </View>
        <Text style={styles.brandName}>7Ftrends</Text>
        <Text style={styles.tagline}>Your Fashion Feed</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: SIZES.lg,
  },
  logo: {
    fontSize: 80,
    textAlign: 'center',
  },
  brandName: {
    fontSize: FONTS.sizes.xxxl,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginBottom: SIZES.sm,
  },
  tagline: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    fontFamily: FONTS.medium,
  },
});

export default SplashScreen;