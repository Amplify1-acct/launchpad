import { NextRequest, NextResponse } from "next/server";

// Curated Unsplash photo map for common business types
const photoMap: Record<string, string> = {
  bakery: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&h=300&fit=crop&auto=format",
  bread: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&h=300&fit=crop&auto=format",
  cake: "https://images.unsplash.com/photo-1464349095431-e9a21285b19c?w=800&h=300&fit=crop&auto=format",
  pastry: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&h=300&fit=crop&auto=format",
  coffee: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=300&fit=crop&auto=format",
  restaurant: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=300&fit=crop&auto=format",
  pizza: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=300&fit=crop&auto=format",
  plumb: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&h=300&fit=crop&auto=format",
  pipe: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&h=300&fit=crop&auto=format",
  electric: "https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=800&h=300&fit=crop&auto=format",
  dental: "https://images.unsplash.com/photo-1606811971618-4486d14f3f99?w=800&h=300&fit=crop&auto=format",
  teeth: "https://images.unsplash.com/photo-1606811971618-4486d14f3f99?w=800&h=300&fit=crop&auto=format",
  law: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&h=300&fit=crop&auto=format",
  legal: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&h=300&fit=crop&auto=format",
  gym: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=300&fit=crop&auto=format",
  fitness: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=300&fit=crop&auto=format",
  yoga: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=300&fit=crop&auto=format",
  photo: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800&h=300&fit=crop&auto=format",
  hair: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&h=300&fit=crop&auto=format",
  salon: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&h=300&fit=crop&auto=format",
  dog: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&h=300&fit=crop&auto=format",
  pet: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&h=300&fit=crop&auto=format",
  watch: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=300&fit=crop&auto=format",
  real estate: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=300&fit=crop&auto=format",
  home: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=300&fit=crop&auto=format",
  landscap: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=300&fit=crop&auto=format",
  garden: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=300&fit=crop&auto=format",
  auto: "https://images.unsplash.com/photo-1625047509248-ec889cbff17f?w=800&h=300&fit=crop&auto=format",
  car: "https://images.unsplash.com/photo-1625047509248-ec889cbff17f?w=800&h=300&fit=crop&auto=format",
  karate: "https://images.unsplash.com/photo-1555597673-b21d5c935865?w=800&h=300&fit=crop&auto=format",
  martial: "https://images.unsplash.com/photo-1555597673-b21d5c935865?w=800&h=300&fit=crop&auto=format",
  bowl: "https://images.unsplash.com/photo-1545593540-fd34ae516e53?w=800&h=300&fit=crop&auto=format",
  bowling: "https://images.unsplash.com/photo-1545593540-fd34ae516e53?w=800&h=300&fit=crop&auto=format",
  cleaning: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&h=300&fit=crop&auto=format",
  hvac: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&h=300&fit=crop&auto=format",
  roofing: "https://images.unsplash.com/photo-1632823471565-1ecdf5c6da2e?w=800&h=300&fit=crop&auto=format",
  paint: "https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=800&h=300&fit=crop&auto=format",
  florist: "https://images.unsplash.com/photo-1487530811015-780eb375de5b?w=800&h=300&fit=crop&auto=format",
  flower: "https://images.unsplash.com/photo-1487530811015-780eb375de5b?w=800&h=300&fit=crop&auto=format",
  tattoo: "https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?w=800&h=300&fit=crop&auto=format",
  massage: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&h=300&fit=crop&auto=format",
  chiro: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=300&fit=crop&auto=format",
  tutor: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&h=300&fit=crop&auto=format",
  music: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800&h=300&fit=crop&auto=format",
  accounting: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=300&fit=crop&auto=format",
  insurance: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&h=300&fit=crop&auto=format",
};

function getPhotoForBusiness(description: string): string {
  const lower = description.toLowerCase();
  for (const [keyword, url] of Object.entries(photoMap)) {
    if (lower.includes(keyword)) return url;
  }
  // Generic small business fallback
  return "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=300&fit=crop&auto=format";
}

export async function POST(req: NextRequest) {
  const { businessName, description } = await req.json();

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "no api key" }, { status: 500 });
  }

  // Pick the right photo server-side based on keywords
  const photoUrl = getPhotoForBusiness(description + " " + businessName);

  const prompt = `Generate website demo content for a small business called "${businessName}". Here is what they do: "${description}".

Return ONLY a valid JSON object, no markdown, no backticks, no explanation:
{
  "color": "#1a1a2e",
  "accent": "#b45309",
  "emoji": "⌚",
  "tagline": "one sentence tagline specific to this exact business",
  "cta": "Get a Free Estimate",
  "image": "${photoUrl}",
  "services": ["Service 1", "Service 2", "Service 3", "Service 4"],
  "stats": [{"num": "200+", "label": "Customers"}, {"num": "10yr", "label": "Experience"}, {"num": "5★", "label": "Rated"}],
  "testimonial": {"text": "A genuine testimonial for this type of business", "name": "Customer Name", "role": "Customer type"},
  "blogs": ["Blog post title 1 specific to this business", "Blog post title 2", "Blog post title 3"],
  "posts": ["Social post 1 with relevant emoji", "Social post 2 with emoji", "Social post 3 with emoji"],
  "pages": ["Home", "Page2", "Page3", "Page4", "CTA Page"]
}

RULES:
- The image field MUST be exactly: "${photoUrl}" — do not change it
- Make ALL content 100% specific to "${description}" — the tagline, services, stats, testimonial, blogs, posts must all be about this exact business type
- Pick an accent color that fits the vibe (amber for vintage/artisan, purple for wellness, blue for professional, green for nature/food, red for energy)
- Return ONLY the raw JSON object`;

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

    // Always override image with our server-side pick to ensure it matches
    generated.image = photoUrl;

    return NextResponse.json(generated);
  } catch (e: any) {
    console.error("Generate demo error:", e?.message);
    return NextResponse.json({ error: e?.message || "generation failed" }, { status: 500 });
  }
}
