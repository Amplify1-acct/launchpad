import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

const ADMIN_SECRET = process.env.ADMIN_DASHBOARD_SECRET || "exsisto-admin-2026";
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET || "exsisto-internal-2026";

export const maxDuration = 90;

export async function GET(request: Request) {
  const auth = request.headers.get("x-admin-secret");
  if (auth !== ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const business_id = searchParams.get("business_id");
  if (!business_id) return NextResponse.json({ error: "business_id required" }, { status: 400 });

  const supabase = createAdminClient();

  const { data: posts, error } = await supabase
    .from("blog_posts")
    .select("id, title, excerpt, content, post_status, created_at")
    .eq("business_id", business_id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ posts: posts || [] });
}

export async function POST(request: Request) {
  const auth = request.headers.get("x-admin-secret");
  if (auth !== ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { business_id, action } = await request.json();
  if (!business_id) return NextResponse.json({ error: "business_id required" }, { status: 400 });

  const supabase = createAdminClient();
  const origin = new URL(request.url).origin;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.exsisto.ai";

  const results: Record<string, any> = {};

  // Fix plan mismatch — sync customers.plan → subscriptions + websites
  if (action === "fix-plan" || action === "all") {
    const { data: biz } = await supabase
      .from("businesses").select("customer_id").eq("id", business_id).single();

    if (biz) {
      const { data: sub } = await supabase
        .from("subscriptions").select("plan").eq("customer_id", biz.customer_id).single();

      const { data: website } = await supabase
        .from("websites").select("plan").eq("business_id", business_id).single();

      // Use website.plan as source of truth (set at checkout)
      const correctPlan = website?.plan || sub?.plan || "starter";

      await supabase.from("customers")
        .update({ plan: correctPlan }).eq("id", biz.customer_id);
      await supabase.from("subscriptions")
        .update({ plan: correctPlan }).eq("customer_id", biz.customer_id);

      results["fix-plan"] = { plan: correctPlan };
    }
  }

  // Regenerate all site pages (home + about + services + contact + blog index)
  if (action === "regenerate-site" || action === "all") {
    const res = await fetch(`${origin}/api/generate-site`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-internal-secret": INTERNAL_SECRET },
      body: JSON.stringify({ business_id }),
    });
    results["regenerate-site"] = await res.json();
  }

  // Generate blog posts
  if (action === "generate-blogs" || action === "all") {
    const res = await fetch(`${appUrl}/api/generate-blog`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-internal-secret": INTERNAL_SECRET },
      body: JSON.stringify({ business_id }),
    });
    results["generate-blogs"] = await res.json();
  }

  // Republish — redeploy the site HTML to Vercel
  if (action === "republish" || action === "all") {
    const res = await fetch(`${origin}/api/deploy-site`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-internal-secret": INTERNAL_SECRET },
      body: JSON.stringify({ business_id }),
    });
    results["republish"] = await res.json();
  }

  return NextResponse.json({ success: true, business_id, action, results });
}
