import { NextResponse } from "next/server";
import { createAdminClient, createServerSupabaseClient } from "@/lib/supabase-server";

export async function POST(request: Request) {
  const { platform } = await request.json();
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: customer } = await admin.from("customers").select("id").eq("user_id", user.id).single();
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: business } = await admin.from("businesses").select("id").eq("customer_id", customer.id).single();
  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await admin.from("social_accounts").delete()
    .eq("business_id", business.id).eq("platform", platform);

  return NextResponse.json({ success: true });
}
