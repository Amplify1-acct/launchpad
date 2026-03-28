import { createAdminClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const maxDuration = 120;

// ─── Template selection ────────────────────────────────────────────────────

const TEMPLATE_MAP: Record<string, string> = {
  // Dental / Medical
  "dental": "dental-clean",
  "dentist": "dental-clean",
  "medical": "dental-clean",
  "doctor": "dental-clean",
  "clinic": "dental-clean",
  "optometry": "dental-clean",
  "chiropractic": "dental-clean",
  // Restaurant / Food
  "restaurant": "restaurant-warm",
  "cafe": "restaurant-warm",
  "bakery": "restaurant-warm",
  "food": "restaurant-warm",
  "bar": "restaurant-warm",
  "catering": "restaurant-warm",
  // Real Estate
  "real estate": "realestate-luxury",
  "realtor": "realestate-luxury",
  "property": "realestate-luxury",
  "mortgage": "realestate-luxury",
  // Fitness / Gym
  "gym": "fitness-bold",
  "fitness": "fitness-bold",
  "personal trainer": "fitness-bold",
  "yoga": "fitness-bold",
  "crossfit": "fitness-bold",
  "martial arts": "fitness-bold",
  "pilates": "fitness-bold",
  // Home Services
  "plumbing": "homeservices-clean",
  "electrical": "homeservices-clean",
  "hvac": "homeservices-clean",
  "landscaping": "homeservices-clean",
  "cleaning": "homeservices-clean",
  "roofing": "homeservices-clean",
  "construction": "homeservices-clean",
  "remodeling": "homeservices-clean",
  "handyman": "homeservices-clean",
  "pest control": "homeservices-clean",
  "home services": "homeservices-clean",
  // Financial
  "financial": "financial-premium",
  "wealth management": "financial-premium",
  "accounting": "financial-premium",
  "insurance": "financial-premium",
  "investment": "financial-premium",
  "tax": "financial-premium",
  // Law
  "law": "law-chambers",
  "attorney": "law-chambers",
  "lawyer": "law-chambers",
  "legal": "law-chambers",
};

function selectTemplate(industry: string): string {
  const lower = (industry || "").toLowerCase();
  for (const [key, template] of Object.entries(TEMPLATE_MAP)) {
    if (lower.includes(key)) return template;
  }
  return "homeservices-clean"; // default fallback
}

// ─── Template fetcher ──────────────────────────────────────────────────────

async function fetchTemplate(templateName: string): Promise<string> {
  const REPO = "Amplify1-acct/launchpad";
  const path = `templates/${templateName}.html`;

  // Try raw GitHub URL first (works for public repos, no auth needed)
  const rawUrl = `https://raw.githubusercontent.com/${REPO}/main/${path}`;
  const rawRes = await fetch(rawUrl);
  if (rawRes.ok) {
    return rawRes.text();
  }

  // Fallback to API with token
  const GH_TOKEN = process.env.GITHUB_TOKEN;
  if (GH_TOKEN) {
    const res = await fetch(
      `https://api.github.com/repos/${REPO}/contents/${path}`,
      {
        headers: {
          Authorization: `token ${GH_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );
    if (res.ok) {
      const data = await res.json();
      return Buffer.from(data.content, "base64").toString("utf-8");
    }
  }

  throw new Error(`Template not found: ${templateName}`);
}

// ─── Token injector ────────────────────────────────────────────────────────

function injectTokens(html: string, tokens: Record<string, string>): string {
  let result = html;
  for (const [key, value] of Object.entries(tokens)) {
    const regex = new RegExp(`{{${key}}}`, "g");
    result = result.replace(regex, value || "");
  }
  return result;
}

// ─── Content generator ─────────────────────────────────────────────────────

async function generateTokens(business: Record<string, any>, templateName: string): Promise<Record<string, string>> {
  const industry = business.industry || business.description || "business";
  const name = business.name;
  const city = business.city || "";
  const state = business.state || "";
  const phone = business.phone || "";
  const email = business.email || "";
  const address = business.address || "";
  const description = business.description || "";

  const prompt = `You are generating website content for a small business. Return ONLY valid JSON with no markdown, no backticks, no extra text.

Business Details:
- Name: ${name}
- Industry: ${industry}
- Description: ${description}
- City: ${city}, ${state}
- Phone: ${phone}
- Email: ${email}
- Address: ${address}
- Template style: ${templateName}

Generate realistic, professional website content. Make it specific to this business — not generic. Use the actual city name, actual industry terminology, actual services this type of business would offer.

Return this exact JSON structure:
{
  "business_name": "${name}",
  "tagline": "A compelling short tagline for this business",
  "city": "${city}",
  "state": "${state}",
  "phone": "${phone}",
  "email": "${email}",
  "address": "${address}",
  "zip": "",
  "year": "2026",
  "cta": "Get a Free Consultation",
  "hero_headline": "A bold 4-6 word headline split across two lines with <br/> tag",
  "hero_headline_italic": "The second italic part of the headline",
  "hero_highlight": "2-3 word emphasis phrase",
  "hero_subheadline": "A compelling 2-sentence description of what makes this business great",
  "hero_image_url": "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=800&fit=crop&auto=format",
  "about_image_url": "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=600&fit=crop&auto=format",
  "about_headline": "A compelling about section headline",
  "about_paragraph_1": "First paragraph about the business history and mission (2-3 sentences)",
  "about_paragraph_2": "Second paragraph about approach and values (2-3 sentences)",
  "established_label": "Established ${new Date().getFullYear() - Math.floor(Math.random() * 15 + 5)}",
  "established_year": "${new Date().getFullYear() - Math.floor(Math.random() * 15 + 5)}",
  "trust_1": "Licensed & Insured",
  "trust_2": "Free Estimates",
  "trust_3": "Satisfaction Guaranteed",
  "review_rating": "4.9",
  "review_count": "200+",
  "response_time": "Same-day",
  "hours": "Mon–Fri 8am–6pm",
  "hours_short": "Mon–Sat 8am–6pm",
  "hours_weekday": "Mon–Fri: 8:00am – 6:00pm",
  "hours_weekend": "Saturday: 9:00am – 4:00pm",
  "hours_closed": "Sunday: Closed",
  "stat_1_value": "15+",
  "stat_1_label": "Years Experience",
  "stat_2_value": "500+",
  "stat_2_label": "Happy Clients",
  "stat_3_value": "100%",
  "stat_3_label": "Satisfaction Rate",
  "stat_4_value": "24/7",
  "stat_4_label": "Support Available",
  "service_1_name": "Primary service name",
  "service_1_description": "Description of primary service (2 sentences)",
  "service_2_name": "Second service name",
  "service_2_description": "Description of second service (2 sentences)",
  "service_3_name": "Third service name",
  "service_3_description": "Description of third service (2 sentences)",
  "service_4_name": "Fourth service name",
  "service_4_description": "Description of fourth service (2 sentences)",
  "service_5_name": "Fifth service name",
  "service_5_description": "Description of fifth service (2 sentences)",
  "service_6_name": "Sixth service name",
  "service_6_description": "Description of sixth service (2 sentences)",
  "services_heading": "Services section heading",
  "why_headline": "Why Choose Us heading",
  "why_description": "2-sentence description of why this business is the best choice",
  "feature_1_title": "First differentiator",
  "feature_1_description": "Brief explanation",
  "feature_2_title": "Second differentiator",
  "feature_2_description": "Brief explanation",
  "feature_3_title": "Third differentiator",
  "feature_3_description": "Brief explanation",
  "process_heading": "How It Works",
  "step_1_title": "First step title",
  "step_1_description": "Brief step description",
  "step_2_title": "Second step title",
  "step_2_description": "Brief step description",
  "step_3_title": "Third step title",
  "step_3_description": "Brief step description",
  "step_4_title": "Fourth step title",
  "step_4_description": "Brief step description",
  "reviews_heading": "What Our Customers Say",
  "review_1_text": "A positive customer review for this type of business (2-3 sentences)",
  "review_1_name": "Sarah M.",
  "review_1_initials": "SM",
  "review_1_date": "2 weeks ago",
  "review_2_text": "A second positive customer review (2-3 sentences)",
  "review_2_name": "James T.",
  "review_2_initials": "JT",
  "review_2_date": "1 month ago",
  "review_3_text": "A third positive customer review (2-3 sentences)",
  "review_3_name": "Lisa R.",
  "review_3_initials": "LR",
  "review_3_date": "3 months ago",
  "contact_heading": "Get In Touch",
  "contact_description": "2-sentence invitation to contact this business",
  "footer_description": "A short 1-sentence description of the business for the footer",
  "years_experience": "15+"
}`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4000,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON in Claude response");

  const tokens = JSON.parse(jsonMatch[0]);

  // Add any remaining business fields directly
  tokens.business_name = tokens.business_name || name;
  tokens.phone = tokens.phone || phone;
  tokens.email = tokens.email || email;
  tokens.city = tokens.city || city;
  tokens.state = tokens.state || state;
  tokens.address = tokens.address || address;
  tokens.year = new Date().getFullYear().toString();

  return tokens;
}

// ─── Main handler ──────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { business_id, template_override } = body;

    if (!business_id) {
      return NextResponse.json({ error: "business_id required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Fetch business data
    const { data: business, error: bizErr } = await supabase
      .from("businesses")
      .select("*")
      .eq("id", business_id)
      .single();

    if (bizErr || !business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // Select template
    const templateName = template_override || selectTemplate(business.industry || business.description || "");

    console.log(`Generating site for ${business.name} using template: ${templateName}`);

    // Generate content tokens with Claude
    const tokens = await generateTokens(business, templateName);

    // Fetch the HTML template
    const templateHtml = await fetchTemplate(templateName);

    // Inject tokens
    const siteHtml = injectTokens(templateHtml, tokens);

    // Save generated HTML to Supabase
    await supabase
      .from("websites")
      .upsert({
        business_id,
        status: "ready_for_review",
        custom_html: siteHtml,
        template_name: templateName,
        generated_tokens: tokens,
        generated_at: new Date().toISOString(),
      }, { onConflict: "business_id" });

    return NextResponse.json({
      success: true,
      template: templateName,
      tokens_generated: Object.keys(tokens).length,
      html_length: siteHtml.length,
      // Return HTML preview for immediate display
      html: siteHtml,
    });

  } catch (error: any) {
    console.error("Site generation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
