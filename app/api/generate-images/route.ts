/**
 * app/api/generate-images/route.ts
 *
 * Generates custom images for a customer's website using Nano Banana
 * (Gemini 3.1 Flash Image API). Called from the admin generate pipeline
 * as an alternative/supplement to Stitch image generation.
 *
 * POST /api/generate-images
 * Headers: x-internal-secret: exsisto-internal-2026
 * Body: {
 *   businessId: string
 *   businessName: string
 *   industry: string       ← matches INDUSTRY_SLUG_MAP slugs
 *   city: string
 *   services: string[]
 *   tier: 'starter' | 'pro' | 'premium'
 * }
 *
 * Returns: {
 *   hero_url: string
 *   card1_url: string
 *   card2_url: string
 *   card3_url?: string    ← premium only
 *   card4_url?: string    ← premium only
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const INTERNAL_SECRET = 'exsisto-internal-2026'
const GEMINI_MODEL    = 'gemini-2.0-flash-preview-image-generation'
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`
const STORAGE_BUCKET  = 'customer-images'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Images per tier
const TIER_SLOTS: Record<string, string[]> = {
  starter: ['hero', 'card1'],                      // 2 images
  pro:     ['hero', 'card1', 'card2', 'card3', 'card4', 'card5', 'card6', 'card7'],   // 8 images
  premium: ['hero', 'card1', 'card2', 'card3', 'card4', 'card5', 'card6', 'card7', 'card8', 'card9', 'card10', 'card11'], // 12 images
}

function buildPrompt(slot: string, businessName: string, industry: string, city: string, services: string[]): string {
  const serviceStr = services.slice(0, 3).join(', ')
  const base = `photorealistic photograph, professional quality, no text, no logos, no watermarks, no UI elements`

  const prompts: Record<string, string> = {
    hero: `${base}. Hero image for a ${industry} business called "${businessName}" in ${city}. Show a professional ${industry.toLowerCase()} worker actively providing excellent service, clean and trustworthy appearance, natural lighting, wide composition suitable for a website hero banner.`,

    card1: `${base}. Service showcase card image for a ${industry} business offering ${serviceStr}. Show the primary service being performed with quality craftsmanship, close detail, warm professional lighting.`,

    card2: `${base}. Trust and credibility image for a ${industry} business in ${city}. Show a professional service vehicle, team member, or completed work result. Clean, organized, high-quality.`,

    card3: `${base}. Customer satisfaction image for a ${industry} business. Show a happy customer with a service professional, or a beautiful finished result. Warm, inviting, photorealistic.`,

    card4: `${base}. Process or before/after style image for a ${industry} business. Show the quality of work or materials used in ${serviceStr}. High detail, professional photography style.`,
  }

  return prompts[slot] ?? prompts.hero
}

async function generateImage(prompt: string): Promise<Buffer | null> {
  const resp = await fetch(`${GEMINI_ENDPOINT}?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
    }),
  })

  if (!resp.ok) {
    console.error('Gemini API error:', resp.status, await resp.text())
    return null
  }

  const data = await resp.json()
  const parts = data.candidates?.[0]?.content?.parts ?? []

  for (const part of parts) {
    if (part.inlineData?.data) {
      return Buffer.from(part.inlineData.data, 'base64')
    }
  }
  return null
}

async function uploadImage(imageBuffer: Buffer, path: string): Promise<string | null> {
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, imageBuffer, {
      contentType: 'image/png',
      upsert: true,
    })

  if (error) {
    console.error('Supabase upload error:', error)
    return null
  }

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export async function POST(req: NextRequest) {
  // Auth check
  if (req.headers.get('x-internal-secret') !== INTERNAL_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { businessId, businessName, industry, city, services = [], tier = 'pro' } = body

  if (!businessId || !businessName || !industry) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 })
  }

  const slots = TIER_SLOTS[tier] ?? TIER_SLOTS.pro
  const results: Record<string, string | null> = {}

  console.log(`🍌 Generating ${slots.length} images for ${businessName} (${tier})`)

  for (const slot of slots) {
    const prompt = buildPrompt(slot, businessName, industry, city, services)
    console.log(`  Generating ${slot}...`)

    const imageBuffer = await generateImage(prompt)
    if (!imageBuffer) {
      results[`${slot}_url`] = null
      continue
    }

    const timestamp = Date.now()
    const storagePath = `${businessId}/${slot}_${timestamp}.png`
    const publicUrl = await uploadImage(imageBuffer, storagePath)

    results[`${slot}_url`] = publicUrl
    console.log(`  ✓ ${slot}: ${publicUrl}`)

    // Small delay between generations
    if (slots.indexOf(slot) < slots.length - 1) {
      await new Promise(r => setTimeout(r, 2000))
    }
  }

  // Store URLs in the websites table
  const updateData: Record<string, string | null> = {}
  if (results.hero_url)  updateData.hero_image_url  = results.hero_url
  if (results.card1_url) updateData.card1_image_url = results.card1_url
  if (results.card2_url) updateData.card2_image_url = results.card2_url
  if (results.card3_url) updateData.card3_image_url = results.card3_url
  if (results.card4_url) updateData.card4_image_url = results.card4_url

  if (Object.keys(updateData).length > 0) {
    const { error } = await supabase
      .from('websites')
      .update(updateData)
      .eq('business_id', businessId)

    if (error) {
      console.error('Failed to update websites table:', error)
    }
  }

  return NextResponse.json({
    success: true,
    businessId,
    tier,
    images: results,
  })
}
