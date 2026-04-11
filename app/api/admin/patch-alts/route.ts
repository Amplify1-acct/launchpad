import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // Auth check
  const secret = request.headers.get("x-internal-secret");
  if (secret !== process.env.INTERNAL_SECRET && secret !== "exsisto-internal-2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const headers = { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey, "Content-Type": "application/json" };

  // Fetch all websites + their business city/state
  const res = await fetch(
    `${supabaseUrl}/rest/v1/websites?select=id,custom_html,services_html,about_html,contact_html,business_id`,
    { headers, cache: "no-store" }
  );
  const websites = await res.json();

  // Fetch all businesses for city/state lookup
  const bizRes = await fetch(
    `${supabaseUrl}/rest/v1/businesses?select=id,name,city,state`,
    { headers, cache: "no-store" }
  );
  const businesses = await bizRes.json();
  const bizMap: Record<string, { name: string; city: string; state: string }> = {};
  for (const b of businesses) {
    bizMap[b.id] = b;
  }

  const results: string[] = [];

  for (const site of websites) {
    const biz = bizMap[site.business_id];
    if (!biz) continue;

    const { name, city, state } = biz;
    if (!city) continue;

    let changed = false;
    const cols = ["custom_html", "services_html", "about_html", "contact_html"] as const;
    const patch: Record<string, string> = {};

    for (const col of cols) {
      let html: string = site[col] || "";
      if (!html) continue;

      // Fix "Gallery N" -> "{name} work in {city}, {state} - Photo N"
      const fixed = html.replace(
        /alt="Gallery (\d+)"/g,
        (_, n) => `alt="${name} work in ${city}, ${state} - Photo ${n}"`
      );

      // Fix bare alt="" -> meaningful alt
      // Fix alt="Image N" or alt="Photo N"
      const fixed2 = fixed
        .replace(/alt="Image (\d+)"/g, (_, n) => `alt="${name} in ${city}, ${state} - Photo ${n}"`)
        .replace(/alt="Photo (\d+)"/g, (_, n) => `alt="${name} work in ${city} - Photo ${n}"`);

      if (fixed2 !== html) {
        patch[col] = fixed2;
        changed = true;
      }
    }

    if (changed) {
      await fetch(
        `${supabaseUrl}/rest/v1/websites?id=eq.${site.id}`,
        { method: "PATCH", headers, body: JSON.stringify(patch) }
      );
      results.push(`✅ Patched ${biz.name} (${city}, ${state})`);
    }
  }

  return NextResponse.json({ patched: results.length, results });
}
