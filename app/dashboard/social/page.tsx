"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect, useCallback, Suspense } from "react";
import { createClient } from "@/lib/supabase";
import { useSearchParams } from "next/navigation";
import MobileNav from "@/components/MobileNav";
import styles from "../dashboard.module.css";

type Platform = "all" | "facebook" | "instagram" | "tiktok";
type Post = {
  id: string;
  platform: "facebook" | "instagram" | "tiktok";
  caption: string;
  image_url: string | null;
  status: string;
  scheduled_for: string;
};
type SocialAccount = {
  id: string;
  platform: string;
  account_name: string;
  account_picture: string | null;
  page_name: string | null;
  status: string;
};

const PLATFORMS = {
  facebook:  { color: "#1877f2", abbr: "f",  label: "Facebook" },
  instagram: { color: "#e1306c", abbr: "ig", label: "Instagram" },
  tiktok:    { color: "#010101", abbr: "tt", label: "TikTok" },
};

function SocialPageInner() {
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [posts, setPosts] = useState<Post[]>([]);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [filter, setFilter] = useState<Platform>("all");
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [business, setBusiness] = useState<any>(null);
  const [plan, setPlan] = useState("starter");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCaption, setEditCaption] = useState("");
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }

  useEffect(() => {
    const status = searchParams.get("connect");
    const platform = searchParams.get("platform");
    if (status && platform) {
      showToast(
        status === "success" ? `${platform} connected!` : `Failed to connect ${platform}`,
        status === "success"
      );
      window.history.replaceState({}, "", "/dashboard/social");
    }
  }, [searchParams]);

  const loadAll = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: customer } = await supabase.from("customers").select("id").eq("user_id", user.id).single();
    if (!customer) return;
    const { data: biz } = await supabase.from("businesses").select("*").eq("customer_id", customer.id).single();
    if (!biz) return;
    setBusinessId(biz.id);
    setBusiness(biz);
    const { data: sub } = await supabase.from("subscriptions").select("plan").eq("customer_id", customer.id).single();
    if (sub?.plan) setPlan(sub.plan);

    const [postsRes, accountsRes] = await Promise.all([
      supabase.from("social_posts").select("*").eq("business_id", biz.id).order("scheduled_for", { ascending: true }),
      fetch("/api/social-accounts").then(r => r.json()).catch(() => ({ accounts: [] })),
    ]);
    setPosts(postsRes.data || []);
    setAccounts(accountsRes.accounts || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadAll(); }, [loadAll]);

  async function reloadPosts() {
    if (!businessId) return;
    const { data } = await supabase.from("social_posts").select("*").eq("business_id", businessId).order("scheduled_for", { ascending: true });
    setPosts(data || []);
  }

  async function handleGenerate() {
    if (!businessId) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/generate-social", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ business_id: businessId }) });
      if (res.ok) { await reloadPosts(); showToast("Posts generated!"); }
      else showToast("Generation failed", false);
    } finally { setGenerating(false); }
  }

  async function handleSaveEdit(id: string) {
    await supabase.from("social_posts").update({ caption: editCaption }).eq("id", id);
    setPosts(posts.map(p => p.id === id ? { ...p, caption: editCaption } : p));
    setEditingId(null);
    showToast("Caption saved ✓");
  }

  async function handleApprove(id: string) {
    await supabase.from("social_posts").update({ status: "scheduled" }).eq("id", id);
    setPosts(posts.map(p => p.id === id ? { ...p, status: "scheduled" } : p));
    showToast("Post approved ✓");
  }

  async function handleDelete(id: string) {
    await supabase.from("social_posts").delete().eq("id", id);
    setPosts(posts.filter(p => p.id !== id));
    showToast("Post deleted");
  }

  async function handleConnect(platform: string) {
    if (!businessId) return;
    window.location.href = platform === "instagram"
      ? `/api/auth/facebook/connect?business_id=${businessId}`
      : `/api/auth/${platform}/connect?business_id=${businessId}`;
  }

  async function handleDisconnect(platform: string) {
    if (!confirm(`Disconnect ${platform}?`)) return;
    setDisconnecting(platform);
    await fetch("/api/social-accounts", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ platform }) });
    setAccounts(prev => prev.filter(a => a.platform !== platform));
    setDisconnecting(null);
    showToast(`${platform} disconnected`);
  }

  const getAccount = (p: string) => accounts.find(a => a.platform === p);
  const filtered = filter === "all" ? posts : posts.filter(p => p.platform === filter);

  const counts = {
    facebook:  posts.filter(p => p.platform === "facebook").length,
    instagram: posts.filter(p => p.platform === "instagram").length,
    tiktok:    posts.filter(p => p.platform === "tiktok").length,
  };

  const socialFreq: Record<string, string> = { starter: "8/month", pro: "16/month", premium: "32/month" };

  function statusBadge(status: string) {
    if (status === "published") return { bg: "#dcfce7", color: "#166534", label: "Published" };
    if (status === "scheduled") return { bg: "#eeeeff", color: "#4648d4", label: "Scheduled" };
    if (status === "failed")    return { bg: "#fee2e2", color: "#991b1b", label: "Failed" };
    return { bg: "#fef3c7", color: "#92400e", label: "Draft" };
  }

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}><a href="/">Ex<span>sisto</span></a></div>
        <nav className={styles.nav}>
          <a href="/dashboard" className={styles.navItem}><span>⚡</span> Overview</a>
          <a href="/dashboard/website" className={styles.navItem}><span>🌐</span> Website</a>
          <a href="/dashboard/blog" className={styles.navItem}><span>✍️</span> Blog Posts</a>
          <a href="/dashboard/social" className={`${styles.navItem} ${styles.active}`}><span>📱</span> Social Media</a>
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
            <h1 className={styles.greeting}>Social Media</h1>
            <p className={styles.subGreeting}>{socialFreq[plan] || "8/month"} · {posts.length} posts total</p>
          </div>
          <div className={styles.headerActions}>
            <button onClick={handleGenerate} disabled={generating} className={styles.editSiteBtn} style={{ border: "none", cursor: "pointer", fontFamily: "inherit", opacity: generating ? 0.7 : 1 }}>
              {generating ? "Generating…" : "✦ Generate posts"}
            </button>
          </div>
        </div>

        {/* Platform connection cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px", marginBottom: "24px" }}>
          {(["facebook", "instagram", "tiktok"] as const).map(p => {
            const account = getAccount(p);
            const { color, abbr, label } = PLATFORMS[p];
            return (
              <div key={p} className={styles.card} style={{ borderColor: account ? "#ede9f8" : "#ede9f8" }}>
                <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: "10px" }}>
                  <div className={styles.platformIcon} style={{ background: color, fontSize: "11px", fontWeight: 800, color: "#fff", width: "34px", height: "34px" }}>
                    {account?.account_picture ? <img src={account.account_picture} alt={label} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} /> : abbr}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "#1b1b25" }}>{label}</div>
                    <div style={{ fontSize: "11px", color: account ? "#16a34a" : "#9090a8", fontWeight: account ? 600 : 400 }}>
                      {account ? `● ${account.page_name || account.account_name}` : "Not connected"}
                    </div>
                  </div>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "#9090a8" }}>{counts[p]}</div>
                </div>
                <div style={{ padding: "0 16px 14px" }}>
                  {account ? (
                    <button onClick={() => handleDisconnect(p)} disabled={disconnecting === p} style={{ width: "100%", padding: "7px", borderRadius: "7px", border: "1px solid #fee2e2", background: "#fff", color: "#dc2626", fontSize: "11px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                      {disconnecting === p ? "…" : "Disconnect"}
                    </button>
                  ) : (
                    <button onClick={() => handleConnect(p)} style={{ width: "100%", padding: "7px", borderRadius: "7px", border: "none", background: color, color: "#fff", fontSize: "11px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                      Connect {label}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
          {(["all", "facebook", "instagram", "tiktok"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: "7px 16px", borderRadius: "100px", fontSize: "12px", fontWeight: 600,
              border: filter === f ? "none" : "1px solid #ede9f8",
              background: filter === f ? "#4648d4" : "#fff",
              color: filter === f ? "#fff" : "#6b6b8a",
              cursor: "pointer", fontFamily: "inherit",
            }}>
              {f === "all" ? `All (${posts.length})` : `${PLATFORMS[f].label} (${counts[f]})`}
            </button>
          ))}
        </div>

        {/* Posts */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px", color: "#9090a8" }}>
            <div style={{ width: "32px", height: "32px", border: "3px solid #ede9f8", borderTopColor: "#4648d4", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
            Loading posts…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ background: "#fff", border: "1px solid #ede9f8", borderRadius: "14px", padding: "56px", textAlign: "center" }}>
            <div style={{ fontSize: "32px", marginBottom: "16px" }}>📱</div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "#1b1b25", marginBottom: "8px" }}>No posts yet</div>
            <div style={{ fontSize: "13px", color: "#9090a8", marginBottom: "20px" }}>Generate your first batch of social posts.</div>
            <button onClick={handleGenerate} disabled={generating} style={{ padding: "10px 24px", borderRadius: "8px", border: "none", background: "#4648d4", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              {generating ? "Generating…" : "Generate posts →"}
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "12px" }}>
            {filtered.map(post => {
              const { color, abbr, label } = PLATFORMS[post.platform];
              const badge = statusBadge(post.status);
              const isEditing = editingId === post.id;
              return (
                <div key={post.id} style={{ background: "#fff", border: "1px solid #ede9f8", borderRadius: "12px", overflow: "hidden" }}>
                  {/* Post header */}
                  <div style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: "8px", borderBottom: "1px solid #f5f2ff" }}>
                    <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                      {abbr}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "12px", fontWeight: 700, color: "#1b1b25" }}>{label}</div>
                      {post.scheduled_for && (
                        <div style={{ fontSize: "10px", color: "#9090a8" }}>
                          {new Date(post.scheduled_for).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </div>
                      )}
                    </div>
                    <span style={{ background: badge.bg, color: badge.color, fontSize: "10px", fontWeight: 700, padding: "3px 9px", borderRadius: "100px" }}>
                      {badge.label}
                    </span>
                  </div>

                  {/* Image */}
                  {post.image_url && (
                    <div style={{ height: "140px", overflow: "hidden", background: "#f5f2ff" }}>
                      <img src={post.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  )}

                  {/* Caption */}
                  <div style={{ padding: "12px 14px" }}>
                    {isEditing ? (
                      <textarea
                        value={editCaption}
                        onChange={e => setEditCaption(e.target.value)}
                        style={{ width: "100%", minHeight: "80px", padding: "8px", border: "1px solid #c7c4f0", borderRadius: "8px", fontSize: "12px", fontFamily: "inherit", resize: "vertical", outline: "none", color: "#1b1b25" }}
                      />
                    ) : (
                      <p style={{ fontSize: "12px", color: "#1b1b25", lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap" }}>
                        {post.caption}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ padding: "10px 14px", borderTop: "1px solid #f5f2ff", display: "flex", gap: "6px" }}>
                    {isEditing ? (
                      <>
                        <button onClick={() => setEditingId(null)} style={{ flex: 1, padding: "7px", borderRadius: "6px", border: "1px solid #ede9f8", background: "#fff", color: "#6b6b8a", fontSize: "11px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                        <button onClick={() => handleSaveEdit(post.id)} style={{ flex: 2, padding: "7px", borderRadius: "6px", border: "none", background: "#4648d4", color: "#fff", fontSize: "11px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Save</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => { setEditingId(post.id); setEditCaption(post.caption); }} style={{ flex: 1, padding: "7px", borderRadius: "6px", border: "1px solid #ede9f8", background: "#fff", color: "#6b6b8a", fontSize: "11px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Edit</button>
                        {post.status === "draft" && (
                          <button onClick={() => handleApprove(post.id)} style={{ flex: 1, padding: "7px", borderRadius: "6px", border: "none", background: "#4648d4", color: "#fff", fontSize: "11px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Approve</button>
                        )}
                        <button onClick={() => handleDelete(post.id)} style={{ padding: "7px 10px", borderRadius: "6px", border: "1px solid #fee2e2", background: "#fff", color: "#dc2626", fontSize: "11px", cursor: "pointer", fontFamily: "inherit" }}>✕</button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
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

export default function SocialPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#fcf8ff" }} />}>
      <SocialPageInner />
    </Suspense>
  );
}
