import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function POST(req: Request) {
  try {
    const { name, industry, city, phone, customIndustry } = await req.json();
    const industryLabel = industry === "other" ? (customIndustry || "business") : industry;

    const msg = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 300,
      messages: [{
        role: "user",
        content: `Generate website copy for a small business.

Business: ${name}
Type: ${industryLabel}
City: ${city}

Respond ONLY with valid JSON, no markdown, no backticks:
{
  "headline": "A bold 5-8 word hero headline specific to their business type",
  "tagline": "One punchy sentence capturing their unique value",
  "subtext": "Two sentences about the business — professional, local, trustworthy"
}

Make it feel authentic and specific to ${industryLabel} in ${city}. No generic filler.`,
      }],
    });

    const text = msg.content[0].type === "text" ? msg.content[0].text.trim() : "";
    // Strip any markdown if present
    const clean = text.replace(/^```json\n?|```$/g, "").trim();
    const parsed = JSON.parse(clean);

    return NextResponse.json({
      headline: parsed.headline || `${name} — ${city}'s Trusted Professionals`,
      tagline: parsed.tagline || "Quality service you can count on.",
      subtext: parsed.subtext || `Serving ${city} with professional, reliable service. Contact us for a free estimate.`,
    });
  } catch (err) {
    const { name, city } = await req.json().catch(() => ({ name: "Your Business", city: "your city" }));
    return NextResponse.json({
      headline: `${name || "Your Business"} — Trusted Professionals`,
      tagline: "Quality service you can count on.",
      subtext: `Serving ${city || "your community"} with professional, reliable service. Contact us today for a free estimate.`,
    });
  }
}
