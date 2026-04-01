import { createAdminClient } from "@/lib/supabase-server";
import { generateBusinessPhoto } from "@/lib/nano-banana";
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
  "address": "${business.city || ""}, ${business.state || ""}",
  "city": "${business.city || ""}",
  "state": "${business.state || ""}",
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
    // For Pro/Premium: check if Claude has already stored Stitch image URLs
    // via /api/generate-images (called before this endpoint by the onboarding flow)
    let heroUrl: string | null = null;
    let aboutUrl: string | null = null;
    let imageSource = "pexels";

    if (plan === "pro" || plan === "premium") {
      // Check for pre-stored Stitch images (set by Claude via /api/generate-images)
      const { data: existingWebsite } = await supabase
        .from("websites")
        .select("stitch_hero_url, stitch_card1_url, image_source")
        .eq("business_id", business_id)
        .single();

      if (existingWebsite?.stitch_hero_url) {
        heroUrl = existingWebsite.stitch_hero_url;
        aboutUrl = existingWebsite.stitch_card1_url;
        imageSource = "stitch";
        console.log("✓ Using pre-generated Stitch images");
      } else {
        // Fall back to Pexels if Stitch images not yet generated
        console.log("No Stitch images found, using Pexels fallback...");
        [heroUrl, aboutUrl] = await Promise.all([
          generateBusinessPhoto(business.name, business.description || business.industry || "", "hero", undefined, business_id, 0),
          generateBusinessPhoto(business.name, business.description || business.industry || "", "about", undefined, business_id, 1),
        ]);
      }
    } else {
      // Starter: Pexels
      [heroUrl, aboutUrl] = await Promise.all([
        generateBusinessPhoto(business.name, business.description || business.industry || "", "hero", undefined, business_id, 0),
        generateBusinessPhoto(business.name, business.description || business.industry || "", "about", undefined, business_id, 1),
      ]);
    }

    if (heroUrl) tokens.hero_image_url = heroUrl;
    if (aboutUrl) tokens.about_image_url = aboutUrl;

    // ── GENERATE SITE VIA STITCH ──────────────────────────────────────────
    let finalHtml = "";
    let templateName = "stitch";

    try {
      const { generateStitchSite } = await import("@/lib/stitch");
      finalHtml = await generateStitchSite({
        businessName: business.name,
        industry: business.industry || business.description || "",
        city: business.city || "",
        state: business.state || "",
        services: (business.services as string[]) || [],
        phone: business.phone || "",
        description: business.description || "",
        yearsInBusiness: business.years_in_business || "",
        differentiator: business.differentiator || "",
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

    await supabase.from("websites").upsert({
      business_id,
      status: "ready_for_review",
      custom_html: primary.html,
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
      variants: htmlResults.map(r => ({ name: r.name, html: r.html })),
    });

  } catch (error: any) {
    console.error("Site generation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

