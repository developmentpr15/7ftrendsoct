import { StyleSheet } from 'react-native';
import { COLORS, SIZES, FONTS, SHADOWS } from '../utils/constants';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 30,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 1,
    backgroundColor: '#7C3AED',
    borderRadius: 8,
    marginRight: 15,
  },
  logoText: {
    fontSize: 20,
    fontFamily: 'Pacifico_400Regular',
    color: '#FDE047',
    fontWeight: '400',
    letterSpacing: 0.6,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  createButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.md,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  sectionContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: '#1a1a1a',
    marginBottom: 16,
  },
  challengeContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    ...SHADOWS.sm,
  },
  pastChallenge: {
    opacity: 0.7,
    backgroundColor: '#f8f9fa',
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  challengeIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  challengeInfo: {
    flex: 1,
  },
  challengeTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  challengeDescription: {
    fontSize: 14,
    color: '#666666',
  },
  endedBadge: {
    backgroundColor: '#e9ecef',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  endedText: {
    fontSize: 12,
    color: '#6c757d',
    fontFamily: FONTS.medium,
  },
  challengeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  participantsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantsText: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 4,
  },
  deadlineText: {
    fontSize: 12,
    color: COLORS.accent,
    fontFamily: FONTS.medium,
  },
  winnerText: {
    fontSize: 12,
    color: '#28a745',
    fontFamily: FONTS.medium,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: FONTS.medium,
    color: '#1a1a1a',
  },
  postButton: {
    fontSize: 16,
    color: COLORS.accent,
    fontFamily: FONTS.medium,
  },

  // Participation Modal
  participationModal: {
    backgroundColor: '#ffffff',
    width: '90%',
    borderRadius: 12,
    padding: 20,
  },
  challengePreview: {
    alignItems: 'center',
    marginVertical: 20,
  },
  previewIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  previewTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: '#1a1a1a',
    marginBottom: 8,
  },
  previewDescription: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 8,
  },
  previewDeadline: {
    fontSize: 12,
    color: COLORS.accent,
    fontFamily: FONTS.medium,
  },
  participationActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelParticipationButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  cancelParticipationText: {
    fontSize: 16,
    color: '#666666',
    fontFamily: FONTS.medium,
  },
  joinParticipationButton: {
    flex: 1,
    backgroundColor: COLORS.accent,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
  },
  joinParticipationText: {
    fontSize: 16,
    color: '#ffffff',
    fontFamily: FONTS.medium,
  },

  // Create Challenge Modal
  createChallengeModal: {
    backgroundColor: '#ffffff',
    width: '90%',
    maxHeight: '80%',
    borderRadius: 12,
    padding: 20,
  },
  formContainer: {
    marginVertical: 20,
  },
  label: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: '#1a1a1a',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1a1a1a',
    marginBottom: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  iconSelector: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  iconOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  iconSelected: {
    backgroundColor: COLORS.accent,
  },
  iconText: {
    fontSize: 24,
  },
});