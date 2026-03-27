import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildTradesSite } from "@/lib/templates/trades";
import { buildProfessionalSite } from "@/lib/templates/professional";
import { generateClinicalTemplate } from "@/lib/templates/clinical";
import { buildServicePage, servicePageSlug, ServicePageContext } from "@/lib/templates/service-page";
import { buildSitemap, buildRobots } from "@/lib/schema";
import { pickSitePhotos } from "@/lib/photos";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const TEMPLATE_MAP: Record<string, string[]> = {
  clinical: ["dental", "dentist", "chiropractic", "chiropractor", "optometry", "optometrist", "physical therapy", "medical clinic", "urgent care", "pediatric", "dermatology", "orthopedic", "mental health", "therapy", "counseling", "med spa", "wellness"],
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

function detectTemplate(industry: string): "trades" | "professional" | "clinical" {
  const lower = industry.toLowerCase();
  if (TEMPLATE_MAP.clinical.some(k => lower.includes(k))) return "clinical";
  if (TEMPLATE_MAP.trades.some(k => lower.includes(k))) return "trades";
  if (TEMPLATE_MAP.professional.some(k => lower.includes(k))) return "professional";
  return "professional";
}

function isStateLicensed(industry: string): boolean {
  return STATE_LICENSED.some(k => industry.toLowerCase().includes(k));
}

// ─── FORMAT TEAM DATA ──────────────────────────────────────────────────────────

async function formatTeamMember(member: any, businessName: string, industry: string): Promise<any> {
  const hasContent = member.name || member.bio || member.education || member.awards;
  if (!hasContent) return member;

  const fieldSummary = [
    member.name        && `Name: ${member.name}`,
    member.title       && `Title: ${member.title}`,
    member.experience  && `Experience: ${member.experience}`,
    member.credentials && `Credentials: ${member.credentials}`,
    member.bio         && `Bio:\n${member.bio}`,
    member.education   && `Education:\n${member.education}`,
    member.barAdmissions && `Bar Admissions:\n${member.barAdmissions}`,
    member.specializations && `Specializations: ${member.specializations}`,
    member.awards      && `Awards:\n${member.awards}`,
    member.publications && `Publications:\n${member.publications}`,
  ].filter(Boolean).join("\n\n");

  const prompt = `You are editing a professional bio for a ${industry} business called "${businessName}".

Fix typos, capitalization, punctuation, and grammar. Expand abbreviations where appropriate (e.g. "NY law" → "New York Law School"). Make incomplete notes into proper sentences. Do NOT invent new facts or add content not provided.

Input:
${fieldSummary}

Return ONLY valid JSON with these exact fields (use empty string "" for any field not provided):
{
  "name": "properly capitalized full name",
  "title": "properly formatted title",
  "experience": "cleaned up",
  "credentials": "properly formatted, comma separated",
  "bio": "cleaned up bio — fix typos, capitalize sentences, expand into proper paragraphs",
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
    return { ...member, ...Object.fromEntries(Object.entries(cleaned).filter(([_, v]) => v !== "")) };
  } catch {
    return member;
  }
}

// ─── GENERATE SERVICE PAGE CONTENT ────────────────────────────────────────────

async function generateServicePageContent(
  service: { name: string; description: string },
  ctx: { businessName: string; industry: string; city: string; state: string; serviceArea: string; stateLicensed: boolean }
): Promise<{ content: string; faqs: Array<{ question: string; answer: string }>; metaTitle: string; metaDescription: string }> {

  const geoPhrase = ctx.stateLicensed ? ctx.state : `${ctx.city}, ${ctx.state}`;

  const prompt = `Write a professional, SEO-optimized service page for a ${ctx.industry} business.

Business: ${ctx.businessName}
Service: ${service.name}
Service Description: ${service.description}
Location: ${ctx.serviceArea}

Write approximately 750 words of content. Use proper HTML heading tags (h2, h3) and paragraph tags. Structure it as:
- Opening paragraph establishing the business as the authority on this service in ${geoPhrase}
- 2-3 h2 sections diving into what this service involves, why it matters, and what sets ${ctx.businessName} apart
- Use specific details relevant to ${service.name} — don't be generic
- Naturally weave in "${geoPhrase}" for local SEO without keyword stuffing
- End with a compelling paragraph that drives toward contact

Also generate 3 FAQs specific to this service and location.

Respond ONLY with valid JSON:
{
  "content": "<p>Opening paragraph...</p><h2>Section heading</h2><p>...</p>",
  "faqs": [
    {"question": "Specific question about ${service.name} in ${geoPhrase}", "answer": "Detailed answer"},
    {"question": "Another specific question", "answer": "Detailed answer"},
    {"question": "Another specific question", "answer": "Detailed answer"}
  ],
  "metaTitle": "${service.name} | ${ctx.businessName} | ${geoPhrase} — under 60 chars",
  "metaDescription": "Compelling meta description under 155 chars mentioning ${service.name} and ${geoPhrase}"
}`;

  try {
    const res = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });
    const raw = res.content[0].type === "text" ? res.content[0].text : "";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON");
    return JSON.parse(match[0]);
  } catch {
    // Graceful fallback
    return {
      content: `<p>${service.description}</p><h2>Why Choose ${ctx.businessName}?</h2><p>We are dedicated to providing exceptional ${service.name.toLowerCase()} services throughout ${ctx.serviceArea}. Contact us today to learn more.</p>`,
      faqs: [],
      metaTitle: `${service.name} | ${ctx.businessName}`,
      metaDescription: `${service.name} services from ${ctx.businessName}. Serving ${ctx.serviceArea}.`,
    };
  }
}

// ─── MAIN HANDLER ──────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const { businessName, industry, city, state, description, phone, email, founded, realStats, team, plan, practiceAreas } = await request.json();

  if (!businessName || !industry) {
    return NextResponse.json({ error: "businessName and industry are required" }, { status: 400 });
  }

  // Plan limits
  const PLAN_LIMITS: Record<string, { servicePages: number; maxTeamMembers: number }> = {
    starter: { servicePages: 3, maxTeamMembers: 1 },
    growth:  { servicePages: 6, maxTeamMembers: 3 },
    pro:     { servicePages: 6, maxTeamMembers: 5 },
  };
  const planLimits = PLAN_LIMITS[plan || "growth"] || PLAN_LIMITS.growth;

  const resolvedDescription = description?.trim() ||
    `${businessName} is a ${industry} business serving clients in ${city || "the local area"}, ${state || ""}.`;

  const template = detectTemplate(industry);
  const accentColor = (template as string) === "trades" ? "#a8c500" : (template as string) === "clinical" ? "#0d7694" : "#8b4513";
  const stateLicensed = isStateLicensed(industry);
  const resolvedState = state || "IL";
  const resolvedCity = city || "Springfield";
  const geoTarget = stateLicensed
    ? `${resolvedState} statewide (licensed throughout the state)`
    : `${resolvedCity}, ${resolvedState} and surrounding areas`;
  const serviceArea = stateLicensed
    ? `throughout ${resolvedState}`
    : `${resolvedCity}, ${resolvedState} and surrounding areas`;

  const sitePrompt = `You are generating content for a small business website.

Business Name: ${businessName}
Industry: ${industry}
Specific Business Type: ${resolvedDescription}
Location: ${resolvedCity}, ${resolvedState}
Geographic Target: ${geoTarget}

CRITICAL INSTRUCTION FOR SERVICES:
${practiceAreas && practiceAreas.length > 0
  ? `The customer has specified their exact practice areas/services: ${practiceAreas.join(", ")}
Use THESE as the service names exactly as written. Generate descriptions for each one specific to ${businessName}.
Do NOT add or substitute different services.`
  : `Generate services SPECIFICALLY relevant to "${businessName}" based on their description: "${resolvedDescription}".
Do NOT generate generic "${industry}" services — use the description to infer the EXACT specialty.
For example: "business law" → Contract Law, Business Formation, M&A — NOT personal injury.`
}

IMPORTANT: This business serves ${geoTarget}. ${stateLicensed ? `Use "${resolvedState}" statewide references.` : `Use the local city and region.`}

Generate rich, specific, professional content tailored to THIS exact business. No generic filler.

Respond ONLY with valid JSON (no markdown, no backticks):
{
  "tagline": "Compelling 4-7 word tagline specific to ${resolvedDescription}",
  "accent_color": "${accentColor}",
  "services": [
    ${(practiceAreas && practiceAreas.length > 0
      ? practiceAreas.slice(0, 6).map((a: string) => `{"name": "${a}", "description": "2-3 sentences specific to ${businessName}", "icon": "relevant emoji"}`)
      : Array(6).fill(`{"name": "Specific service based on description", "description": "2-3 sentences", "icon": "emoji"}`)
    ).join(",\n    ")}
  ],
  "stats": [],
  "testimonials": [],
  "process_steps": [
    {"title": "Step 1 specific to ${resolvedDescription}", "description": "Specific to this type of business"},
    {"title": "Step 2", "description": "Specific description"},
    {"title": "Step 3", "description": "Specific description"},
    {"title": "Step 4", "description": "Specific description"}
  ],
  "faqs": [
    {"question": "Real FAQ a client of ${businessName} would ask about ${resolvedDescription}", "answer": "Detailed answer"},
    {"question": "Real FAQ", "answer": "Detailed answer"},
    {"question": "Real FAQ", "answer": "Detailed answer"},
    {"question": "Real FAQ", "answer": "Detailed answer"}
  ],
  "meta_title": "${businessName} | ${industry} in ${stateLicensed ? resolvedState : `${resolvedCity}, ${resolvedState}`}",
  "meta_description": "Under 155 chars mentioning ${stateLicensed ? resolvedState : resolvedCity}.",
  "keywords": ["${industry.toLowerCase()} ${stateLicensed ? resolvedState : resolvedCity}", "${industry.toLowerCase()} ${resolvedState}", "keyword 3", "keyword 4", "keyword 5", "keyword 6"]
}`;

  const teamMembers = (team && team.length > 0 ? team.filter((m: any) => m.name?.trim()) : []).slice(0, planLimits.maxTeamMembers);

  // Phase 1: Generate site content + format team in parallel
  const [generated, formattedTeam] = await Promise.all([
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
    Promise.all(teamMembers.map((m: any) => formatTeamMember(m, businessName, industry))),
  ]);

  const services: Array<{ name: string; description: string; icon: string }> = generated.services || [];

  // Phase 2: Generate all service pages in parallel
  const serviceCtx = { businessName, industry, city: resolvedCity, state: resolvedState, serviceArea, stateLicensed };
  // Generate content only for services within plan limit
  const servicePageContents = await Promise.all(
    services.slice(0, planLimits.servicePages).map(s => generateServicePageContent(s, serviceCtx))
  );

  // Pick photos
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
      industry,
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
      services: services.map(s => ({
        ...s,
        link: servicePageSlug(s.name), // e.g. "services/personal-injury-law.html"
      })),
      stats: (realStats && realStats.length > 0)
        ? realStats.map((s: any) => ({ value: s.value, label: s.label }))
        : [],
      testimonials: [],
      process_steps: generated.process_steps || [],
      faqs: generated.faqs || [],
    },
    team: formattedTeam.length > 0 ? formattedTeam : undefined,
  };

  // Build main site pages
  let pages: Record<string, string>;
  if (template === "trades") {
    pages = buildTradesSite(siteData);
  } else if (template === "clinical") {
    pages = { "index.html": generateClinicalTemplate(siteData) };
  } else {
    pages = buildProfessionalSite(siteData);
  }

  // Apply plan service page limit
  const limitedServices = services.slice(0, planLimits.servicePages);

  // Build individual service pages
  const servicePageCtx: ServicePageContext = {
    business: { ...siteData.business },
    template,
  };

  limitedServices.forEach((service, i) => {
    const pageSlug = servicePageSlug(service.name);
    const content = servicePageContents[i];
    pages[pageSlug] = buildServicePage(servicePageCtx, {
      serviceName: service.name,
      serviceDescription: service.description,
      content: content.content,
      faqs: content.faqs,
      metaTitle: content.metaTitle,
      metaDescription: content.metaDescription,
    });
  });

  // Sitemap + robots.txt
  const siteSlug = businessName.toLowerCase().replace(/[^a-z0-9]/g, "");
  const siteUrl = `https://${siteSlug}.exsisto.ai`;
  pages["sitemap.xml"] = buildSitemap(pages, siteUrl);
  pages["robots.txt"] = buildRobots(siteUrl);

  return NextResponse.json({ success: true, template, pages, generated });
}
