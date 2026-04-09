import { NextResponse } from "next/server";
import Stripe from "stripe";

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY not set");
  return new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-02-25.clover" });
}

const PRICE_IDS: Record<string, string | undefined> = {
  starter: process.env.STRIPE_STARTER_PRICE_ID,
  pro:     process.env.STRIPE_PRO_PRICE_ID,
  premium: process.env.STRIPE_PREMIUM_PRICE_ID,
};

export async function POST(request: Request) {
  try {
    const stripe = getStripe();
    const body = await request.json();

    const {
      plan = "pro",
      template = "skeleton-clean",
      businessName,
      industry,
      city,
      state,
      phone,
      email,
      domain,
      description,
      services,
    } = body;

    if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });
    if (!businessName) return NextResponse.json({ error: "Business name is required" }, { status: 400 });

    const priceId = PRICE_IDS[plan];
    if (!priceId) return NextResponse.json({ error: `Unknown plan: ${plan}` }, { status: 400 });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://exsisto.ai";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: {
        // Order metadata — webhook uses all of this to create customer+business
        plan,
        template,
        business_name: businessName.slice(0, 100),
        industry: (industry || "other").slice(0, 50),
        city: (city || "").slice(0, 100),
        state: (state || "").slice(0, 10),
        phone: (phone || "").slice(0, 20),
        email,
        domain: (domain || "").slice(0, 200),
        description: (description || "").slice(0, 500),
        services: (services || "").slice(0, 500),
      },
      subscription_data: {
        metadata: { plan },
      },
      success_url: `${appUrl}/order/confirmed?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/order?cancelled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Order checkout error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
