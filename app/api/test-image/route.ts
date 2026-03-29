import { NextResponse } from "next/server";

export async function GET() {
  const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
  if (!PEXELS_API_KEY) return NextResponse.json({ error: "PEXELS_API_KEY not set" });

  try {
    const res = await fetch(
      "https://api.pexels.com/v1/search?query=classic+car+restoration&per_page=5&orientation=landscape",
      { headers: { Authorization: PEXELS_API_KEY } }
    );
    const data = await res.json();
    const photos = data.photos?.map((p: any) => ({
      id: p.id,
      photographer: p.photographer,
      url: p.src.large2x,
      thumb: p.src.medium,
    }));
    return NextResponse.json({ success: true, count: photos?.length, photos });
  } catch (err: any) {
    return NextResponse.json({ error: err.message });
  }
}
