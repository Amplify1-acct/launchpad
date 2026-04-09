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

    // Use unique email per seed call
    const demoEmail = `demo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@exsisto.ai`;
    const demoPassword = Math.random().toString(36).slice(2) + "Aa1!Zz9#";

    // Create auth user
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email: demoEmail,
      password: demoPassword,
      email_confirm: true,
    });
    if (authErr || !authData?.user) {
      return NextResponse.json({ error: "Auth: " + (authErr?.message || "no user") }, { status: 500 });
    }
    const userId = authData.user.id;

    // Create customer
    const { data: customer, error: custErr } = await supabase
      .from("customers")
      .insert({ email: demoEmail, plan: plan || "pro", user_id: userId })
      .select("id").single();
    if (custErr) return NextResponse.json({ error: "Customer: " + custErr.message }, { status: 500 });

    // Create subscription
    await supabase.from("subscriptions").insert({
      customer_id: customer.id, plan: plan || "pro", status: "active",
    });

    // Create business
    const { data: business, error: bizErr } = await supabase
      .from("businesses")
      .insert({
        customer_id: customer.id, name,
        industry: industry || "other",
        city: city || "", state: state || "",
        phone: phone || "",
        description: description || "",
        services: services || "",
      })
      .select("id").single();
    if (bizErr) return NextResponse.json({ error: "Business: " + bizErr.message }, { status: 500 });

    // Create website
    await supabase.from("websites").insert({
      business_id: business.id, status: "pending", plan: plan || "pro",
    });

    return NextResponse.json({ success: true, business_id: business.id, customer_id: customer.id });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
