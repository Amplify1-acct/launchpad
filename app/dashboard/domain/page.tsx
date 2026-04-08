"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import MobileNav from "@/components/MobileNav";
import styles from "../dashboard.module.css";

// ── Registrar instructions data ───────────────────────────────────────────────
const REGISTRARS: Record<string, {
  name: string;
  color: string;
  loginUrl: string;
  dnsPath: string;
  steps: { title: string; detail: string }[];
}> = {
  godaddy: {
    name: "GoDaddy",
    color: "#00A74A",
    loginUrl: "https://sso.godaddy.com",
    dnsPath: "My Products → DNS",
    steps: [
      { title: "Log in to GoDaddy", detail: "Go to godaddy.com and click Sign In at the top right. Enter your credentials." },
      { title: "Open your domain's DNS", detail: "Click your name at the top right → My Products. Find your domain and click the DNS button next to it." },
      { title: "Add a CNAME record", detail: "Scroll down to the CNAME section and click Add. If you already have a CNAME for @ or www, you may need to edit it instead of adding a new one." },
      { title: "Fill in the record", detail: "Set Type to CNAME, Name to @ (or www if @ is taken), Value to cname.vercel-dns.com, and TTL to 1 Hour. Click Save." },
      { title: "Wait for propagation", detail: "GoDaddy DNS changes typically go live within 15–60 minutes, but can take up to 48 hours. Come back here and click Check Status when ready." },
    ],
  },
  namecheap: {
    name: "Namecheap",
    color: "#DE3723",
    loginUrl: "https://www.namecheap.com/myaccount/login",
    dnsPath: "Domain List → Manage → Advanced DNS",
    steps: [
      { title: "Log in to Namecheap", detail: "Go to namecheap.com and click Sign In. Enter your username and password." },
      { title: "Go to Domain List", detail: "In the left sidebar, click Domain List. Find your domain and click the Manage button on the right." },
      { title: "Open Advanced DNS", detail: "Click the Advanced DNS tab at the top of the page." },
      { title: "Add a CNAME record", detail: "Click Add New Record. Set Type to CNAME Record, Host to @ (or www), Value to cname.vercel-dns.com, and TTL to Automatic." },
      { title: "Save and wait", detail: "Click the green checkmark to save. DNS changes on Namecheap usually propagate within 30 minutes." },
    ],
  },
  squarespace: {
    name: "Squarespace",
    color: "#000000",
    loginUrl: "https://account.squarespace.com",
    dnsPath: "Domains → Edit → DNS Settings",
    steps: [
      { title: "Log in to Squarespace", detail: "Go to squarespace.com and click Log In. Use your Squarespace account credentials (different from your website login)." },
      { title: "Go to Domains", detail: "In your Squarespace account panel, click Domains in the left sidebar." },
      { title: "Open DNS Settings", detail: "Click on your domain name, then click DNS Settings." },
      { title: "Add a CNAME record", detail: "Click Add Record. Set Type to CNAME, Host to @ (root domain) or www, Data to cname.vercel-dns.com. Leave TTL as default." },
      { title: "Save and wait", detail: "Click Save. Squarespace DNS changes typically take 24–48 hours to fully propagate." },
    ],
  },
  google: {
    name: "Google Domains",
    color: "#4285F4",
    loginUrl: "https://domains.google.com",
    dnsPath: "Manage → DNS → Custom Records",
    steps: [
      { title: "Log in to Google Domains", detail: "Go to domains.google.com and sign in with your Google account. Note: Google Domains was acquired by Squarespace — you may be redirected to Squarespace." },
      { title: "Select your domain", detail: "Click on your domain name to open domain management." },
      { title: "Open DNS settings", detail: "Click DNS in the left sidebar, then select Custom Records." },
      { title: "Add a CNAME record", detail: "Click Manage Custom Records → Create new record. Set Type to CNAME, Host name to @ or www, Data to cname.vercel-dns.com, TTL to 3600." },
      { title: "Save and wait", detail: "Click Save. Google/Squarespace DNS changes typically go live within 1–4 hours." },
    ],
  },
  cloudflare: {
    name: "Cloudflare",
    color: "#F48120",
    loginUrl: "https://dash.cloudflare.com",
    dnsPath: "Select domain → DNS → Records",
    steps: [
      { title: "Log in to Cloudflare", detail: "Go to dash.cloudflare.com and log in with your Cloudflare credentials." },
      { title: "Select your domain", detail: "On the home screen, click on the domain you want to connect." },
      { title: "Go to DNS Records", detail: "Click DNS in the left sidebar, then click Records." },
      { title: "Add a CNAME record", detail: "Click Add Record. Set Type to CNAME, Name to @ (or your root domain), Target to cname.vercel-dns.com. IMPORTANT: Turn the Proxy status to DNS only (grey cloud, not orange)." },
      { title: "Save", detail: "Click Save. Cloudflare DNS changes are usually instant — check status in a few minutes." },
    ],
  },
  bluehost: {
    name: "Bluehost",
    color: "#003087",
    loginUrl: "https://my.bluehost.com",
    dnsPath: "Domains → DNS → CNAME Records",
    steps: [
      { title: "Log in to Bluehost", detail: "Go to my.bluehost.com and log in with your credentials." },
      { title: "Go to Domains", detail: "In the top menu, click Domains, then select your domain." },
      { title: "Open DNS Zone", detail: "Click the DNS tab. Scroll to the CNAME Records section." },
      { title: "Add a CNAME record", detail: "Click Add Record. Set Host Record to @ or www, Points To to cname.vercel-dns.com, TTL to 4 Hours." },
      { title: "Save and wait", detail: "Click Save. Bluehost DNS changes take 24–48 hours to fully propagate globally." },
    ],
  },
  wix: {
    name: "Wix",
    color: "#0C6EFC",
    loginUrl: "https://manage.wix.com",
    dnsPath: "Domains → Manage → Advanced",
    steps: [
      { title: "Log in to Wix", detail: "Go to wix.com and click Log In. Use your Wix account email and password." },
      { title: "Go to Domain Management", detail: "From your dashboard, click on your profile icon → Domain Management, or go to manage.wix.com/premium-purchase-flow/dynamo." },
      { title: "Select your domain", detail: "Find your domain and click Manage next to it." },
      { title: "Add DNS record", detail: "Click Advanced → DNS Records. Find CNAME and click + Add Record. Set Host to @ or www and Value to cname.vercel-dns.com." },
      { title: "Save and wait", detail: "Click Save. Wix DNS typically takes 24–48 hours to propagate." },
    ],
  },
  other: {
    name: "Other Registrar",
    color: "#6b6b8a",
    loginUrl: "",
    dnsPath: "DNS Management → CNAME Records",
    steps: [
      { title: "Log in to your registrar", detail: "Go to the website where you purchased your domain and log in to your account." },
      { title: "Find DNS Management", detail: "Look for a section called DNS Management, DNS Settings, Zone Editor, Name Servers, or Advanced DNS. It is usually under your domain settings." },
      { title: "Add a CNAME record", detail: "Create a new CNAME record. Every registrar is slightly different, but you need these values: Host/Name = @ (or blank, or your domain), Value/Target/Points To = cname.vercel-dns.com." },
      { title: "Save and wait", detail: "Save the record. DNS changes typically take 15 minutes to 48 hours to propagate worldwide." },
      { title: "Need help?", detail: "If you can't find DNS settings, search '[your registrar name] add CNAME record' on Google — every registrar has a support article for this. Or contact our support team and we'll help you." },
    ],
  },
};

const REGISTRAR_GRID = [
  { key: "godaddy",     label: "GoDaddy",         emoji: "🟢" },
  { key: "namecheap",   label: "Namecheap",        emoji: "🔴" },
  { key: "squarespace", label: "Squarespace",      emoji: "⬛" },
  { key: "google",      label: "Google Domains",   emoji: "🔵" },
  { key: "cloudflare",  label: "Cloudflare",       emoji: "🟠" },
  { key: "bluehost",    label: "Bluehost",         emoji: "🔷" },
  { key: "wix",         label: "Wix",              emoji: "🔵" },
  { key: "other",       label: "Other",            emoji: "⚙️" },
];

export default function DomainPage() {
  const router = useRouter();
  const supabase = createClient();

  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Finder
  const [finderDomain, setFinderDomain] = useState("");
  const [finderLoading, setFinderLoading] = useState(false);
  const [finderResult, setFinderResult] = useState<{ registrar: string; registrarKey: string; domain: string } | null>(null);
  const [finderError, setFinderError] = useState("");

  // Domain input + status
  const [domainInput, setDomainInput] = useState("");
  const [domainSaving, setDomainSaving] = useState(false);
  const [domainChecking, setDomainChecking] = useState(false);
  const [copiedCname, setCopiedCname] = useState(false);

  // Registrar modal
  const [selectedRegistrar, setSelectedRegistrar] = useState<string | null>(null);
  const [modalStep, setModalStep] = useState(0);

  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    const { data: customer } = await supabase.from("customers").select("id").eq("user_id", user.id).single();
    if (!customer) { router.push("/onboarding"); return; }
    const { data: biz } = await supabase.from("businesses").select("*").eq("customer_id", customer.id).single();
    setBusiness(biz);
    if (biz?.custom_domain) setDomainInput(biz.custom_domain);
    setLoading(false);
  }

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleFindRegistrar() {
    if (!finderDomain.trim()) return;
    setFinderLoading(true);
    setFinderError("");
    setFinderResult(null);
    try {
      const res = await fetch(`/api/whois?domain=${encodeURIComponent(finderDomain.trim())}`);
      const data = await res.json();
      if (data.error && !data.registrar) {
        setFinderError("Could not look up that domain. Try entering your registrar manually below.");
      } else {
        setFinderResult(data);
        if (data.registrarKey) setSelectedRegistrar(data.registrarKey);
      }
    } finally {
      setFinderLoading(false);
    }
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
      showToast("Domain saved — now update your DNS using the instructions below");
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
        showToast("🎉 Domain verified and live!");
      } else {
        showToast("Not verified yet — DNS changes can take up to 48 hours. Check back soon.", false);
      }
    } finally {
      setDomainChecking(false);
    }
  }

  function copyCname() {
    navigator.clipboard.writeText("cname.vercel-dns.com");
    setCopiedCname(true);
    setTimeout(() => setCopiedCname(false), 2000);
  }

  const registrar = selectedRegistrar ? REGISTRARS[selectedRegistrar] : null;
  const currentStep = registrar?.steps[modalStep];

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
        <div className={styles.header}>
          <div>
            <h1 className={styles.greeting}>Custom Domain Setup</h1>
            <p className={styles.subGreeting}>Connect your own domain to your Exsisto site</p>
          </div>
          <a href="/dashboard/website" style={{ fontSize: "13px", color: "#4648d4", textDecoration: "none", fontWeight: 600 }}>← Back to Website</a>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "80px", color: "#9090a8" }}>
            <div style={{ width: "32px", height: "32px", border: "3px solid #ede9f8", borderTopColor: "#4648d4", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
            Loading…
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "20px", alignItems: "start" }}>

            {/* LEFT COLUMN */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

              {/* Status banner if domain already set */}
              {business?.custom_domain && (
                <div style={{
                  background: business.domain_status === "active" ? "#dcfce7" : "#fef3c7",
                  border: `1px solid ${business.domain_status === "active" ? "#16a34a" : "#f59e0b"}30`,
                  borderRadius: "12px", padding: "16px 20px",
                  display: "flex", alignItems: "center", justifyContent: "space-between"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ fontSize: "20px" }}>{business.domain_status === "active" ? "✅" : "⏳"}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "14px", color: "#1b1b25" }}>{business.custom_domain}</div>
                      <div style={{ fontSize: "12px", color: "#6b6b8a", marginTop: "2px" }}>
                        {business.domain_status === "active" ? "Live and verified — your domain is connected!" : "Waiting for DNS verification"}
                      </div>
                    </div>
                  </div>
                  {business.domain_status !== "active" && (
                    <button onClick={handleCheckDomain} disabled={domainChecking}
                      style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: "#4648d4", color: "#fff", fontSize: "12px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                      {domainChecking ? "Checking…" : "Check status"}
                    </button>
                  )}
                </div>
              )}

              {/* Step 1: Find registrar */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#4648d4", color: "#fff", fontSize: "12px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>1</div>
                    <div className={styles.cardTitle}>Find where your domain is registered</div>
                  </div>
                </div>
                <div style={{ padding: "16px 20px" }}>
                  <p style={{ fontSize: "13px", color: "#6b6b8a", marginBottom: "14px", lineHeight: 1.6 }}>
                    Not sure where you bought your domain? Enter it below and we&apos;ll look it up for you.
                  </p>
                  <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                    <input
                      type="text"
                      value={finderDomain}
                      onChange={e => setFinderDomain(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleFindRegistrar()}
                      placeholder="yourdomain.com"
                      style={{ flex: 1, padding: "10px 14px", border: "1px solid #ede9f8", borderRadius: "8px", fontSize: "13px", fontFamily: "inherit", outline: "none", color: "#1b1b25" }}
                    />
                    <button onClick={handleFindRegistrar} disabled={!finderDomain.trim() || finderLoading}
                      style={{ padding: "10px 18px", borderRadius: "8px", border: "none", background: finderDomain.trim() && !finderLoading ? "#4648d4" : "#ede9f8", color: finderDomain.trim() && !finderLoading ? "#fff" : "#9090a8", fontSize: "13px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                      {finderLoading ? "Looking up…" : "Look up →"}
                    </button>
                  </div>
                  {finderResult && (
                    <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "12px 16px", display: "flex", alignItems: "center", gap: "12px" }}>
                      <span style={{ fontSize: "20px" }}>✅</span>
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: 700, color: "#1b1b25" }}>
                          {finderResult.domain} is registered at <span style={{ color: "#4648d4" }}>{finderResult.registrar}</span>
                        </div>
                        <div style={{ fontSize: "12px", color: "#6b6b8a", marginTop: "2px" }}>
                          We&apos;ve pre-selected the right instructions below ↓
                        </div>
                      </div>
                    </div>
                  )}
                  {finderError && (
                    <div style={{ background: "#fef3c7", border: "1px solid #f59e0b30", borderRadius: "8px", padding: "10px 14px", fontSize: "12px", color: "#92400e" }}>
                      {finderError}
                    </div>
                  )}
                </div>
              </div>

              {/* Step 2: Pick registrar */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#4648d4", color: "#fff", fontSize: "12px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>2</div>
                    <div className={styles.cardTitle}>Select your registrar for step-by-step instructions</div>
                  </div>
                </div>
                <div style={{ padding: "16px 20px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
                    {REGISTRAR_GRID.map(r => (
                      <button key={r.key} onClick={() => { setSelectedRegistrar(r.key); setModalStep(0); }}
                        style={{
                          padding: "12px 8px", borderRadius: "10px", border: "2px solid",
                          borderColor: selectedRegistrar === r.key ? "#4648d4" : "#ede9f8",
                          background: selectedRegistrar === r.key ? "#eeeeff" : "#fff",
                          cursor: "pointer", fontFamily: "inherit", textAlign: "center",
                          transition: "all 0.15s"
                        }}>
                        <div style={{ fontSize: "20px", marginBottom: "4px" }}>{r.emoji}</div>
                        <div style={{ fontSize: "11px", fontWeight: 700, color: selectedRegistrar === r.key ? "#4648d4" : "#1b1b25" }}>{r.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Step 3: Instructions */}
              {registrar && (
                <div className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#4648d4", color: "#fff", fontSize: "12px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>3</div>
                      <div className={styles.cardTitle}>Follow these steps in {registrar.name}</div>
                    </div>
                    {registrar.loginUrl && (
                      <a href={registrar.loginUrl} target="_blank" rel="noreferrer"
                        style={{ fontSize: "12px", fontWeight: 700, color: "#fff", background: registrar.color, padding: "6px 14px", borderRadius: "8px", textDecoration: "none" }}>
                        Open {registrar.name} →
                      </a>
                    )}
                  </div>
                  <div style={{ padding: "0 20px 20px" }}>

                    {/* Progress dots */}
                    <div style={{ display: "flex", gap: "6px", marginBottom: "20px" }}>
                      {registrar.steps.map((_, i) => (
                        <button key={i} onClick={() => setModalStep(i)}
                          style={{ width: i === modalStep ? "24px" : "8px", height: "8px", borderRadius: "100px", border: "none", cursor: "pointer", transition: "all 0.2s",
                            background: i === modalStep ? "#4648d4" : i < modalStep ? "#a5b4fc" : "#ede9f8" }} />
                      ))}
                    </div>

                    {/* Current step */}
                    {currentStep && (
                      <div style={{ background: "#f8f7ff", borderRadius: "12px", padding: "20px", marginBottom: "16px", minHeight: "120px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                          <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#4648d4", color: "#fff", fontSize: "13px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            {modalStep + 1}
                          </div>
                          <div style={{ fontSize: "15px", fontWeight: 700, color: "#1b1b25" }}>{currentStep.title}</div>
                        </div>
                        <p style={{ fontSize: "13px", color: "#4b4b6a", lineHeight: 1.7, margin: 0 }}>{currentStep.detail}</p>
                      </div>
                    )}

                    {/* Nav buttons */}
                    <div style={{ display: "flex", gap: "8px", justifyContent: "space-between" }}>
                      <button onClick={() => setModalStep(s => Math.max(0, s - 1))} disabled={modalStep === 0}
                        style={{ padding: "9px 18px", borderRadius: "8px", border: "1px solid #ede9f8", background: "#fff", color: modalStep === 0 ? "#c4c4d4" : "#1b1b25", fontSize: "13px", fontWeight: 600, cursor: modalStep === 0 ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
                        ← Previous
                      </button>
                      <span style={{ fontSize: "12px", color: "#9090a8", alignSelf: "center" }}>Step {modalStep + 1} of {registrar.steps.length}</span>
                      {modalStep < registrar.steps.length - 1 ? (
                        <button onClick={() => setModalStep(s => s + 1)}
                          style={{ padding: "9px 18px", borderRadius: "8px", border: "none", background: "#4648d4", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                          Next →
                        </button>
                      ) : (
                        <button onClick={handleCheckDomain} disabled={!business?.custom_domain || domainChecking}
                          style={{ padding: "9px 18px", borderRadius: "8px", border: "none", background: business?.custom_domain ? "#16a34a" : "#ede9f8", color: business?.custom_domain ? "#fff" : "#9090a8", fontSize: "13px", fontWeight: 700, cursor: business?.custom_domain ? "pointer" : "not-allowed", fontFamily: "inherit" }}>
                          {domainChecking ? "Checking…" : "I'm done — check status ✓"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", position: "sticky", top: "24px" }}>

              {/* Domain input */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitle}>Your domain</div>
                  {business?.domain_status === "active" && (
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#16a34a", background: "#dcfce7", padding: "2px 8px", borderRadius: "100px" }}>Live ✓</span>
                  )}
                </div>
                <div style={{ padding: "16px 18px" }}>
                  <p style={{ fontSize: "12px", color: "#9090a8", marginBottom: "10px", lineHeight: 1.6 }}>
                    Enter the domain you want to connect. Don&apos;t include www or https://
                  </p>
                  <input
                    type="text"
                    value={domainInput}
                    onChange={e => setDomainInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleAddDomain()}
                    placeholder="yourdomain.com"
                    disabled={business?.domain_status === "active"}
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #ede9f8", borderRadius: "8px", fontSize: "13px", fontFamily: "inherit", outline: "none", color: "#1b1b25", marginBottom: "10px", boxSizing: "border-box", opacity: business?.domain_status === "active" ? 0.6 : 1 }}
                  />
                  {business?.domain_status !== "active" && (
                    <button onClick={handleAddDomain} disabled={!domainInput.trim() || domainSaving}
                      style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "none", background: domainInput.trim() && !domainSaving ? "#4648d4" : "#ede9f8", color: domainInput.trim() && !domainSaving ? "#fff" : "#9090a8", fontSize: "13px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                      {domainSaving ? "Saving…" : business?.custom_domain ? "Update domain" : "Save domain →"}
                    </button>
                  )}
                </div>
              </div>

              {/* The CNAME record — always visible */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitle}>DNS Record to Add</div>
                </div>
                <div style={{ padding: "16px 18px" }}>
                  <p style={{ fontSize: "12px", color: "#9090a8", marginBottom: "12px", lineHeight: 1.6 }}>
                    Add this exact record in your registrar&apos;s DNS settings:
                  </p>
                  <div style={{ background: "#f8f7ff", border: "1px solid #ede9f8", borderRadius: "10px", overflow: "hidden", marginBottom: "12px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "70px 50px 1fr", borderBottom: "1px solid #ede9f8" }}>
                      {["Type", "Name", "Value"].map(h => (
                        <div key={h} style={{ padding: "8px 12px", fontSize: "10px", fontWeight: 700, color: "#9090a8", background: "#faf9ff", textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</div>
                      ))}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "70px 50px 1fr" }}>
                      <div style={{ padding: "12px", fontSize: "12px", fontWeight: 700, color: "#4648d4" }}>CNAME</div>
                      <div style={{ padding: "12px", fontSize: "12px", fontFamily: "monospace", color: "#1b1b25" }}>@</div>
                      <div style={{ padding: "12px", fontSize: "12px", fontFamily: "monospace", color: "#1b1b25", wordBreak: "break-all" }}>cname.vercel-dns.com</div>
                    </div>
                  </div>
                  <button onClick={copyCname}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ede9f8", background: copiedCname ? "#f0fdf4" : "#fff", color: copiedCname ? "#16a34a" : "#4648d4", fontSize: "13px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" }}>
                    {copiedCname ? "✓ Copied!" : "📋 Copy cname.vercel-dns.com"}
                  </button>
                  <p style={{ fontSize: "11px", color: "#9090a8", marginTop: "10px", lineHeight: 1.5 }}>
                    ⚠️ If your registrar doesn&apos;t accept @ as the Name, try leaving it blank or entering your domain name directly.
                  </p>
                </div>
              </div>

              {/* Check status */}
              {business?.custom_domain && business.domain_status !== "active" && (
                <div className={styles.card}>
                  <div style={{ padding: "16px 18px" }}>
                    <p style={{ fontSize: "12px", color: "#9090a8", marginBottom: "10px", lineHeight: 1.6 }}>
                      Once you&apos;ve updated your DNS, click below to check if it&apos;s live. DNS changes can take anywhere from 15 minutes to 48 hours.
                    </p>
                    <button onClick={handleCheckDomain} disabled={domainChecking}
                      style={{ width: "100%", padding: "11px", borderRadius: "8px", border: "none", background: "#4648d4", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                      {domainChecking ? "Checking DNS…" : "✓ I updated my DNS — check now"}
                    </button>
                  </div>
                </div>
              )}

              {/* Need help */}
              <div style={{ background: "#f8f7ff", border: "1px solid #ede9f8", borderRadius: "12px", padding: "16px 18px" }}>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#1b1b25", marginBottom: "6px" }}>Need help?</div>
                <p style={{ fontSize: "12px", color: "#6b6b8a", lineHeight: 1.6, margin: "0 0 10px" }}>
                  DNS setup can be tricky. If you&apos;re stuck, our support team will set it up for you — just send us your registrar login and we&apos;ll handle it.
                </p>
                <a href="mailto:support@exsisto.ai"
                  style={{ display: "block", textAlign: "center", padding: "9px", borderRadius: "8px", border: "1px solid #ede9f8", background: "#fff", color: "#4648d4", fontSize: "12px", fontWeight: 700, textDecoration: "none" }}>
                  Contact support →
                </a>
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
