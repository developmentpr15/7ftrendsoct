/**
 * src/components/competitions/CompetitionCard.tsx
 *
 * Competition card component displaying competition information
 * Luxury themed with proper status indicators and entry counts
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AntDesign, MaterialIcons, Ionicons } from '@expo/vector-icons';

import { COLORS, SIZES, FONTS, StyleHelpers } from '@/utils/constants';
import { Competition } from '@/services/competitionsService';

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = (screenWidth - SIZES.lg * 3) / 2;

interface CompetitionCardProps {
  competition: Competition;
  onPress: () => void;
  onEntryPress?: (entryId: string) => void;
}

const CompetitionCard: React.FC<CompetitionCardProps> = ({
  competition,
  onPress,
  onEntryPress,
}) => {
  // Calculate time remaining
  const getTimeRemaining = () => {
    const endTime = new Date(competition.end_at);
    const now = new Date();
    const diff = endTime.getTime() - now.getTime();

    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h left`;
    return 'Ends soon';
  };

  // Get status color and icon
  const getStatusInfo = () => {
    switch (competition.status) {
      case 'active':
        return {
          color: COLORS.success,
          bgColor: COLORS.success + '20',
          icon: 'trophy',
          text: 'Active',
        };
      case 'voting':
        return {
          color: COLORS.primary,
          bgColor: COLORS.primary + '20',
          icon: 'hearto',
          text: 'Voting',
        };
      case 'completed':
        return {
          color: COLORS.accent,
          bgColor: COLORS.accent + '20',
          icon: 'checkcircle',
          text: 'Completed',
        };
      default:
        return {
          color: COLORS.textSecondary,
          bgColor: COLORS.background,
          icon: 'clockcircle',
          text: 'Draft',
        };
    }
  };

  const statusInfo = getStatusInfo();
  const timeRemaining = getTimeRemaining();

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* Banner Image */}
      <View style={styles.imageContainer}>
        {competition.banner_image_url ? (
          <Image
            source={{ uri: competition.banner_image_url }}
            style={styles.bannerImage}
            resizeMode="cover"
          />
        ) : (
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryDark]}
            style={styles.defaultBanner}
          >
            <Ionicons name="trophy" size={32} color="white" />
          </LinearGradient>
        )}

        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: statusInfo.bgColor }]}>
          <AntDesign
            name={statusInfo.icon as any}
            size={12}
            color={statusInfo.color}
          />
          <Text style={[styles.statusText, { color: statusInfo.color }]}>
            {statusInfo.text}
          </Text>
        </View>

        {/* Time Remaining */}
        <View style={styles.timeContainer}>
          <MaterialIcons name="schedule" size={12} color="white" />
          <Text style={styles.timeText}>{timeRemaining}</Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>
          {competition.title}
        </Text>

        {/* Theme */}
        {competition.theme && (
          <Text style={styles.theme} numberOfLines={1}>
            {competition.theme}
          </Text>
        )}

        {/* Description */}
        {competition.description && (
          <Text style={styles.description} numberOfLines={2}>
            {competition.description}
          </Text>
        )}

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Ionicons name="people" size={14} color={COLORS.textSecondary} />
            <Text style={styles.statText}>
              {competition.entries_count || 0} entries
            </Text>
          </View>

          {competition.user_entered && (
            <View style={styles.enteredBadge}>
              <AntDesign name="checkcircle" size={12} color={COLORS.success} />
              <Text style={styles.enteredText}>Entered</Text>
            </View>
          )}
        </View>

        {/* Prize Info */}
        {competition.prize_pool && (
          <View style={styles.prizeContainer}>
            <LinearGradient
              colors={[COLORS.accent, COLORS.accent + 'CC']}
              style={styles.prizeBadge}
            >
              <MaterialIcons name="emoji-events" size={12} color="white" />
              <Text style={styles.prizeText}>
                {competition.prize_pool.points ? `${competition.prize_pool.points} pts` : 'Prizes'}
              </Text>
            </LinearGradient>
          </View>
        )}

        {/* Country Flag */}
        <View style={styles.countryContainer}>
          <Text style={styles.countryText}>{competition.country}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: cardWidth,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius.lg,
    marginBottom: SIZES.md,
    overflow: 'hidden',
    ...StyleHelpers.createShadow(COLORS.shadow, 2),
  },
  imageContainer: {
    height: 120,
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  defaultBanner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    position: 'absolute',
    top: SIZES.sm,
    left: SIZES.sm,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.radius.full,
    gap: SIZES.xs,
  },
  statusText: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.semibold,
  },
  timeContainer: {
    position: 'absolute',
    top: SIZES.sm,
    right: SIZES.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.radius.full,
    gap: SIZES.xs,
  },
  timeText: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.medium,
    color: 'white',
  },
  content: {
    padding: SIZES.md,
    flexGrow: 1,
  },
  title: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text,
    marginBottom: SIZES.xs,
    lineHeight: FONTS.lineHeight.tight,
  },
  theme: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.medium,
    color: COLORS.primary,
    marginBottom: SIZES.xs,
  },
  description: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.families.primary,
    color: COLORS.textSecondary,
    marginBottom: SIZES.sm,
    lineHeight: FONTS.lineHeight.relaxed,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SIZES.sm,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.xs,
  },
  statText: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONTS.families.primary,
    color: COLORS.textSecondary,
  },
  enteredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success + '20',
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.radius.full,
    gap: SIZES.xs,
  },
  enteredText: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.success,
  },
  prizeContainer: {
    marginBottom: SIZES.sm,
  },
  prizeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.radius.sm,
    gap: SIZES.xs,
  },
  prizeText: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.semibold,
    color: 'white',
  },
  countryContainer: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.background,
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.radius.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  countryText: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.medium,
    color: COLORS.textSecondary,
  },
});

export default CompetitionCard;