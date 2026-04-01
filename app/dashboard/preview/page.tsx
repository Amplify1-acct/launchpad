"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import styles from "./preview.module.css";

export default function WebsitePreviewPage() {
  const [website, setWebsite] = useState<any>(null);
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [submittedFeedback, setSubmittedFeedback] = useState(false);
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: customer } = await supabase
        .from("customers").select("id").eq("user_id", user.id).single();
      if (!customer) return;

      const { data: biz } = await supabase
        .from("businesses").select("*").eq("customer_id", customer.id).single();
      if (!biz) return;
      setBusiness(biz);

      const { data: site } = await supabase
        .from("websites").select("*").eq("business_id", biz.id).single();
      setWebsite(site);
      setLoading(false);
    }
    load();
  }, []);

  async function handleApprove() {
    if (!business || !website) return;
    setApproving(true);

    await supabase.from("websites").update({
      status: "approved",
      approved_at: new Date().toISOString(),
    }).eq("business_id", business.id);

    // Trigger social post generation in background (fire and forget)
    fetch("/api/generate-social", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ business_id: business.id }),
    });

    // Trigger deployment
    setDeploying(true);
    try {
      const res = await fetch("/api/deploy-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_id: business.id }),
      });
      if (res.ok) {
        // Update status to live
        await supabase.from("websites").update({ status: "live" }).eq("business_id", business.id);
        // Send site live email (non-blocking)
        fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "site_live", business_id: business.id }),
        }).catch(() => {});
        router.push("/dashboard?deployed=true");
      } else {
        router.push("/dashboard");
      }
    } catch {
      router.push("/dashboard");
    }
  }

  async function handleFeedback() {
    if (!business || !feedback.trim()) return;
    setSubmittedFeedback(true);
    setShowFeedback(false);

    // Update status in Supabase
    await supabase.from("websites").update({
      status: "needs_revision",
      revision_notes: feedback,
      revision_requested_at: new Date().toISOString(),
    }).eq("business_id", business.id);

    // Show regenerating state
    setApproving(true);

    // Trigger regeneration and wait for it
    try {
      const res = await fetch("/api/generate-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_id: business.id,
          template_name: website?.template_name,
          revision_notes: feedback,
        }),
      });

      if (res.ok) {
        // Reload the page to show the new site
        window.location.reload();
      } else {
        router.push("/dashboard");
      }
    } catch {
      router.push("/dashboard");
    }
  }

  const deviceWidths = {
    desktop: "100%",
    tablet: "768px",
    mobile: "390px",
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Loading your site preview...</p>
      </div>
    );
  }

  if (!website?.custom_html) {
    return (
      <div className={styles.loading}>
        <div className={styles.buildingIcon}>🔨</div>
        <h2>Your site is still building</h2>
        <p>Check back in a moment — it usually takes about 30 seconds.</p>
        <button className={styles.backBtn} onClick={() => router.push("/dashboard")}>
          ← Back to dashboard
        </button>
      </div>
    );
  }

  // For live sites, handleApprove means "redeploy with changes"
  // The function already handles this correctly via /api/deploy-site

  return (
    <div className={styles.page}>
      {/* Top bar */}
      <div className={styles.topBar}>
        <div className={styles.topLeft}>
          <button className={styles.backBtn} onClick={() => router.push("/dashboard")}>
            ← Dashboard
          </button>
          <div className={styles.businessName}>{business?.name}</div>
        </div>

        <div className={styles.deviceToggle}>
          {(["desktop", "tablet", "mobile"] as const).map(d => (
            <button
              key={d}
              className={`${styles.deviceBtn} ${device === d ? styles.deviceBtnActive : ""}`}
              onClick={() => setDevice(d)}
            >
              {d === "desktop" ? "🖥" : d === "tablet" ? "📱" : "📱"}
              {d}
            </button>
          ))}
        </div>

        <div className={styles.topRight}>
          <button
            className={styles.feedbackBtn}
            onClick={() => setShowFeedback(!showFeedback)}
          >
            Request changes
          </button>
          {website?.status !== "live" && website?.status !== "approved" ? (
            <button
              className={styles.approveBtn}
              onClick={handleApprove}
              disabled={approving || deploying || submittedFeedback}
            >
              {deploying ? "Deploying..." : approving && !submittedFeedback ? "Approving..." : submittedFeedback ? "Rebuilding..." : "✓ Approve & Go Live"}
            </button>
          ) : (
            <button
              className={styles.approveBtn}
              onClick={handleApprove}
              disabled={approving || deploying || submittedFeedback}
              style={{background: submittedFeedback ? "#666" : "#16a34a"}}
            >
              {deploying ? "Deploying..." : submittedFeedback ? "Rebuilding..." : "↑ Push Changes Live"}
            </button>
          )}
        </div>
      </div>

      {/* Feedback panel */}
      {showFeedback && (
        <div className={styles.feedbackPanel}>
          {submittedFeedback ? (
            <div className={styles.feedbackSuccess}>
              ✓ Feedback received — we're rebuilding your site with your changes.
            </div>
          ) : (
            <>
              <div className={styles.feedbackTitle}>What would you like to change?</div>
              <textarea
                className={styles.feedbackInput}
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                placeholder="e.g. Change the headline to focus more on emergency services. Use a darker color scheme. Add a section about our 25 years of experience..."
                rows={3}
              />
              <div className={styles.feedbackActions}>
                <button className={styles.cancelBtn} onClick={() => setShowFeedback(false)}>Cancel</button>
                <button
                  className={styles.submitFeedbackBtn}
                  onClick={handleFeedback}
                  disabled={!feedback.trim()}
                >
                  Submit & Regenerate →
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Status badge */}
      <div className={styles.statusBanner}>
        <div className={styles.statusDot} style={{
          background: website?.status === "live" ? "#16a34a" : "#f59e0b"
        }} />
        <span>
          {website?.status === "live"
            ? `Your site is live${website.vercel_url ? ` at ${website.vercel_url}` : ""} — request changes below to update it`
            : "Preview ready — review your site below, then approve to go live"}
        </span>
        {website?.status === "live" && website?.vercel_url && (
          <a
            href={website.vercel_url}
            target="_blank"
            rel="noreferrer"
            style={{marginLeft:"auto",fontSize:"12px",color:"#4ade80",textDecoration:"none",fontWeight:600,whiteSpace:"nowrap"}}
          >
            View live site ↗
          </a>
        )}
      </div>

      {/* Preview frame */}
      <div className={styles.previewOuter}>
        <div
          className={styles.previewFrame}
          style={{ width: deviceWidths[device], maxWidth: "100%" }}
        >
          <iframe
            ref={iframeRef}
            srcDoc={website.custom_html}
            className={styles.iframe}
            title="Site Preview"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      </div>

      {/* Bottom action bar */}
      <div className={styles.bottomBar}>
        <div className={styles.bottomLeft}>
          <div className={styles.bottomInfo}>
            <div className={styles.templateBadge}>
              Template: {website.template_name || "custom"}
            </div>
            <div className={styles.generatedAt}>
              Generated {website.generated_at ? new Date(website.generated_at).toLocaleDateString() : "just now"}
            </div>
          </div>
        </div>
        <div className={styles.bottomRight}>
          <button
            className={styles.feedbackBtn}
            onClick={() => setShowFeedback(true)}
          >
            ✏️ Request changes
          </button>
          <button
            className={styles.approveBtn}
            onClick={handleApprove}
            disabled={approving || deploying || submittedFeedback}
          >
            {deploying ? "Deploying..." : submittedFeedback ? "Rebuilding..." : website?.status === "live" || website?.status === "approved" ? "↑ Push Changes Live" : "✓ Approve & Go Live"}
          </button>
        </div>
      </div>
    </div>
  );
}


