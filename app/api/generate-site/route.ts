import { createAdminClient } from "@/lib/supabase-server";
import { getBusinessImages, generateBusinessPhoto } from "@/lib/nano-banana";
import { generateStitchSite } from "@/lib/stitch";
import { generateServicesPage, generateAboutPage, generateContactPage, generateBlogIndexPage } from "@/lib/pageGenerator";
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
  result = result.replace(/{{[a-z_]+}}/g, "");
  return result;
}

async function generateTokens(
  business: Record<string, any>,
  revisionNotes?: string,
  existingTokens?: Record<string, string>
): Promise<Record<string, string>> {
  const isRevision = !!(revisionNotes && existingTokens && Object.keys(existingTokens).length > 0);

  const prompt = isRevision
    ? `You are updating a website for a small business. Return ONLY valid JSON — no markdown, no backticks.

Business: ${business.name} (${business.description || business.industry})
Location: ${business.city || ""}, ${business.state || ""}

CUSTOMER FEEDBACK: "${revisionNotes}"

RULES: Start with existing tokens, only modify what was asked for.

EXISTING TOKENS:
${JSON.stringify(existingTokens, null, 2)}

Return complete JSON with targeted changes.`
    : `Generate website content for a small business. Return ONLY valid JSON — no markdown, no backticks.

Business:
- Name: ${business.name}
- Industry: ${business.industry}
- Description: ${business.description || ""}
- Location: ${business.city || ""}, ${business.state || ""}
- Phone: ${business.phone || ""}
- Years in business: ${business.years_in_business || "established"}
- What makes them different: ${business.differentiator || "professional service and quality workmanship"}
- Key stat: ${business.key_stat ? `${business.key_stat} ${business.key_stat_label}` : ""}
- Services they offer: ${business.services?.length ? (business.services as string[]).join(", ") : "professional services"}

Return this JSON with EXACTLY these keys:
{
  "business_name": "${business.name}",
  "meta_title": "${business.name} | ${business.city || ""}",
  "meta_description": "2 sentence SEO description",
  "hero_line_1": "powerful 2-4 word headline",
  "hero_line_2": "powerful 2-4 word continuation",
  "hero_subheadline": "1-2 sentence value proposition",
  "hero_image_url": "https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg?auto=compress&cs=tinysrgb&w=1200&h=700&fit=crop",
  "about_image_url": "https://images.pexels.com/photos/1545743/pexels-photo-1545743.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
  "about_headline": "about section headline",
  "about_headline_2": "secondary about headline",
  "about_paragraph_1": "2-3 sentences about history and mission",
  "about_paragraph_2": "2-3 sentences about what sets them apart",
  "services_heading": "Our Services",
  "service_1_name": "first service",
  "service_1_description": "one sentence",
  "service_2_name": "second service",
  "service_2_description": "one sentence",
  "service_3_name": "third service",
  "service_3_description": "one sentence",
  "service_4_name": "fourth service",
  "service_4_description": "one sentence",
  "service_5_name": "fifth service",
  "service_5_description": "one sentence",
  "service_6_name": "sixth service",
  "service_6_description": "one sentence",
  "feature_1": "key differentiator 1",
  "feature_2": "key differentiator 2",
  "feature_3": "key differentiator 3",
  "feature_4": "key differentiator 4",
  "stat_1_value": "20+",
  "stat_1_label": "Years Experience",
  "stat_2_value": "500+",
  "stat_2_label": "Projects Completed",
  "stat_3_value": "100%",
  "stat_3_label": "Satisfaction Rate",
  "stat_4_value": "4.9★",
  "stat_4_label": "Average Rating",
  "reviews_heading": "What Our Customers Say",
  "review_1_text": "realistic glowing review 2-3 sentences",
  "review_1_name": "First Last",
  "review_1_initials": "FL",
  "review_1_detail": "Verified Customer",
  "review_2_text": "realistic glowing review 2-3 sentences",
  "review_2_name": "First Last",
  "review_2_initials": "FL",
  "review_2_detail": "Verified Customer",
  "review_3_text": "realistic glowing review 2-3 sentences",
  "review_3_name": "First Last",
  "review_3_initials": "FL",
  "review_3_detail": "Verified Customer",
  "contact_heading": "Get In Touch",
  "contact_description": "1-2 sentences inviting contact",
  "cta": "Get Free Estimate",
  "address": "${business.address || ""}",
  "city": "${business.city || ""}",
  "state": "${business.state || ""}",
  "state_display": "${business.state ? \", \" + business.state : \"\"}",
  "city_state": "${[business.city, business.state].filter(Boolean).join(\", \")}",
  "phone": "${business.phone || ""}",
  "phone_raw": "${(business.phone || "").replace(/\D/g, "")}",
  "year": "${new Date().getFullYear()}",
  "accent_color": "#991b1b",
  "footer_tagline": "short footer tagline"
}`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

export async function POST(request: Request) {
  // Allow internal calls (from admin/generate, Claude pipeline) with secret header
  const internalSecret = request.headers.get("x-internal-secret");
  const isInternal = internalSecret === (process.env.INTERNAL_API_SECRET || "exsisto-internal-2026");

  try {
    const body = await request.json();
    const { business_id, template_override, revision_notes } = body;

    if (!business_id) {
      return NextResponse.json({ error: "business_id required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Fetch business
    const { data: business, error: bizErr } = await supabase
      .from("businesses")
      .select("*")
      .eq("id", business_id)
      .single();

    if (bizErr || !business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // Fetch plan from subscriptions (businesses → customers → subscriptions)
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("plan")
      .eq("customer_id", business.customer_id)
      .single();

    const plan: "starter" | "pro" | "premium" =
      ((sub?.plan as string) as "starter" | "pro" | "premium") || "starter";

    console.log(`Generating site for ${business.name} on ${plan} plan`);

    // For revisions, fetch existing tokens
    let existingTokens: Record<string, string> | undefined;
    if (revision_notes) {
      const { data: existingSite } = await supabase
        .from("websites")
        .select("generated_tokens")
        .eq("business_id", business_id)
        .single();
      if (existingSite?.generated_tokens) {
        existingTokens = existingSite.generated_tokens as Record<string, string>;
      }
    }

    const tokens = await generateTokens(business, revision_notes, existingTokens);

    // ── IMAGE STRATEGY ────────────────────────────────────────────────────
    // 1. Check for pre-generated images stored during signup (fastest path)
    // 2. If not found, call getBusinessImages() which:
    //    - Returns library URLs instantly for known industries
    //    - Generates via Nano Banana for "other"/custom industries
    let imageSource = "nano-banana";

    const { data: existingWebsite } = await supabase
      .from("websites")
      .select("stitch_hero_url, stitch_card1_url, hero_image_url, card1_image_url, image_source")
      .eq("business_id", business_id)
      .single();

    // Use pre-stored images if available (set during signup)
    if (existingWebsite?.hero_image_url) {
      tokens.hero_image_url = existingWebsite.hero_image_url;
      if (existingWebsite.card1_image_url) tokens.about_image_url = existingWebsite.card1_image_url;
      imageSource = existingWebsite.image_source || "nano-banana";
      console.log("✓ Using pre-generated images from signup");
    } else if (existingWebsite?.stitch_hero_url) {
      // Legacy: Stitch images stored via admin/generate
      tokens.hero_image_url = existingWebsite.stitch_hero_url;
      if (existingWebsite.stitch_card1_url) tokens.about_image_url = existingWebsite.stitch_card1_url;
      imageSource = "stitch";
      console.log("✓ Using pre-generated Stitch images");
    } else {
      // Generate now: library for known industries, Nano Banana for custom
      console.log(`Generating images for ${business.name} (${business.industry || "other"})...`);
      const images = await getBusinessImages({
        businessId: business_id,
        businessName: business.name,
        businessType: business.name,
        industry: business.industry || "other",
        city: business.city || "",
        plan,
      });
      if (images.hero) tokens.hero_image_url = images.hero;
      if (images.card1) tokens.about_image_url = images.card1;
      console.log(`✓ Images ready (source: ${imageSource})`);
    }

    // ── GENERATE SITE VIA STITCH ──────────────────────────────────────────
    let finalHtml = "";
    let templateName = "stitch";

    try {
      finalHtml = await generateStitchSite({
        businessName: business.name,
        industry: business.industry || business.description || "",
        city: business.city || "",
        state: business.state || "",
        services: (business.services as string[]) || [],
        phone: business.phone || "",
        description: business.description || "",
        yearsInBusiness: (business as any).years_in_business || "",
        differentiator: (business as any).differentiator || "",
        revisionNotes: revision_notes || "",
      });
      console.log("✓ Stitch site generated");
    } catch (stitchErr: any) {
      // Stitch quota or error — fall back to skeleton templates
      console.warn("Stitch failed, falling back to skeleton:", stitchErr.message);
      const templatesToGenerate = template_override ? [template_override] : SKELETONS;
      const htmlResults = await Promise.all(
        templatesToGenerate.map(async (name) => {
          const html = await fetchTemplate(name);
          return { name, html: injectTokens(html, tokens) };
        })
      );
      finalHtml = htmlResults[0].html;
      templateName = htmlResults[0].name;
    }

    const primary = { name: templateName, html: finalHtml };

    let finalTemplateName = primary.name;
    if (revision_notes && !template_override) {
      const { data: existing } = await supabase
        .from("websites").select("template_name").eq("business_id", business_id).single();
      if (existing?.template_name) finalTemplateName = existing.template_name;
    }

    // ── Generate all pages ────────────────────────────────────────────
    const [servicesHtml, aboutHtml, contactHtml, blogIndexHtml] = await Promise.all([
      generateServicesPage(business, tokens),
      generateAboutPage(business, tokens),
      generateContactPage(business, tokens),
      generateBlogIndexPage(business, []),
    ]);

    await supabase.from("websites").upsert({
      business_id,
      status: "ready_for_review",
      custom_html: primary.html,
      services_html: servicesHtml,
      about_html: aboutHtml,
      contact_html: contactHtml,
      blog_index_html: blogIndexHtml,
      template_name: finalTemplateName,
      generated_tokens: tokens,
      generated_at: new Date().toISOString(),
      revision_notes: revision_notes || null,
      revision_requested_at: revision_notes ? new Date().toISOString() : null,
      plan,
      image_source: imageSource,
    }, { onConflict: "business_id" });

    return NextResponse.json({
      success: true,
      plan,
      image_source: imageSource,
      template: primary.name,
      tokens_generated: Object.keys(tokens).length,
      variants: [{ name: primary.name, html: primary.html }],
    });

  } catch (error: any) {
    console.error("Site generation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

