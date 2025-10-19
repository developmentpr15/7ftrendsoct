import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../utils/constants';

const OnboardingScreen = ({ navigation }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      id: 1,
      title: 'Discover Fashion',
      description: 'Explore the latest trends and connect with fashion enthusiasts worldwide',
      emoji: '👗',
    },
    {
      id: 2,
      title: 'Build Your Wardrobe',
      description: 'Organize your closet digitally and get outfit recommendations',
      emoji: '🚪',
    },
    {
      id: 3,
      title: 'Try On Virtually',
      description: 'Use AR technology to see how clothes look before you buy',
      emoji: '📱',
    },
    {
      id: 4,
      title: 'Join Challenges',
      description: 'Participate in fashion competitions and showcase your style',
      emoji: '🏆',
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      navigation.replace('Auth');
    }
  };

  const handleSkip = () => {
    navigation.replace('Auth');
  };

  const currentStepData = steps[currentStep];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {/* Skip Button */}
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>

          {/* Emoji */}
          <View style={styles.emojiContainer}>
            <Text style={styles.emoji}>{currentStepData.emoji}</Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>{currentStepData.title}</Text>

          {/* Description */}
          <Text style={styles.description}>{currentStepData.description}</Text>

          {/* Dots Indicator */}
          <View style={styles.dotsContainer}>
            {steps.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  index === currentStep && styles.dotActive,
                ]}
              />
            ))}
          </View>

          {/* Next Button */}
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>
              {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipButton: {
    position: 'absolute',
    top: SIZES.lg,
    right: SIZES.lg,
    padding: SIZES.sm,
  },
  skipText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.medium,
  },
  emojiContainer: {
    marginBottom: SIZES.xl,
  },
  emoji: {
    fontSize: 100,
    textAlign: 'center',
  },
  title: {
    fontSize: FONTS.sizes.xxl,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SIZES.md,
  },
  description: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SIZES.xl,
    paddingHorizontal: SIZES.md,
  },
  dotsContainer: {
    flexDirection: 'row',
    marginBottom: SIZES.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: COLORS.accent,
    width: 24,
  },
  nextButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: SIZES.xxl,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.sm,
    ...SHADOWS.md,
  },
  nextButtonText: {
    color: COLORS.surface,
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.bold,
  },
});

export default OnboardingScreen;