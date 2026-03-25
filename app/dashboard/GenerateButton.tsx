"use client";

import { useState } from "react";
import styles from "./dashboard.module.css";

interface GenerateButtonProps {
  businessId: string;
  hasWebsite: boolean;
  websiteStatus: string | null;
}

export function GenerateButton({ businessId, hasWebsite, websiteStatus }: GenerateButtonProps) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // Don't show button if already live or currently building
  if (websiteStatus === "live") return null;
  if (websiteStatus === "generating" || websiteStatus === "deploying") return null;

  async function handleGenerate() {
    setLoading(true);
    try {
      // Step 1: Generate content + kick off deployment
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_id: businessId }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Generation failed");
      }

      setDone(true);
      // Refresh the page so DeployStatus starts polling
      setTimeout(() => window.location.reload(), 1000);
    } catch (e: any) {
      alert("Error: " + e.message);
      setLoading(false);
    }
  }

  if (done) {
    return (
      <button className={styles.generateBtn} disabled>
        ✓ Building your site...
      </button>
    );
  }

  return (
    <button
      className={styles.generateBtn}
      onClick={handleGenerate}
      disabled={loading}
    >
      {loading ? (
        <>
          <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⚙️</span>
          Generating...
        </>
      ) : (
        <>✨ {hasWebsite ? "Regenerate site" : "Build my site"}</>
      )}
    </button>
  );
}
