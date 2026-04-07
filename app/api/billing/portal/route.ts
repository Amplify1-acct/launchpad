import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient, createServerSupabaseClient } from "@/lib/supabase-server";

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY not set");
  return new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-02-25.clover" });
}

export async function POST(request: Request) {
  try {
    const supabaseClient = await createServerSupabaseClient();
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createAdminClient();
    const { data: customer } = await supabase
      .from("customers").select("id, stripe_customer_id").eq("user_id", user.id).single();
    if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

    const stripe = getStripe();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://exsisto.ai";

    let stripeCustomerId = customer.stripe_customer_id;

    if (!stripeCustomerId) {
      const stripeCustomer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_customer_id: customer.id },
      });
      stripeCustomerId = stripeCustomer.id;
      await supabase.from("customers").update({ stripe_customer_id: stripeCustomerId }).eq("id", customer.id);
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${appUrl}/dashboard/settings?billing=updated`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (err: any) {
    console.error("Portal error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
