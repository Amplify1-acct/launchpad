import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

// Blog frequency by plan:
// starter:  2/month  → post if last post > 14 days ago
// pro:      2/week   → post if last post > 3 days ago
// premium:  3/week   → post if last post > 2 days ago
const PLAN_INTERVAL_DAYS: Record<string, number> = {
  starter: 14,
  pro: 3,
  premium: 2,
};

export async function GET(request: Request) {
  // Verify this is called by Vercel Cron
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.exsisto.ai";
  const results: Record<string, any>[] = [];

  // Get all active subscriptions with their businesses
  const { data: subs } = await supabase
    .from("subscriptions")
    .select("customer_id, plan, status")
    .in("status", ["active", "trialing"]);

  if (!subs?.length) {
    return NextResponse.json({ message: "No active subscriptions", generated: 0 });
  }

  for (const sub of subs) {
    const intervalDays = PLAN_INTERVAL_DAYS[sub.plan];
    if (!intervalDays) continue;

    // Get business for this customer
    const { data: biz } = await supabase
      .from("businesses")
      .select("id, name")
      .eq("customer_id", sub.customer_id)
      .single();

    if (!biz) continue;

    // Get the most recent blog post date
    const { data: lastPost } = await supabase
      .from("blog_posts")
      .select("created_at")
      .eq("business_id", biz.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    const daysSinceLast = lastPost
      ? (Date.now() - new Date(lastPost.created_at).getTime()) / (1000 * 60 * 60 * 24)
      : 999; // no posts yet — generate immediately

    if (daysSinceLast < intervalDays) {
      results.push({ business: biz.name, plan: sub.plan, skipped: true, daysSinceLast: Math.round(daysSinceLast) });
      continue;
    }

    // Generate a blog post
    try {
      const res = await fetch(`${appUrl}/api/generate-blog`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-secret": process.env.INTERNAL_API_SECRET || "exsisto-internal-2026",
        },
        body: JSON.stringify({ business_id: biz.id, count: 1 }),
      });
      const data = await res.json();
      results.push({ business: biz.name, plan: sub.plan, generated: true, posts: data.generated });
    } catch (e: any) {
      results.push({ business: biz.name, plan: sub.plan, error: e.message });
    }
  }

  const generated = results.filter(r => r.generated).length;
  const skipped = results.filter(r => r.skipped).length;

  return NextResponse.json({ generated, skipped, total: subs.length, results });
}
