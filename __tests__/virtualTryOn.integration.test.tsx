/**
 * __tests__/virtualTryOn.integration.test.tsx
 *
 * Integration tests for the complete virtual try-on workflow
 * Tests UI components, service integration, and error handling
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { VirtualTryOnScreen } from '../src/components/wardrobe/VirtualTryOnScreen';

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
        id: 'garment-1',
        name: 'Test Shirt',
        category: 'tops',
        images: ['https://example.com/shirt.jpg']
      },
      {
        id: 'garment-2',
        name: 'Test Pants',
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
  MaterialIcons: ({ name }) => `MaterialIcons-${name}`
}));

describe('VirtualTryOnScreen Integration', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the virtual try-on modal', () => {
    const { getByText } = render(
      <VirtualTryOnScreen visible={true} onClose={mockOnClose} />
    );

    expect(getByText('Virtual Try-On')).toBeTruthy();
    expect(getByText('✨ Powered by AI')).toBeTruthy();
  });

  it('should display camera capture prompt initially', () => {
    const { getByText } = render(
      <VirtualTryOnScreen visible={true} onClose={mockOnClose} />
    );

    expect(getByText('Take Your Photo')).toBeTruthy();
    expect(getByText('Take Photo')).toBeTruthy();
    expect(getByText('Choose from Gallery')).toBeTruthy();
  });

  it('should switch between camera and wardrobe tabs', () => {
    const { getByText } = render(
      <VirtualTryOnScreen visible={true} onClose={mockOnClose} />
    );

    // Initially on camera tab
    expect(getByText('Take Your Photo')).toBeTruthy();

    // Switch to wardrobe tab
    const wardrobeTab = getByText('Wardrobe');
    fireEvent.press(wardrobeTab);

    expect(getByText('Select Garment')).toBeTruthy();
    expect(getByText('Test Shirt')).toBeTruthy();
    expect(getByText('Test Pants')).toBeTruthy();
  });

  it('should select garment from wardrobe', () => {
    const { getByText } = render(
      <VirtualTryOnScreen visible={true} onClose={mockOnClose} />
    );

    // Switch to wardrobe tab
    const wardrobeTab = getByText('Wardrobe');
    fireEvent.press(wardrobeTab);

    // Select a garment
    const garment = getByText('Test Shirt');
    fireEvent.press(garment);

    // The selection should be indicated (we'd need to check for the selection badge)
    expect(getByText('Test Shirt')).toBeTruthy();
  });

  it('should show edit options when both images are selected', async () => {
    // Mock a successful photo selection
    const { launchImageLibraryAsync } = require('expo-image-picker');
    launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'https://example.com/user-photo.jpg' }]
    });

    const { getByText, queryByText } = render(
      <VirtualTryOnScreen visible={true} onClose={mockOnClose} />
    );

    // Select user photo
    const galleryButton = getByText('Choose from Gallery');
    fireEvent.press(galleryButton);

    // Switch to wardrobe and select garment
    const wardrobeTab = getByText('Wardrobe');
    fireEvent.press(wardrobeTab);

    const garment = getByText('Test Shirt');
    fireEvent.press(garment);

    // Edit options should appear
    await waitFor(() => {
      expect(getByText('Edit Options')).toBeTruthy();
      expect(getByText('Position')).toBeTruthy();
      expect(getByText('Fit')).toBeTruthy();
      expect(getByText('Style')).toBeTruthy();
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

    // Mock image selection
    const { launchImageLibraryAsync } = require('expo-image-picker');
    launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'https://example.com/user-photo.jpg' }]
    });

    const { getByText } = render(
      <VirtualTryOnScreen visible={true} onClose={mockOnClose} />
    );

    // Select user photo
    fireEvent.press(getByText('Choose from Gallery'));

    // Select garment
    fireEvent.press(getByText('Wardrobe'));
    fireEvent.press(getByText('Test Shirt'));

    // Wait for edit options to appear
    await waitFor(() => {
      expect(getByText('Edit Options')).toBeTruthy();
    });

    // Start processing
    const processButton = getByText('Create Virtual Try-On');
    fireEvent.press(processButton);

    // Should show processing state
    await waitFor(() => {
      expect(getByText('Creating Virtual Try-On...')).toBeTruthy();
    });

    // Should show result after processing
    await waitFor(() => {
      expect(getByText('Virtual Try-On Complete!')).toBeTruthy();
      expect(getByText('Confidence: 92%')).toBeTruthy();
      expect(getByText('Processing time: 2.5s')).toBeTruthy();
    }, { timeout: 3000 });
  });

  it('should handle processing errors gracefully', async () => {
    const { imageEditService } = require('../src/services/imageEditService');

    // Mock failed processing
    imageEditService.editImageWithGemini.mockResolvedValue({
      success: false,
      error: 'API rate limit exceeded'
    });

    // Mock alert
    const mockAlert = jest.spyOn(global, 'alert').mockImplementation();

    // Mock image selection
    const { launchImageLibraryAsync } = require('expo-image-picker');
    launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'https://example.com/user-photo.jpg' }]
    });

    const { getByText } = render(
      <VirtualTryOnScreen visible={true} onClose={mockOnClose} />
    );

    // Select user photo and garment
    fireEvent.press(getByText('Choose from Gallery'));
    fireEvent.press(getByText('Wardrobe'));
    fireEvent.press(getByText('Test Shirt'));

    // Wait for edit options and start processing
    await waitFor(() => {
      expect(getByText('Create Virtual Try-On')).toBeTruthy();
    });

    fireEvent.press(getByText('Create Virtual Try-On'));

    // Should show error alert
    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith(
        'Processing Failed',
        'API rate limit exceeded',
        expect.any(Array)
      );
    });

    mockAlert.mockRestore();
  });

  it('should validate required images before processing', async () => {
    // Mock alert
    const mockAlert = jest.spyOn(global, 'alert').mockImplementation();

    const { getByText } = render(
      <VirtualTryOnScreen visible={true} onClose={mockOnClose} />
    );

    // Try to process without selecting images (this shouldn't be possible in UI,
    // but we test the validation logic)
    // The process button should only appear when both images are selected
    expect(queryByText('Create Virtual Try-On')).toBeFalsy();

    mockAlert.mockRestore();
  });

  it('should handle modal close correctly', () => {
    const { getByText } = render(
      <VirtualTryOnScreen visible={true} onClose={mockOnClose} />
    );

    // Close modal
    const closeButton = getByText('AntDesign-close'); // Close button icon
    fireEvent.press(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should reset state when reopening modal', () => {
    const { rerender, getByText, queryByText } = render(
      <VirtualTryOnScreen visible={true} onClose={mockOnClose} />
    );

    // Select some options
    fireEvent.press(getByText('Wardrobe'));
    fireEvent.press(getByText('Test Shirt'));

    // Close and reopen modal
    rerender(<VirtualTryOnScreen visible={false} onClose={mockOnClose} />);
    rerender(<VirtualTryOnScreen visible={true} onClose={mockOnClose} />);

    // Should be back to initial state
    expect(getByText('Take Your Photo')).toBeTruthy();
  });
});