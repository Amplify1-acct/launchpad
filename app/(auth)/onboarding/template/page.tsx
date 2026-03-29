"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import styles from "./template.module.css";

const STYLES = [
  {
    id: "skeleton-bold",
    name: "Bold",
    tagline: "Dark, high-impact, built to convert",
    desc: "Big headlines, dark background, orange or red accent. Works great for trades, auto, fitness, and any business that wants to make a strong first impression.",
    preview: ["Dark background", "Condensed headlines", "Stats bar", "Grid services"],
    color: "#e63000",
  },
  {
    id: "skeleton-clean",
    name: "Clean",
    tagline: "Light, modern, professional",
    desc: "White background, split hero, trust badges. Feels polished and approachable. Works for any industry — from auto shops to accountants.",
    preview: ["White background", "Split hero layout", "Trust signals", "Step-by-step process"],
    color: "#0066ff",
  },
  {
    id: "skeleton-warm",
    name: "Warm",
    tagline: "Story-driven, photo-forward",
    desc: "Full-bleed photo hero, serif fonts, founder quote. Great for businesses with personality — restaurants, boutiques, specialty shops, craftspeople.",
    preview: ["Full-bleed photo", "Serif typography", "Story section", "Founder quote"],
    color: "#c8892a",
  },
];

const messages = [
  "Reading your business info...",
  "Picking the right photos...",
  "Writing your headline...",
  "Crafting your service descriptions...",
  "Building your about section...",
  "Writing customer reviews...",
  "Optimizing for SEO...",
  "Putting it all together...",
  "Almost done...",
];

export default function TemplatePage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [msgIdx, setMsgIdx] = useState(0);
  const [step, setStep] = useState<"pick" | "generating" | "done">("pick");
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: customer } = await supabase
        .from("customers").select("id").eq("user_id", user.id).single();
      if (!customer) return;
      const { data: business } = await supabase
        .from("businesses").select("id").eq("customer_id", customer.id).single();
      if (business) setBusinessId(business.id);
    }
    load();
  }, []);

  async function handleGenerate() {
    if (!selected || !businessId) return;
    setGenerating(true);
    setStep("generating");

    const interval = setInterval(() => {
      setMsgIdx(i => (i + 1) % messages.length);
    }, 3000);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_id: businessId, template_override: selected }),
      });

      clearInterval(interval);

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Generation failed");
      }

      setStep("done");
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch (err: any) {
      clearInterval(interval);
      setError(err.message);
      setStep("pick");
      setGenerating(false);
    }
  }

  if (step === "generating") {
    return (
      <div className={styles.page}>
        <div className={styles.generatingWrap}>
          <div className={styles.spinner} />
          <h2 className={styles.generatingTitle}>Building your website</h2>
          <p className={styles.generatingMsg}>{messages[msgIdx]}</p>
          <div className={styles.progressBar}><div className={styles.progressFill} /></div>
          <p style={{fontSize:"13px",color:"#999",marginTop:"8px"}}>Usually takes about 30 seconds</p>
        </div>
      </div>
    );
  }

  if (step === "done") {
    return (
      <div className={styles.page}>
        <div className={styles.generatingWrap}>
          <div className={styles.checkmark}>✓</div>
          <h2 className={styles.generatingTitle}>Your site is ready!</h2>
          <p className={styles.generatingMsg}>Taking you to review it now...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.logo}>Exsisto<span>.</span></div>
        <h1 className={styles.title}>Pick your style</h1>
        <p className={styles.subtitle}>
          We'll write all the content for your specific business — services, headlines, reviews, SEO. You just pick the look.
        </p>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.grid}>
        {STYLES.map((s) => (
          <button
            key={s.id}
            className={`${styles.card} ${selected === s.id ? styles.selected : ""}`}
            onClick={() => setSelected(s.id)}
            style={{ "--accent": s.color } as React.CSSProperties}
          >
            <div className={styles.colorSwatch} style={{ background: s.color }} />
            <div className={styles.cardBody}>
              <div className={styles.cardName}>{s.name}</div>
              <div className={styles.cardTagline}>{s.tagline}</div>
              <div className={styles.cardDesc}>{s.desc}</div>
              <div className={styles.cardFeatures}>
                {s.preview.map(f => (
                  <span key={f} className={styles.featurePill}>{f}</span>
                ))}
              </div>
            </div>
            {selected === s.id && <div className={styles.selectedCheck}>✓</div>}
          </button>
        ))}
      </div>

      <div className={styles.footer}>
        <button
          className={styles.generateBtn}
          onClick={handleGenerate}
          disabled={!selected || generating}
        >
          {generating ? "Generating..." : "Build my website →"}
        </button>
        <p className={styles.footerNote}>
          Not happy with it? You can request changes or switch styles after you see it.
        </p>
      </div>
    </div>
  );
}
