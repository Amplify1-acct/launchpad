import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildTradesSite } from "@/lib/templates/trades";
import { buildProfessionalSite } from "@/lib/templates/professional";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const TEMPLATE_MAP: Record<string, string[]> = {
  trades: ["plumbing", "roofing", "hvac", "electrical", "contractor", "landscaping", "lawn", "cleaning", "pest", "painting", "flooring", "handyman", "plumber", "roofer", "electrician", "carpenter"],
  professional: ["law", "legal", "attorney", "lawyer", "accounting", "accountant", "financial", "finance", "consulting", "consultant", "insurance", "real estate", "advisor", "bookkeeping", "tax", "cpa", "hr", "recruiting"],
};

// Specific Pexels queries per industry — tuned for relevance
const PHOTO_QUERIES: Record<string, string> = {
  "law firm":      "law office attorney",
  "legal":         "lawyer office professional",
  "attorney":      "attorney law office",
  "accounting":    "accountant office desk",
  "accountant":    "accounting professional office",
  "financial":     "financial advisor meeting",
  "finance":       "finance office professional",
  "consulting":    "business consulting meeting",
  "consultant":    "consultant business meeting",
  "real estate":   "real estate office agent",
  "insurance":     "insurance office professional",
  "bookkeeping":   "accountant office bookkeeping",
  "tax":           "tax accountant office",
  "hr":            "human resources office meeting",
  "plumbing":      "plumber working pipes",
  "roofing":       "roofer roofing contractor",
  "hvac":          "hvac technician air conditioning",
  "electrical":    "electrician working professional",
  "contractor":    "contractor construction worker",
  "landscaping":   "landscaping garden professional",
  "lawn":          "lawn care mowing grass",
  "cleaning":      "house cleaning professional service",
  "pest":          "pest control exterminator",
  "painting":      "house painter professional",
  "salon":         "hair salon stylist",
  "spa":           "spa wellness massage",
  "fitness":       "gym fitness trainer",
  "dental":        "dental office dentist",
  "medical":       "medical clinic doctor office",
  "chiropractic":  "chiropractor office professional",
  "photography":   "photographer studio professional",
};

// Reliable fallbacks per template — never wrong industry
const FALLBACKS: Record<string, string> = {
  professional: "https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=1400",
  trades:       "https://images.pexels.com/photos/1249611/pexels-photo-1249611.jpeg?auto=compress&cs=tinysrgb&w=1400",
};

function detectTemplate(industry: string): "trades" | "professional" {
  const lower = industry.toLowerCase();
  if (TEMPLATE_MAP.trades.some(k => lower.includes(k))) return "trades";
  if (TEMPLATE_MAP.professional.some(k => lower.includes(k))) return "professional";
  return "trades";
}

function getPhotoQuery(industry: string): string {
  const lower = industry.toLowerCase();
  for (const [key, query] of Object.entries(PHOTO_QUERIES)) {
    if (lower.includes(key)) return query;
  }
  return `${industry} professional`;
}

async function fetchPexelsPhoto(query: string): Promise<string | null> {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`,
      { headers: { Authorization: key } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const photos = data.photos || [];
    if (!photos.length) return null;
    // Pick randomly from top 5 for variety
    const pick = photos[Math.floor(Math.random() * Math.min(photos.length, 5))];
    return `${pick.src.large2x}?auto=compress&cs=tinysrgb&w=1400&fit=crop`;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const { businessName, industry, city, state, description, phone, email } = await request.json();

  if (!businessName || !industry || !description) {
    return NextResponse.json({ error: "businessName, industry, and description are required" }, { status: 400 });
  }

  const template = detectTemplate(industry);
  const accentColor = template === "trades" ? "#a8c500" : "#8b4513";

  const prompt = `You are generating content for a small business website.

Business Name: ${businessName}
Industry: ${industry}
Location: ${city || "Springfield"}, ${state || "IL"}
Description: ${description}

Generate rich, specific, professional content tailored to THIS exact business. No generic filler.

Respond ONLY with valid JSON (no markdown, no backticks):
{
  "tagline": "Compelling 4-7 word tagline for this specific business",
  "accent_color": "${accentColor}",
  "services": [
    {"name": "Service name", "description": "2-3 sentences specific to this business and what makes it valuable", "icon": "emoji"},
    {"name": "Service name", "description": "2-3 sentences", "icon": "emoji"},
    {"name": "Service name", "description": "2-3 sentences", "icon": "emoji"},
    {"name": "Service name", "description": "2-3 sentences", "icon": "emoji"},
    {"name": "Service name", "description": "2-3 sentences", "icon": "emoji"},
    {"name": "Service name", "description": "2-3 sentences", "icon": "emoji"}
  ],
  "stats": [
    {"value": "15+", "label": "Years in Business"},
    {"value": "800+", "label": "Clients Served"},
    {"value": "100%", "label": "Satisfaction Rate"},
    {"value": "24hr", "label": "Response Time"}
  ],
  "testimonials": [],
  "process_steps": [
    {"title": "Step 1 title for ${industry}", "description": "What happens — be specific to this industry"},
    {"title": "Step 2 title", "description": "What happens"},
    {"title": "Step 3 title", "description": "What happens"},
    {"title": "Step 4 title", "description": "What happens"}
  ],
  "faqs": [
    {"question": "Real FAQ a ${industry} client would ask", "answer": "Detailed, helpful answer"},
    {"question": "Real FAQ", "answer": "Detailed answer"},
    {"question": "Real FAQ", "answer": "Detailed answer"},
    {"question": "Real FAQ", "answer": "Detailed answer"}
  ],
  "meta_title": "${businessName} | ${industry} in ${city || "Springfield"}, ${state || "IL"}",
  "meta_description": "Under 155 characters. Compelling description for search results.",
  "keywords": ["local keyword 1", "local keyword 2", "service keyword 3", "keyword 4", "keyword 5", "keyword 6"]
}`;

  let generated: any;
  try {
    const aiResponse = await anthropic.messages.create({
      model: "claude-opus-4-5-20251101",
      max_tokens: 3000,
      messages: [{ role: "user", content: prompt }],
    });
    const raw = aiResponse.content[0].type === "text" ? aiResponse.content[0].text : "";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON in response");
    generated = JSON.parse(match[0]);
  } catch (e: any) {
    return NextResponse.json({ error: "AI generation failed: " + e.message }, { status: 500 });
  }

  // Fetch hero image from Pexels
  const photoQuery = getPhotoQuery(industry);
  const heroImageUrl = (await fetchPexelsPhoto(photoQuery)) || FALLBACKS[template];

  const siteData = {
    business: {
      name: businessName,
      tagline: generated.tagline,
      description,
      phone: phone || "(555) 000-0000",
      email: email || `hello@${businessName.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`,
      address: "",
      city: city || "Springfield",
      state: state || "IL",
      accent_color: generated.accent_color || accentColor,
      emoji: "🏆",
    },
    website: {
      hero_image_url: heroImageUrl,
      meta_title: generated.meta_title,
      meta_description: generated.meta_description,
      keywords: generated.keywords || [],
      services: generated.services || [],
      stats: generated.stats || [],
      testimonials: generated.testimonials || [],
      process_steps: generated.process_steps || [],
      faqs: generated.faqs || [],
    },
  };

  const pages = template === "trades"
    ? buildTradesSite(siteData)
    : buildProfessionalSite(siteData);

  return NextResponse.json({ success: true, template, pages, generated });
}
