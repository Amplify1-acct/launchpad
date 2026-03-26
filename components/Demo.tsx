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
  },
  {
    business: "Miller's Plumbing",
    industry: "Plumbing",
    city: "Chicago, IL",
    services: ["Emergency Repairs", "Drain Cleaning", "Water Heaters"],
    template: "trades",
  },
  {
    business: "Coastal Dental Studio",
    industry: "Dental Office",
    city: "San Diego, CA",
    services: ["General Dentistry", "Teeth Whitening", "Invisalign"],
    template: "professional",
  },
  {
    business: "Summit Financial",
    industry: "Financial Advisory",
    city: "Denver, CO",
    services: ["Retirement Planning", "Investment Management", "Estate Planning"],
    template: "professional",
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
  const isProf = scenario.template === "professional";

  if (isProf) {
    return (
      <div style={{ fontFamily: "'Georgia', serif", background: "#f5f2ed", height: "100%", overflowY: "auto", fontSize: 13 }}>
        {/* Nav */}
        <div style={{ background: "#fff", borderBottom: "1px solid #e0dbd2", padding: "0 2rem", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0 }}>
          <div style={{ fontFamily: "Georgia, serif", fontWeight: 700, fontSize: 15, color: "#111" }}>
            {scenario.business.split(" ")[0]} <em style={{ color: "#8b4513", fontStyle: "italic" }}>{scenario.business.split(" ").slice(1).join(" ")}</em>
          </div>
          <div style={{ display: "flex", gap: 20, fontSize: 10, fontFamily: "sans-serif", textTransform: "uppercase", letterSpacing: "0.06em", color: "#6a6a62" }}>
            <span>Home</span><span style={{ color: "#8b4513", fontWeight: 700 }}>Practice Areas</span><span>About</span><span>Contact</span>
            <span style={{ background: "#111", color: "#fff", padding: "4px 10px", borderRadius: 1, fontSize: 9 }}>Consultation</span>
          </div>
        </div>
        {/* Hero */}
        <div style={{ background: "#1a1a18", padding: "3rem 2rem", display: "flex", gap: "2rem", alignItems: "center" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, fontFamily: "sans-serif", textTransform: "uppercase", letterSpacing: "0.12em", color: "#8b4513", marginBottom: 10 }}>Licensed in {scenario.city.split(", ")[1]} · Est. 2008</div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 26, color: "#fff", lineHeight: 1.15, marginBottom: 12, fontWeight: 700 }}>
              {scenario.services[0]} &<br/>Legal Counsel
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", lineHeight: 1.6, maxWidth: 280, marginBottom: 16 }}>
              {scenario.business} serves clients throughout {scenario.city.split(", ")[1]} with decades of combined experience.
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <span style={{ background: "#8b4513", color: "#fff", padding: "7px 14px", fontSize: 10, fontFamily: "sans-serif", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>Free Consultation</span>
              <span style={{ border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.5)", padding: "7px 14px", fontSize: 10, fontFamily: "sans-serif", letterSpacing: "0.06em", textTransform: "uppercase" }}>Our Services</span>
            </div>
          </div>
          <div style={{ width: 160, height: 110, background: "rgba(255,255,255,0.04)", borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
            <img src="https://images.pexels.com/photos/5669619/pexels-photo-5669619.jpeg?auto=compress&cs=tinysrgb&w=400" alt="" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.5 }} />
          </div>
        </div>
        {/* Stats */}
        <div style={{ background: "#8b4513", display: "flex", padding: "1rem 2rem", gap: 0 }}>
          {[["20+", "Years Experience"], ["$50M+", "Recovered"], ["1,200+", "Cases Won"]].map(([v, l], i) => (
            <div key={i} style={{ flex: 1, textAlign: "center", borderRight: i < 2 ? "1px solid rgba(255,255,255,0.2)" : "none" }}>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 18, color: "#fff", fontWeight: 700 }}>{v}</div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.6)", fontFamily: "sans-serif", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
        {/* Services */}
        <div style={{ padding: "2rem", background: "#f5f2ed" }}>
          <div style={{ fontSize: 9, fontFamily: "sans-serif", textTransform: "uppercase", letterSpacing: "0.12em", color: "#8b4513", marginBottom: 6 }}>Practice Areas</div>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 18, color: "#111", marginBottom: 16, fontWeight: 700 }}>What We Handle</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {scenario.services.map((s, i) => (
              <div key={i} style={{ background: "#fff", border: "1px solid #e0dbd2", padding: "1rem", borderRadius: 2 }}>
                <div style={{ fontSize: 13, fontFamily: "Georgia, serif", fontWeight: 700, color: "#111", marginBottom: 4 }}>{s}</div>
                <div style={{ fontSize: 10, color: "#6a6a62", lineHeight: 1.5, fontFamily: "sans-serif" }}>Serving clients throughout {scenario.city.split(", ")[1]} with proven results.</div>
                <div style={{ fontSize: 9, color: "#8b4513", fontFamily: "sans-serif", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 8 }}>Learn more →</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Trades template
  return (
    <div style={{ fontFamily: "'Barlow', sans-serif", background: "#f7f7f5", height: "100%", overflowY: "auto", fontSize: 13 }}>
      <div style={{ background: "#111", padding: "0 2rem", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0 }}>
        <div style={{ fontWeight: 900, fontSize: 15, color: "#fff", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          {scenario.business.split(" ")[0]}<span style={{ color: "#a8c500" }}>{scenario.business.split(" ").slice(1).join(" ")}</span>
        </div>
        <div style={{ display: "flex", gap: 20, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.45)" }}>
          <span>Home</span><span style={{ color: "#a8c500", fontWeight: 800 }}>Services</span><span>About</span>
          <span style={{ background: "#a8c500", color: "#111", padding: "4px 10px", fontWeight: 800, borderRadius: 1 }}>Free Quote</span>
        </div>
      </div>
      <div style={{ background: "#111", padding: "2.5rem 2rem", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: `url(https://images.pexels.com/photos/7937386/pexels-photo-7937386.jpeg?auto=compress&cs=tinysrgb&w=800)`, backgroundSize: "cover", opacity: 0.15 }} />
        <div style={{ position: "relative" }}>
          <div style={{ background: "#a8c500", color: "#111", display: "inline-block", padding: "3px 10px", fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Serving {scenario.city}</div>
          <div style={{ fontWeight: 900, fontSize: 28, color: "#fff", textTransform: "uppercase", lineHeight: 1.05, letterSpacing: "-0.01em", marginBottom: 12 }}>
            {scenario.industry}<br/><span style={{ color: "#a8c500" }}>Experts</span>
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginBottom: 16, lineHeight: 1.5 }}>Licensed & insured. Serving {scenario.city} and surrounding areas.</div>
          <div style={{ display: "flex", gap: 10 }}>
            <span style={{ background: "#a8c500", color: "#111", padding: "7px 16px", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em" }}>Get a Free Quote</span>
            <span style={{ border: "2px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.5)", padding: "6px 14px", fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>Our Work</span>
          </div>
        </div>
      </div>
      <div style={{ background: "#a8c500", display: "flex", padding: "0.85rem 2rem", gap: 0 }}>
        {[["15+", "Years"], ["500+", "Jobs Done"], ["5★", "Rated"]].map(([v, l], i) => (
          <div key={i} style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontWeight: 900, fontSize: 17, color: "#111", textTransform: "uppercase" }}>{v}</div>
            <div style={{ fontSize: 9, color: "rgba(0,0,0,0.5)", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 1 }}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{ padding: "1.5rem 2rem" }}>
        <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.12em", color: "#a8c500", fontWeight: 800, marginBottom: 6 }}>Our Services</div>
        <div style={{ fontWeight: 900, fontSize: 18, textTransform: "uppercase", color: "#111", marginBottom: 14 }}>What We Do</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {scenario.services.map((s, i) => (
            <div key={i} style={{ background: "#fff", border: "1px solid #e4e4e0", padding: "1rem" }}>
              <div style={{ fontWeight: 800, fontSize: 12, textTransform: "uppercase", color: "#111", marginBottom: 4 }}>{s}</div>
              <div style={{ fontSize: 10, color: "#666", lineHeight: 1.5 }}>Serving {scenario.city} and surrounding areas.</div>
              <div style={{ fontSize: 9, color: "#a8c500", fontWeight: 800, textTransform: "uppercase", marginTop: 8 }}>Learn more →</div>
            </div>
          ))}
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