import { createAdminClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

/**
 * POST /api/generate-images
 * 
 * Called by Claude (via MCP) after it generates Stitch images.
 * Claude runs stitch:generate_screen_from_text, extracts image URLs,
 * then POSTs them here so we can store them and inject into the template.
 * 
 * This approach avoids needing gcloud credentials on the Vercel server.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { business_id, hero_url, card1_url, card2_url, source } = body;

    if (!business_id) {
      return NextResponse.json({ error: "business_id required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Store the Stitch image URLs on the website record
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

    return NextResponse.json({ success: true, business_id });

  } catch (error: any) {
    console.error("generate-images error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
