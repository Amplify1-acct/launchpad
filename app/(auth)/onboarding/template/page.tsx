"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import styles from "./template.module.css";

// Template options shown to customer based on their industry
const TEMPLATES = [
  {
    id: "homeservices-clean",
    name: "Clean & Trustworthy",
    desc: "Professional, trust-forward design. Perfect for service businesses.",
    color: "#16613a",
    preview: "Green accent · White · Review-focused",
    industries: ["plumbing", "electrical", "hvac", "cleaning", "landscaping", "construction", "home", "repair"],
  },
  {
    id: "fitness-bold",
    name: "Bold & Energetic",
    desc: "High-impact design built to convert. Great for gyms and active businesses.",
    color: "#f04e23",
    preview: "Orange accent · Dark · High energy",
    industries: ["gym", "fitness", "trainer", "yoga", "sport", "crossfit"],
  },
  {
    id: "restaurant-warm",
    name: "Warm & Inviting",
    desc: "Beautiful food-focused layout with rich imagery and a reservation form.",
    color: "#c8892a",
    preview: "Gold accent · Warm cream · Menu-focused",
    industries: ["restaurant", "cafe", "bakery", "food", "bar", "dining"],
  },
  {
    id: "realestate-luxury",
    name: "Luxury & Modern",
    desc: "Sophisticated design with property listings and an agent spotlight.",
    color: "#b8966a",
    preview: "Navy & gold · Premium feel · Listings-focused",
    industries: ["real estate", "realtor", "property", "broker"],
  },
  {
    id: "dental-clean",
    name: "Clean & Clinical",
    desc: "Modern healthcare design. Trusted, approachable, and conversion-optimized.",
    color: "#0077cc",
    preview: "Blue accent · White · Trust-focused",
    industries: ["dental", "medical", "doctor", "clinic", "health"],
  },
  {
    id: "financial-premium",
    name: "Premium & Authoritative",
    desc: "Commanding design for financial and professional services.",
    color: "#c5973a",
    preview: "Navy & gold · Dark · Data-forward",
    industries: ["financial", "accounting", "wealth", "legal", "law", "insurance"],
  },
  {
    id: "law-chambers",
    name: "Heritage & Prestige",
    desc: "Stately serif design with grayscale team photos and a classic feel.",
    color: "#330608",
    preview: "Burgundy & gold · Editorial · Law-focused",
    industries: ["law", "attorney", "legal", "barrister"],
  },
];

function getRecommendedTemplates(description: string): string[] {
  const lower = description.toLowerCase();
  const recommended: string[] = [];

  for (const template of TEMPLATES) {
    if (template.industries.some(ind => lower.includes(ind))) {
      recommended.push(template.id);
    }
  }

  // If no match, return all
  return recommended.length > 0 ? recommended : TEMPLATES.map(t => t.id);
}

export default function TemplatePage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [businessDesc, setBusinessDesc] = useState("");
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"pick" | "generating" | "done">("pick");
  const [generatingMessage, setGeneratingMessage] = useState("Building your site...");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadBusiness() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: customer } = await supabase
        .from("customers").select("id").eq("user_id", user.id).single();
      if (!customer) return;

      const { data: business } = await supabase
        .from("businesses").select("id, description, industry").eq("customer_id", customer.id).single();
      if (!business) return;

      setBusinessId(business.id);
      setBusinessDesc(business.description || business.industry || "");
    }
    loadBusiness();
  }, []);

  const recommended = getRecommendedTemplates(businessDesc);
  const sortedTemplates = [
    ...TEMPLATES.filter(t => recommended.includes(t.id)),
    ...TEMPLATES.filter(t => !recommended.includes(t.id)),
  ];

  const messages = [
    "Analyzing your business...",
    "Selecting the right design...",
    "Writing your homepage copy...",
    "Crafting your service descriptions...",
    "Generating your about section...",
    "Writing customer testimonials...",
    "Optimizing for SEO...",
    "Building your contact form...",
    "Putting it all together...",
    "Almost ready...",
  ];

  async function handleGenerate() {
    if (!selected || !businessId) return;
    setGenerating(true);
    setStep("generating");

    // Cycle through messages while generating
    let msgIdx = 0;
    const msgInterval = setInterval(() => {
      msgIdx = (msgIdx + 1) % messages.length;
      setGeneratingMessage(messages[msgIdx]);
    }, 2500);

    try {
      const res = await fetch("/api/generate-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_id: businessId,
          template_override: selected,
        }),
      });

      clearInterval(msgInterval);

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Generation failed");
      }

      setStep("done");
      setTimeout(() => router.push("/dashboard"), 2000);

    } catch (err: any) {
      clearInterval(msgInterval);
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
          <p className={styles.generatingMsg}>{generatingMessage}</p>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} />
          </div>
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
          <p className={styles.generatingMsg}>Taking you to your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.logo}>Exsisto<span>.</span></div>
        <h1 className={styles.title}>Choose your style</h1>
        <p className={styles.subtitle}>
          We'll generate a complete website in your chosen style — instantly, using your business info.
        </p>
        {recommended.length < TEMPLATES.length && (
          <div className={styles.recommendedNote}>
            ✦ Recommended for your industry shown first
          </div>
        )}
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.grid}>
        {sortedTemplates.map((t) => {
          const isRecommended = recommended.includes(t.id);
          return (
            <button
              key={t.id}
              className={`${styles.card} ${selected === t.id ? styles.selected : ""}`}
              onClick={() => setSelected(t.id)}
              style={{ "--accent": t.color } as React.CSSProperties}
            >
              {isRecommended && (
                <div className={styles.recommendedBadge}>Recommended</div>
              )}
              <div className={styles.colorSwatch} style={{ background: t.color }} />
              <div className={styles.cardBody}>
                <div className={styles.cardName}>{t.name}</div>
                <div className={styles.cardDesc}>{t.desc}</div>
                <div className={styles.cardPreview}>{t.preview}</div>
              </div>
              {selected === t.id && (
                <div className={styles.selectedCheck}>✓</div>
              )}
            </button>
          );
        })}
      </div>

      <div className={styles.footer}>
        <button
          className={styles.generateBtn}
          onClick={handleGenerate}
          disabled={!selected || generating}
        >
          {generating ? "Generating..." : "Build my website →"}
        </button>
        <p className={styles.footerNote}>Takes about 30 seconds. You can always change the style later.</p>
      </div>
    </div>
  );
}
