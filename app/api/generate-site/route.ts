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
- Industry: ${business.description || business.industry}
- City: ${business.city || ""}, ${business.state || ""}
- Phone: ${business.phone || ""}
- Email: ${business.email || ""}

Return this JSON:
{
  "business_name": "${business.name}",
  "tagline": "compelling 4-8 word tagline",
  "hero_headline": "powerful hero headline",
  "hero_subtext": "2 sentence value proposition",
  "hero_image_url": "https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg?auto=compress&cs=tinysrgb&w=1200&h=700&fit=crop",
  "about_image_url": "https://images.pexels.com/photos/1545743/pexels-photo-1545743.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
  "about_headline": "about section headline",
  "about_paragraph_1": "2-3 sentences about history and mission",
  "about_paragraph_2": "2-3 sentences about what sets them apart",
  "service_1_name": "first service",
  "service_1_description": "one sentence",
  "service_2_name": "second service",
  "service_2_description": "one sentence",
  "service_3_name": "third service",
  "service_3_description": "one sentence",
  "service_4_name": "fourth service",
  "service_4_description": "one sentence",
  "stat_1_number": "20+",
  "stat_1_label": "Years Experience",
  "stat_2_number": "500+",
  "stat_2_label": "Projects Completed",
  "stat_3_number": "100%",
  "stat_3_label": "Satisfaction Rate",
  "testimonial_1_text": "realistic glowing review",
  "testimonial_1_name": "First Last",
  "testimonial_1_title": "customer role",
  "testimonial_2_text": "realistic glowing review",
  "testimonial_2_name": "First Last",
  "testimonial_2_title": "customer role",
  "testimonial_3_text": "realistic glowing review",
  "testimonial_3_name": "First Last",
  "testimonial_3_title": "customer role",
  "city": "${business.city || ""}",
  "state": "${business.state || ""}",
  "phone": "${business.phone || ""}",
  "email": "${business.email || ""}",
  "accent_color": "#991b1b",
  "cta_text": "Get Free Estimate",
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
  try {
    const body = await request.json();
    const { business_id, template_override, revision_notes } = body;

    if (!business_id) {
      return NextResponse.json({ error: "business_id required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Fetch business + customer plan
    const { data: business, error: bizErr } = await supabase
      .from("businesses")
      .select("*, customers(plan)")
      .eq("id", business_id)
      .single();

    if (bizErr || !business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const plan: "starter" | "pro" | "premium" =
      (business.customers?.plan as any) || "starter";

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

    // ── GENERATE TEMPLATES ────────────────────────────────────────────────
    const templatesToGenerate = template_override ? [template_override] : SKELETONS;

    const htmlResults = await Promise.all(
      templatesToGenerate.map(async (name) => {
        const html = await fetchTemplate(name);
        return { name, html: injectTokens(html, tokens) };
      })
    );

    const primary = htmlResults[0];

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
