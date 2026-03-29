import { createAdminClient } from "@/lib/supabase-server";
import { generateBusinessPhoto } from "@/lib/nano-banana";
import { generateStitchImages, injectStitchImages } from "@/lib/stitch-images";
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
    ? `You are updating a website for a small business. The customer has seen their site and wants specific changes. Return ONLY valid JSON — no markdown, no backticks, no explanation.

Business: ${business.name} (${business.description || business.industry})
Location: ${business.city || ""}, ${business.state || ""}

CUSTOMER FEEDBACK:
"${revisionNotes}"

CRITICAL RULES:
1. Start with the EXISTING tokens below and return them as-is
2. ONLY modify the fields that are directly related to what the customer asked for
3. Do NOT change colors, images, services, or any other content unless the customer specifically mentioned it
4. If they said "change the headline" — only change hero_headline, hero_line_1, hero_line_2, hero_highlight, hero_headline_italic
5. If they said "rewrite the about section" — only change about_headline, about_paragraph_1, about_paragraph_2
6. If they said "change the color" — only change accent_color
7. Everything else stays exactly the same

EXISTING TOKENS (copy these and only modify what the customer asked to change):
${JSON.stringify(existingTokens, null, 2)}

Return the complete JSON with your targeted changes applied.`
    : `You are generating website content for a small business. Return ONLY valid JSON — no markdown, no backticks, no explanation.

Business:
- Name: ${business.name}
- Industry/Description: ${business.description || business.industry}
- City: ${business.city || ""}, ${business.state || ""}
- Phone: ${business.phone || ""}
- Email: ${business.email || ""}

Generate specific, realistic content for THIS business. Not generic. Not placeholder.

Return this exact JSON structure:
{
  "business_name": "exact business name",
  "tagline": "compelling 4-8 word tagline specific to this business",
  "hero_headline": "powerful headline for hero section",
  "hero_subtext": "2 sentence description of what makes this business special",
  "hero_image_url": "https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg?auto=compress&cs=tinysrgb&w=1200&h=700&fit=crop",
  "about_image_url": "https://images.pexels.com/photos/1545743/pexels-photo-1545743.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
  "about_headline": "headline for about section",
  "about_paragraph_1": "2-3 sentences about the business history and mission",
  "about_paragraph_2": "2-3 sentences about what sets them apart",
  "service_1_name": "first service name",
  "service_1_description": "one sentence description",
  "service_2_name": "second service name",
  "service_2_description": "one sentence description",
  "service_3_name": "third service name",
  "service_3_description": "one sentence description",
  "service_4_name": "fourth service name",
  "service_4_description": "one sentence description",
  "stat_1_number": "20+",
  "stat_1_label": "Years Experience",
  "stat_2_number": "500+",
  "stat_2_label": "Projects Completed",
  "stat_3_number": "100%",
  "stat_3_label": "Satisfaction Rate",
  "testimonial_1_text": "realistic glowing review",
  "testimonial_1_name": "First Last",
  "testimonial_1_title": "Customer type",
  "testimonial_2_text": "realistic glowing review",
  "testimonial_2_name": "First Last",
  "testimonial_2_title": "Customer type",
  "testimonial_3_text": "realistic glowing review",
  "testimonial_3_name": "First Last",
  "testimonial_3_title": "Customer type",
  "city": "${business.city || ""}",
  "state": "${business.state || ""}",
  "phone": "${business.phone || ""}",
  "email": "${business.email || ""}",
  "accent_color": "#991b1b",
  "cta_text": "Get Free Estimate",
  "footer_tagline": "short tagline for footer"
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

    // Fetch business + customer plan in one go
    const { data: business, error: bizErr } = await supabase
      .from("businesses")
      .select("*, customers(plan)")
      .eq("id", business_id)
      .single();

    if (bizErr || !business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // Determine plan — default to starter
    const plan: "starter" | "pro" | "premium" =
      (business.customers?.plan as "starter" | "pro" | "premium") || "starter";

    console.log(`Generating site for ${business.name} on ${plan} plan`);

    // Fetch existing tokens for revisions
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

    // Generate content tokens (same for all plans)
    const tokens = await generateTokens(business, revision_notes, existingTokens);

    // ── IMAGE STRATEGY BY PLAN ─────────────────────────────────────────────
    let stitchImages = null;
    let heroUrl: string | null = null;
    let aboutUrl: string | null = null;

    if (plan === "pro" || plan === "premium") {
      // Pro + Premium: Try Stitch AI image generation
      console.log(`Generating Stitch AI images for ${plan} plan...`);
      stitchImages = await generateStitchImages(
        business.name,
        business.description || business.industry || "business",
        business.city || ""
      );

      if (stitchImages) {
        heroUrl = stitchImages.hero;
        aboutUrl = stitchImages.card1;
        console.log("✓ Stitch images generated");
      } else {
        // Fallback to Pexels if Stitch fails
        console.log("Stitch unavailable, falling back to Pexels...");
        [heroUrl, aboutUrl] = await Promise.all([
          generateBusinessPhoto(business.name, business.description || business.industry || "", "hero", undefined, business_id, 0),
          generateBusinessPhoto(business.name, business.description || business.industry || "", "about", undefined, business_id, 1),
        ]);
      }
    } else {
      // Starter: Pexels only
      console.log("Starter plan — using Pexels...");
      [heroUrl, aboutUrl] = await Promise.all([
        generateBusinessPhoto(business.name, business.description || business.industry || "", "hero", undefined, business_id, 0),
        generateBusinessPhoto(business.name, business.description || business.industry || "", "about", undefined, business_id, 1),
      ]);
    }

    // Inject image URLs into tokens
    if (heroUrl) tokens.hero_image_url = heroUrl;
    if (aboutUrl) tokens.about_image_url = aboutUrl;

    // ── TEMPLATE GENERATION ────────────────────────────────────────────────
    const templatesToGenerate = template_override ? [template_override] : SKELETONS;

    const htmlResults = await Promise.all(
      templatesToGenerate.map(async (name) => {
        const html = await fetchTemplate(name);
        let injected = injectTokens(html, tokens);
        // For Pro+, also inject Stitch gallery images if available
        if (stitchImages) {
          injected = injectStitchImages(injected, stitchImages);
        }
        return { name, html: injected };
      })
    );

    const primary = htmlResults[0];

    // Keep existing template name on revisions
    let finalTemplateName = primary.name;
    if (revision_notes && !template_override) {
      const { data: existing } = await supabase
        .from("websites").select("template_name").eq("business_id", business_id).single();
      if (existing?.template_name) finalTemplateName = existing.template_name;
    }

    // Save to DB — including plan and stitch image URLs
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
      stitch_hero_url: stitchImages?.hero || null,
      stitch_card1_url: stitchImages?.card1 || null,
      stitch_card2_url: stitchImages?.card2 || null,
      image_source: stitchImages ? "stitch" : "pexels",
    }, { onConflict: "business_id" });

    return NextResponse.json({
      success: true,
      plan,
      image_source: stitchImages ? "stitch" : "pexels",
      template: primary.name,
      tokens_generated: Object.keys(tokens).length,
      variants: htmlResults.map(r => ({ name: r.name, html: r.html })),
    });

  } catch (error: any) {
    console.error("Site generation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
