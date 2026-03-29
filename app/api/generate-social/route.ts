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

// Unsplash photo topics by industry keyword
function getPhotoTopic(description: string, postType: string): string {
  const lower = description.toLowerCase();

  // Industry-specific photo searches
  if (lower.includes("auto") || lower.includes("car") || lower.includes("vehicle")) {
    const topics = ["classic car restoration workshop", "vintage automobile engine", "auto mechanic garage", "classic muscle car", "car detailing professional"];
    return topics[Math.floor(Math.random() * topics.length)];
  }
  if (lower.includes("plumb") || lower.includes("pipe") || lower.includes("drain")) {
    return ["plumber working", "modern bathroom plumbing", "pipe repair professional"][Math.floor(Math.random() * 3)];
  }
  if (lower.includes("restaurant") || lower.includes("food") || lower.includes("cafe")) {
    return ["restaurant kitchen chef", "beautiful food plating", "cozy cafe interior"][Math.floor(Math.random() * 3)];
  }
  if (lower.includes("gym") || lower.includes("fitness") || lower.includes("trainer")) {
    return ["gym workout weights", "personal training session", "fitness motivation"][Math.floor(Math.random() * 3)];
  }
  if (lower.includes("dental") || lower.includes("dentist")) {
    return ["dental office modern", "dentist patient care", "healthy smile teeth"][Math.floor(Math.random() * 3)];
  }
  if (lower.includes("law") || lower.includes("attorney") || lower.includes("legal")) {
    return ["law office professional", "attorney consultation", "justice legal books"][Math.floor(Math.random() * 3)];
  }
  if (lower.includes("real estate") || lower.includes("realtor") || lower.includes("property")) {
    return ["luxury home exterior", "real estate agent", "modern house interior"][Math.floor(Math.random() * 3)];
  }
  if (lower.includes("landscap") || lower.includes("lawn") || lower.includes("garden")) {
    return ["professional landscaping", "beautiful garden design", "lawn care maintenance"][Math.floor(Math.random() * 3)];
  }
  if (lower.includes("clean")) {
    return ["professional cleaning service", "spotless home interior", "cleaning team"][Math.floor(Math.random() * 3)];
  }
  if (lower.includes("financ") || lower.includes("account") || lower.includes("tax")) {
    return ["financial advisor meeting", "business accounting office", "financial planning"][Math.floor(Math.random() * 3)];
  }

  // Post type fallbacks
  const fallbacks: Record<string, string> = {
    behind_the_scenes: "professional team working",
    tip: "business expertise knowledge",
    local: "small town main street community",
    results: "happy customer satisfaction",
    trust: "professional handshake trust",
    cta: "small business owner welcoming",
  };

  return fallbacks[postType] || "small business professional service";
}

function buildUnsplashUrl(topic: string, seed: number): string {
  // Use Unsplash source API — free, no key needed
  const encoded = encodeURIComponent(topic);
  return `https://source.unsplash.com/800x600/?${encoded}&sig=${seed}`;
}

async function generatePostsForPlatform(
  platform: "facebook" | "instagram" | "linkedin",
  business: Record<string, any>,
  tokens: Record<string, any> | null,
  count: number
): Promise<Array<{ caption: string; image_url: string; post_type: string; scheduled_for: string }>> {

  const platformGuide = {
    facebook: "Conversational and warm. 2-4 sentences. Can end with a question to spark comments. 2-3 hashtags at the end. Feels like a local business owner talking to their community.",
    instagram: "Hook in the first line — make people stop scrolling. Visual and descriptive language. 4-6 relevant hashtags. 1-2 emojis max. Short punchy sentences.",
    linkedin: "Professional and insight-led. Position as an expert. Share genuine perspective. 1-2 hashtags. No emojis. 3-5 sentences. Reads like a business owner, not a marketer.",
  }[platform];

  // Use website tokens for branding context if available
  const brandContext = tokens ? `
Brand voice & style from their website:
- Tagline: ${tokens.tagline || tokens.hero_headline || ""}
- Key services: ${tokens.service_1_name}, ${tokens.service_2_name}, ${tokens.service_3_name}
- Trust signals: ${tokens.trust_1}, ${tokens.trust_2}, ${tokens.trust_3}
- Stats they're proud of: ${tokens.stat_1_value} ${tokens.stat_1_label}, ${tokens.stat_2_value} ${tokens.stat_2_label}
- Tone from their about section: ${(tokens.about_paragraph_1 || "").slice(0, 100)}
` : "";

  const postTypeInstructions = POST_TYPES.slice(0, count)
    .map((pt, i) => `Post ${i + 1} (${pt.type}): ${pt.prompt}`)
    .join("\n");

  const prompt = `Write exactly ${count} ${platform} posts for this business. Make them genuine, specific, and varied — they should sound like a real business owner, not a marketing agency.

Business: ${business.name}
Industry/Description: ${business.description || business.industry}
Location: ${business.city}, ${business.state}
Phone: ${business.phone || ""}
${brandContext}

Platform style: ${platformGuide}

Write one post per type below:
${postTypeInstructions}

Rules:
- Each post must be meaningfully different — different angle, different service, different tone
- Specific to ${business.name} — not generic small business content
- Never fabricate customer quotes or testimonials
- Include the business name or location naturally in at least 3 posts
- Phone number (${business.phone || ""}) in the CTA post only

Return ONLY a valid JSON array, no markdown, no explanation:
[{"caption": "...", "post_type": "intro"}, {"caption": "...", "post_type": "service_spotlight"}, ...]`;

  try {
    const res = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = res.content[0].type === "text" ? res.content[0].text : "[]";
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) return [];

    const posts = JSON.parse(match[0]) as Array<{ caption: string; post_type: string }>;
    const now = new Date();
    const description = business.description || business.industry || "";

    return posts.slice(0, count).map((p, i) => {
      // Schedule posts: start tomorrow, spread over 30 days
      const scheduledFor = new Date(now);
      scheduledFor.setDate(now.getDate() + 1 + Math.round(i * (30 / count)));

      // Stagger post times by platform so they don't all post at once
      const hours: Record<string, number> = { facebook: 10, instagram: 12, linkedin: 8 };
      scheduledFor.setHours(hours[platform] + (i % 2), 0, 0, 0);

      const photoTopic = getPhotoTopic(description, p.post_type);
      const seed = Date.now() + i + (platform === "facebook" ? 0 : platform === "instagram" ? 100 : 200);

      return {
        caption: p.caption,
        post_type: p.post_type,
        image_url: buildUnsplashUrl(photoTopic, seed),
        scheduled_for: scheduledFor.toISOString(),
      };
    });
  } catch (e) {
    console.error(`Error generating ${platform} posts:`, e);
    return [];
  }
}

export async function POST(request: Request) {
  const { business_id } = await request.json();
  if (!business_id) {
    return NextResponse.json({ error: "business_id required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Fetch business
  const { data: business } = await supabase
    .from("businesses").select("*").eq("id", business_id).single();

  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  // Fetch website tokens for branding context
  const { data: website } = await supabase
    .from("websites").select("generated_tokens, template_name").eq("business_id", business_id).single();

  const tokens = website?.generated_tokens || null;

  // Fetch subscription for post count
  const { data: subscription } = await supabase
    .from("subscriptions").select("plan").eq("customer_id", business.customer_id).single();

  const plan = subscription?.plan || "starter";
  const totalPosts = plan === "premium" ? 30 : plan === "growth" ? 21 : 12;
  const perPlatform = Math.floor(totalPosts / 3);

  // Clear existing queued posts
  await supabase
    .from("social_posts").delete()
    .eq("business_id", business_id).eq("status", "queued");

  // Generate all 3 platforms in parallel
  const [fb, ig, li] = await Promise.all([
    generatePostsForPlatform("facebook", business, tokens, perPlatform),
    generatePostsForPlatform("instagram", business, tokens, perPlatform),
    generatePostsForPlatform("linkedin", business, tokens, perPlatform),
  ]);

  const rows = [
    ...fb.map(p => ({ ...p, business_id, platform: "facebook" as const, status: "queued" as const })),
    ...ig.map(p => ({ ...p, business_id, platform: "instagram" as const, status: "queued" as const })),
    ...li.map(p => ({ ...p, business_id, platform: "linkedin" as const, status: "queued" as const })),
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
