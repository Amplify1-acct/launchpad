"use client";

import { useState, useEffect, useRef } from "react";

// ── Showcase scenarios — each plays through automatically ──────────────────
const SCENARIOS = [
  {
    business: "Smith & Jones Law",
    industry: "Law Firm",
    city: "Newark, NJ",
    services: ["Business Law", "Contract Law", "Employment Law"],
    template: "professional",
    // Per-scenario specifics for the mockup
    heroHeadline: "Business Law &\nContract Counsel",
    heroCopy: "Smith & Jones Law serves entrepreneurs and businesses throughout New Jersey with strategic legal counsel and proven results.",
    stats: [["20+", "Years Experience"], ["$80M+", "Deals Closed"], ["500+", "Clients Served"]],
    cta: "Free Consultation",
    navHighlight: "Practice Areas",
    sectionLabel: "Practice Areas",
    sectionHeading: "What We Handle",
    serviceDesc: "Serving businesses throughout New Jersey with expert legal guidance.",
    accentColor: "#8b4513",
    image: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1400&h=900&fit=crop&auto=format",
  },
  {
    business: "Miller's Plumbing",
    industry: "Plumbing",
    city: "Chicago, IL",
    services: ["Emergency Repairs", "Drain Cleaning", "Water Heaters"],
    template: "trades",
    heroHeadline: "PLUMBING\nEXPERTS",
    heroCopy: "Licensed & insured. Serving Chicago and surrounding areas. Available 24/7 for emergencies.",
    stats: [["24/7", "Emergency"], ["500+", "Jobs Done"], ["5★", "Rated"]],
    cta: "Get a Free Quote",
    navHighlight: "Services",
    sectionLabel: "Our Services",
    sectionHeading: "What We Do",
    serviceDesc: "Fast, reliable service across Chicago and the surrounding suburbs.",
    accentColor: "#a8c500",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1400&h=900&fit=crop&auto=format",
  },
  {
    business: "Coastal Dental Studio",
    industry: "Dental Office",
    city: "San Diego, CA",
    services: ["General Dentistry", "Teeth Whitening", "Invisalign"],
    template: "dental",
    heroHeadline: "Modern Dentistry\nin San Diego",
    heroCopy: "Coastal Dental Studio offers compassionate, comprehensive dental care for the whole family in a comfortable, modern setting.",
    stats: [["15+", "Years Practice"], ["3,000+", "Happy Patients"], ["99%", "Satisfaction"]],
    cta: "Book Appointment",
    navHighlight: "Services",
    sectionLabel: "Our Services",
    sectionHeading: "Dental Care We Offer",
    serviceDesc: "Gentle, expert dental care for patients of all ages in San Diego.",
    accentColor: "#0d7694",
    image: "https://images.unsplash.com/photo-1606811971618-4486d14f3f99?w=1400&h=900&fit=crop&auto=format",
  },
  {
    business: "The Tactile Gallery",
    industry: "Artisan Bakery",
    city: "Portland, OR",
    services: ["Fresh Daily Breads", "Workshops", "Subscriptions"],
    template: "bakery",
    heroHeadline: "Gathered by the\nWarmth of the Hearth",
    heroCopy: "A slow-risen collective of bakers, artists, and neighbors. We share more than just recipes — we share the table.",
    stats: [["Daily", "Fresh Baked"], ["12+", "Workshops/mo"], ["500+", "Subscribers"]],
    cta: "Visit Us",
    navHighlight: "Community",
    sectionLabel: "From Our Ovens",
    sectionHeading: "What We Bake",
    serviceDesc: "Slow-fermented, locally sourced, baked with intention every morning.",
    accentColor: "#8B2500",
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1400&h=900&fit=crop&auto=format",
  },
  {
    business: "Summit Financial",
    industry: "Financial Advisory",
    city: "Denver, CO",
    services: ["Retirement Planning", "Investment Management", "Estate Planning"],
    template: "financial",
    heroHeadline: "Wealth Management\nfor Colorado Families",
    heroCopy: "Summit Financial helps individuals and families in Denver build, protect, and transfer wealth with personalized financial strategies.",
    stats: [["$200M+", "Assets Managed"], ["25+", "Years Experience"], ["300+", "Families Served"]],
    cta: "Free Consultation",
    navHighlight: "Services",
    sectionLabel: "Our Services",
    sectionHeading: "How We Help",
    serviceDesc: "Personalized financial guidance for Colorado families and business owners.",
    accentColor: "#1e5799",
    image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1400&h=900&fit=crop&auto=format",
  },
];

// ── Step durations (ms) ────────────────────────────────────────────────────
const STEP_DURATIONS = {
  typing: 1800,      // business name types in
  industry: 900,     // industry snaps in
  services: 1600,    // service chips pop one by one
  building: 3200,    // progress bar fills
  reveal: 5000,      // site preview shown, then cycle
};

const TOTAL = Object.values(STEP_DURATIONS).reduce((a, b) => a + b, 0);

// ── Site preview mockup — editorial professional style ─────────────────────
function SiteMockup({ scenario }: { scenario: typeof SCENARIOS[0] }) {
  const ac = scenario.accentColor;
  const headLines = scenario.heroHeadline.split("\n");

  // ── BAKERY: Warm editorial, split hero, serif, cream background ──────────
  if (scenario.template === "bakery") {
    return (
      <div style={{ fontFamily: "Georgia, serif", background: "#faf6f1", height: "100%", overflowY: "auto" }}>
        <div style={{ background: "#faf6f1", borderBottom: "1px solid #e8ddd2", padding: "0 1.5rem", height: 48, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0 }}>
          <div style={{ fontStyle: "italic", fontWeight: 700, fontSize: 13, color: "#2c1810" }}>{scenario.business}</div>
          <div style={{ display: "flex", gap: 16, fontSize: 9, fontFamily: "sans-serif", textTransform: "uppercase", letterSpacing: "0.08em", color: "#8a7060" }}>
            {["Our Breads", scenario.navHighlight, "Visit Us", "Subscriptions"].map((l, i) => (
              <span key={i} style={{ color: i === 1 ? ac : undefined, borderBottom: i === 1 ? `1px solid ${ac}` : undefined, paddingBottom: i === 1 ? 2 : undefined }}>{l}</span>
            ))}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
          <div style={{ padding: "2.5rem 1.5rem", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ fontSize: 22, color: ac, lineHeight: 1.2, fontWeight: 700, marginBottom: 12 }}>
              {headLines[0]}<br/><em>{headLines[1]}</em>
            </div>
            <p style={{ fontSize: 10, color: "#6b5a4e", lineHeight: 1.7, maxWidth: 200 }}>{scenario.heroCopy}</p>
            <div style={{ marginTop: 16, display: "inline-block", background: ac, color: "#fff", padding: "6px 14px", fontSize: 9, fontFamily: "sans-serif", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", width: "fit-content" }}>{scenario.cta}</div>
          </div>
          <div style={{ position: "relative", minHeight: 200, overflow: "hidden" }}>
            <img src={scenario.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", bottom: 12, left: 12, right: 12, background: "rgba(44,24,16,0.88)", padding: "8px 12px" }}>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.75)", fontStyle: "italic", lineHeight: 1.5 }}>"The table is where the soul of the community is fed."</div>
              <div style={{ fontSize: 8, color: "rgba(255,255,255,0.4)", marginTop: 3, fontFamily: "sans-serif", textTransform: "uppercase", letterSpacing: "0.08em" }}>— The Baker's Note</div>
            </div>
          </div>
        </div>
        <div style={{ background: ac, display: "flex", padding: "0.75rem 1.5rem" }}>
          {scenario.stats.map(([v, l], i) => (
            <div key={i} style={{ flex: 1, textAlign: "center", borderRight: i < 2 ? "1px solid rgba(255,255,255,0.2)" : "none" }}>
              <div style={{ fontSize: 15, color: "#fff", fontWeight: 700 }}>{v}</div>
              <div style={{ fontSize: 8, color: "rgba(255,255,255,0.6)", fontFamily: "sans-serif", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{ padding: "1.5rem" }}>
          <div style={{ fontSize: 8, fontFamily: "sans-serif", textTransform: "uppercase", letterSpacing: "0.12em", color: ac, marginBottom: 6 }}>{scenario.sectionLabel}</div>
          <div style={{ fontSize: 16, color: "#2c1810", marginBottom: 12, fontWeight: 700 }}>{scenario.sectionHeading}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {scenario.services.map((s, i) => (
              <div key={i} style={{ background: "#fff", border: "1px solid #e8ddd2", padding: "0.75rem" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#2c1810", marginBottom: 3 }}>{s}</div>
                <div style={{ fontSize: 9, color: "#8a7060", lineHeight: 1.5, fontFamily: "sans-serif" }}>{scenario.serviceDesc}</div>
                <div style={{ fontSize: 8, color: ac, fontFamily: "sans-serif", fontWeight: 700, textTransform: "uppercase", marginTop: 6 }}>Learn more →</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── TRADES: Full-bleed dark hero, bold yellow/green accent, utility ───────
  if (scenario.template === "trades") {
    return (
      <div style={{ fontFamily: "'Arial', sans-serif", background: "#f0f0ee", height: "100%", overflowY: "auto" }}>
        {/* Full bleed hero */}
        <div style={{ position: "relative", minHeight: 260, overflow: "hidden" }}>
          <img src={scenario.image} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(0,0,0,0.85) 60%, rgba(0,0,0,0.3))" }} />
          {/* Nav overlay */}
          <div style={{ position: "relative", padding: "0 1.5rem", height: 48, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ fontWeight: 900, fontSize: 14, color: "#fff", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {scenario.business.split(" ")[0]}<span style={{ color: ac }}>{scenario.business.split(" ").slice(1).join(" ")}</span>
            </div>
            <div style={{ background: ac, color: "#111", padding: "5px 12px", fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em" }}>{scenario.cta}</div>
          </div>
          {/* Hero content */}
          <div style={{ position: "relative", padding: "1.5rem" }}>
            <div style={{ background: ac, color: "#111", display: "inline-block", padding: "2px 8px", fontSize: 8, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Serving {scenario.city}</div>
            <div style={{ fontWeight: 900, fontSize: 32, color: "#fff", textTransform: "uppercase", lineHeight: 1, letterSpacing: "-0.01em", marginBottom: 10 }}>
              {headLines[0]}<br/><span style={{ color: ac }}>{headLines[1] || ""}</span>
            </div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginBottom: 16, lineHeight: 1.5, maxWidth: 260 }}>{scenario.heroCopy}</div>
            <div style={{ display: "flex", gap: 8 }}>
              <span style={{ background: ac, color: "#111", padding: "7px 16px", fontSize: 9, fontWeight: 800, textTransform: "uppercase" }}>{scenario.cta}</span>
              <span style={{ border: "2px solid rgba(255,255,255,0.3)", color: "rgba(255,255,255,0.6)", padding: "6px 14px", fontSize: 9, fontWeight: 700, textTransform: "uppercase" }}>Our Work</span>
            </div>
          </div>
        </div>
        {/* Stats bar */}
        <div style={{ background: "#111", display: "flex" }}>
          {scenario.stats.map(([v, l], i) => (
            <div key={i} style={{ flex: 1, textAlign: "center", padding: "0.75rem", borderRight: i < 2 ? "1px solid rgba(255,255,255,0.08)" : "none" }}>
              <div style={{ fontWeight: 900, fontSize: 18, color: ac, textTransform: "uppercase" }}>{v}</div>
              <div style={{ fontSize: 8, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
        {/* Services - horizontal cards */}
        <div style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ fontWeight: 900, fontSize: 14, textTransform: "uppercase", color: "#111" }}>{scenario.sectionHeading}</div>
            <div style={{ fontSize: 8, color: ac, fontWeight: 800, textTransform: "uppercase" }}>All Services →</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {scenario.services.map((s, i) => (
              <div key={i} style={{ background: "#fff", borderLeft: `3px solid ${ac}`, padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 11, textTransform: "uppercase", color: "#111" }}>{s}</div>
                  <div style={{ fontSize: 9, color: "#666", marginTop: 2 }}>{scenario.serviceDesc}</div>
                </div>
                <div style={{ fontSize: 10, color: ac, fontWeight: 800 }}>→</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── DENTAL: Centered clean white, soft cards, minimal ────────────────────
  if (scenario.template === "dental") {
    return (
      <div style={{ fontFamily: "'Helvetica Neue', sans-serif", background: "#fff", height: "100%", overflowY: "auto" }}>
        <div style={{ background: "#fff", borderBottom: "1px solid #f0f0f0", padding: "0 1.5rem", height: 48, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#111", letterSpacing: "-0.01em" }}>{scenario.business}</div>
          <div style={{ background: ac, color: "#fff", padding: "5px 12px", fontSize: 9, fontWeight: 700, borderRadius: 20 }}>{scenario.cta}</div>
        </div>
        {/* Hero with image */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: 220, background: `linear-gradient(180deg, ${ac}06 0%, #fff 100%)` }}>
          <div style={{ padding: "2.5rem 1.5rem", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ display: "inline-block", background: `${ac}15`, color: ac, fontSize: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", padding: "4px 12px", borderRadius: 20, marginBottom: 14, width: "fit-content" }}>
              {scenario.city}
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#111", lineHeight: 1.2, letterSpacing: "-0.02em", marginBottom: 10 }}>
              {headLines[0]}<br/><span style={{ color: ac }}>{headLines[1]}</span>
            </div>
            <p style={{ fontSize: 10, color: "#666", lineHeight: 1.7, marginBottom: 16 }}>{scenario.heroCopy}</p>
            <div style={{ display: "flex", gap: 8 }}>
              <span style={{ background: ac, color: "#fff", padding: "8px 18px", fontSize: 9, fontWeight: 700, borderRadius: 20 }}>{scenario.cta}</span>
              <span style={{ border: `1px solid ${ac}`, color: ac, padding: "7px 16px", fontSize: 9, fontWeight: 600, borderRadius: 20 }}>Our Services</span>
            </div>
          </div>
          <div style={{ position: "relative", overflow: "hidden", borderRadius: "0 0 0 40px" }}>
            <img src={scenario.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 20%" }} />
            <div style={{ position: "absolute", bottom: 16, left: 16, background: "#fff", borderRadius: 10, padding: "8px 12px", boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#111" }}>⭐ 4.9 · 300+ Happy Patients</div>
            </div>
          </div>
        </div>
        {/* Stats pills */}
        <div style={{ display: "flex", gap: 8, padding: "1rem 1.5rem", justifyContent: "center" }}>
          {scenario.stats.map(([v, l], i) => (
            <div key={i} style={{ background: "#f8f8f8", border: "1px solid #eee", borderRadius: 12, padding: "10px 16px", textAlign: "center", flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: ac }}>{v}</div>
              <div style={{ fontSize: 8, color: "#999", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
        {/* Service cards — 3 across */}
        <div style={{ padding: "0.5rem 1.5rem 1.5rem" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#111", marginBottom: 10, textAlign: "center" }}>{scenario.sectionHeading}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {scenario.services.map((s, i) => (
              <div key={i} style={{ background: "#f8f9ff", border: "1px solid #eef0ff", borderRadius: 10, padding: "1rem", textAlign: "center" }}>
                <div style={{ width: 28, height: 28, background: `${ac}15`, borderRadius: "50%", margin: "0 auto 8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ width: 10, height: 10, background: ac, borderRadius: "50%" }} />
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#111", marginBottom: 3 }}>{s}</div>
                <div style={{ fontSize: 8, color: "#999", lineHeight: 1.4 }}>{scenario.serviceDesc}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    );
  }

  // ── FINANCIAL: Dark navy, data-forward, minimal, authoritative ────────────
  if (scenario.template === "financial") {
    return (
      <div style={{ fontFamily: "'Helvetica Neue', sans-serif", background: "#f4f6f9", height: "100%", overflowY: "auto" }}>
        {/* Dark nav */}
        <div style={{ background: "#0f1f3d", padding: "0 1.5rem", height: 48, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#fff", letterSpacing: "-0.01em" }}>{scenario.business}</div>
          <div style={{ display: "flex", gap: 16, fontSize: 9, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {["Services", "About", "Contact"].map((l, i) => <span key={i}>{l}</span>)}
            <span style={{ background: ac, color: "#fff", padding: "4px 10px", borderRadius: 2 }}>{scenario.cta}</span>
          </div>
        </div>
        {/* Hero - left aligned, dark panel */}
        <div style={{ background: "#0f1f3d", padding: "2rem 1.5rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: ac, marginBottom: 10 }}>{scenario.city}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#fff", lineHeight: 1.2, letterSpacing: "-0.02em", marginBottom: 10 }}>
              {headLines[0]}<br/>{headLines[1]}
            </div>
            <p style={{ fontSize: 9, color: "rgba(255,255,255,0.45)", lineHeight: 1.7, marginBottom: 16 }}>{scenario.heroCopy}</p>
            <span style={{ background: ac, color: "#fff", padding: "7px 16px", fontSize: 9, fontWeight: 700, borderRadius: 3 }}>{scenario.cta}</span>
          </div>
          {/* Stats grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {scenario.stats.map(([v, l], i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, padding: "12px" }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: ac }}>{v}</div>
                <div style={{ fontSize: 8, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 3 }}>{l}</div>
              </div>
            ))}
            <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, padding: "12px", gridColumn: "span 2" }}>
              <div style={{ fontSize: 8, color: "rgba(255,255,255,0.3)", marginBottom: 6 }}>Portfolio Performance</div>
              <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 30 }}>
                {[40,55,45,70,65,80,75,90,85,95].map((h, i) => (
                  <div key={i} style={{ flex: 1, background: ac, height: `${h}%`, borderRadius: 2, opacity: i === 9 ? 1 : 0.4 }} />
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* Services — horizontal list */}
        <div style={{ padding: "1.5rem" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f1f3d", marginBottom: 12 }}>{scenario.sectionHeading}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {scenario.services.map((s, i) => (
              <div key={i} style={{ background: "#fff", border: "1px solid #e8edf5", borderRadius: 6, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 32, height: 32, background: `${ac}12`, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <div style={{ width: 12, height: 12, background: ac, borderRadius: 2 }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#0f1f3d" }}>{s}</div>
                  <div style={{ fontSize: 9, color: "#888", marginTop: 2 }}>{scenario.serviceDesc}</div>
                </div>
                <div style={{ fontSize: 9, color: ac, fontWeight: 700 }}>→</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── PROFESSIONAL (Law): Editorial sidebar, dark, serif ────────────────────
  const ac2 = scenario.accentColor;
  return (
    <div style={{ fontFamily: "Georgia, serif", background: "#f5f2ed", height: "100%", overflowY: "auto", display: "grid", gridTemplateColumns: "72px 1fr", minHeight: "100%" }}>
      {/* Vertical sidebar */}
      <div style={{ background: "#1a1a18", display: "flex", flexDirection: "column", alignItems: "center", padding: "1rem 0", gap: 20, position: "sticky", top: 0, height: "100%" }}>
        <div style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", fontSize: 10, fontWeight: 700, color: "#fff", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          {scenario.business.split(" ")[0]}
        </div>
        <div style={{ width: 1, flex: 1, background: "rgba(255,255,255,0.1)" }} />
        {["H", "S", "A", "C"].map((l, i) => (
          <div key={i} style={{ fontSize: 9, color: i === 1 ? ac2 : "rgba(255,255,255,0.3)", fontFamily: "sans-serif", fontWeight: 700, textTransform: "uppercase" }}>{l}</div>
        ))}
        <div style={{ width: 1, flex: 1, background: "rgba(255,255,255,0.1)" }} />
        <div style={{ width: 28, height: 28, background: ac2, borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: 8, color: "#fff", fontWeight: 800, fontFamily: "sans-serif" }}>→</div>
        </div>
      </div>
      {/* Main content */}
      <div>
        {/* Hero */}
        <div style={{ background: "#1a1a18", padding: "2rem 1.5rem", position: "relative", overflow: "hidden" }}>
          <img src={scenario.image} alt="" style={{ position: "absolute", right: 0, top: 0, height: "100%", width: "45%", objectFit: "cover", opacity: 0.3 }} />
          <div style={{ position: "relative" }}>
            <div style={{ fontSize: 8, fontFamily: "sans-serif", textTransform: "uppercase", letterSpacing: "0.15em", color: ac2, marginBottom: 10 }}>{scenario.city} · Est. 2008</div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 22, color: "#fff", lineHeight: 1.15, marginBottom: 10, fontWeight: 700 }}>
              {headLines[0]}<br/><em style={{ color: ac2 }}>{headLines[1]}</em>
            </div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", lineHeight: 1.6, maxWidth: 240, marginBottom: 16 }}>{scenario.heroCopy}</div>
            <span style={{ background: ac2, color: "#fff", padding: "7px 16px", fontSize: 9, fontFamily: "sans-serif", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{scenario.cta}</span>
          </div>
        </div>
        {/* Stats row */}
        <div style={{ background: ac2, display: "flex" }}>
          {scenario.stats.map(([v, l], i) => (
            <div key={i} style={{ flex: 1, textAlign: "center", padding: "0.75rem", borderRight: i < 2 ? "1px solid rgba(255,255,255,0.2)" : "none" }}>
              <div style={{ fontSize: 16, color: "#fff", fontWeight: 700 }}>{v}</div>
              <div style={{ fontSize: 8, color: "rgba(255,255,255,0.6)", fontFamily: "sans-serif", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
        {/* Practice areas */}
        <div style={{ padding: "1.5rem", background: "#f5f2ed" }}>
          <div style={{ fontSize: 8, fontFamily: "sans-serif", textTransform: "uppercase", letterSpacing: "0.12em", color: ac2, marginBottom: 6 }}>{scenario.sectionLabel}</div>
          <div style={{ fontSize: 16, color: "#111", marginBottom: 12, fontWeight: 700 }}>{scenario.sectionHeading}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {scenario.services.map((s, i) => (
              <div key={i} style={{ background: "#fff", border: "1px solid #e0dbd2", padding: "0.75rem" }}>
                <div style={{ fontSize: 11, fontFamily: "Georgia, serif", fontWeight: 700, color: "#111", marginBottom: 3 }}>{s}</div>
                <div style={{ fontSize: 9, color: "#6a6a62", lineHeight: 1.5, fontFamily: "sans-serif" }}>{scenario.serviceDesc}</div>
                <div style={{ fontSize: 8, color: ac2, fontFamily: "sans-serif", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 6 }}>Learn more →</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


// ── Main Demo component ────────────────────────────────────────────────────
export default function Demo() {
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [phase, setPhase] = useState<"typing" | "industry" | "services" | "building" | "reveal">("typing");
  const [typedName, setTypedName] = useState("");
  const [shownServices, setShownServices] = useState<number>(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const scenario = SCENARIOS[scenarioIdx];
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  // Master sequencer
  useEffect(() => {
    if (paused) return;

    let cancelled = false;
    const delay = (ms: number) => new Promise<void>(res => { const t = setTimeout(res, ms); return t; });

    async function run() {
      // Reset
      setTypedName("");
      setShownServices(0);
      setProgress(0);
      setPhase("typing");

      // 1. Type business name
      const name = SCENARIOS[scenarioIdx].business;
      for (let i = 1; i <= name.length; i++) {
        if (cancelled) return;
        setTypedName(name.slice(0, i));
        await delay(STEP_DURATIONS.typing / name.length);
      }
      if (cancelled) return;

      // 2. Industry snaps in
      setPhase("industry");
      await delay(STEP_DURATIONS.industry);
      if (cancelled) return;

      // 3. Services pop one by one
      setPhase("services");
      const services = SCENARIOS[scenarioIdx].services;
      for (let i = 0; i < services.length; i++) {
        if (cancelled) return;
        setShownServices(i + 1);
        await delay(STEP_DURATIONS.services / services.length);
      }
      if (cancelled) return;

      // 4. Build progress
      setPhase("building");
      const steps = 40;
      for (let i = 0; i <= steps; i++) {
        if (cancelled) return;
        setProgress(i / steps * 100);
        await delay(STEP_DURATIONS.building / steps);
      }
      if (cancelled) return;

      // 5. Reveal site
      setPhase("reveal");
      await delay(STEP_DURATIONS.reveal);
      if (cancelled) return;

      // Next scenario
      setScenarioIdx(idx => (idx + 1) % SCENARIOS.length);
    }

    run();
    return () => { cancelled = true; };
  }, [scenarioIdx, paused]);

  const stepLabels = [
    { key: "typing", label: "Enter business name" },
    { key: "industry", label: "Pick your industry" },
    { key: "services", label: "Choose services" },
    { key: "building", label: "AI builds your site" },
    { key: "reveal", label: "Ready to publish" },
  ];
  const currentStepIdx = stepLabels.findIndex(s => s.key === phase);

  return (
    <section style={{
      background: "#080808",
      padding: "7rem 1.5rem",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Subtle noise texture */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.4,
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E\")",
        pointerEvents: "none",
      }} />

      <div style={{ maxWidth: 1080, margin: "0 auto", position: "relative" }}>

        {/* Header */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3rem", alignItems: "end", marginBottom: "3.5rem" }}>
          <div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              marginBottom: "1.25rem",
              fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.12em",
              textTransform: "uppercase", color: "rgba(255,255,255,0.3)",
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: "50%", background: "#4ade80",
                display: "inline-block",
                boxShadow: "0 0 0 0 rgba(74,222,128,0.4)",
                animation: "livePulse 2s infinite",
              }} />
              How it works
            </div>
            <h2 style={{
              fontFamily: "'Playfair Display', 'Cormorant Garamond', Georgia, serif",
              fontSize: "clamp(2.2rem, 3.5vw, 3rem)",
              fontWeight: 700, color: "#fff", lineHeight: 1.1,
              letterSpacing: "-0.02em",
            }}>
              Three steps.<br/>
              <span style={{ color: "rgba(255,255,255,0.25)", fontStyle: "italic" }}>Thirty seconds.</span>
            </h2>
          </div>
          <div>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.95rem", lineHeight: 1.7, marginBottom: "1.25rem" }}>
              You fill in your name and pick your services. Exsisto writes the copy, builds the pages, adds the schema markup, and publishes your site — while you watch.
            </p>
            <a href="/preview" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "#fff", color: "#000",
              padding: "0.7rem 1.5rem", borderRadius: 4,
              fontWeight: 800, fontSize: "0.85rem",
              textDecoration: "none", letterSpacing: "0.03em",
            }}>
              Build yours now →
            </a>
          </div>
        </div>

        {/* Main demo frame */}
        <div style={{
          display: "grid", gridTemplateColumns: "300px 1fr",
          background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 10, overflow: "hidden",
          boxShadow: "0 40px 100px rgba(0,0,0,0.8)",
          minHeight: 520,
        }}>

          {/* Left panel — animated form */}
          <div style={{
            borderRight: "1px solid rgba(255,255,255,0.06)",
            padding: "1.75rem",
            display: "flex", flexDirection: "column", gap: "1.5rem",
            background: "#0c0c0c",
          }}>
            {/* Logo */}
            <div style={{
              fontFamily: "Georgia, serif", fontSize: "0.85rem",
              color: "rgba(255,255,255,0.2)", letterSpacing: "0.04em",
              paddingBottom: "1rem", borderBottom: "1px solid rgba(255,255,255,0.05)",
            }}>
              Exsisto
            </div>

            {/* Progress steps */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {stepLabels.map((s, i) => {
                const done = i < currentStepIdx;
                const active = i === currentStepIdx;
                return (
                  <div key={s.key} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "0.5rem 0.6rem",
                    borderRadius: 5,
                    background: active ? "rgba(255,255,255,0.05)" : "transparent",
                    transition: "background 0.3s",
                  }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "0.65rem", fontWeight: 800,
                      background: done ? "#4ade80" : active ? "#fff" : "rgba(255,255,255,0.06)",
                      color: done ? "#000" : active ? "#000" : "rgba(255,255,255,0.2)",
                      transition: "all 0.3s",
                    }}>
                      {done ? "✓" : i + 1}
                    </div>
                    <span style={{
                      fontSize: "0.78rem", fontWeight: active ? 700 : 400,
                      color: done ? "rgba(255,255,255,0.5)" : active ? "#fff" : "rgba(255,255,255,0.2)",
                      transition: "color 0.3s",
                    }}>
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Animated form fields */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", flex: 1 }}>

              {/* Business name */}
              <div>
                <div style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.25)", marginBottom: 6 }}>Business Name</div>
                <div style={{
                  background: "rgba(255,255,255,0.04)", border: "1px solid",
                  borderColor: phase === "typing" ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.1)",
                  borderRadius: 5, padding: "0.6rem 0.85rem",
                  fontSize: "0.85rem", color: "#fff", minHeight: 36,
                  display: "flex", alignItems: "center",
                  transition: "border-color 0.3s",
                }}>
                  {typedName}
                  {phase === "typing" && (
                    <span style={{ display: "inline-block", width: 2, height: "1em", background: "#fff", marginLeft: 1, animation: "blink 1s step-end infinite" }} />
                  )}
                </div>
              </div>

              {/* Industry */}
              <div style={{ opacity: phase === "typing" ? 0.3 : 1, transition: "opacity 0.4s" }}>
                <div style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.25)", marginBottom: 6 }}>Industry</div>
                <div style={{
                  background: phase !== "typing" ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.02)",
                  border: "1px solid",
                  borderColor: phase === "industry" ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.08)",
                  borderRadius: 5, padding: "0.6rem 0.85rem",
                  fontSize: "0.85rem",
                  color: phase !== "typing" ? "#fff" : "rgba(255,255,255,0.15)",
                  minHeight: 36, display: "flex", alignItems: "center",
                  transition: "all 0.4s",
                }}>
                  {phase !== "typing" ? scenario.industry : "Select industry..."}
                </div>
              </div>

              {/* Services */}
              <div style={{ opacity: ["typing", "industry"].includes(phase) ? 0.2 : 1, transition: "opacity 0.4s" }}>
                <div style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.25)", marginBottom: 6 }}>Services</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {scenario.services.slice(0, shownServices).map((s, i) => (
                    <div key={i} style={{
                      background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: 3, padding: "3px 8px",
                      fontSize: "0.72rem", color: "#fff", fontWeight: 600,
                      animation: "popIn 0.25s ease",
                    }}>
                      ✓ {s}
                    </div>
                  ))}
                  {shownServices === 0 && (
                    <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.15)" }}>No services selected</div>
                  )}
                </div>
              </div>

              {/* Build button */}
              <div style={{ marginTop: "auto" }}>
                {phase === "building" ? (
                  <div>
                    <div style={{
                      width: "100%", height: 38,
                      background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 5, overflow: "hidden", position: "relative",
                    }}>
                      <div style={{
                        position: "absolute", inset: 0, display: "flex", alignItems: "center",
                        justifyContent: "center", fontSize: "0.78rem", color: "rgba(255,255,255,0.4)",
                        fontWeight: 600, zIndex: 1,
                      }}>
                        Building... {Math.round(progress)}%
                      </div>
                      <div style={{
                        position: "absolute", top: 0, left: 0, bottom: 0,
                        width: `${progress}%`, background: "rgba(255,255,255,0.08)",
                        transition: "width 0.1s linear",
                      }} />
                    </div>
                  </div>
                ) : phase === "reveal" ? (
                  <div style={{
                    width: "100%", padding: "0.6rem", background: "#4ade80",
                    borderRadius: 5, textAlign: "center",
                    fontSize: "0.85rem", fontWeight: 800, color: "#000",
                  }}>
                    ✓ Site Ready
                  </div>
                ) : (
                  <div style={{
                    width: "100%", padding: "0.6rem",
                    background: phase === "services" && shownServices === scenario.services.length
                      ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 5, textAlign: "center",
                    fontSize: "0.85rem", fontWeight: 700, color: "rgba(255,255,255,0.3)",
                  }}>
                    Build My Site →
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right panel — site preview */}
          <div style={{ position: "relative", overflow: "hidden", background: "#f5f2ed" }}>
            {/* Build overlay */}
            {(phase === "building" || phase === "typing" || phase === "industry" || phase === "services") && (
              <div style={{
                position: "absolute", inset: 0, background: "#0c0c0c",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                gap: "1.25rem", zIndex: 10,
                opacity: phase === "building" ? 1 : 0.97,
              }}>
                {phase === "building" ? (
                  <>
                    <div style={{ position: "relative", width: 48, height: 48 }}>
                      <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.06)" }} />
                      <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid transparent", borderTopColor: "#fff", animation: "spin 0.8s linear infinite" }} />
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#fff", marginBottom: 4 }}>
                        {progress < 30 ? "Writing copy..." :
                         progress < 55 ? "Building service pages..." :
                         progress < 75 ? "Adding schema markup..." :
                         progress < 90 ? "Generating SEO..." : "Almost done..."}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.25)" }}>
                        {scenario.business}
                      </div>
                    </div>
                    <div style={{ width: 160, height: 2, background: "rgba(255,255,255,0.08)", borderRadius: 1, overflow: "hidden" }}>
                      <div style={{ height: "100%", background: "#fff", borderRadius: 1, width: `${progress}%`, transition: "width 0.1s linear" }} />
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: "2.5rem", opacity: 0.08 }}>⬜</div>
                    <div style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.15)", textAlign: "center", lineHeight: 1.6 }}>
                      Your site will appear here<br/>after you fill in your details
                    </div>
                    <div style={{ display: "flex", gap: 6, opacity: 0.1 }}>
                      {["Home", "Services", "About", "Contact"].map(p => (
                        <div key={p} style={{ fontSize: "0.65rem", padding: "2px 8px", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 3, color: "rgba(255,255,255,0.5)" }}>{p}</div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Site mockup — slides in on reveal */}
            <div style={{
              position: "absolute", inset: 0,
              transform: phase === "reveal" ? "translateY(0)" : "translateY(20px)",
              opacity: phase === "reveal" ? 1 : 0,
              transition: "all 0.6s cubic-bezier(0.22, 1, 0.36, 1)",
            }}>
              <SiteMockup scenario={scenario} />
            </div>
          </div>
        </div>

        {/* Bottom — scenario indicators + CTA */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "1.5rem" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.2)", marginRight: 4 }}>Showing</span>
            {SCENARIOS.map((s, i) => (
              <button
                key={i}
                onClick={() => { setScenarioIdx(i); }}
                style={{
                  background: i === scenarioIdx ? "#fff" : "rgba(255,255,255,0.1)",
                  border: "none", borderRadius: 999,
                  width: i === scenarioIdx ? 24 : 6,
                  height: 6, cursor: "pointer",
                  transition: "all 0.3s",
                  padding: 0,
                }}
                title={s.business}
              />
            ))}
            <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.2)", marginLeft: 4 }}>
              {scenario.business} · {scenario.industry}
            </span>
          </div>

          <a href="/preview" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            fontSize: "0.8rem", color: "rgba(255,255,255,0.4)",
            textDecoration: "none", transition: "color 0.2s",
          }}>
            Try it with your business →
          </a>
        </div>
      </div>

      <style>{`
        @keyframes livePulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(74,222,128,0.5); }
          50% { box-shadow: 0 0 0 6px rgba(74,222,128,0); }
        }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes popIn {
          from { transform: scale(0.7); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </section>
  );
}