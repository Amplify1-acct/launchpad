import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildTradesSite } from "@/lib/templates/trades";
import { buildProfessionalSite } from "@/lib/templates/professional";
import { pickHero, pickInterior } from "@/lib/photos";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const TEMPLATE_MAP: Record<string, string[]> = {
  trades: ["plumbing", "roofing", "hvac", "electrical", "contractor", "landscaping", "lawn", "cleaning", "pest", "painting", "flooring", "handyman", "plumber", "roofer", "electrician", "carpenter"],
  professional: ["law", "legal", "attorney", "lawyer", "accounting", "accountant", "financial", "finance", "consulting", "consultant", "insurance", "real estate", "advisor", "bookkeeping", "tax", "cpa", "hr", "recruiting"],
};

const STATE_LICENSED: string[] = [
  "law", "legal", "attorney", "lawyer",
  "accounting", "accountant", "cpa",
  "financial", "finance", "advisor", "wealth",
  "insurance",
  "real estate",
  "mortgage",
  "therapist", "therapy", "psychologist",
  "physician", "medical", "doctor",
  "dental", "dentist",
  "chiropractor",
];

function detectTemplate(industry: string): "trades" | "professional" {
  const lower = industry.toLowerCase();
  if (TEMPLATE_MAP.trades.some(k => lower.includes(k))) return "trades";
  if (TEMPLATE_MAP.professional.some(k => lower.includes(k))) return "professional";
  return "trades";
}

function isStateLicensed(industry: string): boolean {
  const lower = industry.toLowerCase();
  return STATE_LICENSED.some(k => lower.includes(k));
}

export async function POST(request: Request) {
  const { businessName, industry, city, state, description, phone, email, founded, realStats, team } = await request.json();

  if (!businessName || !industry) {
    return NextResponse.json({ error: "businessName and industry are required" }, { status: 400 });
  }
  // Use fallback description if blank
  const resolvedDescription = description?.trim() || `${businessName} is a ${industry} business serving clients in ${city || "the local area"}, ${state || ""}.`;

  const template = detectTemplate(industry);
  const accentColor = template === "trades" ? "#a8c500" : "#8b4513";
  const stateLicensed = isStateLicensed(industry);
  const resolvedState = state || "IL";
  const resolvedCity = city || "Springfield";
  const geoTarget = stateLicensed
    ? `${resolvedState} statewide (licensed throughout the state)`
    : `${resolvedCity}, ${resolvedState} and surrounding areas`;
  const serviceArea = stateLicensed
    ? `throughout ${resolvedState}`
    : `${resolvedCity}, ${resolvedState} and surrounding areas`;

  const prompt = `You are generating content for a small business website.

Business Name: ${businessName}
Industry: ${industry}
Location: ${resolvedCity}, ${resolvedState}
Geographic Target: ${geoTarget}
Description: ${resolvedDescription}

IMPORTANT: This business serves ${geoTarget}. All geographic references in copy, meta tags, and keywords should reflect this — ${stateLicensed ? `use "${resolvedState}" statewide references, not just the city` : `use the local city and region`}.

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
  "stats": [],
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
  "meta_title": "${businessName} | ${industry} in ${stateLicensed ? resolvedState : `${resolvedCity}, ${resolvedState}`}",
  "meta_description": "Under 155 characters. Compelling description mentioning ${stateLicensed ? resolvedState : resolvedCity}.",
  "keywords": ["${industry.toLowerCase()} ${stateLicensed ? resolvedState : resolvedCity}", "${industry.toLowerCase()} ${resolvedState}", "keyword 3", "keyword 4", "keyword 5", "keyword 6"]
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

  // Use curated photo library — no API call needed, always perfect match
  const heroImageUrl = pickHero(industry, template);
  const interiorImageUrl = pickInterior(industry, template);

  const siteData = {
    business: {
      name: businessName,
      tagline: generated.tagline,
      description: resolvedDescription,
      phone: phone || "(555) 000-0000",
      email: email || `hello@${businessName.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`,
      address: "",
      city: resolvedCity,
      state: resolvedState,
      accent_color: generated.accent_color || accentColor,
      emoji: "🏆",
      stateLicensed,
      serviceArea,
    },
    website: {
      hero_image_url: heroImageUrl,
      interior_image_url: interiorImageUrl,
      meta_title: generated.meta_title,
      meta_description: generated.meta_description,
      keywords: generated.keywords || [],
      founded: founded || null,
      services: generated.services || [],
      stats: (realStats && realStats.length > 0)
        ? realStats.map((s: any) => ({ value: s.value, label: s.label }))
        : generated.stats || [],
      testimonials: [],
      process_steps: generated.process_steps || [],
      faqs: generated.faqs || [],
    },
  };

  const siteWithTeam = {
    ...siteData,
    team: (team && team.length > 0) ? team : undefined,
  };

  const pages = template === "trades"
    ? buildTradesSite(siteWithTeam)
    : buildProfessionalSite(siteWithTeam);

  return NextResponse.json({ success: true, template, pages, generated });
}
