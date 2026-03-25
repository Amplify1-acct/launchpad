import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildTradesSite } from "@/lib/templates/trades";
import { buildProfessionalSite } from "@/lib/templates/professional";
import { pickSitePhotos } from "@/lib/photos";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const TEMPLATE_MAP: Record<string, string[]> = {
  trades: ["plumbing", "roofing", "hvac", "electrical", "contractor", "landscaping", "lawn", "cleaning", "pest", "painting", "flooring", "handyman", "plumber", "roofer", "electrician", "carpenter"],
  professional: ["law", "legal", "attorney", "lawyer", "accounting", "accountant", "financial", "finance", "consulting", "consultant", "insurance", "real estate", "advisor", "bookkeeping", "tax", "cpa", "hr", "recruiting"],
};

const STATE_LICENSED: string[] = [
  "law", "legal", "attorney", "lawyer",
  "accounting", "accountant", "cpa",
  "financial", "finance", "advisor", "wealth",
  "insurance", "real estate", "mortgage",
  "therapist", "therapy", "psychologist",
  "physician", "medical", "doctor",
  "dental", "dentist", "chiropractor",
];

function detectTemplate(industry: string): "trades" | "professional" {
  const lower = industry.toLowerCase();
  if (TEMPLATE_MAP.trades.some(k => lower.includes(k))) return "trades";
  if (TEMPLATE_MAP.professional.some(k => lower.includes(k))) return "professional";
  return "trades";
}

function isStateLicensed(industry: string): boolean {
  return STATE_LICENSED.some(k => industry.toLowerCase().includes(k));
}

// ─── FORMAT TEAM DATA ──────────────────────────────────────────────────────────
// Runs each team member's raw input through Claude to fix typos, capitalization,
// grammar, punctuation, and sentence structure — without changing the meaning.

async function formatTeamMember(member: any, businessName: string, industry: string): Promise<any> {
  // Skip if member has no meaningful content
  const hasContent = member.name || member.bio || member.education || member.awards;
  if (!hasContent) return member;

  const fieldSummary = [
    member.name       && `Name: ${member.name}`,
    member.title      && `Title: ${member.title}`,
    member.experience && `Experience: ${member.experience}`,
    member.credentials && `Credentials: ${member.credentials}`,
    member.bio        && `Bio:\n${member.bio}`,
    member.education  && `Education:\n${member.education}`,
    member.barAdmissions && `Bar Admissions:\n${member.barAdmissions}`,
    member.specializations && `Specializations: ${member.specializations}`,
    member.awards     && `Awards:\n${member.awards}`,
    member.publications && `Publications:\n${member.publications}`,
  ].filter(Boolean).join("\n\n");

  const prompt = `You are editing a professional bio for a ${industry} business called "${businessName}".

The person below submitted their information but it may have typos, inconsistent capitalization, grammar issues, incomplete sentences, or informal/unprofessional phrasing. 

Your job: clean it up professionally. Fix typos, capitalization, punctuation, and grammar. Expand abbreviations where appropriate (e.g. "NY law" → "New York Law School"). Make incomplete notes into proper sentences. Do NOT invent new facts, change dates, alter credentials, or add content that wasn't there. Preserve the person's voice and all specific details exactly.

Here is their input:
${fieldSummary}

Return ONLY valid JSON with these exact fields (use empty string "" for any field not provided):
{
  "name": "properly capitalized full name",
  "title": "properly formatted title",
  "experience": "number or phrase as provided, just cleaned up",
  "credentials": "properly formatted credentials, comma separated",
  "bio": "cleaned up bio — fix typos, capitalize sentences, fix grammar, expand into proper paragraphs if notes were provided. Preserve all facts.",
  "education": "each entry on its own line, properly formatted",
  "barAdmissions": "each admission on its own line, properly formatted",
  "specializations": "comma-separated, properly capitalized",
  "awards": "each award on its own line, properly formatted",
  "publications": "each publication on its own line, properly formatted"
}`;

  try {
    const res = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });
    const raw = res.content[0].type === "text" ? res.content[0].text : "";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return member;
    const cleaned = JSON.parse(match[0]);
    // Merge cleaned fields back — preserve linkedin which we didn't send for formatting
    return {
      ...member,
      ...Object.fromEntries(
        Object.entries(cleaned).filter(([_, v]) => v !== "")
      ),
    };
  } catch {
    // If formatting fails, return original — never block the site generation
    return member;
  }
}

// ─── MAIN HANDLER ──────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const { businessName, industry, city, state, description, phone, email, founded, realStats, team } = await request.json();

  if (!businessName || !industry) {
    return NextResponse.json({ error: "businessName and industry are required" }, { status: 400 });
  }

  const resolvedDescription = description?.trim() ||
    `${businessName} is a ${industry} business serving clients in ${city || "the local area"}, ${state || ""}.`;

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

  // Run site content generation + team formatting in parallel
  const sitePrompt = `You are generating content for a small business website.

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

  // Run site generation and team formatting in parallel for speed
  const teamMembers = team && team.length > 0
    ? team.filter((m: any) => m.name?.trim())
    : [];

  const [generated, formattedTeam] = await Promise.all([
    // Site content generation
    anthropic.messages.create({
      model: "claude-opus-4-5-20251101",
      max_tokens: 3000,
      messages: [{ role: "user", content: sitePrompt }],
    }).then(res => {
      const raw = res.content[0].type === "text" ? res.content[0].text : "";
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("No JSON in AI response");
      return JSON.parse(match[0]);
    }),

    // Team formatting — runs all members in parallel too
    Promise.all(
      teamMembers.map((m: any) => formatTeamMember(m, businessName, industry))
    ),
  ]);

  // Pick distinct photos
  const sitePhotos = pickSitePhotos(industry, template);

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
      hero_image_url: sitePhotos.hero,
      interior_image_url: sitePhotos.interior,
      about_image_url: sitePhotos.about,
      process_image_url: sitePhotos.process,
      cta_image_url: sitePhotos.cta,
      meta_title: generated.meta_title,
      meta_description: generated.meta_description,
      keywords: generated.keywords || [],
      founded: founded || null,
      services: generated.services || [],
      stats: (realStats && realStats.length > 0)
        ? realStats.map((s: any) => ({ value: s.value, label: s.label }))
        : [],
      testimonials: [],
      process_steps: generated.process_steps || [],
      faqs: generated.faqs || [],
    },
    team: formattedTeam.length > 0 ? formattedTeam : undefined,
  };

  const pages = template === "trades"
    ? buildTradesSite(siteData)
    : buildProfessionalSite(siteData);

  return NextResponse.json({ success: true, template, pages, generated });
}
