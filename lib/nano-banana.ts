import { createAdminClient } from "@/lib/supabase-server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const IMAGE_MODEL = "gemini-2.0-flash-preview-image-generation";

export async function generateImage(prompt: string, aspectRatio: "1:1" | "16:9" | "9:16" = "16:9"): Promise<string | null> {
  if (!GEMINI_API_KEY) {
    console.warn("GEMINI_API_KEY not set — falling back to Unsplash");
    return null;
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${IMAGE_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            responseModalities: ["IMAGE"],
            aspectRatio,
          },
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error("Gemini image error:", err);
      return null;
    }

    const data = await res.json();
    const part = data.candidates?.[0]?.content?.parts?.[0];

    if (part?.inlineData?.data) {
      // Return as base64 data URL
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }

    return null;
  } catch (e) {
    console.error("Nano Banana generation failed:", e);
    return null;
  }
}

// Upload base64 image to Supabase Storage and return public URL
export async function uploadGeneratedImage(
  base64DataUrl: string,
  businessId: string,
  filename: string
): Promise<string | null> {
  try {
    const supabase = createAdminClient();

    // Convert base64 to buffer
    const base64 = base64DataUrl.split(",")[1];
    const mimeType = base64DataUrl.split(";")[0].split(":")[1];
    const buffer = Buffer.from(base64, "base64");
    const ext = mimeType.split("/")[1] || "jpg";
    const path = `generated/${businessId}/${filename}.${ext}`;

    const { error } = await supabase.storage
      .from("site-assets")
      .upload(path, buffer, {
        contentType: mimeType,
        upsert: true,
      });

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

function buildPrompts(name: string, description: string, type: string, index: number): string[] {
  const lower = description.toLowerCase();

  if (lower.includes("classic") || lower.includes("restoration") || lower.includes("vintage") || lower.includes("car") || lower.includes("auto")) {
    return [
      `Professional photo of a beautifully restored classic American muscle car, gleaming paint, chrome details, shot in a clean garage workshop. Photorealistic, high quality, dramatic lighting.`,
      `Vintage 1960s or 1970s automobile being restored in a professional auto shop. Mechanic working on the engine bay. Tools visible, authentic workshop atmosphere. Photorealistic.`,
      `Close-up detail shot of polished chrome on a classic vintage car. Reflections of the garage visible. Studio quality automotive photography.`,
      `Fully restored classic American car on display, showroom quality finish, dramatic studio lighting. Deep rich paint color. Photorealistic automotive photography.`,
      `Before and after style: one side showing a rusty vintage car, other side showing it fully restored to mint condition. Split composition. Photorealistic.`,
      `Interior of a classic 1960s muscle car — leather seats, chrome dashboard, steering wheel. Restoration quality. Warm nostalgic lighting. Photorealistic.`,
    ];
  }

  if (lower.includes("restaurant") || lower.includes("food") || lower.includes("cafe")) {
    return [
      `Beautiful restaurant interior with warm lighting, set tables, inviting atmosphere. Professional food photography style.`,
      `Exquisitely plated dish on a white plate, restaurant quality, soft bokeh background. Professional food photography.`,
      `Bustling restaurant kitchen with chefs at work. Dynamic, professional, authentic.`,
    ];
  }

  if (lower.includes("gym") || lower.includes("fitness")) {
    return [
      `Modern gym interior with weights and equipment, motivating atmosphere. Professional fitness photography.`,
      `Person working out with weights in a professional gym. Dramatic lighting, motivating composition.`,
    ];
  }

  // Generic professional business
  return [
    `Professional business photo for ${name}. ${description}. High quality, photorealistic, professional lighting.`,
    `Team of professionals at work for a ${description} business. Clean, modern, professional photography.`,
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
