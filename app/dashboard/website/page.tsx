"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import MobileNav from "@/components/MobileNav";
import styles from "../dashboard.module.css";

export default function WebsitePage() {
  const router = useRouter();
  const supabase = createClient();

  const [business, setBusiness] = useState<any>(null);
  const [website, setWebsite] = useState<any>(null);
  const [plan, setPlan] = useState("starter");
  const [loading, setLoading] = useState(true);
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [domainInput, setDomainInput] = useState("");
  const [domainSaving, setDomainSaving] = useState(false);
  const [domainChecking, setDomainChecking] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    const { data: customer } = await supabase.from("customers").select("id").eq("user_id", user.id).single();
    if (!customer) { router.push("/onboarding"); return; }
    const { data: biz } = await supabase.from("businesses").select("*").eq("customer_id", customer.id).single();
    if (!biz) { router.push("/onboarding"); return; }
    setBusiness(biz);
    const { data: sub } = await supabase.from("subscriptions").select("plan").eq("customer_id", customer.id).single();
    if (sub?.plan) setPlan(sub.plan);
    const { data: site } = await supabase.from("websites").select("*").eq("business_id", biz.id).single();
    setWebsite(site);
    setLoading(false);
  }

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleAddDomain() {
    if (!domainInput.trim() || !business) return;
    setDomainSaving(true);
    try {
      const res = await fetch("/api/custom-domain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: domainInput.trim(), business_id: business.id }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || "Failed to add domain", false); return; }
      setBusiness((b: any) => ({ ...b, custom_domain: data.domain, domain_status: "pending" }));
      showToast("Domain added — update your DNS to go live");
    } finally {
      setDomainSaving(false);
    }
  }

  async function handleCheckDomain() {
    if (!business?.custom_domain) return;
    setDomainChecking(true);
    try {
      const res = await fetch(`/api/custom-domain?domain=${business.custom_domain}&business_id=${business.id}`);
      const data = await res.json();
      if (data.verified) {
        setBusiness((b: any) => ({ ...b, domain_status: "active" }));
        showToast("Domain verified and live! ✓");
      } else {
        showToast("Not verified yet — DNS changes can take up to 48 hours", false);
      }
    } finally {
      setDomainChecking(false);
    }
  }

  async function handleRemoveDomain() {
    if (!business?.custom_domain) return;
    const res = await fetch("/api/custom-domain", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain: business.custom_domain, business_id: business.id }),
    });
    if (res.ok) {
      setBusiness((b: any) => ({ ...b, custom_domain: null, domain_status: "none" }));
      setDomainInput("");
      showToast("Custom domain removed");
    }
  }

  async function handleRequestChanges() {
    if (!feedback.trim() || !business) return;
    setSubmitting(true);
    try {
      // Detect template from keywords
      const lower = feedback.toLowerCase();
      let templateOverride: string | undefined;
      if (lower.match(/light|clean|bright|white|minimal|professional|simple/)) templateOverride = "skeleton-clean";
      else if (lower.match(/warm|cozy|classic|elegant|serif|traditional/)) templateOverride = "skeleton-warm";
      else if (lower.match(/bold|dark|dramatic|strong|impact/)) templateOverride = "skeleton-bold";

      await supabase.from("websites").update({
        status: "needs_revision",
        revision_notes: feedback,
        revision_requested_at: new Date().toISOString(),
      }).eq("business_id", business.id);

      const res = await fetch("/api/generate-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_id: business.id, revision_notes: feedback, template_override: templateOverride }),
      });

      if (res.ok) {
        // Auto-deploy after regeneration
        await fetch("/api/deploy-site", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ business_id: business.id }),
        });
        setFeedback("");
        showToast("Site rebuilt and deployed ✓");
        setTimeout(() => load(), 3000);
      } else {
        showToast("Something went wrong", false);
      }
    } finally {
      setSubmitting(false);
    }
  }

  function copyUrl() {
    const url = website?.vercel_url || `https://${business?.subdomain}.exsisto.ai`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const siteUrl = website?.vercel_url || (business?.subdomain ? `https://${business.subdomain}.exsisto.ai` : null);

  const deviceWidths: Record<string, string> = {
    desktop: "100%",
    tablet: "768px",
    mobile: "390px",
  };

  const STATUS_MAP: Record<string, { label: string; color: string; bg: string; desc: string }> = {
    live:             { label: "Live",             color: "#16a34a", bg: "#dcfce7", desc: "Your site is live and visible to the public" },
    needs_revision:   { label: "Rebuilding",       color: "#f59e0b", bg: "#fef3c7", desc: "Rebuilding with your requested changes" },
    ready_for_review: { label: "Ready to review",  color: "#4648d4", bg: "#eeeeff", desc: "Your site is ready — approve to go live" },
    generating:       { label: "Building",         color: "#f59e0b", bg: "#fef3c7", desc: "Building your site — this takes about 30 seconds" },
    error:            { label: "Error",            color: "#dc2626", bg: "#fee2e2", desc: "Something went wrong — contact support" },
  };
  const statusInfo = STATUS_MAP[website?.status || ""] || { label: website?.status || "Building", color: "#f59e0b", bg: "#fef3c7", desc: "Working on your site…" };

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}><a href="/">Ex<span>sisto</span></a></div>
        <nav className={styles.nav}>
          <a href="/dashboard" className={styles.navItem}><span>⚡</span> Overview</a>
          <a href="/dashboard/website" className={`${styles.navItem} ${styles.active}`}><span>🌐</span> Website</a>
          <a href="/dashboard/blog" className={styles.navItem}><span>✍️</span> Blog Posts</a>
          <a href="/dashboard/social" className={styles.navItem}><span>📱</span> Social Media</a>
          <a href="/dashboard/settings" className={styles.navItem}><span>⚙️</span> Settings</a>
        </nav>
        <div className={styles.sidebarBottom}>
          <div className={styles.planBadge}>{plan} plan</div>
          {business && <>
            <div className={styles.bizName}>{business.name}</div>
            <div className={styles.bizLocation}>{business.city}{business.state ? `, ${business.state}` : ""}</div>
          </>}
          <form action="/auth/signout" method="post">
            <button type="submit" className={styles.signOut}>Sign out</button>
          </form>
        </div>
      </aside>

      <main className={styles.main}>

        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.greeting}>Your Website</h1>
            <p className={styles.subGreeting}>
              {siteUrl ? siteUrl.replace("https://", "") : "Building your site…"}
            </p>
          </div>
          <div className={styles.headerActions}>
            {siteUrl && (
              <a href={siteUrl} target="_blank" rel="noreferrer" className={styles.viewSiteBtn}>
                View live site →
              </a>
            )}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "80px", color: "#9090a8" }}>
            <div style={{ width: "32px", height: "32px", border: "3px solid #ede9f8", borderTopColor: "#4648d4", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
            Loading your site…
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "16px", alignItems: "start" }}>

            {/* LEFT: Preview */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

              {/* Status bar */}
              <div style={{ background: statusInfo.bg, border: `1px solid ${statusInfo.color}30`, borderRadius: "10px", padding: "12px 16px", display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: statusInfo.color, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: statusInfo.color }}>{statusInfo.label}</span>
                  <span style={{ fontSize: "12px", color: "#6b6b8a", marginLeft: "8px" }}>{statusInfo.desc}</span>
                </div>
                {website?.deployed_at && (
                  <span style={{ fontSize: "11px", color: "#9090a8", flexShrink: 0 }}>
                    Updated {new Date(website.deployed_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                )}
              </div>

              {/* Device toggle + preview */}
              <div className={styles.card} style={{ overflow: "hidden" }}>
                {/* Toolbar */}
                <div style={{ padding: "10px 14px", borderBottom: "1px solid #ede9f8", display: "flex", alignItems: "center", gap: "8px", background: "#faf9ff" }}>
                  {/* Device buttons */}
                  <div style={{ display: "flex", gap: "4px" }}>
                    {(["desktop", "tablet", "mobile"] as const).map(d => (
                      <button key={d} onClick={() => setDevice(d)} style={{
                        padding: "5px 12px", borderRadius: "6px", fontSize: "11px", fontWeight: 600,
                        border: "none", cursor: "pointer", fontFamily: "inherit",
                        background: device === d ? "#4648d4" : "transparent",
                        color: device === d ? "#fff" : "#9090a8",
                      }}>
                        {d === "desktop" ? "🖥" : d === "tablet" ? "⬜" : "📱"} {d}
                      </button>
                    ))}
                  </div>

                  {siteUrl && (
                    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "6px", background: "#fff", border: "1px solid #ede9f8", borderRadius: "6px", padding: "4px 10px", minWidth: 0 }}>
                      <span style={{ fontSize: "11px", color: "#9090a8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                        {siteUrl.replace("https://", "")}
                      </span>
                      <button onClick={copyUrl} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "11px", fontWeight: 600, color: copied ? "#16a34a" : "#4648d4", flexShrink: 0, fontFamily: "inherit" }}>
                        {copied ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  )}

                  {siteUrl && (
                    <a href={siteUrl} target="_blank" rel="noreferrer" style={{ fontSize: "11px", fontWeight: 600, color: "#4648d4", textDecoration: "none", flexShrink: 0 }}>
                      ↗ Open
                    </a>
                  )}
                </div>

                {/* Preview frame */}
                <div style={{ background: "#f5f2ff", minHeight: "500px", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "16px", overflow: "hidden" }}>
                  <div style={{ width: deviceWidths[device], maxWidth: "100%", transition: "width 0.3s", background: "#fff", borderRadius: device !== "desktop" ? "12px" : "0", overflow: "hidden", boxShadow: device !== "desktop" ? "0 8px 32px rgba(0,0,0,0.15)" : "none" }}>
                    {website?.custom_html ? (
                      <iframe
                        srcDoc={website.custom_html}
                        style={{ width: "100%", height: "600px", border: "none", display: "block" }}
                        title="Site preview"
                        sandbox="allow-scripts"
                      />
                    ) : (
                      <div style={{ height: "600px", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "16px", color: "#9090a8" }}>
                        <div style={{ width: "32px", height: "32px", border: "3px solid #ede9f8", borderTopColor: "#4648d4", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                        <div style={{ fontSize: "13px" }}>Building your site…</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT: Controls */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

              {/* Quick actions */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitle}>Actions</div>
                </div>
                <div className={styles.actionsList}>
                  {website?.status === "ready_for_review" && (
                    <a href="/dashboard/preview" className={styles.actionItem}>
                      <div className={styles.actionIcon} style={{ background: "#eeeeff" }}>✓</div>
                      <div className={styles.actionInfo}>
                        <div className={styles.actionLabel}>Approve & go live</div>
                        <div className={styles.actionSub}>Review your site and publish it</div>
                      </div>
                      <span className={styles.actionArrow}>→</span>
                    </a>
                  )}
                  {siteUrl && (
                    <a href={siteUrl} target="_blank" rel="noreferrer" className={styles.actionItem}>
                      <div className={styles.actionIcon} style={{ background: "#f0fdf4" }}>↗</div>
                      <div className={styles.actionInfo}>
                        <div className={styles.actionLabel}>View live site</div>
                        <div className={styles.actionSub}>{siteUrl.replace("https://", "")}</div>
                      </div>
                      <span className={styles.actionArrow}>→</span>
                    </a>
                  )}
                  <a href="/dashboard/preview" className={styles.actionItem}>
                    <div className={styles.actionIcon} style={{ background: "#fef3c7" }}>⤢</div>
                    <div className={styles.actionInfo}>
                      <div className={styles.actionLabel}>Full preview</div>
                      <div className={styles.actionSub}>Review with approve/reject tools</div>
                    </div>
                    <span className={styles.actionArrow}>→</span>
                  </a>
                </div>
              </div>

              {/* Request changes */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitle}>Request changes</div>
                </div>
                <div style={{ padding: "16px 18px" }}>
                  <p style={{ fontSize: "12px", color: "#9090a8", marginBottom: "12px", lineHeight: 1.6 }}>
                    Describe what you'd like to change and we'll rebuild your site around it.
                  </p>
                  <textarea
                    value={feedback}
                    onChange={e => setFeedback(e.target.value)}
                    placeholder="e.g. Change the headline to focus on emergency services. Use a darker color scheme. Add our 25 years of experience…"
                    rows={4}
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #ede9f8", borderRadius: "8px", fontSize: "12px", fontFamily: "inherit", resize: "vertical", outline: "none", color: "#1b1b25", lineHeight: 1.6 }}
                  />
                  <button
                    onClick={handleRequestChanges}
                    disabled={!feedback.trim() || submitting}
                    style={{ width: "100%", marginTop: "10px", padding: "10px", borderRadius: "8px", border: "none", background: feedback.trim() && !submitting ? "#4648d4" : "#ede9f8", color: feedback.trim() && !submitting ? "#fff" : "#9090a8", fontSize: "13px", fontWeight: 700, cursor: feedback.trim() && !submitting ? "pointer" : "not-allowed", fontFamily: "inherit", transition: "all 0.15s" }}
                  >
                    {submitting ? "Submitting…" : "Submit & rebuild →"}
                  </button>
                </div>
              </div>

              {/* Site details */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitle}>Site details</div>
                </div>
                <div style={{ padding: "4px 0" }}>
                  {[
                    { label: "Status", value: statusInfo.label },
                    { label: "URL", value: siteUrl ? siteUrl.replace("https://", "") : "—" },
                    { label: "Template", value: website?.template_name || "Custom" },
                    { label: "Generated", value: website?.generated_at ? new Date(website.generated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—" },
                    { label: "Deployed", value: website?.deployed_at ? new Date(website.deployed_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—" },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ padding: "10px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f5f2ff", gap: "12px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "#9090a8", textTransform: "uppercase", letterSpacing: "0.5px", flexShrink: 0 }}>{label}</span>
                      <span style={{ fontSize: "12px", color: "#1b1b25", fontWeight: 500, textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Domain */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitle}>Custom Domain</div>
                  {business?.domain_status === "active" && (
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#16a34a", background: "#dcfce7", padding: "2px 8px", borderRadius: "100px" }}>Live</span>
                  )}
                  {business?.domain_status === "pending" && (
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#f59e0b", background: "#fef3c7", padding: "2px 8px", borderRadius: "100px" }}>Pending DNS</span>
                  )}
                </div>
                <div style={{ padding: "16px 18px" }}>
                  {!business?.custom_domain ? (
                    <>
                      {/* How it works */}
                      <div style={{ background: "#f8f7ff", border: "1px solid #ede9f8", borderRadius: "8px", padding: "12px 14px", marginBottom: "14px" }}>
                        <div style={{ fontSize: "11px", fontWeight: 700, color: "#4648d4", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>How it works</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          {[
                            { n: "1", text: "Enter your domain name below (e.g. mattysauto.com)" },
                            { n: "2", text: "We'll show you a CNAME record to add at your registrar (GoDaddy, Namecheap, etc.)" },
                            { n: "3", text: "Once DNS updates (15 min – 48 hrs), your domain goes live automatically" },
                          ].map(({ n, text }) => (
                            <div key={n} style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                              <div style={{ width: "18px", height: "18px", borderRadius: "50%", background: "#4648d4", color: "#fff", fontSize: "10px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "1px" }}>{n}</div>
                              <span style={{ fontSize: "11px", color: "#6b6b8a", lineHeight: 1.5 }}>{text}</span>
                            </div>
                          ))}
                        </div>
                        <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: "1px solid #ede9f8", fontSize: "11px", color: "#9090a8", lineHeight: 1.5 }}>
                          💡 Don&apos;t have a domain yet? You can get one at <a href="https://namecheap.com" target="_blank" rel="noreferrer" style={{ color: "#4648d4" }}>Namecheap</a> or <a href="https://godaddy.com" target="_blank" rel="noreferrer" style={{ color: "#4648d4" }}>GoDaddy</a> for ~$12/year.
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <input
                          type="text"
                          value={domainInput}
                          onChange={e => setDomainInput(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && handleAddDomain()}
                          placeholder="yourdomain.com"
                          style={{ flex: 1, padding: "9px 12px", border: "1px solid #ede9f8", borderRadius: "8px", fontSize: "12px", fontFamily: "inherit", outline: "none", color: "#1b1b25" }}
                        />
                        <button onClick={handleAddDomain} disabled={!domainInput.trim() || domainSaving}
                          style={{ padding: "9px 14px", borderRadius: "8px", border: "none", background: domainInput.trim() && !domainSaving ? "#4648d4" : "#ede9f8", color: domainInput.trim() && !domainSaving ? "#fff" : "#9090a8", fontSize: "12px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                          {domainSaving ? "Adding…" : "Add →"}
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                        <div>
                          <div style={{ fontSize: "13px", fontWeight: 700, color: "#1b1b25" }}>{business.custom_domain}</div>
                          <div style={{ fontSize: "11px", color: "#9090a8", marginTop: "2px" }}>
                            {business.domain_status === "active" ? "Verified and live ✓" : "Waiting for DNS update"}
                          </div>
                        </div>
                        <button onClick={handleRemoveDomain} style={{ fontSize: "11px", color: "#dc2626", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>Remove</button>
                      </div>
                      {business.domain_status !== "active" && (
                        <>
                          <div style={{ background: "#f8f7ff", border: "1px solid #ede9f8", borderRadius: "8px", padding: "12px 14px", marginBottom: "10px" }}>
                            <div style={{ fontSize: "11px", fontWeight: 700, color: "#4648d4", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>DNS Settings</div>
                            <p style={{ fontSize: "11px", color: "#6b6b8a", marginBottom: "10px", lineHeight: 1.6 }}>Log in to your registrar (GoDaddy, Namecheap, etc.) and add this record:</p>
                            <div style={{ background: "#fff", border: "1px solid #ede9f8", borderRadius: "6px", overflow: "hidden" }}>
                              <div style={{ display: "grid", gridTemplateColumns: "60px 40px 1fr" }}>
                                {["Type", "Name", "Value"].map(h => (
                                  <div key={h} style={{ padding: "6px 10px", fontSize: "10px", fontWeight: 700, color: "#9090a8", background: "#faf9ff", textTransform: "uppercase" }}>{h}</div>
                                ))}
                              </div>
                              <div style={{ display: "grid", gridTemplateColumns: "60px 40px 1fr" }}>
                                <div style={{ padding: "8px 10px", fontSize: "11px", fontWeight: 700, color: "#4648d4" }}>CNAME</div>
                                <div style={{ padding: "8px 10px", fontSize: "11px", fontFamily: "monospace" }}>@</div>
                                <div style={{ padding: "8px 10px", fontSize: "11px", fontFamily: "monospace", wordBreak: "break-all" }}>cname.vercel-dns.com</div>
                              </div>
                            </div>
                            <p style={{ fontSize: "10px", color: "#9090a8", marginTop: "8px", lineHeight: 1.5 }}>⏱ DNS changes can take 15 min – 48 hours to propagate.</p>
                          </div>
                          <button onClick={handleCheckDomain} disabled={domainChecking}
                            style={{ width: "100%", padding: "9px", borderRadius: "8px", border: "1px solid #ede9f8", background: "#fff", color: "#4648d4", fontSize: "12px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                            {domainChecking ? "Checking…" : "Check verification status"}
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}
      </main>

      <MobileNav />

      {toast && (
        <div style={{ position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)", background: toast.ok ? "#1b1b25" : "#dc2626", color: "#fff", padding: "12px 24px", borderRadius: "100px", fontSize: "13px", fontWeight: 600, zIndex: 999, boxShadow: "0 4px 20px rgba(0,0,0,0.15)", whiteSpace: "nowrap" }}>
          {toast.msg}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
