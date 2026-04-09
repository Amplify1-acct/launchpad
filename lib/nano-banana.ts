/**
 * lib/nano-banana.ts
 *
 * Image strategy for Exsisto:
 * - Known industries (plumbing, hvac, etc): serve from Supabase library (instant, free)
 * - "Other" / unknown industries: generate custom images via Nano Banana (Gemini API)
 * - Fallback: gradient placeholder if all else fails
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const STORAGE_BUCKET = "industry-images";
const CUSTOMER_BUCKET = "customer-images";
const GEMINI_MODEL = "gemini-3.1-flash-image-preview";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// ── Industry library mapping ───────────────────────────────────────────────────
// Maps industry slugs (from preview wizard) to our Supabase library slugs
const INDUSTRY_LIBRARY_MAP: Record<string, string> = {
  // Direct matches
  plumbing:    "plumbing",
  hvac:        "hvac",
  electrical:  "electrical",
  landscaping: "landscaping",
  cleaning:    "cleaning",
  roofing:     "roofing",
  painting:    "painting",
  automotive:  "automotive",
  auto:        "automotive",
  remodeling:  "remodeling",
  pest_control:"pest_control",
  moving:      "moving",
  // Expansion industries (all now have dedicated images)
  restaurant:  "restaurant",
  dental:      "dental",
  salon:       "salon",
  gym:         "gym",
  pet:         "pet",
  law:         "law",
  realestate:  "realestate",
  bakery:      "bakery",

  // Fallback
  other:       "other",
};

const BASE_LIBRARY_URL = `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}`;

// How many numbered variants exist per slot in Supabase Storage
// e.g. hero.png + hero_1.png = 2 variants
const SLOT_VARIANT_COUNT: Record<string, number> = {
  hero: 3, card1: 2, card2: 2, card3: 2, card4: 2,
};

function getLibraryUrl(industrySlug: string, slot: string): string {
  const libSlug = INDUSTRY_LIBRARY_MAP[industrySlug] || "other";
  const variantCount = SLOT_VARIANT_COUNT[slot] || 1;

  // Pick a random variant
  // variant 0 = base file (hero.png), variant 1 = numbered file (hero_1.png)
  const pick = Math.floor(Math.random() * variantCount);
  const filename = pick === 0 ? `${slot}.png` : `${slot}_${pick}.png`;

  return `${BASE_LIBRARY_URL}/${libSlug}/${filename}`;
}

// ── Nano Banana (Gemini Image API) ────────────────────────────────────────────

function buildCustomPrompt(
  businessName: string,
  businessType: string,
  industry: string,
  city: string,
  slot: string,
  description?: string
): string {
  const base = "photorealistic photograph, professional quality, no text, no logos, no watermarks, no UI elements";

  // Use description for hero if available — makes it specific to this business
  const heroDetail = description
    ? `${description}. `
    : `${businessType} business. `;

  const prompts: Record<string, string> = {
    hero:  `${base}. Hero image for "${businessName}" in ${city}. ${heroDetail}Wide composition for a website hero banner. Natural lighting, professional quality, no people's faces.`,
    card1: `${base}. Service showcase image for a ${businessType} business. Show the primary work or product with quality craftsmanship, close detail, warm professional lighting.`,
    card2: `${base}. Team or equipment image for a ${businessType} business in ${city}. Professional, clean, high-quality.`,
    card3: `${base}. Finished result or customer experience for a ${businessType} business. Warm and inviting, showing quality outcome.`,
    card4: `${base}. Detail or materials image for a ${businessType} business. High detail, professional photography style.`,
  };

  return prompts[slot] || prompts.hero;
}

async function generateNanoBananaImage(prompt: string): Promise<Uint8Array | null> {
  if (!GEMINI_API_KEY) {
    console.warn("GEMINI_API_KEY not set");
    return null;
  }

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      if (attempt > 1) await new Promise(r => setTimeout(r, attempt * 8000));

      const resp = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
        }),
        signal: AbortSignal.timeout(90000),
      });

      if (!resp.ok) {
        console.error(`Gemini API error attempt ${attempt}:`, resp.status);
        if (resp.status === 429 || resp.status === 401 || resp.status === 403) break;
        continue;
      }

      const data = await resp.json() as any;
      const parts = data.candidates?.[0]?.content?.parts ?? [];
      for (const part of parts) {
        if (part.inlineData?.data) {
          const buf = Buffer.from(part.inlineData.data, "base64");
          return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
        }
      }
    } catch (e) {
      console.error(`Nano Banana attempt ${attempt} failed:`, e);
    }
  }
  return null;
}

async function uploadToSupabase(imageBuffer: Uint8Array, path: string): Promise<string | null> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return null;

  try {
    const resp = await fetch(
      `${SUPABASE_URL}/storage/v1/object/${CUSTOMER_BUCKET}/${path}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          "Content-Type": "image/png",
          "x-upsert": "true",
        },
        body: imageBuffer.buffer as ArrayBuffer,
      }
    );

    if (!resp.ok) {
      console.error("Supabase upload failed:", resp.status, await resp.text());
      return null;
    }

    return `${SUPABASE_URL}/storage/v1/object/public/${CUSTOMER_BUCKET}/${path}`;
  } catch (e) {
    console.error("Supabase upload error:", e);
    return null;
  }
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Get image URLs for a business.
 * - For known industries: returns library URLs instantly (no API call)
 * - For "other"/custom: generates via Nano Banana and uploads to customer-images bucket
 */
export async function getBusinessImages(params: {
  businessId: string;
  businessName: string;
  businessType: string; // e.g. "Water Heater Specialist" or "Artisan Candy Shop"
  industry: string;     // e.g. "plumbing", "hvac", "other"
  city: string;
  plan: "starter" | "pro" | "premium";
  description?: string; // business description — used for custom hero generation
}): Promise<{
  hero: string;
  card1: string;
  card2: string;
  card3?: string;
  card4?: string;
}> {
  const { businessId, businessName, businessType, industry, city, plan } = params;
  const isCustom = industry === "other" || !INDUSTRY_LIBRARY_MAP[industry];
  const slots = plan === "starter" ? ["hero"] :
    plan === "pro" ? ["hero", "card1", "card2"] :
    ["hero", "card1", "card2", "card3", "card4"];

  // ── Always use library for card images (fast, varied) ───────────────────
  const libSlug = INDUSTRY_LIBRARY_MAP[industry] || "other";
  const variantCounts = INDUSTRY_VARIANT_COUNT[libSlug] || INDUSTRY_VARIANT_COUNT.default;
  const cardSlots = ["card1", "card2", "card3", "card4"];
  const libraryCards: Record<string, string> = {};
  cardSlots.forEach((slot, i) => {
    const maxV = variantCounts[slot] ?? variantCounts["card1"] ?? 1;
    const pick = i % maxV;
    const filename = pick === 0 ? `${slot}.png` : `${slot}_${pick}.png`;
    libraryCards[slot] = `${BASE_LIBRARY_URL}/${libSlug}/${filename}`;
  });

  if (!isCustom && !params.description) {
    // No description — use library for hero too (fast path)
    const heroV = variantCounts["hero"] ?? 1;
    const heroPick = Math.floor(Math.random() * heroV);
    const heroFile = heroPick === 0 ? "hero.png" : `hero_${heroPick}.png`;
    return {
      hero: `${BASE_LIBRARY_URL}/${libSlug}/${heroFile}`,
      ...libraryCards,
    } as any;
  }

  // ── Generate hero via Nano Banana using business description ─────────────
  // Cards still come from library — only hero is custom-generated
  console.log(\`🍌 Generating custom hero image for \${businessName}...\`);
  let heroUrl = `${BASE_LIBRARY_URL}/${libSlug}/hero.png`; // fallback

  const heroPrompt = buildCustomPrompt(businessName, businessType, industry, city, "hero", params.description);
  const heroBuffer = await generateNanoBananaImage(heroPrompt);

  if (heroBuffer && SUPABASE_URL && SUPABASE_SERVICE_KEY) {
    try {
      const timestamp = Date.now();
      const storagePath = \`\${businessId}/hero_\${timestamp}.png\`;
      const uploadRes = await fetch(
        \`\${SUPABASE_URL}/storage/v1/object/\${CUSTOMER_BUCKET}/\${storagePath}\`,
        {
          method: "POST",
          headers: {
            "Authorization": \`Bearer \${SUPABASE_SERVICE_KEY}\`,
            "Content-Type": "image/png",
            "x-upsert": "true",
          },
          body: heroBuffer,
        }
      );
      if (uploadRes.ok) {
        heroUrl = \`\${SUPABASE_URL}/storage/v1/object/public/\${CUSTOMER_BUCKET}/\${storagePath}\`;
        console.log("✓ Custom hero uploaded:", heroUrl);
      }
    } catch (uploadErr) {
      console.error("Hero upload failed, using library fallback:", uploadErr);
    }
  }

  return { hero: heroUrl, ...libraryCards } as any;

  // ── Custom path: generate via Nano Banana ────────────────────────────
  console.log(`🍌 Generating custom Nano Banana images for ${businessName} (${businessType})`);
  const result: Record<string, string> = {};
  const timestamp = Date.now();

  for (const slot of slots) {
    const prompt = buildCustomPrompt(businessName, businessType, industry, city, slot);
    const imageBuffer = await generateNanoBananaImage(prompt);

    if (imageBuffer) {
      const storagePath = `${businessId}/${slot}_${timestamp}.png`;
      const url = await uploadToSupabase(imageBuffer, storagePath);
      if (url) {
        result[slot] = url;
        console.log(`  ✓ ${slot}: uploaded`);
        // Small delay between generations
        if (slots.indexOf(slot) < slots.length - 1) {
          await new Promise(r => setTimeout(r, 3000));
        }
        continue;
      }
    }

    // Fallback to library "other" images if generation fails
    console.warn(`  ⚠️ ${slot}: generation failed, using library fallback`);
    result[slot] = getLibraryUrl("other", slot);
  }

  return result as any;
}

/**
 * Generate a single business photo.
 * For known industries: returns a library URL instantly.
 * For "other" industries or social/blog posts: calls Gemini for a fresh image.
 */
export async function generateBusinessPhoto(
  businessName: string,
  businessDescription: string,
  photoType: "hero" | "about" | "social",
  platform?: "facebook" | "instagram" | "tiktok",
  businessId?: string,
  index: number = 0
): Promise<string> {
  const industry = inferIndustryFromDescription(businessDescription);
  const slot = photoType === "about" ? "card1" : "hero";

  // For social posts or unknown "other" industries, generate fresh with Gemini
  if (photoType === "social" || industry === "other") {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("GEMINI_API_KEY not set");

      const platformCtx = platform === "tiktok" ? "vertical 9:16 portrait"
        : platform === "instagram" ? "square 1:1"
        : "landscape 16:9";

      const industryContext = industry !== "other" ? industry : businessDescription.slice(0, 50);
      const prompt = photoType === "social"
        ? "photorealistic photograph only, no text, no UI, no illustration, no watermarks. Professional " + industryContext + " business photo for " + platformCtx + " social media. " + businessName + ". Vibrant, eye-catching, high quality."
        : "photorealistic photograph only, no text, no UI, no illustration, no watermarks. Professional " + industryContext + " business photo. " + businessName + ". Clean, well-lit, high quality.";

      const geminiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=" + apiKey;

      const res = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseModalities: ["image", "text"] },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const imagePart = data.candidates?.[0]?.content?.parts?.find(
          (p: any) => p.inlineData?.mimeType?.startsWith("image/")
        );
        if (imagePart?.inlineData?.data) {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
          const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
          const imageBytes = Buffer.from(imagePart.inlineData.data, "base64");
          const folder = industry !== "other" ? industry : "other";
          const fileName = folder + "/" + photoType + "/" + Date.now() + "-" + Math.random().toString(36).slice(2, 8) + ".jpg";

          const uploadRes = await fetch(supabaseUrl + "/storage/v1/object/industry-images/" + fileName, {
            method: "POST",
            headers: {
              Authorization: "Bearer " + serviceKey,
              "Content-Type": "image/jpeg",
              "x-upsert": "true",
            },
            body: imageBytes,
          });

          if (uploadRes.ok) {
            return supabaseUrl + "/storage/v1/object/public/industry-images/" + fileName;
          }
        }
      }
    } catch (e: any) {
      console.error("Gemini image generation failed, using library fallback:", e.message);
    }
  }

  // Known industry: use library (fast, free)
  return getLibraryUrl(industry, slot);
}

function inferIndustryFromDescription(description: string): string {
  const lower = description.toLowerCase();
  if (lower.includes("plumb") || lower.includes("pipe") || lower.includes("drain")) return "plumbing";
  if (lower.includes("hvac") || lower.includes("heating") || lower.includes("cooling") || lower.includes("air condition")) return "hvac";
  if (lower.includes("electric") || lower.includes("wiring") || lower.includes("panel")) return "electrical";
  if (lower.includes("landscap") || lower.includes("lawn") || lower.includes("garden")) return "landscaping";
  if (lower.includes("clean") || lower.includes("maid") || lower.includes("janitorial")) return "cleaning";
  if (lower.includes("roof") || lower.includes("shingle") || lower.includes("gutter")) return "roofing";
  if (lower.includes("paint") || lower.includes("coating")) return "painting";
  if (lower.includes("auto") || lower.includes("car") || lower.includes("mechanic") || lower.includes("vehicle")) return "automotive";
  if (lower.includes("remodel") || lower.includes("renovation") || lower.includes("contractor")) return "remodeling";
  if (lower.includes("pest") || lower.includes("exterminator") || lower.includes("bug")) return "pest_control";
  if (lower.includes("moving") || lower.includes("mover") || lower.includes("relocation")) return "moving";
  if (lower.includes("restaurant") || lower.includes("food") || lower.includes("cafe") || lower.includes("dining")) return "restaurant";
  if (lower.includes("dental") || lower.includes("dentist") || lower.includes("teeth")) return "dental";
  if (lower.includes("salon") || lower.includes("hair") || lower.includes("barbershop")) return "salon";
  if (lower.includes("gym") || lower.includes("fitness") || lower.includes("trainer")) return "gym";
  if (lower.includes("pet") || lower.includes("dog") || lower.includes("grooming")) return "pet";
  if (lower.includes("law") || lower.includes("attorney") || lower.includes("legal")) return "law";
  if (lower.includes("real estate") || lower.includes("realtor") || lower.includes("property")) return "realestate";
  if (lower.includes("bakery") || lower.includes("bread") || lower.includes("pastry")) return "bakery";
  return "other";
}
