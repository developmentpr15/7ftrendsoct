// Competition Voting Screen
// Example integration of the new voting system with heart buttons and leaderboard

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import HeartVoteButton from '../../components/competition/HeartVoteButton';
import CompetitionLeaderboard from '../../components/competition/CompetitionLeaderboard';
import WinnerAnnouncement from '../../components/competition/WinnerAnnouncement';

import {
  useCompetitions,
  useCompetitionActions,
  useCompetitionVoting,
  useCompetitionLeaderboard,
} from '../../store';
import { COLORS, SIZES, FONTS } from '../../utils/constants';

const CompetitionVotingScreen = ({ route, navigation }) => {
  const { competitionId } = route.params || {};

  // Store hooks
  const { currentCompetition } = useCompetitions();
  const { fetchCompetition } = useCompetitionActions();
  const { voting, fetchUserVotes, userVotes, hasVotedForEntry, checkVotingOpen } = useCompetitionVoting();
  const { leaderboard, loading: leaderboardLoading, fetchLeaderboard } = useCompetitionLeaderboard();

  // Local state
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [winners, setWinners] = useState([]);
  const [votingOpen, setVotingOpen] = useState(false);

  useEffect(() => {
    if (competitionId) {
      loadCompetitionData();
    }
  }, [competitionId]);

  useFocusEffect(
    useCallback(() => {
      if (competitionId) {
        loadCompetitionData();
      }
    }, [competitionId])
  );

  const loadCompetitionData = async () => {
    try {
      setLoading(true);

      // Load competition details
      if (!currentCompetition || currentCompetition.id !== competitionId) {
        await fetchCompetition(competitionId);
      }

      // Check if voting is open
      const isOpen = await checkVotingOpen(competitionId);
      setVotingOpen(isOpen);

      // Load user votes
      await fetchUserVotes(competitionId);

      // Load leaderboard
      await fetchLeaderboard(competitionId);

      // Check for winners (6 hours after voting ends)
      const { determineWinners } = useCompetitionActions();
      const winnersData = await determineWinners(competitionId);
      if (winnersData.length > 0) {
        setWinners(winnersData);
        setShowWinnerModal(true);
      }

      // Load entries (simplified for this example)
      await loadEntries();

    } catch (error) {
      console.error('Error loading competition data:', error);
      Alert.alert('Error', 'Failed to load competition data');
    } finally {
      setLoading(false);
    }
  };

  const loadEntries = async () => {
    try {
      // This would typically fetch competition entries
      // For now, using mock data based on leaderboard
      if (currentCompetition) {
        // Transform leaderboard entries into full entries
        const transformedEntries = leaderboard.map((item, index) => ({
          id: item.entry_id,
          participant_id: item.participant_id,
          participant: {
            id: item.participant_id,
            username: item.participant_username,
            avatar_url: item.participant_avatar_url,
          },
          title: item.entry_title,
          images: item.entry_images || [],
          votes_count: item.votes_count,
          status: 'approved',
          submitted_at: item.created_at,
          rank: item.rank,
        }));
        setEntries(transformedEntries);
      }
    } catch (error) {
      console.error('Error loading entries:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCompetitionData();
    setRefreshing(false);
  };

  const handleVote = async (entryId, voteResult) => {
    if (voteResult.success) {
      // Update local entry vote count
      setEntries(prevEntries =>
        prevEntries.map(entry =>
          entry.id === entryId
            ? { ...entry, votes_count: voteResult.votes_count || entry.votes_count }
            : entry
        )
      );

      // Refresh leaderboard to show new rankings
      await fetchLeaderboard(competitionId);
    } else {
      Alert.alert('Error', voteResult.error || 'Failed to vote');
    }
  };

  const handleWinnerClose = () => {
    setShowWinnerModal(false);
  };

  const renderEntryItem = ({ item, index }) => {
    const hasVoted = userVotes.has(item.id);
    const isTopThree = item.rank <= 3;

    return (
      <View style={[styles.entryItem, isTopThree && styles.topThreeEntry]}>
        <View style={styles.rank}>
          <Text style={[styles.rankText, isTopThree && styles.topThreeRankText]}>
            #{item.rank}
          </Text>
        </View>

        <View style={styles.entryContent}>
          <View style={styles.entryHeader}>
            <Text style={styles.entryTitle}>{item.title}</Text>
            <Text style={styles.participantName}>by {item.participant.username}</Text>
          </View>

          {item.images && item.images.length > 0 && (
            <View style={styles.entryImageContainer}>
              <Image
                source={{ uri: item.images[0] }}
                style={styles.entryImage}
                resizeMode="cover"
              />
            </View>
          )}
        </View>

        <View style={styles.voteSection}>
          <HeartVoteButton
            entryId={item.id}
            competitionId={competitionId}
            initialVoteCount={item.votes_count}
            size="large"
            showCount={true}
            disabled={!votingOpen}
            onVoteChange={(result) => handleVote(item.id, result)}
            style={hasVoted && styles.votedButton}
          />
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.primary} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading competition...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.primary} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>{currentCompetition?.title || 'Competition'}</Text>
          <Text style={styles.headerStatus}>
            {currentCompetition?.status === 'voting' && '🗳️ Voting Open'}
            {currentCompetition?.status === 'completed' && '🏆 Winners Announced'}
            {currentCompetition?.status === 'active' && '📝 Submission Period'}
          </Text>
        </View>

        <View style={styles.headerRight}>
          <Text style={styles.votingStatus}>
            {votingOpen ? 'Vote Now!' : 'Voting Closed'}
          </Text>
        </View>
      </View>

      {/* Voting Period Info */}
      {currentCompetition && (
        <View style={styles.votingInfo}>
          <Text style={styles.votingInfoText}>
            {currentCompetition.status === 'voting' && 'Cast your vote for your favorite entries!'}
            {currentCompetition.status === 'completed' && winners.length > 0 && 'Winners have been announced!'}
            {currentCompetition.status === 'active' && 'Submit your entry to participate!'}
          </Text>
        </View>
      )}

      {/* Content */}
      {!votingOpen && currentCompetition?.status === 'completed' && winners.length > 0 ? (
        // Show winners if voting is closed and winners are announced
        <ScrollView style={styles.content}>
          <View style={styles.winnersContainer}>
            <Text style={styles.winnersTitle}>🎉 Competition Winners!</Text>
            {winners.slice(0, 5).map((winner, index) => (
              <View key={winner.entry_id} style={styles.winnerCard}>
                <View style={styles.winnerRank}>
                  <Text style={styles.winnerRankText}>#{winner.final_rank}</Text>
                </View>
                <View style={styles.winnerInfo}>
                  <Text style={styles.winnerName}>{winner.participant_username}</Text>
                  <Text style={styles.winnerEntry}> "{winner.entry_title}"</Text>
                  <Text style={styles.winnerVotes}>{winner.final_votes} votes</Text>
                  {winner.points_awarded > 0 && (
                    <Text style={styles.winnerPoints}>+{winner.points_awarded} points</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      ) : (
        // Show entries and leaderboard during voting period
        <View style={styles.content}>
          {/* Entries List */}
          <View style={styles.entriesSection}>
            <Text style={styles.sectionTitle}>Competition Entries</Text>
            <FlatList
              data={entries}
              keyExtractor={(item) => item.id}
              renderItem={renderEntryItem}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  tintColor={COLORS.primary}
                />
              }
              contentContainerStyle={styles.entriesList}
              showsVerticalScrollIndicator={false}
            />
          </View>

          {/* Leaderboard */}
          <CompetitionLeaderboard
            competitionId={competitionId}
            competitionTitle={currentCompetition?.title}
            onEntryPress={(entry) => {
              // Handle entry press - could navigate to entry details
              console.log('Entry pressed:', entry);
            }}
            onWinnersAnnounced={(winnersData) => {
              setWinners(winnersData);
              setShowWinnerModal(true);
            }}
          />
        </View>
      )}

      {/* Winner Announcement Modal */}
      <WinnerAnnouncement
        visible={showWinnerModal}
        competitionId={competitionId}
        competitionTitle={currentCompetition?.title}
        winners={winners}
        onClose={handleWinnerClose}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SIZES.md,
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SIZES.md,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerStatus: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  votingStatus: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: votingOpen ? COLORS.success : COLORS.textSecondary,
    backgroundColor: votingOpen ? `${COLORS.success}10` : `${COLORS.textSecondary}10`,
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.sm,
  },
  votingInfo: {
    backgroundColor: `${COLORS.primary}5`,
    padding: SIZES.md,
    marginHorizontal: SIZES.md,
    marginBottom: SIZES.md,
    borderRadius: SIZES.md,
  },
  votingInfoText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.primary,
    textAlign: 'center',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  entriesSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.text,
    margin: SIZES.md,
  },
  entriesList: {
    paddingHorizontal: SIZES.md,
    paddingBottom: SIZES.md,
  },
  entryItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: SIZES.md,
    padding: SIZES.md,
    marginBottom: SIZES.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  topThreeEntry: {
    borderWidth: 2,
    borderColor: `${COLORS.warning}30`,
    backgroundColor: `${COLORS.warning}5`,
  },
  rank: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: FONONTS.sizes.md,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  topThreeRankText: {
    color: COLORS.warning,
  },
  entryContent: {
    flex: 1,
    marginLeft: SIZES.md,
  },
  entryHeader: {
    marginBottom: SIZES.sm,
  },
  entryTitle: {
    fontSize: FONONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SIZES.xs,
  },
  participantName: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
  entryImageContainer: {
    marginTop: SIZES.sm,
    borderRadius: SIZES.sm,
    overflow: 'hidden',
  },
  entryImage: {
    width: '100%',
    height: 150,
    borderRadius: SIZES.sm,
  },
  voteSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  votedButton: {
    opacity: 0.7,
  },
  winnersContainer: {
    padding: SIZES.lg,
  },
  winnersTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SIZES.lg,
  },
  winnerCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: SIZES.md,
    padding: SIZES.lg,
    marginBottom: SIZES.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    alignItems: 'center',
  },
  winnerRank: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.warning,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.md,
  },
  winnerRankText: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '800',
    color: '#fff',
  },
  winnerInfo: {
    flex: 1,
  },
  winnerName: {
    fontSize: FONONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SIZES.xs,
  },
  winnerEntry: {
    fontSize: FONONTS.sizes.md,
    color: COLORS.textSecondary,
    marginBottom: SIZES.sm,
    fontStyle: 'italic',
  },
  winnerVotes: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SIZES.xs,
  },
  winnerPoints: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.success,
  },
});

export default CompetitionVotingScreen;