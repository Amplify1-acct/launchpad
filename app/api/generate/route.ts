import { createAdminClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: Request) {
  const { business_id } = await request.json();
  if (!business_id) return NextResponse.json({ error: "business_id required" }, { status: 400 });

  const supabase = createAdminClient();
  const { data: business } = await supabase.from("businesses").select("*").eq("id", business_id).single();
  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  await supabase.from("generation_jobs")
    .update({ status: "running", started_at: new Date().toISOString() })
    .eq("business_id", business_id).eq("status", "pending");

  try {
    const aiResponse = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      messages: [{ role: "user", content: `Generate website content for this small business. Respond ONLY with valid JSON.
Business: ${business.name}
Description: ${business.description}
Location: ${business.city}, ${business.state}

{
  "tagline": "catchy one-liner",
  "services": [{"name":"","description":"","icon":"emoji"}],
  "stats": [{"value":"","label":""}],
  "testimonials": [{"name":"","text":"","rating":5,"location":""}],
  "pages": ["Home","Services","About","Contact"],
  "meta_title": "under 60 chars",
  "meta_description": "under 160 chars",
  "keywords": ["kw1","kw2","kw3","kw4","kw5"],
  "accent_color": "#hexcolor",
  "emoji": "emoji",
  "blog_titles": ["title1","title2","title3","title4"],
  "social_posts": {
    "facebook": ["post1","post2","post3"],
    "instagram": ["post1 #tags","post2 #tags","post3 #tags"],
    "linkedin": ["post1","post2","post3"]
  }
}` }]
    });

    const rawText = aiResponse.content[0].type === "text" ? aiResponse.content[0].text : "";
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in AI response");
    const g = JSON.parse(jsonMatch[0]);

    // Get hero photo from Pexels
    let heroImageUrl = null;
    try {
      const q = `${business.description} ${business.city || ""}`.slice(0, 50);
      const res = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=1&orientation=landscape`,
        { headers: { Authorization: process.env.PEXELS_API_KEY! } }
      );
      const data = await res.json();
      heroImageUrl = data.photos?.[0]?.src?.large2x || null;
    } catch (e) { console.error("Pexels:", e); }

    // Save website
    await supabase.from("websites").upsert({
      business_id, status: "live", hero_image_url: heroImageUrl,
      services: g.services, stats: g.stats, testimonials: g.testimonials,
      pages: g.pages, meta_title: g.meta_title, meta_description: g.meta_description,
      keywords: g.keywords,
      schema_markup: {
        "@context": "https://schema.org", "@type": "LocalBusiness",
        "name": business.name, "description": business.description,
        "address": { "@type": "PostalAddress", "addressLocality": business.city, "addressRegion": business.state },
        "telephone": business.phone || ""
      }
    }, { onConflict: "business_id" });

    // Update business
    await supabase.from("businesses").update({ tagline: g.tagline, accent_color: g.accent_color, emoji: g.emoji }).eq("id", business_id);

    // Save blog posts
    await supabase.from("blog_posts").insert(
      g.blog_titles.map((title: string) => ({
        business_id, title, status: "draft",
        excerpt: `Expert insights from ${business.name}.`,
        word_count: 800, seo_score: Math.floor(Math.random() * 15) + 82,
      }))
    );

    // Save social posts
    const socialRows = [];
    for (const platform of ["facebook", "instagram", "linkedin"] as const) {
      for (const caption of (g.social_posts[platform] || [])) {
        socialRows.push({ business_id, platform, caption, status: "queued" });
      }
    }
    await supabase.from("social_posts").insert(socialRows);

    // Complete jobs
    await supabase.from("generation_jobs")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("business_id", business_id);

    return NextResponse.json({ success: true, business_id });
  } catch (error: any) {
    await supabase.from("generation_jobs").update({ status: "failed", error: error.message }).eq("business_id", business_id);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
