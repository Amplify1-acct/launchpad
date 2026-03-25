import { createAdminClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const business_id = searchParams.get("business_id");

  if (!business_id) {
    return NextResponse.json({ error: "business_id required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: website } = await supabase
    .from("websites")
    .select("status, vercel_url, deployed_at, meta_title")
    .eq("business_id", business_id)
    .single();

  const { data: jobs } = await supabase
    .from("generation_jobs")
    .select("type, status, error")
    .eq("business_id", business_id)
    .order("created_at", { ascending: false })
    .limit(10);

  return NextResponse.json({
    website: website || null,
    jobs: jobs || [],
  });
}
