/**
 * lib/stitch-images.ts
 * 
 * Generates AI images for Pro tier sites using Google Stitch.
 * Creates a temporary Stitch project, generates images via prompts,
 * extracts the aida-public URLs, then returns them for injection into templates.
 * 
 * Pro tier: generates 3 images (hero, card1, card2) for injection into hand-coded templates
 * Premium tier: generates full page designs (handled separately)
 */

const STITCH_API_BASE = "https://stitch.googleapis.com/v1";

// Industry-specific image prompts for high quality results
const IMAGE_PROMPTS: Record<string, { hero: string; card1: string; card2: string }> = {
  auto: {
    hero: "Dramatic cinematic photo of a gleaming vintage classic muscle car in a professional restoration garage, dramatic side lighting catching chrome and bodywork, deep rich colors, moody premium automotive magazine style, no text",
    card1: "Close-up macro shot of perfectly polished chrome engine parts, studio lighting, dark background, editorial photography, no text",
    card2: "Craftsman's hands carefully applying paint to classic car body panel, focused detail shot, dark moody tones, no text",
  },
  restaurant: {
    hero: "Elegant restaurant interior with warm golden lighting, beautifully plated gourmet food on table, bokeh background, editorial food photography style, no text",
    card1: "Artistic close-up of a beautifully plated gourmet dish, garnished, restaurant quality, dark dramatic lighting, no text",
    card2: "Chef's hands carefully plating a dish in a professional kitchen, action shot, warm tones, no text",
  },
  gym: {
    hero: "Dramatic gym interior with person lifting weights silhouetted against powerful backlight, moody dark atmosphere, premium fitness brand photography, no text",
    card1: "Close-up of athletic hands gripping a barbell, high contrast, dark background, motivational, no text",
    card2: "Person doing intense workout, dramatic backlighting, cinematic quality, premium fitness aesthetic, no text",
  },
  plumbing: {
    hero: "Professional plumber working confidently under a sink, tools visible, clean modern bathroom, trust-inspiring, warm lighting, no text",
    card1: "Gleaming modern bathroom fixtures and pipes, professional installation, clean and polished, no text",
    card2: "Plumber's professional toolbelt and copper pipe fittings, high quality tools, warm editorial lighting, no text",
  },
  dental: {
    hero: "Modern bright dental clinic with smiling patient in chair, friendly professional dentist, clean clinical aesthetic, warm and welcoming, no text",
    card1: "Close-up of perfect white smile, clean bright teeth, clinical studio lighting, professional dental photography, no text",
    card2: "Modern dental equipment in clean bright operatory, professional clinical setting, no text",
  },
  law: {
    hero: "Confident professional lawyer in premium office, bookshelves of law books, dramatic side lighting, authoritative and trustworthy, editorial style, no text",
    card1: "Premium law office interior, mahogany desk, legal books, gavel, professional and authoritative, no text",
    card2: "Lawyer's hands reviewing legal documents, dramatic lighting, professional, close-up detail shot, no text",
  },
  salon: {
    hero: "Modern upscale hair salon interior, stylish decor, professional stylist working on client's hair, warm beautiful lighting, editorial style, no text",
    card1: "Beautiful hair color result, glossy healthy hair, salon professional photography, dramatic lighting, no text",
    card2: "Stylist's skilled hands working with hair, close detail shot, warm bokeh background, professional, no text",
  },
  realestate: {
    hero: "Stunning luxury home exterior with perfect landscaping, golden hour lighting, aspirational real estate photography, no text",
    card1: "Beautifully staged modern luxury home interior, open plan living space, natural light flooding in, no text",
    card2: "Real estate agent handing keys to happy client, professional handshake, warm welcoming atmosphere, no text",
  },
  pet: {
    hero: "Happy dogs being groomed at a professional pet salon, warm and playful atmosphere, bright clean facility, editorial style, no text",
    card1: "Adorable fluffy dog freshly groomed, studio lighting, clean white background, professional pet photography, no text",
    card2: "Caring professional groomer brushing a happy dog, warm lighting, trust and care evident, no text",
  },
  hvac: {
    hero: "Professional HVAC technician working confidently on a modern air conditioning unit, expert and trustworthy, clean uniform, no text",
    card1: "Modern HVAC system installation, clean ductwork, professional quality workmanship, no text",
    card2: "HVAC technician's professional tools and equipment, organized and expert, warm editorial lighting, no text",
  },
  bakery: {
    hero: "Artisan bakery display with beautifully arranged fresh pastries and bread, warm golden lighting, inviting and delicious, editorial food photography, no text",
    card1: "Close-up of freshly baked croissant, flaky golden perfection, studio lighting, mouth-watering food photography, no text",
    card2: "Baker's hands kneading dough on floured surface, artisan craft, warm tones, editorial style, no text",
  },
  landscaping: {
    hero: "Stunning professionally landscaped garden with lush lawn, colorful flower beds, manicured hedges, golden hour lighting, aspirational, no text",
    card1: "Close-up of landscaper's hands planting colorful flowers, care and craftsmanship, warm editorial lighting, no text",
    card2: "Beautiful manicured garden path with professional hedging and seasonal plants, luxury residential, no text",
  },
};

function getPromptsForIndustry(industry: string): { hero: string; card1: string; card2: string } {
  const key = Object.keys(IMAGE_PROMPTS).find(k => 
    industry.toLowerCase().includes(k) || k.includes(industry.toLowerCase().split(/\s/)[0])
  );
  return IMAGE_PROMPTS[key || "auto"];
}

interface StitchImage {
  hero: string;
  card1: string;
  card2: string;
}

/**
 * Extract aida-public image URLs from Stitch screen HTML.
 * Stitch embeds generated images as lh3.googleusercontent.com/aida-public URLs.
 */
function extractImageUrls(html: string): string[] {
  const matches = html.match(/https:\/\/lh3\.googleusercontent\.com\/aida(?:-public)?\/[A-Za-z0-9_\-]+/g) || [];
  // Deduplicate and prefer aida-public URLs
  const unique = [...new Set(matches)];
  return unique.filter(u => u.includes("aida-public")).slice(0, 3);
}

/**
 * Generate 3 Pro-tier images for a business using Stitch.
 * Returns URLs for hero, card1, card2.
 * Falls back to Pexels if Stitch fails.
 */
export async function generateStitchImages(
  businessName: string,
  industry: string,
  city: string,
  planProjectId?: string
): Promise<StitchImage | null> {
  const STITCH_PROJECT_ID = process.env.STITCH_PROJECT_ID;
  const gcloudToken = process.env.STITCH_GCLOUD_TOKEN;

  if (!STITCH_PROJECT_ID || !gcloudToken) {
    console.log("Stitch not configured, skipping image generation");
    return null;
  }

  const prompts = getPromptsForIndustry(industry);

  try {
    // Generate all 3 images in parallel via Stitch API
    const results = await Promise.allSettled([
      generateOneStitchImage(STITCH_PROJECT_ID, gcloudToken, prompts.hero, businessName, city),
      generateOneStitchImage(STITCH_PROJECT_ID, gcloudToken, prompts.card1, businessName, city),
      generateOneStitchImage(STITCH_PROJECT_ID, gcloudToken, prompts.card2, businessName, city),
    ]);

    const hero = results[0].status === "fulfilled" ? results[0].value : null;
    const card1 = results[1].status === "fulfilled" ? results[1].value : null;
    const card2 = results[2].status === "fulfilled" ? results[2].value : null;

    if (!hero) return null;

    return {
      hero: hero,
      card1: card1 || hero,
      card2: card2 || hero,
    };
  } catch (error) {
    console.error("Stitch image generation failed:", error);
    return null;
  }
}

async function generateOneStitchImage(
  projectId: string,
  gcloudToken: string,
  prompt: string,
  businessName: string,
  city: string
): Promise<string | null> {
  const fullPrompt = `${prompt}. For ${businessName} in ${city}. High-end editorial photography, premium quality, no text overlay, no UI elements.`;

  const res = await fetch(
    `${STITCH_API_BASE}/projects/${projectId}/screens:generate`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${gcloudToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: fullPrompt,
        // Image-only generation
        generation_config: { image_only: true },
      }),
    }
  );

  if (!res.ok) {
    console.error("Stitch API error:", res.status, await res.text());
    return null;
  }

  const data = await res.json();
  
  // Extract the screenshot URL from the response
  const screens = data.screens || data.outputComponents?.[0]?.design?.screens || [];
  const screen = screens[0];
  
  if (!screen) return null;

  // Return the screenshot download URL (the generated image)
  return screen.screenshot?.downloadUrl || null;
}

/**
 * Inject Stitch images into a hand-coded Pro template HTML.
 * Replaces {{hero_image_url}}, {{about_image_url}} etc. with Stitch URLs.
 */
export function injectStitchImages(html: string, images: StitchImage): string {
  return html
    .replace(/{{hero_image_url}}/g, images.hero)
    .replace(/{{about_image_url}}/g, images.card1)
    .replace(/{{gallery_image_1}}/g, images.card1)
    .replace(/{{gallery_image_2}}/g, images.card2)
    .replace(/{{gallery_image_3}}/g, images.hero);
}
