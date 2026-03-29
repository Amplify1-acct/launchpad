import { createAdminClient, createServerSupabaseClient } from "@/lib/supabase-server";
import { generateBusinessPhoto } from "@/lib/nano-banana";
import { NextResponse } from "next/server";

const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET || "exsisto-internal-2026";

// Industry keyword → Stitch image prompts
const INDUSTRY_PROMPTS: Record<string, [string, string, string]> = {
  auto: ["cinematic vintage muscle car dimly lit professional garage dramatic chrome highlights moody premium no text", "close-up macro gleaming polished chrome engine parts dark background studio lighting no text", "craftsman hands sanding classic car body panel workshop warm light no text"],
  restaurant: ["elegant restaurant interior warm golden lighting beautifully plated gourmet dish editorial no text", "artistic close-up beautifully plated dish garnished restaurant quality dark dramatic no text", "chef hands plating dish professional kitchen action shot warm tones no text"],
  gym: ["dramatic gym person lifting weights silhouetted powerful backlight moody premium fitness no text", "athletic hands gripping barbell high contrast dark background motivational no text", "person intense workout dramatic backlighting cinematic premium fitness aesthetic no text"],
  plumbing: ["professional plumber working modern bathroom clean tools trust-inspiring warm lighting no text", "gleaming modern bathroom fixtures professional installation clean polished no text", "professional plumber toolbelt copper pipe fittings quality tools warm editorial no text"],
  dental: ["modern bright dental clinic smiling patient friendly dentist warm welcoming no text", "perfect white smile clean bright teeth clinical studio lighting professional no text", "modern dental equipment clean bright operatory professional clinical no text"],
  law: ["confident lawyer premium office dramatic side lighting bookshelves authoritative editorial no text", "premium law office mahogany desk legal books gavel professional no text", "lawyer hands reviewing legal documents dramatic lighting professional close-up no text"],
  salon: ["modern upscale hair salon stylist working warm beautiful lighting editorial no text", "beautiful hair color result glossy healthy hair salon professional dramatic no text", "stylist skilled hands working hair close detail warm bokeh professional no text"],
  realestate: ["stunning luxury home exterior landscaping golden hour lighting aspirational no text", "beautifully staged luxury home interior open plan living natural light no text", "real estate agent handing keys happy client professional handshake no text"],
  pet: ["happy dogs being groomed professional pet salon warm playful clean facility no text", "adorable fluffy dog freshly groomed studio lighting clean white background no text", "caring groomer brushing happy dog warm lighting trust and care no text"],
  hvac: ["professional HVAC technician confident air conditioning unit expert clean uniform no text", "modern HVAC system installation clean ductwork professional workmanship no text", "HVAC technician professional tools equipment organized warm editorial no text"],
  bakery: ["artisan bakery display fresh pastries bread warm golden lighting inviting no text", "freshly baked croissant flaky golden perfection studio lighting no text", "baker hands kneading dough floured surface artisan craft warm no text"],
  landscaping: ["stunning landscaped garden lush lawn colorful flowers manicured golden hour no text", "landscaper hands planting colorful flowers care craftsmanship warm editorial no text", "beautiful manicured garden path professional hedging seasonal plants no text"],
};

function getPrompts(industry: string): [string, string, string] {
  const key = Object.keys(INDUSTRY_PROMPTS).find(k =>
    industry.toLowerCase().includes(k) || k.includes(industry.toLowerCase().split(/\s/)[0])
  );
  return INDUSTRY_PROMPTS[key || "auto"];
}

async function generateStitchImages(
  business: { id: string; name: string; description: string; city: string },
  plan: string
): Promise<{ hero: string | null; card1: string | null; card2: string | null }> {
  // Stitch generation happens via Claude MCP — not server-side.
  // This route triggers a background Stitch job by calling /api/admin/generate
  // which Claude will service asynchronously.
  // For now: return null so generate-site falls back to Pexels immediately,
  // then Stitch images are retroactively applied when Claude runs the pipeline.
  return { hero: null, card1: null, card2: null };
}

/**
 * POST /api/generate
 * Called by the onboarding template picker after the user selects a style.
 * Handles the full generation flow based on plan:
 *   - Starter: Pexels images → generate-site
 *   - Pro/Premium: generate-site immediately (with Pexels fallback),
 *                  then Claude runs Stitch pipeline in background
 */
export async function POST(request: Request) {
  try {
    const supabaseUser = await createServerSupabaseClient();
    const { data: { user } } = await supabaseUser.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json() as { business_id: string; template_override?: string };
    const { business_id, template_override } = body;

    if (!business_id) return NextResponse.json({ error: "business_id required" }, { status: 400 });

    const supabase = createAdminClient();

    // Verify the business belongs to this user
    const { data: customer } = await supabase
      .from("customers").select("id").eq("user_id", user.id).single();
    if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

    const { data: business } = await supabase
      .from("businesses").select("id, name, description, industry, city, state")
      .eq("id", business_id).eq("customer_id", customer.id).single();
    if (!business) return NextResponse.json({ error: "Business not found" }, { status: 403 });

    // Get plan
    const { data: sub } = await supabase
      .from("subscriptions").select("plan").eq("customer_id", customer.id).single();
    const plan = (sub?.plan as string) || "starter";

    // Call generate-site with internal secret (bypasses session auth on that route)
    const origin = new URL(request.url).origin;
    const genRes = await fetch(`${origin}/api/generate-site`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": INTERNAL_SECRET,
      },
      body: JSON.stringify({ business_id, template_override }),
    });

    if (!genRes.ok) {
      const err = await genRes.json() as { error?: string };
      throw new Error(err.error || "Site generation failed");
    }

    const genData = await genRes.json() as Record<string, unknown>;

    // For Pro/Premium: queue a Stitch image upgrade job
    // Claude will pick this up and retroactively replace Pexels images with Stitch ones
    if (plan === "pro" || plan === "premium") {
      await supabase.from("generation_jobs").upsert({
        business_id,
        type: "stitch_images",
        status: "pending",
      }, { onConflict: "business_id,type" }).throwOnError().then(() => {}).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      plan,
      ...genData,
    });

  } catch (err) {
    const error = err as Error;
    console.error("/api/generate error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
