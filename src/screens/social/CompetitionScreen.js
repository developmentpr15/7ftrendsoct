import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../store/appStore';
import { COLORS } from '../../utils/constants';
import styles from '../../styles/competitionStyles';

const CompetitionScreen = () => {
  const { challenges, joinChallenge } = useAppStore();
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [participationModalVisible, setParticipationModalVisible] = useState(false);
  const [createChallengeVisible, setCreateChallengeVisible] = useState(false);
  const [isAdmin, setIsAdmin] = useState(true);

  const [challengeTitle, setChallengeTitle] = useState('');
  const [challengeDescription, setChallengeDescription] = useState('');
  const [challengeIcon, setChallengeIcon] = useState('🎯');
  const [challengeDeadline, setChallengeDeadline] = useState('7 days');

  const handleJoinChallenge = (challenge) => {
    setSelectedChallenge(challenge);
    setParticipationModalVisible(true);
  };

  const submitParticipation = () => {
    if (selectedChallenge) {
      joinChallenge(selectedChallenge.id);
      setParticipationModalVisible(false);
      setSelectedChallenge(null);
    }
  };

  const submitChallenge = () => {
    if (challengeTitle.trim() && challengeDescription.trim()) {
      // Create new challenge logic here
      setChallengeTitle('');
      setChallengeDescription('');
      setChallengeIcon('🎯');
      setChallengeDeadline('7 days');
      setCreateChallengeVisible(false);
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
              style={styles.createButton}
              onPress={() => setCreateChallengeVisible(true)}
            >
              <Ionicons name="add" size={24} color={COLORS.surface} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Active Challenges */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>🏆 Active Challenges</Text>
          {challenges.filter(c => c.isActive).map((challenge) => (
            <TouchableOpacity
              key={challenge.id}
              style={styles.challengeContainer}
              onPress={() => handleJoinChallenge(challenge)}
            >
              <View style={styles.challengeHeader}>
                <Text style={styles.challengeIcon}>{challenge.icon}</Text>
                <View style={styles.challengeInfo}>
                  <Text style={styles.challengeTitle}>{challenge.title}</Text>
                  <Text style={styles.challengeDescription}>{challenge.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
              </View>
              <View style={styles.challengeFooter}>
                <View style={styles.participantsInfo}>
                  <Ionicons name="people" size={16} color={COLORS.textSecondary} />
                  <Text style={styles.participantsText}>{challenge.participants} participants</Text>
                </View>
                <Text style={styles.deadlineText}>{challenge.deadline}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Past Challenges */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>📋 Past Challenges</Text>
          {challenges.filter(c => !c.isActive).map((challenge) => (
            <View
              key={challenge.id}
              style={[styles.challengeContainer, styles.pastChallenge]}
            >
              <View style={styles.challengeHeader}>
                <Text style={styles.challengeIcon}>{challenge.icon}</Text>
                <View style={styles.challengeInfo}>
                  <Text style={styles.challengeTitle}>{challenge.title}</Text>
                  <Text style={styles.challengeDescription}>{challenge.description}</Text>
                </View>
                <View style={styles.endedBadge}>
                  <Text style={styles.endedText}>Ended</Text>
                </View>
              </View>
              <View style={styles.challengeFooter}>
                <View style={styles.participantsInfo}>
                  <Ionicons name="people" size={16} color={COLORS.textSecondary} />
                  <Text style={styles.participantsText}>{challenge.participants} participants</Text>
                </View>
                <Text style={styles.winnerText}>Winner announced</Text>
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

            {selectedChallenge && (
              <View style={styles.challengePreview}>
                <Text style={styles.previewIcon}>{selectedChallenge.icon}</Text>
                <Text style={styles.previewTitle}>{selectedChallenge.title}</Text>
                <Text style={styles.previewDescription}>{selectedChallenge.description}</Text>
                <Text style={styles.previewDeadline}>{selectedChallenge.deadline}</Text>
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

      {/* Create Challenge Modal (Admin Only) */}
      <Modal
        visible={createChallengeVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCreateChallengeVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.createChallengeModal}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setCreateChallengeVisible(false)}>
                <Ionicons name="close" size={24} color="#1a1a1a" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Create New Challenge</Text>
              <TouchableOpacity onPress={submitChallenge}>
                <Text style={styles.postButton}>Create</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formContainer}>
              <Text style={styles.label}>Challenge Title</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter challenge title"
                placeholderTextColor="#999999"
                value={challengeTitle}
                onChangeText={setChallengeTitle}
              />

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe the challenge"
                placeholderTextColor="#999999"
                value={challengeDescription}
                onChangeText={setChallengeDescription}
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
                      challengeIcon === icon && styles.iconSelected
                    ]}
                    onPress={() => setChallengeIcon(icon)}
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
                value={challengeDeadline}
                onChangeText={setChallengeDeadline}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default CompetitionScreen;