"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import styles from "./social.module.css";
import MobileNav from "@/components/MobileNav";

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
  platform: "facebook" | "instagram" | "tiktok";
  account_name: string;
  account_picture: string | null;
  page_name: string | null;
  status: string;
  connected_at: string;
  token_expires_at: string | null;
};

const PLATFORM_COLORS = {
  facebook: "#1877f2",
  instagram: "#e1306c",
  tiktok: "#010101",
};

const PLATFORM_ICONS = {
  facebook: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877f2">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  ),
  instagram: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="url(#ig-grad)">
      <defs>
        <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f09433"/>
          <stop offset="25%" stopColor="#e6683c"/>
          <stop offset="50%" stopColor="#dc2743"/>
          <stop offset="75%" stopColor="#cc2366"/>
          <stop offset="100%" stopColor="#bc1888"/>
        </linearGradient>
      </defs>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
    </svg>
  ),
  tiktok: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#010101">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
    </svg>
  ),
};

function SocialPageInner() {
  const searchParams = useSearchParams();
  const [posts, setPosts] = useState<Post[]>([]);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [regeneratingSelected, setRegeneratingSelected] = useState(false);
  const [filter, setFilter] = useState<Platform>("all");
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCaption, setEditCaption] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [connectToast, setConnectToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const supabase = createClient();

  // Show toast from OAuth redirect
  useEffect(() => {
    const status = searchParams.get("connect");
    const platform = searchParams.get("platform");
    if (status && platform) {
      const ok = status === "success";
      setConnectToast({
        msg: ok ? `${platform} connected successfully!` : `Failed to connect ${platform}. Please try again.`,
        ok,
      });
      setTimeout(() => setConnectToast(null), 4000);
      // Clean up URL
      window.history.replaceState({}, "", "/dashboard/social");
    }
  }, [searchParams]);

  const loadAll = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: customer } = await supabase.from("customers").select("id").eq("user_id", user.id).single();
    if (!customer) return;
    const { data: business } = await supabase.from("businesses").select("id").eq("customer_id", customer.id).single();
    if (!business) return;
    setBusinessId(business.id);

    // Load posts + accounts in parallel
    const [postsRes, accountsRes] = await Promise.all([
      supabase.from("social_posts").select("*").eq("business_id", business.id).order("scheduled_for", { ascending: true }),
      fetch("/api/social-accounts").then(r => r.json()),
    ]);
    setPosts(postsRes.data || []);
    setAccounts(accountsRes.accounts || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const filtered = filter === "all" ? posts : posts.filter(p => p.platform === filter);
  const counts = {
    facebook: posts.filter(p => p.platform === "facebook").length,
    instagram: posts.filter(p => p.platform === "instagram").length,
    tiktok: posts.filter(p => p.platform === "tiktok").length,
  };

  function getAccount(platform: string) {
    return accounts.find(a => a.platform === platform);
  }

  async function handleConnect(platform: "facebook" | "instagram" | "tiktok") {
    if (!businessId) return;
    if (platform === "instagram") {
      // Instagram connects via Facebook
      window.location.href = `/api/auth/facebook/connect?business_id=${businessId}`;
    } else {
      window.location.href = `/api/auth/${platform}/connect?business_id=${businessId}`;
    }
  }

  async function handleDisconnect(platform: string) {
    if (!confirm(`Disconnect ${platform}? Your scheduled posts will remain but won\'t be published.`)) return;
    setDisconnecting(platform);
    await fetch("/api/social-accounts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform }),
    });
    setAccounts(prev => prev.filter(a => a.platform !== platform));
    setDisconnecting(null);
  }

  function toggleSelect(id: string) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  function toggleSelectAll() {
    setSelected(selected.size === filtered.length ? new Set() : new Set(filtered.map(p => p.id)));
  }

  async function reloadPosts() {
    if (!businessId) return;
    const { data } = await supabase.from("social_posts").select("*").eq("business_id", businessId).order("scheduled_for", { ascending: true });
    setPosts(data || []);
  }

  async function handleGenerateAll() {
    if (!businessId) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/generate-social", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ business_id: businessId }) });
      if (res.ok) await reloadPosts();
    } finally { setGenerating(false); }
  }

  async function handleRegenerateSelected() {
    if (!businessId || selected.size === 0) return;
    setRegeneratingSelected(true);
    try {
      const selectedPosts = posts.filter(p => selected.has(p.id));
      const platformCounts = {
        facebook: selectedPosts.filter(p => p.platform === "facebook").length,
        instagram: selectedPosts.filter(p => p.platform === "instagram").length,
        tiktok: selectedPosts.filter(p => p.platform === "tiktok").length,
      };
      await supabase.from("social_posts").delete().in("id", Array.from(selected));
      const res = await fetch("/api/generate-social", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ business_id: businessId, replace_only: true, platform_counts: platformCounts }) });
      if (res.ok) { await reloadPosts(); setSelected(new Set()); setSelectMode(false); }
    } finally { setRegeneratingSelected(false); }
  }

  async function handleSaveEdit(id: string) {
    await supabase.from("social_posts").update({ caption: editCaption }).eq("id", id);
    setPosts(posts.map(p => p.id === id ? { ...p, caption: editCaption } : p));
    setEditingId(null);
  }

  async function handleApprove(id: string) {
    await supabase.from("social_posts").update({ status: "scheduled" }).eq("id", id);
    setPosts(posts.map(p => p.id === id ? { ...p, status: "scheduled" } : p));
  }

  async function handleDelete(id: string) {
    await supabase.from("social_posts").delete().eq("id", id);
    setPosts(posts.filter(p => p.id !== id));
  }

  const connectedCount = accounts.filter(a => a.status === "connected").length;

  return (
    <div className={styles.page}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}><a href="/">Ex<span>sisto</span></a></div>
        <nav className={styles.nav}>
          <a href="/dashboard" className={styles.navItem}><span>⚡</span> Overview</a>
          <a href="/dashboard/website" className={styles.navItem}><span>🌐</span> Website</a>
          <a href="/dashboard/blog" className={styles.navItem}><span>✍️</span> Blog Posts</a>
          <a href="/dashboard/social" className={`${styles.navItem} ${styles.active}`}><span>📱</span> Social Media</a>
          <a href="/dashboard/seo" className={styles.navItem}><span>🔍</span> SEO</a>
          <a href="/dashboard/settings" className={styles.navItem}><span>⚙️</span> Settings</a>
        </nav>
      </aside>

      <main className={styles.main}>
        {/* Toast */}
        {connectToast && (
          <div className={`${styles.toast} ${connectToast.ok ? styles.toastSuccess : styles.toastError}`}>
            {connectToast.ok ? "✓" : "✕"} {connectToast.msg}
          </div>
        )}

        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Social Media</h1>
            <p className={styles.subtitle}>
              {posts.length > 0
                ? `${posts.length} posts · ${posts.filter(p => p.status === "scheduled").length} approved · ${connectedCount}/3 platforms connected`
                : "Connect your accounts, then generate your 30-day content calendar"}
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" as const }}>
            {posts.length > 0 && !selectMode && (
              <button className={styles.selectModeBtn} onClick={() => { setSelectMode(true); setSelected(new Set()); }}>
                ☑ Select to Regenerate
              </button>
            )}
            {selectMode && (
              <>
                <button className={styles.cancelSelectBtn} onClick={() => { setSelectMode(false); setSelected(new Set()); }}>Cancel</button>
                <button className={styles.regenSelectedBtn} onClick={handleRegenerateSelected} disabled={selected.size === 0 || regeneratingSelected}>
                  {regeneratingSelected ? "Regenerating..." : `↺ Regenerate${selected.size > 0 ? ` (${selected.size})` : ""}`}
                </button>
              </>
            )}
            <button className={styles.generateBtn} onClick={handleGenerateAll} disabled={generating || regeneratingSelected}>
              {generating ? "Generating..." : posts.length > 0 ? "↺ Regenerate All" : "✨ Generate Posts"}
            </button>
          </div>
        </div>

        {/* Connect Accounts Section */}
        <div className={styles.connectSection}>
          <div className={styles.connectHeader}>
            <div>
              <h2 className={styles.connectTitle}>Connected Accounts</h2>
              <p className={styles.connectSubtitle}>Connect your social profiles to publish posts automatically</p>
            </div>
            {connectedCount > 0 && (
              <div className={styles.connectedBadge}>{connectedCount} connected</div>
            )}
          </div>
          <div className={styles.platformConnectGrid}>
            {(["facebook", "instagram", "tiktok"] as const).map(platform => {
              const account = getAccount(platform);
              const isConnected = !!account;
              const isInstagramViaFB = platform === "instagram";
              return (
                <div key={platform} className={`${styles.platformConnectCard} ${isConnected ? styles.platformConnected : ""}`}>
                  <div className={styles.platformConnectTop}>
                    <div className={styles.platformConnectIcon}>
                      {PLATFORM_ICONS[platform]}
                    </div>
                    <div className={styles.platformConnectInfo}>
                      <div className={styles.platformConnectName} style={{ color: PLATFORM_COLORS[platform] }}>
                        {platform.charAt(0).toUpperCase() + platform.slice(1)}
                      </div>
                      {isConnected ? (
                        <div className={styles.platformConnectAccount}>
                          {account.account_picture && (
                            <img src={account.account_picture} alt="" className={styles.accountAvatar} />
                          )}
                          <span className={styles.accountName}>{account.page_name || account.account_name}</span>
                        </div>
                      ) : (
                        <div className={styles.platformConnectHint}>
                          {isInstagramViaFB ? "Connects via Facebook" : "Not connected"}
                        </div>
                      )}
                    </div>
                    <div className={styles.platformConnectAction}>
                      {isConnected ? (
                        <div className={styles.connectedActions}>
                          <span className={styles.connectedDot} />
                          <span className={styles.connectedLabel}>Connected</span>
                          <button
                            className={styles.disconnectBtn}
                            onClick={() => handleDisconnect(platform)}
                            disabled={disconnecting === platform}
                          >
                            {disconnecting === platform ? "..." : "Disconnect"}
                          </button>
                        </div>
                      ) : (
                        <button
                          className={styles.connectBtn}
                          style={{ background: PLATFORM_COLORS[platform] }}
                          onClick={() => handleConnect(platform)}
                        >
                          Connect
                        </button>
                      )}
                    </div>
                  </div>
                  {isConnected && account.token_expires_at && (
                    <div className={styles.tokenExpiry}>
                      Token expires {new Date(account.token_expires_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Generating banner */}
        {(generating || regeneratingSelected) && (
          <div className={styles.generatingBanner}>
            <div className={styles.generatingSpinner} />
            <div>
              <div className={styles.generatingTitle}>
                {regeneratingSelected ? `Rewriting ${selected.size} selected post${selected.size !== 1 ? "s" : ""}...` : "Writing your social content..."}
              </div>
              <div className={styles.generatingDesc}>
                {regeneratingSelected ? "Claude is rewriting only the posts you selected." : "Claude is generating 30 days of posts for Facebook, Instagram, and TikTok."}
              </div>
            </div>
          </div>
        )}

        {!loading && posts.length === 0 && !generating && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📱</div>
            <h2>No posts yet</h2>
            <p>Click "Generate Posts" to create a full month of content for Facebook, Instagram, and TikTok.</p>
          </div>
        )}

        {posts.length > 0 && (
          <>
            <div className={styles.platformSummary}>
              {(["facebook", "instagram", "tiktok"] as const).map(p => (
                <div key={p} className={styles.platformCard} style={{ borderTop: `3px solid ${PLATFORM_COLORS[p]}` }}>
                  <div className={styles.platformName} style={{ color: PLATFORM_COLORS[p] }}>{p}</div>
                  <div className={styles.platformCount}>{counts[p]} posts</div>
                  <div className={styles.platformApproved}>
                    {posts.filter(post => post.platform === p && post.status === "scheduled").length} approved
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap" as const, gap: "12px" }}>
              <div className={styles.filterTabs}>
                {(["all", "facebook", "instagram", "tiktok"] as const).map(tab => (
                  <button
                    key={tab}
                    className={`${styles.filterTab} ${filter === tab ? styles.filterTabActive : ""}`}
                    onClick={() => setFilter(tab)}
                    style={filter === tab && tab !== "all" ? { borderColor: PLATFORM_COLORS[tab as keyof typeof PLATFORM_COLORS], color: PLATFORM_COLORS[tab as keyof typeof PLATFORM_COLORS] } : {}}
                  >
                    {tab === "all" ? `All (${posts.length})` : `${tab} (${counts[tab as keyof typeof counts]})`}
                  </button>
                ))}
              </div>
              {selectMode && (
                <button className={styles.selectAllBtn} onClick={toggleSelectAll}>
                  {selected.size === filtered.length ? "Deselect All" : `Select All (${filtered.length})`}
                </button>
              )}
            </div>

            {selectMode && (
              <div className={styles.selectionHint}>
                {selected.size === 0 ? "Tap the posts you want to regenerate" : `${selected.size} post${selected.size !== 1 ? "s" : ""} selected — hit Regenerate to rewrite them`}
              </div>
            )}

            <div className={styles.postsGrid}>
              {filtered.map(post => (
                <div
                  key={post.id}
                  className={`${styles.postCard} ${post.status === "scheduled" ? styles.approved : ""} ${selected.has(post.id) ? styles.postCardSelected : ""}`}
                  onClick={selectMode ? () => toggleSelect(post.id) : undefined}
                  style={selectMode ? { cursor: "pointer" } : {}}
                >
                  {selectMode && (
                    <div className={styles.checkboxWrap} onClick={e => { e.stopPropagation(); toggleSelect(post.id); }}>
                      <div className={`${styles.checkbox} ${selected.has(post.id) ? styles.checkboxChecked : ""}`}>
                        {selected.has(post.id) && "✓"}
                      </div>
                    </div>
                  )}

                  {post.image_url && (
                    <div className={styles.postImage} style={{
                      aspectRatio: post.platform === "tiktok" ? "9/16" : post.platform === "instagram" ? "1/1" : "16/9",
                      maxHeight: post.platform === "tiktok" ? "320px" : post.platform === "instagram" ? "280px" : "200px",
                    }}>
                      <img src={post.image_url} alt="Post visual" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      <div className={styles.platformBadge} style={{ background: PLATFORM_COLORS[post.platform] }}>{post.platform}</div>
                      {post.status === "scheduled" && <div className={styles.approvedBadge}>✓ Approved</div>}
                    </div>
                  )}

                  <div className={styles.postBody}>
                    {editingId === post.id ? (
                      <div className={styles.editWrap}>
                        <textarea className={styles.editTextarea} value={editCaption} onChange={e => setEditCaption(e.target.value)} rows={5} autoFocus onClick={e => e.stopPropagation()} />
                        <div className={styles.editActions}>
                          <button className={styles.cancelBtn} onClick={e => { e.stopPropagation(); setEditingId(null); }}>Cancel</button>
                          <button className={styles.saveBtn} onClick={e => { e.stopPropagation(); handleSaveEdit(post.id); }}>Save</button>
                        </div>
                      </div>
                    ) : (
                      <p className={styles.postCaption}>{post.caption}</p>
                    )}
                    <div className={styles.postMeta}>
                      <span className={styles.postDate}>📅 {new Date(post.scheduled_for).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                    </div>
                  </div>

                  {!selectMode && (
                    <div className={styles.postActions}>
                      {post.status !== "scheduled" ? (
                        <button className={styles.approveBtn} onClick={() => handleApprove(post.id)}>✓ Approve</button>
                      ) : (
                        <button className={styles.approvedBtn} disabled>✓ Approved</button>
                      )}
                      <button className={styles.editBtn} onClick={() => { setEditingId(post.id); setEditCaption(post.caption); }}>✏️ Edit</button>
                      <button className={styles.deleteBtn} onClick={() => handleDelete(post.id)}>🗑</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      <MobileNav />
    </div>
  );
}

export default function SocialPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#f8f9fa" }} />}>
      <SocialPageInner />
    </Suspense>
  );
}
