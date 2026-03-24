import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { businessName, description } = await req.json();

  const prompt = `Generate website demo content for a small business called "${businessName}". Here is what they do: "${description}". Build everything specifically around this description.

Return ONLY valid JSON with this exact structure, no other text, no markdown:
{
  "color": "#1a1a2e",
  "accent": "#7c3aed",
  "emoji": "🥋",
  "tagline": "one sentence tagline specific to this exact business",
  "cta": "2-3 word CTA button text",
  "image": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=300&fit=crop&auto=format",
  "services": ["Service 1", "Service 2", "Service 3", "Service 4"],
  "stats": [{"num": "200+", "label": "Customers"}, {"num": "10yr", "label": "Experience"}, {"num": "5★", "label": "Rated"}],
  "testimonial": {"text": "A genuine testimonial for this type of business", "name": "Customer Name", "role": "Customer type"},
  "blogs": ["Blog post title 1 specific to this business", "Blog post title 2", "Blog post title 3"],
  "posts": ["Social post 1 with relevant emoji", "Social post 2 with emoji", "Social post 3 with emoji"],
  "pages": ["Home", "Page2", "Page3", "Page4", "CTA Page"]
}

Rules:
- Pick a real Unsplash photo URL relevant to this specific business type
- Pick an accent color that fits the industry vibe (not always purple)
- Make ALL content specific to "${description}" — never generic plumber content
- Return ONLY the JSON object, nothing else`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await res.json();
    const text = data.content?.[0]?.text?.trim() || "";
    const clean = text.replace(/```json|```/g, "").trim();
    const generated = JSON.parse(clean);
    return NextResponse.json(generated);
  } catch (e) {
    return NextResponse.json({ error: "generation failed" }, { status: 500 });
  }
}
