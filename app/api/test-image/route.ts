import { NextResponse } from "next/server";

export async function GET() {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) return NextResponse.json({ error: "OPENAI_API_KEY not set" });

  const prompt = "A real photograph taken with a Canon EOS R5, 85mm f/1.4 lens, ISO 400, shot by a professional automotive photographer for Motor Trend magazine. Film grain, natural imperfections, real depth of field, lens flare. NOT a render, NOT CGI, NOT illustrated. A perfectly restored 1967 Chevrolet Corvette convertible in Nassau Blue driving down Pacific Coast Highway California at golden hour. Ocean visible in background, sun low on horizon, warm light on the paint. Every chrome detail and reflection perfectly captured. Real photograph only.";

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
    if (!imageUrl) return NextResponse.json({ error: "No image URL" });

    return NextResponse.redirect(imageUrl);
  } catch (err: any) {
    return NextResponse.json({ error: err.message });
  }
}
