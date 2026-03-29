import { createAdminClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET || "exsisto-internal-2026";

/**
 * POST /api/admin/generate
 * Full pipeline trigger — called by Claude after generating Stitch images.
 * Looks up customer by email, stores images, triggers site generation.
 */
export async function POST(request: Request) {
  const secret = request.headers.get("x-internal-secret");
  if (secret !== INTERNAL_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { email, hero_url, card1_url, card2_url } = body;

  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

  const supabase = createAdminClient();

  // 1. Find customer by email
  const { data: customer, error: custErr } = await supabase
    .from("customers")
    .select("id, plan, email")
    .eq("email", email)
    .single();

  if (custErr || !customer) {
    return NextResponse.json({ error: "Customer not found", detail: custErr?.message }, { status: 404 });
  }

  // 2. Find their business
  const { data: business, error: bizErr } = await supabase
    .from("businesses")
    .select("id, name")
    .eq("customer_id", customer.id)
    .single();

  if (bizErr || !business) {
    return NextResponse.json({ error: "Business not found", detail: bizErr?.message }, { status: 404 });
  }

  // 3. Store Stitch images
  if (hero_url) {
    await supabase.from("websites").upsert({
      business_id: business.id,
      stitch_hero_url: hero_url,
      stitch_card1_url: card1_url || null,
      stitch_card2_url: card2_url || null,
      image_source: "stitch",
      plan: customer.plan,
    }, { onConflict: "business_id" });
  }

  // 4. Trigger full site generation (reuses generate-site logic inline)
  // Import and call directly to avoid HTTP round-trip auth issues
  const { data: bizFull } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", business.id)
    .single();

  // Generate content with Claude
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const promptText = `Generate website content for ${bizFull?.name || business.name}, a ${bizFull?.description || bizFull?.industry || "small business"} in ${bizFull?.city || ""}, ${bizFull?.state || ""}. Phone: ${bizFull?.phone || ""}. Return ONLY valid JSON:
{"business_name":"${business.name}","tagline":"compelling tagline","hero_headline":"powerful headline","hero_subtext":"2 sentence value prop","about_headline":"about headline","about_paragraph_1":"history and mission","about_paragraph_2":"what sets them apart","service_1_name":"service","service_1_description":"one sentence","service_2_name":"service","service_2_description":"one sentence","service_3_name":"service","service_3_description":"one sentence","service_4_name":"service","service_4_description":"one sentence","stat_1_number":"20+","stat_1_label":"Years Experience","stat_2_number":"500+","stat_2_label":"Projects Completed","stat_3_number":"100%","stat_3_label":"Satisfaction Rate","testimonial_1_text":"review","testimonial_1_name":"Name","testimonial_1_title":"title","testimonial_2_text":"review","testimonial_2_name":"Name","testimonial_2_title":"title","testimonial_3_text":"review","testimonial_3_name":"Name","testimonial_3_title":"title","city":"${bizFull?.city || ""}","phone":"${bizFull?.phone || ""}","email":"${bizFull?.email || ""}","accent_color":"#991b1b","cta_text":"Get Free Estimate","footer_tagline":"tagline"}`;

  const aiRes = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 2000,
    messages: [{ role: "user", content: promptText }],
  });

  const rawText = aiRes.content[0].type === "text" ? aiRes.content[0].text : "{}";
  const tokens = JSON.parse(rawText.replace(/```json|```/g, "").trim()) as Record<string, string>;

  // Inject Stitch image URLs into tokens
  if (hero_url) tokens.hero_image_url = hero_url;
  if (card1_url) tokens.about_image_url = card1_url;
  if (card1_url) tokens.gallery_image_1 = card1_url;
  if (card2_url) tokens.gallery_image_2 = card2_url;

  // Fetch and inject into template
  const templateUrl = "https://raw.githubusercontent.com/Amplify1-acct/launchpad/main/templates/skeleton-bold.html";
  const templateRes = await fetch(templateUrl, { cache: "no-store" });
  let html = await templateRes.text();

  for (const [key, value] of Object.entries(tokens)) {
    html = html.replace(new RegExp(`{{${key}}}`, "g"), value || "");
  }
  html = html.replace(/{{[a-z_]+}}/g, "");

  // Save to DB
  await supabase.from("websites").upsert({
    business_id: business.id,
    status: "ready_for_review",
    custom_html: html,
    template_name: "skeleton-bold",
    generated_tokens: tokens,
    generated_at: new Date().toISOString(),
    plan: customer.plan,
    image_source: hero_url ? "stitch" : "pexels",
    stitch_hero_url: hero_url || null,
    stitch_card1_url: card1_url || null,
    stitch_card2_url: card2_url || null,
  }, { onConflict: "business_id" });

  return NextResponse.json({
    success: true,
    customer: { email: customer.email, plan: customer.plan },
    business: { id: business.id, name: business.name },
    image_source: hero_url ? "stitch" : "pexels",
    tokens_generated: Object.keys(tokens).length,
  });
}
