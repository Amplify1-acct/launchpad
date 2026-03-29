import { createAdminClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET || "exsisto-internal-2026";

/**
 * POST /api/generate-images
 * Called by Claude (MCP) after generating Stitch images.
 * Accepts either:
 *   - Authenticated user session (cookie), OR
 *   - x-internal-secret header (for Claude pipeline calls)
 */
export async function POST(request: Request) {
  try {
    // Allow internal calls with secret header (Claude pipeline)
    const internalSecret = request.headers.get("x-internal-secret");
    const isInternal = internalSecret === INTERNAL_SECRET;

    if (!isInternal) {
      // Could add session auth check here later
      // For now, internal secret is the only auth mechanism
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { business_id, hero_url, card1_url, card2_url, source } = body;

    if (!business_id) {
      return NextResponse.json({ error: "business_id required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { error } = await supabase
      .from("websites")
      .upsert({
        business_id,
        stitch_hero_url: hero_url || null,
        stitch_card1_url: card1_url || null,
        stitch_card2_url: card2_url || null,
        image_source: source || "stitch",
      }, { onConflict: "business_id" });

    if (error) throw error;

    // Also trigger site generation with the new images
    const genRes = await fetch(`${request.headers.get("origin") || "https://exsisto.ai"}/api/generate-site`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": INTERNAL_SECRET,
      },
      body: JSON.stringify({ business_id }),
    });

    const genData = await genRes.json().catch(() => ({}));

    return NextResponse.json({ 
      success: true, 
      business_id,
      images_stored: true,
      site_generated: genData.success || false,
      plan: genData.plan,
      image_source: genData.image_source,
    });

  } catch (error: any) {
    console.error("generate-images error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
