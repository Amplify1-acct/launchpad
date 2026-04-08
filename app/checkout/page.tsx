"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: "$99",
    period: "/mo",
    description: "A professional website with fresh content to get your business found online.",
    features: [
      "3-page AI website (Home, About, Blog)",
      "2 AI images",
      "2 blog posts per month",
      "Custom domain included",
      "Basic SEO",
    ],
    highlight: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$299",
    period: "/mo",
    description: "A full website with regular content and advanced SEO to grow your presence.",
    features: [
      "8-page AI website + service pages",
      "8 AI images",
      "2 blog posts per week",
      "On-site SEO & Schema markup",
      "Custom domain included",
    ],
    highlight: true,
  },
  {
    id: "premium",
    name: "Premium",
    price: "$599",
    period: "/mo",
    description: "Full digital presence with local SEO, Google Reviews, and GBP posting.",
    features: [
      "12-page AI website + service pages",
      "12 AI images",
      "3 blog posts per week",
      "On-site SEO & Schema markup",
      "Local Google SEO + GBP posting",
      "Google Reviews auto-displayed",
      "Custom domain included",
      "Social media (coming soon)",
    ],
    highlight: false,
  },
];

function CheckoutContent() {
  const searchParams = useSearchParams();
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessId, setBusinessId] = useState("");

  useEffect(() => {
    const stored = sessionStorage.getItem("exsisto_pending_site");
    if (stored) {
      const parsed = JSON.parse(stored);
      setBusinessName(parsed.businessName || "");
      setEmail(parsed.email || "");
      setBusinessId(parsed.businessId || "");
    }
    const plan = searchParams.get("plan");
    if (plan && PLANS.find(p => p.id === plan)) setSelectedPlan(plan);
    if (searchParams.get("cancelled")) setError("Payment cancelled. Please try again.");
  }, [searchParams]);

  async function handleCheckout() {
    if (!email) { setError("Please enter your email address."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selectedPlan, email, businessName, businessId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create checkout");
      window.location.href = data.url;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  const plan = PLANS.find(p => p.id === selectedPlan) || PLANS.find(p => p.id === "pro") || PLANS[1];

  return (
    <div style={{ minHeight: "100vh", background: "#f8f8f6", fontFamily: "\'DM Sans\', sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e4e4e0", padding: "1rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <a href="/" style={{ fontWeight: 700, fontSize: "1.25rem", color: "#18181b", textDecoration: "none" }}>
          Exsisto<span style={{ color: "#6366f1" }}>.</span>
        </a>
        <span style={{ fontSize: "0.85rem", color: "#6b7280" }}>Secure checkout powered by Stripe</span>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "2.5rem 1.5rem", display: "grid", gridTemplateColumns: "1fr 380px", gap: "2rem" }}>
        {/* Left — Plan picker */}
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 700, marginBottom: "0.5rem" }}>Choose your plan</h1>
          <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>All plans include a 7-day free trial. Cancel anytime.</p>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {PLANS.map(p => (
              <div
                key={p.id}
                onClick={() => setSelectedPlan(p.id)}
                style={{
                  border: selectedPlan === p.id ? "2px solid #6366f1" : "2px solid #e4e4e0",
                  borderRadius: 12,
                  padding: "1.25rem 1.5rem",
                  background: "#fff",
                  cursor: "pointer",
                  position: "relative",
                }}
              >
                {p.highlight && (
                  <span style={{ position: "absolute", top: -10, left: 20, background: "#6366f1", color: "#fff", fontSize: "0.7rem", fontWeight: 700, padding: "2px 10px", borderRadius: 20 }}>MOST POPULAR</span>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "1rem" }}>{p.name}</div>
                    <div style={{ fontSize: "0.85rem", color: "#6b7280", marginTop: 2 }}>{p.description}</div>
                    <ul style={{ margin: "0.75rem 0 0", padding: 0, listStyle: "none", display: "flex", flexWrap: "wrap", gap: "0.35rem 1rem" }}>
                      {p.features.map(f => (
                        <li key={f} style={{ fontSize: "0.8rem", color: "#374151" }}>✓ {f}</li>
                      ))}
                    </ul>
                  </div>
                  <div style={{ textAlign: "right", marginLeft: "1rem", flexShrink: 0 }}>
                    <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "#18181b" }}>{p.price}</span>
                    <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>{p.period}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Summary + pay */}
        <div>
          <div style={{ background: "#fff", border: "1px solid #e4e4e0", borderRadius: 12, padding: "1.5rem", position: "sticky", top: "1.5rem" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem" }}>Order summary</h2>

            <div style={{ fontSize: "0.9rem", color: "#374151", marginBottom: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span>{plan.name} Plan</span>
                <span style={{ fontWeight: 600 }}>{plan.price}/mo</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#6b7280" }}>
                <span>7-day free trial</span>
                <span>$0 today</span>
              </div>
            </div>

            <div style={{ borderTop: "1px solid #e4e4e0", paddingTop: "1rem", marginBottom: "1.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
                <span>Due today</span>
                <span>$0.00</span>
              </div>
              <div style={{ fontSize: "0.78rem", color: "#6b7280", marginTop: 4 }}>
                Then {plan.price}/mo starting after trial
              </div>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ fontSize: "0.8rem", fontWeight: 600, display: "block", marginBottom: 4 }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={{ width: "100%", padding: "0.6rem 0.75rem", border: "1px solid #d1d5db", borderRadius: 8, fontSize: "0.9rem", boxSizing: "border-box" }}
              />
            </div>

            {error && (
              <div style={{ background: "#fef2f2", color: "#dc2626", padding: "0.6rem 0.75rem", borderRadius: 8, fontSize: "0.85rem", marginBottom: "1rem" }}>
                {error}
              </div>
            )}

            <button
              onClick={handleCheckout}
              disabled={loading}
              style={{
                width: "100%",
                background: loading ? "#a5b4fc" : "#6366f1",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "0.85rem",
                fontSize: "1rem",
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Redirecting to Stripe..." : "Continue to payment →"}
            </button>

            <p style={{ fontSize: "0.75rem", color: "#9ca3af", textAlign: "center", marginTop: "0.75rem" }}>
              🔒 Secured by Stripe. Cancel anytime.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>Loading...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
