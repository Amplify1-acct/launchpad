import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

const ADMIN_SECRET = process.env.ADMIN_DASHBOARD_SECRET || "exsisto-admin-2026";

export async function GET(request: Request) {
  // Simple secret-based auth for admin API
  const auth = request.headers.get("x-admin-secret");
  if (auth !== ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  const { data: businesses, error } = await supabase
    .from("businesses")
    .select(`
      id,
      name,
      industry,
      city,
      state,
      phone,
      custom_domain,
      subdomain,
      website_url,
      created_at,
      customers (
        id,
        email,
        plan,
        created_at
      ),
      websites (
        id,
        status,
        template_id,
        vercel_url,
        custom_html,
        deployed_at,
        plan
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ businesses: businesses || [] });
}
