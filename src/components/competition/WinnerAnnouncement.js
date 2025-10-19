// Winner Announcement Component
// Displays competition winners with celebration animations and notification system

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Share,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { competitionVotingService } from '../../services/competitionVotingService';
import { COLORS, SIZES, FONTS } from '../../utils/constants';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const WinnerAnnouncement = ({
  visible,
  competitionId,
  competitionTitle,
  winners,
  onClose,
  autoShow = true,
  shareable = true,
}) => {
  const [expandedWinner, setExpandedWinner] = useState(null);
  const [loadingShare, setLoadingShare] = useState(false);

  // Animation values
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;
  const crownAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && autoShow) {
      animateIn();
      startCelebrationAnimations();
    } else if (!visible) {
      animateOut();
    }
  }, [visible]);

  const animateIn = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        delay: 100,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateOut = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: screenHeight,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const startCelebrationAnimations = () => {
    // Sparkle animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(sparkleAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Crown bounce animation for grand winner
    if (winners?.[0]?.winner_type === 'grand_winner') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(crownAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(crownAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  };

  const handleClose = () => {
    animateOut();
    setTimeout(() => {
      onClose?.();
      setExpandedWinner(null);
    }, 400);
  };

  const handleShare = async () => {
    if (!shareable) return;

    try {
      setLoadingShare(true);

      const grandWinner = winners?.[0];
      if (!grandWinner) return;

      const shareMessage = `🏆 Competition Winner Alert!\n\n` +
        `${grandWinner.participant_username} won the "${competitionTitle}" competition ` +
        `with ${grandWinner.final_votes.toLocaleString()} votes!\n\n` +
        `📱 Download 7Ftrends to see amazing fashion competitions!`;

      const result = await Share.share({
        message: shareMessage,
        title: 'Competition Winner Announcement',
      });

      if (result.action === Share.sharedAction) {
        // Shared successfully
      }

    } catch (error) {
      console.error('Share error:', error);
    } finally {
      setLoadingShare(false);
    }
  };

  const handleWinnerPress = (winner) => {
    setExpandedWinner(expandedWinner?.entry_id === winner.entry_id ? null : winner);
  };

  const getWinnerIcon = (winnerType) => {
    switch (winnerType) {
      case 'grand_winner':
        return <Ionicons name="ribbon" size={24} color={COLORS.warning} />;
      case 'top_3':
        return <Ionicons name="medal" size={20} color={COLORS.accent} />;
      case 'top_10':
        return <Ionicons name="award" size={18} color={COLORS.info} />;
      default:
        return <Ionicons name="star" size={16} color={COLORS.textSecondary} />;
    }
  };

  const getWinnerTitle = (winner) => {
    switch (winner.winner_type) {
      case 'grand_winner':
        return '🏆 Grand Winner';
      case 'top_3':
        return `🥈 Top 3 - Rank #${winner.final_rank}`;
      case 'top_10':
        return `🥉 Top 10 - Rank #${winner.final_rank}`;
      default:
        return `🎯 Participant - Rank #${winner.final_rank}`;
    }
  };

  const getWinnerColor = (winnerType) => {
    switch (winnerType) {
      case 'grand_winner':
        return COLORS.warning;
      case 'top_3':
        return COLORS.accent;
      case 'top_10':
        return COLORS.info;
      default:
        return COLORS.textSecondary;
    }
  };

  const renderGrandWinner = () => {
    const grandWinner = winners?.[0];
    if (!grandWinner || grandWinner.winner_type !== 'grand_winner') return null;

    return (
      <Animated.View
        style={[
          styles.grandWinnerContainer,
          {
            transform: [
              { scale: scaleAnim },
              {
                translateY: crownAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -10],
                }),
              },
            ],
            },
        ]}
      >
        <View style={styles.grandWinnerHeader}>
          <Animated.View
            style={[
              styles.crownContainer,
              {
                transform: [
                  {
                    rotate: sparkleAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '10deg'],
                    }),
                  },
                ],
              },
            ]}
          >
            <Ionicons name="ribbon" size={48} color={COLORS.warning} />
          </Animated.View>

          <View style={styles.grandWinnerInfo}>
            <Text style={styles.grandWinnerTitle}>🏆 Grand Winner</Text>
            <Text style={styles.grandWinnerName}>
              {grandWinner.participant_username}
            </Text>
            <Text style={styles.grandWinnerEntry}>
              "{grandWinner.entry_title}"
            </Text>
            <View style={styles.grandWinnerStats}>
              <View style={styles.statItem}>
                <Ionicons name="heart" size={16} color={COLORS.error} />
                <Text style={styles.statText}>
                  {grandWinner.final_votes.toLocaleString()} votes
                </Text>
              </View>
              {grandWinner.points_awarded > 0 && (
                <View style={styles.statItem}>
                  <Ionicons name="star" size={16} color={COLORS.warning} />
                  <Text style={styles.statText}>
                    +{grandWinner.points_awarded} points
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <Animated.View
          style={[
            styles.sparkleContainer,
            {
              opacity: sparkleAnim,
            },
          ]}
        >
          <Sparkles size={20} color={COLORS.warning} />
        </Animated.View>
      </Animated.View>
    );
  };

  const renderWinnerCard = (winner, index) => {
    const isExpanded = expandedWinner?.entry_id === winner.entry_id;
    const winnerColor = getWinnerColor(winner.winner_type);

    return (
      <Animated.View
        key={winner.entry_id}
        style={[
          styles.winnerCard,
          {
            backgroundColor: `${winnerColor}10`,
            borderColor: `${winnerColor}30`,
            opacity: fadeAnim,
            transform: [
              {
                translateY: slideAnim.interpolate({
                  inputRange: [0, screenHeight],
                  outputRange: [0, 50 * index],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.winnerCardHeader}
          onPress={() => handleWinnerPress(winner)}
          activeOpacity={0.8}
        >
          <View style={styles.winnerRank}>
            {getWinnerIcon(winner.winner_type)}
          </View>

          <View style={styles.winnerBasicInfo}>
            <Text style={[styles.winnerCardTitle, { color: winnerColor }]}>
              {getWinnerTitle(winner)}
            </Text>
            <Text style={styles.winnerName}>{winner.participant_username}</Text>
            <View style={styles.winnerMiniStats}>
              <Text style={styles.winnerVotes}>
                {winner.final_votes.toLocaleString()} votes
              </Text>
              {winner.points_awarded > 0 && (
                <Text style={styles.winnerPoints}>
                  +{winner.points_awarded} pts
                </Text>
              )}
            </View>
          </View>

          <Ionicons name="chevron-forward"
            size={16}
            color={winnerColor}
            style={[
              styles.chevron,
              {
                transform: [
                  {
                    rotate: isExpanded ? '90deg' : '0deg',
                  },
                ],
              },
            ]}
          />
        </TouchableOpacity>

        {isExpanded && (
          <Animated.View
            style={[
              styles.expandedContent,
              {
                opacity: fadeAnim,
              },
            ]}
          >
            <Text style={styles.expandedEntryTitle}>
              "{winner.entry_title}"
            </Text>

            <View style={styles.expandedStats}>
              <View style={styles.expandedStat}>
                <Ionicons name="people" size={16} color={COLORS.textSecondary} />
                <Text style={styles.expandedStatText}>Rank #{winner.final_rank}</Text>
              </View>

              <View style={styles.expandedStat}>
                <Ionicons name="heart" size={16} color={COLORS.textSecondary} />
                <Text style={styles.expandedStatText}>
                  {winner.final_votes.toLocaleString()} votes
                </Text>
              </View>

              {winner.points_awarded > 0 && (
                <View style={styles.expandedStat}>
                  <Ionicons name="star" size={16} color={COLORS.textSecondary} />
                  <Text style={styles.expandedStatText}>
                    {winner.points_awarded} points awarded
                  </Text>
                </View>
              )}
            </View>

            {shareable && (
              <TouchableOpacity
                style={styles.shareButton}
                onPress={handleShare}
                disabled={loadingShare}
              >
                {loadingShare ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                  <>
                    <Ionicons name="share" size={16} color={COLORS.primary} />
                    <Text style={styles.shareButtonText}>Share Winner</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </Animated.View>
        )}
      </Animated.View>
    );
  };

  const renderOtherWinners = () => {
    const otherWinners = winners?.filter(w => w.winner_type !== 'grand_winner') || [];

    if (otherWinners.length === 0) return null;

    return (
      <View style={styles.otherWinnersSection}>
        <Text style={styles.otherWinnersTitle}>🎉 Other Winners</Text>
        {otherWinners.map((winner, index) => renderWinnerCard(winner, index + 1))}
      </View>
    );
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={handleClose}
        />

        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="trophy" size={24} color={COLORS.accent} />
              <View>
                <Text style={styles.headerTitle}>Winners Announced!</Text>
                <Text style={styles.competitionTitle}>{competitionTitle}</Text>
              </View>
            </View>

            <View style={styles.headerRight}>
              {shareable && (
                <TouchableOpacity
                  style={styles.headerShareButton}
                  onPress={handleShare}
                  disabled={loadingShare}
                >
                  {loadingShare ? (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  ) : (
                    <Ionicons name="share" size={20} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleClose}
              >
                <Ionicons name="close" size={20} color={COLORS.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Content */}
          <Animated.ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            opacity={fadeAnim}
          >
            {/* Grand Winner */}
            {renderGrandWinner()}

            {/* Other Winners */}
            {renderOtherWinners()}

            {/* Call to Action */}
            <View style={styles.callToAction}>
              <Text style={styles.ctaTitle}>Join the Next Competition!</Text>
              <Text style={styles.ctaText}>
                Show off your style and compete with fashion enthusiasts worldwide
              </Text>
              <TouchableOpacity style={styles.ctaButton}>
                <Text style={styles.ctaButtonText}>Browse Competitions</Text>
              </TouchableOpacity>
            </View>
          </Animated.ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  overlayTouchable: {
    flex: 1,
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: SIZES.xl,
    borderTopRightRadius: SIZES.xl,
    maxHeight: screenHeight * 0.85,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SIZES.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.md,
  },
  headerTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '700',
    color: COLORS.text,
  },
  competitionTitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.sm,
  },
  headerShareButton: {
    padding: SIZES.sm,
    borderRadius: SIZES.sm,
    backgroundColor: `${COLORS.primary}10`,
  },
  closeButton: {
    padding: SIZES.sm,
    borderRadius: SIZES.sm,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: SIZES.lg,
  },
  grandWinnerContainer: {
    backgroundColor: `${COLORS.warning}10`,
    borderRadius: SIZES.lg,
    padding: SIZES.xl,
    marginBottom: SIZES.lg,
    borderWidth: 2,
    borderColor: `${COLORS.warning}30`,
    position: 'relative',
    overflow: 'hidden',
  },
  grandWinnerHeader: {
    alignItems: 'center',
    marginBottom: SIZES.lg,
  },
  crownContainer: {
    marginBottom: SIZES.md,
  },
  grandWinnerInfo: {
    alignItems: 'center',
  },
  grandWinnerTitle: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '800',
    color: COLORS.warning,
    marginBottom: SIZES.sm,
    textAlign: 'center',
  },
  grandWinnerName: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SIZES.sm,
    textAlign: 'center',
  },
  grandWinnerEntry: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: SIZES.md,
  },
  grandWinnerStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SIZES.lg,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.xs,
  },
  statText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  sparkleContainer: {
    position: 'absolute',
    top: SIZES.lg,
    right: SIZES.lg,
  },
  otherWinnersSection: {
    marginBottom: SIZES.lg,
  },
  otherWinnersTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SIZES.md,
    textAlign: 'center',
  },
  winnerCard: {
    borderRadius: SIZES.md,
    padding: SIZES.md,
    marginBottom: SIZES.sm,
    borderWidth: 1,
  },
  winnerCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  winnerRank: {
    marginRight: SIZES.md,
  },
  winnerCardTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    marginBottom: SIZES.xs,
  },
  winnerBasicInfo: {
    flex: 1,
  },
  winnerName: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SIZES.xs,
  },
  winnerMiniStats: {
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
  chevron: {
    marginLeft: SIZES.sm,
  },
  expandedContent: {
    marginTop: SIZES.md,
    paddingTop: SIZES.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  expandedEntryTitle: {
    fontSize: FONTS.sizes.md,
    fontStyle: 'italic',
    color: COLORS.textSecondary,
    marginBottom: SIZES.md,
    textAlign: 'center',
  },
  expandedStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SIZES.md,
  },
  expandedStat: {
    alignItems: 'center',
    gap: SIZES.xs,
  },
  expandedStatText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text,
    fontWeight: '500',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.sm,
    backgroundColor: `${COLORS.primary}10`,
    borderRadius: SIZES.sm,
    gap: SIZES.xs,
  },
  shareButtonText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.primary,
  },
  callToAction: {
    alignItems: 'center',
    padding: SIZES.xl,
    backgroundColor: `${COLORS.primary}5`,
    borderRadius: SIZES.lg,
    marginTop: SIZES.md,
  },
  ctaTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: SIZES.sm,
    textAlign: 'center',
  },
  ctaText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SIZES.lg,
  },
  ctaButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.xl,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.md,
  },
  ctaButtonText: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: '#fff',
  },
});

export default WinnerAnnouncement;