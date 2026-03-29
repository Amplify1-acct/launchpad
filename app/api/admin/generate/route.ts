import { createAdminClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET || "exsisto-internal-2026";
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const maxDuration = 90;

export async function POST(request: Request) {
  const secret = request.headers.get("x-internal-secret");
  if (secret !== INTERNAL_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
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
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // 2. Find their business
    const { data: business, error: bizErr } = await supabase
      .from("businesses")
      .select("*")
      .eq("customer_id", customer.id)
      .single();

    if (bizErr || !business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // 3. Store Stitch image URLs
    await supabase.from("websites").upsert({
      business_id: business.id,
      stitch_hero_url: hero_url || null,
      stitch_card1_url: card1_url || null,
      stitch_card2_url: card2_url || null,
      image_source: hero_url ? "stitch" : "pexels",
      plan: customer.plan,
    }, { onConflict: "business_id" });

    // 4. Generate content tokens with Claude
    const prompt = `Generate website content for ${business.name}, a ${business.description || business.industry || "small business"} in ${business.city || ""}, ${business.state || ""}. Phone: ${business.phone || ""}. Return ONLY valid JSON with these exact keys:
{"business_name":"value","tagline":"compelling 4-8 word tagline","hero_headline":"powerful headline","hero_subtext":"2 sentence value proposition","about_headline":"about section headline","about_paragraph_1":"2-3 sentences about history","about_paragraph_2":"2-3 sentences differentiators","service_1_name":"service","service_1_description":"one sentence","service_2_name":"service","service_2_description":"one sentence","service_3_name":"service","service_3_description":"one sentence","service_4_name":"service","service_4_description":"one sentence","stat_1_number":"20+","stat_1_label":"Years Experience","stat_2_number":"500+","stat_2_label":"Completed","stat_3_number":"100%","stat_3_label":"Satisfaction","testimonial_1_text":"review","testimonial_1_name":"Name","testimonial_1_title":"Title","testimonial_2_text":"review","testimonial_2_name":"Name","testimonial_2_title":"Title","testimonial_3_text":"review","testimonial_3_name":"Name","testimonial_3_title":"Title","city":"${business.city || ""}","phone":"${business.phone || ""}","email":"${business.email || ""}","accent_color":"#991b1b","cta_text":"Get Free Estimate","footer_tagline":"short tagline"}`;

    const aiRes = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const rawText = aiRes.content[0].type === "text" ? aiRes.content[0].text : "{}";
    const tokens = JSON.parse(rawText.replace(/```json|```/g, "").trim()) as Record<string, string>;

    // Inject Stitch image URLs
    if (hero_url) tokens.hero_image_url = hero_url;
    if (card1_url) { tokens.about_image_url = card1_url; tokens.gallery_image_1 = card1_url; }
    if (card2_url) tokens.gallery_image_2 = card2_url;

    // 5. Fetch template and inject tokens
    const templateUrl = "https://raw.githubusercontent.com/Amplify1-acct/launchpad/main/templates/skeleton-bold.html";
    const templateRes = await fetch(templateUrl, { cache: "no-store" });
    let html = await templateRes.text();

    for (const [key, value] of Object.entries(tokens)) {
      html = html.replace(new RegExp(`{{${key}}}`, "g"), value || "");
    }
    html = html.replace(/{{[a-z_]+}}/g, "");

    // 6. Save to DB
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

  } catch (error: any) {
    console.error("Admin generate error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
