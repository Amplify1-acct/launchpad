import { NextResponse } from "next/server";
import Stripe from "stripe";

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY not set");
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-02-25.clover",
  });
}

const PLANS = {
  starter: {
    name: "Starter",
    price: 29900, // $299/mo in cents
    priceId: process.env.STRIPE_STARTER_PRICE_ID,
  },
  growth: {
    name: "Growth",
    price: 59900,
    priceId: process.env.STRIPE_GROWTH_PRICE_ID,
  },
  premium: {
    name: "Premium",
    price: 99900,
    priceId: process.env.STRIPE_PREMIUM_PRICE_ID,
  },
};

export async function POST(request: Request) {
  const stripe = getStripe();
  const { plan = "growth", siteData, email, businessName } = await request.json();

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  const planConfig = PLANS[plan as keyof typeof PLANS] || PLANS.growth;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://exsisto.ai";

  // Store site data in Stripe metadata so we can retrieve it after payment
  // Stripe metadata values are limited to 500 chars, so we store a reference key
  // and store the full data in a temporary DB record
  const { createAdminClient } = await import("@/lib/supabase-server");
  const supabase = createAdminClient();

  // Save pending site data to Supabase so webhook can retrieve it
  const { data: pendingSite, error: dbError } = await supabase
    .from("pending_sites")
    .insert({
      business_name: businessName,
      email: email,
      plan: plan,
      site_data: siteData,
      status: "awaiting_payment",
    })
    .select("id")
    .single();

  if (dbError) {
    console.error("Failed to save pending site:", dbError);
    return NextResponse.json({ error: "Failed to create checkout" }, { status: 500 });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: email || undefined,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Exsisto ${planConfig.name} Plan`,
              description: `Website, weekly blog posts, social media management — fully done for you. Serving ${businessName}.`,
              images: ["https://exsisto.ai/og-image.png"],
            },
            unit_amount: planConfig.price,
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      metadata: {
        pending_site_id: pendingSite.id,
        business_name: businessName.slice(0, 100),
        plan,
      },
      subscription_data: {
        metadata: {
          pending_site_id: pendingSite.id,
          business_name: businessName.slice(0, 100),
        },
        trial_period_days: 7,
      },
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/preview`,
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (err: any) {
    console.error("Stripe error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
