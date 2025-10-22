/**
 * __tests__/imageEditService.test.ts
 *
 * Test suite for the image editing service
 * Validates Gemini 2.5 Flash Image API integration
 */

import { imageEditService, ImageEditRequest } from '../src/services/imageEditService';

// Mock the Supabase client
jest.mock('../src/utils/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } }
      })
    },
    storage: {
      from: jest.fn().mockReturnValue({
        upload: jest.fn().mockResolvedValue({
          data: { path: 'test-path' },
          error: null
        }),
        getPublicUrl: jest.fn().mockReturnValue({
          data: { publicUrl: 'https://test-url.com/image.jpg' }
        })
      })
    },
    from: jest.fn().mockReturnValue({
      insert: jest.fn().mockResolvedValue({
        data: { id: 'test-history-id' },
        error: null
      })
    })
  }
}));

// Mock fetch for Gemini API calls
global.fetch = jest.fn();

describe('ImageEditService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set mock environment variable
    process.env.EXPO_PUBLIC_GEMINI_API_KEY = 'test-gemini-key';
  });

  describe('validateEditRequest', () => {
    it('should pass validation with valid request', async () => {
      const validRequest: ImageEditRequest = {
        userImage: 'https://example.com/user.jpg',
        garmentImage: 'https://example.com/garment.jpg',
        position: 'full-body',
        fit: 'regular',
        style: 'realistic',
        instructions: 'Test instruction'
      };

      // Mock successful API response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{
                inline_data: { data: 'mock-base64-image-data' }
              }]
            }
          }]
        })
      });

      const result = await imageEditService.editImageWithGemini(validRequest);
      expect(result).toBeDefined();
    });

    it('should fail validation with missing user image', async () => {
      const invalidRequest: ImageEditRequest = {
        userImage: '',
        garmentImage: 'https://example.com/garment.jpg'
      };

      const result = await imageEditService.editImageWithGemini(invalidRequest);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Validation failed');
    });

    it('should fail validation with invalid position', async () => {
      const invalidRequest: ImageEditRequest = {
        userImage: 'https://example.com/user.jpg',
        garmentImage: 'https://example.com/garment.jpg',
        position: 'invalid-position'
      };

      const result = await imageEditService.editImageWithGemini(invalidRequest);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid position');
    });

    it('should fail validation with instructions too long', async () => {
      const invalidRequest: ImageEditRequest = {
        userImage: 'https://example.com/user.jpg',
        garmentImage: 'https://example.com/garment.jpg',
        instructions: 'a'.repeat(501) // Exceeds 500 character limit
      };

      const result = await imageEditService.editImageWithGemini(invalidRequest);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Instructions too long');
    });
  });

  describe('imageToBase64', () => {
    it('should convert data URL to base64', async () => {
      const dataUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';

      const base64 = await (imageEditService as any).imageToBase64(dataUrl);
      expect(base64).toBe('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=');
    });

    it('should handle fetch errors gracefully', async () => {
      const invalidUrl = 'https://non-existent-url.com/image.jpg';

      // Mock fetch failure
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect((imageEditService as any).imageToBase64(invalidUrl))
        .rejects.toThrow('Image conversion failed');
    });
  });

  describe('validateImage', () => {
    it('should pass validation with valid base64', () => {
      const validBase64 = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';

      expect(() => {
        (imageEditService as any).validateImage(validBase64, 'test.jpg');
      }).not.toThrow();
    });

    it('should fail validation with empty string', () => {
      expect(() => {
        (imageEditService as any).validateImage('', 'test.jpg');
      }).toThrow('Invalid image data: empty or not a string');
    });

    it('should fail validation with invalid base64 format', () => {
      const invalidBase64 = 'not-a-valid-base64-string!!!@@@';

      expect(() => {
        (imageEditService as any).validateImage(invalidBase64, 'test.jpg');
      }).toThrow('Invalid base64 image format');
    });
  });

  describe('generateOverlayInstructions', () => {
    it('should generate instructions for full-body realistic overlay', () => {
      const request: ImageEditRequest = {
        userImage: 'https://example.com/user.jpg',
        garmentImage: 'https://example.com/garment.jpg',
        position: 'full-body',
        fit: 'regular',
        style: 'realistic'
      };

      const instructions = (imageEditService as any).generateOverlayInstructions(request);

      expect(instructions).toContain('realistic virtual try-on');
      expect(instructions).toContain('full-body visibility');
      expect(instructions).toContain('standard fit');
      expect(instructions).toContain('photorealistic result');
    });

    it('should include custom instructions when provided', () => {
      const request: ImageEditRequest = {
        userImage: 'https://example.com/user.jpg',
        garmentImage: 'https://example.com/garment.jpg',
        instructions: 'Make it look more casual'
      };

      const instructions = (imageEditService as any).generateOverlayInstructions(request);
      expect(instructions).toContain('Make it look more casual');
    });
  });

  describe('API Error Handling', () => {
    it('should handle API key missing error', async () => {
      // Temporarily remove API key
      delete process.env.EXPO_PUBLIC_GEMINI_API_KEY;

      const request: ImageEditRequest = {
        userImage: 'https://example.com/user.jpg',
        garmentImage: 'https://example.com/garment.jpg'
      };

      const result = await imageEditService.editImageWithGemini(request);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Gemini API key not configured');

      // Restore API key
      process.env.EXPO_PUBLIC_GEMINI_API_KEY = 'test-gemini-key';
    });

    it('should handle rate limiting error', async () => {
      const request: ImageEditRequest = {
        userImage: 'https://example.com/user.jpg',
        garmentImage: 'https://example.com/garment.jpg'
      };

      // Mock rate limit response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: async () => 'Rate limit exceeded'
      });

      const result = await imageEditService.editImageWithGemini(request);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Rate limit exceeded');
    });

    it('should handle invalid API key error', async () => {
      const request: ImageEditRequest = {
        userImage: 'https://example.com/user.jpg',
        garmentImage: 'https://example.com/garment.jpg'
      };

      // Mock 403 response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
        text: async () => 'Invalid API key'
      });

      const result = await imageEditService.editImageWithGemini(request);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid API key');
    });
  });
});