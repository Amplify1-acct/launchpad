import { NextResponse } from "next/server";

export async function GET() {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!GEMINI_API_KEY) {
    return NextResponse.json({ error: "GEMINI_API_KEY not set" }, { status: 500 });
  }

  const prompt = "Photorealistic professional photo of a perfectly restored 1967 Chevrolet Corvette convertible driving down Pacific Coast Highway California at golden hour, ocean in background. Stunning red paint, gleaming chrome. Cinematic lighting.";

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseModalities: ["IMAGE"],
            imageConfig: { aspectRatio: "16:9" },
          },
        }),
      }
    );

    const raw = await res.text();

    if (!res.ok) {
      return NextResponse.json({ error: "Gemini API error", status: res.status, body: raw });
    }

    const data = JSON.parse(raw);
    const parts = data.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find((p: any) => p.inlineData);

    if (imagePart) {
      // Return the actual image
      const imageBuffer = Buffer.from(imagePart.inlineData.data, "base64");
      return new Response(imageBuffer, {
        headers: {
          "Content-Type": imagePart.inlineData.mimeType,
          "Cache-Control": "no-store",
        },
      });
    }

    return NextResponse.json({ error: "No image returned", raw: raw.slice(0, 500) });

  } catch (err: any) {
    return NextResponse.json({ error: err.message });
  }
}
