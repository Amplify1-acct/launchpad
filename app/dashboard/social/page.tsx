"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
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

const PLATFORM_COLORS = {
  facebook: "#1877f2",
  instagram: "#e1306c",
  tiktok: "#010101",
};

export default function SocialPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [regeneratingSelected, setRegeneratingSelected] = useState(false);
  const [filter, setFilter] = useState<Platform>("all");
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCaption, setEditCaption] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: customer } = await supabase
        .from("customers").select("id").eq("user_id", user.id).single();
      if (!customer) return;
      const { data: business } = await supabase
        .from("businesses").select("id").eq("customer_id", customer.id).single();
      if (!business) return;
      setBusinessId(business.id);
      const { data: socialPosts } = await supabase
        .from("social_posts").select("*").eq("business_id", business.id)
        .order("scheduled_for", { ascending: true });
      setPosts(socialPosts || []);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = filter === "all" ? posts : posts.filter(p => p.platform === filter);
  const counts = {
    facebook: posts.filter(p => p.platform === "facebook").length,
    instagram: posts.filter(p => p.platform === "instagram").length,
    tiktok: posts.filter(p => p.platform === "tiktok").length,
  };

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(p => p.id)));
    }
  }

  function enterSelectMode() { setSelectMode(true); setSelected(new Set()); }
  function exitSelectMode() { setSelectMode(false); setSelected(new Set()); }

  async function reloadPosts() {
    if (!businessId) return;
    const { data } = await supabase
      .from("social_posts").select("*").eq("business_id", businessId)
      .order("scheduled_for", { ascending: true });
    setPosts(data || []);
  }

  async function handleGenerateAll() {
    if (!businessId) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/generate-social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_id: businessId }),
      });
      if (res.ok) await reloadPosts();
    } finally {
      setGenerating(false);
    }
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
      // Delete selected posts first
      await supabase.from("social_posts").delete().in("id", Array.from(selected));
      // Generate replacements
      const res = await fetch("/api/generate-social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_id: businessId,
          replace_only: true,
          platform_counts: platformCounts,
        }),
      });
      if (res.ok) {
        await reloadPosts();
        setSelected(new Set());
        setSelectMode(false);
      }
    } finally {
      setRegeneratingSelected(false);
    }
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
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Social Media</h1>
            <p className={styles.subtitle}>
              {posts.length > 0
                ? `${posts.length} posts · ${posts.filter(p => p.status === "scheduled").length} approved`
                : "Generate your 30-day content calendar"}
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" as const }}>
            {posts.length > 0 && !selectMode && (
              <button className={styles.selectModeBtn} onClick={enterSelectMode}>
                ☑ Select to Regenerate
              </button>
            )}
            {selectMode && (
              <>
                <button className={styles.cancelSelectBtn} onClick={exitSelectMode}>Cancel</button>
                <button
                  className={styles.regenSelectedBtn}
                  onClick={handleRegenerateSelected}
                  disabled={selected.size === 0 || regeneratingSelected}
                >
                  {regeneratingSelected ? "Regenerating..." : `↺ Regenerate${selected.size > 0 ? ` (${selected.size})` : ""}`}
                </button>
              </>
            )}
            <button
              className={styles.generateBtn}
              onClick={handleGenerateAll}
              disabled={generating || regeneratingSelected}
            >
              {generating ? "Generating..." : posts.length > 0 ? "↺ Regenerate All" : "✨ Generate Posts"}
            </button>
          </div>
        </div>

        {(generating || regeneratingSelected) && (
          <div className={styles.generatingBanner}>
            <div className={styles.generatingSpinner} />
            <div>
              <div className={styles.generatingTitle}>
                {regeneratingSelected ? `Rewriting ${selected.size} selected post${selected.size !== 1 ? "s" : ""}...` : "Writing your social content..."}
              </div>
              <div className={styles.generatingDesc}>
                {regeneratingSelected
                  ? "Claude is rewriting only the posts you selected. Everything else stays the same."
                  : "Claude is generating 30 days of posts for Facebook, Instagram, and TikTok."}
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
                {selected.size === 0
                  ? "Tap the posts you want to regenerate"
                  : `${selected.size} post${selected.size !== 1 ? "s" : ""} selected — hit Regenerate to rewrite them`}
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
                    <div className={styles.postImage}>
                      <img src={post.image_url} alt="Post visual" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      <div className={styles.platformBadge} style={{ background: PLATFORM_COLORS[post.platform] }}>{post.platform}</div>
                      {post.status === "scheduled" && <div className={styles.approvedBadge}>✓ Approved</div>}
                    </div>
                  )}

                  <div className={styles.postBody}>
                    {editingId === post.id ? (
                      <div className={styles.editWrap}>
                        <textarea
                          className={styles.editTextarea}
                          value={editCaption}
                          onChange={e => setEditCaption(e.target.value)}
                          rows={5}
                          autoFocus
                          onClick={e => e.stopPropagation()}
                        />
                        <div className={styles.editActions}>
                          <button className={styles.cancelBtn} onClick={e => { e.stopPropagation(); setEditingId(null); }}>Cancel</button>
                          <button className={styles.saveBtn} onClick={e => { e.stopPropagation(); handleSaveEdit(post.id); }}>Save</button>
                        </div>
                      </div>
                    ) : (
                      <p className={styles.postCaption}>{post.caption}</p>
                    )}
                    <div className={styles.postMeta}>
                      <span className={styles.postDate}>
                        📅 {new Date(post.scheduled_for).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
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

      {/* Mobile bottom nav */}
      <MobileNav />
    </div>
  );
}
