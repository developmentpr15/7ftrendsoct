/**
 * API Response Type Definitions
 * Standardized response types for API calls
 */

// Base API response
export interface BaseResponse<T = any> {
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  status: number;
  success: boolean;
}

// User-related types
export interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
  stats: {
    followers: number;
    following: number;
    posts: number;
    outfits: number;
  };
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    notifications: boolean;
    privacy: 'public' | 'private';
  };
  createdAt: string;
  updatedAt: string;
}

export interface UserStats {
  totalOutfits: number;
  totalLikes: number;
  totalComments: number;
  competitionsWon: number;
  engagementRate: number;
  topCategories: string[];
}

// Wardrobe-related types
export interface WardrobeItem {
  id: string;
  name: string;
  category: string;
  color: string;
  brand?: string;
  size?: string;
  image: string;
  tags: string[];
  isFavorite: boolean;
  dateAdded: string;
  lastWorn?: string;
  wearCount: number;
}

export interface Outfit {
  id: string;
  name: string;
  items: WardrobeItem[];
  occasion: string;
  season: string;
  isPublic: boolean;
  likes: number;
  comments: number;
  createdAt: string;
  updatedAt: string;
}

export interface OutfitSuggestion {
  id: string;
  name: string;
  occasion: string;
  items: WardrobeItem[];
  confidence: number;
  reason: string;
}

// Social-related types
export interface Post {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  content: {
    text?: string;
    images: string[];
    outfitId?: string;
  };
  stats: {
    likes: number;
    comments: number;
    shares: number;
  };
  isLiked: boolean;
  isBookmarked: boolean;
  tags: string[];
  location?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  content: string;
  parentId?: string; // For nested comments
  likes: number;
  isLiked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Story {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  media: string; // Image or video URL
  type: 'image' | 'video';
  duration: number; // For videos
  viewers: string[]; // User IDs who viewed
  createdAt: string;
  expiresAt: string;
}

// Competition-related types
export interface Competition {
  id: string;
  title: string;
  description: string;
  icon: string;
  banner?: string;
  theme: string;
  rules: string[];
  prizes: string[];
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'active' | 'judging' | 'completed';
  participants: number;
  maxParticipants?: number;
  requirements: {
    minOutfitItems: number;
    requiredCategories: string[];
    imageQuality: 'low' | 'medium' | 'high';
  };
  createdBy: string;
  judges: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CompetitionEntry {
  id: string;
  competitionId: string;
  userId: string;
  username: string;
  userAvatar: string;
  outfitId: string;
  outfit: Outfit;
  description: string;
  votes: number;
  averageRating: number;
  judgeVotes: {
    judgeId: string;
    rating: number;
    comment?: string;
  }[];
  status: 'submitted' | 'under_review' | 'approved' | 'rejected';
  submittedAt: string;
  updatedAt: string;
}

// AR-related types
export interface ARPhoto {
  id: string;
  userId: string;
  originalImage: string;
  arImage?: string; // After trying on items
  outfitItems?: WardrobeItem[];
  settings: {
    background?: string;
    lighting?: string;
    filters?: string[];
  };
  metadata: {
    cameraSettings: any;
    location?: any;
    deviceInfo: any;
  };
  isPublic: boolean;
  likes: number;
  comments: number;
  createdAt: string;
}

export interface ARTryOnRequest {
  userId: string;
  baseImage: string;
  itemsToTry: string[]; // Wardrobe item IDs
  settings: {
    background?: string;
    lighting?: string;
    quality: 'low' | 'medium' | 'high';
  };
}

export interface ARTryOnResponse {
  success: boolean;
  resultImage?: string;
  confidence?: number;
  items?: WardrobeItem[];
  error?: string;
}

// AI-related types
export interface AIImageEditRequest {
  image: string;
  edits: {
    type: 'remove_background' | 'change_color' | 'enhance' | 'resize';
    parameters: any;
  }[];
  quality: 'low' | 'medium' | 'high';
}

export interface AIImageEditResponse {
  success: boolean;
  editedImage?: string;
  confidence?: number;
  processingTime?: number;
  error?: string;
}

export interface AIStyleRecommendation {
  userId: string;
  occasion: string;
  preferences: {
    style: string[];
    colors: string[];
    brands: string[];
    budget?: {
      min: number;
      max: number;
    };
  };
  recommendations: {
    outfit: Outfit;
    confidence: number;
    reason: string;
    alternatives: Outfit[];
  }[];
}

// Pagination and filtering
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface FilterOptions {
  category?: string;
  color?: string;
  brand?: string;
  size?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  dateRange?: {
    start: string;
    end: string;
  };
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  tags?: string[];
}

// Error types
export interface APIError {
  message: string;
  code: string;
  details?: any;
  timestamp: string;
  requestId?: string;
}

// Response wrappers
export type UserProfileResponse = BaseResponse<UserProfile>;
export type WardrobeItemsResponse = BaseResponse<WardrobeItem[]>;
export type OutfitsResponse = BaseResponse<Outfit[]>;
export type PostsResponse = BaseResponse<Post[]>;
export type CompetitionsResponse = BaseResponse<Competition[]>;
export type ARPhotosResponse = BaseResponse<ARPhoto[]>;

export type PaginatedPostsResponse = BaseResponse<PaginatedResponse<Post>>;
export type PaginatedWardrobeResponse = BaseResponse<PaginatedResponse<WardrobeItem>>;
export type PaginatedCompetitionsResponse = BaseResponse<PaginatedResponse<Competition>>;