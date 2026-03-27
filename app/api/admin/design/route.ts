import { createAdminClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

// This endpoint is called externally (from Claude/admin) to save
// Stitch-generated designs for a business
// POST { business_id, project_id, screens: [{id, thumbnail, label, html}] }

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { business_id, project_id, screens } = await request.json();
  if (!business_id || !project_id || !screens?.length)
    return NextResponse.json({ error: "business_id, project_id, screens required" }, { status: 400 });

  const supabase = createAdminClient();

  await supabase.from("websites").update({
    status: "picking_template",
    stitch_project_id: project_id,
    stitch_screens: screens,
  }).eq("business_id", business_id);

  return NextResponse.json({ success: true });
}

// GET ?business_id=xxx — returns business info for design generation
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const business_id = searchParams.get("business_id");

  // If no business_id, return all that need design
  const supabase = createAdminClient();

  if (business_id) {
    const { data: business } = await supabase
      .from("businesses").select("*, websites(status, stitch_project_id, stitch_screens)")
      .eq("id", business_id).single();
    return NextResponse.json({ business });
  }

  const { data: websites } = await supabase
    .from("websites")
    .select("business_id, status, businesses(id, name, description, city, state, phone, tagline, accent_color)")
    .eq("status", "needs_design")
    .limit(10);

  return NextResponse.json({ pending: websites || [] });
}
