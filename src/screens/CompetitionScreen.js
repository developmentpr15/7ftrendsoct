import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
  FlatList,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS, SHADOWS } from '../utils/constants';
import useAuthStore from '../store/authStore';

const { width } = Dimensions.get('window');

const COMPETITIONS = [
  {
    id: 1,
    title: 'Summer Style Challenge',
    description: 'Show off your best summer outfits',
    image: 'https://picsum.photos/seed/summer/400/200',
    prize: 'Fashion voucher worth $100',
    deadline: '2024-08-31',
    participants: 234,
    category: 'Seasonal',
    status: 'active'
  },
  {
    id: 2,
    title: 'Streetwear Excellence',
    description: 'Urban fashion at its finest',
    image: 'https://picsum.photos/seed/streetwear/400/200',
    prize: 'Featured on our homepage',
    deadline: '2024-07-25',
    participants: 189,
    category: 'Style',
    status: 'active'
  },
  {
    id: 3,
    title: 'Eco Fashion Award',
    description: 'Sustainable style competition',
    image: 'https://picsum.photos/seed/eco/400/200',
    prize: 'Sustainable fashion bundle',
    deadline: '2024-08-15',
    participants: 156,
    category: 'Sustainable',
    status: 'active'
  },
  {
    id: 4,
    title: 'Vintage Revival',
    description: 'Retro looks with modern twist',
    image: 'https://picsum.photos/seed/vintage/400/200',
    prize: 'Vintage shopping spree',
    deadline: '2024-07-30',
    participants: 201,
    category: 'Theme',
    status: 'ending_soon'
  }
];

const CATEGORIES = ['All', 'Active', 'Seasonal', 'Style', 'Sustainable', 'Theme'];

const CompetitionScreen = () => {
  const { user } = useAuthStore();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCompetition, setSelectedCompetition] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showParticipate, setShowParticipate] = useState(false);

  const filteredCompetitions = selectedCategory === 'All'
    ? COMPETITIONS
    : selectedCategory === 'Active'
      ? COMPETITIONS.filter(c => c.status === 'active')
      : COMPETITIONS.filter(c => c.category === selectedCategory);

  const handleParticipate = (competition) => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to participate in competitions.');
      return;
    }
    setSelectedCompetition(competition);
    setShowParticipate(true);
  };

  const handleSubmitEntry = () => {
    Alert.alert(
      'Entry Submitted!',
      'Your competition entry has been submitted successfully. Good luck!',
      [{ text: 'OK', onPress: () => setShowParticipate(false) }]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return COLORS.success;
      case 'ending_soon': return COLORS.warning;
      case 'ended': return COLORS.textSecondary;
      default: return COLORS.textSecondary;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Active';
      case 'ending_soon': return 'Ending Soon';
      case 'ended': return 'Ended';
      default: return 'Unknown';
    }
  };

  const renderCompetitionCard = ({ item }) => (
    <TouchableOpacity
      key={item.id}
      style={styles.competitionCard}
      onPress={() => {
        setSelectedCompetition(item);
        setShowDetails(true);
      }}
    >
      <Image source={{ uri: item.image }} style={styles.competitionImage} />
      <View style={styles.competitionContent}>
        <View style={styles.competitionHeader}>
          <Text style={styles.competitionTitle}>{item.title}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>
        <Text style={styles.competitionDescription}>{item.description}</Text>
        <View style={styles.competitionDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="trophy" size={16} color={COLORS.accent} />
            <Text style={styles.detailText}>{item.prize}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="time" size={16} color={COLORS.warning} />
            <Text style={styles.detailText}>{item.deadline}</Text>
          </View>
        </View>
        <View style={styles.competitionFooter}>
          <View style={styles.participantsInfo}>
            <Ionicons name="people" size={16} color={COLORS.textSecondary} />
            <Text style={styles.participantsText}>{item.participants} participants</Text>
          </View>
          <TouchableOpacity
            style={styles.participateButton}
            onPress={() => handleParticipate(item)}
          >
            <Text style={styles.participateButtonText}>Join</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderCategoryChip = (category) => (
    <TouchableOpacity
      key={category}
      style={[
        styles.categoryChip,
        selectedCategory === category && styles.activeCategoryChip
      ]}
      onPress={() => setSelectedCategory(category)}
    >
      <Text style={[
        styles.categoryChipText,
        selectedCategory === category && styles.activeCategoryChipText
      ]}>
        {category}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Fashion Competitions</Text>
        <TouchableOpacity style={styles.infoButton}>
          <Ionicons name="information-circle-outline" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* Featured Competition */}
      <View style={styles.featuredSection}>
        <Text style={styles.sectionTitle}>Featured Competition</Text>
        <View style={styles.featuredCard}>
          <Image source={{ uri: COMPETITIONS[0].image }} style={styles.featuredImage} />
          <View style={styles.featuredContent}>
            <View style={styles.featuredHeader}>
              <Text style={styles.featuredTitle}>{COMPETITIONS[0].title}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(COMPETITIONS[0].status) }]}>
                <Text style={styles.statusText}>{getStatusText(COMPETITIONS[0].status)}</Text>
              </View>
            </View>
            <Text style={styles.featuredDescription}>{COMPETITIONS[0].description}</Text>
            <TouchableOpacity
              style={styles.featuredButton}
              onPress={() => handleParticipate(COMPETITIONS[0])}
            >
              <Text style={styles.featuredButtonText}>Enter Competition</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Category Filter */}
      <View style={styles.filterSection}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
        >
          {CATEGORIES.map(renderCategoryChip)}
        </ScrollView>
      </View>

      {/* Competitions List */}
      <View style={styles.competitionsSection}>
        <Text style={styles.sectionTitle}>
          {selectedCategory === 'All' ? 'All Competitions' : `${selectedCategory} Competitions`}
        </Text>
        <FlatList
          data={filteredCompetitions}
          renderItem={renderCompetitionCard}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.competitionsList}
        />
      </View>

      {/* Competition Details Modal */}
      <Modal
        visible={showDetails}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDetails(false)}
      >
        <View style={styles.modalOverlay}>
          {selectedCompetition && (
            <View style={styles.detailsModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Competition Details</Text>
                <TouchableOpacity onPress={() => setShowDetails(false)}>
                  <Ionicons name="close" size={24} color={COLORS.text} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalContent}>
                <Image source={{ uri: selectedCompetition.image }} style={styles.modalImage} />
                <View style={styles.modalDetails}>
                  <Text style={styles.modalCompetitionTitle}>{selectedCompetition.title}</Text>
                  <Text style={styles.modalDescription}>{selectedCompetition.description}</Text>

                  <View style={styles.detailsGrid}>
                    <View style={styles.detailCard}>
                      <Ionicons name="trophy" size={24} color={COLORS.accent} />
                      <Text style={styles.detailCardTitle}>Prize</Text>
                      <Text style={styles.detailCardText}>{selectedCompetition.prize}</Text>
                    </View>
                    <View style={styles.detailCard}>
                      <Ionicons name="calendar" size={24} color={COLORS.warning} />
                      <Text style={styles.detailCardTitle}>Deadline</Text>
                      <Text style={styles.detailCardText}>{selectedCompetition.deadline}</Text>
                    </View>
                    <View style={styles.detailCard}>
                      <Ionicons name="people" size={24} color={COLORS.primary} />
                      <Text style={styles.detailCardTitle}>Participants</Text>
                      <Text style={styles.detailCardText}>{selectedCompetition.participants}</Text>
                    </View>
                    <View style={styles.detailCard}>
                      <Ionicons name="flag" size={24} color={COLORS.success} />
                      <Text style={styles.detailCardTitle}>Status</Text>
                      <Text style={styles.detailCardText}>{getStatusText(selectedCompetition.status)}</Text>
                    </View>
                  </View>
                </View>
              </ScrollView>
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowDetails(false)}
                >
                  <Text style={styles.cancelButtonText}>Close</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.participateModalButton]}
                  onPress={() => {
                    setShowDetails(false);
                    handleParticipate(selectedCompetition);
                  }}
                >
                  <Text style={styles.participateModalButtonText}>Participate</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* Participate Modal */}
      <Modal
        visible={showParticipate}
        transparent
        animationType="slide"
        onRequestClose={() => setShowParticipate(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.participateModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Enter Competition</Text>
              <TouchableOpacity onPress={() => setShowParticipate(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.participateContent}>
              {selectedCompetition && (
                <>
                  <Text style={styles.participateQuestion}>
                    Ready to join "{selectedCompetition.title}"?
                  </Text>
                  <Text style={styles.participateSubtext}>
                    Submit your best outfit and compete for amazing prizes!
                  </Text>

                  <View style={styles.participateSteps}>
                    <View style={styles.stepItem}>
                      <View style={styles.stepNumber}>
                        <Text style={styles.stepNumberText}>1</Text>
                      </View>
                      <Text style={styles.stepText}>Choose your best outfit</Text>
                    </View>
                    <View style={styles.stepItem}>
                      <View style={styles.stepNumber}>
                        <Text style={styles.stepNumberText}>2</Text>
                      </View>
                      <Text style={styles.stepText}>Take a quality photo</Text>
                    </View>
                    <View style={styles.stepItem}>
                      <View style={styles.stepNumber}>
                        <Text style={styles.stepNumberText}>3</Text>
                      </View>
                      <Text style={styles.stepText}>Add a description</Text>
                    </View>
                  </View>

                  <TouchableOpacity style={styles.uploadButton}>
                    <Ionicons name="camera" size={24} color={COLORS.accent} />
                    <Text style={styles.uploadButtonText}>Upload Your Entry</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowParticipate(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleSubmitEntry}
              >
                <Text style={styles.submitButtonText}>Submit Entry</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.md,
    paddingTop: 50,
    backgroundColor: COLORS.surface,
    ...SHADOWS.md,
  },
  title: {
    fontSize: FONTS.sizes.xl,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  infoButton: {
    padding: SIZES.xs,
  },
  featuredSection: {
    padding: SIZES.md,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginBottom: SIZES.md,
  },
  featuredCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.md,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  featuredImage: {
    width: '100%',
    height: 180,
  },
  featuredContent: {
    padding: SIZES.md,
  },
  featuredHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SIZES.sm,
  },
  featuredTitle: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    flex: 1,
    marginRight: SIZES.sm,
  },
  featuredDescription: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    marginBottom: SIZES.md,
  },
  featuredButton: {
    backgroundColor: COLORS.accent,
    padding: SIZES.md,
    borderRadius: SIZES.md,
    alignItems: 'center',
  },
  featuredButtonText: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.medium,
    color: COLORS.surface,
  },
  filterSection: {
    backgroundColor: COLORS.surface,
    paddingVertical: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  categoryScroll: {
    paddingHorizontal: SIZES.md,
  },
  categoryChip: {
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    marginRight: SIZES.sm,
  },
  activeCategoryChip: {
    backgroundColor: COLORS.accent,
  },
  categoryChipText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
  activeCategoryChipText: {
    color: COLORS.surface,
    fontFamily: FONTS.medium,
  },
  competitionsSection: {
    flex: 1,
    padding: SIZES.md,
  },
  competitionsList: {
    paddingBottom: SIZES.xl,
  },
  competitionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.md,
    overflow: 'hidden',
    marginBottom: SIZES.md,
    ...SHADOWS.sm,
  },
  competitionImage: {
    width: '100%',
    height: 150,
  },
  competitionContent: {
    padding: SIZES.md,
  },
  competitionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SIZES.sm,
  },
  competitionTitle: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    flex: 1,
    marginRight: SIZES.sm,
  },
  statusBadge: {
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.xs,
    borderRadius: 12,
  },
  statusText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.surface,
    fontFamily: FONTS.medium,
  },
  competitionDescription: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: SIZES.md,
  },
  competitionDetails: {
    marginBottom: SIZES.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.xs,
  },
  detailText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text,
    marginLeft: SIZES.sm,
  },
  competitionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  participantsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantsText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginLeft: SIZES.sm,
  },
  participateButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.sm,
  },
  participateButtonText: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.medium,
    color: COLORS.surface,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  detailsModal: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: SIZES.xl,
    borderTopRightRadius: SIZES.xl,
    maxHeight: '90%',
  },
  participateModal: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: SIZES.xl,
    borderTopRightRadius: SIZES.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  modalContent: {
    flex: 1,
    padding: SIZES.md,
  },
  modalImage: {
    width: '100%',
    height: 200,
    borderRadius: SIZES.md,
    marginBottom: SIZES.md,
  },
  modalDetails: {
    flex: 1,
  },
  modalCompetitionTitle: {
    fontSize: FONTS.sizes.xl,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginBottom: SIZES.sm,
  },
  modalDescription: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SIZES.lg,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.sm,
  },
  detailCard: {
    flex: 1,
    minWidth: (width / 2) - SIZES.md - SIZES.sm,
    backgroundColor: COLORS.background,
    padding: SIZES.md,
    borderRadius: SIZES.md,
    alignItems: 'center',
  },
  detailCardTitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: SIZES.sm,
  },
  detailCardText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text,
    textAlign: 'center',
    marginTop: SIZES.xs,
  },
  modalActions: {
    flexDirection: 'row',
    padding: SIZES.md,
    gap: SIZES.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  modalButton: {
    flex: 1,
    padding: SIZES.md,
    borderRadius: SIZES.md,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.background,
  },
  cancelButtonText: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.medium,
    color: COLORS.text,
  },
  participateModalButton: {
    backgroundColor: COLORS.accent,
  },
  participateModalButtonText: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.medium,
    color: COLORS.surface,
  },
  participateContent: {
    flex: 1,
    padding: SIZES.md,
    alignItems: 'center',
  },
  participateQuestion: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SIZES.sm,
  },
  participateSubtext: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SIZES.lg,
  },
  participateSteps: {
    width: '100%',
    marginBottom: SIZES.lg,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.md,
  },
  stepNumberText: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.bold,
    color: COLORS.surface,
  },
  stepText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    borderWidth: 2,
    borderColor: COLORS.accent,
    borderStyle: 'dashed',
    padding: SIZES.lg,
    borderRadius: SIZES.md,
    gap: SIZES.sm,
  },
  uploadButtonText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.accent,
    fontFamily: FONTS.medium,
  },
  submitButton: {
    backgroundColor: COLORS.success,
  },
  submitButtonText: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.medium,
    color: COLORS.surface,
  },
});

export default CompetitionScreen;