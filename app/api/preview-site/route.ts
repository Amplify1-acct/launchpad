import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildTradesSite } from "@/lib/templates/trades";
import { buildProfessionalSite } from "@/lib/templates/professional";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const TEMPLATE_MAP: Record<string, string[]> = {
  trades: ["plumbing", "roofing", "hvac", "electrical", "contractor", "landscaping", "lawn", "cleaning", "pest", "painting", "flooring", "handyman", "plumber", "roofer", "electrician", "carpenter"],
  professional: ["law", "legal", "attorney", "lawyer", "accounting", "accountant", "financial", "finance", "consulting", "consultant", "insurance", "real estate", "advisor", "bookkeeping", "tax", "cpa", "hr", "recruiting"],
};

// Industry → specific Unsplash photo query for relevant, high-quality results
const PHOTO_QUERIES: Record<string, string> = {
  "law firm": "law firm office attorney professional",
  "legal": "lawyer office legal professional",
  "attorney": "attorney law office professional",
  "accounting": "accountant office professional desk",
  "accountant": "accounting office business professional",
  "financial": "financial advisor office business meeting",
  "finance": "finance office professional business",
  "consulting": "business consulting office meeting professional",
  "consultant": "business consultant meeting office",
  "real estate": "real estate office professional agent",
  "insurance": "insurance office professional business",
  "bookkeeping": "accountant office desk professional",
  "tax": "tax accountant office professional",
  "plumbing": "plumber professional working pipes",
  "roofing": "roofer professional roofing contractor",
  "hvac": "hvac technician professional air conditioning",
  "electrical": "electrician professional working",
  "contractor": "contractor construction professional worker",
  "landscaping": "landscaping garden professional outdoor",
  "lawn": "lawn care professional outdoor garden",
  "cleaning": "professional cleaning service house",
  "pest": "pest control professional exterminator",
  "painting": "painter professional house painting",
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
  // Fallback: use the industry name directly
  return `${industry} professional office business`;
}

// Curated fallback images per template type (no construction workers for law firms!)
const FALLBACKS: Record<string, string> = {
  professional: "https://images.unsplash.com/photo-1521791055366-0d553872952f?w=1400&auto=format&fit=crop", // law office
  trades: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1400&auto=format&fit=crop", // contractor
};

export async function POST(request: Request) {
  const { businessName, industry, city, state, description, phone, email } = await request.json();

  if (!businessName || !industry || !description) {
    return NextResponse.json({ error: "businessName, industry, and description are required" }, { status: 400 });
  }

  const template = detectTemplate(industry);
  const accentColor = template === "trades" ? "#a8c500" : "#8b4513";

  // Generate content via Claude
  const prompt = `You are generating content for a small business website.

Business Name: ${businessName}
Industry: ${industry}
Location: ${city || "Springfield"}, ${state || "IL"}
Description: ${description}

Generate rich, specific, professional content. Avoid generic filler — make it feel real and tailored to THIS business.

Respond ONLY with valid JSON (no markdown, no backticks):
{
  "tagline": "A compelling 4-7 word tagline specific to this business and industry",
  "accent_color": "${accentColor}",
  "services": [
    {"name": "Specific Service Name", "description": "2-3 sentence description of this specific service, mentioning real benefits", "icon": "relevant emoji"},
    {"name": "Specific Service Name", "description": "2-3 sentence description", "icon": "relevant emoji"},
    {"name": "Specific Service Name", "description": "2-3 sentence description", "icon": "relevant emoji"},
    {"name": "Specific Service Name", "description": "2-3 sentence description", "icon": "relevant emoji"},
    {"name": "Specific Service Name", "description": "2-3 sentence description", "icon": "relevant emoji"},
    {"name": "Specific Service Name", "description": "2-3 sentence description", "icon": "relevant emoji"}
  ],
  "stats": [
    {"value": "15+", "label": "Years in Business"},
    {"value": "800+", "label": "Happy Clients"},
    {"value": "100%", "label": "Satisfaction Rate"},
    {"value": "$50M+", "label": "Recovered for Clients"}
  ],
  "testimonials": [
    {"name": "First Last", "text": "A specific, believable 2-3 sentence testimonial that references the actual service and result", "rating": 5, "location": "${city || "Springfield"}, ${state || "IL"}"},
    {"name": "First Last", "text": "A specific, believable 2-3 sentence testimonial", "rating": 5, "location": "Nearby city, ${state || "IL"}"},
    {"name": "First Last", "text": "A specific, believable 2-3 sentence testimonial", "rating": 5, "location": "${city || "Springfield"}, ${state || "IL"}"},
    {"name": "First Last", "text": "A specific, believable 2-3 sentence testimonial", "rating": 5, "location": "Nearby city, ${state || "IL"}"}
  ],
  "process_steps": [
    {"title": "Step title specific to ${industry}", "description": "What happens in this step — be specific"},
    {"title": "Step title", "description": "What happens"},
    {"title": "Step title", "description": "What happens"},
    {"title": "Step title", "description": "What happens"}
  ],
  "faqs": [
    {"question": "Specific FAQ relevant to ${industry}", "answer": "Detailed, helpful answer"},
    {"question": "Specific FAQ", "answer": "Detailed answer"},
    {"question": "Specific FAQ", "answer": "Detailed answer"},
    {"question": "Specific FAQ", "answer": "Detailed answer"}
  ],
  "meta_title": "${businessName} | ${industry} in ${city || "Springfield"}, ${state || "IL"}",
  "meta_description": "Compelling meta description for ${businessName} under 155 characters.",
  "keywords": ["keyword 1", "keyword 2", "keyword 3", "keyword 4", "keyword 5", "keyword 6"]
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

  // Fetch industry-specific hero image
  let heroImageUrl = FALLBACKS[template];
  try {
    const photoQuery = getPhotoQuery(industry);
    const unsplashRes = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(photoQuery)}&per_page=5&orientation=landscape`,
      { headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` } }
    );
    const unsplashData = await unsplashRes.json();
    // Pick a random one from top 5 for variety
    const results = unsplashData.results || [];
    if (results.length > 0) {
      const pick = results[Math.floor(Math.random() * Math.min(results.length, 3))];
      heroImageUrl = pick.urls.regular + "&w=1400&fit=crop";
    }
  } catch {}

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
