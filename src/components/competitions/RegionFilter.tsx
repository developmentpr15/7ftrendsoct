/**
 * src/components/competitions/RegionFilter.tsx
 *
 * Regional filter component for competition browsing
 * Features smooth transitions and visual country indicators
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { COLORS, SIZES, FONTS } from '@/utils/constants';

interface Region {
  code: string;
  name: string;
  flag: string;
  competitionsCount?: number;
}

interface RegionFilterProps {
  regions: Region[];
  selectedRegion: string;
  onRegionChange: (region: string) => void;
}

const RegionFilter: React.FC<RegionFilterProps> = ({
  regions,
  selectedRegion,
  onRegionChange,
}) => {
  const [animatedValues] = useState<{ [key: string]: Animated.Value }>({});

  // Initialize animation values
  React.useEffect(() => {
    const newAnimatedValues: { [key: string]: Animated.Value } = {};
    regions.forEach(region => {
      newAnimatedValues[region.code] = new Animated.Value(
        selectedRegion === region.code ? 1 : 0
      );
    });
    Object.assign(animatedValues, newAnimatedValues);
  }, [regions, selectedRegion]);

  // Handle region selection with animation
  const handleRegionPress = useCallback((regionCode: string) => {
    if (regionCode === selectedRegion) return;

    // Animate out the previously selected region
    Object.entries(animatedValues).forEach(([code, value]) => {
      if (code === selectedRegion) {
        Animated.timing(value, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    });

    // Animate in the new selected region
    if (animatedValues[regionCode]) {
      Animated.timing(animatedValues[regionCode], {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }

    onRegionChange(regionCode);
  }, [selectedRegion, onRegionChange, animatedValues]);

  // Render region chip
  const renderRegionChip = (region: Region) => {
    const isSelected = selectedRegion === region.code;
    const animatedValue = animatedValues[region.code];

    return (
      <Animated.View
        style={[
          styles.regionChip,
          {
            backgroundColor: animatedValue?.interpolate({
              inputRange: [0, 1],
              outputRange: [COLORS.surface, COLORS.primary],
              extrapolate: 'clamp',
            }),
            borderColor: animatedValue?.interpolate({
              inputRange: [0, 1],
              outputRange: [COLORS.borderLight, COLORS.primary],
              extrapolate: 'clamp',
            }),
          },
        ]}
      >
        <TouchableOpacity
          style={styles.regionButton}
          onPress={() => handleRegionPress(region.code)}
          activeOpacity={0.8}
        >
          <View style={styles.regionContent}>
            <Text style={styles.regionFlag}>{region.flag}</Text>
            <Animated.Text
              style={[
                styles.regionName,
                {
                  color: animatedValue?.interpolate({
                    inputRange: [0, 1],
                    outputRange: [COLORS.text, 'white'],
                    extrapolate: 'clamp',
                  }),
                },
              ]}
            >
              {region.name}
            </Animated.Text>
            {region.competitionsCount !== undefined && (
              <Animated.View
                style={[
                  styles.competitionCount,
                  {
                    opacity: animatedValue?.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.7, 1],
                      extrapolate: 'clamp',
                    }),
                  },
                ]}
              >
                <Text
                  style={[
                    styles.competitionCountText,
                    {
                      color: animatedValue?.interpolate({
                        inputRange: [0, 1],
                        outputRange: [COLORS.textSecondary, 'white'],
                        extrapolate: 'clamp',
                      }),
                    },
                  ]}
                >
                  {region.competitionsCount}
                </Text>
              </Animated.View>
            )}
          </View>

          {/* Selection indicator */}
          {isSelected && (
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)']}
              style={styles.selectionIndicator}
            />
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.filterTitle}>Region</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {regions.map(region => (
          <View key={region.code}>
            {renderRegionChip(region)}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SIZES.sm,
  },
  filterTitle: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.semibold,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: SIZES.sm,
  },
  scrollContent: {
    paddingHorizontal: SIZES.lg,
    gap: SIZES.sm,
  },
  regionChip: {
    borderRadius: SIZES.radius.full,
    borderWidth: 1,
    overflow: 'hidden',
  },
  regionButton: {
    width: '100%',
    height: '100%',
  },
  regionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    gap: SIZES.sm,
  },
  regionFlag: {
    fontSize: 18,
  },
  regionName: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.semibold,
  },
  competitionCount: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  competitionCountText: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.bold,
  },
  selectionIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: SIZES.radius.full,
  },
});

export default RegionFilter;