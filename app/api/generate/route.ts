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
    const prompt = `You are generating content for a small business website.
Business: ${business.name}
Description: ${business.description}
Location: ${business.city}, ${business.state}

Respond ONLY with valid JSON, no markdown or extra text:
{
  "tagline": "catchy one-liner tagline",
  "services": [
    {"name": "Service Name", "description": "Brief description", "icon": "emoji"}
  ],
  "stats": [
    {"value": "10+", "label": "Years Experience"},
    {"value": "500+", "label": "Happy Customers"},
    {"value": "100%", "label": "Satisfaction"},
    {"value": "24hr", "label": "Response Time"}
  ],
  "testimonials": [
    {"name": "Customer Name", "text": "Testimonial text", "rating": 5, "location": "City, ST"},
    {"name": "Customer Name", "text": "Testimonial text", "rating": 5, "location": "City, ST"},
    {"name": "Customer Name", "text": "Testimonial text", "rating": 5, "location": "City, ST"}
  ],
  "pages": ["Home", "Services", "About", "Testimonials", "Contact"],
  "meta_title": "SEO page title under 60 chars",
  "meta_description": "SEO meta description under 160 chars",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "accent_color": "#hexcolor",
  "emoji": "emoji that represents the business",
  "blog_titles": ["Title 1", "Title 2", "Title 3", "Title 4"],
  "social_posts": {
    "facebook": ["Post 1", "Post 2", "Post 3"],
    "instagram": ["Post 1 #hashtags", "Post 2 #hashtags", "Post 3 #hashtags"],
    "linkedin": ["Professional post 1", "Professional post 2", "Professional post 3"]
  }
}`;

    const aiResponse = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }]
    });

    const rawText = aiResponse.content[0].type === "text" ? aiResponse.content[0].text : "";
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in AI response");
    const generated = JSON.parse(jsonMatch[0]);

    // Get Pexels photo
    let heroImageUrl = null;
    try {
      const pexelsRes = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(business.description.slice(0, 50))}&per_page=1&orientation=landscape`,
        { headers: { Authorization: process.env.PEXELS_API_KEY! } }
      );
      const pexelsData = await pexelsRes.json();
      heroImageUrl = pexelsData.photos?.[0]?.src?.large2x || null;
    } catch (e) { console.error("Pexels error:", e); }

    // Save website
    await supabase.from("websites").upsert({
      business_id,
      status: "live",
      hero_image_url: heroImageUrl,
      services: generated.services,
      stats: generated.stats,
      testimonials: generated.testimonials,
      pages: generated.pages,
      meta_title: generated.meta_title,
      meta_description: generated.meta_description,
      schema_markup: {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": business.name,
        "description": business.description,
        "address": { "@type": "PostalAddress", "addressLocality": business.city, "addressRegion": business.state },
      },
      keywords: generated.keywords,
    }, { onConflict: "business_id" });

    // Update business
    await supabase.from("businesses").update({
      tagline: generated.tagline,
      accent_color: generated.accent_color,
      emoji: generated.emoji,
    }).eq("id", business_id);

    // Save blog posts
    await supabase.from("blog_posts").insert(
      generated.blog_titles.map((title: string) => ({
        business_id, title, status: "draft",
        excerpt: `Expert insights from ${business.name}.`,
        word_count: 800, seo_score: Math.floor(Math.random() * 15) + 82,
      }))
    );

    // Save social posts
    const socialPosts: any[] = [];
    for (const platform of ["facebook", "instagram", "linkedin"] as const) {
      for (const caption of (generated.social_posts[platform] || [])) {
        socialPosts.push({ business_id, platform, caption, status: "queued" });
      }
    }
    await supabase.from("social_posts").insert(socialPosts);

    // Mark jobs complete
    await supabase.from("generation_jobs")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("business_id", business_id);

    return NextResponse.json({ success: true, generated });

  } catch (error: any) {
    await supabase.from("generation_jobs")
      .update({ status: "failed", error: error.message })
      .eq("business_id", business_id).eq("status", "running");
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
