import { createAdminClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export const maxDuration = 60;

// Generate a URL-safe slug from business name
function makeSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

// Add wildcard domain to Vercel project if not already added
async function ensureWildcardDomain() {
  const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
  const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;
  if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) return;

  try {
    const res = await fetch(
      `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/domains`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${VERCEL_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: "*.exsisto.ai" }),
      }
    );
    // 409 = already exists, that's fine
    if (!res.ok && res.status !== 409) {
      const err = await res.text();
      console.warn("Wildcard domain setup:", err);
    }
  } catch (e) {
    console.warn("Could not add wildcard domain:", e);
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const { business_id } = body;

  if (!business_id) {
    return NextResponse.json({ error: "business_id required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Fetch business
  const { data: business, error: bizErr } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", business_id)
    .single();

  if (bizErr || !business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  // Fetch website HTML
  const { data: website } = await supabase
    .from("websites")
    .select("*")
    .eq("business_id", business_id)
    .single();

  if (!website?.custom_html) {
    return NextResponse.json({ error: "No site HTML found — generate the site first" }, { status: 400 });
  }

  try {
    // Generate subdomain slug (ensure uniqueness by appending random suffix if needed)
    let slug = makeSlug(business.name);

    // Check if slug is taken by another business
    const { data: existing } = await supabase
      .from("businesses")
      .select("id")
      .eq("subdomain", slug)
      .neq("id", business_id)
      .single();

    if (existing) {
      // Append short random suffix
      slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
    }

    const subdomain = slug;
    const siteUrl = `https://${subdomain}.exsisto.ai`;

    // Ensure wildcard domain is set up on Vercel
    await ensureWildcardDomain();

    // Save subdomain + live status to Supabase
    await supabase
      .from("businesses")
      .update({ subdomain, website_url: siteUrl })
      .eq("id", business_id);

    await supabase
      .from("websites")
      .update({
        status: "live",
        vercel_url: siteUrl,
        deployed_at: new Date().toISOString(),
      })
      .eq("business_id", business_id);

    // Send site ready email (non-blocking)
    fetch(`${process.env.NEXT_PUBLIC_APP_URL || "https://www.exsisto.ai"}/api/send-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "site_ready", business_id }),
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      url: siteUrl,
      subdomain,
    });

  } catch (error: any) {
    console.error("Deploy error:", error);

    await supabase
      .from("websites")
      .update({ status: "error" })
      .eq("business_id", business_id);

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
