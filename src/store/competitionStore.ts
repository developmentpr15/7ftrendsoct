import { create } from 'zustand';
import { persist, createJSONStorage, subscribeWithSelector } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../utils/supabase';
import { useSessionStore } from './sessionStore';

// Types
export interface Competition {
  id: string;
  title: string;
  description: string;
  banner_image?: string;
  icon?: string;
  category: 'style' | 'outfit' | 'creative' | 'seasonal' | 'brand';
  type: 'photo' | 'outfit' | 'design' | 'voting';
  status: 'upcoming' | 'active' | 'voting' | 'completed' | 'cancelled';
  start_date: string;
  end_date: string;
  voting_end_date?: string;
  timezone: string;
  is_global: boolean;
  eligible_countries?: string[];
  excluded_countries?: string[];
  age_restriction?: {
    min_age?: number;
    max_age?: number;
  };
  prize_pool?: {
    points?: number;
    items?: string[];
    recognition?: string[];
  };
  rules?: string[];
  judging_criteria?: {
    creativity: number;
    style: number;
    originality: number;
    technical: number;
    audience_vote: number;
  };
  requirements?: {
    min_photos?: number;
    max_photos?: number;
    photo_quality?: 'high' | 'medium' | 'any';
    content_type?: string[];
  };
  metadata?: {
    sponsor_info?: any;
    brand_info?: any;
    social_share_config?: any;
  };
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface CompetitionEntry {
  id: string;
  competition_id: string;
  participant_id: string;
  participant: {
    id: string;
    username: string;
    avatar_url?: string;
    full_name?: string;
  };
  title: string;
  description: string;
  images: string[];
  outfit_items?: string[];
  style_tags: string[];
  votes_count: number;
  comments_count: number;
  shares_count: number;
  average_score: number;
  total_score: number;
  status: 'submitted' | 'approved' | 'rejected' | 'featured' | 'withdrawn';
  is_featured: boolean;
  featured_at?: string;
  submitted_at: string;
  approved_at?: string;
  approved_by?: string;
  final_placement?: number;
  final_points_awarded?: number;
  metadata?: {
    editing_history?: any[];
    submission_ip?: string;
    device_info?: any;
  };
}

export interface CompetitionVote {
  id: string;
  entry_id: string;
  voter_id: string;
  score: number; // 1-10 scale
  vote_type: 'public' | 'judge' | 'admin';
  feedback?: string;
  criteria_scores?: {
    creativity?: number;
    style?: number;
    originality?: number;
    technical?: number;
  };
  is_anonymous: boolean;
  created_at: string;
}

export interface LeaderboardEntry {
  id: string;
  competition_id: string;
  user_id: string;
  participant: {
    username: string;
    avatar_url?: string;
    full_name?: string;
  };
  placement: number;
  score: number;
  votes_received: number;
  points_awarded: number;
  entry: CompetitionEntry;
  created_at: string;
}

export interface CompetitionFilter {
  status?: Competition['status'][];
  category?: Competition['category'][];
  type?: Competition['type'][];
  eligibility?: 'all' | 'eligible' | 'participating';
  timeframe?: 'active' | 'upcoming' | 'completed';
  has_prize?: boolean;
  featured_only?: boolean;
}

interface CompetitionStore {
  // State
  competitions: Competition[];
  userEntries: CompetitionEntry[];
  leaderboard: LeaderboardEntry[];
  userVotes: Map<string, CompetitionVote>;
  currentCompetition: Competition | null;
  loading: boolean;
  refreshing: boolean;
  submitting: boolean;
  voting: boolean;
  error: string | null;
  filters: CompetitionFilter;
  pagination: {
    hasNextPage: boolean;
    currentPage: number;
    itemsPerPage: number;
  };
  lastFetchTime: number;

  // Competition Actions
  fetchCompetitions: (refresh?: boolean) => Promise<void>;
  fetchCompetition: (competitionId: string) => Promise<void>;
  joinCompetition: (competitionId: string) => Promise<{ success: boolean; error?: string }>;
  leaveCompetition: (competitionId: string) => Promise<{ success: boolean; error?: string }>;

  // Entry Actions
  submitEntry: (competitionId: string, entryData: Partial<CompetitionEntry>) => Promise<{ success: boolean; entryId?: string; error?: string }>;
  updateEntry: (entryId: string, updates: Partial<CompetitionEntry>) => Promise<{ success: boolean; error?: string }>;
  withdrawEntry: (entryId: string) => Promise<{ success: boolean; error?: string }>;
  fetchUserEntries: (competitionId?: string) => Promise<void>;
  fetchEntries: (competitionId: string, page?: number) => Promise<void>;

  // Voting Actions
  voteForEntry: (entryId: string, score: number, criteriaScores?: any) => Promise<{ success: boolean; error?: string }>;
  fetchUserVotes: (competitionId: string) => Promise<void>;
  fetchLeaderboard: (competitionId: string) => Promise<void>;

  // Filter and Search
  setFilters: (filters: Partial<CompetitionFilter>) => void;
  clearFilters: () => void;
  searchCompetitions: (query: string) => Promise<Competition[]>;

  // Utility
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  setCurrentCompetition: (competition: Competition | null) => void;
  isUserEligible: (competition: Competition) => boolean;
}

// Storage configuration for persistence
const storageConfig = {
  name: '7ftrends-competition-storage',
  storage: createJSONStorage(() => AsyncStorage),
  partialize: (state: CompetitionStore) => ({
    userEntries: state.userEntries.slice(0, 10), // Cache recent entries
    userVotes: Object.fromEntries(state.userVotes),
    filters: state.filters,
    lastFetchTime: state.lastFetchTime,
  }),
};

export const useCompetitionStore = create<CompetitionStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Initial State
        competitions: [],
        userEntries: [],
        leaderboard: [],
        userVotes: new Map(),
        currentCompetition: null,
        loading: false,
        refreshing: false,
        submitting: false,
        voting: false,
        error: null,
        filters: {
          status: ['active', 'upcoming'],
          eligibility: 'all',
          timeframe: 'active',
        },
        pagination: {
          hasNextPage: true,
          currentPage: 1,
          itemsPerPage: 20,
        },
        lastFetchTime: 0,

        // Competition Actions
        fetchCompetitions: async (refresh = false) => {
          const state = get();
          const user = useSessionStore.getState().user;

          try {
            if (refresh) {
              set({ refreshing: true, error: null });
            } else {
              set({ loading: true, error: null });
            }

            const { data, error } = await supabase
              .from('competitions')
              .select(`
                *,
                creator:users!competitions_created_by_fkey(id, username, avatar_url)
              `)
              .in('status', state.filters.status || ['active', 'upcoming', 'voting', 'completed'])
              .order('created_at', { ascending: false })
              .range(0, state.pagination.itemsPerPage * state.pagination.currentPage - 1);

            if (error) throw error;

            const competitions: Competition[] = data || [];

            // Filter based on user eligibility if needed
            let filteredCompetitions = competitions;
            if (state.filters.eligibility === 'eligible' && user) {
              filteredCompetitions = competitions.filter(competition =>
                get().isUserEligible(competition)
              );
            } else if (state.filters.eligibility === 'participating' && user) {
              filteredCompetitions = competitions.filter(competition =>
                state.userEntries.some(entry => entry.competition_id === competition.id)
              );
            }

            set({
              competitions: refresh ? filteredCompetitions : [...state.competitions, ...filteredCompetitions],
              pagination: {
                ...state.pagination,
                hasNextPage: (data?.length || 0) === state.pagination.itemsPerPage,
                currentPage: refresh ? 1 : state.pagination.currentPage + 1,
              },
              lastFetchTime: Date.now(),
            });

          } catch (error: any) {
            console.error('Fetch competitions error:', error);
            set({ error: error.message });
          } finally {
            set({ loading: false, refreshing: false });
          }
        },

        fetchCompetition: async (competitionId: string) => {
          try {
            set({ loading: true, error: null });

            const { data, error } = await supabase
              .from('competitions')
              .select(`
                *,
                creator:users!competitions_created_by_fkey(id, username, avatar_url)
              `)
              .eq('id', competitionId)
              .single();

            if (error) throw error;

            set({ currentCompetition: data });

          } catch (error: any) {
            console.error('Fetch competition error:', error);
            set({ error: error.message });
          } finally {
            set({ loading: false });
          }
        },

        joinCompetition: async (competitionId: string) => {
          const user = useSessionStore.getState().user;

          if (!user) {
            return { success: false, error: 'Not authenticated' };
          }

          try {
            set({ submitting: true, error: null });

            // Check if already participating
            const existingEntry = get().userEntries.find(
              entry => entry.competition_id === competitionId
            );

            if (existingEntry) {
              return { success: false, error: 'Already participating in this competition' };
            }

            // Join competition (create placeholder entry)
            const { data, error } = await supabase
              .from('competition_entries')
              .insert({
                competition_id: competitionId,
                participant_id: user.id,
                title: 'Draft Entry',
                description: '',
                images: [],
                status: 'submitted',
                submitted_at: new Date().toISOString(),
              })
              .select()
              .single();

            if (error) {
              return { success: false, error: error.message };
            }

            // Fetch updated entry
            await get().fetchUserEntries(competitionId);

            return { success: true };

          } catch (error: any) {
            return { success: false, error: error.message };
          } finally {
            set({ submitting: false });
          }
        },

        leaveCompetition: async (competitionId: string) => {
          const user = useSessionStore.getState().user;

          if (!user) {
            return { success: false, error: 'Not authenticated' };
          }

          try {
            set({ submitting: true });

            const { error } = await supabase
              .from('competition_entries')
              .delete()
              .eq('competition_id', competitionId)
              .eq('participant_id', user.id);

            if (error) {
              return { success: false, error: error.message };
            }

            // Update local state
            set({
              userEntries: get().userEntries.filter(
                entry => entry.competition_id !== competitionId
              ),
            });

            return { success: true };

          } catch (error: any) {
            return { success: false, error: error.message };
          } finally {
            set({ submitting: false });
          }
        },

        // Entry Actions
        submitEntry: async (competitionId: string, entryData: Partial<CompetitionEntry>) => {
          const user = useSessionStore.getState().user;

          if (!user) {
            return { success: false, error: 'Not authenticated' };
          }

          try {
            set({ submitting: true, error: null });

            const { data, error } = await supabase
              .from('competition_entries')
              .insert({
                competition_id: competitionId,
                participant_id: user.id,
                title: entryData.title,
                description: entryData.description,
                images: entryData.images || [],
                outfit_items: entryData.outfit_items || [],
                style_tags: entryData.style_tags || [],
                status: 'submitted',
                submitted_at: new Date().toISOString(),
              })
              .select()
              .single();

            if (error) {
              return { success: false, error: error.message };
            }

            await get().fetchUserEntries(competitionId);

            return { success: true, entryId: data.id };

          } catch (error: any) {
            return { success: false, error: error.message };
          } finally {
            set({ submitting: false });
          }
        },

        updateEntry: async (entryId: string, updates: Partial<CompetitionEntry>) => {
          try {
            set({ submitting: true });

            const { error } = await supabase
              .from('competition_entries')
              .update({
                ...updates,
                updated_at: new Date().toISOString(),
              })
              .eq('id', entryId);

            if (error) {
              return { success: false, error: error.message };
            }

            // Update local state
            set({
              userEntries: get().userEntries.map(entry =>
                entry.id === entryId ? { ...entry, ...updates } : entry
              ),
            });

            return { success: true };

          } catch (error: any) {
            return { success: false, error: error.message };
          } finally {
            set({ submitting: false });
          }
        },

        withdrawEntry: async (entryId: string) => {
          try {
            set({ submitting: true });

            const { error } = await supabase
              .from('competition_entries')
              .update({ status: 'withdrawn' })
              .eq('id', entryId);

            if (error) {
              return { success: false, error: error.message };
            }

            // Update local state
            set({
              userEntries: get().userEntries.map(entry =>
                entry.id === entryId ? { ...entry, status: 'withdrawn' } : entry
              ),
            });

            return { success: true };

          } catch (error: any) {
            return { success: false, error: error.message };
          } finally {
            set({ submitting: false });
          }
        },

        fetchUserEntries: async (competitionId?: string) => {
          const user = useSessionStore.getState().user;

          if (!user) return;

          try {
            let query = supabase
              .from('competition_entries')
              .select(`
                *,
                participant:users!competition_entries_participant_id_fkey(id, username, avatar_url, full_name),
                competition:competitions!competition_entries_competition_id_fkey(id, title, status)
              `)
              .eq('participant_id', user.id);

            if (competitionId) {
              query = query.eq('competition_id', competitionId);
            }

            const { data, error } = await query
              .order('submitted_at', { ascending: false });

            if (error) throw error;

            set({ userEntries: data || [] });

          } catch (error: any) {
            console.error('Fetch user entries error:', error);
          }
        },

        fetchEntries: async (competitionId: string, page = 1) => {
          try {
            set({ loading: true });

            const limit = 20;
            const offset = (page - 1) * limit;

            const { data, error } = await supabase
              .from('competition_entries')
              .select(`
                *,
                participant:users!competition_entries_participant_id_fkey(id, username, avatar_url, full_name)
              `)
              .eq('competition_id', competitionId)
              .in('status', ['submitted', 'approved', 'featured'])
              .order('submitted_at', { ascending: false })
              .range(offset, offset + limit - 1);

            if (error) throw error;

            // This would typically be stored in a separate entries state
            // For now, we can trigger a leaderboard fetch which includes entries

          } catch (error: any) {
            console.error('Fetch entries error:', error);
            set({ error: error.message });
          } finally {
            set({ loading: false });
          }
        },

        // Voting Actions
        voteForEntry: async (entryId: string, score: number, criteriaScores?: any) => {
          const user = useSessionStore.getState().user;

          if (!user) {
            return { success: false, error: 'Not authenticated' };
          }

          if (score < 1 || score > 10) {
            return { success: false, error: 'Score must be between 1 and 10' };
          }

          try {
            set({ voting: true });

            // Check if already voted
            const existingVote = get().userVotes.get(entryId);
            if (existingVote) {
              return { success: false, error: 'Already voted for this entry' };
            }

            const { data, error } = await supabase
              .from('votes')
              .insert({
                entry_id: entryId,
                voter_id: user.id,
                score,
                vote_type: 'public',
                criteria_scores: criteriaScores || {},
                is_anonymous: false,
              })
              .select()
              .single();

            if (error) {
              return { success: false, error: error.message };
            }

            // Update local votes
            const newVotes = new Map(get().userVotes);
            newVotes.set(entryId, data);
            set({ userVotes: newVotes });

            // Refresh entries to update vote counts
            const entry = get().userEntries.find(e => e.id === entryId);
            if (entry) {
              await get().fetchUserEntries(entry.competition_id);
            }

            return { success: true };

          } catch (error: any) {
            return { success: false, error: error.message };
          } finally {
            set({ voting: false });
          }
        },

        fetchUserVotes: async (competitionId: string) => {
          const user = useSessionStore.getState().user;

          if (!user) return;

          try {
            const { data, error } = await supabase
              .from('votes')
              .select(`
                *,
                competition_entry:entries!votes_entry_id_fkey(
                  id,
                  title,
                  competition_id,
                  participant:users!entries_participant_id_fkey(username)
                )
              `)
              .eq('voter_id', user.id)
              .in('competition_entry.competition_id', [competitionId]);

            if (error) throw error;

            const votesMap = new Map();
            (data || []).forEach((vote: CompetitionVote) => {
              votesMap.set(vote.entry_id, vote);
            });

            set({ userVotes: votesMap });

          } catch (error: any) {
            console.error('Fetch user votes error:', error);
          }
        },

        fetchLeaderboard: async (competitionId: string) => {
          try {
            set({ loading: true });

            // This would typically call a database function to get the leaderboard
            const { data, error } = await supabase
              .from('competition_leaderboards')
              .select(`
                *,
                user:users(id, username, avatar_url, full_name),
                competition_entry:competition_entries(id, title, images, participant_id)
              `)
              .eq('competition_id', competitionId)
              .order('placement', { ascending: true });

            if (error) throw error;

            set({ leaderboard: data || [] });

          } catch (error: any) {
            console.error('Fetch leaderboard error:', error);
            set({ error: error.message });
          } finally {
            set({ loading: false });
          }
        },

        // Filter and Search
        setFilters: (filters: Partial<CompetitionFilter>) => {
          set({ filters: { ...get().filters, ...filters } });
        },

        clearFilters: () => {
          set({
            filters: {
              status: ['active', 'upcoming'],
              eligibility: 'all',
              timeframe: 'active',
            },
          });
        },

        searchCompetitions: async (query: string) => {
          try {
            const { data, error } = await supabase
              .from('competitions')
              .select(`
                *,
                creator:users!competitions_created_by_fkey(id, username, avatar_url)
              `)
              .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
              .eq('status', 'active')
              .order('created_at', { ascending: false })
              .limit(20);

            if (error) throw error;

            return data || [];

          } catch (error: any) {
            console.error('Search competitions error:', error);
            return [];
          }
        },

        // Utility
        clearError: () => set({ error: null }),
        setLoading: (loading: boolean) => set({ loading }),
        setCurrentCompetition: (competition: Competition | null) => set({ currentCompetition: competition }),
        isUserEligible: (competition: Competition) => {
          const user = useSessionStore.getState().user;

          if (!user) return false;

          // Check competition status
          if (!['active', 'upcoming', 'voting'].includes(competition.status)) {
            return false;
          }

          // Check global competitions
          if (competition.is_global) {
            return true;
          }

          // Check country eligibility
          if (competition.eligible_countries && competition.eligible_countries.length > 0) {
            if (!user.country || !competition.eligible_countries.includes(user.country)) {
              return false;
            }
          }

          // Check excluded countries
          if (competition.excluded_countries && user.country && competition.excluded_countries.includes(user.country)) {
            return false;
          }

          // Check age restrictions
          if (competition.age_restriction) {
            const userAge = user.date_of_birth ? calculateAge(user.date_of_birth) : 0;
            if (competition.age_restriction.min_age && userAge < competition.age_restriction.min_age) {
              return false;
            }
            if (competition.age_restriction.max_age && userAge > competition.age_restriction.max_age) {
              return false;
            }
          }

          return true;
        },
      }),
      storageConfig
    )
  )
);

// Helper function
function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}

// Selectors for commonly used state
export const useCompetitions = () => ({
  competitions: useCompetitionStore((state) => state.competitions),
  loading: useCompetitionStore((state) => state.loading),
  refreshing: useCompetitionStore((state) => state.refreshing),
  error: useCompetitionStore((state) => state.error),
  filters: useCompetitionStore((state) => state.filters),
});

export const useCurrentCompetition = () => ({
  currentCompetition: useCompetitionStore((state) => state.currentCompetition),
  userEntries: useCompetitionStore((state) => state.userEntries),
  leaderboard: useCompetitionStore((state) => state.leaderboard),
});

export const useCompetitionActions = () => ({
  fetchCompetitions: useCompetitionStore((state) => state.fetchCompetitions),
  fetchCompetition: useCompetitionStore((state) => state.fetchCompetition),
  joinCompetition: useCompetitionStore((state) => state.joinCompetition),
  submitEntry: useCompetitionStore((state) => state.submitEntry),
  voteForEntry: useCompetitionStore((state) => state.voteForEntry),
  fetchLeaderboard: useCompetitionStore((state) => state.fetchLeaderboard),
});

export const useCompetitionSubmission = () => ({
  submitting: useCompetitionStore((state) => state.submitting),
  updateEntry: useCompetitionStore((state) => state.updateEntry),
  withdrawEntry: useCompetitionStore((state) => state.withdrawEntry),
});

export const useCompetitionVoting = () => ({
  voting: useCompetitionStore((state) => state.voting),
  userVotes: useCompetitionStore((state) => state.userVotes),
  fetchUserVotes: useCompetitionStore((state) => state.fetchUserVotes),
});