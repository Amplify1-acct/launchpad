import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase-server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    console.error("Webhook signature failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createAdminClient();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const pendingSiteId = session.metadata?.pending_site_id;
    const email = session.customer_email;

    if (!pendingSiteId) {
      console.error("No pending_site_id in session metadata");
      return NextResponse.json({ received: true });
    }

    // Get the pending site data
    const { data: pendingSite } = await supabase
      .from("pending_sites")
      .select("*")
      .eq("id", pendingSiteId)
      .single();

    if (!pendingSite) {
      console.error("Pending site not found:", pendingSiteId);
      return NextResponse.json({ received: true });
    }

    try {
      // 1. Create Supabase user account
      const tempPassword = Math.random().toString(36).slice(-12) + "!A1";
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email || pendingSite.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { full_name: pendingSite.business_name },
      });

      if (authError) throw authError;
      const userId = authData.user.id;

      // 2. Get customer record (auto-created by trigger)
      await new Promise(r => setTimeout(r, 1000)); // wait for trigger
      const { data: customer } = await supabase
        .from("customers")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (!customer) throw new Error("Customer not created");

      // 3. Create business record from site data
      const sd = pendingSite.site_data;
      const { data: business } = await supabase
        .from("businesses")
        .insert({
          customer_id: customer.id,
          name: sd.business?.name || pendingSite.business_name,
          description: sd.business?.description || "",
          industry: pendingSite.site_data?.industry || "",
          tagline: sd.business?.tagline || "",
          accent_color: sd.business?.accent_color || "#2563eb",
          phone: sd.business?.phone || "",
          email: sd.business?.email || "",
          city: sd.business?.city || "",
          state: sd.business?.state || "",
        })
        .select("id")
        .single();

      if (!business) throw new Error("Business not created");

      // 4. Create subscription record
      await supabase.from("subscriptions").insert({
        customer_id: customer.id,
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: session.subscription as string,
        plan: pendingSite.plan || "growth",
        status: "trialing",
      });

      // 5. Save website content to DB
      await supabase.from("websites").insert({
        business_id: business.id,
        status: "generating",
        services: sd.website?.services || [],
        stats: sd.website?.stats || [],
        testimonials: [],
        meta_title: sd.website?.meta_title || "",
        meta_description: sd.website?.meta_description || "",
        keywords: sd.website?.keywords || [],
      });

      // 6. Kick off site deployment (non-blocking)
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://exsisto.ai";
      fetch(`${appUrl}/api/deploy-site`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_id: business.id,
          pages: sd.pages, // pass pre-generated HTML pages directly
        }),
      }).catch(e => console.error("Deploy failed:", e));

      // 7. Send magic link email so user can access their dashboard
      await supabase.auth.admin.generateLink({
        type: "magiclink",
        email: email || pendingSite.email,
        options: { redirectTo: `${appUrl}/dashboard` },
      });

      // 8. Mark pending site as converted
      await supabase
        .from("pending_sites")
        .update({
          status: "converted",
          user_id: userId,
          business_id: business.id,
          converted_at: new Date().toISOString(),
        })
        .eq("id", pendingSiteId);

      console.log(`✅ New customer onboarded: ${email} → business ${business.id}`);

    } catch (err: any) {
      console.error("Post-payment setup failed:", err);
      await supabase
        .from("pending_sites")
        .update({ status: "error", error: err.message })
        .eq("id", pendingSiteId);
    }
  }

  // Handle subscription cancellation
  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    await supabase
      .from("subscriptions")
      .update({ status: "canceled", canceled_at: new Date().toISOString() })
      .eq("stripe_subscription_id", sub.id);
  }

  // Handle payment failure
  if (event.type === "invoice.payment_failed") {
    const invoice = event.data.object as Stripe.Invoice;
    const subId = (invoice as any).subscription;
    if (subId) {
      await supabase
        .from("subscriptions")
        .update({ status: "past_due" })
        .eq("stripe_subscription_id", subId);
    }
  }

  return NextResponse.json({ received: true });
}
