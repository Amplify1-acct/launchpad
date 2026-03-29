import { NextResponse } from "next/server";

export async function GET() {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!GEMINI_API_KEY) {
    return NextResponse.json({ error: "GEMINI_API_KEY not set" }, { status: 500 });
  }

  const prompt = "Photorealistic professional automotive photo of a perfectly restored 1967 Chevrolet Corvette convertible driving down Pacific Coast Highway California at golden hour, ocean in background. Stunning red paint, gleaming chrome, showroom condition. Cinematic lighting, high resolution.";

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseModalities: ["IMAGE", "TEXT"],
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
    const textPart = parts.find((p: any) => p.text);

    return NextResponse.json({
      success: !!imagePart,
      hasImage: !!imagePart,
      mimeType: imagePart?.inlineData?.mimeType,
      imageSizeBytes: imagePart?.inlineData?.data ? Math.round(imagePart.inlineData.data.length * 0.75) : 0,
      text: textPart?.text,
      // Return first 100 chars of base64 to confirm it's real image data
      imagePreview: imagePart?.inlineData?.data?.substring(0, 100),
      prompt,
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message });
  }
}
