import { createAdminClient } from "@/lib/supabase-server";
import { generateBusinessPhoto } from "@/lib/nano-banana";
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
export const maxDuration = 120;

const POSTS_PER_PLAN: Record<string, number> = {
  starter: 2,
  pro: 4,
  premium: 8,
};

async function generatePost(business: any, topicHint: string): Promise<{ title: string; body: string; word_count: number }> {
  const msg = await anthropic.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 1500,
    messages: [{
      role: "user",
      content: `Write a blog post for a local small business. Return ONLY valid JSON, no markdown.

Business: ${business.name}
Industry: ${business.industry || "local service"}
Location: ${business.city || "your city"}${business.state ? `, ${business.state}` : ""}
Topic: ${topicHint}

Return this JSON:
{
  "title": "SEO-optimized blog title (specific to this business and location)",
  "body": "Full blog post, 400-600 words. Write in a helpful, professional tone. Use paragraph breaks. Include the business name and location naturally. End with a call to action.",
  "word_count": 500
}

Make it genuinely useful for someone searching for ${business.industry || "this service"} in ${business.city || "the area"}.`,
    }],
  });

  const raw = msg.content[0].type === "text" ? msg.content[0].text : "";
  const clean = raw.replace(/```(?:json)?\n?/g, "").replace(/```/g, "").trim();
  const parsed = JSON.parse(clean);
  return {
    title: parsed.title,
    body: parsed.body,
    word_count: parsed.body?.split(/\s+/).length || 500,
  };
}

function getTopics(industry: string, count: number): string[] {
  const topicsByIndustry: Record<string, string[]> = {
    auto:        ["5 signs your car needs immediate attention", "how to choose a trustworthy auto shop", "DIY car maintenance tips", "when to repair vs replace your vehicle", "understanding your car warranty", "seasonal car care guide", "how to save money on car repairs", "the importance of regular oil changes"],
    plumbing:    ["signs you have a hidden water leak", "how to prevent frozen pipes", "when to call a plumber vs DIY", "common plumbing myths debunked", "how to maintain your water heater", "tips for unclogging drains naturally", "water pressure problems and fixes", "signs your pipes need replacing"],
    dental:      ["how often should you really visit the dentist", "foods that damage your teeth", "the truth about teeth whitening", "how to overcome dental anxiety", "dental hygiene tips for kids", "signs of gum disease to watch for", "dental implants vs dentures", "how to choose the right toothbrush"],
    restaurant:  ["the story behind our most popular dish", "how we source our ingredients locally", "behind the scenes at our kitchen", "our chef's top cooking tips", "seasonal menu highlights", "how to pair wine with your meal", "catering tips for your next event", "the health benefits of our cuisine"],
    gym:         ["beginner's guide to starting your fitness journey", "how to stay motivated at the gym", "the best exercises for weight loss", "nutrition tips to maximize your workout", "signs you're overtraining", "how to set realistic fitness goals", "benefits of personal training", "recovery tips after a hard workout"],
    default:     ["why local businesses matter to your community", "how we serve our customers better", "tips for finding the right service provider", "what to look for when hiring a professional", "how to prepare for your first appointment", "questions to ask before hiring", "understanding pricing in our industry", "our commitment to quality and service"],
  };

  const industryKey = Object.keys(topicsByIndustry).find(k => industry?.toLowerCase().includes(k)) || "default";
  const topics = topicsByIndustry[industryKey];

  // Shuffle and take the first `count`
  return topics.sort(() => Math.random() - 0.5).slice(0, count);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { business_id } = body;

  if (!business_id) {
    return NextResponse.json({ error: "business_id required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Fetch business + subscription
  const { data: business, error: bizErr } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", business_id)
    .single();

  if (bizErr || !business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("id", business.customer_id)
    .single();

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("customer_id", customer?.id)
    .single();

  const plan = subscription?.plan || "starter";
  const postCount = POSTS_PER_PLAN[plan] || 2;
  const topics = getTopics(business.industry || "", postCount);

  const results = [];
  const errors = [];

  // Generate posts (sequentially to avoid rate limits)
  for (const topic of topics) {
    try {
      const post = await generatePost(business, topic);
      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + results.length * 7); // one per week

      // Generate a Nano Banana image for this post
      let featuredImageUrl: string | null = null;
      try {
        const imagePrompt = `photorealistic photograph only, no text, no UI, no illustration. ${business.industry} business photo related to: ${post.title}. Professional, high quality, well lit.`;
        const photoUrl = await generateBusinessPhoto(business.name, imagePrompt, "about");
        if (photoUrl) {
          // Upload to Supabase Storage to make it permanent and add to shared library
          const imageRes = await fetch(photoUrl);
          const imageBuffer = await imageRes.arrayBuffer();
          const ext = "jpg";
          const fileName = `${business.industry}/blog/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
          const uploadRes = await fetch(
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/industry-images/${fileName}`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
                "Content-Type": "image/jpeg",
                "x-upsert": "true",
              },
              body: imageBuffer,
            }
          );
          if (uploadRes.ok) {
            featuredImageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/industry-images/${fileName}`;
          }
        }
      } catch (imgErr: any) {
        console.error("Blog image generation failed (non-fatal):", imgErr.message);
      }

      const { data: inserted } = await supabase
        .from("blog_posts")
        .insert({
          business_id,
          title: post.title,
          body: post.body,
          word_count: post.word_count,
          status: "pending",
          scheduled_for: scheduledDate.toISOString(),
          featured_image_url: featuredImageUrl,
        })
        .select()
        .single();

      results.push(inserted);
    } catch (e: any) {
      console.error("Failed to generate post:", topic, e.message);
      errors.push({ topic, error: e.message });
    }
  }

  // Send blog ready email (non-blocking)
  if (results.length > 0) {
    fetch(`${process.env.NEXT_PUBLIC_APP_URL || "https://www.exsisto.ai"}/api/send-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "blog_ready", business_id }),
    }).catch(() => {});
  }

  return NextResponse.json({
    success: true,
    generated: results.length,
    errors: errors.length > 0 ? errors : undefined,
    posts: results,
  });
}
