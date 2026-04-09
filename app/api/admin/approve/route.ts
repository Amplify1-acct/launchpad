import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

const ADMIN_SECRET = process.env.ADMIN_DASHBOARD_SECRET || "exsisto-admin-2026";
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET || "exsisto-internal-2026";

export const maxDuration = 60;

export async function POST(request: Request) {
  const auth = request.headers.get("x-admin-secret");
  if (auth !== ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { business_id } = await request.json();
  if (!business_id) {
    return NextResponse.json({ error: "business_id required" }, { status: 400 });
  }

  const origin = new URL(request.url).origin;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.exsisto.ai";

  try {
    // 1. Deploy site to Vercel (creates subdomain + sets status=live)
    const deployRes = await fetch(`${origin}/api/deploy-site`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": INTERNAL_SECRET,
      },
      body: JSON.stringify({ business_id }),
    });

    const deployData = await deployRes.json() as Record<string, unknown>;
    if (!deployData.success) {
      return NextResponse.json({ error: "Deploy failed", details: deployData }, { status: 500 });
    }

    // 2. Send "site live + DNS instructions" email to customer
    fetch(`${appUrl}/api/send-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "site_live", business_id }),
    }).catch(() => {});

    // 3. Send magic link so customer can log into dashboard
    fetch(`${appUrl}/api/send-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "account_setup", business_id }),
    }).catch(() => {});

    // 4. Kick off blog generation (non-blocking)
    fetch(`${appUrl}/api/generate-blog`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": INTERNAL_SECRET,
      },
      body: JSON.stringify({ business_id }),
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      url: deployData.url,
      subdomain: deployData.subdomain,
    });

  } catch (err: any) {
    console.error("Admin approve error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
