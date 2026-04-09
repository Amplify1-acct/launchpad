import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase-server";

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY not set");
  return new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-02-25.clover" });
}

export async function POST(request: Request) {
  const stripe = getStripe();
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

  // ── Payment success ──────────────────────────────────────────────────────
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const meta = session.metadata || {};
    const email = session.customer_email || meta.email;
    const plan = (meta.plan || "starter") as string;
    const stripeCustomerId = session.customer as string;
    const stripeSubscriptionId = session.subscription as string;

    console.log(`New order: ${email} plan=${plan}`);

    if (!email) {
      console.error("No email in session");
      return NextResponse.json({ received: true });
    }

    try {
      // ── 1. Create or find auth user ──────────────────────────────────────
      // Generate a temporary random password — customer will use magic link
      const tempPassword = Math.random().toString(36).slice(2, 10) +
                           Math.random().toString(36).slice(2, 10).toUpperCase() + "!1";

      let authUserId: string;

      // Try to find existing auth user first
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(u => u.email === email);

      if (existingUser) {
        authUserId = existingUser.id;
        console.log(`Found existing auth user: ${authUserId}`);
      } else {
        const { data: newUser, error: authErr } = await supabase.auth.admin.createUser({
          email,
          password: tempPassword,
          email_confirm: true,
        });
        if (authErr || !newUser?.user) {
          console.error("Failed to create auth user:", authErr);
          throw new Error(`Auth user creation failed: ${authErr?.message}`);
        }
        authUserId = newUser.user.id;
        console.log(`Created auth user: ${authUserId}`);
      }

      // ── 2. Create or find customer record ────────────────────────────────
      let customerId: string;

      const { data: existingCustomer } = await supabase
        .from("customers")
        .select("id")
        .eq("email", email)
        .single();

      if (existingCustomer) {
        customerId = existingCustomer.id;
        await supabase
          .from("customers")
          .update({
            plan,
            stripe_customer_id: stripeCustomerId,
            user_id: authUserId,
          })
          .eq("id", customerId);
      } else {
        const { data: newCustomer, error: custErr } = await supabase
          .from("customers")
          .insert({
            email,
            plan,
            stripe_customer_id: stripeCustomerId,
            user_id: authUserId,
          })
          .select("id")
          .single();

        if (custErr || !newCustomer) {
          throw new Error(`Customer creation failed: ${custErr?.message}`);
        }
        customerId = newCustomer.id;
      }

      // ── 3. Create or find subscription ──────────────────────────────────
      const { data: existingSub } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("customer_id", customerId)
        .single();

      if (existingSub) {
        await supabase
          .from("subscriptions")
          .update({
            stripe_customer_id: stripeCustomerId,
            stripe_subscription_id: stripeSubscriptionId,
            plan,
            status: "active",
          })
          .eq("id", existingSub.id);
      } else {
        await supabase
          .from("subscriptions")
          .insert({
            customer_id: customerId,
            stripe_customer_id: stripeCustomerId,
            stripe_subscription_id: stripeSubscriptionId,
            plan,
            status: "active",
          });
      }

      // ── 4. Create or find business record ───────────────────────────────
      let businessId: string;

      const { data: existingBiz } = await supabase
        .from("businesses")
        .select("id")
        .eq("customer_id", customerId)
        .single();

      if (existingBiz) {
        businessId = existingBiz.id;
        await supabase
          .from("businesses")
          .update({
            name: meta.business_name || "My Business",
            industry: meta.industry || "other",
            city: meta.city || "",
            state: meta.state || "",
            phone: meta.phone || "",
            description: meta.description || "",
            services: meta.services || "",
          })
          .eq("id", businessId);
      } else {
        const { data: newBiz, error: bizErr } = await supabase
          .from("businesses")
          .insert({
            customer_id: customerId,
            name: meta.business_name || "My Business",
            industry: meta.industry || "other",
            city: meta.city || "",
            state: meta.state || "",
            phone: meta.phone || "",
            description: meta.description || "",
            services: meta.services || "",
          })
          .select("id")
          .single();

        if (bizErr || !newBiz) {
          throw new Error(`Business creation failed: ${bizErr?.message}`);
        }
        businessId = newBiz.id;
      }

      // ── 5. Create websites record with template preference ───────────────
      const { data: existingWebsite } = await supabase
        .from("websites")
        .select("id")
        .eq("business_id", businessId)
        .single();

      if (!existingWebsite) {
        await supabase
          .from("websites")
          .insert({
            business_id: businessId,
            status: "pending",
            template_id: meta.template || "skeleton-clean",
            plan,
          });
      } else {
        await supabase
          .from("websites")
          .update({
            template_id: meta.template || "skeleton-clean",
            plan,
            status: "pending",
          })
          .eq("business_id", businessId);
      }

      // ── 6. Store domain preference if provided ───────────────────────────
      if (meta.domain) {
        await supabase
          .from("businesses")
          .update({ custom_domain: meta.domain })
          .eq("id", businessId);
      }

      console.log(`✅ Order saved: customer=${customerId} business=${businessId} plan=${plan}`);

      // ── 7. Send confirmation email to customer ───────────────────────────
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.exsisto.ai";
      fetch(`${appUrl}/api/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "order_confirmation", business_id: businessId }),
      }).catch(() => {});

      // ── 8. Send magic link / account setup email to customer ─────────────
      fetch(`${appUrl}/api/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "account_setup", business_id: businessId }),
      }).catch(() => {});

      // ── 9. Notify Matt (admin notification) ─────────────────────────────
      fetch(`${appUrl}/api/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "admin_new_order", business_id: businessId }),
      }).catch(() => {});

    } catch (err: any) {
      console.error("Post-payment setup failed:", err);
      // Still return 200 so Stripe doesn't retry — log and investigate
    }
  }

  // ── Subscription canceled ────────────────────────────────────────────────
  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    await supabase
      .from("subscriptions")
      .update({ status: "canceled", canceled_at: new Date().toISOString() })
      .eq("stripe_subscription_id", sub.id);
  }

  // ── Payment failed ───────────────────────────────────────────────────────
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

  // ── Subscription updated ─────────────────────────────────────────────────
  if (event.type === "customer.subscription.updated") {
    const sub = event.data.object as Stripe.Subscription;
    const newPlan = sub.metadata?.plan;
    if (newPlan) {
      await supabase
        .from("subscriptions")
        .update({ plan: newPlan, status: sub.status })
        .eq("stripe_subscription_id", sub.id);
    }
  }

  return NextResponse.json({ received: true });
}
