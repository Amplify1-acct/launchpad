import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

const ADMIN_SECRET    = process.env.ADMIN_DASHBOARD_SECRET || "exsisto-admin-2026";
const GITHUB_TOKEN    = process.env.GITHUB_TOKEN_WORKFLOW  || process.env.GITHUB_TOKEN || "";
const GITHUB_REPO     = "Amplify1-acct/launchpad";
const WORKFLOW_ID     = "generate-client-site.yml";
const APP_URL         = process.env.NEXT_PUBLIC_APP_URL || "https://www.exsisto.ai";

export const maxDuration = 30;

export async function POST(request: Request) {
  const auth = request.headers.get("x-admin-secret");
  if (auth !== ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { business_id, revision_notes } = await request.json();
  if (!business_id) {
    return NextResponse.json({ error: "business_id required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Fetch everything needed for the build
  const { data: business, error: bizErr } = await supabase
    .from("businesses")
    .select("*, customers(email, plan), websites(template_id, plan)")
    .eq("id", business_id)
    .single();

  if (bizErr || !business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  const plan        = (business.customers as any)?.plan || business.websites?.[0]?.plan || "starter";
  const template    = business.websites?.[0]?.template_id || "skeleton-clean";
  const subdomain   = business.subdomain || business.id.slice(0, 8);
  const services    = Array.isArray(business.services)
    ? (business.services as string[]).join(",")
    : (business.services as string) || "";

  // Mark as building
  await supabase
    .from("websites")
    .update({ status: "building" })
    .eq("business_id", business_id);

  // Dispatch GitHub Actions workflow
  const dispatchUrl = `https://api.github.com/repos/${GITHUB_REPO}/actions/workflows/${WORKFLOW_ID}/dispatches`;
  const dispatchBody = {
    ref: "main",
    inputs: {
      business_id,
      business_name: business.name,
      industry:      business.industry || "other",
      tagline:       business.tagline  || "",
      city:          business.city     || "",
      state:         business.state    || "",
      phone:         business.phone    || "",
      email:         (business.customers as any)?.email || "",
      subdomain,
      plan,
      template,
      primary_color: business.primary_color || "#4648d4",
      accent_color:  business.accent_color  || "#6366f1",
      services,
      revision_notes: revision_notes || "",
    },
  };

  const ghRes = await fetch(dispatchUrl, {
    method: "POST",
    headers: {
      "Authorization": `token ${GITHUB_TOKEN}`,
      "Accept": "application/vnd.github.v3+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dispatchBody),
  });

  if (!ghRes.ok) {
    const err = await ghRes.text();
    await supabase.from("websites").update({ status: "error" }).eq("business_id", business_id);
    return NextResponse.json({ error: "GitHub dispatch failed", details: err }, { status: 500 });
  }

  // Send admin notification email
  fetch(`${APP_URL}/api/send-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "admin_building", business_id }),
  }).catch(() => {});

  return NextResponse.json({
    success: true,
    message: `Build started for ${business.name} (${plan} plan, ${template} template)`,
    subdomain,
    plan,
    template,
  });
}
