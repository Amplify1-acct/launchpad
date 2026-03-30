import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function POST(req: Request) {
  let body = { name: "Your Business", industry: "", city: "your city", customIndustry: "" };
  try { body = await req.json(); } catch {}

  const { name, industry, city, customIndustry } = body;
  const industryLabel = industry === "other"
    ? (customIndustry || "business")
    : (industry || "business");

  const fallback = {
    headline: `${name} — ${city} Professionals You Can Trust`,
    tagline: `Quality ${industryLabel} services delivered with care.`,
    subtext: `Serving ${city} with professional, reliable ${industryLabel} services. Contact us today for a free estimate.`,
  };

  try {
    const msg = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 300,
      messages: [{
        role: "user",
        content: `Write website hero copy for a small business. Return ONLY a JSON object, no markdown, no explanation.

Business name: ${name}
Business type: ${industryLabel}  
City: ${city}

JSON format:
{"headline":"bold 6-8 word hero headline","tagline":"one punchy sentence about their value","subtext":"two sentences, professional and local-feeling"}

Rules: be specific to ${industryLabel}, mention ${city}, avoid generic filler, no quotes inside strings.`,
      }],
    });

    const raw = msg.content[0].type === "text" ? msg.content[0].text : "";
    const clean = raw.replace(/```(?:json)?\n?/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(clean);

    return NextResponse.json({
      headline: parsed.headline || fallback.headline,
      tagline: parsed.tagline || fallback.tagline,
      subtext: parsed.subtext || fallback.subtext,
    });
  } catch {
    return NextResponse.json(fallback);
  }
}
