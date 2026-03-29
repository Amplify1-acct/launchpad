import { createAdminClient } from "@/lib/supabase-server";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function generateImage(prompt: string, aspectRatio: "1:1" | "16:9" | "9:16" = "16:9"): Promise<string | null> {
  if (!OPENAI_API_KEY) {
    console.warn("OPENAI_API_KEY not set — falling back to Unsplash");
    return null;
  }

  // Map aspect ratio to DALL-E 3 sizes
  const sizeMap: Record<string, string> = {
    "1:1": "1024x1024",
    "16:9": "1792x1024",
    "9:16": "1024x1792",
  };
  const size = sizeMap[aspectRatio] || "1792x1024";

  try {
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt,
        n: 1,
        size,
        quality: "standard",
        response_format: "url",
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("DALL-E 3 error:", err);
      return null;
    }

    const data = await res.json();
    const url = data.data?.[0]?.url;
    if (!url) {
      console.warn("No URL in DALL-E response");
      return null;
    }

    // Return the URL directly — DALL-E gives us a CDN URL good for 1 hour
    // We need to fetch and upload to Supabase for persistence
    return url;
  } catch (e) {
    console.error("DALL-E 3 generation failed:", e);
    return null;
  }
}

// Upload image (URL or base64) to Supabase Storage and return public URL
export async function uploadGeneratedImage(
  imageSource: string,
  businessId: string,
  filename: string
): Promise<string | null> {
  try {
    const supabase = createAdminClient();
    let buffer: Buffer;
    let mimeType = "image/png";

    if (imageSource.startsWith("data:")) {
      // base64 data URL
      const base64 = imageSource.split(",")[1];
      mimeType = imageSource.split(";")[0].split(":")[1];
      buffer = Buffer.from(base64, "base64");
    } else {
      // Regular URL (from DALL-E) — fetch it
      const imgRes = await fetch(imageSource);
      if (!imgRes.ok) throw new Error(`Failed to fetch image: ${imgRes.status}`);
      const arrayBuffer = await imgRes.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
      mimeType = imgRes.headers.get("content-type") || "image/png";
    }

    const ext = mimeType.split("/")[1]?.split("+")[0] || "png";
    const path = `generated/${businessId}/${filename}.${ext}`;

    const { error } = await supabase.storage
      .from("site-assets")
      .upload(path, buffer, { contentType: mimeType, upsert: true });

    if (error) {
      console.error("Upload error:", error);
      return null;
    }

    const { data } = supabase.storage.from("site-assets").getPublicUrl(path);
    return data.publicUrl;
  } catch (e) {
    console.error("Upload failed:", e);
    return null;
  }
}

// Generate a business photo and return a public URL
// Falls back to Unsplash if generation fails
export async function generateBusinessPhoto(
  businessName: string,
  businessDescription: string,
  photoType: "hero" | "about" | "social",
  platform?: "facebook" | "instagram" | "tiktok",
  businessId?: string,
  index: number = 0
): Promise<string> {
  const aspectRatio = platform === "tiktok" ? "9:16" :
    platform === "instagram" ? "1:1" : "16:9";

  // Build a specific, detailed prompt
  const prompts = buildPrompts(businessName, businessDescription, photoType, index);
  const prompt = prompts[index % prompts.length];

  const base64Image = await generateImage(prompt, aspectRatio as "1:1" | "16:9" | "9:16");

  if (base64Image && businessId) {
    const filename = `${photoType}-${platform || "site"}-${index}-${Date.now()}`;
    const url = await uploadGeneratedImage(base64Image, businessId, filename);
    if (url) return url;
  }

  // Fallback to Unsplash
  return getFallbackPhoto(businessDescription, aspectRatio, index);
}

function extractCarDetails(description: string): { year: string; make: string; model: string } | null {
  // Try to extract year (4 digits starting with 19 or 20)
  const yearMatch = description.match(/\b(19[2-9]\d|20[0-2]\d)\b/);
  const year = yearMatch ? yearMatch[1] : "";

  // Common makes
  const makes = ["chevrolet", "chevy", "ford", "dodge", "pontiac", "buick", "oldsmobile", "mercury",
    "cadillac", "lincoln", "chrysler", "packard", "studebaker", "hudson", "desoto",
    "ferrari", "porsche", "jaguar", "triumph", "mg", "austin", "healey", "aston martin",
    "mercedes", "bmw", "alfa romeo"];
  const lower = description.toLowerCase();
  const foundMake = makes.find(m => lower.includes(m));
  const make = foundMake ? foundMake.charAt(0).toUpperCase() + foundMake.slice(1) : "";

  // Common models
  const models = ["corvette", "mustang", "camaro", "charger", "challenger", "chevelle", "nova",
    "impala", "el camino", "gto", "firebird", "trans am", "barracuda", "cuda",
    "roadrunner", "super bee", "skylark", "cutlass", "442", "judge", "shelby",
    "cobra", "boss", "mach 1", "thunderbird", "galaxie", "fairlane",
    "cougar", "cyclone", "torino", "bel air", "tri five", "biscayne"];
  const foundModel = models.find(m => lower.includes(m));
  const model = foundModel ? foundModel.charAt(0).toUpperCase() + foundModel.slice(1) : "";

  if (year || make || model) {
    return { year, make, model };
  }
  return null;
}

const SCENIC_LOCATIONS = [
  "driving down Pacific Coast Highway California at golden hour, ocean in background",
  "parked at a scenic California coastal overlook, Pacific Ocean in background, sunset",
  "cruising through a sun-drenched desert highway in the American Southwest",
  "parked in front of a classic 1960s diner on Route 66",
  "driving through rolling hills with autumn colors",
  "at a classic car show on a sunny day, crowds admiring it",
  "in a pristine showroom under dramatic studio lighting",
  "parked on a palm-lined boulevard in Los Angeles",
];

function buildPrompts(name: string, description: string, type: string, index: number): string[] {
  const lower = description.toLowerCase();
  const car = extractCarDetails(description);

  if (lower.includes("classic") || lower.includes("restoration") || lower.includes("vintage") ||
      lower.includes("car") || lower.includes("auto") || lower.includes("muscle") || car) {

    const carName = car
      ? [car.year, car.make, car.model].filter(Boolean).join(" ")
      : "classic American muscle car";

    const location = SCENIC_LOCATIONS[index % SCENIC_LOCATIONS.length];

    return [
      `Photorealistic professional automotive photo of a perfectly restored ${carName} ${location}. Stunning paint, gleaming chrome, showroom condition. Cinematic lighting, high resolution.`,
      `Close-up detail shot of a pristine ${carName} — chrome bumper, hood ornament, polished paint reflecting the surroundings. Studio quality automotive photography, dramatic lighting.`,
      `${carName} being expertly restored in a professional classic car restoration shop. Mechanic in foreground, gleaming body panels visible. Authentic workshop atmosphere. Photorealistic.`,
      `Interior of a beautifully restored ${carName} — original leather seats, chrome dashboard gauges, wooden steering wheel. Warm nostalgic lighting. Photorealistic.`,
      `${carName} parked at golden hour, long shadows, warm California light. The paint glows. Empty road behind it. Cinematic automotive photography.`,
      `Before and after restoration: rusty weathered ${carName} on left, fully restored gleaming version on right. Split composition showing the transformation. Photorealistic.`,
    ];
  }

  if (lower.includes("restaurant") || lower.includes("food") || lower.includes("cafe")) {
    return [
      `Beautiful restaurant interior with warm lighting, set tables, inviting atmosphere. Professional food photography style. Photorealistic.`,
      `Exquisitely plated dish on a white plate, restaurant quality, soft bokeh background. Professional food photography. Photorealistic.`,
      `Bustling restaurant kitchen with chefs at work. Dynamic, professional, authentic. Photorealistic.`,
    ];
  }

  if (lower.includes("gym") || lower.includes("fitness")) {
    return [
      `Modern gym interior with weights and equipment, motivating atmosphere. Dramatic lighting. Professional fitness photography. Photorealistic.`,
      `Person working out with weights in a professional gym. Dynamic pose, dramatic lighting. Photorealistic.`,
    ];
  }

  if (lower.includes("dental") || lower.includes("medical")) {
    return [
      `Modern dental office interior, clean and welcoming, professional lighting. Photorealistic.`,
      `Friendly dentist with patient in a clean modern dental office. Professional, reassuring. Photorealistic.`,
    ];
  }

  if (lower.includes("plumb") || lower.includes("hvac") || lower.includes("electric")) {
    return [
      `Professional tradesperson working on a home repair job. Clean uniform, proper tools, confident. Photorealistic.`,
      `Satisfied homeowner at their front door greeting a uniformed service technician. Sunny day. Photorealistic.`,
    ];
  }

  // Generic business
  return [
    `Professional business environment for ${name}. Clean, modern, welcoming. High quality photorealistic photography.`,
    `Team of professionals at work. Confident, skilled, approachable. Clean modern office. Photorealistic.`,
  ];
}

function getFallbackPhoto(description: string, aspectRatio: string, index: number): string {
  const lower = description.toLowerCase();
  const w = aspectRatio === "9:16" ? 608 : aspectRatio === "1:1" ? 800 : 1200;
  const h = aspectRatio === "9:16" ? 1080 : aspectRatio === "1:1" ? 800 : 630;

  const classicCarPhotos = [
    "1494976388531-d1058494cdd8",
    "1502877338535-766e1452684a",
    "1511919884226-fd3cad34687c",
    "1519641471654-76ce0107ad1b",
    "1504215680853-026ed2a45def",
    "1541348263662-e068662d82af",
    "1567808291548-fc3ee04dbcf0",
    "1580274455191-1c62238fa333",
    "1553440569-bcc63803a83d",
    "1476525223214-c31ff100e1ae",
    "1596461404969-9ae70f2830c1",
    "1603584173870-7f23fdae1b7a",
  ];

  let photos = classicCarPhotos; // default

  if (lower.includes("restaurant") || lower.includes("food")) {
    photos = ["1414235077428-338989a2e8c0","1504674900247-0877df9cc836","1517248135467-4c7edcad34c4"];
  } else if (lower.includes("gym") || lower.includes("fitness")) {
    photos = ["1534438327276-14e5300c3a48","1571019614242-c5c5dee9f50b"];
  }

  const id = photos[index % photos.length];
  return `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&auto=format`;
}
