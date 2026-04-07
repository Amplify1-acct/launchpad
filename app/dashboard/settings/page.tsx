"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect, Suspense } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import MobileNav from "@/components/MobileNav";
import styles from "../dashboard.module.css";

type SocialAccount = {
  platform: string;
  account_name: string;
  account_picture: string | null;
  page_name: string | null;
  connected_at: string;
  status: string;
};

const PLATFORMS = [
  { id: "facebook",  name: "Facebook",  color: "#1877f2", abbr: "f",  description: "Connect your Facebook Page to publish posts automatically.", connectUrl: "/api/auth/facebook" },
  { id: "instagram", name: "Instagram", color: "#e1306c", abbr: "ig", description: "Connected automatically when you link your Facebook Page.", connectUrl: "/api/auth/facebook", viaMeta: true },
  { id: "tiktok",    name: "TikTok",    color: "#010101", abbr: "tt", description: "Connect your TikTok Business account to publish videos.", connectUrl: "/api/auth/tiktok" },
];

function SettingsInner() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [business, setBusiness] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [plan, setPlan] = useState("starter");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [editingBiz, setEditingBiz] = useState(false);
  const [blogMode, setBlogMode] = useState<"manual" | "auto">("manual");
  const [socialMode, setSocialMode] = useState<"manual" | "auto">("manual");
  const [savingMode, setSavingMode] = useState(false);
  const [bizForm, setBizForm] = useState({ name: "", city: "", state: "", phone: "", email: "" });
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    const connected = searchParams.get("connected");
    const error = searchParams.get("error");
    if (connected) { showToast(`${connected.charAt(0).toUpperCase() + connected.slice(1)} connected!`); router.replace("/dashboard/settings"); }
    else if (error) { showToast("Connection failed — please try again.", false); router.replace("/dashboard/settings"); }
  }, [searchParams]);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    const { data: cust } = await supabase.from("customers").select("*").eq("user_id", user.id).single();
    if (!cust) { router.push("/onboarding"); return; }
    setCustomer(cust);
    const { data: biz } = await supabase.from("businesses").select("*").eq("customer_id", cust.id).single();
    if (biz) {
      setBusiness(biz);
      setBizForm({ name: biz.name || "", city: biz.city || "", state: biz.state || "", phone: biz.phone || "", email: biz.email || "" });
    }
    const { data: sub } = await supabase.from("subscriptions").select("plan").eq("customer_id", cust.id).single();
    if (sub?.plan) setPlan(sub.plan);
    const { data: accts } = await supabase.from("social_accounts").select("*").eq("business_id", biz?.id);
    setAccounts(accts || []);

    // Load approval modes
    const modesRes = await fetch("/api/settings/approval-mode");
    if (modesRes.ok) {
      const modes = await modesRes.json();
      setBlogMode(modes.blog_approval_mode || "manual");
      setSocialMode(modes.social_approval_mode || "manual");
    }

    setLoading(false);
  }

  async function handleBillingPortal() {
    const res = await fetch("/api/billing/portal", { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else showToast("Could not open billing portal", false);
  }

  async function saveApprovalModes() {
    setSavingMode(true);
    await fetch("/api/settings/approval-mode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blog_approval_mode: blogMode, social_approval_mode: socialMode }),
    });
    setSavingMode(false);
    showToast("Preferences saved ✓");
  }

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }

  async function saveBusiness() {
    if (!business) return;
    setSaving(true);
    await supabase.from("businesses").update(bizForm).eq("id", business.id);
    setBusiness({ ...business, ...bizForm });
    setEditingBiz(false);
    setSaving(false);
    showToast("Business info updated ✓");
  }

  async function handleDisconnect(platform: string) {
    setDisconnecting(platform);
    try {
      await fetch("/api/auth/disconnect", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ platform }) });
      setAccounts(prev => prev.filter(a => a.platform !== platform));
      showToast(`${platform} disconnected`);
    } finally { setDisconnecting(null); }
  }

  const getAccount = (platform: string) => accounts.find(a => a.platform === platform);

  const planColors: Record<string, string> = { starter: "#4648d4", pro: "#7c3aed", premium: "#db2777" };
  const planFreq: Record<string, { blog: string; social: string; price: string }> = {
    starter: { blog: "2 posts/mo", social: "8 posts/mo", price: "$99/mo" },
    pro:     { blog: "4 posts/mo", social: "16 posts/mo", price: "$299/mo" },
    premium: { blog: "8 posts/mo", social: "32 posts/mo", price: "$599/mo" },
  };

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}><a href="/">Ex<span>sisto</span></a></div>
        <nav className={styles.nav}>
          <a href="/dashboard" className={styles.navItem}><span>⚡</span> Overview</a>
          <a href="/dashboard/website" className={styles.navItem}><span>🌐</span> Website</a>
          <a href="/dashboard/blog" className={styles.navItem}><span>✍️</span> Blog Posts</a>
          <a href="/dashboard/social" className={styles.navItem}><span>📱</span> Social Media</a>
          <a href="/dashboard/settings" className={`${styles.navItem} ${styles.active}`}><span>⚙️</span> Settings</a>
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
        <div className={styles.header}>
          <div>
            <h1 className={styles.greeting}>Settings</h1>
            <p className={styles.subGreeting}>Manage your business info, plan, and social connections</p>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Business info */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>Business info</div>
              {!editingBiz && (
                <button onClick={() => setEditingBiz(true)} className={styles.cardAction} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                  Edit →
                </button>
              )}
            </div>
            <div style={{ padding: "4px 0" }}>
              {editingBiz ? (
                <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: "12px" }}>
                  {[
                    { label: "Business name", key: "name", placeholder: "Matty's Automotive" },
                    { label: "City", key: "city", placeholder: "Clark" },
                    { label: "State", key: "state", placeholder: "NJ" },
                    { label: "Phone", key: "phone", placeholder: "(908) 555-0100" },
                    { label: "Email", key: "email", placeholder: "hello@yourbusiness.com" },
                  ].map(({ label, key, placeholder }) => (
                    <div key={key}>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#9090a8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>{label}</label>
                      <input
                        type="text"
                        value={bizForm[key as keyof typeof bizForm]}
                        onChange={e => setBizForm(f => ({ ...f, [key]: e.target.value }))}
                        placeholder={placeholder}
                        style={{ width: "100%", padding: "9px 12px", border: "1px solid #ede9f8", borderRadius: "8px", fontSize: "13px", fontFamily: "inherit", outline: "none", background: "#fff", color: "#1b1b25" }}
                      />
                    </div>
                  ))}
                  <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                    <button onClick={() => setEditingBiz(false)} style={{ flex: 1, padding: "9px", borderRadius: "8px", border: "1px solid #ede9f8", background: "#fff", color: "#6b6b8a", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                      Cancel
                    </button>
                    <button onClick={saveBusiness} disabled={saving} style={{ flex: 2, padding: "9px", borderRadius: "8px", border: "none", background: "#4648d4", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", opacity: saving ? 0.7 : 1 }}>
                      {saving ? "Saving…" : "Save changes"}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {[
                    { label: "Business name", value: business?.name },
                    { label: "Location", value: [business?.city, business?.state].filter(Boolean).join(", ") },
                    { label: "Phone", value: business?.phone },
                    { label: "Email", value: business?.email },
                    { label: "Website", value: business?.subdomain ? `${business.subdomain}.exsisto.ai` : null },
                  ].filter(r => r.value).map(({ label, value }) => (
                    <div key={label} className={styles.postItem} style={{ padding: "12px 18px" }}>
                      <div style={{ fontSize: "11px", fontWeight: 700, color: "#9090a8", textTransform: "uppercase", letterSpacing: "0.5px", minWidth: "120px" }}>{label}</div>
                      <div style={{ fontSize: "13px", color: "#1b1b25", fontWeight: 500 }}>{value}</div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Plan */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>Your plan</div>
              <span className={styles.cardAction} style={{ color: planColors[plan] || "#4648d4", fontWeight: 700, fontSize: "13px" }}>
                {plan.charAt(0).toUpperCase() + plan.slice(1)}
              </span>
            </div>
            <div style={{ padding: "16px 18px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "10px", marginBottom: "16px" }}>
                {[
                  { label: "Price", value: planFreq[plan]?.price || "$99/mo" },
                  { label: "Blog posts", value: planFreq[plan]?.blog || "2/mo" },
                  { label: "Social posts", value: planFreq[plan]?.social || "8/mo" },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background: "#f5f2ff", borderRadius: "10px", padding: "14px", textAlign: "center" }}>
                    <div style={{ fontSize: "16px", fontWeight: 800, color: "#4648d4" }}>{value}</div>
                    <div style={{ fontSize: "11px", color: "#9090a8", marginTop: "3px" }}>{label}</div>
                  </div>
                ))}
              </div>
              <button onClick={handleBillingPortal} style={{
                display: "block", width: "100%", textAlign: "center", padding: "10px",
                border: "none", borderRadius: "8px", background: "#4648d4",
                fontSize: "13px", fontWeight: 700, color: "#fff",
                cursor: "pointer", fontFamily: "inherit",
              }}>
                Manage billing & upgrade →
              </button>
            </div>
          </div>

          {/* Social connections */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>Social media connections</div>
            </div>
            <div style={{ padding: "4px 0" }}>
              {PLATFORMS.map(platform => {
                const account = getAccount(platform.id);
                const isConnected = !!account;
                return (
                  <div key={platform.id} className={styles.platformRow} style={{ padding: "14px 18px" }}>
                    <div className={styles.platformIcon} style={{ background: platform.color, fontSize: "11px", fontWeight: 800, color: "#fff" }}>
                      {account?.account_picture ? (
                        <img src={account.account_picture} alt={platform.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                      ) : platform.abbr}
                    </div>
                    <div className={styles.platformInfo}>
                      <div className={styles.platformName}>{platform.name}</div>
                      <div className={styles.platformMeta}>
                        {isConnected ? (
                          <span style={{ color: "#16a34a", fontWeight: 600 }}>● Connected — {account.page_name || account.account_name}</span>
                        ) : platform.viaMeta ? "Connected via Facebook" : platform.description}
                      </div>
                    </div>
                    <div style={{ flexShrink: 0 }}>
                      {isConnected ? (
                        <button onClick={() => handleDisconnect(platform.id)} disabled={disconnecting === platform.id} style={{
                          padding: "6px 14px", borderRadius: "6px",
                          border: "1px solid #fee2e2", background: "#fff",
                          color: "#dc2626", fontSize: "12px", fontWeight: 600,
                          cursor: "pointer", fontFamily: "inherit",
                          opacity: disconnecting === platform.id ? 0.6 : 1,
                        }}>
                          {disconnecting === platform.id ? "…" : "Disconnect"}
                        </button>
                      ) : (
                        <a href={platform.connectUrl} style={{
                          display: "inline-block", padding: "6px 14px", borderRadius: "6px",
                          background: platform.color, color: "#fff",
                          fontSize: "12px", fontWeight: 700, textDecoration: "none",
                        }}>
                          Connect
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className={styles.cardFooter}>
              <span className={styles.cardFooterText}>🔒 We use official OAuth — your passwords are never stored</span>
            </div>
          </div>

          {/* How it works */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>How auto-publishing works</div>
            </div>
            <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: "12px" }}>
              {[
                { num: "1", title: "We generate posts", desc: "Tailored to your business, scheduled across 30 days." },
                { num: "2", title: "You review & approve", desc: "Edit captions, swap photos, or regenerate any post." },
                { num: "3", title: "We publish automatically", desc: "Approved posts go live on the scheduled date." },
              ].map(({ num, title, desc }) => (
                <div key={num} style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                  <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#eeeeff", color: "#4648d4", fontSize: "12px", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {num}
                  </div>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "#1b1b25", marginBottom: "2px" }}>{title}</div>
                    <div style={{ fontSize: "12px", color: "#9090a8" }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Approval mode */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>Content preferences</div>
            </div>
            <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: "20px" }}>
              {[
                { label: "Blog posts", desc: "Auto-publish blog posts without review, or review each one first.", mode: blogMode, setMode: setBlogMode },
                { label: "Social posts", desc: "Auto-schedule social posts, or approve each one before it goes out.", mode: socialMode, setMode: setSocialMode },
              ].map(({ label, desc, mode, setMode }) => (
                <div key={label}>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#1b1b25", marginBottom: "4px" }}>{label}</div>
                  <div style={{ fontSize: "12px", color: "#9090a8", marginBottom: "10px" }}>{desc}</div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    {(["manual", "auto"] as const).map(v => (
                      <button key={v} onClick={() => setMode(v)} style={{
                        flex: 1, padding: "8px", borderRadius: "8px",
                        border: mode === v ? "none" : "1px solid #ede9f8",
                        background: mode === v ? "#4648d4" : "#fff",
                        color: mode === v ? "#fff" : "#6b6b8a",
                        fontSize: "12px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                      }}>
                        {v === "manual" ? "✋ Manual review" : "⚡ Auto-publish"}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <button onClick={saveApprovalModes} disabled={savingMode} style={{
                padding: "10px", borderRadius: "8px", border: "none",
                background: "#4648d4", color: "#fff",
                fontSize: "13px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                opacity: savingMode ? 0.7 : 1,
              }}>
                {savingMode ? "Saving…" : "Save preferences"}
              </button>
            </div>
          </div>

          {/* Danger zone */}
          <div className={styles.card} style={{ borderColor: "#fee2e2" }}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle} style={{ color: "#dc2626" }}>Account</div>
            </div>
            <div style={{ padding: "16px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#1b1b25" }}>Cancel subscription</div>
                <div style={{ fontSize: "12px", color: "#9090a8", marginTop: "2px" }}>Your site stays live until the end of your billing period</div>
              </div>
              <a href="mailto:support@exsisto.ai?subject=Cancel subscription" style={{
                padding: "8px 16px", borderRadius: "8px",
                border: "1px solid #fee2e2", background: "#fff",
                color: "#dc2626", fontSize: "12px", fontWeight: 600,
                textDecoration: "none",
              }}>
                Cancel →
              </a>
            </div>
          </div>

        </div>
      </main>

      <MobileNav />

      {toast && (
        <div style={{
          position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)",
          background: toast.ok ? "#1b1b25" : "#dc2626",
          color: "#fff", padding: "12px 24px", borderRadius: "100px",
          fontSize: "13px", fontWeight: 600, zIndex: 999,
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)", whiteSpace: "nowrap",
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#fcf8ff" }} />}>
      <SettingsInner />
    </Suspense>
  );
}
