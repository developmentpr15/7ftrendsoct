/**
 * src/components/competitions/CompetitionEntryCard.tsx
 *
 * Card component for displaying competition entries
 * Supports voting, liking, and user interaction
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
import { CompetitionEntry } from '@/services/competitionsService';

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = (screenWidth - SIZES.lg * 3) / 2;

interface CompetitionEntryCardProps {
  entry: CompetitionEntry;
  onPress: () => void;
  onVote: () => void;
  showVoteButton?: boolean;
}

const CompetitionEntryCard: React.FC<CompetitionEntryCardProps> = ({
  entry,
  onPress,
  onVote,
  showVoteButton = false,
}) => {
  // Get status color
  const getStatusColor = () => {
    switch (entry.status) {
      case 'featured':
        return { color: COLORS.accent, bgColor: COLORS.accent + '20', text: 'Featured' };
      case 'approved':
        return { color: COLORS.success, bgColor: COLORS.success + '20', text: 'Approved' };
      case 'submitted':
        return { color: COLORS.primary, bgColor: COLORS.primary + '20', text: 'Submitted' };
      default:
        return { color: COLORS.textSecondary, bgColor: COLORS.background, text: entry.status };
    }
  };

  const statusInfo = getStatusColor();

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* Entry Image */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: entry.image_url }}
          style={styles.entryImage}
          resizeMode="cover"
        />

        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: statusInfo.bgColor }]}>
          <Text style={[styles.statusText, { color: statusInfo.color }]}>
            {statusInfo.text}
          </Text>
        </View>

        {/* Placement Badge (if applicable) */}
        {entry.final_placement && entry.final_placement <= 3 && (
          <View style={styles.placementBadge}>
            <MaterialIcons
              name="emoji-events"
              size={12}
              color={COLORS.accent}
            />
            <Text style={styles.placementText}>#{entry.final_placement}</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>
          {entry.title}
        </Text>

        {/* Username */}
        {entry.username && (
          <Text style={styles.username} numberOfLines={1}>
            by {entry.username}
          </Text>
        )}

        {/* Description */}
        {entry.description && (
          <Text style={styles.description} numberOfLines={2}>
            {entry.description}
          </Text>
        )}

        {/* Tags */}
        {entry.tags && entry.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {entry.tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
            {entry.tags.length > 3 && (
              <Text style={styles.moreTagsText}>+{entry.tags.length - 3}</Text>
            )}
          </View>
        )}

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <AntDesign
              name={entry.user_liked ? "heart" : "hearto"}
              size={14}
              color={entry.user_liked ? COLORS.primary : COLORS.textSecondary}
            />
            <Text style={styles.statText}>{entry.likes}</Text>
          </View>

          {showVoteButton && (
            <TouchableOpacity
              style={styles.voteButton}
              onPress={onVote}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                style={styles.voteButtonGradient}
              >
                <AntDesign name="heart" size={12} color="white" />
                <Text style={styles.voteButtonText}>Vote</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          <View style={styles.statItem}>
            <MaterialIcons name="schedule" size={14} color={COLORS.textSecondary} />
            <Text style={styles.statText}>
              {new Date(entry.submitted_at).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Points Awarded */}
        {entry.final_points_awarded && entry.final_points_awarded > 0 && (
          <View style={styles.pointsContainer}>
            <LinearGradient
              colors={[COLORS.success, COLORS.success + 'CC']}
              style={styles.pointsBadge}
            >
              <MaterialIcons name="stars" size={12} color="white" />
              <Text style={styles.pointsText}>
                +{entry.final_points_awarded} pts
              </Text>
            </LinearGradient>
          </View>
        )}
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
    height: 200,
    position: 'relative',
  },
  entryImage: {
    width: '100%',
    height: '100%',
  },
  statusBadge: {
    position: 'absolute',
    top: SIZES.sm,
    left: SIZES.sm,
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.radius.full,
  },
  statusText: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.semibold,
  },
  placementBadge: {
    position: 'absolute',
    top: SIZES.sm,
    right: SIZES.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.radius.full,
    gap: SIZES.xs,
    ...StyleHelpers.createShadow(COLORS.shadow, 2),
  },
  placementText: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.bold,
    color: COLORS.accent,
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
  username: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.medium,
    color: COLORS.textSecondary,
    marginBottom: SIZES.sm,
  },
  description: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.families.primary,
    color: COLORS.textSecondary,
    marginBottom: SIZES.sm,
    lineHeight: FONTS.lineHeight.relaxed,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.xs,
    marginBottom: SIZES.sm,
  },
  tag: {
    backgroundColor: COLORS.background,
    paddingHorizontal: SIZES.xs,
    paddingVertical: 2,
    borderRadius: SIZES.radius.sm,
  },
  tagText: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.medium,
    color: COLORS.textSecondary,
  },
  moreTagsText: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.medium,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
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
  voteButton: {
    borderRadius: SIZES.radius.sm,
    overflow: 'hidden',
    ...StyleHelpers.createShadow(COLORS.primary, 1),
  },
  voteButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.xs,
    gap: SIZES.xs,
  },
  voteButtonText: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.semibold,
    color: 'white',
  },
  pointsContainer: {
    alignSelf: 'flex-start',
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.radius.sm,
    gap: SIZES.xs,
  },
  pointsText: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.semibold,
    color: 'white',
  },
});

export default CompetitionEntryCard;