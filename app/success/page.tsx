"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

const PLAN_DETAILS: Record<string, { name: string; color: string }> = {
  starter: { name: "Starter", color: "#2563eb" },
  growth:  { name: "Growth",  color: "#16a34a" },
  premium: { name: "Premium", color: "#9333ea" },
};

function SuccessPageInner() {
  const params = useSearchParams();
  const plan = params.get("plan") || "starter";
  const business = params.get("business") || "Your Business";
  const [step, setStep] = useState(0);

  const planDetail = PLAN_DETAILS[plan] || PLAN_DETAILS.starter;

  useEffect(() => {
    // Simulate the build steps progressing
    const timers = [
      setTimeout(() => setStep(1), 1200),
      setTimeout(() => setStep(2), 2800),
      setTimeout(() => setStep(3), 4500),
      setTimeout(() => setStep(4), 6000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const steps = [
    { label: "Payment confirmed", icon: "✓" },
    { label: "Account created", icon: "✓" },
    { label: "Generating your website", icon: "⚙️" },
    { label: "Setting up your dashboard", icon: "🚀" },
  ];

  return (
    <div style={{
      minHeight: "100vh", background: "#0a0a0a",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'DM Sans', sans-serif", padding: "2rem",
    }}>
      <div style={{ maxWidth: 520, width: "100%", textAlign: "center" }}>

        {/* Logo */}
        <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "3rem" }}>
          Exsisto
        </div>

        {/* Success mark */}
        <div style={{
          width: 80, height: 80, borderRadius: "50%",
          background: planDetail.color, color: "white",
          fontSize: "2rem", display: "flex", alignItems: "center",
          justifyContent: "center", margin: "0 auto 2rem",
          boxShadow: `0 0 40px ${planDetail.color}44`,
        }}>
          ✓
        </div>

        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2.5rem", color: "white", marginBottom: "0.75rem", lineHeight: 1.2 }}>
          Welcome to Exsisto
        </h1>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "1rem", marginBottom: "3rem", lineHeight: 1.6 }}>
          {decodeURIComponent(business)}&apos;s digital presence is being built right now.
          You&apos;re on the <span style={{ color: planDetail.color, fontWeight: 700 }}>{planDetail.name}</span> plan.
        </p>

        {/* Progress steps */}
        <div style={{ background: "#111", border: "1px solid #222", borderRadius: 8, padding: "1.5rem 2rem", marginBottom: "2.5rem", textAlign: "left" }}>
          {steps.map((s, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: "1rem",
              padding: "0.75rem 0",
              borderBottom: i < steps.length - 1 ? "1px solid #1a1a1a" : "none",
              opacity: i <= step ? 1 : 0.3,
              transition: "opacity 0.5s ease",
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: i < step ? planDetail.color : i === step ? "#222" : "#111",
                border: i === step ? `2px solid ${planDetail.color}` : "2px solid #333",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.9rem", flexShrink: 0,
                transition: "all 0.5s ease",
              }}>
                {i < step ? "✓" : i === step ? <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⚙</span> : ""}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "0.9rem", fontWeight: 600, color: i <= step ? "white" : "#555" }}>
                  {s.label}
                </div>
              </div>
              {i < step && (
                <div style={{ fontSize: "0.75rem", color: planDetail.color, fontWeight: 700 }}>Done</div>
              )}
              {i === step && (
                <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>In progress...</div>
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        {step >= 3 ? (
          <a href="/dashboard" style={{
            display: "block", background: "white", color: "#111",
            padding: "1rem 2rem", borderRadius: 4,
            fontSize: "0.9rem", fontWeight: 800, letterSpacing: "0.05em",
            textTransform: "uppercase", textDecoration: "none",
          }}>
            Go to My Dashboard →
          </a>
        ) : (
          <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.85rem" }}>
            Setting up your account...
          </div>
        )}

        <p style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.78rem", marginTop: "2rem", lineHeight: 1.6 }}>
          You&apos;ll receive a confirmation email at the address you provided.
          Your 7-day free trial starts today — no charge until it ends.
        </p>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=DM+Sans:wght@400;600;700;800&display=swap');
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}>Loading...</div>}>
      <SuccessPageInner />
    </Suspense>
  );
}
