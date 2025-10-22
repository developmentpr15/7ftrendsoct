/**
 * src/components/competitions/CompetitionDetailModal.tsx
 *
 * Modal for displaying competition details and managing entries
 * Includes entry submission, viewing existing entries, and voting functionality
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AntDesign, MaterialIcons, Ionicons } from '@expo/vector-icons';

import { COLORS, SIZES, FONTS, StyleHelpers } from '@/utils/constants';
import { competitionsService, Competition, CompetitionEntry, CreateCompetitionEntryRequest } from '@/services/competitionsService';
import CompetitionEntryCard from './CompetitionEntryCard';
import SubmitEntryModal from './SubmitEntryModal';

const { width: screenWidth } = Dimensions.get('window');

interface CompetitionDetailModalProps {
  competition: Competition | null;
  visible: boolean;
  onClose: () => void;
  onEntryPress?: (entry: CompetitionEntry) => void;
}

const CompetitionDetailModal: React.FC<CompetitionDetailModalProps> = ({
  competition,
  visible,
  onClose,
  onEntryPress,
}) => {
  // State
  const [entries, setEntries] = useState<CompetitionEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [sortBy, setSortBy] = useState<'votes_count' | 'likes' | 'submitted_at'>('votes_count');
  const [canEnter, setCanEnter] = useState(true);
  const [enterReason, setEnterReason] = useState('');

  // Load competition entries
  const loadEntries = useCallback(async () => {
    if (!competition) return;

    try {
      setLoading(true);
      const response = await competitionsService.getCompetitionEntries(competition.id, {
        sortBy,
        limit: 50,
      });

      setEntries(response.entries);

      // Check if user can enter
      const eligibility = await competitionsService.canEnterCompetition(competition.id);
      setCanEnter(eligibility.can_enter);
      setEnterReason(eligibility.reason || '');
    } catch (error) {
      console.error('❌ Failed to load competition entries:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [competition, sortBy]);

  // Load entries when competition changes
  useEffect(() => {
    if (visible && competition) {
      loadEntries();
    }
  }, [visible, competition, loadEntries]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadEntries();
  }, [loadEntries]);

  // Handle entry submission
  const handleEntrySubmitted = useCallback(() => {
    setShowSubmitModal(false);
    loadEntries(); // Reload entries
  }, [loadEntries]);

  // Handle entry press
  const handleEntryPress = useCallback((entry: CompetitionEntry) => {
    onEntryPress?.(entry);
  }, [onEntryPress]);

  // Handle vote (placeholder for future voting implementation)
  const handleVote = useCallback(async (entry: CompetitionEntry) => {
    try {
      // TODO: Implement voting when voting system is ready
      Alert.alert(
        'Coming Soon',
        'Voting will be available when the competition enters voting phase.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('❌ Vote failed:', error);
    }
  }, []);

  // Render competition header
  const renderCompetitionHeader = () => {
    if (!competition) return null;

    return (
      <View style={styles.competitionHeader}>
        {/* Banner Image */}
        <View style={styles.bannerContainer}>
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
              <Ionicons name="trophy" size={48} color="white" />
            </LinearGradient>
          )}

          {/* Status Badge */}
          <View style={styles.statusContainer}>
            <View style={[
              styles.statusBadge,
              competition.status === 'active' && styles.activeStatus,
              competition.status === 'voting' && styles.votingStatus,
              competition.status === 'completed' && styles.completedStatus,
            ]}>
              <Text style={styles.statusText}>
                {competition.status.charAt(0).toUpperCase() + competition.status.slice(1)}
              </Text>
            </View>
          </View>
        </View>

        {/* Competition Info */}
        <View style={styles.competitionInfo}>
          <Text style={styles.competitionTitle}>{competition.title}</Text>

          {competition.theme && (
            <Text style={styles.competitionTheme}>{competition.theme}</Text>
          )}

          {competition.description && (
            <Text style={styles.competitionDescription}>
              {competition.description}
            </Text>
          )}

          {/* Prize Pool */}
          {competition.prize_pool && (
            <View style={styles.prizeContainer}>
              <LinearGradient
                colors={[COLORS.accent, COLORS.accent + 'CC']}
                style={styles.prizeBadge}
              >
                <MaterialIcons name="emoji-events" size={16} color="white" />
                <Text style={styles.prizeText}>
                  {competition.prize_pool.points ? `${competition.prize_pool.points} Points Prize Pool` : 'Prizes Available'}
                </Text>
              </LinearGradient>
            </View>
          )}

          {/* Competition Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Ionicons name="people" size={16} color={COLORS.textSecondary} />
              <Text style={styles.statText}>
                {competition.entries_count || 0} Entries
              </Text>
            </View>

            <View style={styles.statItem}>
              <MaterialIcons name="public" size={16} color={COLORS.textSecondary} />
              <Text style={styles.statText}>{competition.country}</Text>
            </View>

            <View style={styles.statItem}>
              <MaterialIcons name="schedule" size={16} color={COLORS.textSecondary} />
              <Text style={styles.statText}>
                Ends {new Date(competition.end_at).toLocaleDateString()}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {canEnter && competition.status === 'active' && (
              <TouchableOpacity
                style={styles.enterButton}
                onPress={() => setShowSubmitModal(true)}
              >
                <LinearGradient
                  colors={[COLORS.primary, COLORS.primaryDark]}
                  style={styles.enterButtonGradient}
                >
                  <AntDesign name="plus" size={16} color="white" />
                  <Text style={styles.enterButtonText}>Enter Competition</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {!canEnter && enterReason && (
              <View style={styles.cannotEnterContainer}>
                <MaterialIcons name="info" size={16} color={COLORS.textSecondary} />
                <Text style={styles.cannotEnterText}>{enterReason}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  // Render entries section
  const renderEntriesSection = () => {
    if (!competition) return null;

    return (
      <View style={styles.entriesSection}>
        <View style={styles.entriesHeader}>
          <Text style={styles.entriesTitle}>Competition Entries</Text>

          {/* Sort Options */}
          <View style={styles.sortContainer}>
            <Text style={styles.sortLabel}>Sort by:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.sortOptions}>
                {[
                  { key: 'votes_count', label: 'Most Votes' },
                  { key: 'likes', label: 'Most Liked' },
                  { key: 'submitted_at', label: 'Latest' },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.sortChip,
                      sortBy === option.key && styles.selectedSortChip,
                    ]}
                    onPress={() => setSortBy(option.key as any)}
                  >
                    <Text style={[
                      styles.sortChipText,
                      sortBy === option.key && styles.selectedSortChipText,
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading entries...</Text>
          </View>
        ) : entries.length > 0 ? (
          <View style={styles.entriesGrid}>
            {entries.map((entry) => (
              <CompetitionEntryCard
                key={entry.id}
                entry={entry}
                onPress={() => handleEntryPress(entry)}
                onVote={() => handleVote(entry)}
                showVoteButton={competition.status === 'voting'}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyEntriesContainer}>
            <Ionicons name="images-outline" size={48} color={COLORS.textSecondary} />
            <Text style={styles.emptyEntriesTitle}>No Entries Yet</Text>
            <Text style={styles.emptyEntriesText}>
              Be the first to enter this competition!
            </Text>
            {canEnter && competition.status === 'active' && (
              <TouchableOpacity
                style={styles.beFirstButton}
                onPress={() => setShowSubmitModal(true)}
              >
                <Text style={styles.beFirstButtonText}>Be First to Enter</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  if (!competition) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <AntDesign name="close" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Competition Details</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Content */}
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
        >
          {renderCompetitionHeader()}
          {renderEntriesSection()}

          {/* Rules Section */}
          {competition.rules && (
            <View style={styles.rulesSection}>
              <Text style={styles.rulesTitle}>Rules & Guidelines</Text>
              <Text style={styles.rulesText}>{competition.rules}</Text>
            </View>
          )}
        </ScrollView>

        {/* Submit Entry Modal */}
        <SubmitEntryModal
          visible={showSubmitModal}
          onClose={() => setShowSubmitModal(false)}
          competition={competition}
          onSuccess={handleEntrySubmitted}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  competitionHeader: {
    marginBottom: SIZES.lg,
  },
  bannerContainer: {
    width: '100%',
    height: 200,
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
  statusContainer: {
    position: 'absolute',
    top: SIZES.md,
    right: SIZES.md,
  },
  statusBadge: {
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.radius.full,
  },
  activeStatus: {
    backgroundColor: COLORS.success + '20',
  },
  votingStatus: {
    backgroundColor: COLORS.primary + '20',
  },
  completedStatus: {
    backgroundColor: COLORS.accent + '20',
  },
  statusText: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.semibold,
  },
  competitionInfo: {
    padding: SIZES.lg,
  },
  competitionTitle: {
    fontSize: FONTS.sizes.xl,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text,
    marginBottom: SIZES.sm,
  },
  competitionTheme: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.primary,
    marginBottom: SIZES.sm,
  },
  competitionDescription: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.families.primary,
    color: COLORS.textSecondary,
    lineHeight: FONTS.lineHeight.relaxed,
    marginBottom: SIZES.lg,
  },
  prizeContainer: {
    marginBottom: SIZES.lg,
  },
  prizeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.radius.md,
    gap: SIZES.sm,
  },
  prizeText: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.semibold,
    color: 'white',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.md,
    marginBottom: SIZES.lg,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.xs,
  },
  statText: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.families.primary,
    color: COLORS.textSecondary,
  },
  actionButtons: {
    gap: SIZES.md,
  },
  enterButton: {
    borderRadius: SIZES.radius.lg,
    overflow: 'hidden',
    ...StyleHelpers.createShadow(COLORS.primary, 3),
  },
  enterButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.md,
    paddingHorizontal: SIZES.lg,
    gap: SIZES.sm,
  },
  enterButtonText: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.bold,
    color: 'white',
  },
  cannotEnterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.radius.md,
    gap: SIZES.sm,
  },
  cannotEnterText: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.families.primary,
    color: COLORS.textSecondary,
    flex: 1,
  },
  entriesSection: {
    paddingHorizontal: SIZES.lg,
    marginBottom: SIZES.lg,
  },
  entriesHeader: {
    marginBottom: SIZES.md,
  },
  entriesTitle: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text,
    marginBottom: SIZES.sm,
  },
  sortContainer: {
    gap: SIZES.sm,
  },
  sortLabel: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.text,
  },
  sortOptions: {
    flexDirection: 'row',
    gap: SIZES.sm,
  },
  sortChip: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.radius.full,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  selectedSortChip: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  sortChipText: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.medium,
    color: COLORS.textSecondary,
  },
  selectedSortChipText: {
    color: 'white',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SIZES.xl,
  },
  loadingText: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.families.primary,
    color: COLORS.textSecondary,
    marginTop: SIZES.sm,
  },
  entriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.md,
    paddingBottom: SIZES.lg,
  },
  emptyEntriesContainer: {
    alignItems: 'center',
    paddingVertical: SIZES.xl,
  },
  emptyEntriesTitle: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text,
    marginTop: SIZES.md,
    marginBottom: SIZES.sm,
  },
  emptyEntriesText: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.families.primary,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SIZES.lg,
  },
  beFirstButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radius.md,
    ...StyleHelpers.createShadow(COLORS.primary, 2),
  },
  beFirstButtonText: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.semibold,
    color: 'white',
  },
  rulesSection: {
    paddingHorizontal: SIZES.lg,
    paddingBottom: SIZES.xl,
  },
  rulesTitle: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text,
    marginBottom: SIZES.sm,
  },
  rulesText: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.families.primary,
    color: COLORS.textSecondary,
    lineHeight: FONTS.lineHeight.relaxed,
    backgroundColor: COLORS.surface,
    padding: SIZES.md,
    borderRadius: SIZES.radius.md,
  },
});

export default CompetitionDetailModal;