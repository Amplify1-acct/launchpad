import { NextResponse } from "next/server";

export async function GET() {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) return NextResponse.json({ error: "OPENAI_API_KEY not set" });

  const prompt = "RAW photo, DSLR, shot on Canon EOS R5, 50mm lens, f/2.8, natural lighting, ultra-realistic, hyperrealistic, photorealistic, 8K resolution, professional photography, no illustration, no painting, no CGI — 1967 Chevrolet Corvette convertible driving down Pacific Coast Highway California at golden hour, ocean in background. Stunning red paint, gleaming chrome, every reflection crystal clear. Magazine cover quality automotive photography.";

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
        quality: "hd",
        style: "natural",
        response_format: "url",
      }),
    });

    const data = await res.json();
    if (!res.ok) return NextResponse.json({ error: data.error?.message, status: res.status });

    const imageUrl = data.data?.[0]?.url;
    if (!imageUrl) return NextResponse.json({ error: "No image URL returned" });

    return NextResponse.redirect(imageUrl);
  } catch (err: any) {
    return NextResponse.json({ error: err.message });
  }
}
