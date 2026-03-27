"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import styles from "./template.module.css";

interface TemplateOption {
  id: string;
  thumbnail: string;
  label: string;
}

export default function TemplatePicker() {
  const router = useRouter();
  const supabase = createClient();
  const [options, setOptions] = useState<TemplateOption[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMsg, setLoadingMsg] = useState("Setting up your account…");
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState<string | null>(null);
  const generateCalled = useRef(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: customer } = await supabase
        .from("customers").select("id").eq("user_id", user.id).single();
      if (!customer) { router.push("/onboarding"); return; }

      const { data: business } = await supabase
        .from("businesses").select("id, name").eq("customer_id", customer.id).single();
      if (!business) { router.push("/onboarding"); return; }

      setBusinessId(business.id);
      setBusinessName(business.name);

      // Check if website record already has screens
      const { data: website } = await supabase
        .from("websites")
        .select("stitch_project_id, stitch_screens, status")
        .eq("business_id", business.id).single();

      if (website?.stitch_screens?.length) {
        // Already generated — show them
        setOptions(website.stitch_screens);
        setProjectId(website.stitch_project_id);
        setLoading(false);
        return;
      }

      // Trigger generation if not already done
      if (!generateCalled.current) {
        generateCalled.current = true;
        setLoadingMsg("Generating your content…");
        try {
          await fetch("/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ business_id: business.id }),
          });
        } catch (e) {
          console.error("Generate failed:", e);
        }
      }

      // Poll for screens — they'll be saved by the admin design endpoint
      setLoadingMsg("Designing your site (this takes ~60 seconds)…");
      const interval = setInterval(async () => {
        const { data: w } = await supabase
          .from("websites")
          .select("stitch_project_id, stitch_screens, status")
          .eq("business_id", business.id).single();

        if (w?.stitch_screens?.length) {
          setOptions(w.stitch_screens);
          setProjectId(w.stitch_project_id);
          setLoading(false);
          clearInterval(interval);
        }
      }, 3000);

      // Timeout after 5 min
      setTimeout(() => {
        clearInterval(interval);
        if (loading) {
          setLoadingMsg("Taking longer than expected — check back soon.");
        }
      }, 300000);

      return () => clearInterval(interval);
    }
    load();
  }, []);

  async function handleSelect() {
    if (!selected || !businessId) return;
    setSaving(true);
    try {
      await supabase.from("businesses")
        .update({ template_id: selected })
        .eq("id", businessId);

      await fetch("/api/deploy-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_id: businessId,
          screen_id: selected,
          project_id: projectId,
        }),
      });

      router.push("/dashboard");
    } catch (e) {
      console.error(e);
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <div className={styles.step}>Step 3 of 3</div>
          <h1 className={styles.title}>Designing your site…</h1>
          <p className={styles.subtitle}>
            {businessName && <><strong>{businessName}</strong> — </>}
            {loadingMsg}
          </p>
          <div className={styles.spinner} />
        </div>
        <div className={styles.skeletonGrid}>
          {[0, 1, 2].map(i => <div key={i} className={styles.skeleton} />)}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.step}>Step 3 of 3</div>
        <h1 className={styles.title}>Pick your style</h1>
        <p className={styles.subtitle}>
          3 custom designs built just for <strong>{businessName}</strong>.
          Pick the one that feels right.
        </p>
      </div>

      <div className={styles.grid}>
        {options.map((t) => (
          <div
            key={t.id}
            className={`${styles.card} ${selected === t.id ? styles.selected : ""}`}
            onClick={() => setSelected(t.id)}
          >
            <div className={styles.preview}>
              <img src={t.thumbnail} alt={t.label} className={styles.thumb} />
              {selected === t.id && <div className={styles.checkmark}>✓</div>}
              <button
                className={styles.previewBtn}
                onClick={(e) => { e.stopPropagation(); setPreviewing(t.thumbnail); }}
              >
                Full preview
              </button>
            </div>
            <div className={styles.info}>
              <div className={styles.templateName}>{t.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        <button
          className={styles.btn}
          disabled={!selected || saving}
          onClick={handleSelect}
        >
          {saving ? "Building your site…" : "Use this design →"}
        </button>
      </div>

      {previewing && (
        <div className={styles.modal} onClick={() => setPreviewing(null)}>
          <div className={styles.modalInner} onClick={e => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setPreviewing(null)}>✕</button>
            <img src={previewing} alt="Preview" className={styles.modalImg} />
          </div>
        </div>
      )}
    </div>
  );
}
