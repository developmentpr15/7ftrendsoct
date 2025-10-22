/**
 * src/examples/CompetitionScreenExample.tsx
 *
 * Complete example demonstrating the CompetitionScreen usage
 * Shows how to integrate with navigation and handle callbacks
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Modal,
  Image,
  TextInput,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AntDesign } from '@expo/vector-icons';

import { COLORS, SIZES, FONTS, StyleHelpers } from '@/utils/constants';
import CompetitionScreen from '@/components/competitions/CompetitionScreen';
import CompetitionDetailModal from '@/components/competitions/CompetitionDetailModal';
import { Competition, CompetitionEntry } from '@/services/competitionsService';

const CompetitionScreenExample: React.FC = () => {
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null);
  const [showAllEntries, setShowAllEntries] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<CompetitionEntry | null>(null);

  // Mock competition data (in a real app, this would come from the service)
  const mockCompetitions: Competition[] = [
    {
      id: 'comp-1',
      country: 'US',
      title: 'Summer Fashion Challenge 2024',
      theme: 'Street Style Revolution',
      description: 'Showcase your best summer street style outfits and win amazing prizes from top fashion brands.',
      banner_image_url: 'https://picsum.photos/seed/summer-fashion/400/200',
      prize_pool: {
        points: 5000,
        rewards: ['$1000 Fashion Gift Card', 'Feature in Vogue', 'Brand Ambassador Program'],
        sponsor: 'Luxury Fashion House',
        sponsor_logo: 'https://picsum.photos/seed/sponsor/100/50',
      },
      max_entries: 500,
      start_at: '2024-06-01T00:00:00Z',
      end_at: '2024-06-30T23:59:59Z',
      voting_start_at: '2024-06-25T00:00:00Z',
      voting_end_at: '2024-07-07T23:59:59Z',
      status: 'active',
      judge_panel: [],
      created_by: 'admin',
      created_at: '2024-05-15T10:00:00Z',
      updated_at: '2024-05-15T10:00:00Z',
      entries_count: 234,
      user_entered: true,
    },
    {
      id: 'comp-2',
      country: 'UK',
      title: 'London Fashion Week Entry',
      theme: 'High Fashion Elegance',
      description: 'Create runway-inspired looks inspired by London Fashion Week trends and haute couture.',
      banner_image_url: 'https://picsum.photos/seed/london-fashion/400/200',
      prize_pool: {
        points: 7500,
        rewards: ['Designer Internship', 'Fashion Week Tickets', 'Magazine Feature'],
        sponsor: 'British Fashion Council',
        sponsor_logo: 'https://picsum.photos/seed/bfc/100/50',
      },
      max_entries: 250,
      start_at: '2024-07-01T00:00:00Z',
      end_at: '2024-07-31T23:59:59Z',
      voting_start_at: '2024-07-25T00:00:00Z',
      voting_end_at: '2024-08-07T23:59:59Z',
      status: 'active',
      judge_panel: [],
      created_by: 'admin',
      created_at: '2024-05-20T14:00:00Z',
      updated_at: '2024-05-20T14:00:00Z',
      entries_count: 189,
      user_entered: false,
    },
    {
      id: 'comp-3',
      country: 'FR',
      title: 'Paris Fashion Street Style',
      theme: 'Parisian Chic',
      description: 'Channel your inner Parisian chic with sophisticated street style combinations.',
      banner_image_url: 'https://picsum.photos/seed/paris-fashion/400/200',
      prize_pool: {
        points: 3000,
        rewards: ['Paris Shopping Spree', 'Fashion Week Pass', 'Designer Meet & Greet'],
        sponsor: 'Paris Fashion House',
        sponsor_logo: 'https://picsum.photos/seed/paris/brand/100/50',
      },
      max_entries: 150,
      start_at: '2024-06-15T00:00:00Z',
      end_at: '2024-06-30T23:59:59Z',
      voting_start_at: '2024-06-25T00:00:00Z',
      voting_end_at: '2024-07-07T23:59:59Z',
      status: 'voting',
      judge_panel: [],
      created_by: 'admin',
      created_at: '2024-05-10T09:00:00Z',
      updated_at: '2024-05-10T09:00:00Z',
      entries_count: 167,
      user_entered: true,
    },
  ];

  // Mock top entries data
  const mockTopEntries: CompetitionEntry[] = [
    {
      id: 'entry-1',
      user_id: 'user-1',
      username: 'fashionista_pro',
      competition_id: 'comp-1',
      title: 'Summer Street Style Masterpiece',
      description: 'Perfect blend of casual comfort and high fashion.',
      image_url: 'https://picsum.photos/seed/outfit1/400/500',
      images: ['https://picsum.photos/seed/outfit1-1/200/300', 'https://picsum.photos/seed/outfit1-2/200/300'],
      tags: ['summer', 'street', 'trendy'],
      likes: 342,
      votes_count: 128,
      status: 'featured',
      final_placement: 1,
      final_points_awarded: 5000,
      submitted_at: '2024-06-02T14:30:00Z',
      created_at: '2024-06-02T14:30:00Z',
      updated_at: '2024-06-02T14:30:00Z',
    },
    {
      id: 'entry-2',
      user_id: 'user-2',
      username: 'style_guru',
      competition_id: 'comp-2',
      title: 'British Elegance Personified',
      description: 'Classic British style with modern sophistication.',
      image_url: 'https://picsum.photos/seed/outfit2/400/500',
      images: ['https://picsum.photos/seed/outfit2-1/200/300'],
      tags: ['british', 'elegant', 'sophisticated'],
      likes: 289,
      votes_count: 95,
      status: 'approved',
      final_placement: 2,
      final_points_awarded: 3750,
      submitted_at: '2024-07-05T16:20:00Z',
      created_at: '2024-07-05T16:20:00Z',
      updated_at: '2024-07-05T16:20:00Z',
    },
    {
      id: 'entry-3',
      user_id: 'user-3',
      username: 'paris_chic',
      competition_id: 'comp-3',
      title: 'Parisian Street Fashion',
      description: 'Effortless Parisian style captured in every detail.',
      image_url: 'https://picsum.photos/seed/outfit3/400/500',
      images: ['https://picsum.photos/seed/outfit3-1/200/300', 'https://picsum.photos/seed/outfit3-2/200/300'],
      tags: ['parisian', 'chic', 'elegant'],
      likes: 256,
      votes_count: 87,
      status: 'approved',
      final_placement: 3,
      final_points_awarded: 2250,
      submitted_at: '2024-06-20T11:45:00Z',
      created_at: '2024-06-20T11:45:00Z',
      updated_at: '2024-06-20T11:45:00Z',
    },
  ];

  // Handle competition press
  const handleCompetitionPress = useCallback((competition: Competition) => {
    setSelectedCompetition(competition);
    setShowDetailModal(true);
  }, []);

  // Handle entry press
  const handleEntryPress = useCallback((entry: CompetitionEntry) => {
    setSelectedEntry(entry);
    setShowAllEntries(true);
  }, []);

  // Handle see all top entries
  const handleSeeAllTopEntries = useCallback(() => {
    setShowAllEntries(true);
  }, []);

  // Handle competition creation
  const handleCreateCompetition = useCallback(() => {
    // TODO: Navigate to competition creation screen
    console.log('Create Competition pressed');
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.menuButton}>
            <AntDesign name="menu-fold" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>7FTrends</Text>
            <Text style={styles.headerSubtitle}>Fashion Competitions</Text>
          </View>
          <TouchableOpacity style={styles.menuButton}>
            <AntDesign name="bell" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Stats Bar */}
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{mockCompetitions.length}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {mockTopEntries.reduce((sum, entry) => sum + entry.likes, 0)}
            </Text>
            <Text style={styles.statLabel}>Likes</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {mockCompetitions.reduce((sum, comp) => sum + comp.entries_count, 0)}
            </Text>
            <Text style={styles.statLabel}>Entries</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Main Content */}
      <CompetitionScreen
        onCompetitionPress={handleCompetitionPress}
        onEntryPress={handleEntryPress}
      />

      {/* Competition Detail Modal */}
      <CompetitionDetailModal
        competition={selectedCompetition}
        visible={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedCompetition(null);
        }}
        onEntryPress={handleEntryPress}
      />

      {/* All Top Entries Modal */}
      <Modal
        visible={showAllEntries}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowAllEntries(false);
          setSelectedEntry(null);
        }}
      >
        <View style={styles.allEntriesModal}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowAllEntries(false)}
            >
              <AntDesign name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              Top Fashion Entries
            </Text>
            <View style={styles.headerRight} />
          </View>

          {/* Entry Details */}
          {selectedEntry && (
            <View style={styles.entryDetail}>
              <Image
                source={{ uri: selectedEntry.image_url }}
                style={styles.entryDetailImage}
                resizeMode="cover"
              />
              <View style={styles.entryDetailContent}>
                <Text style={styles.entryDetailTitle}>
                  {selectedEntry.title}
                </Text>
                <Text style={styles.entryDetailUsername}>
                  @{selectedEntry.username}
                </Text>
                {selectedEntry.description && (
                  <Text style={styles.entryDetailDescription}>
                    {selectedEntry.description}
                  </Text>
                )}
                <View style={styles.entryDetailStats}>
                  <View style={styles.detailStat}>
                    <AntDesign name="heart" size={16} color={COLORS.primary} />
                    <Text style={styles.detailStatText}>
                      {selectedEntry.likes.toLocaleString()} likes
                    </Text>
                  </View>
                  <View style={styles.detailStat}>
                    <AntDesign name="star" size={16} color={COLORS.accent} />
                    <Text style={styles.detailStatText}>
                      {selectedEntry.votes_count} votes
                    </Text>
                  </View>
                  <View style={styles.detailStat}>
                    <AntDesign name="trophy" size={16} color={COLORS.accent} />
                    <Text style={styles.detailStatText}>
                      #{selectedEntry.final_placement || 'N/A'}
                    </Text>
                  </View>
                </View>

                {selectedEntry.tags && (
                  <View style={styles.entryDetailTags}>
                    {selectedEntry.tags.map((tag, index) => (
                      <View key={index} style={styles.tag}>
                        <Text style={styles.tagText}>#{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Actions */}
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.actionButton}>
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                style={styles.actionButtonGradient}
              >
                <AntDesign name="share-alt" size={16} color="white" />
                <Text style={styles.actionButtonText}>Share Entry</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionButton, styles.secondaryActionButton]}>
              <AntDesign name="heart" size={16} color={COLORS.primary} />
              <Text style={styles.secondaryButtonText}>Like Entry</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleCreateCompetition}
      >
        <LinearGradient
          colors={[COLORS.accent, COLORS.accent + 'CC']}
          style={styles.fabGradient}
        >
          <AntDesign name="plus" size={24} color="white" />
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: SIZES.md,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.lg,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: FONTS.sizes.xl,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.black,
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
  },
  headerSubtitle: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.families.primary,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: SIZES.lg,
    paddingBottom: SIZES.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.bold,
    color: 'white',
  },
  statLabel: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONTS.families.primary,
    color: 'rgba(255, 255, 255, 0.7)',
    textTransform: 'capitalize',
  },
  fab: {
    position: 'absolute',
    bottom: SIZES.xl,
    right: SIZES.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    ...StyleHelpers.createShadow(COLORS.accent, 4),
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  allEntriesModal: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
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
  modalTitle: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text,
  },
  headerRight: {
    width: 40,
  },
  entryDetail: {
    margin: SIZES.lg,
    borderRadius: SIZES.radius.xl,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
    ...StyleHelpers.createShadow(COLORS.shadow, 3),
  },
  entryDetailImage: {
    width: '100%',
    height: 300,
  },
  entryDetailContent: {
    padding: SIZES.lg,
  },
  entryDetailTitle: {
    fontSize: FONTS.sizes.xl,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text,
    marginBottom: SIZES.sm,
  },
  entryDetailUsername: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.medium,
    color: COLORS.primary,
    marginBottom: SIZES.sm,
  },
  entryDetailDescription: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.families.primary,
    color: COLORS.textSecondary,
    lineHeight: FONTS.lineHeight.relaxed,
    marginBottom: SIZES.md,
  },
  entryDetailStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SIZES.md,
  },
  detailStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.xs,
  },
  detailStatText: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.medium,
    color: COLORS.text,
  },
  entryDetailTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.xs,
  },
  tag: {
    backgroundColor: COLORS.background,
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.radius.full,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  tagText: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.medium,
    color: COLORS.textSecondary,
  },
  modalActions: {
    flexDirection: 'row',
    padding: SIZES.lg,
    gap: SIZES.md,
    paddingBottom: SIZES.xl,
  },
  actionButton: {
    flex: 1,
    borderRadius: SIZES.radius.lg,
    overflow: 'hidden',
    ...StyleHelpers.createShadow(COLORS.primary, 3),
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.md,
    gap: SIZES.sm,
  },
  actionButtonText: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.semibold,
    color: 'white',
  },
  secondaryActionButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  secondaryButtonText: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.primary,
  },
});

export default CompetitionScreenExample;