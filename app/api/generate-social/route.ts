import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase-server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const POSTS_PER_PLAN: Record<string, number> = {
  starter: 8,
  growth: 16,
  pro: 24,
};

const POST_TYPES = [
  "educational tip specific to their industry",
  "service highlight — pick one service and describe the value",
  "local community connection — mention their city and area",
  "results-focused — what outcomes clients can expect",
  "behind the scenes — what a typical job or day looks like",
  "FAQ answer — answer a common question clients ask",
  "seasonal or timely — relevant to current month",
  "call to action — direct but not pushy",
];

async function generatePostsForPlatform(
  platform: "facebook" | "instagram" | "linkedin",
  business: { name: string; industry: string; city: string; state: string; description: string; phone?: string },
  count: number
): Promise<Array<{ caption: string; scheduled_for: string }>> {

  const platformGuide = {
    facebook: "Conversational, 2-4 sentences, can include a question to spark comments, 2-3 relevant hashtags at the end.",
    instagram: "Punchy opening line, visual language, 3-5 relevant hashtags, emojis used sparingly.",
    linkedin: "Professional and insight-led, position the business as an expert, 1-2 hashtags max, no emojis.",
  }[platform];

  const postTypeList = POST_TYPES.slice(0, count).join(", ");

  const prompt = `Write exactly ${count} ${platform} posts for a small business. Each should be genuine, specific, and varied.

Business: ${business.name}
Industry: ${business.industry}
Location: ${business.city}, ${business.state}
About: ${business.description}

Platform style: ${platformGuide}

Cover these post types (one each): ${postTypeList}

Rules:
- Never fabricate testimonials or client quotes
- Avoid unverifiable superlatives ("best in the city", "guaranteed")
- Specific to ${business.name} and ${business.industry} — not generic
- Sound human, not like marketing copy
- Each post must be meaningfully different

Respond ONLY with a valid JSON array, no markdown:
[{"caption": "..."},{"caption": "..."}]`;

  try {
    const res = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 3000,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = res.content[0].type === "text" ? res.content[0].text : "[]";
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) return [];

    const posts = JSON.parse(match[0]) as Array<{ caption: string }>;
    const now = new Date();

    return posts.slice(0, count).map((p, i) => {
      const scheduledFor = new Date(now);
      // Spread evenly over 30 days
      scheduledFor.setDate(now.getDate() + Math.round(i * (30 / count)));
      // Random hour between 9am and 1pm
      scheduledFor.setHours(9 + (i % 4), 0, 0, 0);
      return { caption: p.caption, scheduled_for: scheduledFor.toISOString() };
    });
  } catch {
    return [];
  }
}

export async function POST(request: Request) {
  const { business_id } = await request.json();
  if (!business_id) {
    return NextResponse.json({ error: "business_id required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", business_id)
    .single();

  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("customer_id", business.customer_id)
    .single();

  const plan = subscription?.plan || "starter";
  const totalPosts = POSTS_PER_PLAN[plan] || 8;
  const perPlatform = Math.floor(totalPosts / 3);

  // Clear existing queued posts
  await supabase
    .from("social_posts")
    .delete()
    .eq("business_id", business_id)
    .eq("status", "queued");

  const biz = {
    name: business.name,
    industry: business.industry || "business",
    city: business.city || "",
    state: business.state || "",
    description: business.description || `${business.name} serves clients in ${business.city}.`,
    phone: business.phone,
  };

  // Generate all 3 platforms in parallel
  const [fb, ig, li] = await Promise.all([
    generatePostsForPlatform("facebook", biz, perPlatform),
    generatePostsForPlatform("instagram", biz, perPlatform),
    generatePostsForPlatform("linkedin", biz, perPlatform),
  ]);

  const rows = [
    ...fb.map(p => ({ ...p, business_id, platform: "facebook" as const, status: "queued" as const })),
    ...ig.map(p => ({ ...p, business_id, platform: "instagram" as const, status: "queued" as const })),
    ...li.map(p => ({ ...p, business_id, platform: "linkedin" as const, status: "queued" as const })),
  ];

  const { data: inserted, error } = await supabase
    .from("social_posts")
    .insert(rows)
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    count: inserted?.length || 0,
    breakdown: { facebook: fb.length, instagram: ig.length, linkedin: li.length },
  });
}
