import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

const ADMIN_SECRET = process.env.ADMIN_DASHBOARD_SECRET || "exsisto-admin-2026";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN_WORKFLOW || process.env.GITHUB_TOKEN || "";
const GITHUB_REPO  = "Amplify1-acct/launchpad";

export const maxDuration = 30;

export async function POST(request: Request) {
  const auth = request.headers.get("x-admin-secret");
  if (auth !== ADMIN_SECRET) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { business_id, notes, image_slot } = await request.json();
  if (!business_id || !notes) return NextResponse.json({ error: "business_id and notes required" }, { status: 400 });

  const supabase = createAdminClient();
  const { data: business } = await supabase.from("businesses").select("*").eq("id", business_id).single();
  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  const { data: sub } = await supabase.from("subscriptions").select("plan").eq("customer_id", business.customer_id).single();
  const { data: website } = await supabase.from("websites").select("template_id, plan").eq("business_id", business_id).single();

  const plan      = sub?.plan || website?.plan || "pro";
  const template  = website?.template_id || "skeleton-clean";
  const subdomain = business.subdomain;
  const services  = Array.isArray(business.services)
    ? business.services.join(",")
    : (business.services as string) || "";

  // Dispatch GitHub Actions — but with SKIP_IMAGES=true and the revision notes
  // The generator will reuse existing Supabase image URLs instead of generating new ones
  const dispatchRes = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/actions/workflows/generate-client-site.yml/dispatches`,
    {
      method: "POST",
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ref: "main",
        inputs: {
          business_id,
          business_name:  business.name,
          industry:       business.industry || "other",
          tagline:        business.tagline  || "",
          city:           business.city     || "",
          state:          business.state    || "",
          phone:          business.phone    || "",
          email:          (business as any).email || "",
          subdomain,
          plan,
          template,
          primary_color:  (business as any).primary_color || "#4648d4",
          accent_color:   (business as any).accent_color  || "#6366f1",
          services,
          revision_notes: notes,
          skip_images:    image_slot ? "" : "true",
          replace_image_slot: image_slot || "",
        },
      }),
    }
  );

  if (!dispatchRes.ok) {
    const err = await dispatchRes.text();
    return NextResponse.json({ error: "GitHub dispatch failed: " + err }, { status: 500 });
  }

  // Mark as building
  await supabase.from("websites").update({ status: "building" }).eq("business_id", business_id);

  return NextResponse.json({
    success: true,
    message: "Quick edit build started. Takes 3-5 min. You\'ll get an email when ready.",
  });
}
