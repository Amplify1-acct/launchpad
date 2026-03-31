import { NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase-server";

// GET — list connected accounts for this business
export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: customer } = await supabase
    .from("customers").select("id").eq("user_id", user.id).single();
  if (!customer) return NextResponse.json({ accounts: [] });

  const { data: business } = await supabase
    .from("businesses").select("id").eq("customer_id", customer.id).single();
  if (!business) return NextResponse.json({ accounts: [] });

  const { data: accounts } = await supabase
    .from("social_accounts")
    .select("id,platform,account_name,account_picture,page_name,status,connected_at,token_expires_at")
    .eq("business_id", business.id);

  return NextResponse.json({ accounts: accounts || [], business_id: business.id });
}

// DELETE — disconnect an account
export async function DELETE(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { platform } = await request.json();
  if (!platform) return NextResponse.json({ error: "platform required" }, { status: 400 });

  const { data: customer } = await supabase
    .from("customers").select("id").eq("user_id", user.id).single();
  const { data: business } = await supabase
    .from("businesses").select("id").eq("customer_id", customer!.id).single();

  const admin = createAdminClient();
  await admin.from("social_accounts")
    .delete()
    .eq("business_id", business!.id)
    .eq("platform", platform);

  return NextResponse.json({ success: true });
}
