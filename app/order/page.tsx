"use client";

import { useState } from "react";
import styles from "./order.module.css";

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: "$99",
    period: "/mo",
    tagline: "Get online fast",
    features: [
      "AI-designed website",
      "5 custom AI photos",
      "1 blog post/week",
      "Custom domain support",
    ],
    color: "#4648d4",
    popular: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$299",
    period: "/mo",
    tagline: "Most popular",
    features: [
      "AI-designed website",
      "5 custom AI photos",
      "2 blog posts/week",
      "Social media posts",
      "Custom domain support",
    ],
    color: "#4648d4",
    popular: true,
  },
  {
    id: "premium",
    name: "Premium",
    price: "$599",
    period: "/mo",
    tagline: "Full service",
    features: [
      "AI-designed website",
      "5 custom AI photos",
      "4 blog posts/week",
      "Social media (auto-post)",
      "Google Reviews integration",
      "Custom domain support",
    ],
    color: "#4648d4",
    popular: false,
  },
];

const TEMPLATES = [
  {
    id: "skeleton-clean",
    name: "Clean & Premium",
    description: "Modern serif, light & airy. Great for dental, medical, and professional services.",
    demoUrl: "/demos/dental.html",
    demoLabel: "See live demo →",
    gradient: "linear-gradient(135deg,#e8f0fe 0%,#b5d4f4 50%,#378add 100%)",
    textColor: "#1352cc",
    accent: "#1352cc",
    bestFor: "Dental · Medical · Spa",
  },
  {
    id: "skeleton-bold",
    name: "Dark & Bold",
    description: "Industrial, high-contrast, commanding. Built for trades, auto, and HVAC.",
    demoUrl: "/demos/auto.html",
    demoLabel: "See live demo →",
    gradient: "linear-gradient(135deg,#1a1a1a 0%,#2e2e2e 50%,#e85d26 100%)",
    textColor: "#e85d26",
    accent: "#e85d26",
    bestFor: "Auto · HVAC · Plumbing",
  },
  {
    id: "skeleton-warm",
    name: "Authoritative & Refined",
    description: "Classic serif, navy & gold. Conveys trust, experience, and prestige.",
    demoUrl: "/demos/law.html",
    demoLabel: "See live demo →",
    gradient: "linear-gradient(135deg,#0d1f3c 0%,#152848 50%,#b8973a 100%)",
    textColor: "#b8973a",
    accent: "#b8973a",
    bestFor: "Law · Finance · Real Estate",
  },
];

const INDUSTRIES = [
  "Auto", "Bakery", "Dental", "Gym", "HVAC", "Landscaping",
  "Law", "Pet", "Plumbing", "Real Estate", "Restaurant", "Salon", "Other",
];

type Step = "plan" | "template" | "info" | "checkout";

export default function OrderPage() {
  const [step, setStep] = useState<Step>("plan");
  const [selectedPlan, setSelectedPlan] = useState<string>("pro");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("skeleton-clean");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    businessName: "",
    industry: "",
    city: "",
    state: "",
    phone: "",
    email: "",
    domain: "",
    description: "",
    services: "",
  });

  const steps: Step[] = ["plan", "template", "info", "checkout"];
  const stepIdx = steps.indexOf(step);

  function update(field: string, val: string) {
    setForm(f => ({ ...f, [field]: val }));
  }

  async function handleCheckout() {
    setError("");
    if (!form.businessName || !form.industry || !form.city || !form.email) {
      setError("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/order/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: selectedPlan,
          template: selectedTemplate,
          ...form,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Something went wrong.");
        setLoading(false);
      }
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  const plan = PLANS.find(p => p.id === selectedPlan)!;

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <a href="/" className={styles.logo}>Ex<span>sisto</span></a>
        <div className={styles.stepTrack}>
          {["Choose Plan", "Pick Style", "Your Info", "Checkout"].map((label, i) => (
            <div key={i} className={`${styles.stepDot} ${i <= stepIdx ? styles.stepActive : ""} ${i < stepIdx ? styles.stepDone : ""}`}>
              <div className={styles.dotCircle}>{i < stepIdx ? "✓" : i + 1}</div>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </header>

      <main className={styles.main}>

        {/* STEP 1 — Plan */}
        {step === "plan" && (
          <div className={styles.section}>
            <div className={styles.sectionHead}>
              <h1>Choose your plan</h1>
              <p>All plans include a fully custom AI-designed website, live in 48 hours.</p>
            </div>
            <div className={styles.planGrid}>
              {PLANS.map(p => (
                <button
                  key={p.id}
                  className={`${styles.planCard} ${selectedPlan === p.id ? styles.planSelected : ""} ${p.popular ? styles.planPopular : ""}`}
                  onClick={() => setSelectedPlan(p.id)}
                >
                  {p.popular && <div className={styles.popularBadge}>Most Popular</div>}
                  <div className={styles.planName}>{p.name}</div>
                  <div className={styles.planTagline}>{p.tagline}</div>
                  <div className={styles.planPrice}>
                    {p.price}<span>{p.period}</span>
                  </div>
                  <ul className={styles.planFeatures}>
                    {p.features.map(f => (
                      <li key={f}><span className={styles.check}>✓</span>{f}</li>
                    ))}
                  </ul>
                  <div className={`${styles.selectBtn} ${selectedPlan === p.id ? styles.selectBtnActive : ""}`}>
                    {selectedPlan === p.id ? "Selected ✓" : "Select"}
                  </div>
                </button>
              ))}
            </div>
            <div className={styles.nextWrap}>
              <button className={styles.nextBtn} onClick={() => setStep("template")}>
                Continue with {plan.name} →
              </button>
              <p className={styles.nextNote}>Site delivered in 48 hours · Cancel anytime</p>
            </div>
          </div>
        )}

        {/* STEP 2 — Template */}
        {step === "template" && (
          <div className={styles.section}>
            <div className={styles.sectionHead}>
              <h1>Pick your style</h1>
              <p>Each style is a fully built demo — click &quot;See live demo&quot; to explore it before you choose. Your site will be customized for your business, industry, and colors.</p>
            </div>
            <div className={styles.templateGrid}>
              {TEMPLATES.map(t => (
                <div
                  key={t.id}
                  className={`${styles.templateCard} ${selectedTemplate === t.id ? styles.templateSelected : ""}`}
                  onClick={() => setSelectedTemplate(t.id)}
                  style={{ cursor: "pointer", position: "relative" }}
                >
                  {/* Color preview */}
                  <div style={{
                    height: "140px",
                    background: t.gradient,
                    borderRadius: "8px 8px 0 0",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}>
                    <div style={{
                      background: "rgba(255,255,255,0.12)",
                      border: `1px solid ${t.textColor}55`,
                      borderRadius: "6px",
                      padding: "6px 14px",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: t.textColor,
                      backdropFilter: "blur(4px)",
                    }}>
                      {t.name}
                    </div>
                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                      {t.bestFor}
                    </div>
                  </div>
                  <div className={styles.templateInfo}>
                    <div className={styles.templateName}>{t.name}</div>
                    <div className={styles.templateDesc}>{t.description}</div>
                    <a
                      href={t.demoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        marginTop: "10px",
                        fontSize: "13px",
                        fontWeight: 600,
                        color: t.accent,
                        textDecoration: "none",
                      }}
                    >
                      {t.demoLabel}
                    </a>
                  </div>
                  {selectedTemplate === t.id && <div className={styles.templateCheck}>✓</div>}
                </div>
              ))}
            </div>
            <div className={styles.nextWrap}>
              <button className={styles.backBtn} onClick={() => setStep("plan")}>← Back</button>
              <button className={styles.nextBtn} onClick={() => setStep("info")}>
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 — Business Info */}
        {step === "info" && (
          <div className={styles.section}>
            <div className={styles.sectionHead}>
              <h1>Tell us about your business</h1>
              <p>We'll use this to build your site and generate your content.</p>
            </div>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Business name <span className={styles.req}>*</span></label>
                <input
                  placeholder="e.g. Matty's Auto Shop"
                  value={form.businessName}
                  onChange={e => update("businessName", e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Industry <span className={styles.req}>*</span></label>
                <select value={form.industry} onChange={e => update("industry", e.target.value)}>
                  <option value="">Select industry…</option>
                  {INDUSTRIES.map(i => <option key={i} value={i.toLowerCase()}>{i}</option>)}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>City <span className={styles.req}>*</span></label>
                <input
                  placeholder="e.g. Chicago"
                  value={form.city}
                  onChange={e => update("city", e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label>State</label>
                <input
                  placeholder="e.g. IL"
                  value={form.state}
                  onChange={e => update("state", e.target.value)}
                  maxLength={2}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Phone</label>
                <input
                  type="tel"
                  placeholder="(555) 555-5555"
                  value={form.phone}
                  onChange={e => update("phone", e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Email <span className={styles.req}>*</span></label>
                <input
                  type="email"
                  placeholder="you@yourbusiness.com"
                  value={form.email}
                  onChange={e => update("email", e.target.value)}
                />
              </div>
              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label>Your domain name <span className={styles.optional}>(optional)</span></label>
                <input
                  placeholder="e.g. mattysautoshop.com"
                  value={form.domain}
                  onChange={e => update("domain", e.target.value)}
                />
                <span className={styles.hint}>If you don't have one yet, we'll give you a free subdomain.</span>
              </div>
              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label>What does your business do?</label>
                <textarea
                  placeholder="Brief description — what you do, who you serve, what makes you different…"
                  value={form.description}
                  onChange={e => update("description", e.target.value)}
                  rows={3}
                />
              </div>
              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label>Your main services</label>
                <input
                  placeholder="e.g. Oil changes, brake repair, tire rotation, diagnostics"
                  value={form.services}
                  onChange={e => update("services", e.target.value)}
                />
              </div>
            </div>
            <div className={styles.nextWrap}>
              <button className={styles.backBtn} onClick={() => setStep("template")}>← Back</button>
              <button className={styles.nextBtn} onClick={() => setStep("checkout")}>
                Review order →
              </button>
            </div>
          </div>
        )}

        {/* STEP 4 — Checkout / Review */}
        {step === "checkout" && (
          <div className={styles.section}>
            <div className={styles.sectionHead}>
              <h1>Review your order</h1>
              <p>Everything looks good? We'll charge your card and start building immediately.</p>
            </div>
            <div className={styles.reviewLayout}>
              <div className={styles.reviewCard}>
                <div className={styles.reviewSection}>
                  <div className={styles.reviewLabel}>Plan</div>
                  <div className={styles.reviewValue}>{plan.name} — {plan.price}/mo</div>
                </div>
                <div className={styles.reviewSection}>
                  <div className={styles.reviewLabel}>Style</div>
                  <div className={styles.reviewValue}>{TEMPLATES.find(t => t.id === selectedTemplate)?.name}</div>
                </div>
                <div className={styles.reviewSection}>
                  <div className={styles.reviewLabel}>Business</div>
                  <div className={styles.reviewValue}>{form.businessName || "—"}</div>
                </div>
                <div className={styles.reviewSection}>
                  <div className={styles.reviewLabel}>Location</div>
                  <div className={styles.reviewValue}>{[form.city, form.state].filter(Boolean).join(", ") || "—"}</div>
                </div>
                <div className={styles.reviewSection}>
                  <div className={styles.reviewLabel}>Email</div>
                  <div className={styles.reviewValue}>{form.email || "—"}</div>
                </div>
                {form.domain && (
                  <div className={styles.reviewSection}>
                    <div className={styles.reviewLabel}>Domain</div>
                    <div className={styles.reviewValue}>{form.domain}</div>
                  </div>
                )}
                <button className={styles.editLink} onClick={() => setStep("info")}>Edit details</button>
              </div>

              <div className={styles.checkoutCard}>
                <div className={styles.checkoutTotal}>
                  <span>Total today</span>
                  <strong>{plan.price}/mo</strong>
                </div>
                <ul className={styles.checkoutFeatures}>
                  {plan.features.map(f => <li key={f}>✓ {f}</li>)}
                </ul>
                {error && <div className={styles.errorMsg}>{error}</div>}
                <button
                  className={styles.payBtn}
                  onClick={handleCheckout}
                  disabled={loading}
                >
                  {loading ? "Redirecting to payment…" : `Pay ${plan.price}/mo →`}
                </button>
                <p className={styles.payNote}>
                  Secured by Stripe · Cancel anytime · Site live in 48 hours
                </p>
              </div>
            </div>
            <div className={styles.nextWrap} style={{ justifyContent: "flex-start" }}>
              <button className={styles.backBtn} onClick={() => setStep("info")}>← Back</button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

// Mini SVG template previews
function TemplatePreview({ id, accent }: { id: string; accent: string }) {
  if (id === "skeleton-bold") {
    return (
      <svg viewBox="0 0 280 160" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
        <rect width="280" height="160" fill="#111" />
        <rect x="0" y="0" width="280" height="90" fill="#1a1a1a" />
        <rect x="20" y="28" width="110" height="10" fill={accent} rx="2" />
        <rect x="20" y="44" width="80" height="6" fill="#444" rx="2" />
        <rect x="20" y="58" width="60" height="20" fill={accent} rx="3" />
        <rect x="0" y="96" width="280" height="1" fill="#333" />
        <rect x="20" y="108" width="55" height="6" fill="#555" rx="2" />
        <rect x="20" y="120" width="40" height="4" fill="#333" rx="2" />
        <rect x="100" y="108" width="55" height="6" fill="#555" rx="2" />
        <rect x="100" y="120" width="40" height="4" fill="#333" rx="2" />
        <rect x="180" y="108" width="55" height="6" fill="#555" rx="2" />
        <rect x="180" y="120" width="40" height="4" fill="#333" rx="2" />
      </svg>
    );
  }
  if (id === "skeleton-clean") {
    return (
      <svg viewBox="0 0 280 160" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
        <rect width="280" height="160" fill="#f8f9ff" />
        <rect x="0" y="0" width="280" height="8" fill={accent} />
        <rect x="20" y="24" width="90" height="8" fill="#1b1b25" rx="2" />
        <rect x="20" y="38" width="130" height="5" fill="#aaa" rx="2" />
        <rect x="20" y="50" width="160" height="5" fill="#aaa" rx="2" />
        <rect x="20" y="64" width="70" height="18" fill={accent} rx="3" />
        <rect x="160" y="20" width="100" height="70" fill="#e8e8ff" rx="6" />
        <rect x="0" y="100" width="280" height="1" fill="#ede9f8" />
        <rect x="20" y="112" width="60" height="5" fill="#ccc" rx="2" />
        <rect x="20" y="122" width="45" height="4" fill="#e0e0e0" rx="2" />
        <rect x="110" y="112" width="60" height="5" fill="#ccc" rx="2" />
        <rect x="110" y="122" width="45" height="4" fill="#e0e0e0" rx="2" />
        <rect x="200" y="112" width="60" height="5" fill="#ccc" rx="2" />
        <rect x="200" y="122" width="45" height="4" fill="#e0e0e0" rx="2" />
      </svg>
    );
  }
  // warm
  return (
    <svg viewBox="0 0 280 160" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
      <rect width="280" height="160" fill="#fdf8f0" />
      <rect x="0" y="0" width="280" height="80" fill="#f5e6c8" />
      <rect x="20" y="20" width="100" height="9" fill={accent} rx="2" />
      <rect x="20" y="36" width="140" height="5" fill="#c4a46b" rx="2" />
      <rect x="20" y="48" width="110" height="5" fill="#c4a46b" rx="2" />
      <rect x="20" y="62" width="65" height="18" fill={accent} rx="3" />
      <rect x="0" y="86" width="280" height="1" fill="#e8d9be" />
      <rect x="14" y="98" width="72" height="48" fill="#fff" rx="4" />
      <rect x="20" y="118" width="55" height="5" fill="#c4a46b" rx="2" />
      <rect x="20" y="128" width="40" height="4" fill="#ddd" rx="2" />
      <rect x="104" y="98" width="72" height="48" fill="#fff" rx="4" />
      <rect x="110" y="118" width="55" height="5" fill="#c4a46b" rx="2" />
      <rect x="110" y="128" width="40" height="4" fill="#ddd" rx="2" />
      <rect x="194" y="98" width="72" height="48" fill="#fff" rx="4" />
      <rect x="200" y="118" width="55" height="5" fill="#c4a46b" rx="2" />
      <rect x="200" y="128" width="40" height="4" fill="#ddd" rx="2" />
    </svg>
  );
}
