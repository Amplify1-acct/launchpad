import { NextResponse } from "next/server";
import { createAdminClient, createServerSupabaseClient } from "@/lib/supabase-server";

export async function POST(request: Request) {
  try {
    const supabaseClient = await createServerSupabaseClient();
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { blog_approval_mode, social_approval_mode } = await request.json();

    const supabase = createAdminClient();
    const { data: customer } = await supabase
      .from("customers").select("id").eq("user_id", user.id).single();
    if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

    const updates: Record<string, string> = {};
    if (blog_approval_mode) updates.blog_approval_mode = blog_approval_mode;
    if (social_approval_mode) updates.social_approval_mode = social_approval_mode;

    await supabase.from("customers").update(updates).eq("id", customer.id);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabaseClient = await createServerSupabaseClient();
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createAdminClient();
    const { data: customer } = await supabase
      .from("customers")
      .select("blog_approval_mode, social_approval_mode")
      .eq("user_id", user.id).single();

    return NextResponse.json({
      blog_approval_mode: customer?.blog_approval_mode || "manual",
      social_approval_mode: customer?.social_approval_mode || "manual",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
