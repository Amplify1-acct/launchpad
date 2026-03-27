import { createAdminClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { TEMPLATES, STITCH_PROJECT_ID } from "@/lib/templates";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Stitch helpers ────────────────────────────────────────────────────────

async function stitchEditScreen(
  screenId: string,
  prompt: string
): Promise<string> {
  const res = await fetch(
    `https://stitch.googleapis.com/v1alpha/projects/${STITCH_PROJECT_ID}/screens/${screenId}:edit`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.STITCH_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt, output_format: "HTML" }),
    }
  );
  if (!res.ok) throw new Error(`Stitch edit failed: ${await res.text()}`);
  const data = await res.json();
  return data.html || data.content || "";
}

async function stitchGetScreenCode(screenId: string): Promise<string> {
  const res = await fetch(
    `https://stitch.googleapis.com/v1alpha/projects/${STITCH_PROJECT_ID}/screens/${screenId}/code`,
    {
      headers: { Authorization: `Bearer ${process.env.STITCH_API_KEY}` },
    }
  );
  if (!res.ok) throw new Error(`Stitch fetch failed: ${await res.text()}`);
  const data = await res.json();
  // Handle various response formats
  if (data.html) return data.html;
  if (data.downloadUrl) {
    const r = await fetch(data.downloadUrl);
    return await r.text();
  }
  return "";
}

export async function POST(request: Request) {
  const { business_id } = await request.json();
  if (!business_id)
    return NextResponse.json({ error: "business_id required" }, { status: 400 });

  const supabase = createAdminClient();
  const { data: business } = await supabase
    .from("businesses").select("*").eq("id", business_id).single();
  if (!business)
    return NextResponse.json({ error: "Business not found" }, { status: 404 });

  await supabase
    .from("generation_jobs")
    .update({ status: "running", started_at: new Date().toISOString() })
    .eq("business_id", business_id).eq("status", "pending");

  try {
    // ── Step 1: Claude generates content ──────────────────────────────────
    const contentPrompt = `You are generating content for a small business website.
Business: ${business.name}
Description: ${business.description}
Location: ${business.city}, ${business.state}
Phone: ${business.phone || ""}

Respond ONLY with valid JSON, no markdown:
{
  "tagline": "catchy one-liner tagline",
  "services": [
    {"name": "Service Name", "description": "Brief description", "icon": "emoji"}
  ],
  "stats": [
    {"value": "10+", "label": "Years Experience"},
    {"value": "500+", "label": "Happy Customers"},
    {"value": "100%", "label": "Satisfaction"},
    {"value": "24/7", "label": "Available"}
  ],
  "testimonials": [
    {"name": "Customer Name", "text": "testimonial text", "rating": 5, "location": "City, ST"}
  ],
  "meta_title": "SEO page title under 60 chars",
  "meta_description": "SEO meta description under 160 chars",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "accent_color": "#hexcolor that fits this industry",
  "emoji": "single emoji representing the business",
  "blog_titles": ["Title 1", "Title 2", "Title 3"],
  "social_posts": {
    "facebook": ["Post 1", "Post 2", "Post 3"],
    "instagram": ["Post 1 #hashtags", "Post 2 #hashtags", "Post 3 #hashtags"],
    "linkedin": ["Post 1", "Post 2", "Post 3"]
  }
}`;

    const aiResponse = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      messages: [{ role: "user", content: contentPrompt }],
    });

    const rawText = aiResponse.content[0].type === "text" ? aiResponse.content[0].text : "";
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in AI response");
    const generated = JSON.parse(jsonMatch[0]);

    // ── Step 2: Get chosen template & customize with Stitch ───────────────
    const templateId = business.template_id || "template-a";
    const template = TEMPLATES.find(t => t.id === templateId) || TEMPLATES[0];

    // Build a rich edit prompt with all the real business data
    const stitchPrompt = `Replace ALL placeholder content with this real business data. Change NOTHING about the design, layout, colors, or fonts — only replace text and images.

BUSINESS NAME: ${business.name}
TAGLINE: ${generated.tagline}
DESCRIPTION: ${business.description}
PHONE: ${business.phone || "Call us today"}
LOCATION: ${business.city}, ${business.state}
EMOJI: ${generated.emoji}

SERVICES (replace existing service cards with exactly these):
${generated.services.map((s: any, i: number) => `${i + 1}. ${s.icon} ${s.name}: ${s.description}`).join("\n")}

STATS (replace existing stats):
${generated.stats.map((s: any) => `${s.value} — ${s.label}`).join("\n")}

TESTIMONIALS (replace existing):
${(generated.testimonials || []).slice(0, 3).map((t: any) => `"${t.text}" — ${t.name}, ${t.location || ""}`).join("\n")}

FOOTER: © ${new Date().getFullYear()} ${business.name}. All rights reserved.
Remove any reference to HydroFlow, HydroFlow Pro, or plumbing if this is not a plumbing business.`;

    let siteHtml = "";
    try {
      // Try Stitch edit first
      siteHtml = await stitchEditScreen(template.screenId, stitchPrompt);
    } catch (stitchErr) {
      console.warn("Stitch edit failed, falling back to raw template:", stitchErr);
      // Fall back: get raw template HTML and do text substitution
      siteHtml = await stitchGetScreenCode(template.screenId);
    }

    // If Stitch returned nothing, do manual substitution on the raw template
    if (!siteHtml || siteHtml.length < 1000) {
      siteHtml = await stitchGetScreenCode(template.screenId);
      // Basic substitutions
      siteHtml = siteHtml
        .replace(/HydroFlow Pro/g, business.name)
        .replace(/HydroFlow\./g, business.name + ".")
        .replace(/Precision Engineering for Domestic Order/g, generated.tagline)
        .replace(/1-800-FLOW-PRO/g, business.phone || "Contact Us")
        .replace(/1\.800\.FLOW\.PRO/g, business.phone || "Contact Us")
        .replace(/1800FLOWPRO/g, business.phone?.replace(/\D/g, "") || "")
        .replace(/© 2024/g, `© ${new Date().getFullYear()}`)
        .replace(/Established 1994/g, "");
    }

    // ── Step 3: Get hero image from Pexels ────────────────────────────────
    let heroImageUrl = null;
    try {
      const pexelsRes = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(business.description.slice(0, 50))}&per_page=1&orientation=landscape`,
        { headers: { Authorization: process.env.PEXELS_API_KEY! } }
      );
      const pexelsData = await pexelsRes.json();
      heroImageUrl = pexelsData.photos?.[0]?.src?.large2x || null;
    } catch {}

    // ── Step 4: Save to Supabase ──────────────────────────────────────────
    await supabase.from("websites").upsert({
      business_id,
      status: "generating",
      hero_image_url: heroImageUrl,
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
        address: {
          "@type": "PostalAddress",
          addressLocality: business.city,
          addressRegion: business.state,
        },
      },
      keywords: generated.keywords,
      custom_html: siteHtml, // Store the Stitch-generated HTML
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
    );

    // Social posts
    const socialPosts: any[] = [];
    for (const platform of ["facebook", "instagram", "linkedin"] as const) {
      for (const caption of (generated.social_posts[platform] || [])) {
        socialPosts.push({ business_id, platform, caption, status: "queued" });
      }
    }
    await supabase.from("social_posts").insert(socialPosts);

    await supabase.from("generation_jobs")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("business_id", business_id);

    // Kick off deploy (non-blocking)
    const deployUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://exsisto.ai"}/api/deploy-site`;
    fetch(deployUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ business_id }),
    }).catch(console.error);

    return NextResponse.json({ success: true, generated, template: template.id, deploying: true });

  } catch (error: any) {
    await supabase.from("generation_jobs")
      .update({ status: "failed", error: error.message })
      .eq("business_id", business_id).eq("status", "running");
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
