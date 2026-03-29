import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase-server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const maxDuration = 120;

// Post types spread across 30 days — varied so the feed feels human
const POST_TYPES = [
  { type: "intro", prompt: "Introduce the business and what makes it special. Warm, welcoming." },
  { type: "service_spotlight", prompt: "Spotlight one specific service. Explain the value it delivers to customers." },
  { type: "behind_the_scenes", prompt: "Give a glimpse into a typical day, job, or process. Personal and real." },
  { type: "tip", prompt: "Share a useful tip or piece of advice related to their industry. Educational." },
  { type: "local", prompt: "Connect to the local community — mention the city, neighborhoods, or local pride." },
  { type: "faq", prompt: "Answer a common question customers ask about this type of business." },
  { type: "results", prompt: "Paint a picture of the outcomes and transformation customers experience." },
  { type: "service_spotlight", prompt: "Spotlight a different service from before. Different angle." },
  { type: "trust", prompt: "Build trust — mention experience, credentials, or commitment to quality." },
  { type: "cta", prompt: "Warm call to action — invite people to reach out. Not pushy, just welcoming." },
];

// Curated Unsplash photo IDs by industry — direct URLs, always work
const PHOTO_LIBRARY: Record<string, string[]> = {
  auto: [
    "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1567808291548-fc3ee04dbcf0?w=800&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1580274455191-1c62238fa333?w=800&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&h=600&fit=crop&auto=format",
  ],
  restaurant: [
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop&auto=format",
  ],
  fitness: [
    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=800&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?w=800&h=600&fit=crop&auto=format",
  ],
  plumbing: [
    "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=800&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&h=600&fit=crop&auto=format",
  ],
  dental: [
    "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=800&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=800&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1588776814546-1ffedfd9b8ea?w=800&h=600&fit=crop&auto=format",
  ],
  law: [
    "https://images.unsplash.com/photo-1589994965851-a8f479c573a9?w=800&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1505664194779-8beaceb93744?w=800&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=800&h=600&fit=crop&auto=format",
  ],
  realestate: [
    "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop&auto=format",
  ],
  landscaping: [
    "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1558904541-efa843a96f01?w=800&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=800&h=600&fit=crop&auto=format",
  ],
  financial: [
    "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=600&fit=crop&auto=format",
  ],
  default: [
    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&h=600&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=600&fit=crop&auto=format",
  ],
};

function getPhotoUrl(description: string, index: number): string {
  const lower = description.toLowerCase();
  let photos = PHOTO_LIBRARY.default;

  if (lower.includes("auto") || lower.includes("car") || lower.includes("vehicle") || lower.includes("restoration")) {
    photos = PHOTO_LIBRARY.auto;
  } else if (lower.includes("restaurant") || lower.includes("food") || lower.includes("cafe") || lower.includes("dining")) {
    photos = PHOTO_LIBRARY.restaurant;
  } else if (lower.includes("gym") || lower.includes("fitness") || lower.includes("trainer") || lower.includes("workout")) {
    photos = PHOTO_LIBRARY.fitness;
  } else if (lower.includes("plumb") || lower.includes("pipe") || lower.includes("drain") || lower.includes("hvac")) {
    photos = PHOTO_LIBRARY.plumbing;
  } else if (lower.includes("dental") || lower.includes("dentist") || lower.includes("medical")) {
    photos = PHOTO_LIBRARY.dental;
  } else if (lower.includes("law") || lower.includes("attorney") || lower.includes("legal")) {
    photos = PHOTO_LIBRARY.law;
  } else if (lower.includes("real estate") || lower.includes("realtor") || lower.includes("property")) {
    photos = PHOTO_LIBRARY.realestate;
  } else if (lower.includes("landscap") || lower.includes("lawn") || lower.includes("garden")) {
    photos = PHOTO_LIBRARY.landscaping;
  } else if (lower.includes("financ") || lower.includes("account") || lower.includes("tax") || lower.includes("wealth")) {
    photos = PHOTO_LIBRARY.financial;
  }

  return photos[index % photos.length];
}

async function generateAllPosts(
  business: Record<string, any>,
  tokens: Record<string, any> | null,
  perPlatform: number
): Promise<{
  facebook: Array<{ caption: string; image_url: string; post_type: string; scheduled_for: string }>;
  instagram: Array<{ caption: string; image_url: string; post_type: string; scheduled_for: string }>;
  linkedin: Array<{ caption: string; image_url: string; post_type: string; scheduled_for: string }>;
}> {
  const brandContext = tokens ? `Brand context from their website:
- Headline: ${tokens.hero_headline || tokens.hero_line_1 || ""}
- Services: ${tokens.service_1_name}, ${tokens.service_2_name}, ${tokens.service_3_name}
- Trust signals: ${tokens.trust_1}, ${tokens.trust_2}
- About: ${(tokens.about_paragraph_1 || "").slice(0, 120)}` : "";

  const postTypes = POST_TYPES.slice(0, perPlatform).map(pt => pt.type).join(", ");

  const prompt = `Write social media posts for this business. Return ONLY valid JSON, no markdown.

Business: ${business.name}
Industry: ${business.description || business.industry}
Location: ${business.city}, ${business.state}
Phone: ${business.phone || ""}
${brandContext}

Write ${perPlatform} posts for EACH platform. Make them specific to this business, not generic.

Facebook style: Conversational, 2-3 sentences, 2-3 hashtags, question to spark engagement.
Instagram style: Hook first line, visual language, 4-5 hashtags, 1-2 emojis.
LinkedIn style: Professional insight, no emojis, 1-2 hashtags, 3-4 sentences.

Post types to cover: ${postTypes}

Return this exact structure:
{
  "facebook": [{"caption": "...", "post_type": "intro"}, ...],
  "instagram": [{"caption": "...", "post_type": "intro"}, ...],
  "linkedin": [{"caption": "...", "post_type": "intro"}, ...]
}`;

  try {
    const res = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = res.content[0].type === "text" ? res.content[0].text : "{}";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return { facebook: [], instagram: [], linkedin: [] };

    const result = JSON.parse(match[0]);
    const now = new Date();
    const description = business.description || business.industry || "";

    const processPlatform = (
      posts: Array<{ caption: string; post_type: string }>,
      platform: string,
      offset: number
    ) => {
      const hours: Record<string, number> = { facebook: 10, instagram: 12, linkedin: 8 };
      // Use time-based seed so regenerated posts always get fresh photos
      const timeSeed = Math.floor(Date.now() / 1000);
      return (posts || []).slice(0, perPlatform).map((p, i) => {
        const scheduledFor = new Date(now);
        scheduledFor.setDate(now.getDate() + 1 + Math.round(i * (30 / perPlatform)));
        scheduledFor.setHours(hours[platform] + (i % 2), 0, 0, 0);
        return {
          caption: p.caption,
          post_type: p.post_type,
          image_url: getPhotoUrl(description, timeSeed + i + offset),
          scheduled_for: scheduledFor.toISOString(),
        };
      });
    };

    return {
      facebook: processPlatform(result.facebook || [], "facebook", 0),
      instagram: processPlatform(result.instagram || [], "instagram", 100),
      linkedin: processPlatform(result.linkedin || [], "linkedin", 200),
    };
  } catch (e) {
    console.error("Error generating posts:", e);
    return { facebook: [], instagram: [], linkedin: [] };
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const { business_id, replace_only, platform_counts } = body;

  if (!business_id) {
    return NextResponse.json({ error: "business_id required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: business } = await supabase
    .from("businesses").select("*").eq("id", business_id).single();
  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  const { data: website } = await supabase
    .from("websites").select("generated_tokens, template_name").eq("business_id", business_id).single();
  const tokens = website?.generated_tokens || null;

  const { data: subscription } = await supabase
    .from("subscriptions").select("plan").eq("customer_id", business.customer_id).single();
  const plan = subscription?.plan || "starter";
  const totalPosts = plan === "premium" ? 18 : plan === "growth" ? 12 : 9;
  const defaultPerPlatform = Math.floor(totalPosts / 3);

  const toRow = (p: { caption: string; image_url: string; post_type: string; scheduled_for: string }, platform: string) => ({
    business_id,
    platform: platform as "facebook" | "instagram" | "linkedin",
    caption: p.caption,
    image_url: p.image_url,
    scheduled_for: p.scheduled_for,
    status: "queued" as const,
  });

  if (replace_only && platform_counts) {
    // Selective regeneration — only generate as many posts as were deleted per platform
    const rows: any[] = [];

    for (const platform of ["facebook", "instagram", "linkedin"] as const) {
      const count = platform_counts[platform] || 0;
      if (count === 0) continue;

      // Generate just this platform's posts
      const { facebook: fb, instagram: ig, linkedin: li } = await generateAllPosts(business, tokens, count);
      const platformPosts = platform === "facebook" ? fb : platform === "instagram" ? ig : li;
      rows.push(...platformPosts.map(p => toRow(p, platform)));
    }

    if (rows.length === 0) {
      return NextResponse.json({ success: true, count: 0 });
    }

    const { data: inserted, error } = await supabase
      .from("social_posts").insert(rows).select();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      count: inserted?.length || 0,
      replace_only: true,
    });

  } else {
    // Full regeneration — clear all queued posts and regenerate everything
    await supabase
      .from("social_posts").delete()
      .eq("business_id", business_id).eq("status", "queued");

    const { facebook: fb, instagram: ig, linkedin: li } = await generateAllPosts(business, tokens, defaultPerPlatform);

    const rows = [
      ...fb.map(p => toRow(p, "facebook")),
      ...ig.map(p => toRow(p, "instagram")),
      ...li.map(p => toRow(p, "linkedin")),
    ];

    const { data: inserted, error } = await supabase
      .from("social_posts").insert(rows).select();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      count: inserted?.length || 0,
      breakdown: { facebook: fb.length, instagram: ig.length, linkedin: li.length },
    });
  }
}
