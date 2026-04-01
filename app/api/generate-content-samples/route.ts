import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function POST(req: Request) {
  let body: Record<string, string> = {};
  try { body = await req.json(); } catch {}
  const { industry = "", bizType = "", city = "your city" } = body;
  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const nextWeek = new Date(Date.now() + 7*24*60*60*1000).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  const fallback = {
    blog: [
      { title: `5 Reasons ${city} Residents Trust ${bizType} Professionals`, excerpt: `When it comes to finding reliable ${bizType.toLowerCase()} services in ${city}, homeowners and businesses deserve the best. Here's what sets the top providers apart.`, readTime: "4 min read", date: today },
      { title: `The Complete Guide to ${bizType} in ${city}`, excerpt: `Everything you need to know about choosing the right ${bizType.toLowerCase()} for your needs — from what to look for to the questions you should always ask.`, readTime: "5 min read", date: nextWeek },
    ],
    social: [
      { platform: "Facebook", icon: "📘", content: `Serving ${city} with pride! 🏆 Licensed, insured, and local — that's the ${bizType} difference. Call today for a free estimate!`, likes: "47", comments: "12" },
      { platform: "Instagram", icon: "📸", content: `✨ Another happy customer in ${city}! DM us to get started on yours.\n\n#${bizType.replace(/\s+/g,"")} #${city.replace(/\s+/g,"")} #LocalBusiness`, likes: "183", comments: "24" },
      { platform: "TikTok", icon: "🎵", content: `POV: You finally found a ${bizType.toLowerCase()} you can trust in ${city} 🙌 Comment "INFO" and we'll reach out! #${bizType.replace(/\s+/g,"")}TikTok #LocalBiz`, likes: "1.2K", comments: "89" },
    ],
  };

  try {
    const msg = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 1000,
      messages: [{ role: "user", content: `Generate blog and social content for a local small business. Return ONLY valid JSON, no markdown.

Business type: ${bizType}
Industry: ${industry}
City: ${city}

{
  "blog": [
    {
      "title": "Compelling SEO blog title for ${bizType} in ${city}",
      "excerpt": "2-3 sentence engaging intro. Specific to ${bizType} customers in ${city}.",
      "readTime": "4 min read",
      "date": "${today}"
    },
    {
      "title": "A second different blog post title for ${bizType} in ${city}",
      "excerpt": "2-3 sentence engaging intro for this second post topic.",
      "readTime": "5 min read",
      "date": "${nextWeek}"
    }
  ],
  "social": [
    {
      "platform": "Facebook",
      "icon": "📘",
      "content": "Warm community Facebook post for ${bizType} in ${city}. 2-3 sentences + emoji + CTA.",
      "likes": "47",
      "comments": "12"
    },
    {
      "platform": "Instagram",
      "icon": "📸",
      "content": "Punchy Instagram caption with 3-4 relevant hashtags for ${bizType} in ${city}.",
      "likes": "183",
      "comments": "24"
    },
    {
      "platform": "TikTok",
      "icon": "🎵",
      "content": "Trendy TikTok caption with hook and hashtags for ${bizType} in ${city}.",
      "likes": "1.2K",
      "comments": "89"
    }
  ]
}` }],
    });
    const raw = msg.content[0].type === "text" ? msg.content[0].text : "";
    const parsed = JSON.parse(raw.replace(/```(?:json)?\n?/g,"").replace(/```/g,"").trim());
    return NextResponse.json({ blog: parsed.blog||fallback.blog, social: parsed.social||fallback.social });
  } catch {
    return NextResponse.json(fallback);
  }
}
