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
    const email = session.customer_email;
    const plan = (session.metadata?.plan || "starter") as string;
    const businessId = session.metadata?.business_id;
    const stripeCustomerId = session.customer as string;
    const stripeSubscriptionId = session.subscription as string;

    console.log(`Payment completed: ${email} plan=${plan} biz=${businessId}`);

    if (!email) {
      console.error("No email in session");
      return NextResponse.json({ received: true });
    }

    try {
      // Find customer by email
      const { data: customer, error: custErr } = await supabase
        .from("customers")
        .select("id")
        .eq("email", email)
        .single();

      if (custErr || !customer) {
        console.error("Customer not found for email:", email, custErr);
        return NextResponse.json({ received: true });
      }

      // Check if subscription already exists for this customer
      const { data: existingSub } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("customer_id", customer.id)
        .single();

      const trialEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      if (existingSub) {
        // Update existing subscription with real Stripe IDs + correct plan
        await supabase
          .from("subscriptions")
          .update({
            stripe_customer_id: stripeCustomerId,
            stripe_subscription_id: stripeSubscriptionId,
            plan,
            status: "trialing",
            trial_end: trialEnd,
          })
          .eq("id", existingSub.id);
      } else {
        // Create new subscription
        await supabase
          .from("subscriptions")
          .insert({
            customer_id: customer.id,
            stripe_customer_id: stripeCustomerId,
            stripe_subscription_id: stripeSubscriptionId,
            plan,
            status: "trialing",
            trial_end: trialEnd,
          });
      }

      // Update customer record with plan + stripe customer ID
      await supabase
        .from("customers")
        .update({
          plan,
          stripe_customer_id: stripeCustomerId,
        })
        .eq("id", customer.id);

      console.log(`✅ Subscription saved: customer=${customer.id} plan=${plan}`);

      // Kick off site generation
      const targetBizId = businessId || await (async () => {
        const { data: biz } = await supabase
          .from("businesses")
          .select("id")
          .eq("customer_id", customer.id)
          .single();
        return biz?.id;
      })();

      if (targetBizId) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.exsisto.ai";
        // Non-blocking: generate site
        fetch(`${appUrl}/api/generate-site`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-internal-secret": process.env.INTERNAL_API_SECRET || "exsisto-internal-2026",
          },
          body: JSON.stringify({ business_id: targetBizId }),
        }).catch(e => console.error("Site generation failed:", e));

        // Non-blocking: generate blog posts
        fetch(`${appUrl}/api/generate-blog`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-internal-secret": process.env.INTERNAL_API_SECRET || "exsisto-internal-2026",
          },
          body: JSON.stringify({ business_id: targetBizId }),
        }).catch(e => console.error("Blog generation failed:", e));

        // Non-blocking: fetch Google reviews
        fetch(`${appUrl}/api/fetch-reviews`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-internal-secret": process.env.INTERNAL_API_SECRET || "exsisto-internal-2026",
          },
          body: JSON.stringify({ business_id: targetBizId }),
        }).catch(e => console.error("Reviews fetch failed:", e));
      }

    } catch (err: any) {
      console.error("Post-payment setup failed:", err);
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

  // ── Subscription updated (plan change) ──────────────────────────────────
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
