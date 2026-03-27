"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { TEMPLATES } from "@/lib/templates";
import styles from "./template.module.css";

export default function TemplatePicker() {
  const router = useRouter();
  const supabase = createClient();
  const [selected, setSelected] = useState<string | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState<string | null>(null);

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
    }
    load();
  }, []);

  async function handleSelect() {
    if (!selected || !businessId) return;
    setSaving(true);
    try {
      // Save chosen template to the business record
      await supabase.from("businesses")
        .update({ template_id: selected })
        .eq("id", businessId);
      // Kick off site generation
      await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_id: businessId }),
      });
      router.push("/dashboard");
    } catch (e) {
      console.error(e);
      setSaving(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.step}>Step 3 of 3</div>
        <h1 className={styles.title}>Pick your style</h1>
        <p className={styles.subtitle}>
          We'll build {businessName ? <strong>{businessName}</strong> : "your site"} using this design.
          You can always change it later.
        </p>
      </div>

      <div className={styles.grid}>
        {TEMPLATES.map((t) => (
          <div
            key={t.id}
            className={`${styles.card} ${selected === t.id ? styles.selected : ""}`}
            onClick={() => setSelected(t.id)}
          >
            {/* Preview thumbnail */}
            <div className={styles.preview}>
              <img src={t.thumbnailUrl} alt={t.name} className={styles.thumb} />
              {selected === t.id && (
                <div className={styles.checkmark}>✓</div>
              )}
              <button
                className={styles.previewBtn}
                onClick={(e) => { e.stopPropagation(); setPreviewing(t.id); }}
              >
                Preview
              </button>
            </div>

            {/* Info */}
            <div className={styles.info}>
              <div className={styles.colorDot} style={{ background: t.primaryColor }} />
              <div>
                <div className={styles.templateName}>{t.name}</div>
                <div className={styles.vibe}>{t.vibe}</div>
                <div className={styles.description}>{t.description}</div>
              </div>
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
          {saving ? "Building your site…" : "Build My Site →"}
        </button>
        {selected && (
          <p className={styles.selected_label}>
            You selected: <strong>{TEMPLATES.find(t => t.id === selected)?.name}</strong>
          </p>
        )}
      </div>

      {/* Full-screen preview modal */}
      {previewing && (
        <div className={styles.modal} onClick={() => setPreviewing(null)}>
          <div className={styles.modalInner} onClick={e => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setPreviewing(null)}>✕</button>
            <img
              src={TEMPLATES.find(t => t.id === previewing)?.thumbnailUrl}
              alt="Preview"
              className={styles.modalImg}
            />
          </div>
        </div>
      )}
    </div>
  );
}
