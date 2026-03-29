import { createAdminClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET || "exsisto-internal-2026";
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
export const maxDuration = 90;

/**
 * POST /api/admin/generate
 * Called by Claude MCP after generating Stitch images.
 * Looks up customer by email → finds business → stores images → triggers generate-site.
 */
export async function POST(request: Request) {
  const secret = request.headers.get("x-internal-secret");
  if (secret !== INTERNAL_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json() as {
      email: string;
      hero_url?: string;
      card1_url?: string;
      card2_url?: string;
    };
    const { email, hero_url, card1_url, card2_url } = body;

    if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

    const supabase = createAdminClient();

    // Look up customer
    const { data: customer, error: custErr } = await supabase
      .from("customers")
      .select("id, email")
      .eq("email", email)
      .single();

    if (custErr || !customer) {
      return NextResponse.json({ error: `Customer not found: ${custErr?.message}` }, { status: 404 });
    }

    // Look up plan from subscriptions
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("plan")
      .eq("customer_id", customer.id)
      .single();

    const plan = (sub?.plan as string) || "starter";

    // Look up business
    const { data: business, error: bizErr } = await supabase
      .from("businesses")
      .select("id, name, description, industry, city, state, phone, email")
      .eq("customer_id", customer.id)
      .single();

    if (bizErr || !business) {
      return NextResponse.json({ error: `Business not found: ${bizErr?.message}` }, { status: 404 });
    }

    // Store Stitch images on website record
    await supabase.from("websites").upsert({
      business_id: business.id,
      stitch_hero_url: hero_url || null,
      stitch_card1_url: card1_url || null,
      stitch_card2_url: card2_url || null,
      image_source: hero_url ? "stitch" : "pexels",
      plan,
    }, { onConflict: "business_id" });

    // Trigger generate-site with internal secret to bypass auth
    const origin = new URL(request.url).origin;
    const genRes = await fetch(`${origin}/api/generate-site`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": INTERNAL_SECRET,
      },
      body: JSON.stringify({ business_id: business.id }),
    });

    const genData = await genRes.json() as Record<string, unknown>;

    return NextResponse.json({
      success: true,
      customer_email: customer.email,
      plan,
      business_id: business.id,
      business_name: business.name,
      image_source: hero_url ? "stitch" : "pexels",
      site_generated: genData.success || false,
      site_tokens: genData.tokens_generated || 0,
    });

  } catch (err) {
    const error = err as Error;
    console.error("admin/generate error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
