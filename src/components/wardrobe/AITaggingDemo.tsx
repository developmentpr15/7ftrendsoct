/**
 * AITaggingDemo.tsx
 *
 * Demo component showcasing the AI auto-tagging functionality
 * Can be integrated into the wardrobe screen
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import EnhancedImageUpload from './EnhancedImageUpload';
import { COLORS, SIZES, FONTS, StyleHelpers } from '@/utils/constants';

export const AITaggingDemo: React.FC = () => {
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [lastUploadedItemId, setLastUploadedItemId] = useState<string | null>(null);

  const handleUploadComplete = (itemId: string) => {
    setLastUploadedItemId(itemId);
    Alert.alert(
      'Upload Complete! 🎉',
      'Your wardrobe item has been uploaded and automatically tagged with AI.',
      [{ text: 'OK', style: 'default' }]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🤖 AI Auto-Tagging Demo</Text>
        <Text style={styles.subtitle}>
          Experience the power of Gemini 2.5 Pro for automatic wardrobe item categorization
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Feature Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✨ Features</Text>
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Text style={styles.featureEmoji}>🎨</Text>
              <Text style={styles.featureText}>Automatic color detection</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureEmoji}>👔</Text>
              <Text style={styles.featureText}>Smart category classification</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureEmoji}>🌟</Text>
              <Text style={styles.featureText}>Style analysis (casual, formal, etc.)</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureEmoji}>🧵</Text>
              <Text style={styles.featureText}>Material identification</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureEmoji}>📅</Text>
              <Text style={styles.featureText}>Occasion and season suggestions</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureEmoji}>🏷️</Text>
              <Text style={styles.featureText}>Descriptive auto-tagging</Text>
            </View>
          </View>
        </View>

        {/* How it Works */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔄 How It Works</Text>
          <View style={styles.stepList}>
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.stepText}>
                Upload or capture an image of your clothing item
              </Text>
            </View>
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepText}>
                Gemini 2.5 Pro analyzes the image using advanced vision AI
              </Text>
            </View>
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.stepText}>
                AI generates comprehensive tags and categorization
              </Text>
            </View>
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>4</Text>
              </View>
              <Text style={styles.stepText}>
                Data is saved to your wardrobe_items table for easy search and filtering
              </Text>
            </View>
          </View>
        </View>

        {/* Technical Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚙️ Technical Implementation</Text>
          <View style={styles.techDetails}>
            <View style={styles.techItem}>
              <Text style={styles.techLabel}>AI Model:</Text>
              <Text style={styles.techValue}>Gemini 2.5 Pro</Text>
            </View>
            <View style={styles.techItem}>
              <Text style={styles.techLabel}>Edge Function:</Text>
              <Text style={styles.techValue}>wardrobe-ai-tagging</Text>
            </View>
            <View style={styles.techItem}>
              <Text style={styles.techLabel}>Database Fields:</Text>
              <Text style={styles.techValue}>ai_tags, ai_category, ai_colors, etc.</Text>
            </View>
            <View style={styles.techItem}>
              <Text style={styles.techLabel}>Processing:</Text>
              <Text style={styles.techValue}>Asynchronous with progress tracking</Text>
            </View>
          </View>
        </View>

        {/* Database Schema Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Database Schema</Text>
          <View style={styles.schemaContainer}>
            <Text style={styles.schemaTitle}>wardrobe_items table - AI Fields:</Text>
            <View style={styles.schemaList}>
              <Text style={styles.schemaItem}>• ai_tags: TEXT[] - AI-generated descriptive tags</Text>
              <Text style={styles.schemaItem}>• ai_category: TEXT - AI-detected clothing category</Text>
              <Text style={styles.schemaItem}>• ai_colors: TEXT[] - AI-detected colors</Text>
              <Text style={styles.schemaItem}>• ai_occasions: TEXT[] - AI-suggested occasions</Text>
              <Text style={styles.schemaItem}>• ai_seasons: TEXT[] - AI-suggested seasons</Text>
              <Text style={styles.schemaItem}>• ai_style: TEXT - AI-detected style</Text>
              <Text style={styles.schemaItem}>• ai_materials: TEXT[] - AI-detected materials</Text>
              <Text style={styles.schemaItem}>• ai_confidence: DECIMAL - Confidence score (0-1)</Text>
              <Text style={styles.schemaItem}>• ai_status: TEXT - Processing status</Text>
              <Text style={styles.schemaItem}>• ai_processed_at: TIMESTAMP - Processing timestamp</Text>
            </View>
          </View>
        </View>

        {/* CTA Button */}
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => setUploadModalVisible(true)}
        >
          <Text style={styles.ctaButtonText}>
            🚀 Try AI Auto-Tagging Now
          </Text>
        </TouchableOpacity>

        {lastUploadedItemId && (
          <View style={styles.successMessage}>
            <Text style={styles.successText}>
              ✅ Successfully uploaded and tagged item ID: {lastUploadedItemId.slice(0, 8)}...
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Enhanced Upload Modal */}
      <EnhancedImageUpload
        visible={uploadModalVisible}
        onClose={() => setUploadModalVisible(false)}
        onUploadComplete={handleUploadComplete}
      />
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SIZES.lg,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: FONTS.sizes.xl,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text,
    marginBottom: SIZES.sm,
  },
  subtitle: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.families.primary,
    color: COLORS.textSecondary,
    lineHeight: FONTS.lineHeight.relaxed,
  },
  content: {
    flex: 1,
    padding: SIZES.lg,
  },
  section: {
    marginBottom: SIZES.xl,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.text,
    marginBottom: SIZES.md,
  },
  featureList: {
    gap: SIZES.sm,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.md,
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.md,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius.md,
    ...StyleHelpers.createShadow(COLORS.shadow, 1),
  },
  featureEmoji: {
    fontSize: FONTS.sizes.lg,
  },
  featureText: {
    flex: 1,
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.families.primary,
    color: COLORS.text,
  },
  stepList: {
    gap: SIZES.md,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SIZES.md,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.bold,
    color: COLORS.textOnPrimary,
  },
  stepText: {
    flex: 1,
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.families.primary,
    color: COLORS.text,
    lineHeight: FONTS.lineHeight.relaxed,
    paddingTop: 2,
  },
  techDetails: {
    gap: SIZES.sm,
  },
  techItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SIZES.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  techLabel: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.textSecondary,
    flex: 1,
  },
  techValue: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.families.primary,
    color: COLORS.text,
    flex: 2,
    textAlign: 'right',
  },
  schemaContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius.md,
    padding: SIZES.md,
    ...StyleHelpers.createShadow(COLORS.shadow, 1),
  },
  schemaTitle: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.textSecondary,
    marginBottom: SIZES.sm,
  },
  schemaList: {
    gap: SIZES.xs,
  },
  schemaItem: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONTS.families.primary,
    color: COLORS.text,
    lineHeight: FONTS.lineHeight.relaxed,
  },
  ctaButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius.md,
    paddingVertical: SIZES.lg,
    paddingHorizontal: SIZES.xl,
    alignItems: 'center',
    marginVertical: SIZES.lg,
    ...StyleHelpers.createShadow(COLORS.primary, 4),
  },
  ctaButtonText: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.textOnPrimary,
  },
  successMessage: {
    backgroundColor: COLORS.success + '20',
    borderRadius: SIZES.radius.md,
    padding: SIZES.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.success,
  },
  successText: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.families.primary,
    color: COLORS.success,
  },
});

export default AITaggingDemo;