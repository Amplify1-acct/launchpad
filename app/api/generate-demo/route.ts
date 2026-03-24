import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { businessName, description } = await req.json();

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "no api key" }, { status: 500 });
  }

  const prompt = `Generate website demo content for a small business called "${businessName}". Here is what they do: "${description}". Build everything specifically around this description.

Return ONLY a valid JSON object, no markdown, no backticks, no explanation:
{
  "color": "#1a1a2e",
  "accent": "#b45309",
  "emoji": "⌚",
  "tagline": "one sentence tagline specific to this exact business",
  "cta": "Get a Free Estimate",
  "image": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=300&fit=crop&auto=format",
  "services": ["Service 1", "Service 2", "Service 3", "Service 4"],
  "stats": [{"num": "200+", "label": "Customers"}, {"num": "10yr", "label": "Experience"}, {"num": "5★", "label": "Rated"}],
  "testimonial": {"text": "A genuine testimonial for this type of business", "name": "Customer Name", "role": "Customer type"},
  "blogs": ["Blog post title 1 specific to this business", "Blog post title 2", "Blog post title 3"],
  "posts": ["Social post 1 with relevant emoji", "Social post 2 with emoji", "Social post 3 with emoji"],
  "pages": ["Home", "Services", "About", "Gallery", "Contact"]
}

CRITICAL RULES:
- Make ALL content 100% specific to "${description}" — never use plumbing, pipes, or water heater content
- Pick a real Unsplash photo URL relevant to this specific type of business
- Pick an accent color that fits the vibe (amber for vintage, purple for wellness, blue for professional, etc)
- Return ONLY the raw JSON object — no markdown, no \`\`\`json, no explanation, just { ... }`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Anthropic error:", res.status, errText);
      return NextResponse.json({ error: `anthropic error: ${res.status}` }, { status: 500 });
    }

    const data = await res.json();
    const text = data.content?.[0]?.text?.trim() || "";
    
    // Strip any markdown fences just in case
    const clean = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
    
    const generated = JSON.parse(clean);
    return NextResponse.json(generated);
  } catch (e: any) {
    console.error("Generate demo error:", e?.message);
    return NextResponse.json({ error: e?.message || "generation failed" }, { status: 500 });
  }
}
