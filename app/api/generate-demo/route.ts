import { NextRequest, NextResponse } from "next/server";

async function fetchPexelsPhoto(query: string, apiKey: string): Promise<string> {
  try {
    const encoded = encodeURIComponent(query);
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encoded}&per_page=1&orientation=landscape`,
      { headers: { Authorization: apiKey } }
    );
    if (!res.ok) throw new Error(`Pexels error: ${res.status}`);
    const data = await res.json();
    const photo = data.photos?.[0];
    if (photo) return `${photo.src.large}?auto=compress&cs=tinysrgb&w=800&h=300&fit=crop`;
    throw new Error("no photos found");
  } catch (e) {
    // Fallback Unsplash photo
    return "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=300&fit=crop&auto=format";
  }
}

export async function POST(req: NextRequest) {
  const { businessName, description } = await req.json();

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "no api key" }, { status: 500 });
  }

  // Build a specific photo search query from the business description
  const photoQuery = `${description} ${businessName}`.slice(0, 100);
  
  // Fetch the right photo from Pexels using the actual business description
  const photoUrl = process.env.PEXELS_API_KEY
    ? await fetchPexelsPhoto(photoQuery, process.env.PEXELS_API_KEY)
    : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=300&fit=crop&auto=format";

  const prompt = `Generate website demo content for a small business called "${businessName}". Here is what they do: "${description}".

Return ONLY a valid JSON object, no markdown, no backticks, no explanation:
{
  "color": "#1a1a2e",
  "accent": "#b45309",
  "emoji": "🏆",
  "tagline": "one sentence tagline specific to this exact business",
  "cta": "Get Started Today",
  "image": "${photoUrl}",
  "services": ["Service 1", "Service 2", "Service 3", "Service 4"],
  "stats": [{"num": "500+", "label": "Customers"}, {"num": "10yr", "label": "Experience"}, {"num": "5★", "label": "Rated"}],
  "testimonial": {"text": "A genuine testimonial specific to this type of business", "name": "Customer Name", "role": "Customer type"},
  "blogs": ["Blog title 1 specific to this business", "Blog title 2", "Blog title 3"],
  "posts": ["Social post 1 with relevant emoji", "Social post 2 with emoji", "Social post 3 with emoji"],
  "pages": ["Home", "Services", "About", "Gallery", "Contact"]
}

RULES:
- The "image" field MUST be exactly: "${photoUrl}" — do not change it
- ALL content must be 100% specific to what "${businessName}" does: "${description}"
- Pick an accent color that fits the vibe (amber for artisan/vintage, purple for wellness, blue for professional/legal, green for food/nature, orange for energy/sports, pink for beauty)
- Return ONLY the raw JSON object, nothing else`;

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
    const clean = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
    const generated = JSON.parse(clean);

    // Always lock the photo to our Pexels result
    generated.image = photoUrl;

    return NextResponse.json(generated);
  } catch (e: any) {
    console.error("Generate demo error:", e?.message);
    return NextResponse.json({ error: e?.message || "generation failed" }, { status: 500 });
  }
}
