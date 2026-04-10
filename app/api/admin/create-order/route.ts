import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET || "exsisto-internal-2026";
const ADMIN_SECRET    = process.env.ADMIN_DASHBOARD_SECRET || "exsisto-admin-2026";
const APP_URL         = process.env.NEXT_PUBLIC_APP_URL || "https://www.exsisto.ai";

export async function POST(request: Request) {
  const secret = request.headers.get("x-internal-secret") || request.headers.get("x-admin-secret");
  if (secret !== INTERNAL_SECRET && secret !== ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    email, plan = "pro", template = "skeleton-clean",
    business_name, industry, city, state, phone,
    services, subdomain, tagline,
    primary_color, accent_color,
  } = body;

  if (!email || !business_name) {
    return NextResponse.json({ error: "email and business_name required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  try {
    // 1. Create or find auth user
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find((u: any) => u.email === email);
    let authUserId: string;

    if (existingUser) {
      authUserId = existingUser.id;
    } else {
      const tempPassword = Math.random().toString(36).slice(2, 10) + "Aa1!";
      const { data: newUser, error: authErr } = await supabase.auth.admin.createUser({
        email, password: tempPassword, email_confirm: true,
      });
      if (authErr || !newUser?.user) throw new Error("Auth user creation failed: " + authErr?.message);
      authUserId = newUser.user.id;
    }

    // 2. Create or update customer
    let customerId: string;
    const { data: existingCustomer } = await supabase.from("customers").select("id").eq("email", email).single();
    if (existingCustomer) {
      customerId = existingCustomer.id;
      await supabase.from("customers").update({ plan, user_id: authUserId }).eq("id", customerId);
    } else {
      const { data: newCust, error: custErr } = await supabase.from("customers")
        .insert({ email, plan, user_id: authUserId, stripe_customer_id: "demo_" + Date.now() })
        .select("id").single();
      if (custErr || !newCust) throw new Error("Customer creation failed: " + custErr?.message);
      customerId = newCust.id;
    }

    // 3. Create subscription
    const { data: existingSub } = await supabase.from("subscriptions").select("id").eq("customer_id", customerId).single();
    if (!existingSub) {
      await supabase.from("subscriptions").insert({
        customer_id: customerId, plan, status: "active",
        stripe_subscription_id: "demo_sub_" + Date.now(),
      });
    }

    // 4. Create business
    let businessId: string;
    const { data: existingBiz } = await supabase.from("businesses").select("id").eq("customer_id", customerId).single();
    if (existingBiz) {
      businessId = existingBiz.id;
      await supabase.from("businesses").update({
        name: business_name, industry, city, state, phone,
        services, subdomain, tagline,
      }).eq("id", businessId);
    } else {
      const { data: newBiz, error: bizErr } = await supabase.from("businesses")
        .insert({
          customer_id: customerId, name: business_name, industry,
          city, state, phone, services, subdomain, tagline,
        })
        .select("id").single();
      if (bizErr || !newBiz) throw new Error("Business creation failed: " + bizErr?.message);
      businessId = newBiz.id;
    }

    // 5. Create website record
    const { data: existingWebsite } = await supabase.from("websites").select("id").eq("business_id", businessId).single();
    if (!existingWebsite) {
      await supabase.from("websites").insert({ business_id: businessId, status: "pending", template_id: template, plan });
    } else {
      await supabase.from("websites").update({ template_id: template, plan, status: "pending" }).eq("business_id", businessId);
    }

    // 6. Send order confirmation email
    fetch(`${APP_URL}/api/send-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "order_confirmation", business_id: businessId }),
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      business_id: businessId,
      customer_id: customerId,
      plan,
      business_name,
    });

  } catch (err: any) {
    console.error("create-order error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
