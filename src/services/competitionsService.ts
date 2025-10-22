/**
 * src/services/competitionsService.ts
 *
 * Service for managing competitions and competition entries
 * Integrates with the Go backend API for competition functionality
 */

import { supabase } from '@/utils/supabase';

// Types for competitions
export interface Competition {
  id: string;
  country: string;
  title: string;
  theme?: string;
  description?: string;
  banner_image_url?: string;
  rules?: string;
  prize_pool?: PrizePool;
  max_entries?: number;
  start_at: string;
  end_at: string;
  voting_start_at?: string;
  voting_end_at?: string;
  status: 'draft' | 'active' | 'voting' | 'completed' | 'cancelled';
  judge_panel?: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
  entries_count?: number;
  user_entered?: boolean;
}

export interface PrizePool {
  points?: number;
  rewards?: string[];
  sponsor?: string;
  sponsor_logo?: string;
}

export interface CompetitionEntry {
  id: string;
  user_id: string;
  username?: string;
  avatar_url?: string;
  competition_id: string;
  title: string;
  description?: string;
  image_url: string;
  images?: string[];
  tags?: string[];
  likes: number;
  votes_count: number;
  status: 'submitted' | 'approved' | 'featured' | 'rejected' | 'withdrawn';
  final_placement?: number;
  final_points_awarded?: number;
  submitted_at: string;
  judged_at?: string;
  judged_by?: string;
  judge_feedback?: string;
  created_at: string;
  updated_at: string;
  user_liked?: boolean;
}

export interface CreateCompetitionRequest {
  country: string;
  title: string;
  theme?: string;
  description?: string;
  banner_image_url?: string;
  rules?: string;
  prize_pool?: PrizePool;
  max_entries?: number;
  start_at: string;
  end_at: string;
  voting_start_at?: string;
  voting_end_at?: string;
  judge_panel?: string[];
}

export interface CreateCompetitionEntryRequest {
  competition_id: string;
  title: string;
  description?: string;
  image_url: string;
  images?: string[];
  tags?: string[];
}

export interface CompetitionListResponse {
  competitions: Competition[];
  count: number;
}

export interface CompetitionEntriesResponse {
  entries: CompetitionEntry[];
  count: number;
  limit: number;
  offset: number;
}

class CompetitionsService {
  private readonly API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080/api';

  /**
   * Get active competitions
   */
  async getActiveCompetitions(country?: string): Promise<CompetitionListResponse> {
    try {
      const params = new URLSearchParams();
      if (country) {
        params.append('country', country);
      }

      const response = await fetch(
        `${this.API_BASE}/competitions/active?${params}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await this.getAuthToken()}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch competitions: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ Get active competitions failed:', error);
      throw error;
    }
  }

  /**
   * Get competition by ID
   */
  async getCompetitionById(id: string): Promise<Competition> {
    try {
      const response = await fetch(`${this.API_BASE}/competitions/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Competition not found');
        }
        throw new Error(`Failed to fetch competition: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ Get competition by ID failed:', error);
      throw error;
    }
  }

  /**
   * Create a new competition
   */
  async createCompetition(request: CreateCompetitionRequest): Promise<Competition> {
    try {
      const response = await fetch(`${this.API_BASE}/competitions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to create competition: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ Create competition failed:', error);
      throw error;
    }
  }

  /**
   * Submit an entry to a competition
   */
  async submitCompetitionEntry(request: CreateCompetitionEntryRequest): Promise<CompetitionEntry> {
    try {
      const response = await fetch(`${this.API_BASE}/competitions/entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 409) {
          throw new Error('You have already entered this competition');
        }
        throw new Error(errorData.error || `Failed to submit entry: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ Submit competition entry failed:', error);
      throw error;
    }
  }

  /**
   * Get entries for a competition
   */
  async getCompetitionEntries(
    competitionId: string,
    options: {
      sortBy?: 'votes_count' | 'likes' | 'submitted_at';
      sortOrder?: 'ASC' | 'DESC';
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<CompetitionEntriesResponse> {
    try {
      const params = new URLSearchParams();
      if (options.sortBy) params.append('sort_by', options.sortBy);
      if (options.sortOrder) params.append('sort_order', options.sortOrder);
      if (options.limit) params.append('limit', options.limit.toString());
      if (options.offset) params.append('offset', options.offset.toString());

      const response = await fetch(
        `${this.API_BASE}/competitions/${competitionId}/entries?${params}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await this.getAuthToken()}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch competition entries: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ Get competition entries failed:', error);
      throw error;
    }
  }

  /**
   * Get user's competition entries
   */
  async getUserCompetitionEntries(options: {
    limit?: number;
    offset?: number;
  } = {}): Promise<CompetitionEntriesResponse> {
    try {
      const params = new URLSearchParams();
      if (options.limit) params.append('limit', options.limit.toString());
      if (options.offset) params.append('offset', options.offset.toString());

      const response = await fetch(
        `${this.API_BASE}/competitions/my-entries?${params}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await this.getAuthToken()}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch user entries: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ Get user competition entries failed:', error);
      throw error;
    }
  }

  /**
   * Withdraw a competition entry
   */
  async withdrawCompetitionEntry(entryId: string): Promise<CompetitionEntry> {
    try {
      const response = await fetch(`${this.API_BASE}/competitions/entries/${entryId}/withdraw`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 404) {
          throw new Error('Entry not found or you don\'t have permission');
        }
        throw new Error(errorData.error || `Failed to withdraw entry: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ Withdraw competition entry failed:', error);
      throw error;
    }
  }

  /**
   * Upload competition image
   */
  async uploadCompetitionImage(
    fileUri: string,
    competitionId?: string,
    entryId?: string
  ): Promise<string> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const fileType = fileUri.split('.').pop()?.toLowerCase();
      const fileName = `competitions/${user.id}/${Date.now()}.${fileType}`;

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', {
        uri: fileUri,
        type: `image/${fileType}`,
        name: fileName,
      } as any);

      if (competitionId) {
        formData.append('competition_id', competitionId);
      }
      if (entryId) {
        formData.append('entry_id', entryId);
      }

      const response = await fetch(`${this.API_BASE}/upload/competition-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to upload image: ${response.statusText}`);
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('❌ Upload competition image failed:', error);
      throw error;
    }
  }

  /**
   * Get competition statistics
   */
  async getCompetitionStats(competitionId: string): Promise<{
    total_entries: number;
    approved_entries: number;
    featured_entries: number;
    total_votes: number;
    avg_votes_per_entry: number;
  }> {
    try {
      const response = await fetch(`${this.API_BASE}/competitions/${competitionId}/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch competition stats: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ Get competition stats failed:', error);
      throw error;
    }
  }

  /**
   * Check if user can enter competition
   */
  async canEnterCompetition(competitionId: string): Promise<{
    can_enter: boolean;
    reason?: string;
    user_entered?: boolean;
  }> {
    try {
      const response = await fetch(`${this.API_BASE}/competitions/${competitionId}/can-enter`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to check entry eligibility: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ Check entry eligibility failed:', error);
      throw error;
    }
  }

  /**
   * Get authentication token
   */
  private async getAuthToken(): Promise<string> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No authentication token found');
      }
      return session.access_token;
    } catch (error) {
      console.error('❌ Get auth token failed:', error);
      throw new Error('Authentication required');
    }
  }

  /**
   * Validate competition data
   */
  validateCompetitionData(data: Partial<CreateCompetitionRequest>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!data.country || data.country.trim().length === 0) {
      errors.push('Country is required');
    }

    if (!data.title || data.title.trim().length === 0) {
      errors.push('Title is required');
    } else if (data.title.length > 200) {
      errors.push('Title must be less than 200 characters');
    }

    if (!data.start_at) {
      errors.push('Start date is required');
    }

    if (!data.end_at) {
      errors.push('End date is required');
    } else if (data.start_at && new Date(data.end_at) <= new Date(data.start_at)) {
      errors.push('End date must be after start date');
    }

    if (data.description && data.description.length > 1000) {
      errors.push('Description must be less than 1000 characters');
    }

    if (data.rules && data.rules.length > 2000) {
      errors.push('Rules must be less than 2000 characters');
    }

    if (data.max_entries && (data.max_entries < 1 || data.max_entries > 10000)) {
      errors.push('Max entries must be between 1 and 10000');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate entry data
   */
  validateEntryData(data: Partial<CreateCompetitionEntryRequest>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!data.competition_id) {
      errors.push('Competition ID is required');
    }

    if (!data.title || data.title.trim().length === 0) {
      errors.push('Title is required');
    } else if (data.title.length > 200) {
      errors.push('Title must be less than 200 characters');
    }

    if (!data.image_url) {
      errors.push('Image URL is required');
    }

    if (data.description && data.description.length > 1000) {
      errors.push('Description must be less than 1000 characters');
    }

    if (data.images && data.images.length > 10) {
      errors.push('Maximum 10 images allowed');
    }

    if (data.tags && data.tags.length > 10) {
      errors.push('Maximum 10 tags allowed');
    }

    data.tags?.forEach((tag, index) => {
      if (tag.length > 50) {
        errors.push(`Tag ${index + 1} must be less than 50 characters`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// Export singleton instance
export const competitionsService = new CompetitionsService();
export default competitionsService;