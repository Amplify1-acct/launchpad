import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

const ADMIN_SECRET = process.env.ADMIN_DASHBOARD_SECRET || "exsisto-admin-2026";
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET || "exsisto-internal-2026";

export const maxDuration = 90;

export async function POST(request: Request) {
  const auth = request.headers.get("x-admin-secret");
  if (auth !== ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { business_id } = await request.json();
  if (!business_id) {
    return NextResponse.json({ error: "business_id required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Mark as building
  await supabase
    .from("websites")
    .update({ status: "building" })
    .eq("business_id", business_id);

  // Get business + template preference
  const { data: website } = await supabase
    .from("websites")
    .select("template_id, plan")
    .eq("business_id", business_id)
    .single();

  const origin = new URL(request.url).origin;

  try {
    // Run generate-site with template override
    const genRes = await fetch(`${origin}/api/generate-site`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": INTERNAL_SECRET,
      },
      body: JSON.stringify({
        business_id,
        template_override: website?.template_id || null,
      }),
    });

    const genData = await genRes.json() as Record<string, unknown>;

    if (!genData.success) {
      await supabase
        .from("websites")
        .update({ status: "error" })
        .eq("business_id", business_id);
      return NextResponse.json({ error: "Generation failed", details: genData }, { status: 500 });
    }

    // Mark as ready for admin review (NOT customer-facing yet)
    await supabase
      .from("websites")
      .update({ status: "admin_review" })
      .eq("business_id", business_id);

    return NextResponse.json({
      success: true,
      business_id,
      tokens: genData.tokens_generated || 0,
    });

  } catch (err: any) {
    await supabase
      .from("websites")
      .update({ status: "error" })
      .eq("business_id", business_id);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
