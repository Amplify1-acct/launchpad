import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

const ADMIN_SECRET = process.env.ADMIN_DASHBOARD_SECRET || "exsisto-admin-2026";

export async function POST(request: Request) {
  const auth = request.headers.get("x-admin-secret");
  if (auth !== ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { business_id } = await request.json();
  if (!business_id) {
    return NextResponse.json({ error: "business_id required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Get customer_id and auth user_id before deleting
  const { data: biz } = await supabase
    .from("businesses")
    .select("customer_id")
    .eq("id", business_id)
    .single();

  if (!biz) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  const { data: customer } = await supabase
    .from("customers")
    .select("id, user_id")
    .eq("id", biz.customer_id)
    .single();

  // Delete in FK order
  await supabase.from("social_posts").delete().eq("business_id", business_id);
  await supabase.from("blog_posts").delete().eq("business_id", business_id);
  await supabase.from("websites").delete().eq("business_id", business_id);
  await supabase.from("businesses").delete().eq("id", business_id);

  if (customer) {
    await supabase.from("subscriptions").delete().eq("customer_id", customer.id);
    await supabase.from("customers").delete().eq("id", customer.id);

    // Delete auth user
    if (customer.user_id) {
      await supabase.auth.admin.deleteUser(customer.user_id);
    }
  }

  return NextResponse.json({ success: true });
}
