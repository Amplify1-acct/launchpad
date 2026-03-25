"use client";

import { useState } from "react";

interface PaymentModalProps {
  businessName: string;
  onClose: () => void;
}

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: "$299",
    period: "/mo",
    desc: "Perfect for getting online",
    features: ["5-page website", "2 blog posts/mo", "FB + IG setup", "8 social posts/mo", "On-page SEO"],
    color: "#2563eb",
    popular: false,
  },
  {
    id: "growth",
    name: "Growth",
    price: "$599",
    period: "/mo",
    desc: "For businesses ready to grow",
    features: ["10-page website", "4 blog posts/mo", "FB + IG + LinkedIn", "20 social posts/mo", "Local SEO", "Priority support"],
    color: "#16a34a",
    popular: true,
  },
  {
    id: "premium",
    name: "Premium",
    price: "$999",
    period: "/mo",
    desc: "Full-service digital presence",
    features: ["Unlimited pages", "Weekly blog posts", "All platforms", "Daily social posts", "Full SEO suite", "Account manager"],
    color: "#9333ea",
    popular: false,
  },
];

export function PaymentModal({ businessName, onClose }: PaymentModalProps) {
  const [selectedPlan, setSelectedPlan] = useState("growth");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCheckout() {
    if (!email.trim()) { setError("Email is required"); return; }
    if (!email.includes("@")) { setError("Please enter a valid email"); return; }
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selectedPlan, email, businessName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.location.href = data.url;
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  }

  const inp: React.CSSProperties = {
    width: "100%", padding: "0.75rem 1rem",
    border: "1.5px solid #e4e4e0", borderRadius: 4,
    fontSize: "0.95rem", fontFamily: "inherit",
    color: "#111", background: "#fff",
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 2000,
      background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "1.5rem", fontFamily: "'DM Sans', sans-serif",
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "#fff", borderRadius: 8, width: "100%", maxWidth: 680,
        maxHeight: "90vh", overflowY: "auto",
        boxShadow: "0 24px 80px rgba(0,0,0,0.4)",
      }}>

        {/* Header */}
        <div style={{ padding: "1.5rem 2rem", borderBottom: "1px solid #f0f0ee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#aaa", marginBottom: 4 }}>You&apos;re almost live</div>
            <div style={{ fontSize: "1.3rem", fontWeight: 700, color: "#111" }}>{businessName}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "1.5rem", color: "#aaa", cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>

        <div style={{ padding: "1.5rem 2rem" }}>

          {/* Trial callout */}
          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 6, padding: "0.85rem 1.25rem", marginBottom: "1.5rem", display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <div style={{ fontSize: "1.25rem" }}>🎉</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "#15803d" }}>7-day free trial — no charge today</div>
              <div style={{ fontSize: "0.8rem", color: "#16a34a" }}>Cancel any time before the trial ends. No questions asked.</div>
            </div>
          </div>

          {/* Plan selection */}
          <div style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#aaa", marginBottom: "0.75rem" }}>Choose your plan</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem", marginBottom: "1.5rem" }}>
            {PLANS.map(plan => (
              <div
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                style={{
                  border: selectedPlan === plan.id ? `2px solid ${plan.color}` : "1.5px solid #e4e4e0",
                  borderRadius: 6, padding: "1rem",
                  cursor: "pointer", position: "relative",
                  background: selectedPlan === plan.id ? `${plan.color}08` : "#fff",
                  transition: "all 0.15s",
                }}
              >
                {plan.popular && (
                  <div style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", background: plan.color, color: "white", fontSize: "0.65rem", fontWeight: 700, padding: "2px 10px", borderRadius: 999, whiteSpace: "nowrap", letterSpacing: "0.05em" }}>
                    MOST POPULAR
                  </div>
                )}
                <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#111", marginBottom: 2 }}>{plan.name}</div>
                <div style={{ fontSize: "1.4rem", fontWeight: 800, color: plan.color, lineHeight: 1 }}>
                  {plan.price}<span style={{ fontSize: "0.75rem", fontWeight: 500, color: "#aaa" }}>{plan.period}</span>
                </div>
                <div style={{ fontSize: "0.75rem", color: "#888", marginTop: 4, marginBottom: "0.75rem" }}>{plan.desc}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  {plan.features.slice(0, 4).map(f => (
                    <div key={f} style={{ fontSize: "0.72rem", color: "#555", display: "flex", gap: 5, alignItems: "flex-start" }}>
                      <span style={{ color: plan.color, flexShrink: 0, marginTop: 1 }}>✓</span>{f}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Email */}
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#777", marginBottom: 5 }}>
              Your email address
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleCheckout()}
              placeholder="you@yourbusiness.com"
              style={inp}
              autoFocus
            />
            <div style={{ fontSize: "0.73rem", color: "#aaa", marginTop: 4 }}>
              We&apos;ll send your login and site details here.
            </div>
          </div>

          {error && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 4, padding: "0.65rem 1rem", fontSize: "0.83rem", color: "#dc2626", marginBottom: "1rem" }}>
              {error}
            </div>
          )}

          {/* CTA */}
          <button
            onClick={handleCheckout}
            disabled={loading}
            style={{
              width: "100%", padding: "1rem",
              background: loading ? "#888" : "#111",
              color: "#fff", border: "none", borderRadius: 4,
              fontSize: "0.95rem", fontWeight: 800,
              letterSpacing: "0.05em", textTransform: "uppercase",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Redirecting to checkout..." : "Start Free Trial — Then $" + (PLANS.find(p => p.id === selectedPlan)?.price.replace("$","") || "599") + "/mo →"}
          </button>

          <div style={{ display: "flex", justifyContent: "center", gap: "1.5rem", marginTop: "1rem" }}>
            {["🔒 Secure checkout", "7-day free trial", "Cancel any time"].map(t => (
              <div key={t} style={{ fontSize: "0.73rem", color: "#aaa" }}>{t}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
