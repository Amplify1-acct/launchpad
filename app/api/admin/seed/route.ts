import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

const ADMIN_SECRET = process.env.ADMIN_DASHBOARD_SECRET || "exsisto-admin-2026";

export async function POST(request: Request) {
  const auth = request.headers.get("x-admin-secret");
  if (auth !== ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, industry, city, state, phone, email, description, services, plan } = await request.json();
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

  const supabase = createAdminClient();

  // 1. Create auth user
  const tempPassword = Math.random().toString(36).slice(2) + "Aa1!";
  const { data: authData } = await supabase.auth.admin.createUser({
    email: email || `demo+${Date.now()}@exsisto.ai`,
    password: tempPassword,
    email_confirm: true,
  });
  const userId = authData?.user?.id;

  // 2. Create customer
  const { data: customer } = await supabase
    .from("customers")
    .insert({ email: email || `demo+${Date.now()}@exsisto.ai`, plan: plan || "pro", user_id: userId })
    .select("id").single();

  // 3. Create subscription
  await supabase.from("subscriptions").insert({
    customer_id: customer!.id,
    plan: plan || "pro",
    status: "active",
  });

  // 4. Create business
  const svcArray = (services || "").split(",").map((s: string) => s.trim()).filter(Boolean);
  const { data: business } = await supabase
    .from("businesses")
    .insert({
      customer_id: customer!.id,
      name,
      industry: industry || "other",
      city: city || "",
      state: state || "",
      phone: phone || "",
      email: email || "",
      description: description || "",
      services: svcArray,
    })
    .select("id").single();

  // 5. Create website record
  await supabase.from("websites").insert({
    business_id: business!.id,
    status: "pending",
    plan: plan || "pro",
  });

  return NextResponse.json({
    success: true,
    business_id: business!.id,
    customer_id: customer!.id,
  });
}
