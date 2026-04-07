import { NextResponse } from "next/server";
import Stripe from "stripe";

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY not set");
  return new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-01-27.acacia" });
}

const PRICE_IDS: Record<string, string | undefined> = {
  starter: process.env.STRIPE_STARTER_PRICE_ID,
  pro:     process.env.STRIPE_PRO_PRICE_ID,
  premium: process.env.STRIPE_PREMIUM_PRICE_ID,
};

export async function POST(request: Request) {
  try {
    const stripe = getStripe();
    const { plan = "pro", email, businessName, businessId } = await request.json();

    const priceId = PRICE_IDS[plan];
    if (!priceId) {
      return NextResponse.json({ error: `Unknown plan: ${plan}` }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://exsisto.ai";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: email || undefined,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: {
        business_id: businessId || "",
        business_name: (businessName || "").slice(0, 100),
        plan,
      },
      subscription_data: {
        metadata: {
          business_id: businessId || "",
          plan,
        },
      },
      success_url: `${appUrl}/dashboard?stripe=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/checkout?plan=${plan}&cancelled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
