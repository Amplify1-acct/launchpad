import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: Request) {
  const { industry } = await request.json();
  if (!industry?.trim()) {
    return NextResponse.json({ suggestions: [] });
  }

  const prompt = `List 12 specific services that a "${industry}" business would typically offer.

Rules:
- Be specific to this exact type of business
- Use short, clear service names (2-5 words each)
- Order from most common/important to more specialized
- Do NOT include generic items like "Customer Service" or "Consultation"

Respond ONLY with a JSON array of strings, no markdown:
["Service 1", "Service 2", ...]`;

  try {
    const res = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = res.content[0].type === "text" ? res.content[0].text : "[]";
    const match = raw.match(/\[[\s\S]*\]/);
    const suggestions = match ? JSON.parse(match[0]) : [];

    return NextResponse.json({ suggestions: suggestions.slice(0, 12) });
  } catch {
    return NextResponse.json({ suggestions: [] });
  }
}
