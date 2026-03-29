const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

// Industry-specific Pexels search queries
const SEARCH_QUERIES: Record<string, string[]> = {
  auto: [
    "vintage car restoration garage",
    "classic car mechanic workshop",
    "antique automobile restoration",
    "old vintage car engine restoration",
    "classic car bodywork paint shop",
    "vintage automobile chrome detail",
    "old car restoration before after",
    "classic car show vintage automobile",
    "vintage car interior restoration",
    "antique car polishing detailing",
  ],
  restaurant: [
    "restaurant food plating",
    "gourmet dish restaurant",
    "restaurant interior dining",
    "chef cooking kitchen",
    "fine dining table",
  ],
  fitness: [
    "gym workout weights",
    "fitness training",
    "personal trainer gym",
    "weight lifting gym",
  ],
  plumbing: [
    "plumber working pipes",
    "plumbing repair home",
    "plumber professional",
  ],
  dental: [
    "dentist office modern",
    "dental clinic professional",
  ],
  law: [
    "lawyer office professional",
    "attorney law office",
  ],
  realestate: [
    "luxury home exterior",
    "modern house real estate",
    "real estate agent home",
  ],
  landscaping: [
    "landscaping garden professional",
    "lawn care garden",
  ],
  default: [
    "professional business team",
    "small business storefront",
    "business professional office",
  ],
};

function getIndustryKey(description: string): string {
  const lower = description.toLowerCase();
  if (lower.includes("classic") || lower.includes("restoration") || lower.includes("vintage") ||
      lower.includes("car") || lower.includes("auto") || lower.includes("muscle") ||
      lower.includes("corvette") || lower.includes("mustang") || lower.includes("dodge")) return "auto";
  if (lower.includes("restaurant") || lower.includes("food") || lower.includes("cafe") || lower.includes("dining")) return "restaurant";
  if (lower.includes("gym") || lower.includes("fitness") || lower.includes("trainer")) return "fitness";
  if (lower.includes("plumb") || lower.includes("hvac") || lower.includes("pipe")) return "plumbing";
  if (lower.includes("dental") || lower.includes("dentist")) return "dental";
  if (lower.includes("law") || lower.includes("attorney") || lower.includes("legal")) return "law";
  if (lower.includes("real estate") || lower.includes("realtor")) return "realestate";
  if (lower.includes("landscap") || lower.includes("lawn") || lower.includes("garden")) return "landscaping";
  return "default";
}

export async function generateBusinessPhoto(
  businessName: string,
  businessDescription: string,
  photoType: "hero" | "about" | "social",
  platform?: "facebook" | "instagram" | "tiktok",
  businessId?: string,
  index: number = 0
): Promise<string> {
  if (!PEXELS_API_KEY) {
    console.warn("PEXELS_API_KEY not set — using fallback");
    return getFallbackPhoto(businessDescription, platform, index);
  }

  const industryKey = getIndustryKey(businessDescription);
  const queries = SEARCH_QUERIES[industryKey] || SEARCH_QUERIES.default;
  // Use different query per post AND per platform to get real variety
  // index already includes platform offset (0, 100, 200) from generate-social
  const queryIndex = index % queries.length;
  const query = queries[queryIndex];
  // Use a random page offset so we don't always get the same photos
  const pageNum = (Math.floor(index / queries.length) % 3) + 1;

  // Orientation based on platform
  const orientation = platform === "tiktok" ? "portrait" :
    platform === "instagram" ? "square" : "landscape";

  try {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=15&orientation=${orientation}&page=${pageNum}`;
    const res = await fetch(url, {
      headers: { Authorization: PEXELS_API_KEY },
    });

    if (!res.ok) {
      console.error("Pexels error:", res.status);
      return getFallbackPhoto(businessDescription, platform, index);
    }

    const data = await res.json();
    const photos = data.photos || [];

    if (photos.length === 0) {
      return getFallbackPhoto(businessDescription, platform, index);
    }

    // Pick a photo based on index for variety
    // Pick a different photo within results using a secondary index
    const photoIndex = Math.floor(index / queries.length) % photos.length;
    const photo = photos[photoIndex];

    // Return appropriate size
    if (platform === "tiktok") return photo.src.portrait || photo.src.large;
    if (platform === "instagram") return photo.src.large || photo.src.original;
    return photo.src.landscape || photo.src.large2x || photo.src.large;

  } catch (e) {
    console.error("Pexels fetch failed:", e);
    return getFallbackPhoto(businessDescription, platform, index);
  }
}

function getFallbackPhoto(description: string, platform?: string, index: number = 0): string {
  const w = platform === "tiktok" ? 608 : platform === "instagram" ? 800 : 1200;
  const h = platform === "tiktok" ? 1080 : platform === "instagram" ? 800 : 630;

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
  ];

  const id = classicCarPhotos[index % classicCarPhotos.length];
  return `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&auto=format`;
}
