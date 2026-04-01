import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function POST(req: Request) {
  let body: Record<string, string> = {};
  try { body = await req.json(); } catch {}

  const { industry = "", bizType = "", city = "your city" } = body;

  const fallback = {
    blog: {
      title: `5 Reasons ${city} Residents Trust ${bizType} Professionals`,
      excerpt: `When it comes to finding reliable ${bizType.toLowerCase()} services in ${city}, homeowners and businesses deserve the best. Here's what sets the top providers apart — and why choosing the right team makes all the difference for your needs.`,
      readTime: "4 min read",
      date: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
    },
    social: [
      {
        platform: "Facebook",
        icon: "📘",
        content: `Serving ${city} with pride! 🏆 Whether you need routine service or something more complex, our team is ready to help. Licensed, insured, and local — that's the ${bizType} difference. Give us a call today for a free estimate! ☎️`,
        likes: "47",
        comments: "12",
      },
      {
        platform: "Instagram",
        icon: "📸",
        content: `✨ Another happy customer in ${city}! Our team takes pride in every job — big or small. Swipe to see the results. 📲 DM us to get started on yours!\n\n#${bizType.replace(/\s+/g, "")} #${city.replace(/\s+/g, "")} #LocalBusiness #SmallBusiness`,
        likes: "183",
        comments: "24",
      },
      {
        platform: "TikTok",
        icon: "🎵",
        content: `POV: You finally found a ${bizType.toLowerCase()} you can trust in ${city} 🙌 We show up on time, do the job right, and leave your place spotless. Comment "INFO" and we'll slide into your DMs! #${bizType.replace(/\s+/g, "")}TikTok #LocalBiz #${city.replace(/\s+/g, "")}`,
        likes: "1.2K",
        comments: "89",
      },
    ],
  };

  try {
    const msg = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 800,
      messages: [{
        role: "user",
        content: `Generate sample blog and social media content for a local small business. Return ONLY valid JSON, no markdown, no explanation.

Business type: ${bizType}
Industry: ${industry}
City: ${city}

Return this exact JSON structure:
{
  "blog": {
    "title": "Compelling blog post title specific to ${bizType} in ${city} (use their business name flavor)",
    "excerpt": "A 2-3 sentence engaging intro paragraph. Make it feel real and helpful, specific to ${bizType} customers in ${city}.",
    "readTime": "4 min read",
    "date": "${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}"
  },
  "social": [
    {
      "platform": "Facebook",
      "icon": "📘",
      "content": "A warm, community-focused Facebook post for a ${bizType} in ${city}. Include a call to action. 2-3 sentences + emoji.",
      "likes": "47",
      "comments": "12"
    },
    {
      "platform": "Instagram",
      "icon": "📸",
      "content": "An engaging Instagram caption for a ${bizType} in ${city}. Visual, punchy, with relevant hashtags. Include 3-4 hashtags.",
      "likes": "183",
      "comments": "24"
    },
    {
      "platform": "TikTok",
      "icon": "🎵",
      "content": "A trendy TikTok caption for a ${bizType} in ${city}. Casual, fun, with a hook. Include trending-style hashtags.",
      "likes": "1.2K",
      "comments": "89"
    }
  ]
}

Make all content feel authentic and specific to ${bizType} — not generic. The blog title should be something a real customer would search for.`,
      }],
    });

    const raw = msg.content[0].type === "text" ? msg.content[0].text : "";
    const clean = raw.replace(/```(?:json)?\n?/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(clean);

    return NextResponse.json({
      blog: parsed.blog || fallback.blog,
      social: Array.isArray(parsed.social) ? parsed.social : fallback.social,
    });
  } catch {
    return NextResponse.json(fallback);
  }
}
