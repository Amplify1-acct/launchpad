import { createAdminClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const { email, password, businessName, industry, city, state, phone, planId, description, years, differentiator, stat, statLabel, services } = body;

  if (!email || !password || !businessName) {
    return NextResponse.json({ error: "email, password, and businessName are required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  try {
    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      if (authError.message?.includes("already registered") || authError.message?.includes("already exists")) {
        return NextResponse.json({ error: "An account with this email already exists. Please log in instead." }, { status: 409 });
      }
      throw authError;
    }

    const userId = authData.user.id;

    // 2. Clean up any orphaned customer record with same email (from deleted auth users)
    await supabase.from("customers").delete().eq("email", email).neq("user_id", userId);

    // 3. Create customer record (upsert to handle edge cases)
    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .upsert({ user_id: userId, email }, { onConflict: "user_id" })
      .select()
      .single();

    if (customerError) {
      console.error("Customer upsert error:", customerError);
      return NextResponse.json({ error: `Account setup failed: ${customerError.message}` }, { status: 500 });
    }

    // 3. Create business record
    const slug = businessName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40);

    const { data: business, error: bizError } = await supabase
      .from("businesses")
      .insert({
        customer_id: customer.id,
        name: businessName,
        industry: industry || "",
        city: city || "",
        state: state || "",
        phone: phone || "",
        email,
        subdomain: slug,
        description: description || `${businessName} — professional ${industry || "services"} in ${city || "your area"}`,
        years_in_business: years || null,
        differentiator: differentiator || null,
        key_stat: stat || null,
        key_stat_label: statLabel || null,
        services: services?.length ? services : null,
      })
      .select()
      .single();

    if (bizError) throw bizError;

    // 4. Create subscription record
    await supabase.from("subscriptions").insert({
      customer_id: customer.id,
      plan: planId || "starter",
      status: "trialing",
      trial_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });

    // 5. Create empty website record
    await supabase.from("websites").insert({
      business_id: business.id,
      status: "pending",
    });

    // 6. Pre-generate images via Nano Banana (non-blocking background task)
    // For known industries: resolves instantly from library URLs
    // For "other": triggers Nano Banana generation and uploads to customer-images bucket
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.exsisto.ai";
    fetch(`${appUrl}/api/generate-images`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": process.env.INTERNAL_API_SECRET || "exsisto-internal-2026",
      },
      body: JSON.stringify({
        businessId: business.id,
        businessName,
        businessType: businessName, // use business name as type; generate-images also accepts bizType
        industry: industry || "other",
        city: city || "",
        services: services || [],
        tier: planId || "starter",
      }),
    }).catch((e) => console.error("Image pre-generation failed (non-fatal):", e));

    // 7. Auto-fetch Google reviews for Premium customers (non-blocking)
    if (planId === "premium") {
      fetch(`${appUrl}/api/fetch-reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-secret": process.env.INTERNAL_API_SECRET || "exsisto-internal-2026",
        },
        body: JSON.stringify({ business_id: business.id }),
      }).catch((e) => console.error("Reviews fetch failed (non-fatal):", e));
    }

    // 8. Send welcome email (non-blocking)
    fetch(`${appUrl}/api/send-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "welcome",
        to: email,
        data: { businessName, plan: planId || "starter" },
      }),
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      businessId: business.id,
      userId,
    });

  } catch (error: any) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: error.message || "Signup failed" }, { status: 500 });
  }
}
