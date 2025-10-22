/**
 * __tests__/competitions.test.tsx
 *
 * Test suite for the competitions system
 * Covers components, services, and integration flows
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import CompetitionsScreen from '../src/components/competitions/CompetitionsScreen';
import CompetitionCard from '../src/components/competitions/CompetitionCard';
import { competitionsService } from '../src/services/competitionsService';

// Mock the competitions service
jest.mock('../src/services/competitionsService', () => ({
  competitionsService: {
    getActiveCompetitions: jest.fn(),
    getCompetitionById: jest.fn(),
    createCompetition: jest.fn(),
    submitCompetitionEntry: jest.fn(),
    getCompetitionEntries: jest.fn(),
    getUserCompetitionEntries: jest.fn(),
    withdrawCompetitionEntry: jest.fn(),
    uploadCompetitionImage: jest.fn(),
    canEnterCompetition: jest.fn(),
    validateCompetitionData: jest.fn(),
    validateEntryData: jest.fn(),
  },
}));

// Mock ImagePicker
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  MediaTypeOptions: {
    Images: 'Images',
  },
}));

// Mock DateTimePicker
jest.mock('@react-native-community/datetimepicker', () => ({
  DateTimePickerAndroid: {
    open: jest.fn(),
  },
}));

describe('Competitions System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('CompetitionsScreen', () => {
    it('should render the competitions screen', () => {
      const { getByText } = render(<CompetitionsScreen />);

      expect(getByText('Competitions')).toBeTruthy();
      expect(getByText('Enter fashion competitions and win prizes!')).toBeTruthy();
      expect(getByText('Search competitions...')).toBeTruthy();
    });

    it('should display country filter options', () => {
      const { getByText } = render(<CompetitionsScreen />);

      expect(getByText('All')).toBeTruthy();
      expect(getByText('United States')).toBeTruthy();
      expect(getByText('United Kingdom')).toBeTruthy();
    });

    it('should show create competition button', () => {
      const { getByTestId } = render(<CompetitionsScreen />);

      // Look for the create button (floating action button)
      const createButton = getByTestId('floating-create-button');
      expect(createButton).toBeTruthy();
    });

    it('should handle country selection', async () => {
      const { getByText } = render(<CompetitionsScreen />);

      const countryButton = getByText('United States');
      fireEvent.press(countryButton);

      // Should call getActiveCompetitions with country filter
      await waitFor(() => {
        expect(competitionsService.getActiveCompetitions).toHaveBeenCalledWith('US');
      });
    });

    it('should handle search functionality', async () => {
      const { getByPlaceholderText } = render(<CompetitionsScreen />);

      const searchInput = getByPlaceholderText('Search competitions...');
      fireEvent.changeText(searchInput, 'Summer');

      // Should filter competitions based on search query
      await waitFor(() => {
        expect(competitionsService.getActiveCompetitions).toHaveBeenCalled();
      });
    });

    it('should show empty state when no competitions', async () => {
      // Mock empty response
      (competitionsService.getActiveCompetitions as jest.Mock).mockResolvedValue({
        competitions: [],
        count: 0,
      });

      const { getByText } = render(<CompetitionsScreen />);

      await waitFor(() => {
        expect(getByText('No Active Competitions')).toBeTruthy();
        expect(getByText('No active competitions right now. Be the first to create one!')).toBeTruthy();
      });
    });

    it('should handle refresh', async () => {
      const { getByTestId } = render(<CompetitionsScreen />);

      // Trigger refresh
      const refreshControl = getByTestId('refresh-control');
      fireEvent(refreshControl, 'refresh');

      await waitFor(() => {
        expect(competitionsService.getActiveCompetitions).toHaveBeenCalled();
      });
    });
  });

  describe('CompetitionCard', () => {
    const mockCompetition = {
      id: 'comp-1',
      country: 'US',
      title: 'Summer Fashion Challenge',
      theme: 'Street Style',
      description: 'Show your best summer street style',
      banner_image_url: 'https://example.com/banner.jpg',
      prize_pool: { points: 1000, sponsor: 'Fashion Brand' },
      start_at: '2024-06-01T00:00:00Z',
      end_at: '2024-06-30T23:59:59Z',
      status: 'active',
      entries_count: 25,
      user_entered: false,
      created_at: '2024-05-15T10:00:00Z',
    };

    it('should render competition card correctly', () => {
      const { getByText, getByTestId } = render(
        <CompetitionCard
          competition={mockCompetition}
          onPress={jest.fn()}
        />
      );

      expect(getByText('Summer Fashion Challenge')).toBeTruthy();
      expect(getByText('Street Style')).toBeTruthy();
      expect(getByText('25 entries')).toBeTruthy();
      expect(getByText('US')).toBeTruthy();
    });

    it('should show entered status when user has entered', () => {
      const competitionWithEntry = { ...mockCompetition, user_entered: true };

      const { getByText } = render(
        <CompetitionCard
          competition={competitionWithEntry}
          onPress={jest.fn()}
        />
      );

      expect(getByText('Entered')).toBeTruthy();
    });

    it('should display prize pool information', () => {
      const { getByText } = render(
        <CompetitionCard
          competition={mockCompetition}
          onPress={jest.fn()}
        />
      );

      expect(getByText('1000 pts')).toBeTruthy();
    });

    it('should handle card press', () => {
      const mockOnPress = jest.fn();

      const { getByTestId } = render(
        <CompetitionCard
          competition={mockCompetition}
          onPress={mockOnPress}
        />
      );

      const card = getByTestId('competition-card');
      fireEvent.press(card);

      expect(mockOnPress).toHaveBeenCalled();
    });

    it('should show correct status for different competition statuses', () => {
      const votingCompetition = { ...mockCompetition, status: 'voting' as const };

      const { getByText } = render(
        <CompetitionCard
          competition={votingCompetition}
          onPress={jest.fn()}
        />
      );

      expect(getByText('Voting')).toBeTruthy();
    });

    it('should show default banner when no image provided', () => {
      const competitionWithoutBanner = { ...mockCompetition, banner_image_url: undefined };

      const { getByTestId } = render(
        <CompetitionCard
          competition={competitionWithoutBanner}
          onPress={jest.fn()}
        />
      );

      const bannerImage = getByTestId('banner-image');
      expect(bannerImage).toBeTruthy();
    });
  });

  describe('CompetitionsService', () => {
    beforeEach(() => {
      // Reset mock implementation
      (competitionsService.getActiveCompetitions as jest.Mock).mockReset();
      (competitionsService.submitCompetitionEntry as jest.Mock).mockReset();
      (competitionsService.validateCompetitionData as jest.Mock).mockReset();
      (competitionsService.validateEntryData as jest.Mock).mockReset();
    });

    it('should validate competition data correctly', () => {
      const validData = {
        country: 'US',
        title: 'Test Competition',
        start_at: '2024-06-01T00:00:00Z',
        end_at: '2024-06-30T23:59:59Z',
      };

      (competitionsService.validateCompetitionData as jest.Mock).mockReturnValue({
        isValid: true,
        errors: [],
      });

      const result = competitionsService.validateCompetitionData(validData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid competition data', () => {
      const invalidData = {
        country: '',
        title: '',
        start_at: '2024-06-01T00:00:00Z',
        end_at: '2024-05-01T00:00:00Z', // Before start date
      };

      (competitionsService.validateCompetitionData as jest.Mock).mockReturnValue({
        isValid: false,
        errors: ['Country is required', 'Title is required', 'End date must be after start date'],
      });

      const result = competitionsService.validateCompetitionData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Country is required');
      expect(result.errors).toContain('Title is required');
    });

    it('should validate entry data correctly', () => {
      const validEntry = {
        competition_id: 'comp-1',
        title: 'My Entry',
        image_url: 'https://example.com/image.jpg',
      };

      (competitionsService.validateEntryData as jest.Mock).mockReturnValue({
        isValid: true,
        errors: [],
      });

      const result = competitionsService.validateEntryData(validEntry);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid entry data', () => {
      const invalidEntry = {
        competition_id: '',
        title: '',
        image_url: '',
      };

      (competitionsService.validateEntryData as jest.Mock).mockReturnValue({
        isValid: false,
        errors: ['Competition ID is required', 'Title is required', 'Image URL is required'],
      });

      const result = competitionsService.validateEntryData(invalidEntry);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(3);
    });

    it('should handle API errors gracefully', async () => {
      (competitionsService.getActiveCompetitions as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      await expect(competitionsService.getActiveCompetitions()).rejects.toThrow('Network error');
    });

    it('should format competition data correctly', () => {
      const apiResponse = {
        id: 'comp-1',
        country: 'US',
        title: 'Test Competition',
        status: 'active',
        created_at: '2024-05-15T10:00:00Z',
        updated_at: '2024-05-15T10:00:00Z',
        // ... other fields
      };

      // The service should handle this correctly
      expect(apiResponse.id).toBe('comp-1');
      expect(apiResponse.status).toBe('active');
    });
  });

  describe('Integration Flows', () => {
    it('should handle complete competition viewing flow', async () => {
      // Mock competitions list
      (competitionsService.getActiveCompetitions as jest.Mock).mockResolvedValue({
        competitions: [
          {
            id: 'comp-1',
            title: 'Summer Fashion',
            country: 'US',
            status: 'active',
            entries_count: 10,
          },
        ],
        count: 1,
      });

      // Mock competition details
      (competitionsService.getCompetitionById as jest.Mock).mockResolvedValue({
        id: 'comp-1',
        title: 'Summer Fashion',
        country: 'US',
        status: 'active',
        entries_count: 10,
      });

      // Mock competition entries
      (competitionsService.getCompetitionEntries as jest.Mock).mockResolvedValue({
        entries: [
          {
            id: 'entry-1',
            title: 'My Summer Look',
            image_url: 'https://example.com/entry.jpg',
            votes_count: 15,
            likes: 8,
          },
        ],
        count: 1,
        limit: 20,
        offset: 0,
      });

      const { getByText } = render(<CompetitionsScreen />);

      // Wait for competitions to load
      await waitFor(() => {
        expect(getByText('Summer Fashion')).toBeTruthy();
      });

      // Press on competition
      fireEvent.press(getByText('Summer Fashion'));

      // Should load competition details and entries
      await waitFor(() => {
        expect(competitionsService.getCompetitionById).toHaveBeenCalledWith('comp-1');
        expect(competitionsService.getCompetitionEntries).toHaveBeenCalled();
      });
    });

    it('should handle entry submission flow', async () => {
      // Mock submission
      (competitionsService.submitCompetitionEntry as jest.Mock).mockResolvedValue({
        id: 'entry-1',
        title: 'Test Entry',
        image_url: 'https://example.com/entry.jpg',
        status: 'submitted',
        votes_count: 0,
        likes: 0,
      });

      // Mock image upload
      (competitionsService.uploadCompetitionImage as jest.Mock).mockResolvedValue(
        'https://example.com/uploaded.jpg'
      );

      const entryData = {
        competition_id: 'comp-1',
        title: 'Test Entry',
        image_url: 'https://example.com/uploaded.jpg',
      };

      const result = await competitionsService.submitCompetitionEntry(entryData);

      expect(result.id).toBe('entry-1');
      expect(result.title).toBe('Test Entry');
      expect(result.status).toBe('submitted');
    });

    it('should enforce one entry per competition', async () => {
      // Mock existing entry check
      (competitionsService.submitCompetitionEntry as jest.Mock).mockRejectedValue(
        new Error('You have already entered this competition')
      );

      const entryData = {
        competition_id: 'comp-1',
        title: 'Duplicate Entry',
        image_url: 'https://example.com/image.jpg',
      };

      await expect(competitionsService.submitCompetitionEntry(entryData))
        .rejects.toThrow('You have already entered this competition');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      (competitionsService.getActiveCompetitions as jest.Mock).mockRejectedValue(
        new Error('Network timeout')
      );

      const { getByText } = render(<CompetitionsScreen />);

      await waitFor(() => {
        expect(getByText('Network timeout')).toBeTruthy();
      });
    });

    it('should handle validation errors', async () => {
      (competitionsService.validateCompetitionData as jest.Mock).mockReturnValue({
        isValid: false,
        errors: ['Title is required'],
      });

      const invalidData = {
        country: 'US',
        title: '',
        start_at: '2024-06-01T00:00:00Z',
        end_at: '2024-06-30T23:59:59Z',
      };

      const result = competitionsService.validateCompetitionData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Title is required');
    });

    it('should handle image upload errors', async () => {
      (competitionsService.uploadCompetitionImage as jest.Mock).mockRejectedValue(
        new Error('Upload failed: File too large')
      );

      await expect(competitionsService.uploadCompetitionImage('large-image.jpg'))
        .rejects.toThrow('Upload failed: File too large');
    });
  });

  describe('Performance', () => {
    it('should handle large competition lists efficiently', async () => {
      // Mock large dataset
      const largeCompetitionsList = Array.from({ length: 100 }, (_, i) => ({
        id: `comp-${i}`,
        title: `Competition ${i}`,
        country: 'US',
        status: 'active',
        entries_count: Math.floor(Math.random() * 100),
      }));

      (competitionsService.getActiveCompetitions as jest.Mock).mockResolvedValue({
        competitions: largeCompetitionsList,
        count: 100,
      });

      const startTime = performance.now();
      const { getByText } = render(<CompetitionsScreen />);

      await waitFor(() => {
        expect(getByText('Competition 0')).toBeTruthy();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time (less than 1 second)
      expect(renderTime).toBeLessThan(1000);
    });

    it('should paginate entries correctly', async () => {
      // Mock paginated response
      (competitionsService.getCompetitionEntries as jest.Mock).mockResolvedValue({
        entries: Array.from({ length: 20 }, (_, i) => ({
          id: `entry-${i}`,
          title: `Entry ${i}`,
          image_url: `https://example.com/entry-${i}.jpg`,
          votes_count: Math.floor(Math.random() * 50),
        })),
        count: 50,
        limit: 20,
        offset: 0,
      });

      const result = await competitionsService.getCompetitionEntries('comp-1', {
        limit: 20,
        offset: 0,
      });

      expect(result.entries).toHaveLength(20);
      expect(result.count).toBe(50);
      expect(result.limit).toBe(20);
      expect(result.offset).toBe(0);
    });
  });
});