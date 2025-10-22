/**
 * src/examples/CompetitionsExample.tsx
 *
 * Complete example demonstrating the competitions system integration
 * Shows how to use all competition components together
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AntDesign } from '@expo/vector-icons';

import { COLORS, SIZES, FONTS } from '@/utils/constants';
import CompetitionsScreen from '@/components/competitions/CompetitionsScreen';

const CompetitionsExample: React.FC = () => {
  const [showCompetitions, setShowCompetitions] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>7FTrends</Text>
          <Text style={styles.headerSubtitle}>Fashion Competitions</Text>
        </View>
      </LinearGradient>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>
            Compete & Win
          </Text>
          <Text style={styles.heroSubtitle}>
            Enter fashion competitions, showcase your style, and win amazing prizes
          </Text>
          <Text style={styles.heroDescription}>
            Join our global fashion community where style meets competition.
            Create stunning outfits, get votes from the community, and climb the leaderboards.
          </Text>

          {/* Features */}
          <View style={styles.featuresContainer}>
            <View style={styles.feature}>
              <View style={styles.featureIcon}>
                <AntDesign name="trophy" size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.featureTitle}>Win Prizes</Text>
              <Text style={styles.featureText}>
                Points, rewards, and recognition
              </Text>
            </View>

            <View style={styles.feature}>
              <View style={styles.featureIcon}>
                <AntDesign name="hearto" size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.featureTitle}>Get Votes</Text>
              <Text style={styles.featureText}>
                Community-driven voting system
              </Text>
            </View>

            <View style={styles.feature}>
              <View style={styles.featureIcon}>
                <AntDesign name="camera" size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.featureTitle}>Virtual Try-On</Text>
              <Text style={styles.featureText}>
                AI-powered outfit creation
              </Text>
            </View>
          </View>

          {/* CTA Button */}
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => setShowCompetitions(true)}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDark]}
              style={styles.ctaButtonGradient}
            >
              <AntDesign name="trophy" size={24} color="white" />
              <Text style={styles.ctaButtonText}>
                Browse Competitions
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Additional Options */}
          <View style={styles.additionalOptions}>
            <TouchableOpacity style={styles.optionButton}>
              <Text style={styles.optionText}>How It Works</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionButton}>
              <Text style={styles.optionText}>Past Winners</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionButton}>
              <Text style={styles.optionText}>Create Competition</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity Section */}
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Trending Now</Text>
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderText}>
              Recent competition activity will appear here
            </Text>
          </View>
        </View>
      </View>

      {/* Competitions Modal */}
      <CompetitionsScreen
        visible={showCompetitions}
        onClose={() => setShowCompetitions(false)}
        onCompetitionPress={(competition) => {
          console.log('Competition pressed:', competition.title);
        }}
        onEntryPress={(entry) => {
          console.log('Entry pressed:', entry.title);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.xl,
    borderBottomLeftRadius: SIZES.radius.xl,
    borderBottomRightRadius: SIZES.radius.xl,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONTS.sizes.xxl,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.bold,
    color: 'white',
    marginBottom: SIZES.xs,
  },
  headerSubtitle: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.families.primary,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    flex: 1,
  },
  heroSection: {
    padding: SIZES.lg,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: FONTS.sizes.xxxl,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SIZES.sm,
  },
  heroSubtitle: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: SIZES.md,
  },
  heroDescription: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.families.primary,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: FONTS.lineHeight.relaxed,
    marginBottom: SIZES.xl,
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.xl,
    gap: SIZES.md,
  },
  feature: {
    flex: 1,
    alignItems: 'center',
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  featureTitle: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SIZES.xs,
  },
  featureText: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONTS.families.primary,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: FONTS.lineHeight.relaxed,
  },
  ctaButton: {
    width: '100%',
    height: 56,
    borderRadius: SIZES.radius.lg,
    overflow: 'hidden',
    marginBottom: SIZES.lg,
  },
  ctaButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SIZES.sm,
  },
  ctaButtonText: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.bold,
    color: 'white',
  },
  additionalOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  optionButton: {
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
  },
  optionText: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.medium,
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
  recentSection: {
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text,
    marginBottom: SIZES.md,
  },
  placeholderContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius.lg,
    padding: SIZES.xl,
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.families.primary,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

export default CompetitionsExample;