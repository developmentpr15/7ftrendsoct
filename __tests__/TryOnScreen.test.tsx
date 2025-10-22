/**
 * __tests__/TryOnScreen.test.tsx
 *
 * Test suite for the TryOnScreen component
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import TryOnScreen from '../src/components/tryon/TryOnScreen';

// Mock dependencies
jest.mock('../src/services/imageEditService', () => ({
  imageEditService: {
    editImageWithGemini: jest.fn(),
    saveEditHistory: jest.fn()
  }
}));

jest.mock('../src/store/wardrobeStore', () => ({
  useWardrobeStore: () => ({
    wardrobeItems: [
      {
        id: 'shirt-1',
        name: 'Casual Shirt',
        category: 'tops',
        images: ['https://example.com/shirt.jpg']
      },
      {
        id: 'pants-1',
        name: 'Denim Jeans',
        category: 'bottoms',
        images: ['https://example.com/pants.jpg']
      }
    ]
  })
}));

jest.mock('expo-camera', () => ({
  useCameraPermissions: () => [true, jest.fn()],
  CameraView: ({ children }) => children,
}));

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  MediaTypeOptions: {
    Images: 'Images'
  }
}));

jest.mock('@expo/vector-icons', () => ({
  AntDesign: ({ name }) => `AntDesign-${name}`,
  MaterialIcons: ({ name }) => `MaterialIcons-${name}`,
  Ionicons: ({ name }) => `Ionicons-${name}`,
}));

describe('TryOnScreen', () => {
  const mockOnClose = jest.fn();
  const mockOnSaveToFeed = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the try-on modal', () => {
    const { getByText } = render(
      <TryOnScreen
        visible={true}
        onClose={mockOnClose}
        onSaveToFeed={mockOnSaveToFeed}
      />
    );

    expect(getByText('Virtual Try-On')).toBeTruthy();
    expect(getByText('AI Powered')).toBeTruthy();
  });

  it('should display photo upload section initially', () => {
    const { getByText } = render(
      <TryOnScreen
        visible={true}
        onClose={mockOnClose}
        onSaveToFeed={mockOnSaveToFeed}
      />
    );

    expect(getByText('Your Photo')).toBeTruthy();
    expect(getByText('Add your photo')).toBeTruthy();
    expect(getByText('Take Photo')).toBeTruthy();
    expect(getByText('Choose Photo')).toBeTruthy();
  });

  it('should display clothing selection section', () => {
    const { getByText } = render(
      <TryOnScreen
        visible={true}
        onClose={mockOnClose}
        onSaveToFeed={mockOnSaveToFeed}
      />
    );

    expect(getByText('Select Clothing')).toBeTruthy();
    expect(getByText('Casual Shirt')).toBeTruthy();
    expect(getByText('Denim Jeans')).toBeTruthy();
  });

  it('should show try-on options after selecting photo and clothing', async () => {
    // Mock image picker
    const { launchImageLibraryAsync } = require('expo-image-picker');
    launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'https://example.com/user-photo.jpg' }]
    });

    const { getByText, queryByText } = render(
      <TryOnScreen
        visible={true}
        onClose={mockOnClose}
        onSaveToFeed={mockOnSaveToFeed}
      />
    );

    // Select user photo
    fireEvent.press(getByText('Choose Photo'));

    // Select clothing
    fireEvent.press(getByText('Casual Shirt'));

    // Try-on options should appear
    await waitFor(() => {
      expect(getByText('Try-On Options')).toBeTruthy();
      expect(getByText('Position')).toBeTruthy();
      expect(getByText('Custom Instructions (Optional)')).toBeTruthy();
    });
  });

  it('should show process button when both photo and clothing are selected', async () => {
    // Mock image picker
    const { launchImageLibraryAsync } = require('expo-image-picker');
    launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'https://example.com/user-photo.jpg' }]
    });

    const { getByText } = render(
      <TryOnScreen
        visible={true}
        onClose={mockOnClose}
        onSaveToFeed={mockOnSaveToFeed}
      />
    );

    // Select user photo
    fireEvent.press(getByText('Choose Photo'));

    // Select clothing
    fireEvent.press(getByText('Casual Shirt'));

    // Process button should appear
    await waitFor(() => {
      expect(getByText('Try On This Look')).toBeTruthy();
    });
  });

  it('should handle virtual try-on processing', async () => {
    const { imageEditService } = require('../src/services/imageEditService');

    // Mock successful processing
    imageEditService.editImageWithGemini.mockResolvedValue({
      success: true,
      compositeImageUrl: 'https://example.com/composite.jpg',
      editedImageUrl: 'data:image/jpeg;base64,mock-image-data',
      confidence: 0.92,
      processingTime: 2500
    });

    imageEditService.saveEditHistory.mockResolvedValue('history-id');

    // Mock image picker
    const { launchImageLibraryAsync } = require('expo-image-picker');
    launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'https://example.com/user-photo.jpg' }]
    });

    const { getByText } = render(
      <TryOnScreen
        visible={true}
        onClose={mockOnClose}
        onSaveToFeed={mockOnSaveToFeed}
      />
    );

    // Select user photo and clothing
    fireEvent.press(getByText('Choose Photo'));
    fireEvent.press(getByText('Casual Shirt'));

    // Wait for process button and click it
    await waitFor(() => {
      expect(getByText('Try On This Look')).toBeTruthy();
    });

    fireEvent.press(getByText('Try On This Look'));

    // Should show processing state
    await waitFor(() => {
      expect(getByText('Creating Your Try-On...')).toBeTruthy();
    });

    // Should show result after processing
    await waitFor(() => {
      expect(getByText('Try-On Complete!')).toBeTruthy();
    }, { timeout: 3000 });
  });

  it('should handle save to feed functionality', async () => {
    const { imageEditService } = require('../src/services/imageEditService');

    // Mock successful processing
    imageEditService.editImageWithGemini.mockResolvedValue({
      success: true,
      compositeImageUrl: 'https://example.com/composite.jpg',
      editedImageUrl: 'data:image/jpeg;base64,mock-image-data',
      confidence: 0.92,
      processingTime: 2500
    });

    imageEditService.saveEditHistory.mockResolvedValue('history-id');

    // Mock image picker
    const { launchImageLibraryAsync } = require('expo-image-picker');
    launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'https://example.com/user-photo.jpg' }]
    });

    const { getByText, getByPlaceholderText } = render(
      <TryOnScreen
        visible={true}
        onClose={mockOnClose}
        onSaveToFeed={mockOnSaveToFeed}
      />
    );

    // Complete the try-on process
    fireEvent.press(getByText('Choose Photo'));
    fireEvent.press(getByText('Casual Shirt'));

    await waitFor(() => {
      expect(getByText('Try On This Look')).toBeTruthy();
    });

    fireEvent.press(getByText('Try On This Look'));

    await waitFor(() => {
      expect(getByText('Try-On Complete!')).toBeTruthy();
    });

    // Click save to feed
    fireEvent.press(getByText('Save to Feed'));

    // Should show save modal
    await waitFor(() => {
      expect(getByText('Save to Feed')).toBeTruthy();
      expect(getByText('Add a caption for your post')).toBeTruthy();
      expect(getByPlaceholderText('What do you think of this look?')).toBeTruthy();
    });

    // Add caption and save
    fireEvent.changeText(getByPlaceholderText('What do you think of this look?'), 'Love this new look!');
    fireEvent.press(getByText('Post to Feed'));

    // Should call save to feed function
    await waitFor(() => {
      expect(mockOnSaveToFeed).toHaveBeenCalledWith(
        'https://example.com/composite.jpg',
        'Love this new look!'
      );
    });
  });

  it('should handle modal close correctly', () => {
    const { getByText } = render(
      <TryOnScreen
        visible={true}
        onClose={mockOnClose}
        onSaveToFeed={mockOnSaveToFeed}
      />
    );

    // Close modal
    const closeButton = getByText('AntDesign-close');
    fireEvent.press(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should show position options', () => {
    const { getByText } = render(
      <TryOnScreen
        visible={true}
        onClose={mockOnClose}
        onSaveToFeed={mockOnSaveToFeed}
      />
    );

    // Initially position options are not visible until photo and clothing are selected
    expect(() => getByText('Full Body')).toThrow();
  });

  it('should allow position selection when options are shown', async () => {
    // Mock image picker
    const { launchImageLibraryAsync } = require('expo-image-picker');
    launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'https://example.com/user-photo.jpg' }]
    });

    const { getByText } = render(
      <TryOnScreen
        visible={true}
        onClose={mockOnClose}
        onSaveToFeed={mockOnSaveToFeed}
      />
    );

    // Select user photo and clothing to show options
    fireEvent.press(getByText('Choose Photo'));
    fireEvent.press(getByText('Casual Shirt'));

    await waitFor(() => {
      expect(getByText('Try-On Options')).toBeTruthy();
      expect(getByText('Full Body')).toBeTruthy();
      expect(getByText('Upper Body')).toBeTruthy();
      expect(getByText('Lower Body')).toBeTruthy();
    });

    // Test position selection
    fireEvent.press(getByText('Upper Body'));
    // Position should be selected (visual feedback would be shown in UI)
  });
});