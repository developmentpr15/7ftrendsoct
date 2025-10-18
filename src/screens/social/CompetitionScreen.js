import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useAppStore from '../../store/appStore';
import useAuthStore from '../../store/authStore';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../utils/constants';

// Country data
const COUNTRIES = [
  { code: 'US', name: 'United States', flag: '🇺🇸', region: 'Americas' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', region: 'Europe' },
  { code: 'FR', name: 'France', flag: '🇫🇷', region: 'Europe' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', region: 'Europe' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹', region: 'Europe' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸', region: 'Europe' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', region: 'Asia' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷', region: 'Asia' },
  { code: 'CN', name: 'China', flag: '🇨🇳', region: 'Asia' },
  { code: 'IN', name: 'India', flag: '🇮🇳', region: 'Asia' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', region: 'Americas' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽', region: 'Americas' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', region: 'Oceania' },
];

const REGIONS = [
  { id: 'global', name: 'Global', icon: '🌍' },
  { id: 'Americas', name: 'Americas', icon: '🌎' },
  { id: 'Europe', name: 'Europe', icon: '🌍' },
  { id: 'Asia', name: 'Asia', icon: '🌏' },
  { id: 'Africa', name: 'Africa', icon: '🌍' },
  { id: 'Oceania', name: 'Oceania', icon: '🌏' },
];

const CompetitionScreen = () => {
  const { competitions, joinCompetition, setUserCountry, userCountry, createCompetition } = useAppStore();
  const user = useAuthStore((state) => state.user);
  const [selectedCompetition, setSelectedCompetition] = useState(null);
  const [participationModalVisible, setParticipationModalVisible] = useState(false);
  const [leaderboardModalVisible, setLeaderboardModalVisible] = useState(false);
  const [createCompetitionVisible, setCreateCompetitionVisible] = useState(false);
  const [showCountrySelector, setShowCountrySelector] = useState(false);
  const [isAdmin, setIsAdmin] = useState(true);

  // Form states
  const [competitionTitle, setCompetitionTitle] = useState('');
  const [competitionDescription, setCompetitionDescription] = useState('');
  const [competitionIcon, setCompetitionIcon] = useState('🏆');
  const [competitionDeadline, setCompetitionDeadline] = useState('7 days');
  const [isGlobal, setIsGlobal] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState('global');
  const [eligibleCountries, setEligibleCountries] = useState([]);
  const [showLeaderboardType, setShowLeaderboardType] = useState('country'); // 'country' or 'global'

  // Initialize user country
  React.useEffect(() => {
    if (user?.user_metadata?.country) {
      setUserCountry(user.user_metadata.country);
    }
  }, [user, setUserCountry]);

  // Get user's country flag
  const getUserCountryFlag = () => {
    const country = COUNTRIES.find(c => c.code === userCountry);
    return country ? country.flag : '🌍';
  };

  const handleJoinCompetition = (competition) => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to join competitions');
      return;
    }

    if (competition.canJoin) {
      setSelectedCompetition(competition);
      setParticipationModalVisible(true);
    } else {
      Alert.alert(
        'Not Eligible',
        `This competition is not available in your country (${userCountry}). Only users from ${competition.eligibleCountries ? competition.eligibleCountries.join(', ') : 'the specified region'} can participate.`
      );
    }
  };

  const submitParticipation = () => {
    if (selectedCompetition) {
      joinCompetition(selectedCompetition.id);
      setParticipationModalVisible(false);
      setSelectedCompetition(null);
      Alert.alert('Success', `You've joined "${selectedCompetition.title}"!`);
    }
  };

  const handleViewLeaderboard = (competition) => {
    setSelectedCompetition(competition);
    setLeaderboardModalVisible(true);
  };

  const handleCountrySelect = (country) => {
    setUserCountry(country);
    setShowCountrySelector(false);
  };

  const handleCountryToggle = (countryCode) => {
    setEligibleCountries(prev => {
      if (prev.includes(countryCode)) {
        return prev.filter(c => c !== countryCode);
      } else {
        return [...prev, countryCode];
      }
    });
  };

  const handleRegionSelect = (regionId) => {
    setSelectedRegion(regionId);
    setIsGlobal(regionId === 'global');

    // Auto-select countries for region
    if (regionId !== 'global') {
      const regionCountries = COUNTRIES.filter(c => c.region === regionId).map(c => c.code);
      setEligibleCountries(regionCountries);
    } else {
      setEligibleCountries([]);
    }
  };

  const submitCompetition = () => {
    if (competitionTitle.trim() && competitionDescription.trim()) {
      const newCompetitionData = {
        title: competitionTitle,
        description: competitionDescription,
        icon: competitionIcon,
        daysRemaining: parseInt(competitionDeadline) || 7,
        isGlobal,
        eligibleCountries: isGlobal ? null : eligibleCountries,
        region: isGlobal ? null : selectedRegion,
        userCountry: userCountry,
      };

      const newId = createCompetition(newCompetitionData);
      setCompetitionTitle('');
      setCompetitionDescription('');
      setCompetitionIcon('🏆');
      setCompetitionDeadline('7 days');
      setIsGlobal(true);
      setSelectedRegion('global');
      setEligibleCountries([]);
      setCreateCompetitionVisible(false);

      Alert.alert('Success', `Competition "${competitionTitle}" has been created!`);
    } else {
      Alert.alert('Error', 'Please fill in all required fields.');
    }
  };

  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>7ftrends</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.countrySelector}
              onPress={() => setShowCountrySelector(true)}
            >
              <Text style={styles.countryFlag}>{getUserCountryFlag()}</Text>
            </TouchableOpacity>
            {isAdmin && (
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => setCreateCompetitionVisible(true)}
              >
                <Ionicons name="add" size={24} color={COLORS.surface} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* User Country Info */}
        <View style={styles.userInfoContainer}>
          <Text style={styles.userInfoText}>
            Competitions available in {getUserCountryFlag()} {COUNTRIES.find(c => c.code === userCountry)?.name || 'Your Country'}
          </Text>
        </View>

        {/* Active Competitions */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>🏆 Active Competitions</Text>
          {competitions.filter(c => c.isActive).map((competition) => (
            <View
              key={competition.id}
              style={[
                styles.competitionContainer,
                !competition.canJoin && styles.disabledCompetition
              ]}
            >
              <TouchableOpacity
                style={styles.competitionContent}
                onPress={() => handleJoinCompetition(competition)}
              >
                <View style={styles.competitionHeader}>
                  <View style={styles.competitionIconContainer}>
                    <Text style={styles.competitionIcon}>{competition.icon}</Text>
                    <Text style={styles.competitionCountryFlag}>{competition.countryFlag}</Text>
                  </View>
                  <View style={styles.competitionInfo}>
                    <Text style={styles.competitionTitle}>{competition.title}</Text>
                    <Text style={styles.competitionDescription}>{competition.description}</Text>
                    {!competition.isGlobal && (
                      <Text style={styles.competitionRegion}>
                        {competition.region} • {competition.eligibleCountries?.length || 0} countries
                      </Text>
                    )}
                  </View>
                  <View style={styles.competitionActions}>
                    <TouchableOpacity
                      style={styles.leaderboardButton}
                      onPress={() => handleViewLeaderboard(competition)}
                    >
                      <Ionicons name="trophy" size={16} color={COLORS.accent} />
                      <Text style={styles.leaderboardButtonText}>Leaderboard</Text>
                    </TouchableOpacity>
                    {competition.canJoin ? (
                      <Ionicons name="chevron-forward" size={20} color={COLORS.accent} />
                    ) : (
                      <View style={styles.lockedIcon}>
                        <Ionicons name="lock-closed" size={16} color={COLORS.textSecondary} />
                      </View>
                    )}
                  </View>
                </View>
                <View style={styles.competitionFooter}>
                  <View style={styles.participantsInfo}>
                    <Ionicons name="people" size={16} color={COLORS.textSecondary} />
                    <Text style={styles.participantsText}>{competition.participants} participants</Text>
                  </View>
                  <View style={styles.competitionMeta}>
                    <Text style={styles.deadlineText}>{competition.deadline}</Text>
                    {competition.userJoined && (
                      <View style={styles.joinedBadge}>
                        <Text style={styles.joinedText}>Joined</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Past Competitions */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>📋 Past Competitions</Text>
          {competitions.filter(c => !c.isActive).map((competition) => (
            <View
              key={competition.id}
              style={[styles.competitionContainer, styles.pastCompetition]}
            >
              <View style={styles.competitionContent}>
                <View style={styles.competitionHeader}>
                  <View style={styles.competitionIconContainer}>
                    <Text style={styles.competitionIcon}>{competition.icon}</Text>
                    <Text style={styles.competitionCountryFlag}>{competition.countryFlag}</Text>
                  </View>
                  <View style={styles.competitionInfo}>
                    <Text style={styles.competitionTitle}>{competition.title}</Text>
                    <Text style={styles.competitionDescription}>{competition.description}</Text>
                    {!competition.isGlobal && (
                      <Text style={styles.competitionRegion}>
                        {competition.region} • {competition.eligibleCountries?.length || 0} countries
                      </Text>
                    )}
                  </View>
                  <View style={styles.competitionActions}>
                    <TouchableOpacity
                      style={styles.leaderboardButton}
                      onPress={() => handleViewLeaderboard(competition)}
                    >
                      <Ionicons name="trophy" size={16} color={COLORS.textSecondary} />
                      <Text style={styles.leaderboardButtonText}>Leaderboard</Text>
                    </TouchableOpacity>
                    <View style={styles.endedBadge}>
                      <Text style={styles.endedText}>Ended</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.competitionFooter}>
                  <View style={styles.participantsInfo}>
                    <Ionicons name="people" size={16} color={COLORS.textSecondary} />
                    <Text style={styles.participantsText}>{competition.participants} participants</Text>
                  </View>
                  <Text style={styles.winnerText}>Winner announced</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Participation Modal */}
      <Modal
        visible={participationModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setParticipationModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.participationModal}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setParticipationModalVisible(false)}>
                <Ionicons name="close" size={24} color="#1a1a1a" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Join Challenge</Text>
              <View style={{ width: 24 }} />
            </View>

            {selectedCompetition && (
              <View style={styles.challengePreview}>
                <Text style={styles.previewIcon}>{selectedCompetition.icon}</Text>
                <Text style={styles.previewTitle}>{selectedCompetition.title}</Text>
                <Text style={styles.previewDescription}>{selectedCompetition.description}</Text>
                <Text style={styles.previewDeadline}>{selectedCompetition.deadline}</Text>
              </View>
            )}

            <View style={styles.participationActions}>
              <TouchableOpacity
                style={styles.cancelParticipationButton}
                onPress={() => setParticipationModalVisible(false)}
              >
                <Text style={styles.cancelParticipationText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.joinParticipationButton}
                onPress={submitParticipation}
              >
                <Text style={styles.joinParticipationText}>Join Challenge</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Create Competition Modal (Admin Only) */}
      <Modal
        visible={createCompetitionVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCreateCompetitionVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.createCompetitionModal}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setCreateCompetitionVisible(false)}>
                <Ionicons name="close" size={24} color="#1a1a1a" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Create New Competition</Text>
              <TouchableOpacity onPress={submitCompetition}>
                <Text style={styles.postButton}>Create</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formContainer}>
              <Text style={styles.label}>Competition Title</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter competition title"
                placeholderTextColor="#999999"
                value={competitionTitle}
                onChangeText={setCompetitionTitle}
              />

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe the competition"
                placeholderTextColor="#999999"
                value={competitionDescription}
                onChangeText={setCompetitionDescription}
                multiline
                numberOfLines={3}
              />

              <Text style={styles.label}>Icon</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.iconSelector}>
                {['🏆', '🎯', '👗', '👔', '👠', '💎', '🌟', '🎨', '📸', '💼'].map((icon) => (
                  <TouchableOpacity
                    key={icon}
                    style={[
                      styles.iconOption,
                      competitionIcon === icon && styles.iconSelected
                    ]}
                    onPress={() => setCompetitionIcon(icon)}
                  >
                    <Text style={styles.iconText}>{icon}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.label}>Duration</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 7 days, 2 weeks"
                placeholderTextColor="#999999"
                value={competitionDeadline}
                onChangeText={setCompetitionDeadline}
              />

              <Text style={styles.label}>Competition Type</Text>
              <View style={styles.toggleContainer}>
                <TouchableOpacity
                  style={[styles.toggleOption, isGlobal && styles.toggleOptionSelected]}
                  onPress={() => handleRegionSelect('global')}
                >
                  <Ionicons name="globe" size={20} color={isGlobal ? COLORS.accent : COLORS.textSecondary} />
                  <Text style={[styles.toggleText, isGlobal && styles.toggleTextSelected]}>Global</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleOption, !isGlobal && styles.toggleOptionSelected]}
                  onPress={() => handleRegionSelect('Americas')}
                >
                  <Ionicons name="location" size={20} color={!isGlobal ? COLORS.accent : COLORS.textSecondary} />
                  <Text style={[styles.toggleText, !isGlobal && styles.toggleTextSelected]}>Regional</Text>
                </TouchableOpacity>
              </View>

              {!isGlobal && (
                <>
                  <Text style={styles.label}>Region</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.regionSelector}>
                    {REGIONS.filter(r => r.id !== 'global').map((region) => (
                      <TouchableOpacity
                        key={region.id}
                        style={[
                          styles.regionOption,
                          selectedRegion === region.id && styles.regionSelected
                        ]}
                        onPress={() => handleRegionSelect(region.id)}
                      >
                        <Text style={styles.regionIcon}>{region.icon}</Text>
                        <Text style={[styles.regionText, selectedRegion === region.id && styles.regionTextSelected]}>
                          {region.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <Text style={styles.label}>Eligible Countries</Text>
                  <View style={styles.countriesContainer}>
                    {COUNTRIES.filter(country =>
                      selectedRegion === 'global' || country.region === selectedRegion
                    ).map((country) => (
                      <TouchableOpacity
                        key={country.code}
                        style={[
                          styles.countryOption,
                          eligibleCountries.includes(country.code) && styles.countrySelected
                        ]}
                        onPress={() => handleCountryToggle(country.code)}
                      >
                        <Text style={styles.countryFlag}>{country.flag}</Text>
                        <Text style={styles.countryCode}>{country.code}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Country Selector Modal */}
      <Modal
        visible={showCountrySelector}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCountrySelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.countryModal}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowCountrySelector(false)}>
                <Ionicons name="close" size={24} color="#1a1a1a" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Select Your Country</Text>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.countriesList}>
              {COUNTRIES.map((country) => (
                <TouchableOpacity
                  key={country.code}
                  style={[
                    styles.countryItem,
                    userCountry === country.code && styles.countryItemSelected
                  ]}
                  onPress={() => handleCountrySelect(country.code)}
                >
                  <Text style={styles.countryFlagLarge}>{country.flag}</Text>
                  <Text style={styles.countryName}>{country.name}</Text>
                  {userCountry === country.code && (
                    <Ionicons name="checkmark" size={20} color={COLORS.accent} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Leaderboard Modal */}
      <Modal
        visible={leaderboardModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setLeaderboardModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.leaderboardModal}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setLeaderboardModalVisible(false)}>
                <Ionicons name="close" size={24} color="#1a1a1a" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Leaderboard</Text>
              <View style={{ width: 24 }} />
            </View>

            {selectedCompetition && (
              <>
                <View style={styles.leaderboardHeader}>
                  <Text style={styles.leaderboardTitle}>{selectedCompetition.title}</Text>
                  <View style={styles.leaderboardToggle}>
                    <TouchableOpacity
                      style={[
                        styles.leaderboardToggleOption,
                        showLeaderboardType === 'country' && styles.leaderboardToggleSelected
                      ]}
                      onPress={() => setShowLeaderboardType('country')}
                    >
                      <Text style={[
                        styles.leaderboardToggleText,
                        showLeaderboardType === 'country' && styles.leaderboardToggleTextSelected
                      ]}>
                        {getUserCountryFlag()} Country
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.leaderboardToggleOption,
                        showLeaderboardType === 'global' && styles.leaderboardToggleSelected
                      ]}
                      onPress={() => setShowLeaderboardType('global')}
                    >
                      <Text style={[
                        styles.leaderboardToggleText,
                        showLeaderboardType === 'global' && styles.leaderboardToggleTextSelected
                      ]}>
                        🌍 Global
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <ScrollView style={styles.leaderboardList}>
                  {/* Sample leaderboard data - in real app this would come from API */}
                  {[
                    { rank: 1, name: 'fashion_queen', flag: '🇺🇸', score: 1250 },
                    { rank: 2, name: 'style_master', flag: '🇺🇸', score: 1180 },
                    { rank: 3, name: 'trend_setter', flag: '🇨🇦', score: 1090 },
                    { rank: 4, name: 'outfit_pro', flag: '🇬🇧', score: 950 },
                    { rank: 5, name: 'couture_fan', flag: '🇺🇸', score: 890 },
                  ].map((entry) => (
                    <View key={entry.rank} style={styles.leaderboardEntry}>
                      <View style={styles.rankContainer}>
                        <Text style={[
                          styles.rankText,
                          entry.rank <= 3 && styles.rankTextTop
                        ]}>
                          {entry.rank}
                        </Text>
                        {entry.rank <= 3 && (
                          <Text style={styles.rankMedal}>
                            {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
                          </Text>
                        )}
                      </View>
                      <View style={styles.leaderboardUser}>
                        <Text style={styles.userFlag}>{entry.flag}</Text>
                        <Text style={styles.userName}>{entry.name}</Text>
                      </View>
                      <Text style={styles.userScore}>{entry.score} pts</Text>
                    </View>
                  ))}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: SIZES.padding,
    paddingBottom: SIZES.base,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoContainer: {
    flex: 1,
  },
  logoText: {
    fontFamily: 'Pacifico_400Regular',
    fontSize: 28,
    color: COLORS.primary,
    fontWeight: '400',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.base,
  },
  countrySelector: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.light,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  countryFlag: {
    fontSize: 20,
  },
  createButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: SIZES.padding,
  },
  userInfoContainer: {
    padding: SIZES.padding,
    marginVertical: SIZES.base,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  userInfoText: {
    fontSize: 14,
    color: COLORS.text,
    fontFamily: 'System',
    textAlign: 'center',
  },
  sectionContainer: {
    marginBottom: SIZES.padding * 2,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.padding,
    fontFamily: 'System',
  },
  competitionContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    marginBottom: SIZES.base,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  disabledCompetition: {
    opacity: 0.6,
    backgroundColor: COLORS.light,
  },
  pastCompetition: {
    opacity: 0.7,
  },
  competitionContent: {
    padding: SIZES.padding,
  },
  competitionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SIZES.base,
  },
  competitionIconContainer: {
    position: 'relative',
    marginRight: SIZES.base,
  },
  competitionIcon: {
    fontSize: 24,
    marginBottom: 2,
  },
  competitionCountryFlag: {
    position: 'absolute',
    bottom: -2,
    right: -4,
    fontSize: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    width: 16,
    height: 16,
    textAlign: 'center',
    lineHeight: 14,
  },
  competitionInfo: {
    flex: 1,
  },
  competitionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
    fontFamily: 'System',
  },
  competitionDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 6,
    fontFamily: 'System',
  },
  competitionRegion: {
    fontSize: 12,
    color: COLORS.accent,
    fontFamily: 'System',
  },
  competitionActions: {
    alignItems: 'flex-end',
    gap: SIZES.base,
  },
  leaderboardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.light,
    paddingHorizontal: SIZES.base,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  leaderboardButtonText: {
    fontSize: 12,
    color: COLORS.accent,
    fontFamily: 'System',
  },
  lockedIcon: {
    backgroundColor: COLORS.light,
    borderRadius: 12,
    padding: 6,
  },
  competitionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SIZES.base,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  participantsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  participantsText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: 'System',
  },
  competitionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.base,
  },
  deadlineText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: 'System',
  },
  joinedBadge: {
    backgroundColor: COLORS.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  joinedText: {
    fontSize: 10,
    color: COLORS.surface,
    fontWeight: '600',
    fontFamily: 'System',
  },
  endedBadge: {
    backgroundColor: COLORS.textSecondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  endedText: {
    fontSize: 10,
    color: COLORS.surface,
    fontWeight: '600',
    fontFamily: 'System',
  },
  winnerText: {
    fontSize: 12,
    color: COLORS.success,
    fontFamily: 'System',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  participationModal: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SIZES.padding * 2,
    width: '90%',
    maxWidth: 400,
  },
  createCompetitionModal: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SIZES.padding * 2,
    width: '95%',
    maxWidth: 500,
    maxHeight: '90%',
  },
  countryModal: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SIZES.padding * 2,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  leaderboardModal: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SIZES.padding * 2,
    width: '90%',
    maxWidth: 450,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.padding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: SIZES.base,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    fontFamily: 'System',
  },
  postButton: {
    fontSize: 16,
    color: COLORS.accent,
    fontWeight: '600',
    fontFamily: 'System',
  },
  challengePreview: {
    padding: SIZES.padding,
    backgroundColor: COLORS.light,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  previewIcon: {
    fontSize: 48,
    marginBottom: SIZES.base,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SIZES.base / 2,
    fontFamily: 'System',
  },
  previewDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SIZES.base / 2,
    fontFamily: 'System',
  },
  previewDeadline: {
    fontSize: 12,
    color: COLORS.accent,
    fontFamily: 'System',
  },
  participationActions: {
    flexDirection: 'row',
    gap: SIZES.base,
  },
  cancelParticipationButton: {
    flex: 1,
    padding: SIZES.padding,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  cancelParticipationText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '600',
    fontFamily: 'System',
  },
  joinParticipationButton: {
    flex: 1,
    padding: SIZES.padding,
    borderRadius: 12,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
  },
  joinParticipationText: {
    fontSize: 16,
    color: COLORS.surface,
    fontWeight: '600',
    fontFamily: 'System',
  },
  // Form styles
  formContainer: {
    maxHeight: 500,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SIZES.base / 2,
    fontFamily: 'System',
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: SIZES.base,
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: COLORS.surface,
    marginBottom: SIZES.padding,
    fontFamily: 'System',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  iconSelector: {
    flexDirection: 'row',
    marginBottom: SIZES.padding,
  },
  iconOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.base,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  iconSelected: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accent + '20',
  },
  iconText: {
    fontSize: 24,
  },
  // Toggle styles
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.light,
    borderRadius: 12,
    padding: 4,
    marginBottom: SIZES.padding,
  },
  toggleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.base,
    borderRadius: 8,
    gap: SIZES.base / 2,
  },
  toggleOptionSelected: {
    backgroundColor: COLORS.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
    fontFamily: 'System',
  },
  toggleTextSelected: {
    color: COLORS.accent,
    fontWeight: '600',
  },
  // Region selector
  regionSelector: {
    flexDirection: 'row',
    marginBottom: SIZES.padding,
  },
  regionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.light,
    paddingHorizontal: SIZES.base,
    paddingVertical: SIZES.base / 2,
    borderRadius: 20,
    marginRight: SIZES.base,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  regionSelected: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accent + '20',
  },
  regionIcon: {
    fontSize: 16,
    marginRight: SIZES.base / 2,
  },
  regionText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: 'System',
  },
  regionTextSelected: {
    color: COLORS.accent,
    fontWeight: '600',
  },
  // Countries selector
  countriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.base / 2,
    marginBottom: SIZES.padding,
  },
  countryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.light,
    paddingHorizontal: SIZES.base / 2,
    paddingVertical: SIZES.base / 2,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  countrySelected: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accent + '20',
  },
  // Country selector modal
  countriesList: {
    maxHeight: 400,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.base,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  countryItemSelected: {
    backgroundColor: COLORS.accent + '10',
  },
  countryFlagLarge: {
    fontSize: 24,
    marginRight: SIZES.base,
  },
  countryName: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    fontFamily: 'System',
  },
  // Leaderboard styles
  leaderboardHeader: {
    marginBottom: SIZES.padding,
  },
  leaderboardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SIZES.base,
    fontFamily: 'System',
  },
  leaderboardToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.light,
    borderRadius: 12,
    padding: 4,
  },
  leaderboardToggleOption: {
    flex: 1,
    padding: SIZES.base / 2,
    borderRadius: 8,
    alignItems: 'center',
  },
  leaderboardToggleSelected: {
    backgroundColor: COLORS.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  leaderboardToggleText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: 'System',
  },
  leaderboardToggleTextSelected: {
    color: COLORS.accent,
    fontWeight: '600',
  },
  leaderboardList: {
    maxHeight: 400,
  },
  leaderboardEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.base,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  rankContainer: {
    alignItems: 'center',
    width: 40,
  },
  rankText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    fontFamily: 'System',
  },
  rankTextTop: {
    color: COLORS.accent,
  },
  rankMedal: {
    fontSize: 12,
  },
  leaderboardUser: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: SIZES.base,
  },
  userFlag: {
    fontSize: 16,
    marginRight: SIZES.base / 2,
  },
  userName: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    fontFamily: 'System',
  },
  userScore: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.accent,
    fontFamily: 'System',
  },
};

export default CompetitionScreen;