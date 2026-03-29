import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "small business";
  const orientation = searchParams.get("o") || "landscape";
  const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

  if (!PEXELS_API_KEY) return NextResponse.json({ error: "No Pexels key" }, { status: 500 });

  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=6&orientation=${orientation}`,
      { headers: { Authorization: PEXELS_API_KEY } }
    );
    const data = await res.json();
    const urls = (data.photos || []).map((p: any) => ({
      landscape: p.src.landscape || p.src.large2x || p.src.large,
      square: p.src.large || p.src.medium,
      portrait: p.src.portrait || p.src.large,
      photographer: p.photographer,
    }));
    return NextResponse.json({ urls });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
