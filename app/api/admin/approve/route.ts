import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

const ADMIN_SECRET    = process.env.ADMIN_DASHBOARD_SECRET || "exsisto-admin-2026";
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET   || "exsisto-internal-2026";
const APP_URL         = process.env.NEXT_PUBLIC_APP_URL    || "https://www.exsisto.ai";

export const maxDuration = 60;

export async function POST(request: Request) {
  const auth = request.headers.get("x-admin-secret");
  if (auth !== ADMIN_SECRET) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { business_id } = await request.json();
  if (!business_id) return NextResponse.json({ error: "business_id required" }, { status: 400 });

  const origin = new URL(request.url).origin;
  const supabase = createAdminClient();

  try {
    // 1. Deploy (sets status=live, creates subdomain)
    const deployRes = await fetch(`${origin}/api/deploy-site`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-internal-secret": INTERNAL_SECRET },
      body: JSON.stringify({ business_id }),
    });
    const deployData = await deployRes.json() as Record<string, unknown>;
    if (!deployData.success) {
      return NextResponse.json({ error: "Deploy failed", details: deployData }, { status: 500 });
    }

    // 2. Approve all draft blog posts for this business
    await supabase
      .from("blog_posts")
      .update({ post_status: "approved" })
      .eq("business_id", business_id)
      .eq("post_status", "draft");

    // 3. Send site live + DNS email to customer (non-blocking)
    fetch(`${APP_URL}/api/send-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "site_live", business_id }),
    }).catch(() => {});

    // 4. Send account setup / magic link email to customer (non-blocking)
    fetch(`${APP_URL}/api/send-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "account_setup", business_id }),
    }).catch(() => {});

    // 5. Send blog ready email to customer (non-blocking)
    fetch(`${APP_URL}/api/send-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "blog_ready", business_id }),
    }).catch(() => {});

    return NextResponse.json({ success: true, url: deployData.url, subdomain: deployData.subdomain });

  } catch (err: any) {
    console.error("Admin approve error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
