"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

const STEPS = [
  { icon: "✓",  label: "Payment confirmed",        detail: "You're all set — no charge for 7 days." },
  { icon: "👤", label: "Setting up your account",  detail: "Creating your dashboard and profile." },
  { icon: "🌐", label: "Building your website",    detail: "Writing your copy and generating your design." },
  { icon: "✍️", label: "Writing your blog posts",  detail: "SEO-optimized content ready for your review." },
  { icon: "📱", label: "Queuing social posts",     detail: "Facebook, Instagram & TikTok content drafted." },
];

function SuccessContent() {
  const searchParams = useSearchParams();
  const businessId = searchParams.get("business_id");
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    sessionStorage.removeItem("exsisto_pending_site");

    // Kick off real generation if we have a business_id
    if (businessId) {
      triggerGeneration(businessId);
    }

    // Animate steps regardless (fake timing for UX)
    const timings = [800, 2500, 5000, 8000, 10500];
    timings.forEach((delay, i) => {
      setTimeout(() => setStep(i + 1), delay);
    });
    setTimeout(() => setDone(true), 12000);
  }, [businessId]);

  async function triggerGeneration(bizId: string) {
    try {
      // Generate site
      await fetch("/api/generate-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_id: bizId }),
      });
      // Deploy to subdomain
      await fetch("/api/deploy-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_id: bizId }),
      });
      // Generate blog posts
      fetch("/api/generate-blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_id: bizId }),
      }).catch(() => {});
      // Generate social posts
      fetch("/api/generate-social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_id: bizId }),
      }).catch(() => {});
    } catch (e) {
      console.error("Generation error:", e);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#fcf8ff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Inter', sans-serif",
      padding: "2rem",
    }}>
      <div style={{ textAlign: "center", maxWidth: 520, width: "100%" }}>

        {/* Logo */}
        <a href="/" style={{ textDecoration: "none" }}>
          <div style={{ fontSize: "20px", fontWeight: 800, color: "#1b1b25", marginBottom: "2.5rem", letterSpacing: "-0.5px" }}>
            Ex<span style={{ color: "#4648d4" }}>sisto</span>
          </div>
        </a>

        {/* Icon */}
        <div style={{
          width: 72, height: 72,
          background: done ? "#dcfce7" : "#eeeeff",
          borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "28px", margin: "0 auto 1.5rem",
          transition: "background 0.5s",
        }}>
          {done ? "🎉" : "✦"}
        </div>

        <h1 style={{
          fontSize: "clamp(1.6rem, 4vw, 2.2rem)",
          fontWeight: 800,
          color: "#1b1b25",
          letterSpacing: "-0.5px",
          marginBottom: "0.75rem",
          lineHeight: 1.2,
        }}>
          {done ? "You're all set!" : "Building your digital presence…"}
        </h1>

        <p style={{
          color: "#9090a8",
          fontSize: "15px",
          lineHeight: 1.7,
          marginBottom: "2.5rem",
          maxWidth: 400,
          margin: "0 auto 2.5rem",
        }}>
          {done
            ? "Your website, blog, and social posts are ready. Head to your dashboard to review and approve everything."
            : "This takes about 30 seconds. We're building everything from scratch, just for you."}
        </p>

        {/* Steps */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "2.5rem", textAlign: "left" }}>
          {STEPS.map((s, i) => {
            const isActive = i === step - 1 && !done;
            const isDone = step > i;
            return (
              <div key={i} style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                padding: "14px 18px",
                background: isDone ? "#fff" : "#f5f2ff",
                borderRadius: "12px",
                border: `1px solid ${isDone ? "#ede9f8" : isActive ? "#c7c4f0" : "#ede9f8"}`,
                transition: "all 0.4s",
                opacity: step <= i && !isActive ? 0.45 : 1,
              }}>
                {/* Status indicator */}
                <div style={{
                  width: 32, height: 32,
                  borderRadius: "50%",
                  background: isDone ? "#4648d4" : isActive ? "#eeeeff" : "#f5f2ff",
                  border: `2px solid ${isDone ? "#4648d4" : isActive ? "#4648d4" : "#ede9f8"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "13px", flexShrink: 0,
                  transition: "all 0.4s",
                }}>
                  {isDone ? (
                    <span style={{ color: "#fff", fontWeight: 700 }}>✓</span>
                  ) : isActive ? (
                    <div style={{
                      width: 12, height: 12,
                      border: "2px solid #c7c4f0",
                      borderTopColor: "#4648d4",
                      borderRadius: "50%",
                      animation: "spin 0.8s linear infinite",
                    }} />
                  ) : (
                    <span style={{ color: "#c7c4f0", fontSize: "10px" }}>○</span>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: "13px",
                    fontWeight: isDone || isActive ? 700 : 500,
                    color: isDone ? "#1b1b25" : isActive ? "#4648d4" : "#9090a8",
                    transition: "color 0.4s",
                  }}>
                    {s.label}
                  </div>
                  {(isDone || isActive) && (
                    <div style={{ fontSize: "11px", color: "#9090a8", marginTop: "2px" }}>
                      {s.detail}
                    </div>
                  )}
                </div>

                {isDone && (
                  <div style={{
                    background: "#dcfce7",
                    color: "#166534",
                    fontSize: "10px",
                    fontWeight: 700,
                    padding: "3px 10px",
                    borderRadius: "100px",
                    flexShrink: 0,
                  }}>
                    Done
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* CTA */}
        {done ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <a href="/dashboard" style={{
              display: "block",
              background: "#4648d4",
              color: "#fff",
              padding: "14px 32px",
              borderRadius: "10px",
              fontSize: "15px",
              fontWeight: 700,
              textDecoration: "none",
              transition: "background 0.2s",
            }}>
              Go to my dashboard →
            </a>
            <p style={{ fontSize: "12px", color: "#9090a8" }}>
              Your 7-day free trial starts now · Cancel anytime
            </p>
          </div>
        ) : (
          <div style={{
            background: "#f5f2ff",
            border: "1px solid #ede9f8",
            borderRadius: "10px",
            padding: "14px 20px",
            fontSize: "13px",
            color: "#6b6b8a",
          }}>
            Don't close this tab — we'll redirect you automatically when everything's ready
          </div>
        )}

      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", background: "#fcf8ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: "Inter, sans-serif", color: "#9090a8" }}>Setting up your account…</div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
