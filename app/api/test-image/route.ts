import { NextResponse } from "next/server";

export async function GET() {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  if (!OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY not set" });
  }

  const prompt = "Photorealistic professional photo of a perfectly restored 1967 Chevrolet Corvette convertible driving down Pacific Coast Highway California at golden hour, ocean in background. Stunning red paint, gleaming chrome. Cinematic lighting.";

  try {
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt,
        n: 1,
        size: "1792x1024",
        quality: "standard",
        response_format: "url",
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ error: data.error?.message || "DALL-E error", status: res.status });
    }

    const imageUrl = data.data?.[0]?.url;
    const revisedPrompt = data.data?.[0]?.revised_prompt;

    // Redirect to the image so you can see it
    return NextResponse.redirect(imageUrl);

  } catch (err: any) {
    return NextResponse.json({ error: err.message });
  }
}
