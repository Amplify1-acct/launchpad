import { createAdminClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const maxDuration = 60;

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
    // Claude generates all content
    const contentRes = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      messages: [{ role: "user", content: `Generate website content for this business as JSON only:
Business: ${business.name}
Description: ${business.description}
Location: ${business.city}, ${business.state}
Phone: ${business.phone || ""}

Return ONLY valid JSON, no markdown:
{
  "tagline": "catchy one-liner tagline",
  "services": [{"name":"Service Name","description":"Brief description","icon":"emoji"}],
  "stats": [{"value":"10+","label":"Years Experience"},{"value":"500+","label":"Happy Customers"},{"value":"100%","label":"Satisfaction"},{"value":"24/7","label":"Available"}],
  "testimonials": [{"name":"Customer Name","text":"testimonial","rating":5,"location":"City, ST"}],
  "meta_title": "SEO title under 60 chars",
  "meta_description": "SEO description under 160 chars",
  "keywords": ["keyword1","keyword2","keyword3"],
  "accent_color": "#hexcolor appropriate for this industry",
  "emoji": "single emoji",
  "blog_titles": ["Title 1","Title 2","Title 3"],
  "social_posts": {
    "facebook": ["post1","post2","post3"],
    "instagram": ["post1 #tags","post2 #tags","post3 #tags"],
    "linkedin": ["post1","post2","post3"]
  }
}` }],
    });

    const rawText = contentRes.content[0].type === "text" ? contentRes.content[0].text : "";
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in Claude response");
    const generated = JSON.parse(jsonMatch[0]);

    // Save content to Supabase — status = needs_design (Stitch designs generated separately)
    await supabase.from("websites").upsert({
      business_id,
      status: "needs_design",
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
    }, { onConflict: "business_id" });

    await supabase.from("businesses").update({
      tagline: generated.tagline,
      accent_color: generated.accent_color,
      emoji: generated.emoji,
    }).eq("id", business_id);

    // Blog posts
    await supabase.from("blog_posts").insert(
      generated.blog_titles.map((title: string) => ({
        business_id, title, status: "draft",
        excerpt: `Expert insights from ${business.name}.`,
        word_count: 800, seo_score: Math.floor(Math.random() * 15) + 82,
      }))
    ).catch(() => {});

    // Social posts
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

    return NextResponse.json({ success: true, generated, status: "needs_design" });

  } catch (error: any) {
    console.error("[generate] Error:", error);
    await supabase.from("generation_jobs")
      .update({ status: "failed", error: error.message })
      .eq("business_id", business_id).eq("status", "running");
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
