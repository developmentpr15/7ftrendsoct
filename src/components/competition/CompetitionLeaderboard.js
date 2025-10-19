// Competition Leaderboard Component
// Country-filtered leaderboard with real-time updates and winner announcements

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { competitionVotingService } from '../../services/competitionVotingService';
import { useSessionStore } from '../../store/sessionStore';
import { COLORS, SIZES, FONTS } from '../../utils/constants';

const CompetitionLeaderboard = ({
  competitionId,
  competitionTitle,
  showCountryFilter = true,
  showGlobalToggle = true,
  style,
  onEntryPress,
  onWinnersAnnounced,
}) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [countryFilter, setCountryFilter] = useState(null);
  const [isGlobal, setIsGlobal] = useState(true);
  const [showCountrySelector, setShowCountrySelector] = useState(false);
  const [winners, setWinners] = useState([]);
  const [winnersAnnounced, setWinnersAnnounced] = useState(false);

  const { user } = useSessionStore();

  // Common countries list
  const countries = [
    { code: 'US', name: 'United States' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'CA', name: 'Canada' },
    { code: 'AU', name: 'Australia' },
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' },
    { code: 'IT', name: 'Italy' },
    { code: 'ES', name: 'Spain' },
    { code: 'JP', name: 'Japan' },
    { code: 'KR', name: 'South Korea' },
    { code: 'BR', name: 'Brazil' },
    { code: 'MX', name: 'Mexico' },
    { code: 'IN', name: 'India' },
    { code: 'CN', name: 'China' },
    { code: 'RU', name: 'Russia' },
  ];

  useEffect(() => {
    if (competitionId) {
      loadLeaderboard();
      checkWinnerAnnouncement();
    }
  }, [competitionId, countryFilter, isGlobal]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);

      const filter = isGlobal ? null : (countryFilter || user?.country || null);
      const data = await competitionVotingService.getLeaderboard(
        competitionId,
        filter,
        50
      );

      setLeaderboard(data);

      // Check if winners should be announced (6 hours after voting ends)
      const winnersData = await competitionVotingService.determineWinners(competitionId);
      if (winnersData.length > 0) {
        setWinners(winnersData);
        if (!winnersAnnounced) {
          setWinnersAnnounced(true);
          onWinnersAnnounced?.(winnersData);
        }
      }

    } catch (error) {
      console.error('Error loading leaderboard:', error);
      Alert.alert('Error', 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const checkWinnerAnnouncement = async () => {
    try {
      const winnersData = await competitionVotingService.determineWinners(competitionId);
      if (winnersData.length > 0) {
        setWinners(winnersData);
        setWinnersAnnounced(true);
        onWinnersAnnounced?.(winnersData);
      }
    } catch (error) {
      // Winners may not be determined yet, which is expected
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadLeaderboard();
    setRefreshing(false);
  }, [competitionId, countryFilter, isGlobal]);

  const handleCountrySelect = (country) => {
    setCountryFilter(country.code);
    setIsGlobal(false);
    setShowCountrySelector(false);
  };

  const handleGlobalToggle = () => {
    setIsGlobal(!isGlobal);
    if (!isGlobal) {
      setCountryFilter(null);
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Ionicons name="crown" size={20} color={COLORS.warning} />;
      case 2:
        return <Ionicons name="medal" size={18} color={COLORS.textSecondary} />;
      case 3:
        return <Ionicons name="ribbon" size={16} color={COLORS.accent} />;
      default:
        return (
          <Text style={[styles.rankNumber, { color: COLORS.textSecondary }]}>
            {rank}
          </Text>
        );
    }
  };

  const getRankStyle = (rank) => {
    switch (rank) {
      case 1:
        return styles.firstPlace;
      case 2:
        return styles.secondPlace;
      case 3:
        return styles.thirdPlace;
      default:
        return styles.regularPlace;
    }
  };

  const renderLeaderboardItem = ({ item, index }) => {
    const isCurrentUser = user && item.participant_id === user.id;

    return (
      <TouchableOpacity
        style={[
          styles.leaderboardItem,
          getRankStyle(item.rank),
          isCurrentUser && styles.currentUserItem,
        ]}
        onPress={() => onEntryPress?.(item)}
        activeOpacity={0.7}
      >
        <View style={styles.rankContainer}>
          {getRankIcon(item.rank)}
        </View>

        <View style={styles.participantInfo}>
          {item.participant_avatar_url ? (
            <Image
              source={{ uri: item.participant_avatar_url }}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, styles.defaultAvatar]}>
              <Text style={styles.defaultAvatarText}>
                {item.participant_username ? item.participant_username.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>
          )}
          <View style={styles.participantDetails}>
            <Text style={[styles.username, isCurrentUser && styles.currentUserText]}>
              {item.participant_username}
              {isCurrentUser && ' (You)'}
            </Text>
            <Text style={styles.entryTitle}>{item.entry_title}</Text>
          </View>
        </View>

        <View style={styles.voteInfo}>
          <Text style={styles.voteCount}>
            {item.votes_count.toLocaleString()}
          </Text>
          <Text style={styles.voteLabel}>votes</Text>
          {!isGlobal && (
            <Text style={styles.countryVotes}>
              {item.country_votes_count} local
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderWinnerCard = (winner, index) => {
    return (
      <View key={winner.entry_id} style={styles.winnerCard}>
        <View style={styles.winnerRank}>
          {winner.winner_type === 'grand_winner' && <Ionicons name="crown" size={24} color={COLORS.warning} />}
          {winner.winner_type === 'top_3' && <Ionicons name="medal" size={20} color={COLORS.accent} />}
          {winner.winner_type === 'top_10' && <Ionicons name="ribbon" size={18} color={COLORS.info} />}
        </View>

        <View style={styles.winnerInfo}>
          <Text style={styles.winnerTitle}>
            {winner.winner_type === 'grand_winner' && 'Grand Winner 🏆'}
            {winner.winner_type === 'top_3' && `Top 3 - Rank #${winner.final_rank} 🥈`}
            {winner.winner_type === 'top_10' && `Top 10 - Rank #${winner.final_rank} 🥉`}
          </Text>
          <Text style={styles.winnerName}>{winner.participant_username}</Text>
          <Text style={styles.winnerEntry}>{winner.entry_title}</Text>
          <View style={styles.winnerStats}>
            <Text style={styles.winnerVotes}>{winner.final_votes.toLocaleString()} votes</Text>
            {winner.points_awarded > 0 && (
              <Text style={styles.winnerPoints}>+{winner.points_awarded} points</Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderCountrySelector = () => {
    return (
      <Modal
        visible={showCountrySelector}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCountrySelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country</Text>
              <TouchableOpacity onPress={() => setShowCountrySelector(false)}>
                <Ionicons name="close" size={20} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.globalOption}
              onPress={handleGlobalToggle}
            >
              <Ionicons name="globe-outline" size={16} color={COLORS.primary} />
              <Text style={styles.globalOptionText}>Global Leaderboard</Text>
            </TouchableOpacity>

            <FlatList
              data={countries}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.countryOption}
                  onPress={() => handleCountrySelect(item)}
                >
                  <Text style={styles.countryName}>{item.name}</Text>
                  <Text style={styles.countryCode}>{item.code}</Text>
                </TouchableOpacity>
              )}
              style={styles.countryList}
            />
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={[styles.container, style]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="trophy" size={20} color={COLORS.accent} />
          <Text style={styles.headerTitle}>Leaderboard</Text>
          {competitionTitle && (
            <Text style={styles.competitionTitle}>{competitionTitle}</Text>
          )}
        </View>

        <View style={styles.headerRight}>
          {showCountryFilter && (
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setShowCountrySelector(true)}
            >
              <Ionicons name="funnel" size={16} color={COLORS.primary} />
              <Text style={styles.filterButtonText}>
                {isGlobal ? 'Global' : (countryFilter || 'Local')}
              </Text>
              <Ionicons name="chevron-down" size={14} color={COLORS.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Winners Announcement */}
      {winners.length > 0 && winnersAnnounced && (
        <View style={styles.winnersSection}>
          <Text style={styles.winnersTitle}>🎉 Winners Announced!</Text>
          {winners.slice(0, 3).map((winner, index) => renderWinnerCard(winner, index))}
        </View>
      )}

      {/* Leaderboard List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading leaderboard...</Text>
        </View>
      ) : (
        <FlatList
          data={leaderboard}
          keyExtractor={(item) => item.entry_id}
          renderItem={renderLeaderboardItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.primary}
            />
          }
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Country Selector Modal */}
      {renderCountrySelector()}
    </View>
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
    padding: SIZES.md,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.sm,
  },
  headerTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  competitionTitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.xs,
    backgroundColor: `${COLORS.primary}10`,
    borderRadius: SIZES.sm,
    gap: SIZES.xs,
  },
  filterButtonText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
  winnersSection: {
    backgroundColor: `${COLORS.warning}10`,
    padding: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  winnersTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.warning,
    textAlign: 'center',
    marginBottom: SIZES.md,
  },
  winnerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: SIZES.md,
    borderRadius: SIZES.md,
    marginBottom: SIZES.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  winnerRank: {
    marginRight: SIZES.md,
  },
  winnerInfo: {
    flex: 1,
  },
  winnerTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SIZES.xs,
  },
  winnerName: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SIZES.xs,
  },
  winnerEntry: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: SIZES.sm,
  },
  winnerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.md,
  },
  winnerVotes: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  winnerPoints: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.success,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SIZES.xl,
  },
  loadingText: {
    marginTop: SIZES.md,
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
  },
  listContainer: {
    padding: SIZES.sm,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: SIZES.md,
    borderRadius: SIZES.md,
    marginBottom: SIZES.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  firstPlace: {
    backgroundColor: `${COLORS.warning}10`,
    borderWidth: 1,
    borderColor: `${COLORS.warning}30`,
  },
  secondPlace: {
    backgroundColor: `${COLORS.textSecondary}5`,
    borderWidth: 1,
    borderColor: `${COLORS.textSecondary}20`,
  },
  thirdPlace: {
    backgroundColor: `${COLORS.accent}5`,
    borderWidth: 1,
    borderColor: `${COLORS.accent}20`,
  },
  regularPlace: {
    backgroundColor: '#fff',
  },
  currentUserItem: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNumber: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
  },
  participantInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: SIZES.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: SIZES.sm,
  },
  participantDetails: {
    flex: 1,
  },
  username: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  currentUserText: {
    color: COLORS.primary,
  },
  entryTitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  voteInfo: {
    alignItems: 'flex-end',
  },
  voteCount: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  voteLabel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  countryVotes: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.info,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: SIZES.lg,
    borderTopRightRadius: SIZES.lg,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  globalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SIZES.sm,
  },
  globalOptionText: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.primary,
  },
  countryList: {
    flex: 1,
  },
  countryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  countryName: {
    fontSize: FONTS.sizes.md,
    color: COLORS.text,
  },
  countryCode: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: SIZES.sm,
    paddingVertical: 2,
    borderRadius: SIZES.xs,
  },
  defaultAvatar: {
    backgroundColor: '#4ECDC4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultAvatarText: {
    color: '#fff',
    fontSize: FONTS.sizes.md,
    fontWeight: 'bold',
  },
});

export default CompetitionLeaderboard;