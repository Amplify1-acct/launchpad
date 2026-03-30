"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// ─── TYPES ─────────────────────────────────────────────────────────────────────
interface BusinessInfo {
  name: string;
  industry: string;
  city: string;
  phone: string;
}

interface GeneratedContent {
  headline: string;
  tagline: string;
  description: string;
}

// ─── DATA ──────────────────────────────────────────────────────────────────────
const INDUSTRIES = [
  { id: "auto",        label: "Auto / Car Restoration",  emoji: "🚗" },
  { id: "restaurant",  label: "Restaurant / Dining",      emoji: "🍝" },
  { id: "gym",         label: "Gym / Fitness",            emoji: "💪" },
  { id: "plumbing",    label: "Plumbing",                 emoji: "🔧" },
  { id: "dental",      label: "Dental",                   emoji: "🦷" },
  { id: "law",         label: "Law Firm",                 emoji: "⚖️" },
  { id: "salon",       label: "Hair Salon / Beauty",      emoji: "✂️" },
  { id: "realestate",  label: "Real Estate",              emoji: "🏠" },
  { id: "pet",         label: "Pet Care / Grooming",      emoji: "🐾" },
  { id: "hvac",        label: "HVAC / Home Services",     emoji: "❄️" },
  { id: "bakery",      label: "Bakery / Food",            emoji: "🥐" },
  { id: "landscaping", label: "Landscaping / Lawn",       emoji: "🌿" },
];

// Maps industry to the closest Stitch template
const INDUSTRY_TO_TEMPLATE: Record<string, string> = {
  auto: "auto", restaurant: "restaurant", gym: "gym",
  plumbing: "plumbing", dental: "dental", law: "law",
  salon: "salon", realestate: "realestate", pet: "pet",
  hvac: "hvac", bakery: "restaurant", landscaping: "plumbing",
};

const TEMPLATE_STYLES: Record<string, { name: string; vibe: string; color: string }> = {
  auto:       { name: "Dark Editorial",    vibe: "Bold & Industrial",   color: "#991b1b" },
  restaurant: { name: "Warm Amber",        vibe: "Elegant & Inviting",  color: "#d97706" },
  gym:        { name: "Brutalist Dark",    vibe: "Raw & Powerful",      color: "#16a34a" },
  plumbing:   { name: "Clean Blue",        vibe: "Trustworthy & Clean", color: "#2563eb" },
  dental:     { name: "Bright Clinical",   vibe: "Fresh & Professional",color: "#0891b2" },
  law:        { name: "Executive Navy",    vibe: "Authoritative",       color: "#4338ca" },
  salon:      { name: "Luxury Pink",       vibe: "Sophisticated",       color: "#db2777" },
  realestate: { name: "Obsidian Gold",     vibe: "Premium & Exclusive", color: "#ca8a04" },
  pet:        { name: "Playful Orange",    vibe: "Warm & Friendly",     color: "#ea580c" },
  hvac:       { name: "Precision Blue",    vibe: "Expert & Reliable",   color: "#0369a1" },
};

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: "$99",
    period: "/mo",
    tagline: "Get online fast",
    images: 1,
    popular: false,
    features: [
      "5-page professional website",
      "1 Stitch AI hero image",
      "2 blog posts / month",
      "Facebook + Instagram",
      "8 social posts / month",
      "On-page SEO",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$299",
    period: "/mo",
    tagline: "Most popular",
    images: 3,
    popular: true,
    features: [
      "10-page professional website",
      "3 Stitch AI images",
      "Gallery + stats sections",
      "4 blog posts / month",
      "All social platforms",
      "16 social posts / month",
      "Advanced local SEO",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: "$599",
    period: "/mo",
    tagline: "Full AI design",
    images: 5,
    popular: false,
    features: [
      "Full custom Stitch AI design",
      "5 Stitch AI images",
      "8 blog posts / month",
      "All social platforms",
      "32 social posts / month",
      "Before/after gallery",
      "Testimonials section",
      "Priority support",
    ],
  },
];

// ─── STEP INDICATOR ────────────────────────────────────────────────────────────
function StepBar({ step }: { step: number }) {
  const steps = ["Your Info", "Your Template", "Your Plan", "Go Live"];
  return (
    <div className="step-bar">
      {steps.map((s, i) => (
        <div key={i} className={`step-item ${i < step ? "done" : i === step ? "active" : ""}`}>
          <div className="step-circle">
            {i < step ? "✓" : i + 1}
          </div>
          <span className="step-label">{s}</span>
          {i < steps.length - 1 && <div className="step-line" />}
        </div>
      ))}
    </div>
  );
}

// ─── STEP 1: BUSINESS INFO ─────────────────────────────────────────────────────
function StepInfo({ onNext }: { onNext: (info: BusinessInfo) => void }) {
  const [form, setForm] = useState<BusinessInfo>({ name: "", industry: "", city: "", phone: "" });
  const [error, setError] = useState("");

  function handleSubmit() {
    if (!form.name.trim()) return setError("Business name is required");
    if (!form.industry) return setError("Please select your industry");
    if (!form.city.trim()) return setError("City is required");
    setError("");
    onNext(form);
  }

  return (
    <div className="step-content">
      <div className="step-header">
        <h2>Tell us about your business</h2>
        <p>Just the basics — takes about 30 seconds</p>
      </div>

      <div className="form-group">
        <label>Business Name *</label>
        <input
          type="text"
          placeholder="e.g. Matty's Automotive"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          className="form-input"
        />
      </div>

      <div className="form-group">
        <label>Industry *</label>
        <div className="industry-grid">
          {INDUSTRIES.map(ind => (
            <button
              key={ind.id}
              className={`industry-btn ${form.industry === ind.id ? "active" : ""}`}
              onClick={() => setForm(f => ({ ...f, industry: ind.id }))}
            >
              <span className="industry-emoji">{ind.emoji}</span>
              <span className="industry-label">{ind.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>City *</label>
          <input
            type="text"
            placeholder="e.g. Westfield"
            value={form.city}
            onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label>Phone</label>
          <input
            type="tel"
            placeholder="e.g. (908) 555-0100"
            value={form.phone}
            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            className="form-input"
          />
        </div>
      </div>

      {error && <div className="error-msg">{error}</div>}

      <button className="btn-primary btn-lg" onClick={handleSubmit}>
        See My Templates →
      </button>
    </div>
  );
}

// ─── STEP 2: TEMPLATE PICKER ───────────────────────────────────────────────────
function StepTemplate({
  info,
  content,
  loadingContent,
  onNext,
  onBack,
}: {
  info: BusinessInfo;
  content: GeneratedContent | null;
  loadingContent: boolean;
  onNext: (templateId: string) => void;
  onBack: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState<string | null>(null);

  const templateId = INDUSTRY_TO_TEMPLATE[info.industry] || "auto";
  const templateStyle = TEMPLATE_STYLES[templateId];

  // All 10 templates shown, but the industry-matched one is highlighted
  const ALL_TEMPLATES = Object.entries(TEMPLATE_STYLES).map(([id, style]) => ({
    id,
    ...style,
    isMatch: id === templateId,
    url: `https://www.exsisto.ai/stitch-templates/${id}.html`,
  }));

  // Sort: industry match first
  ALL_TEMPLATES.sort((a, b) => (b.isMatch ? 1 : 0) - (a.isMatch ? 1 : 0));

  return (
    <div className="step-content step-template">
      <div className="step-header">
        <h2>Pick your style</h2>
        <p>
          {loadingContent
            ? "Personalizing your previews…"
            : `Showing ${info.name} · ${info.city} — click any template to preview it`}
        </p>
      </div>

      {/* Personalized headline preview */}
      {content && (
        <div className="content-preview-bar">
          <div className="content-preview-inner">
            <div className="content-preview-label">✦ AI-generated for {info.name}</div>
            <div className="content-preview-headline">"{content.headline}"</div>
            <div className="content-preview-tagline">{content.tagline}</div>
          </div>
        </div>
      )}

      <div className="template-grid">
        {ALL_TEMPLATES.map(t => (
          <div
            key={t.id}
            className={`template-card ${selected === t.id ? "selected" : ""} ${t.isMatch ? "recommended" : ""}`}
            onClick={() => setSelected(t.id)}
          >
            {t.isMatch && <div className="recommended-badge">✦ Recommended for {INDUSTRIES.find(i => i.id === info.industry)?.label}</div>}
            <div className="template-preview-wrap">
              <iframe
                src={t.url}
                className="template-iframe"
                loading="lazy"
                title={t.name}
              />
              <div className="template-iframe-overlay" onClick={() => setPreviewing(t.id)} title="Preview full page" />
            </div>
            <div className="template-info">
              <div className="template-name">{t.name}</div>
              <div className="template-vibe" style={{ color: t.color }}>{t.vibe}</div>
            </div>
            {selected === t.id && (
              <div className="template-selected-check">✓ Selected</div>
            )}
          </div>
        ))}
      </div>

      {/* Full page preview modal */}
      {previewing && (
        <div className="preview-modal" onClick={() => setPreviewing(null)}>
          <div className="preview-modal-inner" onClick={e => e.stopPropagation()}>
            <div className="preview-modal-header">
              <span>{TEMPLATE_STYLES[previewing]?.name}</span>
              <div style={{ display: "flex", gap: "8px" }}>
                <a
                  href={`https://www.exsisto.ai/stitch-templates/${previewing}.html`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-ghost btn-sm"
                >
                  Open ↗
                </a>
                <button className="btn-ghost btn-sm" onClick={() => setPreviewing(null)}>✕ Close</button>
              </div>
            </div>
            <iframe
              src={`https://www.exsisto.ai/stitch-templates/${previewing}.html`}
              className="preview-modal-iframe"
              title="Full preview"
            />
          </div>
        </div>
      )}

      <div className="step-actions">
        <button className="btn-ghost" onClick={onBack}>← Back</button>
        <button
          className="btn-primary btn-lg"
          disabled={!selected}
          onClick={() => selected && onNext(selected)}
        >
          Choose This Style →
        </button>
      </div>
    </div>
  );
}

// ─── STEP 3: PLAN PICKER ───────────────────────────────────────────────────────
function StepPlan({
  onNext,
  onBack,
}: {
  onNext: (planId: string) => void;
  onBack: () => void;
}) {
  const [selected, setSelected] = useState("pro");

  return (
    <div className="step-content">
      <div className="step-header">
        <h2>Choose your plan</h2>
        <p>All plans include your custom website, weekly content, and social media management</p>
      </div>

      <div className="plan-grid">
        {PLANS.map(plan => (
          <div
            key={plan.id}
            className={`plan-card ${selected === plan.id ? "selected" : ""} ${plan.popular ? "popular" : ""}`}
            onClick={() => setSelected(plan.id)}
          >
            {plan.popular && <div className="popular-badge">Most Popular</div>}
            <div className="plan-header">
              <div className="plan-name">{plan.name}</div>
              <div className="plan-tagline">{plan.tagline}</div>
              <div className="plan-price">
                <span className="plan-price-amount">{plan.price}</span>
                <span className="plan-price-period">{plan.period}</span>
              </div>
            </div>
            <div className="plan-images">
              <span className="plan-images-badge">✦ {plan.images} Stitch AI image{plan.images > 1 ? "s" : ""}</span>
            </div>
            <ul className="plan-features">
              {plan.features.map((f, i) => (
                <li key={i}>
                  <span className="check">✓</span> {f}
                </li>
              ))}
            </ul>
            {selected === plan.id && (
              <div className="plan-selected-indicator">Selected ✓</div>
            )}
          </div>
        ))}
      </div>

      <div className="step-actions">
        <button className="btn-ghost" onClick={onBack}>← Back</button>
        <button className="btn-primary btn-lg" onClick={() => onNext(selected)}>
          Continue to Sign Up →
        </button>
      </div>
    </div>
  );
}

// ─── STEP 4: SIGN UP ───────────────────────────────────────────────────────────
function StepSignup({
  info,
  templateId,
  planId,
  onBack,
}: {
  info: BusinessInfo;
  templateId: string;
  planId: string;
  onBack: () => void;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const plan = PLANS.find(p => p.id === planId) || PLANS[1];
  const industry = INDUSTRIES.find(i => i.id === info.industry);

  async function handleSignup() {
    if (!email.trim()) return setError("Email is required");
    if (password.length < 8) return setError("Password must be at least 8 characters");
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          businessName: info.name,
          industry: info.industry,
          city: info.city,
          phone: info.phone,
          templateId,
          planId,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Signup failed");
      }
      router.push("/checkout?plan=" + planId);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="step-content">
      <div className="step-header">
        <h2>You're almost live 🎉</h2>
        <p>Create your account and we'll start building immediately</p>
      </div>

      {/* Order summary */}
      <div className="order-summary">
        <div className="order-summary-title">Order Summary</div>
        <div className="order-row">
          <span>Business</span>
          <span>{info.name} · {info.city}</span>
        </div>
        <div className="order-row">
          <span>Industry</span>
          <span>{industry?.emoji} {industry?.label}</span>
        </div>
        <div className="order-row">
          <span>Template</span>
          <span>{TEMPLATE_STYLES[templateId]?.name || templateId}</span>
        </div>
        <div className="order-row">
          <span>Plan</span>
          <span className="order-plan">{plan.name} — {plan.price}/mo</span>
        </div>
        <div className="order-divider" />
        <div className="order-row order-total">
          <span>Due today</span>
          <span>{plan.price}/mo</span>
        </div>
      </div>

      <div className="form-group">
        <label>Email *</label>
        <input
          type="email"
          placeholder="you@yourbusiness.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="form-input"
        />
      </div>

      <div className="form-group">
        <label>Password *</label>
        <input
          type="password"
          placeholder="At least 8 characters"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="form-input"
        />
      </div>

      {error && <div className="error-msg">{error}</div>}

      <button
        className="btn-primary btn-lg btn-full"
        onClick={handleSignup}
        disabled={loading}
      >
        {loading ? "Creating your account…" : `Create Account & Pay ${plan.price}/mo →`}
      </button>

      <p className="signup-terms">
        By signing up you agree to our Terms of Service and Privacy Policy.
        Cancel anytime.
      </p>

      <div className="step-actions" style={{ marginTop: "12px" }}>
        <button className="btn-ghost" onClick={onBack}>← Back</button>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function PreviewPage() {
  const [step, setStep] = useState(0);
  const [info, setInfo] = useState<BusinessInfo | null>(null);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [planId, setPlanId] = useState<string | null>(null);
  const [content, setContent] = useState<GeneratedContent | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);

  // When info is set, generate AI content in the background
  async function handleInfoNext(businessInfo: BusinessInfo) {
    setInfo(businessInfo);
    setStep(1);
    setLoadingContent(true);
    setContent(null);
    try {
      const res = await fetch("/api/generate-preview-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(businessInfo),
      });
      const data = await res.json();
      setContent(data);
    } catch {
      // fail silently — templates still show without personalized content
    }
    setLoadingContent(false);
  }

  function handleTemplateNext(tid: string) {
    setTemplateId(tid);
    setStep(2);
  }

  function handlePlanNext(pid: string) {
    setPlanId(pid);
    setStep(3);
  }

  return (
    <div className="preview-page">
      <nav className="preview-nav">
        <div className="preview-nav-logo">Exsisto</div>
        <div className="preview-nav-tag">Build your site in 60 seconds</div>
      </nav>

      <div className="preview-container">
        <StepBar step={step} />

        {step === 0 && <StepInfo onNext={handleInfoNext} />}
        {step === 1 && info && (
          <StepTemplate
            info={info}
            content={content}
            loadingContent={loadingContent}
            onNext={handleTemplateNext}
            onBack={() => setStep(0)}
          />
        )}
        {step === 2 && (
          <StepPlan
            onNext={handlePlanNext}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && info && templateId && planId && (
          <StepSignup
            info={info}
            templateId={templateId}
            planId={planId}
            onBack={() => setStep(2)}
          />
        )}
      </div>
    </div>
  );
}
