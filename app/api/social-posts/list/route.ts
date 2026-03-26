import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!customer) return NextResponse.json({ error: "No customer" }, { status: 404 });

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, industry, city, state")
    .eq("customer_id", customer.id)
    .single();

  if (!business) return NextResponse.json({ posts: [], business: null });

  const { data: posts } = await supabase
    .from("social_posts")
    .select("*")
    .eq("business_id", business.id)
    .order("scheduled_for", { ascending: true });

  return NextResponse.json({ posts: posts || [], business });
}
