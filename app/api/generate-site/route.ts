import { createAdminClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
export const maxDuration = 120;

const SKELETONS = ["skeleton-bold", "skeleton-clean", "skeleton-warm"];

async function fetchTemplate(name: string): Promise<string> {
  const url = `https://raw.githubusercontent.com/Amplify1-acct/launchpad/main/templates/${name}.html`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Template not found: ${name}`);
  return res.text();
}

function injectTokens(html: string, tokens: Record<string, string>): string {
  let result = html;
  for (const [key, value] of Object.entries(tokens)) {
    result = result.replace(new RegExp(`{{${key}}}`, "g"), value || "");
  }
  // Clear any remaining unfilled tokens
  result = result.replace(/{{[a-z_]+}}/g, "");
  return result;
}

async function generateTokens(business: Record<string, any>, revisionNotes?: string): Promise<Record<string, string>> {
  const prompt = `You are generating website content for a small business. Return ONLY valid JSON — no markdown, no backticks, no explanation.

Business:
- Name: ${business.name}
- Industry/Description: ${business.description || business.industry}
- City: ${business.city || ""}, ${business.state || ""}
- Phone: ${business.phone || ""}
- Email: ${business.email || ""}

${revisionNotes ? `
REVISION REQUEST — This is a revision. The customer has already seen the site and wants these specific changes:
"${revisionNotes}"

You MUST apply these changes. They take priority over everything else. If they say change the color, change it. If they say rewrite the headline, rewrite it. Read their feedback carefully and reflect it in every relevant field.
` : ""}
Generate specific, realistic content for THIS business. Not generic. Use real industry terminology, real service names, real hero copy that feels like it was written for them.

For hero images, pick a relevant Unsplash photo URL. Format: https://images.unsplash.com/photo-PHOTOID?w=1200&h=800&fit=crop&auto=format

Return exactly this JSON:
{
  "business_name": "${business.name}",
  "meta_title": "SEO title under 60 chars",
  "meta_description": "SEO description under 160 chars",
  "accent_color": "#hexcolor that fits this industry and feels professional",
  "city": "${business.city || ""}",
  "state": "${business.state || ""}",
  "phone": "${business.phone || ""}",
  "phone_raw": "${business.phone || ""}",
  "email": "${business.email || ""}",
  "address": "${business.address || ""}",
  "year": "2026",
  "cta": "Short action CTA like Get a Free Quote or Schedule Service",
  "hero_headline": "Bold 3-5 word headline for this business",
  "hero_line_1": "First line of headline",
  "hero_line_2": "Second line (the punchy part)",
  "hero_highlight": "2-3 word emphasis phrase",
  "hero_headline_italic": "Italic/poetic version of the tagline",
  "hero_subheadline": "2-sentence description of what makes this business great",
  "hero_image_url": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&h=800&fit=crop&auto=format",
  "about_image_url": "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop&auto=format",
  "about_headline": "About section headline",
  "about_headline_2": "Second line of about headline",
  "about_paragraph_1": "2-3 sentences about the business history and mission",
  "about_paragraph_2": "2-3 sentences about approach and values",
  "founder_quote": "A quote from the founder about their passion (1-2 sentences)",
  "founder_name": "Owner Name",
  "founder_title": "Owner / Founder",
  "why_headline": "Why Choose Us headline",
  "why_description": "2 sentences on why this business is the best choice",
  "trust_1": "Licensed & Insured",
  "trust_2": "Free Estimates",
  "trust_3": "Satisfaction Guaranteed",
  "review_rating": "4.9",
  "review_count": "150",
  "hours": "Mon–Fri 8am–6pm, Sat 9am–4pm",
  "hours_short": "Mon–Sat 8am–6pm",
  "stat_1_value": "15+",
  "stat_1_label": "Years in Business",
  "stat_2_value": "500+",
  "stat_2_label": "Happy Customers",
  "stat_3_value": "100%",
  "stat_3_label": "Satisfaction Rate",
  "stat_4_value": "5★",
  "stat_4_label": "Average Rating",
  "services_heading": "Our Services",
  "service_1_name": "Primary service name",
  "service_1_description": "2-sentence description",
  "service_1_icon": "relevant emoji",
  "service_1_category": "Category label",
  "service_2_name": "Second service",
  "service_2_description": "2-sentence description",
  "service_2_icon": "relevant emoji",
  "service_2_category": "Category label",
  "service_3_name": "Third service",
  "service_3_description": "2-sentence description",
  "service_3_icon": "relevant emoji",
  "service_3_category": "Category label",
  "service_4_name": "Fourth service",
  "service_4_description": "2-sentence description",
  "service_4_icon": "relevant emoji",
  "service_4_category": "Category label",
  "service_5_name": "Fifth service",
  "service_5_description": "2-sentence description",
  "service_5_icon": "relevant emoji",
  "service_5_category": "Category label",
  "service_6_name": "Sixth service",
  "service_6_description": "2-sentence description",
  "service_6_icon": "relevant emoji",
  "service_6_category": "Category label",
  "feature_1": "Key differentiator 1 (short phrase)",
  "feature_2": "Key differentiator 2",
  "feature_3": "Key differentiator 3",
  "feature_4": "Key differentiator 4",
  "feature_1_title": "Feature title",
  "feature_1_description": "Brief explanation",
  "feature_2_title": "Feature title",
  "feature_2_description": "Brief explanation",
  "feature_3_title": "Feature title",
  "feature_3_description": "Brief explanation",
  "process_heading": "How It Works",
  "step_1_title": "Step 1 title",
  "step_1_description": "Brief description",
  "step_2_title": "Step 2 title",
  "step_2_description": "Brief description",
  "step_3_title": "Step 3 title",
  "step_3_description": "Brief description",
  "step_4_title": "Step 4 title",
  "step_4_description": "Brief description",
  "reviews_heading": "What Our Customers Say",
  "review_1_text": "Realistic 2-sentence customer review for this type of business",
  "review_1_name": "First Last",
  "review_1_initials": "FL",
  "review_1_detail": "City, ST · 2 weeks ago",
  "review_2_text": "Another realistic 2-sentence review",
  "review_2_name": "First Last",
  "review_2_initials": "FL",
  "review_2_detail": "City, ST · 1 month ago",
  "review_3_text": "A third realistic 2-sentence review",
  "review_3_name": "First Last",
  "review_3_initials": "FL",
  "review_3_detail": "City, ST · 3 months ago",
  "contact_heading": "Get In Touch",
  "contact_description": "2-sentence invitation to contact this business"
}`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4000,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON in Claude response");
  return JSON.parse(jsonMatch[0]);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { business_id, template_override, revision_notes } = body;

    if (!business_id) {
      return NextResponse.json({ error: "business_id required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: business, error: bizErr } = await supabase
      .from("businesses").select("*").eq("id", business_id).single();

    if (bizErr || !business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // Generate content tokens once — same content, 3 visual styles
    const tokens = await generateTokens(business, revision_notes);

    // If a specific template was requested, generate just that one
    const templatesToGenerate = template_override
      ? [template_override]
      : SKELETONS;

    // Fetch all templates in parallel
    const htmlResults = await Promise.all(
      templatesToGenerate.map(async (name) => {
        const html = await fetchTemplate(name);
        return { name, html: injectTokens(html, tokens) };
      })
    );

    // Save the first (or only) result as the active site
    const primary = htmlResults[0];

    // If this is a revision, keep the existing template unless overridden
    let finalTemplateName = primary.name;
    if (revision_notes && !template_override) {
      const { data: existing } = await supabase
        .from("websites").select("template_name").eq("business_id", business_id).single();
      if (existing?.template_name) finalTemplateName = existing.template_name;
    }

    await supabase.from("websites").upsert({
      business_id,
      status: "ready_for_review",
      custom_html: primary.html,
      template_name: finalTemplateName,
      generated_tokens: tokens,
      generated_at: new Date().toISOString(),
      revision_notes: revision_notes || null,
      revision_requested_at: revision_notes ? new Date().toISOString() : null,
    }, { onConflict: "business_id" });

    return NextResponse.json({
      success: true,
      template: primary.name,
      tokens_generated: Object.keys(tokens).length,
      // Return all variants for the picker to show
      variants: htmlResults.map(r => ({ name: r.name, html: r.html })),
    });

  } catch (error: any) {
    console.error("Site generation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

