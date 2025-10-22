import { supabase } from '../utils/supabase'
import { useSessionStore } from '../store/sessionStore'

// Types for simplified voting
export interface VoteResult {
  success: boolean
  action?: 'vote_added' | 'vote_removed'
  votes_count?: number
  error?: string
}

export interface LeaderboardEntry {
  rank: number
  entry_id: string
  participant_id: string
  participant_username: string
  participant_avatar_url?: string
  entry_title: string
  entry_images: string[]
  votes_count: number
  country_votes_count: number
  total_votes_count: number
  created_at: string
}

export interface VotingStatus {
  entry_id: string
  has_voted: boolean
  voted_at?: string
}

export interface WinnerInfo {
  entry_id: string
  participant_id: string
  final_rank: number
  final_votes: number
  points_awarded: number
  winner_type: 'grand_winner' | 'top_3' | 'top_10' | 'participant'
}

class CompetitionVotingService {
  // Vote for an entry (toggle functionality - removes if already voted)
  async voteForEntry(
    entryId: string,
    voterCountry?: string,
    voterIp?: string
  ): Promise<VoteResult> {
    try {
      const user = useSessionStore.getState().user
      if (!user) {
        return { success: false, error: 'Not authenticated' }
      }

      const { data, error } = await supabase.rpc('vote_for_competition_entry', {
        p_entry_id: entryId,
        p_voter_country: voterCountry || user.country || null,
        p_voter_ip: voterIp || null
      })

      if (error) {
        console.error('Vote error:', error)
        return { success: false, error: error.message }
      }

      return data as VoteResult

    } catch (error: any) {
      console.error('Vote service error:', error)
      return { success: false, error: error.message }
    }
  }

  // Get user's voting status for all entries in a competition
  async getUserVotingStatus(competitionId: string): Promise<VotingStatus[]> {
    try {
      const user = useSessionStore.getState().user
      if (!user) {
        return []
      }

      const { data, error } = await supabase.rpc('get_user_voting_status', {
        p_competition_id: competitionId
      })

      if (error) {
        console.error('Get voting status error:', error)
        return []
      }

      return data || []

    } catch (error: any) {
      console.error('Get voting status service error:', error)
      return []
    }
  }

  // Get country-filtered leaderboard
  async getLeaderboard(
    competitionId: string,
    countryFilter?: string,
    limit: number = 100
  ): Promise<LeaderboardEntry[]> {
    try {
      const { data, error } = await supabase.rpc('get_competition_leaderboard', {
        p_competition_id: competitionId,
        p_country_filter: countryFilter || null,
        p_limit: limit
      })

      if (error) {
        console.error('Get leaderboard error:', error)
        return []
      }

      return data || []

    } catch (error: any) {
      console.error('Get leaderboard service error:', error)
      return []
    }
  }

  // Get real-time vote counts for entries
  async getEntryVoteCounts(competitionId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase.rpc('get_entry_vote_counts', {
        p_competition_id: competitionId
      })

      if (error) {
        console.error('Get vote counts error:', error)
        return []
      }

      return data || []

    } catch (error: any) {
      console.error('Get vote counts service error:', error)
      return []
    }
  }

  // Check if user has voted for a specific entry
  async hasUserVotedForEntry(entryId: string): Promise<boolean> {
    try {
      const user = useSessionStore.getState().user
      if (!user) {
        return false
      }

      const { data, error } = await supabase
        .from('competition_votes')
        .select('id')
        .eq('entry_id', entryId)
        .eq('voter_id', user.id)
        .single()

      return !error && !!data

    } catch (error: any) {
      // No vote found returns error, which is expected
      return false
    }
  }

  // Get vote count for a specific entry
  async getEntryVoteCount(entryId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('competition_votes')
        .select('*', { count: 'exact', head: true })
        .eq('entry_id', entryId)

      if (error) {
        console.error('Get entry vote count error:', error)
        return 0
      }

      return count || 0

    } catch (error: any) {
      console.error('Get entry vote count service error:', error)
      return 0
    }
  }

  // Determine competition winners (6 hours after voting ends)
  async determineWinners(competitionId: string): Promise<WinnerInfo[]> {
    try {
      const { data, error } = await supabase.rpc('determine_competition_winners', {
        p_competition_id: competitionId
      })

      if (error) {
        console.error('Determine winners error:', error)
        return []
      }

      return data || []

    } catch (error: any) {
      console.error('Determine winners service error:', error)
      return []
    }
  }

  // Get public leaderboards for multiple competitions
  async getPublicLeaderboards(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('public_leaderboards')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Get public leaderboards error:', error)
        return []
      }

      return data || []

    } catch (error: any) {
      console.error('Get public leaderboards service error:', error)
      return []
    }
  }

  // Get voting statistics for a competition
  async getVotingStatistics(competitionId: string): Promise<{
    total_votes: number
    unique_voters: number
    votes_by_country: Record<string, number>
    voting_period_active: boolean
  }> {
    try {
      const { data, error } = await supabase
        .from('competition_votes')
        .select('voter_id, voter_country, created_at')
        .eq('competition_id', competitionId)

      if (error) {
        console.error('Get voting statistics error:', error)
        return {
          total_votes: 0,
          unique_voters: 0,
          votes_by_country: {},
          voting_period_active: false
        }
      }

      const votes = Array.isArray(data) ? data : []
      const uniqueVoters = new Set(votes.map(v => v?.voter_id).filter(Boolean)).size
      const votesByCountry: Record<string, number> = {}

      votes.forEach(vote => {
        if (vote) {
          const country = vote.voter_country || 'Unknown'
          votesByCountry[country] = (votesByCountry[country] || 0) + 1
        }
      })

      // Check if competition is still in voting period
      const { data: competitionData } = await supabase
        .from('competitions')
        .select('status, voting_end_date, end_date')
        .eq('id', competitionId)
        .single()

      const votingPeriodActive = competitionData?.status === 'voting' &&
        new Date() <= new Date(competitionData.voting_end_date || competitionData.end_date)

      return {
        total_votes: votes.length,
        unique_voters: uniqueVoters,
        votes_by_country: votesByCountry,
        voting_period_active: votingPeriodActive || false
      }

    } catch (error: any) {
      console.error('Get voting statistics service error:', error)
      return {
        total_votes: 0,
        unique_voters: 0,
        votes_by_country: {},
        voting_period_active: false
      }
    }
  }

  // Get user's voting history
  async getUserVotingHistory(limit: number = 20): Promise<any[]> {
    try {
      const user = useSessionStore.getState().user
      if (!user) {
        return []
      }

      const { data, error } = await supabase
        .from('competition_votes')
        .select(`
          *,
          competition_entry:competition_entries(
            id,
            title,
            images,
            competition:competitions(id, title, status, end_date)
          )
        `)
        .eq('voter_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Get voting history error:', error)
        return []
      }

      return data || []

    } catch (error: any) {
      console.error('Get voting history service error:', error)
      return []
    }
  }

  // Check if voting is open for a competition
  async isVotingOpen(competitionId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('competitions')
        .select('status, start_date, end_date, voting_end_date')
        .eq('id', competitionId)
        .single()

      if (error || !data) {
        return false
      }

      const now = new Date()
      const startDate = new Date(data.start_date)
      const endDate = new Date(data.voting_end_date || data.end_date)

      return data.status === 'voting' && now >= startDate && now <= endDate

    } catch (error: any) {
      console.error('Check voting open error:', error)
      return false
    }
  }

  // Remove user's vote from an entry
  async removeVote(entryId: string): Promise<VoteResult> {
    try {
      const user = useSessionStore.getState().user
      if (!user) {
        return { success: false, error: 'Not authenticated' }
      }

      const { error } = await supabase
        .from('competition_votes')
        .delete()
        .eq('entry_id', entryId)
        .eq('voter_id', user.id)

      if (error) {
        return { success: false, error: error.message }
      }

      const votesCount = await this.getEntryVoteCount(entryId)

      return {
        success: true,
        action: 'vote_removed',
        votes_count: votesCount
      }

    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
}

// Export singleton instance
export const competitionVotingService = new CompetitionVotingService()
export default competitionVotingService