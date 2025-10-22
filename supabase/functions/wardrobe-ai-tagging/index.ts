import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { GoogleAuth } from 'https://googleapis.deno.dev/v1/googleauth.ts'

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Wardrobe item categories for classification
const WARDROBE_CATEGORIES = {
  'top': ['shirt', 't-shirt', 'blouse', 'top', 'sweater', 'hoodie', 'tank top', 'crop top'],
  'bottom': ['pants', 'jeans', 'trousers', 'shorts', 'skirt', 'leggings'],
  'dress': ['dress', 'gown', 'jumpsuit', 'romper'],
  'outerwear': ['jacket', 'coat', 'blazer', 'cardigan', 'hoodie', 'windbreaker'],
  'shoes': ['shoes', 'sneakers', 'boots', 'sandals', 'heels', 'flats', 'loafers'],
  'accessories': ['bag', 'purse', 'hat', 'scarf', 'belt', 'jewelry', 'watch', 'sunglasses'],
  'underwear': ['underwear', 'bra', 'panties', 'boxers', 'briefs', 'socks']
}

// Color mapping for Vision API color detection
const COLOR_MAPPINGS: { [key: string]: string } = {
  'red': 'red',
  'blue': 'blue',
  'green': 'green',
  'yellow': 'yellow',
  'orange': 'orange',
  'purple': 'purple',
  'pink': 'pink',
  'brown': 'brown',
  'black': 'black',
  'white': 'white',
  'gray': 'gray',
  'grey': 'gray',
  'beige': 'beige',
  'navy': 'navy',
  'burgundy': 'burgundy',
  'maroon': 'maroon',
  'olive': 'olive',
  'khaki': 'khaki',
  'cream': 'cream',
  'ivory': 'ivory',
  'charcoal': 'charcoal',
  'silver': 'silver',
  'gold': 'gold'
}

// Occasion detection keywords
const OCCASION_KEYWORDS = {
  'casual': ['casual', 'everyday', 'relaxed', 'comfortable', 'basic'],
  'formal': ['formal', 'business', 'professional', 'suit', 'dressy'],
  'party': ['party', 'cocktail', 'evening', 'celebration', 'festive'],
  'sports': ['sports', 'athletic', 'gym', 'workout', 'active'],
  'beach': ['beach', 'summer', 'vacation', 'resort', 'swim'],
  'outdoor': ['outdoor', 'hiking', 'camping', 'adventure'],
  'work': ['work', 'office', 'business casual', 'professional'],
  'date': ['date', 'romantic', 'dinner', 'evening'],
  'travel': ['travel', 'comfortable', 'versatile', 'lightweight']
}

// Season detection keywords
const SEASON_KEYWORDS = {
  'spring': ['spring', 'lightweight', 'floral', 'pastel'],
  'summer': ['summer', 'light', 'breathable', 'linen', 'cotton'],
  'fall': ['fall', 'autumn', 'layering', 'warm', 'cozy'],
  'winter': ['winter', 'warm', 'heavy', 'insulated', 'wool']
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Parse request body
    const { imageUrl, itemId } = await req.json()

    if (!imageUrl || !itemId) {
      return new Response(
        JSON.stringify({ error: 'imageUrl and itemId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Processing AI tagging for item: ${itemId}, image: ${imageUrl}`)

    // Initialize Gemini 2.5 Pro for image analysis
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY environment variable not set')
    }

    // Prepare Gemini 2.5 Pro request for image description
    const geminiRequest = {
      contents: [{
        parts: [
          {
            text: `Analyze this clothing item image and provide a detailed description in JSON format with the following structure:
{
  "description": "Brief description of the item",
  "category": "one of: top, bottom, dress, outerwear, shoes, accessories, underwear",
  "colors": ["primary colors detected"],
  "materials": ["fabrics or materials detected"],
  "style": "style type (casual, formal, sporty, elegant, vintage, modern, classic)",
  "occasions": ["appropriate occasions: casual, formal, party, sports, beach, outdoor, work, date, travel"],
  "seasons": ["appropriate seasons: spring, summer, fall, winter"],
  "tags": ["descriptive tags"],
  "confidence": 0.95
}

Focus on accurate clothing categorization and color detection. Be specific about materials and style.`
          },
          {
            inline_data: {
              mime_type: "image/jpeg",
              data: await getImageBase64(imageUrl)
            }
          }
        ]
      }],
      generationConfig: {
        temperature: 0.1,
        topK: 32,
        topP: 0.95,
        maxOutputTokens: 1024,
      }
    }

    // Call Gemini 2.5 Pro API
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(geminiRequest)
      }
    )

    if (!geminiResponse.ok) {
      throw new Error(`Gemini API error: ${geminiResponse.statusText}`)
    }

    const geminiResult = await geminiResponse.json()
    console.log('Gemini API response received:', JSON.stringify(geminiResult, null, 2))

    // Extract AI tags from Gemini response
    const aiTags = processGeminiResponse(geminiResult)

    console.log('Generated AI tags:', aiTags)

    // Update wardrobe item with AI-generated tags
    const { error: updateError } = await supabaseClient
      .from('wardrobe_items')
      .update({
        ai_tags: aiTags.tags,
        ai_category: aiTags.category,
        ai_colors: aiTags.colors,
        ai_occasions: aiTags.occasions,
        ai_seasons: aiTags.seasons,
        ai_style: aiTags.style,
        ai_materials: aiTags.materials,
        ai_confidence: aiTags.confidence,
        ai_processed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId)

    if (updateError) {
      console.error('Error updating wardrobe item:', updateError)
      throw new Error(`Failed to update wardrobe item: ${updateError.message}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        tags: aiTags,
        message: 'AI tagging completed successfully'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('AI tagging error:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        details: 'Failed to process image with AI tagging'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// Helper function to convert image URL to base64
async function getImageBase64(imageUrl: string): Promise<string> {
  try {
    // Fetch the image
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
    return base64
  } catch (error) {
    console.error('Error converting image to base64:', error)
    throw new Error(`Failed to process image: ${error.message}`)
  }
}

// Process Gemini 2.5 Pro response
function processGeminiResponse(geminiResult: any) {
  try {
    const candidate = geminiResult.candidates?.[0]
    if (!candidate) {
      throw new Error('No candidates in Gemini response')
    }

    const content = candidate.content?.parts?.[0]?.text
    if (!content) {
      throw new Error('No content in Gemini response')
    }

    console.log('Raw Gemini response:', content)

    // Extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in Gemini response')
    }

    const aiData = JSON.parse(jsonMatch[0])
    console.log('Parsed AI data:', aiData)

    // Validate and structure the response
    return {
      tags: aiData.tags || [],
      category: aiData.category || 'top',
      colors: aiData.colors || [],
      occasions: aiData.occasions || ['casual'],
      seasons: aiData.seasons || ['spring', 'summer', 'fall', 'winter'],
      style: aiData.style || 'casual',
      materials: aiData.materials || [],
      confidence: aiData.confidence || 0.8,
      description: aiData.description || ''
    }
  } catch (error) {
    console.error('Error processing Gemini response:', error)

    // Fallback to basic categorization
    return {
      tags: ['clothing'],
      category: 'top',
      colors: ['unknown'],
      occasions: ['casual'],
      seasons: ['spring', 'summer', 'fall', 'winter'],
      style: 'casual',
      materials: [],
      confidence: 0.5,
      description: 'AI processing failed - basic categorization applied'
    }
  }
}

function processVisionAnnotations(annotations: any) {
  const tags: string[] = []
  const detectedColors: string[] = []
  const occasions: string[] = []
  const seasons: string[] = []
  const materials: string[] = []
  let detectedCategory: string | null = null
  let style: string | null = null
  let confidence = 0

  // Process label detection
  if (annotations.labelAnnotations) {
    annotations.labelAnnotations.forEach((label: any) => {
      if (label.score > 0.7) { // High confidence labels
        const labelText = label.description.toLowerCase()
        tags.push(labelText)
        confidence = Math.max(confidence, label.score)

        // Category detection
        for (const [category, keywords] of Object.entries(WARDROBE_CATEGORIES)) {
          if (keywords.some(keyword => labelText.includes(keyword))) {
            detectedCategory = category
            break
          }
        }

        // Material detection
        if (['cotton', 'wool', 'silk', 'linen', 'denim', 'leather', 'polyester', 'nylon'].includes(labelText)) {
          materials.push(labelText)
        }

        // Style detection
        if (['casual', 'formal', 'sporty', 'elegant', 'vintage', 'modern', 'classic'].includes(labelText)) {
          style = labelText
        }
      }
    })
  }

  // Process color information
  if (annotations.imagePropertiesAnnotation?.dominantColors?.colors) {
    annotations.imagePropertiesAnnotation.dominantColors.colors.forEach((colorInfo: any) => {
      if (colorInfo.score > 0.05) { // Significant color contribution
        const color = colorInfo.color
        const rgbColor = `rgb(${color.red}, ${color.green}, ${color.blue})`

        // Find closest named color
        const closestColor = findClosestColor(color)
        if (closestColor && !detectedColors.includes(closestColor)) {
          detectedColors.push(closestColor)
        }
      }
    })
  }

  // Process web detection for additional context
  if (annotations.webDetection) {
    const webLabels = annotations.webDetection.webLabels || []
    webLabels.forEach((label: any) => {
      if (label.score > 0.6) {
        const labelText = label.label.toLowerCase()
        tags.push(labelText)

        // Occasion detection from web labels
        for (const [occasion, keywords] of Object.entries(OCCASION_KEYWORDS)) {
          if (keywords.some(keyword => labelText.includes(keyword))) {
            if (!occasions.includes(occasion)) {
              occasions.push(occasion)
            }
          }
        }

        // Season detection from web labels
        for (const [season, keywords] of Object.entries(SEASON_KEYWORDS)) {
          if (keywords.some(keyword => labelText.includes(keyword))) {
            if (!seasons.includes(season)) {
              seasons.push(season)
            }
          }
        }
      }
    })
  }

  // Fallback category detection if none found
  if (!detectedCategory) {
    detectedCategory = inferCategoryFromTags(tags)
  }

  // Add default occasion if none detected
  if (occasions.length === 0) {
    occasions.push('casual')
  }

  // Add default seasons if none detected
  if (seasons.length === 0) {
    seasons.push('spring', 'summer', 'fall', 'winter')
  }

  return {
    tags: [...new Set(tags)], // Remove duplicates
    category: detectedCategory || 'top',
    colors: detectedColors,
    occasions: [...new Set(occasions)],
    seasons: [...new Set(seasons)],
    style: style || 'casual',
    materials: [...new Set(materials)],
    confidence: Math.round(confidence * 100) / 100 // Round to 2 decimal places
  }
}

function findClosestColor(color: { red: number; green: number; blue: number }): string | null {
  // Simple color matching - could be improved with proper color distance calculation
  const { red, green, blue } = color

  // Basic color detection based on RGB values
  if (red < 50 && green < 50 && blue < 50) return 'black'
  if (red > 200 && green > 200 && blue > 200) return 'white'
  if (Math.abs(red - green) < 30 && Math.abs(green - blue) < 30) {
    if (red > 150) return 'gray'
    if (red > 100) return 'silver'
  }
  if (red > green && red > blue) {
    if (green > 100 && blue > 100) return 'pink'
    if (red > 200 && green < 100) return 'red'
    if (red > 150 && green > 50) return 'orange'
  }
  if (green > red && green > blue) {
    if (red > 100 && blue > 100) return 'olive'
    if (green > 150 && red < 100) return 'green'
    if (green > 150 && blue > 100) return 'teal'
  }
  if (blue > red && blue > green) {
    if (red > 100 && green > 100) return 'purple'
    if (blue > 150 && red < 100 && green < 100) return 'blue'
    if (blue > 150 && red > 100) return 'navy'
  }
  if (red > 150 && green > 100 && blue < 100) return 'brown'
  if (red > 200 && green > 180 && blue < 150) return 'beige'

  return null
}

function inferCategoryFromTags(tags: string[]): string | null {
  const tagString = tags.join(' ').toLowerCase()

  for (const [category, keywords] of Object.entries(WARDROBE_CATEGORIES)) {
    if (keywords.some(keyword => tagString.includes(keyword))) {
      return category
    }
  }

  return null
}