import { createAdminClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export const maxDuration = 30;

export async function POST(request: Request) {
  const body = await request.json();
  const { business_id } = body;

  if (!business_id) {
    return NextResponse.json({ error: "business_id required" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.exsisto.ai";

  const { data: business, error: bizErr } = await supabase
    .from("businesses")
    .select("*, websites(*)")
    .eq("id", business_id)
    .single();

  if (bizErr || !business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  const subdomain = business.subdomain;
  if (!subdomain) {
    return NextResponse.json({ error: "No subdomain set — site not built yet" }, { status: 400 });
  }

  const siteUrl = `${APP_URL}/sites/${subdomain}`;

  try {
    // 1. Mark website as live
    await supabase
      .from("websites")
      .update({
        status: "live",
        vercel_url: siteUrl,
        deployed_at: new Date().toISOString(),
      })
      .eq("business_id", business_id);

    // 2. Update business website_url
    await supabase
      .from("businesses")
      .update({ website_url: siteUrl })
      .eq("id", business_id);

    // 3. Approve all draft blog posts
    await supabase
      .from("blog_posts")
      .update({ status: "approved" })
      .eq("business_id", business_id)
      .eq("status", "draft");

    return NextResponse.json({ success: true, url: siteUrl, subdomain });

  } catch (error: any) {
    console.error("Deploy error:", error);
    await supabase.from("websites").update({ status: "error" }).eq("business_id", business_id);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
