import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

const ADMIN_EMAILS = ["matt@amplifyforlawyers.com", "matt@exsisto.ai"];

export async function GET() {
  // Verify admin
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !ADMIN_EMAILS.includes(user.email || "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch ALL businesses using service role
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("businesses")
    .select("id, name, industry, city, phone, subdomain, email")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ businesses: data });
}
