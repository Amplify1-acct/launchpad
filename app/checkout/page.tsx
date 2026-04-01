"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: "$99",
    period: "/mo",
    description: "Perfect for solo operators and small businesses just getting started online.",
    features: [
      "Professional 5-page website",
      "1 AI image",
      "2 blog posts per month",
      "8 social posts per month",
      "On-page SEO",
    ],
    highlight: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$299",
    period: "/mo",
    description: "The most popular plan for growing businesses serious about their online presence.",
    features: [
      "Full Stitch AI template",
      "3 AI images",
      "4 blog posts per month",
      "16 social posts per month",
      "Advanced SEO",
      "Gallery + stats sections",
    ],
    highlight: true,
  },
  {
    id: "premium",
    name: "Premium",
    price: "$599",
    period: "/mo",
    description: "Full-service digital presence for businesses that want to dominate their market.",
    features: [
      "Full Stitch AI template",
      "6 AI images",
      "8 blog posts per month",
      "32 social posts per month",
      "Priority support",
      "Before/after gallery",
    ],
    highlight: false,
  },
];

function CheckoutContent() {
  const searchParams = useSearchParams();
  const [selectedPlan, setSelectedPlan] = useState("growth");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");

  // Site data passed from preview page via sessionStorage
  const [siteData, setSiteData] = useState<any>(null);
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    // Retrieve site data stored when "Publish My Site" was clicked
    const stored = sessionStorage.getItem("exsisto_pending_site");
    if (stored) {
      const parsed = JSON.parse(stored);
      setSiteData(parsed);
      setBusinessName(parsed.businessName || "");
      setEmail(parsed.email || "");
    }
    const plan = searchParams.get("plan");
    if (plan) setSelectedPlan(plan);
  }, [searchParams]);

  async function handleCheckout() {
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    setLoading(true);
    setError("");
    // TODO: replace with Stripe before launch
    const bizId = siteData?.businessId || "";
    window.location.href = `/checkout/success${bizId ? `?business_id=${bizId}` : ""}`;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8f8f6", fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e4e4e0", padding: "1rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <a href="/" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.5rem", fontWeight: 700, color: "#111", textDecoration: "none" }}>
          Ex<em style={{ color: "#8b4513", fontStyle: "italic" }}>sisto</em>
        </a>
        <div style={{ fontSize: "0.8rem", color: "#888" }}>
          7-day free trial · Cancel any time · No setup fees
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "3rem 2rem" }}>

        {/* Business preview */}
        {businessName && (
          <div style={{ background: "#fff", border: "1px solid #e4e4e0", borderRadius: 4, padding: "1.25rem 1.5rem", marginBottom: "2rem", display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#8b4513", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "1.1rem", flexShrink: 0 }}>
              {businessName.charAt(0)}
            </div>
            <div>
              <div style={{ fontWeight: 700, color: "#111" }}>{businessName}</div>
              <div style={{ fontSize: "0.8rem", color: "#888" }}>
                Your site is ready — {siteData?.pageCount || "multiple"} pages generated · Choose a plan to publish
              </div>
            </div>
            <a href="/preview" style={{ marginLeft: "auto", fontSize: "0.8rem", color: "#8b4513", fontWeight: 600 }}>← Edit site</a>
          </div>
        )}

        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(2rem,4vw,3rem)", color: "#111", marginBottom: "0.5rem" }}>
            Choose your plan
          </h1>
          <p style={{ color: "#888", fontSize: "1rem" }}>
            Start your 7-day free trial. No credit card charge until after your trial ends.
          </p>
        </div>

        {/* Plan cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.25rem", marginBottom: "2.5rem" }}>
          {PLANS.map(plan => (
            <div
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              style={{
                background: "#fff",
                border: selectedPlan === plan.id ? "2px solid #111" : "1.5px solid #e4e4e0",
                borderRadius: 4,
                padding: "1.75rem",
                cursor: "pointer",
                position: "relative",
                transition: "all 0.15s",
                boxShadow: selectedPlan === plan.id ? "0 4px 24px rgba(0,0,0,0.1)" : "none",
              }}
            >
              {plan.highlight && (
                <div style={{ position: "absolute", top: -1, left: "50%", transform: "translateX(-50%)", background: "#8b4513", color: "#fff", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "3px 12px", borderRadius: "0 0 4px 4px" }}>
                  Most Popular
                </div>
              )}

              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: "0.5rem", marginTop: plan.highlight ? "0.75rem" : 0 }}>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2.2rem", fontWeight: 700, color: "#111" }}>{plan.price}</div>
                <div style={{ fontSize: "0.85rem", color: "#888" }}>{plan.period}</div>
              </div>

              <div style={{ fontWeight: 700, fontSize: "1rem", color: "#111", marginBottom: "0.4rem" }}>{plan.name}</div>
              <div style={{ fontSize: "0.8rem", color: "#888", lineHeight: 1.6, marginBottom: "1.25rem" }}>{plan.description}</div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {plan.features.map(f => (
                  <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: "0.82rem", color: "#444" }}>
                    <span style={{ color: "#8b4513", flexShrink: 0, marginTop: 1 }}>✓</span>
                    {f}
                  </div>
                ))}
              </div>

              {selectedPlan === plan.id && (
                <div style={{ marginTop: "1.25rem", padding: "0.4rem", background: "#111", borderRadius: 2, textAlign: "center", fontSize: "0.75rem", fontWeight: 700, color: "#fff", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  Selected ✓
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Email + CTA */}
        <div style={{ background: "#fff", border: "1px solid #e4e4e0", borderRadius: 4, padding: "2rem", maxWidth: 540, margin: "0 auto" }}>
          <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.4rem", color: "#111", marginBottom: "0.4rem" }}>
            Start your free trial
          </h3>
          <p style={{ fontSize: "0.85rem", color: "#888", marginBottom: "1.5rem" }}>
            Enter your email to create your account. You won't be charged for 7 days.
          </p>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#777", marginBottom: 4 }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@yourbusiness.com"
              style={{ width: "100%", padding: "0.75rem 1rem", border: "1.5px solid #e4e4e0", borderRadius: 3, fontSize: "0.95rem", fontFamily: "inherit" }}
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#777", marginBottom: 4 }}>
              Card Number
            </label>
            <input
              type="text"
              value={cardNumber}
              onChange={e => setCardNumber(e.target.value.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim())}
              placeholder="1234 5678 9012 3456"
              style={{ width: "100%", padding: "0.75rem 1rem", border: "1.5px solid #e4e4e0", borderRadius: 3, fontSize: "0.95rem", fontFamily: "inherit", letterSpacing: "0.05em" }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1.5rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#777", marginBottom: 4 }}>
                Expiry
              </label>
              <input
                type="text"
                value={cardExpiry}
                onChange={e => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                  setCardExpiry(v.length > 2 ? v.slice(0,2) + "/" + v.slice(2) : v);
                }}
                placeholder="MM/YY"
                style={{ width: "100%", padding: "0.75rem 1rem", border: "1.5px solid #e4e4e0", borderRadius: 3, fontSize: "0.95rem", fontFamily: "inherit" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#777", marginBottom: 4 }}>
                CVC
              </label>
              <input
                type="text"
                value={cardCvc}
                onChange={e => setCardCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="123"
                style={{ width: "100%", padding: "0.75rem 1rem", border: "1.5px solid #e4e4e0", borderRadius: 3, fontSize: "0.95rem", fontFamily: "inherit" }}
              />
            </div>
          </div>

          {error && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 3, padding: "0.75rem", fontSize: "0.82rem", color: "#dc2626", marginBottom: "1rem" }}>
              {error}
            </div>
          )}

          <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 3, padding: "0.6rem 0.9rem", fontSize: "0.75rem", color: "#92400e", marginBottom: "1rem", textAlign: "center" }}>
            🧪 Test mode — card details are not required and no charge will be made
          </div>

          <button
            onClick={handleCheckout}
            disabled={loading}
            style={{
              width: "100%", padding: "0.9rem",
              background: loading ? "#999" : "#111",
              color: "#fff", border: "none", borderRadius: 3,
              fontSize: "0.9rem", fontWeight: 700,
              letterSpacing: "0.05em", textTransform: "uppercase",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Setting up your account..." : `Start Free Trial — ${PLANS.find(p => p.id === selectedPlan)?.price}/mo after trial →`}
          </button>

          <div style={{ textAlign: "center", marginTop: "1rem", fontSize: "0.75rem", color: "#aaa", lineHeight: 1.6 }}>
            7-day free trial · Cancel any time · Secured by Stripe
            <br />No charge until {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,400&family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        input:focus { outline: none; border-color: #111 !important; }
        @media (max-width: 768px) {
          div[style*="grid-template-columns: repeat(3"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
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


