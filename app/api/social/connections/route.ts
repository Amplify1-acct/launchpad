import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const businessId = searchParams.get("business_id");

  if (!businessId) return NextResponse.json({ error: "business_id required" }, { status: 400 });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("social_connections")
    .select("platform, platform_username, platform_page_name, connected_at, token_expires_at")
    .eq("business_id", businessId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ connections: data || [] });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const businessId = searchParams.get("business_id");
  const platform = searchParams.get("platform");

  if (!businessId || !platform) {
    return NextResponse.json({ error: "business_id and platform required" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("social_connections")
    .delete()
    .eq("business_id", businessId)
    .eq("platform", platform);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
