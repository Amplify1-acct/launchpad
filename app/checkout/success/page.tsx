"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Animate through the setup steps
    const steps = [800, 2000, 4000, 6000];
    steps.forEach((delay, i) => {
      setTimeout(() => setStep(i + 1), delay);
    });
    // Clear pending site from sessionStorage
    sessionStorage.removeItem("exsisto_pending_site");
  }, []);

  const steps = [
    { icon: "✓", label: "Payment confirmed", done: step >= 1 },
    { icon: "👤", label: "Creating your account", done: step >= 2 },
    { icon: "🌐", label: "Deploying your website", done: step >= 3 },
    { icon: "📧", label: "Sending your login link", done: step >= 4 },
  ];

  const allDone = step >= 4;

  return (
    <div style={{
      minHeight: "100vh", background: "#0a0a0a",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'DM Sans', sans-serif", padding: "2rem",
    }}>
      <div style={{ textAlign: "center", maxWidth: 480 }}>

        <div style={{ fontSize: "3rem", marginBottom: "1.5rem" }}>
          {allDone ? "🎉" : "⚙️"}
        </div>

        <h1 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "clamp(2rem,4vw,3rem)",
          color: "#fff", marginBottom: "0.75rem",
        }}>
          {allDone ? "You're live!" : "Setting everything up..."}
        </h1>

        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.95rem", lineHeight: 1.7, marginBottom: "2.5rem" }}>
          {allDone
            ? "Check your email for a login link to access your dashboard. Your site is deploying now — usually live within 2 minutes."
            : "Hang tight while we set up your account and deploy your site."}
        </p>

        {/* Steps */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2.5rem", textAlign: "left" }}>
          {steps.map((s, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: "1rem",
              padding: "0.9rem 1.25rem",
              background: s.done ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.02)",
              borderRadius: 4,
              border: `1px solid ${s.done ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)"}`,
              transition: "all 0.4s",
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: s.done ? "#8b4513" : "rgba(255,255,255,0.08)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.85rem", flexShrink: 0,
                transition: "background 0.4s",
              }}>
                {s.done ? "✓" : <span style={{ opacity: 0.3 }}>○</span>}
              </div>
              <div style={{
                fontSize: "0.9rem",
                color: s.done ? "#fff" : "rgba(255,255,255,0.3)",
                fontWeight: s.done ? 600 : 400,
                transition: "color 0.4s",
              }}>
                {s.label}
              </div>
              {!s.done && i === step && (
                <div style={{ marginLeft: "auto", width: 16, height: 16, border: "2px solid rgba(255,255,255,0.2)", borderTopColor: "#8b4513", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              )}
            </div>
          ))}
        </div>

        {allDone && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <a href="/dashboard" style={{
              display: "block", background: "#fff", color: "#111",
              padding: "0.9rem 2rem", borderRadius: 3,
              fontSize: "0.9rem", fontWeight: 700,
              letterSpacing: "0.05em", textTransform: "uppercase",
              textDecoration: "none",
            }}>
              Go to Dashboard →
            </a>
            <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.3)" }}>
              Or check your email for a direct login link
            </p>
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#0a0a0a" }} />}>
      <SuccessContent />
    </Suspense>
  );
}
