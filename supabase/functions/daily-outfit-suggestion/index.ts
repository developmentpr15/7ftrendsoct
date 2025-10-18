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

    console.log('Starting daily outfit suggestion process...')

    // Get request data
    const requestData = await req.json().catch(() => ({}))
    const targetUserId = requestData.user_id
    const userLocation = requestData.location
    const weatherData = requestData.weather
    const occasion = requestData.occasion || 'casual'
    const preferences = requestData.preferences || {}

    // If no specific user, process all active users
    if (targetUserId) {
      const suggestion = await generateOutfitSuggestion(
        supabaseClient,
        targetUserId,
        userLocation,
        weatherData,
        occasion,
        preferences
      )

      return new Response(
        JSON.stringify({
          message: 'Outfit suggestion generated',
          suggestion: suggestion
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    } else {
      // Process all users for daily suggestions
      const results = await processAllUsers(supabaseClient)

      return new Response(
        JSON.stringify({
          message: 'Daily outfit suggestions processed',
          results: results
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

  } catch (error) {
    console.error('Error in daily-outfit-suggestion:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

async function processAllUsers(supabaseClient: any) {
  const results = {
    total_users: 0,
    suggestions_created: 0,
    users_with_suggestions: 0,
    errors: [],
    processing_time_ms: 0,
    summary: {
      weather_categories: {},
      occasion_types: {},
      popular_items: {}
    }
  }

  const startTime = Date.now()

  // Get active users who have preferences and wardrobe items
  const { data: users, error: usersError } = await supabaseClient
    .from('users')
    .select(`
      id,
      username,
      location,
      preferences,
      timezone
    `)
    .eq('is_active', true)
    .not('location', 'is', null)
    .not('preferences', 'is', null)

  if (usersError) {
    console.error('Error fetching users:', usersError)
    throw usersError
  }

  results.total_users = users.length

  // Process each user
  for (const user of users) {
    try {
      // Get user's weather data
      const weather = await getWeatherForUser(supabaseClient, user)

      // Generate outfit suggestion
      const suggestion = await generateOutfitSuggestion(
        supabaseClient,
        user.id,
        user.location,
        weather,
        'daily', // Daily suggestion
        user.preferences || {}
      )

      if (suggestion) {
        results.suggestions_created++
        results.users_with_suggestions++

        // Update summary statistics
        updateSummaryStats(results.summary, suggestion, weather)

        // Send notification to user
        await sendOutfitSuggestionNotification(supabaseClient, user.id, suggestion, weather)
      }

    } catch (error) {
      console.error(`Error processing user ${user.id}:`, error)
      results.errors.push({ user_id: user.id, error: error.message })
    }
  }

  results.processing_time_ms = Date.now() - startTime

  // Create daily processing summary
  await createDailySuggestionSummary(supabaseClient, results)

  console.log(`Daily outfit suggestions completed:`, results)

  return results
}

async function generateOutfitSuggestion(
  supabaseClient: any,
  userId: string,
  userLocation: any,
  weatherData: any,
  occasion: string,
  userPreferences: any
) {
  // Get or fetch weather data
  const weather = weatherData || await getWeatherForUser(supabaseClient, { id: userId, location: userLocation })

  if (!weather) {
    console.warn(`No weather data available for user ${userId}`)
    return null
  }

  // Get user's wardrobe items
  const { data: wardrobeItems, error: wardrobeError } = await supabaseClient
    .from('wardrobe_items')
    .select('*')
    .eq('user_id', userId)
    .eq('is_available', true)
    .not('last_worn', 'eq', new Date().toISOString().split('T')[0]) // Not worn today

  if (wardrobeError || !wardrobeItems || wardrobeItems.length === 0) {
    console.warn(`No available wardrobe items for user ${userId}`)
    return null
  }

  // Generate outfit based on weather, occasion, and preferences
  const outfit = buildOutfit(
    wardrobeItems,
    weather,
    occasion,
    userPreferences
  )

  if (!outfit) {
    console.warn(`Could not generate outfit for user ${userId}`)
    return null
  }

  // Create outfit suggestion record
  const suggestionData = {
    user_id: userId,
    title: generateOutfitTitle(weather, occasion, outfit),
    description: generateOutfitDescription(weather, occasion, outfit),
    items: outfit.items,
    weather_data: weather,
    occasion: occasion,
    style_tags: outfit.style_tags,
    confidence_score: outfit.confidence_score,
    metadata: {
      location: userLocation,
      temperature: weather.temperature,
      conditions: weather.conditions,
      user_preferences: userPreferences,
      generation_method: 'ai_algorithm'
    },
    created_at: new Date().toISOString()
  }

  const { data: suggestion, error: suggestionError } = await supabaseClient
    .from('outfit_suggestions')
    .insert(suggestionData)
    .select()
    .single()

  if (suggestionError) {
    console.error('Error creating outfit suggestion:', suggestionError)
    return null
  }

  return suggestion
}

async function getWeatherForUser(supabaseClient: any, user: any) {
  // Try to get cached weather data first
  const { data: cachedWeather, error: cacheError } = await supabaseClient
    .from('weather_cache')
    .select('*')
    .eq('location', user.location)
    .gt('cached_at', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()) // 2 hours old
    .order('cached_at', { ascending: false })
    .limit(1)
    .single()

  if (!cacheError && cachedWeather) {
    return cachedWeather.weather_data
  }

  // Fetch fresh weather data (mock implementation - replace with real weather API)
  const weatherData = await fetchWeatherData(user.location)

  if (weatherData) {
    // Cache the weather data
    await supabaseClient
      .from('weather_cache')
      .upsert({
        location: user.location,
        weather_data: weatherData,
        cached_at: new Date().toISOString()
      }, { onConflict: 'location' })
  }

  return weatherData
}

async function fetchWeatherData(location: any) {
  // Mock weather data - replace with real weather API call
  // This would typically call OpenWeatherMap, WeatherAPI, etc.

  const mockWeatherData = {
    location: location,
    temperature: Math.floor(Math.random() * 30) + 10, // 10-40°C
    conditions: ['sunny', 'cloudy', 'rainy', 'partly-cloudy'][Math.floor(Math.random() * 4)],
    humidity: Math.floor(Math.random() * 50) + 30, // 30-80%
    wind_speed: Math.floor(Math.random() * 20) + 5, // 5-25 km/h
    precipitation: Math.random() > 0.7 ? Math.floor(Math.random() * 10) : 0, // 0-10mm
    uv_index: Math.floor(Math.random() * 11), // 0-10
    feels_like: Math.floor(Math.random() * 30) + 10,
    forecast: {
      high: Math.floor(Math.random() * 35) + 15,
      low: Math.floor(Math.random() * 20) + 5
    }
  }

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100))

  return mockWeatherData
}

function buildOutfit(wardrobeItems: any[], weather: any, occasion: string, preferences: any) {
  // Filter items based on weather
  const weatherFiltered = wardrobeItems.filter(item =>
    isWeatherAppropriate(item, weather)
  )

  if (weatherFiltered.length === 0) {
    return null
  }

  // Filter items based on occasion
  const occasionFiltered = weatherFiltered.filter(item =>
    isOccasionAppropriate(item, occasion)
  )

  const finalItems = occasionFiltered.length > 0 ? occasionFiltered : weatherFiltered

  // Categorize items
  const categories = {
    outerwear: finalItems.filter(item => item.category === 'outerwear'),
    tops: finalItems.filter(item => item.category === 'top'),
    bottoms: finalItems.filter(item => item.category === 'bottom'),
    dresses: finalItems.filter(item => item.category === 'dress'),
    shoes: finalItems.filter(item => item.category === 'shoes'),
    accessories: finalItems.filter(item => item.category === 'accessories')
  }

  // Build outfit based on occasion and preferences
  const outfit = {
    items: [] as any[],
    style_tags: [] as string[],
    confidence_score: 0
  }

  // Determine outfit structure based on occasion
  const isCasual = ['casual', 'daily'].includes(occasion)
  const isFormal = ['formal', 'business', 'work'].includes(occasion)
  const isAthletic = ['sport', 'athletic', 'gym'].includes(occasion)

  // Select items
  if (isFormal) {
    // Formal outfit
    if (categories.dresses.length > 0) {
      outfit.items.push(selectBestItem(categories.dresses, preferences))
    } else {
      outfit.items.push(selectBestItem(categories.tops, preferences))
      outfit.items.push(selectBestItem(categories.bottoms, preferences))
    }
    outfit.items.push(selectBestItem(categories.shoes, preferences))
    if (weather.temperature < 20) {
      outfit.items.push(selectBestItem(categories.outerwear, preferences))
    }
  } else if (isAthletic) {
    // Athletic outfit
    outfit.items.push(selectBestItem(categories.tops.filter(item => item.material === 'athletic'), preferences))
    outfit.items.push(selectBestItem(categories.bottoms.filter(item => item.material === 'athletic'), preferences))
    outfit.items.push(selectBestItem(categories.shoes.filter(item => item.subcategory === 'athletic'), preferences))
  } else {
    // Casual outfit
    if (categories.dresses.length > 0 && weather.temperature > 15) {
      outfit.items.push(selectBestItem(categories.dresses, preferences))
    } else {
      outfit.items.push(selectBestItem(categories.tops, preferences))
      outfit.items.push(selectBestItem(categories.bottoms, preferences))
    }
    outfit.items.push(selectBestItem(categories.shoes, preferences))

    // Add outerwear if cold
    if (weather.temperature < 15) {
      outfit.items.push(selectBestItem(categories.outerwear, preferences))
    }
  }

  // Add accessories
  const accessoryCount = Math.min(2, categories.accessories.length)
  for (let i = 0; i < accessoryCount; i++) {
    const accessory = selectBestItem(
      categories.accessories.filter(a => !outfit.items.some(item => item.id === a.id)),
      preferences
    )
    if (accessory) outfit.items.push(accessory)
  }

  // Generate style tags
  outfit.style_tags = generateStyleTags(outfit.items, weather, occasion)

  // Calculate confidence score
  outfit.confidence_score = calculateConfidenceScore(outfit.items, weather, occasion, preferences)

  return outfit.items.length > 0 ? outfit : null
}

function isWeatherAppropriate(item: any, weather: any) {
  const temp = weather.temperature
  const conditions = weather.conditions

  // Temperature appropriateness
  if (item.season) {
    if (item.season === 'winter' && temp > 20) return false
    if (item.season === 'summer' && temp < 10) return false
    if (item.season === 'spring' && (temp < 5 || temp > 25)) return false
    if (item.season === 'fall' && (temp < 0 || temp > 22)) return false
  }

  // Condition appropriateness
  if (conditions === 'rainy' && item.material === 'denim') return false
  if (conditions === 'rainy' && item.category === 'shoes' && item.subcategory !== 'boots') return false
  if (conditions === 'sunny' && temp > 25 && item.material === 'wool') return false

  return true
}

function isOccasionAppropriate(item: any, occasion: string) {
  if (!item.occasions) return true // No restrictions

  return item.occasions.includes(occasion) || item.occasions.includes('all')
}

function selectBestItem(items: any[], preferences: any) {
  if (items.length === 0) return null
  if (items.length === 1) return items[0]

  // Score items based on user preferences
  const scored = items.map(item => {
    let score = 1.0

    // Preference for favorite items
    if (item.is_favorite) score += 2.0

    // Preference for recently worn items (but not too recent)
    const daysSinceWorn = item.last_worn
      ? Math.floor((Date.now() - new Date(item.last_worn).getTime()) / (1000 * 60 * 60 * 24))
      : 30
    if (daysSinceWorn >= 7 && daysSinceWorn <= 30) score += 1.0

    // Preference for preferred colors
    if (preferences.favorite_colors?.includes(item.color)) score += 1.5

    // Preference for preferred styles
    if (preferences.preferred_styles?.includes(item.style)) score += 1.0

    // Quality score
    score += (item.quality_score || 0) * 0.5

    return { item, score }
  })

  // Sort by score and return the best
  scored.sort((a, b) => b.score - a.score)
  return scored[0].item
}

function generateStyleTags(items: any[], weather: any, occasion: string) {
  const tags = [occasion]

  // Weather-based tags
  if (weather.conditions === 'sunny') tags.push('sunny-day')
  if (weather.conditions === 'rainy') tags.push('rainy-day')
  if (weather.temperature < 10) tags.push('cold-weather')
  if (weather.temperature > 25) tags.push('warm-weather')

  // Style-based tags
  const styles = items.map(item => item.style).filter(Boolean)
  tags.push(...styles)

  // Color-based tags
  const colors = items.map(item => item.color).filter(Boolean)
  if (colors.length > 0) {
    tags.push(`${colors[0]}-outfit`)
  }

  return [...new Set(tags)] // Remove duplicates
}

function calculateConfidenceScore(items: any[], weather: any, occasion: string, preferences: any) {
  let score = 0.5 // Base score

  // Weather appropriateness
  const weatherAppropriate = items.filter(item => isWeatherAppropriate(item, weather))
  score += (weatherAppropriate.length / items.length) * 0.3

  // Occasion appropriateness
  const occasionAppropriate = items.filter(item => isOccasionAppropriate(item, occasion))
  score += (occasionAppropriate.length / items.length) * 0.2

  // Preference matching
  const preferenceMatches = items.filter(item => {
    return preferences.favorite_colors?.includes(item.color) ||
           preferences.preferred_styles?.includes(item.style) ||
           item.is_favorite
  })
  score += (preferenceMatches.length / items.length) * 0.2

  // Item availability and quality
  const availableItems = items.filter(item => item.is_available)
  const avgQuality = items.reduce((sum, item) => sum + (item.quality_score || 0), 0) / items.length
  score += (availableItems.length / items.length) * 0.1
  score += (avgQuality / 10) * 0.1

  return Math.min(Math.round(score * 100) / 100, 1.0) // Round to 2 decimal places, max 1.0
}

function generateOutfitTitle(weather: any, occasion: string, outfit: any) {
  const titles = {
    casual: [
      'Everyday Comfort',
      'Casual Chic',
      'Weekend Vibes',
      'Relaxed Style'
    ],
    work: [
      'Office Ready',
      'Business Casual',
      'Professional Look',
      'Work Style'
    ],
    formal: [
      'Elegant Evening',
      'Formal Attire',
      'Sophisticated Style',
      'Dress to Impress'
    ],
    sport: [
      'Athletic Comfort',
      'Gym Ready',
      'Sport Style',
      'Active Wear'
    ]
  }

  const baseTitles = titles[occasion] || titles.casual
  const baseTitle = baseTitles[Math.floor(Math.random() * baseTitles.length)]

  const weatherModifier = weather.conditions === 'sunny' ? 'Sunny ' :
                        weather.conditions === 'rainy' ? 'Rainy ' : ''

  return `${weatherModifier}${baseTitle}`
}

function generateOutfitDescription(weather: any, occasion: string, outfit: any) {
  const temp = weather.temperature
  let description = `Perfect ${occasion} outfit for ${temp}°C `

  if (weather.conditions === 'sunny') {
    description += 'sunny weather. '
  } else if (weather.conditions === 'rainy') {
    description += 'rainy conditions. '
  } else {
    description += 'cloudy weather. '
  }

  description += `This ${outfit.style_tags.join(' and ')} look keeps you comfortable and stylish.`

  return description
}

function updateSummaryStats(summary: any, suggestion: any, weather: any) {
  // Weather categories
  const weatherCat = weather.temperature < 10 ? 'cold' :
                    weather.temperature < 20 ? 'mild' : 'warm'
  summary.weather_categories[weatherCat] = (summary.weather_categories[weatherCat] || 0) + 1

  // Occasion types
  summary.occasion_types[suggestion.occasion] = (summary.occasion_types[suggestion.occasion] || 0) + 1

  // Popular items
  suggestion.items.forEach((item: any) => {
    const key = `${item.category}_${item.color || 'mixed'}`
    summary.popular_items[key] = (summary.popular_items[key] || 0) + 1
  })
}

async function sendOutfitSuggestionNotification(supabaseClient: any, userId: string, suggestion: any, weather: any) {
  const notificationData = {
    user_id: userId,
    type: 'outfit_suggestion',
    title: '👗 Daily Outfit Suggestion',
    message: `Check out today's outfit recommendation for ${weather.temperature}°C ${weather.conditions} weather!`,
    metadata: {
      suggestion_id: suggestion.id,
      weather: weather,
      occasion: suggestion.occasion,
      confidence_score: suggestion.confidence_score
    }
  }

  const { error } = await supabaseClient
    .from('notifications')
    .insert(notificationData)

  if (error) {
    console.error('Error sending outfit suggestion notification:', error)
  }
}

async function createDailySuggestionSummary(supabaseClient: any, results: any) {
  const summaryData = {
    date: new Date().toISOString().split('T')[0],
    total_users_processed: results.total_users,
    suggestions_created: results.suggestions_created,
    users_with_suggestions: results.users_with_suggestions,
    success_rate: results.total_users > 0 ? (results.users_with_suggestions / results.total_users) * 100 : 0,
    processing_time_ms: results.processing_time_ms,
    weather_distribution: results.summary.weather_categories,
    occasion_distribution: results.summary.occasion_types,
    popular_items: Object.entries(results.summary.popular_items)
      .sort(([,a]: any, [,b]: any) => b - a)
      .slice(0, 10)
      .map(([key, count]) => ({ item_type: key, count })),
    error_count: results.errors.length,
    created_at: new Date().toISOString()
  }

  const { error } = await supabaseClient
    .from('daily_suggestion_summaries')
    .upsert(summaryData, { onConflict: 'date' })

  if (error) {
    console.error('Error creating daily suggestion summary:', error)
  }

  console.log('Daily outfit suggestion summary created for date:', summaryData.date)
}