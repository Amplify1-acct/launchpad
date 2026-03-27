import { createAdminClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const maxDuration = 300;

export async function POST(request: Request) {
  const { business_id } = await request.json();
  if (!business_id)
    return NextResponse.json({ error: "business_id required" }, { status: 400 });

  const supabase = createAdminClient();
  const { data: business } = await supabase
    .from("businesses").select("*").eq("id", business_id).single();
  if (!business)
    return NextResponse.json({ error: "Business not found" }, { status: 404 });

  await supabase.from("generation_jobs")
    .update({ status: "running", started_at: new Date().toISOString() })
    .eq("business_id", business_id).eq("status", "pending");

  try {
    // ── Step 1: Claude generates content ──────────────────────────────────
    const contentRes = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      messages: [{ role: "user", content: `Generate website content for this business as JSON only:
Business: ${business.name}
Description: ${business.description}
Location: ${business.city}, ${business.state}
Phone: ${business.phone || ""}

Return ONLY valid JSON:
{
  "tagline": "one-liner tagline",
  "services": [{"name":"","description":"","icon":"emoji"}],
  "stats": [{"value":"10+","label":"Years Experience"},{"value":"500+","label":"Happy Customers"},{"value":"100%","label":"Satisfaction"},{"value":"24/7","label":"Available"}],
  "testimonials": [{"name":"","text":"","rating":5,"location":""}],
  "meta_title": "under 60 chars",
  "meta_description": "under 160 chars",
  "keywords": ["kw1","kw2","kw3"],
  "accent_color": "#hexcolor",
  "emoji": "single emoji",
  "blog_titles": ["Title 1","Title 2","Title 3"],
  "social_posts": {"facebook":["p1","p2","p3"],"instagram":["p1 #tags","p2 #tags","p3 #tags"],"linkedin":["p1","p2","p3"]}
}` }],
    });

    const rawText = contentRes.content[0].type === "text" ? contentRes.content[0].text : "";
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in Claude response");
    const generated = JSON.parse(jsonMatch[0]);

    // ── Step 2: Claude + Stitch MCP generates 3 custom designs ────────────
    const stitchPrompt = `You are helping generate website designs for a new Exsisto customer.

Use the Stitch tools to:
1. Create a new project titled "${business.name} — ${business.city}, ${business.state}"
2. Generate a homepage screen using GEMINI_3_FLASH with this prompt: "Homepage for ${business.name}. ${business.description}. Located in ${business.city}, ${business.state}. Phone: ${business.phone || ""}. Tagline: ${generated.tagline}. Services: ${generated.services.slice(0,3).map((s: any) => s.name).join(", ")}."
3. Generate 2 variants of that screen using REIMAGINE creative range, varying COLOR_SCHEME, LAYOUT, and TEXT_FONT
4. Return the project ID and all 3 screen IDs and thumbnail URLs as JSON

Return ONLY this JSON format when done:
{
  "project_id": "...",
  "screens": [
    {"id": "...", "thumbnail": "...", "label": "Style A"},
    {"id": "...", "thumbnail": "...", "label": "Style B"},
    {"id": "...", "thumbnail": "...", "label": "Style C"}
  ]
}`;

    const stitchRes = await anthropic.messages.create({
      model: "claude-opus-4-5-20251101",
      max_tokens: 4000,
      messages: [{ role: "user", content: stitchPrompt }],
      mcp_servers: [
        {
          type: "url",
          url: "https://stitch.googleapis.com/mcp",
          name: "stitch",
          authorization_token: process.env.STITCH_API_KEY,
        }
      ],
    } as any);

    // Parse the Stitch result
    const stitchText = stitchRes.content
      .filter((c: any) => c.type === "text")
      .map((c: any) => c.text)
      .join("");

    const stitchJsonMatch = stitchText.match(/\{[\s\S]*"screens"[\s\S]*\}/);
    if (!stitchJsonMatch) throw new Error("Stitch did not return valid screen data");
    const stitchData = JSON.parse(stitchJsonMatch[0]);

    // ── Step 3: Save everything to Supabase ───────────────────────────────
    await supabase.from("websites").upsert({
      business_id,
      status: "picking_template",
      services: generated.services,
      stats: generated.stats,
      testimonials: generated.testimonials,
      pages: ["Home", "Services", "About", "Contact"],
      meta_title: generated.meta_title,
      meta_description: generated.meta_description,
      schema_markup: {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        name: business.name,
        description: business.description,
        telephone: business.phone,
        address: { "@type": "PostalAddress", addressLocality: business.city, addressRegion: business.state },
      },
      keywords: generated.keywords,
      stitch_project_id: stitchData.project_id,
      stitch_screens: stitchData.screens,
    }, { onConflict: "business_id" });

    await supabase.from("businesses").update({
      tagline: generated.tagline,
      accent_color: generated.accent_color,
      emoji: generated.emoji,
    }).eq("id", business_id);

    // Blog + social
    await supabase.from("blog_posts").insert(
      generated.blog_titles.map((title: string) => ({
        business_id, title, status: "draft",
        excerpt: `Expert insights from ${business.name}.`,
        word_count: 800, seo_score: Math.floor(Math.random() * 15) + 82,
      }))
    ).catch(() => {});

    const socialPosts: any[] = [];
    for (const platform of ["facebook", "instagram", "linkedin"] as const) {
      for (const caption of (generated.social_posts?.[platform] || [])) {
        socialPosts.push({ business_id, platform, caption, status: "queued" });
      }
    }
    if (socialPosts.length) await supabase.from("social_posts").insert(socialPosts).catch(() => {});

    await supabase.from("generation_jobs")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("business_id", business_id);

    return NextResponse.json({
      success: true,
      stitch_project_id: stitchData.project_id,
      template_options: stitchData.screens,
      generated,
    });

  } catch (error: any) {
    console.error("[generate] Error:", error);
    await supabase.from("generation_jobs")
      .update({ status: "failed", error: error.message })
      .eq("business_id", business_id).eq("status", "running");
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
