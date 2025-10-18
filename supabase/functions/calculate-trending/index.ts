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

    console.log('Starting trending score calculation...')

    // Get request data
    const requestData = await req.json().catch(() => ({}))
    const hoursToProcess = requestData.hours || 24 // Default to last 24 hours
    const batchSize = requestData.batch_size || 100 // Process in batches
    const forceRefresh = requestData.force_refresh || false

    // Process posts in batches to avoid timeouts
    const results = {
      total_posts_processed: 0,
      posts_updated: 0,
      engagement_records_created: 0,
      trending_posts: [],
      errors: [],
      processing_time_ms: 0
    }

    const startTime = Date.now()

    // Get posts to process (recent posts within the time window)
    const { data: posts, error: postsError } = await supabaseClient
      .from('posts')
      .select(`
        id,
        author_id,
        content,
        created_at,
        likes_count,
        comments_count,
        shares_count
      `)
      .gte('created_at', new Date(Date.now() - hoursToProcess * 60 * 60 * 1000).toISOString())
      .eq('visibility', 'public')
      .not('is_archived', 'eq', true)
      .order('created_at', { ascending: false })
      .limit(batchSize)

    if (postsError) {
      console.error('Error fetching posts:', postsError)
      throw postsError
    }

    if (!posts || posts.length === 0) {
      return new Response(
        JSON.stringify({
          message: 'No posts to process',
          results: results
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    results.total_posts_processed = posts.length

    // Process each post
    for (const post of posts) {
      try {
        // Calculate engagement metrics
        const engagementData = await calculateEngagementMetrics(
          supabaseClient,
          post.id,
          hoursToProcess
        )

        // Calculate trending score with time decay
        const trendingScore = calculateTrendingScore(post, engagementData, hoursToProcess)

        // Update post with new scores
        const { error: updateError } = await supabaseClient
          .from('posts')
          .update({
            trending_score: trendingScore,
            updated_at: new Date().toISOString()
          })
          .eq('id', post.id)

        if (updateError) {
          console.error(`Error updating post ${post.id}:`, updateError)
          results.errors.push({ post_id: post.id, error: updateError.message })
          continue
        }

        // Create engagement records
        await createEngagementRecords(supabaseClient, post.id, engagementData)
        results.engagement_records_created += engagementData.details.length

        // Track trending posts (score > threshold)
        if (trendingScore > 10) { // Adjust threshold as needed
          results.trending_posts.push({
            post_id: post.id,
            author_id: post.author_id,
            trending_score: trendingScore,
            total_engagement: engagementData.total_engagement,
            engagement_rate: engagementData.engagement_rate
          })
        }

        results.posts_updated++

      } catch (error) {
        console.error(`Error processing post ${post.id}:`, error)
        results.errors.push({ post_id: post.id, error: error.message })
      }
    }

    // Update feed settings with current trending configuration
    await updateFeedSettings(supabaseClient)

    // Create daily trending summary
    await createTrendingSummary(supabaseClient, results)

    results.processing_time_ms = Date.now() - startTime

    console.log(`Trending calculation completed:`, results)

    return new Response(
      JSON.stringify({
        message: 'Trending scores calculated successfully',
        results: results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Error in calculate-trending:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

async function calculateEngagementMetrics(supabaseClient: any, postId: string, hoursWindow: number) {
  const timeWindow = new Date(Date.now() - hoursWindow * 60 * 60 * 1000).toISOString()

  // Get engagement data from multiple sources
  const [
    { data: likes },
    { data: comments },
    { data: shares },
    { data: saves }
  ] = await Promise.all([
    supabaseClient
      .from('likes')
      .select('created_at, user_id')
      .eq('post_id', postId)
      .gte('created_at', timeWindow),

    supabaseClient
      .from('comments')
      .select('created_at, user_id, content')
      .eq('post_id', postId)
      .gte('created_at', timeWindow),

    supabaseClient
      .from('shares')
      .select('created_at, user_id')
      .eq('post_id', postId)
      .gte('created_at', timeWindow),

    supabaseClient
      .from('post_saves')
      .select('created_at, user_id')
      .eq('post_id', postId)
      .gte('created_at', timeWindow)
  ])

  // Calculate weighted engagement
  const engagementDetails = []
  let totalEngagement = 0

  // Add likes (weight: 1.0)
  if (likes) {
    likes.forEach((like: any) => {
      engagementDetails.push({
        type: 'like',
        user_id: like.user_id,
        created_at: like.created_at,
        weight: 1.0,
        value: 1.0
      })
      totalEngagement += 1.0
    })
  }

  // Add comments (weight: 2.0)
  if (comments) {
    comments.forEach((comment: any) => {
      const commentWeight = Math.min(2.0 + (comment.content?.length || 0) / 100, 3.0) // Longer comments get more weight
      engagementDetails.push({
        type: 'comment',
        user_id: comment.user_id,
        created_at: comment.created_at,
        weight: commentWeight,
        value: commentWeight,
        metadata: { comment_length: comment.content?.length || 0 }
      })
      totalEngagement += commentWeight
    })
  }

  // Add shares (weight: 3.0)
  if (shares) {
    shares.forEach((share: any) => {
      engagementDetails.push({
        type: 'share',
        user_id: share.user_id,
        created_at: share.created_at,
        weight: 3.0,
        value: 3.0
      })
      totalEngagement += 3.0
    })
  }

  // Add saves (weight: 1.5)
  if (saves) {
    saves.forEach((save: any) => {
      engagementDetails.push({
        type: 'save',
        user_id: save.user_id,
        created_at: save.created_at,
        weight: 1.5,
        value: 1.5
      })
      totalEngagement += 1.5
    })
  }

  // Calculate engagement rate (engagement per hour)
  const oldestEngagement = engagementDetails.length > 0
    ? new Date(engagementDetails[0].created_at)
    : new Date()
  const hoursSinceOldest = Math.max((Date.now() - oldestEngagement.getTime()) / (1000 * 60 * 60), 1)
  const engagementRate = totalEngagement / hoursSinceOldest

  return {
    total_engagement: totalEngagement,
    engagement_rate: engagementRate,
    details: engagementDetails,
    counts: {
      likes: likes?.length || 0,
      comments: comments?.length || 0,
      shares: shares?.length || 0,
      saves: saves?.length || 0
    }
  }
}

function calculateTrendingScore(post: any, engagementData: any, hoursWindow: number): number {
  const hoursSincePost = (Date.now() - new Date(post.created_at).getTime()) / (1000 * 60 * 60)

  // Base engagement score
  const baseScore = engagementData.total_engagement

  // Time decay factor (exponential decay)
  const decayHalfLife = 72 // hours (3 days)
  const timeDecay = Math.exp(-Math.log(2) * hoursSincePost / decayHalfLife)

  // Recency boost (posts in the last 6 hours get a boost)
  let recencyBoost = 1.0
  if (hoursSincePost < 6) {
    recencyBoost = 1.5
  } else if (hoursSincePost < 12) {
    recencyBoost = 1.25
  }

  // Velocity boost (rapid engagement in short time)
  let velocityBoost = 1.0
  if (engagementData.engagement_rate > 5) {
    velocityBoost = 1.3
  } else if (engagementData.engagement_rate > 2) {
    velocityBoost = 1.15
  }

  // Diversity boost (different types of engagement)
  const engagementTypes = new Set(engagementData.details.map((d: any) => d.type)).size
  const diversityBoost = 1.0 + (engagementTypes - 1) * 0.1

  // Final trending score
  const trendingScore = baseScore * timeDecay * recencyBoost * velocityBoost * diversityBoost

  return Math.round(trendingScore * 100) / 100 // Round to 2 decimal places
}

async function createEngagementRecords(supabaseClient: any, postId: string, engagementData: any) {
  if (engagementData.details.length === 0) return

  // Batch insert engagement records
  const records = engagementData.details.map((detail: any) => ({
    post_id: postId,
    user_id: detail.user_id,
    engagement_type: detail.type,
    engagement_value: detail.value,
    metadata: detail.metadata || {},
    created_at: detail.created_at,
    updated_at: new Date().toISOString()
  }))

  const { error } = await supabaseClient
    .from('post_engagement')
    .upsert(records, { onConflict: 'post_id,user_id,engagement_type,created_at' })

  if (error) {
    console.error('Error creating engagement records:', error)
  }
}

async function updateFeedSettings(supabaseClient: any) {
  // Update algorithm parameters based on current trending performance
  const settings = [
    { key: 'trending_decay_hours', value: 72.0, category: 'trending' },
    { key: 'like_weight', value: 1.0, category: 'trending' },
    { key: 'comment_weight', value: 2.0, category: 'trending' },
    { key: 'share_weight', value: 3.0, category: 'trending' },
    { key: 'save_weight', value: 1.5, category: 'trending' },
    { key: 'recency_boost_hours', value: 6.0, category: 'trending' }
  ]

  for (const setting of settings) {
    await supabaseClient
      .from('feed_settings')
      .upsert({
        setting_key: setting.key,
        setting_value: setting.value,
        setting_type: 'weight',
        category: setting.category,
        description: `Auto-updated trending parameter: ${setting.key}`,
        updated_at: new Date().toISOString()
      }, { onConflict: 'setting_key' })
  }
}

async function createTrendingSummary(supabaseClient: any, results: any) {
  const summaryData = {
    date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    total_posts_processed: results.total_posts_processed,
    posts_updated: results.posts_updated,
    engagement_records_created: results.engagement_records_created,
    trending_posts_count: results.trending_posts.length,
    processing_time_ms: results.processing_time_ms,
    top_trending_posts: results.trending_posts.slice(0, 10), // Top 10 trending posts
    error_count: results.errors.length,
    metadata: {
      batch_size: 100,
      processing_window_hours: 24,
      average_engagement_rate: results.trending_posts.length > 0
        ? results.trending_posts.reduce((sum: number, post: any) => sum + post.engagement_rate, 0) / results.trending_posts.length
        : 0
    }
  }

  const { error } = await supabaseClient
    .from('trending_summaries')
    .upsert(summaryData, { onConflict: 'date' })

  if (error) {
    console.error('Error creating trending summary:', error)
  }

  console.log('Trending summary created for date:', summaryData.date)
}