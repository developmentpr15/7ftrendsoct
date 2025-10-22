/**
 * ImageEditService.ts
 *
 * Premium image editing service using Gemini 2.5 Flash Image API
 * Provides virtual try-on functionality with luxury styling
 * Supports user image + garment overlay composition
 */

import { supabase } from '../utils/supabase';

// Types for image editing
export interface ImageEditRequest {
  userImage: string;        // Base64 or URL of user photo
  garmentImage: string;     // Base64 or URL of garment item
  instructions?: string;    // Custom overlay instructions
  position?: 'upper-body' | 'lower-body' | 'full-body' | 'accessory';
  fit?: 'snug' | 'regular' | 'loose';
  style?: 'realistic' | 'stylized' | 'enhanced';
}

export interface ImageEditResponse {
  success: boolean;
  compositeImageUrl?: string;
  editedImageUrl?: string;
  confidence?: number;
  processingTime?: number;
  error?: string;
  details?: {
    modelUsed: string;
    inputDimensions: { width: number; height: number };
    outputDimensions: { width: number; height: number };
    appliedInstructions: string[];
  };
}

export interface ImageEditStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  estimatedTime?: number;
  error?: string;
  result?: ImageEditResponse;
}

export interface EditHistoryItem {
  id: string;
  userId: string;
  userImageUrl: string;
  garmentImageUrl: string;
  compositeImageUrl?: string;
  instructions: string;
  position: string;
  fit: string;
  style: string;
  confidence?: number;
  status: string;
  createdAt: string;
  processingTime?: number;
}

class ImageEditService {
  private readonly GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';
  private readonly MODEL_NAME = 'gemini-2.5-flash-image';
  private readonly MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
  private readonly SUPPORTED_FORMATS = ['jpg', 'jpeg', 'png', 'webp'];

  constructor() {
    // Validate environment
    if (!process.env.EXPO_PUBLIC_GEMINI_API_KEY) {
      console.warn('⚠️ GEMINI_API_KEY not found in environment variables');
    }
  }

  /**
   * Convert image URI to base64
   */
  private async imageToBase64(imageUri: string): Promise<string> {
    try {
      // Handle different image sources
      if (imageUri.startsWith('data:')) {
        // Already base64 encoded
        return imageUri.split(',')[1];
      } else if (imageUri.startsWith('http')) {
        // Fetch from URL
        const response = await fetch(imageUri);
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.statusText}`);
        }

        const blob = await response.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } else {
        // Local file URI
        throw new Error('Local file URIs not supported. Please upload the image first.');
      }
    } catch (error) {
      console.error('❌ Error converting image to base64:', error);
      throw new Error(`Image conversion failed: ${error.message}`);
    }
  }

  /**
   * Validate image format and size
   */
  private validateImage(base64Image: string, filename: string = 'image'): void {
    try {
      // Check if base64 string is valid
      if (!base64Image || typeof base64Image !== 'string') {
        throw new Error('Invalid image data: empty or not a string');
      }

      // Check minimum size (at least 1KB)
      const estimatedSize = (base64Image.length * 3) / 4;
      if (estimatedSize < 1024) {
        throw new Error('Image too small: must be at least 1KB');
      }

      // Check maximum file size
      if (estimatedSize > this.MAX_FILE_SIZE) {
        throw new Error(`Image size exceeds ${this.MAX_FILE_SIZE / 1024 / 1024}MB limit (actual: ${(estimatedSize / 1024 / 1024).toFixed(2)}MB)`);
      }

      // Check base64 format validity
      const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
      if (!base64Regex.test(base64Image)) {
        throw new Error('Invalid base64 image format');
      }

      // Check format from data URL or filename
      const extension = filename.split('.').pop()?.toLowerCase();
      if (extension && !this.SUPPORTED_FORMATS.includes(extension)) {
        throw new Error(`Unsupported image format: ${extension}. Supported: ${this.SUPPORTED_FORMATS.join(', ')}`);
      }

    } catch (error) {
      console.error('❌ Image validation failed:', error);
      throw new Error(`Image validation failed: ${error.message}`);
    }
  }

  /**
   * Generate contextual instructions for garment overlay
   */
  private generateOverlayInstructions(request: ImageEditRequest): string {
    const baseInstructions = `Create a realistic virtual try-on image by overlaying the garment onto the user photo. Ensure natural fitting, proper shadows, and realistic blending.`;

    const positionInstructions = {
      'upper-body': 'Focus on upper body placement. Ensure proper alignment with shoulders, chest, and arms.',
      'lower-body': 'Focus on lower body placement. Ensure proper alignment with waist, hips, and legs.',
      'full-body': 'Place garment on appropriate body section with full-body visibility.',
      'accessory': 'Position accessory naturally on the user (hat on head, bag in hand, watch on wrist, etc.).'
    };

    const fitInstructions = {
      'snug': 'Apply with close fit to body, showing natural contours.',
      'regular': 'Apply with standard fit, neither too tight nor too loose.',
      'loose': 'Apply with relaxed fit, showing natural draping and movement.'
    };

    const styleInstructions = {
      'realistic': 'Create photorealistic result with accurate lighting, shadows, and textures.',
      'stylized': 'Apply artistic enhancement while maintaining recognizable features.',
      'enhanced': 'Improve overall appearance with subtle enhancements to lighting and colors.'
    };

    let instructions = baseInstructions;

    if (request.position) {
      instructions += ` ${positionInstructions[request.position]}`;
    }

    if (request.fit) {
      instructions += ` ${fitInstructions[request.fit]}`;
    }

    if (request.style) {
      instructions += ` ${styleInstructions[request.style]}`;
    }

    if (request.instructions) {
      instructions += ` Additional requirements: ${request.instructions}`;
    }

    return instructions;
  }

  /**
   * Validate edit request parameters
   */
  private validateEditRequest(request: ImageEditRequest): void {
    const errors: string[] = [];

    // Validate user image
    if (!request.userImage) {
      errors.push('User image is required');
    } else if (typeof request.userImage !== 'string') {
      errors.push('User image must be a valid URL or base64 string');
    }

    // Validate garment image
    if (!request.garmentImage) {
      errors.push('Garment image is required');
    } else if (typeof request.garmentImage !== 'string') {
      errors.push('Garment image must be a valid URL or base64 string');
    }

    // Validate position
    const validPositions = ['upper-body', 'lower-body', 'full-body', 'accessory'];
    if (request.position && !validPositions.includes(request.position)) {
      errors.push(`Invalid position: ${request.position}. Valid options: ${validPositions.join(', ')}`);
    }

    // Validate fit
    const validFits = ['snug', 'regular', 'loose'];
    if (request.fit && !validFits.includes(request.fit)) {
      errors.push(`Invalid fit: ${request.fit}. Valid options: ${validFits.join(', ')}`);
    }

    // Validate style
    const validStyles = ['realistic', 'stylized', 'enhanced'];
    if (request.style && !validStyles.includes(request.style)) {
      errors.push(`Invalid style: ${request.style}. Valid options: ${validStyles.join(', ')}`);
    }

    // Validate instructions length
    if (request.instructions && request.instructions.length > 500) {
      errors.push('Instructions too long: maximum 500 characters');
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join('; ')}`);
    }
  }

  /**
   * Edit image with Gemini 2.5 Flash Image API
   * Main virtual try-on function
   */
  async editImageWithGemini(request: ImageEditRequest): Promise<ImageEditResponse> {
    const startTime = Date.now();

    try {
      console.log('🎨 Starting Gemini 2.5 Flash image editing...');

      // Validate request parameters
      this.validateEditRequest(request);

      const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Gemini API key not configured');
      }

      // Convert images to base64
      const [userImageBase64, garmentImageBase64] = await Promise.all([
        this.imageToBase64(request.userImage),
        this.imageToBase64(request.garmentImage)
      ]);

      // Validate images
      this.validateImage(userImageBase64, 'user-image');
      this.validateImage(garmentImageBase64, 'garment-image');

      // Generate instructions
      const instructions = this.generateOverlayInstructions(request);
      console.log('📝 Generated instructions:', instructions);

      // Prepare API request
      const requestBody = {
        contents: [{
          parts: [
            {
              text: instructions
            },
            {
              inline_data: {
                mime_type: 'image/jpeg',
                data: userImageBase64
              }
            },
            {
              inline_data: {
                mime_type: 'image/jpeg',
                data: garmentImageBase64
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.1,
          topK: 32,
          topP: 0.95,
          maxOutputTokens: 1024,
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              confidence: { type: 'number' },
              appliedInstructions: {
                type: 'array',
                items: { type: 'string' }
              }
            }
          }
        }
      };

      // Make API call
      const response = await fetch(
        `${this.GEMINI_API_BASE}/models/${this.MODEL_NAME}:edit?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Gemini API error:', response.status, errorText);

        // Handle specific error cases
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        } else if (response.status === 403) {
          throw new Error('Invalid API key or insufficient permissions.');
        } else if (response.status === 400) {
          throw new Error('Invalid request. Please check image formats and sizes.');
        } else {
          throw new Error(`API error: ${response.status} - ${errorText}`);
        }
      }

      const result = await response.json();
      console.log('✅ Gemini API response received');

      // Process the response to extract the edited image
      const editedImageBase64 = this.extractEditedImageFromResponse(result);

      if (!editedImageBase64) {
        throw new Error('Failed to extract edited image from API response');
      }

      // Upload the composite image to Supabase Storage
      const compositeImageUrl = await this.uploadCompositeImage(editedImageBase64);

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        compositeImageUrl,
        editedImageUrl: `data:image/jpeg;base64,${editedImageBase64}`,
        confidence: result.candidates?.[0]?.content?.parts?.[0]?.confidence || 0.8,
        processingTime,
        details: {
          modelUsed: this.MODEL_NAME,
          inputDimensions: { width: 0, height: 0 }, // Would need to extract from images
          outputDimensions: { width: 0, height: 0 },
          appliedInstructions: [instructions]
        }
      };

    } catch (error) {
      console.error('❌ Image editing failed:', error);

      return {
        success: false,
        error: error.message || 'Unknown error occurred during image editing',
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Extract edited image from Gemini response
   */
  private extractEditedImageFromResponse(response: any): string | null {
    try {
      // Gemini 2.5 Flash Image API should return the edited image
      // This is a simplified extraction - actual implementation depends on API response format
      const candidate = response.candidates?.[0];
      if (candidate?.content?.parts) {
        for (const part of candidate.content.parts) {
          if (part.inline_data?.data) {
            return part.inline_data.data;
          }
        }
      }

      // Fallback: if no image returned, we might need to handle this differently
      console.warn('⚠️ No edited image returned from Gemini API');
      return null;

    } catch (error) {
      console.error('❌ Error extracting edited image:', error);
      return null;
    }
  }

  /**
   * Upload composite image to Supabase Storage with retry logic
   */
  private async uploadCompositeImage(base64Image: string, maxRetries: number = 3): Promise<string> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📤 Uploading composite image (attempt ${attempt}/${maxRetries})`);

        // Get authenticated user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('User not authenticated for image upload');
        }

        const userId = user.id;
        const timestamp = Date.now();
        const fileName = `virtual-tryon/${userId}/${timestamp}-composite.jpg`;

        // Validate base64 image before upload
        if (!base64Image || base64Image.length < 100) {
          throw new Error('Invalid composite image: too small or empty');
        }

        // Convert base64 to blob with validation
        const response = await fetch(`data:image/jpeg;base64,${base64Image}`);
        if (!response.ok) {
          throw new Error(`Failed to convert base64 to blob: ${response.statusText}`);
        }

        const blob = await response.blob();
        if (blob.size < 100) {
          throw new Error('Generated image too small for upload');
        }

        // Upload to Supabase with metadata
        const { data, error } = await supabase.storage
          .from('virtual-tryon-images')
          .upload(fileName, blob, {
            contentType: 'image/jpeg',
            cacheControl: '3600',
            upsert: attempt > 1 // Allow overwrite on retries
          });

        if (error) {
          // Check for specific error types
          if (error.message.includes('Bucket not found')) {
            throw new Error('Storage bucket not configured. Please contact support.');
          } else if (error.message.includes('Permission')) {
            throw new Error('Insufficient permissions for image upload');
          } else if (error.message.includes('quota')) {
            throw new Error('Storage quota exceeded. Please try again later.');
          } else {
            throw new Error(`Upload failed: ${error.message}`);
          }
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('virtual-tryon-images')
          .getPublicUrl(fileName);

        if (!publicUrl) {
          throw new Error('Failed to generate public URL for uploaded image');
        }

        console.log('✅ Composite image uploaded successfully:', publicUrl);
        return publicUrl;

      } catch (error) {
        lastError = error;
        console.error(`❌ Upload attempt ${attempt} failed:`, error);

        // Don't retry on authentication or permission errors
        if (error.message.includes('auth') || error.message.includes('permission') || error.message.includes('Bucket not found')) {
          throw error;
        }

        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          console.log(`⏳ Retrying upload in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed
    throw new Error(`Upload failed after ${maxRetries} attempts: ${lastError.message}`);
  }

  /**
   * Save edit attempt to database for tracking
   */
  async saveEditHistory(request: ImageEditRequest, result: ImageEditResponse): Promise<string> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const historyItem = {
        user_id: user.id,
        user_image_url: request.userImage,
        garment_image_url: request.garmentImage,
        composite_image_url: result.compositeImageUrl || null,
        instructions: request.instructions || this.generateOverlayInstructions(request),
        position: request.position || 'full-body',
        fit: request.fit || 'regular',
        style: request.style || 'realistic',
        confidence: result.confidence || null,
        status: result.success ? 'completed' : 'failed',
        processing_time: result.processingTime || null,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('virtual_tryon_history')
        .insert(historyItem)
        .select('id')
        .single();

      if (error) {
        throw new Error(`Failed to save edit history: ${error.message}`);
      }

      console.log('✅ Edit history saved:', data.id);
      return data.id;

    } catch (error) {
      console.error('❌ Failed to save edit history:', error);
      throw error;
    }
  }

  /**
   * Get user's edit history
   */
  async getEditHistory(limit: number = 20): Promise<EditHistoryItem[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return [];
      }

      const { data, error } = await supabase
        .from('virtual_tryon_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Failed to fetch edit history: ${error.message}`);
      }

      return data || [];

    } catch (error) {
      console.error('❌ Failed to fetch edit history:', error);
      return [];
    }
  }

  /**
   * Delete edit history item
   */
  async deleteEditHistory(historyId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // First, get the item to find the composite image URL
      const { data: item } = await supabase
        .from('virtual_tryon_history')
        .select('composite_image_url')
        .eq('id', historyId)
        .eq('user_id', user.id)
        .single();

      // Delete from storage if composite image exists
      if (item?.composite_image_url) {
        const fileName = item.composite_image_url.split('/').pop();
        await supabase.storage
          .from('virtual-tryon-images')
          .remove([`virtual-tryon-history/${user.id}/${fileName}`]);
      }

      // Delete from database
      const { error } = await supabase
        .from('virtual_tryon_history')
        .delete()
        .eq('id', historyId)
        .eq('user_id', user.id);

      if (error) {
        throw new Error(`Failed to delete edit history: ${error.message}`);
      }

      console.log('✅ Edit history item deleted:', historyId);
      return true;

    } catch (error) {
      console.error('❌ Failed to delete edit history:', error);
      return false;
    }
  }

  /**
   * Batch process multiple images
   */
  async batchEditImages(
    requests: ImageEditRequest[],
    onProgress?: (completed: number, total: number, current?: ImageEditResponse) => void
  ): Promise<ImageEditResponse[]> {
    const results: ImageEditResponse[] = [];

    for (let i = 0; i < requests.length; i++) {
      const request = requests[i];

      try {
        const result = await this.editImageWithGemini(request);
        results.push(result);

        // Save to history
        if (result.success) {
          await this.saveEditHistory(request, result);
        }

        // Report progress
        if (onProgress) {
          onProgress(i + 1, requests.length, result);
        }

        // Add small delay to avoid rate limiting
        if (i < requests.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

      } catch (error) {
        console.error(`❌ Failed to process image ${i + 1}:`, error);
        results.push({
          success: false,
          error: error.message
        });

        if (onProgress) {
          onProgress(i + 1, requests.length);
        }
      }
    }

    return results;
  }

  /**
   * Get API usage statistics
   */
  async getUsageStats(): Promise<{
    totalEdits: number;
    successfulEdits: number;
    averageProcessingTime: number;
    thisMonthEdits: number;
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return {
          totalEdits: 0,
          successfulEdits: 0,
          averageProcessingTime: 0,
          thisMonthEdits: 0
        };
      }

      const { data, error } = await supabase
        .from('virtual_tryon_history')
        .select('status, processing_time, created_at')
        .eq('user_id', user.id);

      if (error) {
        throw new Error(`Failed to fetch usage stats: ${error.message}`);
      }

      const history = data || [];
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const totalEdits = history.length;
      const successfulEdits = history.filter(item => item.status === 'completed').length;
      const thisMonthEdits = history.filter(item =>
        new Date(item.created_at) >= thisMonth
      ).length;

      const processingTimes = history
        .filter(item => item.processing_time)
        .map(item => item.processing_time);

      const averageProcessingTime = processingTimes.length > 0
        ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length
        : 0;

      return {
        totalEdits,
        successfulEdits,
        averageProcessingTime,
        thisMonthEdits
      };

    } catch (error) {
      console.error('❌ Failed to fetch usage stats:', error);
      return {
        totalEdits: 0,
        successfulEdits: 0,
        averageProcessingTime: 0,
        thisMonthEdits: 0
      };
    }
  }
}

// Export singleton instance
export const imageEditService = new ImageEditService();
export default imageEditService;