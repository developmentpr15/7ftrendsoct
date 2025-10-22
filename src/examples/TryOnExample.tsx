/**
 * src/examples/TryOnExample.tsx
 *
 * Example implementation of TryOnScreen with Save to Feed functionality
 */

import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import TryOnScreen from '@/components/tryon/TryOnScreen';
import { feedService } from '@/services/feedService';
import { COLORS, SIZES, FONTS } from '@/utils/constants';

const TryOnExample: React.FC = () => {
  const [tryOnVisible, setTryOnVisible] = useState(false);

  // Save to feed function using the feed service
  const handleSaveToFeed = async (imageUrl: string, caption: string) => {
    try {
      const postId = await feedService.saveTryOnToFeed(imageUrl, caption, {
        source: 'virtual-try-on',
        savedAt: new Date().toISOString()
      });

      console.log('✅ Try-on saved to feed with ID:', postId);
      return Promise.resolve();
    } catch (error) {
      console.error('Save to feed failed:', error);
      throw error;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Virtual Try-On Demo</Text>
      <Text style={styles.subtitle}>
        Try on clothes from your wardrobe and share your looks
      </Text>

      <TouchableOpacity
        style={styles.tryOnButton}
        onPress={() => setTryOnVisible(true)}
      >
        <AntDesign name="camera" size={24} color="white" />
        <Text style={styles.tryOnButtonText}>Start Virtual Try-On</Text>
      </TouchableOpacity>

      <TryOnScreen
        visible={tryOnVisible}
        onClose={() => setTryOnVisible(false)}
        onSaveToFeed={handleSaveToFeed}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.lg,
  },
  title: {
    fontSize: FONTS.sizes.xl,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SIZES.sm,
  },
  subtitle: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.families.primary,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SIZES.xl,
    lineHeight: FONTS.lineHeight.relaxed,
  },
  tryOnButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.xl,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radius.lg,
    gap: SIZES.sm,
    ...StyleHelpers.createShadow(COLORS.primary, 3),
  },
  tryOnButtonText: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.semibold,
    color: 'white',
  },
});

export default TryOnExample;