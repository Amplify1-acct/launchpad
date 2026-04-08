import { NextResponse } from "next/server";
import { generateBusinessPhoto } from "@/lib/nano-banana";
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
async function getPhotoForPost(
  caption: string,
  industry: string,
  businessName: string,
  platform: string
): Promise<string | null> {
  try {
    const platformCtx = platform === "tiktok" ? "vertical portrait" : platform === "instagram" ? "square" : "landscape";
    const prompt = `photorealistic photograph only, no text, no UI, no illustration. Professional ${industry} business photo, ${platformCtx} composition. ${caption.slice(0, 80)}.`;
    const photoUrl = await generateBusinessPhoto(prompt, businessName, "social");
    if (!photoUrl) return null;

    // Download and upload to Supabase Storage so it persists in the shared library
    const imageRes = await fetch(photoUrl);
    const imageBuffer = await imageRes.arrayBuffer();
    const fileName = `${industry}/social/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const uploadRes = await fetch(
      `${supabaseUrl}/storage/v1/object/industry-images/${fileName}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "image/jpeg",
          "x-upsert": "true",
        },
        body: imageBuffer,
      }
    );
    if (uploadRes.ok) {
      return `${supabaseUrl}/storage/v1/object/public/industry-images/${fileName}`;
    }
    return photoUrl; // fallback to temp Nano Banana URL if upload fails
  } catch (e: any) {
    console.error("Social image generation failed (non-fatal):", e.message);
    return null;
  }
}


async function generateAllPosts(
  business: Record<string, any>,
  tokens: Record<string, any> | null,
  perPlatform: number,
  business_id: string
): Promise<{
  facebook: Array<{ caption: string; image_url: string; post_type: string; scheduled_for: string }>;
  instagram: Array<{ caption: string; image_url: string; post_type: string; scheduled_for: string }>;
  tiktok: Array<{ caption: string; image_url: string; post_type: string; scheduled_for: string }>;
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
TikTok style: Professional insight, no emojis, 1-2 hashtags, 3-4 sentences.

Post types to cover: ${postTypes}

Return this exact structure:
{
  "facebook": [{"caption": "...", "post_type": "intro"}, ...],
  "instagram": [{"caption": "...", "post_type": "intro"}, ...],
  "tiktok": [{"caption": "...", "post_type": "intro"}, ...]
}`;

  try {
    const res = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = res.content[0].type === "text" ? res.content[0].text : "{}";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return { facebook: [], instagram: [], tiktok: [] };

    const result = JSON.parse(match[0]);
    const now = new Date();
    const description = business.description || business.industry || "";

    const processPlatform = async (
      posts: Array<{ caption: string; post_type: string }>,
      platform: string,
      offset: number
    ) => {
      const hours: Record<string, number> = { facebook: 10, instagram: 12, tiktok: 19 };
      const timeSeed = Math.floor(Date.now() / 1000);
      return Promise.all((posts || []).slice(0, perPlatform).map(async (p, i) => {
        const scheduledFor = new Date(now);
        scheduledFor.setDate(now.getDate() + 1 + Math.round(i * (30 / perPlatform)));
        scheduledFor.setHours(hours[platform] || 10, 0, 0, 0);
        return {
          caption: p.caption,
          post_type: p.post_type,
          image_url: await generateBusinessPhoto(
            business.name,
            description,
            "social",
            platform as "facebook" | "instagram" | "tiktok",
            business_id,
            timeSeed + i + offset
          ),
          scheduled_for: scheduledFor.toISOString(),
        };
      }));
    };

    const [facebook, instagram, tiktok] = await Promise.all([
      processPlatform(result.facebook || [], "facebook", 0),
      processPlatform(result.instagram || [], "instagram", 100),
      processPlatform(result.tiktok || [], "tiktok", 200),
    ]);
    return { facebook, instagram, tiktok };
  } catch (e) {
    console.error("Error generating posts:", e);
    return { facebook: [], instagram: [], tiktok: [] };
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
    platform: platform as "facebook" | "instagram" | "tiktok",
    caption: p.caption,
    image_url: p.image_url,
    scheduled_for: p.scheduled_for,
    status: "queued" as const,
  });

  if (replace_only && platform_counts) {
    // Selective regeneration — only generate as many posts as were deleted per platform
    const rows: any[] = [];

    for (const platform of ["facebook", "instagram", "tiktok"] as const) {
      const count = platform_counts[platform] || 0;
      if (count === 0) continue;

      // Generate just this platform's posts
      const { facebook: fb, instagram: ig, tiktok: li } = await generateAllPosts(business, tokens, count, business_id);
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

    const { facebook: fb, instagram: ig, tiktok: li } = await generateAllPosts(business, tokens, defaultPerPlatform, business_id);

    const rows = [
      ...fb.map(p => toRow(p, "facebook")),
      ...ig.map(p => toRow(p, "instagram")),
      ...li.map(p => toRow(p, "tiktok")),
    ];

    const { data: inserted, error } = await supabase
      .from("social_posts").insert(rows).select();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      count: inserted?.length || 0,
      breakdown: { facebook: fb.length, instagram: ig.length, tiktok: li.length },
    });
  }
}
