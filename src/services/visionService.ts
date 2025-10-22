import { supabase } from '../utils/supabase'

// AI tagging result types
export interface AITaggingResult {
  tags: string[]
  category: string
  colors: string[]
  occasions: string[]
  seasons: string[]
  style: string
  materials: string[]
  confidence: number
}

export interface VisionProcessingStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed'
  confidence?: number
  error?: string
  processedAt?: string
}

export interface WardrobeAIFields {
  ai_tags: string[]
  ai_category: string | null
  ai_colors: string[]
  ai_occasions: string[]
  ai_seasons: string[]
  ai_style: string | null
  ai_materials: string[]
  ai_confidence: number | null
  ai_processed_at: string | null
  ai_status: 'pending' | 'processing' | 'completed' | 'failed'
  ai_error_message: string | null
}

class VisionService {
  private supabaseUrl: string
  private supabaseAnonKey: string

  constructor() {
    this.supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || ''
    this.supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ''
  }

  /**
   * Trigger AI tagging for a wardrobe item
   */
  async triggerAITagging(itemId: string, imageUrl: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`Triggering AI tagging for item: ${itemId}`)

      // First update the item status to processing
      await supabase
        .from('wardrobe_items')
        .update({
          ai_status: 'processing',
          ai_processed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId)

      // Call the Edge Function
      const { data, error } = await supabase.functions.invoke('wardrobe-ai-tagging', {
        body: {
          itemId,
          imageUrl
        }
      })

      if (error) {
        console.error('Edge function error:', error)

        // Update item status to failed
        await supabase
          .from('wardrobe_items')
          .update({
            ai_status: 'failed',
            ai_error_message: error.message,
            updated_at: new Date().toISOString()
          })
          .eq('id', itemId)

        return { success: false, error: error.message }
      }

      console.log('AI tagging triggered successfully:', data)
      return { success: true }

    } catch (error: any) {
      console.error('AI tagging trigger error:', error)

      // Update item status to failed
      await supabase
        .from('wardrobe_items')
        .update({
          ai_status: 'failed',
          ai_error_message: error.message,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId)

      return { success: false, error: error.message }
    }
  }

  /**
   * Get AI tagging status for a wardrobe item
   */
  async getAITaggingStatus(itemId: string): Promise<VisionProcessingStatus | null> {
    try {
      const { data, error } = await supabase
        .from('wardrobe_items')
        .select('ai_status, ai_confidence, ai_error_message, ai_processed_at')
        .eq('id', itemId)
        .single()

      if (error) {
        console.error('Error fetching AI status:', error)
        return null
      }

      return {
        status: data.ai_status || 'pending',
        confidence: data.ai_confidence || undefined,
        error: data.ai_error_message || undefined,
        processedAt: data.ai_processed_at || undefined
      }

    } catch (error: any) {
      console.error('Get AI status error:', error)
      return null
    }
  }

  /**
   * Get all AI fields for a wardrobe item
   */
  async getWardrobeAIFields(itemId: string): Promise<WardrobeAIFields | null> {
    try {
      const { data, error } = await supabase
        .from('wardrobe_items')
        .select(`
          ai_tags,
          ai_category,
          ai_colors,
          ai_occasions,
          ai_seasons,
          ai_style,
          ai_materials,
          ai_confidence,
          ai_processed_at,
          ai_status,
          ai_error_message
        `)
        .eq('id', itemId)
        .single()

      if (error) {
        console.error('Error fetching AI fields:', error)
        return null
      }

      return data as WardrobeAIFields

    } catch (error: any) {
      console.error('Get AI fields error:', error)
      return null
    }
  }

  /**
   * Merge AI tags with manual tags
   */
  async mergeAITags(itemId: string, manualOverride: boolean = false): Promise<{ success: boolean; mergedData?: any; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('merge_ai_tags', {
        p_item_id: itemId,
        p_manual_override: manualOverride
      })

      if (error) {
        console.error('Merge AI tags error:', error)
        return { success: false, error: error.message }
      }

      return { success: true, mergedData: data }

    } catch (error: any) {
      console.error('Merge AI tags error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Retry failed AI tagging for a wardrobe item
   */
  async retryAITagging(itemId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('retry_ai_tagging', {
        p_item_id: itemId
      })

      if (error) {
        console.error('Retry AI tagging error:', error)
        return { success: false, error: error.message }
      }

      // If retry was successful, get the item's image and trigger AI tagging again
      if (data) {
        const { data: itemData } = await supabase
          .from('wardrobe_items')
          .select('images')
          .eq('id', itemId)
          .single()

        if (itemData?.images && itemData.images.length > 0) {
          return await this.triggerAITagging(itemId, itemData.images[0])
        }
      }

      return { success: false, error: 'No image found for retry' }

    } catch (error: any) {
      console.error('Retry AI tagging error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get AI tagging statistics for the current user
   */
  async getAITaggingStatistics(): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('ai_tagging_statistics')
        .select('*')
        .single()

      if (error) {
        console.error('Error fetching AI statistics:', error)
        return null
      }

      return data

    } catch (error: any) {
      console.error('Get AI statistics error:', error)
      return null
    }
  }

  /**
   * Batch process AI tagging for multiple items
   */
  async batchAITagging(itemIds: string[]): Promise<{ success: boolean; results?: any[]; error?: string }> {
    try {
      const results = []

      for (const itemId of itemIds) {
        // Get item details
        const { data: itemData } = await supabase
          .from('wardrobe_items')
          .select('id, images, ai_status')
          .eq('id', itemId)
          .single()

        if (!itemData || !itemData.images || itemData.images.length === 0) {
          results.push({ itemId, success: false, error: 'No image found' })
          continue
        }

        if (itemData.ai_status === 'processing') {
          results.push({ itemId, success: false, error: 'Already processing' })
          continue
        }

        // Trigger AI tagging
        const result = await this.triggerAITagging(itemId, itemData.images[0])
        results.push({ itemId, ...result })

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      return { success: true, results }

    } catch (error: any) {
      console.error('Batch AI tagging error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Search items by AI-generated tags
   */
  async searchByAITags(searchTags: string[]): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('wardrobe_items')
        .select('id')
        .contains('ai_tags', searchTags)

      if (error) {
        console.error('Search by AI tags error:', error)
        return []
      }

      // Add defensive programming for iterator method errors
      console.log('🔍 [VisionService] Raw API response data:', {
        isArray: Array.isArray(data),
        type: typeof data,
        length: data?.length
      });

      if (!Array.isArray(data)) {
        console.warn('⚠️ [VisionService] Received non-array data:', data);
        return [];
      }

      return data.map(item => item.id) || []

    } catch (error: any) {
      console.error('Search by AI tags error:', error)
      return []
    }
  }

  /**
   * Get items by AI category
   */
  async getItemsByAICategory(category: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('wardrobe_items')
        .select('id')
        .eq('ai_category', category)

      if (error) {
        console.error('Get items by AI category error:', error)
        return []
      }

      // Add defensive programming for iterator method errors
      console.log('🔍 [VisionService] Raw API response data:', {
        isArray: Array.isArray(data),
        type: typeof data,
        length: data?.length
      });

      if (!Array.isArray(data)) {
        console.warn('⚠️ [VisionService] Received non-array data:', data);
        return [];
      }

      return data.map(item => item.id) || []

    } catch (error: any) {
      console.error('Get items by AI category error:', error)
      return []
    }
  }

  /**
   * Get items by AI colors
   */
  async getItemsByAIColors(colors: string[]): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('wardrobe_items')
        .select('id')
        .contains('ai_colors', colors)

      if (error) {
        console.error('Get items by AI colors error:', error)
        return []
      }

      // Add defensive programming for iterator method errors
      console.log('🔍 [VisionService] Raw API response data:', {
        isArray: Array.isArray(data),
        type: typeof data,
        length: data?.length
      });

      if (!Array.isArray(data)) {
        console.warn('⚠️ [VisionService] Received non-array data:', data);
        return [];
      }

      return data.map(item => item.id) || []

    } catch (error: any) {
      console.error('Get items by AI colors error:', error)
      return []
    }
  }

  /**
   * Get items by AI occasions
   */
  async getItemsByAIOccasions(occasions: string[]): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('wardrobe_items')
        .select('id')
        .contains('ai_occasions', occasions)

      if (error) {
        console.error('Get items by AI occasions error:', error)
        return []
      }

      // Add defensive programming for iterator method errors
      console.log('🔍 [VisionService] Raw API response data:', {
        isArray: Array.isArray(data),
        type: typeof data,
        length: data?.length
      });

      if (!Array.isArray(data)) {
        console.warn('⚠️ [VisionService] Received non-array data:', data);
        return [];
      }

      return data.map(item => item.id) || []

    } catch (error: any) {
      console.error('Get items by AI occasions error:', error)
      return []
    }
  }

  /**
   * Monitor AI tagging progress with polling
   */
  async monitorAITaggingProgress(
    itemId: string,
    onUpdate: (status: VisionProcessingStatus) => void,
    intervalMs: number = 2000,
    maxAttempts: number = 30
  ): Promise<void> {
    let attempts = 0

    const poll = async () => {
      attempts++

      try {
        const status = await this.getAITaggingStatus(itemId)

        if (!status) {
          console.log('No status found for item:', itemId)
          return
        }

        onUpdate(status)

        // Continue polling if still processing and within max attempts
        if (status.status === 'processing' && attempts < maxAttempts) {
          setTimeout(poll, intervalMs)
        }

      } catch (error) {
        console.error('Polling error:', error)
        onUpdate({
          status: 'failed',
          error: 'Monitoring failed'
        })
      }
    }

    // Start polling
    poll()
  }

  /**
   * Process image upload with automatic AI tagging
   */
  async processImageUpload(
    itemId: string,
    imageUrl: string,
    autoTag: boolean = true
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!autoTag) {
        return { success: true }
      }

      console.log('Processing image upload with AI tagging...')

      // Trigger AI tagging
      const result = await this.triggerAITagging(itemId, imageUrl)

      if (!result.success) {
        console.error('Failed to trigger AI tagging:', result.error)
        return result
      }

      console.log('AI tagging triggered successfully')
      return { success: true }

    } catch (error: any) {
      console.error('Process image upload error:', error)
      return { success: false, error: error.message }
    }
  }
}

// Export singleton instance
export const visionService = new VisionService()
export default visionService