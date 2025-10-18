import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get competition ID from request body or query params
    let competitionId: string
    const requestData = await req.json().catch(() => ({}))

    if (requestData.competition_id) {
      competitionId = requestData.competition_id
    } else if (new URL(req.url).searchParams.get('competition_id')) {
      competitionId = new URL(req.url).searchParams.get('competition_id')!
    } else {
      // If no competition ID, look for competitions that need finalization
      const { data: competitions, error: compError } = await supabaseClient
        .from('competitions')
        .select('*')
        .eq('status', 'active')
        .lt('end_date', new Date().toISOString())

      if (compError) throw compError

      if (!competitions || competitions.length === 0) {
        return new Response(
          JSON.stringify({ message: 'No competitions to finalize' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      }

      // Finalize all eligible competitions
      const results = []
      for (const competition of competitions) {
        try {
          const result = await finalizeCompetition(supabaseClient, competition.id)
          results.push(result)
        } catch (error) {
          console.error(`Error finalizing competition ${competition.id}:`, error)
          results.push({ competition_id: competition.id, error: error.message })
        }
      }

      return new Response(
        JSON.stringify({
          message: 'Batch finalization complete',
          results: results
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Finalize specific competition
    const result = await finalizeCompetition(supabaseClient, competitionId)

    return new Response(
      JSON.stringify({
        message: 'Competition finalized successfully',
        competition_id: competitionId,
        result: result
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Error in finalize-competition:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

async function finalizeCompetition(supabaseClient: any, competitionId: string) {
  console.log(`Finalizing competition: ${competitionId}`)

  // Get competition details
  const { data: competition, error: compError } = await supabaseClient
    .from('competitions')
    .select('*')
    .eq('id', competitionId)
    .single()

  if (compError) throw compError

  // Get all competition entries with vote counts
  const { data: entries, error: entriesError } = await supabaseClient
    .from('competition_entries')
    .select(`
      *,
      participants:users!competition_entries_participant_id_fkey(id, username, avatar_url, full_name)
    `)
    .eq('competition_id', competitionId)
    .eq('status', 'approved')
    .order('average_score', { ascending: false })

  if (entriesError) throw entriesError

  if (!entries || entries.length === 0) {
    throw new Error('No approved entries found for this competition')
  }

  // Calculate rankings and award points
  const totalEntries = entries.length
  const rankings = []
  let rank = 1

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]

    // Calculate rank (handle ties)
    if (i > 0 && entry.average_score < entries[i - 1].average_score) {
      rank = i + 1
    }

    const placement = rank
    let pointsAwarded = 0

    // Award points based on placement
    if (placement === 1) {
      pointsAwarded = 500 // 1st place
    } else if (placement === 2) {
      pointsAwarded = 300 // 2nd place
    } else if (placement === 3) {
      pointsAwarded = 200 // 3rd place
    } else if (placement <= 10) {
      pointsAwarded = 100 // Top 10
    } else if (placement <= Math.ceil(totalEntries * 0.25)) {
      pointsAwarded = 50 // Top 25%
    } else if (placement <= Math.ceil(totalEntries * 0.5)) {
      pointsAwarded = 25 // Top 50%
    }

    // Award participation points if no placement points
    if (pointsAwarded === 0) {
      pointsAwarded = 10 // Participation
    }

    // Record points transaction
    const { error: pointsError } = await supabaseClient
      .from('points_transactions')
      .insert({
        user_id: entry.participant_id,
        transaction_type: 'competition_win',
        points_amount: pointsAwarded,
        reference_id: entry.id,
        reference_type: 'competition_entry',
        description: `${placement}${getOrdinalSuffix(placement)} place in ${competition.title}`,
        balance_before: await getUserBalance(supabaseClient, entry.participant_id),
        balance_after: await getUserBalance(supabaseClient, entry.participant_id) + pointsAwarded,
        metadata: {
          competition_id: competitionId,
          competition_title: competition.title,
          placement: placement,
          average_score: entry.average_score,
          total_votes: entry.votes_count
        }
      })

    if (pointsError) {
      console.error(`Error awarding points to user ${entry.participant_id}:`, pointsError)
    }

    rankings.push({
      entry_id: entry.id,
      participant_id: entry.participant_id,
      participant: entry.participants,
      placement: placement,
      average_score: entry.average_score,
      votes_count: entry.votes_count,
      points_awarded: pointsAwarded
    })
  }

  // Update competition status
  const { error: updateError } = await supabaseClient
    .from('competitions')
    .update({
      status: 'completed',
      finalized_at: new Date().toISOString(),
      total_participants: entries.length,
      total_votes: entries.reduce((sum, entry) => sum + entry.votes_count, 0),
      metadata: {
        ...competition.metadata,
        final_rankings: rankings,
        finalization_date: new Date().toISOString()
      }
    })
    .eq('id', competitionId)

  if (updateError) throw updateError

  // Update entries with final rankings
  for (const ranking of rankings) {
    const { error: entryUpdateError } = await supabaseClient
      .from('competition_entries')
      .update({
        final_placement: ranking.placement,
        final_points_awarded: ranking.points_awarded,
        status: 'completed'
      })
      .eq('id', ranking.entry_id)

    if (entryUpdateError) {
      console.error(`Error updating entry ${ranking.entry_id}:`, entryUpdateError)
    }
  }

  // Create leaderboard entries
  const leaderboardEntries = rankings.map((ranking, index) => ({
    competition_id: competitionId,
    user_id: ranking.participant_id,
    placement: ranking.placement,
    score: ranking.average_score,
    votes_received: ranking.votes_count,
    points_awarded: ranking.points_awarded,
    created_at: new Date().toISOString()
  }))

  if (leaderboardEntries.length > 0) {
    const { error: leaderboardError } = await supabaseClient
      .from('competition_leaderboards')
      .upsert(leaderboardEntries, { onConflict: 'competition_id,user_id' })

    if (leaderboardError) {
      console.error('Error creating leaderboard entries:', leaderboardError)
    }
  }

  // Send notifications to winners
  await sendWinnerNotifications(supabaseClient, competition, rankings)

  return {
    competition_id: competitionId,
    competition_title: competition.title,
    total_entries: totalEntries,
    rankings: rankings,
    total_points_awarded: rankings.reduce((sum, r) => sum + r.points_awarded, 0)
  }
}

async function getUserBalance(supabaseClient: any, userId: string): Promise<number> {
  const { data } = await supabaseClient
    .from('points_transactions')
    .select('points_amount')
    .eq('user_id', userId)
    .eq('is_expired', false)
    .or('expires_at.is.null,expires_at.gt.now()')

  if (!data) return 0
  return data.reduce((sum: number, transaction: any) => sum + transaction.points_amount, 0)
}

function getOrdinalSuffix(num: number): string {
  const j = num % 10
  const k = num % 100
  if (j == 1 && k != 11) return "st"
  if (j == 2 && k != 12) return "nd"
  if (j == 3 && k != 13) return "rd"
  return "th"
}

async function sendWinnerNotifications(supabaseClient: any, competition: any, rankings: any[]) {
  // Notify top 3 winners
  const winners = rankings.filter(r => r.placement <= 3)

  for (const winner of winners) {
    const notificationData = {
      user_id: winner.participant_id,
      type: 'competition_result',
      title: `🏆 ${winner.placement}${getOrdinalSuffix(winner.placement)} Place!`,
      message: `Congratulations! You finished ${winner.placement}${getOrdinalSuffix(winner.placement)} in "${competition.title}" and won ${winner.points_awarded} points!`,
      metadata: {
        competition_id: competition.id,
        placement: winner.placement,
        points_awarded: winner.points_awarded
      }
    }

    const { error: notificationError } = await supabaseClient
      .from('notifications')
      .insert(notificationData)

    if (notificationError) {
      console.error(`Error sending notification to user ${winner.participant_id}:`, notificationError)
    }
  }

  // Create a public announcement about the competition results
  const announcementData = {
    type: 'competition_announcement',
    title: `🎯 ${competition.title} Results Are In!`,
    message: `The competition has ended! Check out the final rankings and congratulate the winners.`,
    metadata: {
      competition_id: competition.id,
      winners: rankings.filter(r => r.placement <= 3).map(r => ({
        user_id: r.participant_id,
        username: r.participant.username,
        placement: r.placement,
        points_awarded: r.points_awarded
      }))
    }
  }

  const { error: announcementError } = await supabaseClient
    .from('announcements')
    .insert(announcementData)

  if (announcementError) {
    console.error('Error creating competition announcement:', announcementError)
  }
}