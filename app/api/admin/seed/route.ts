import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

const ADMIN_SECRET = process.env.ADMIN_DASHBOARD_SECRET || "exsisto-admin-2026";

export async function POST(request: Request) {
  const auth = request.headers.get("x-admin-secret");
  if (auth !== ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, industry, city, state, phone, description, services, plan } = await request.json();
    if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

    const supabase = createAdminClient();
    const demoEmail = `demo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@exsisto.ai`;

    // 1. Create auth user — the handle_new_user trigger will auto-create a customers row
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email: demoEmail,
      password: Math.random().toString(36).slice(2) + "Aa1!Zz9#",
      email_confirm: true,
    });
    if (authErr || !authData?.user) {
      return NextResponse.json({ error: "Auth: " + (authErr?.message || "no user") }, { status: 500 });
    }
    const userId = authData.user.id;

    // 2. The trigger already created a customer row — just update it with plan
    const { data: customer, error: custErr } = await supabase
      .from("customers")
      .update({ plan: plan || "pro" })
      .eq("user_id", userId)
      .select("id").single();
    if (custErr || !customer) {
      return NextResponse.json({ error: "Customer update: " + (custErr?.message || "not found") }, { status: 500 });
    }

    // 3. Create subscription
    await supabase.from("subscriptions").insert({
      customer_id: customer.id, plan: plan || "pro", status: "active",
    });

    // 4. Create business
    const { data: business, error: bizErr } = await supabase
      .from("businesses")
      .insert({
        customer_id: customer.id, name,
        industry: industry || "other",
        city: city || "", state: state || "",
        phone: phone || "",
        description: description || "",
        services: services ? services.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
      })
      .select("id").single();
    if (bizErr) return NextResponse.json({ error: "Business: " + bizErr.message }, { status: 500 });

    // 5. Create website record
    await supabase.from("websites").insert({
      business_id: business.id, status: "pending", plan: plan || "pro",
    });

    return NextResponse.json({ success: true, business_id: business.id, customer_id: customer.id });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
