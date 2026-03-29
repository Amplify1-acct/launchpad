"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import styles from "./social.module.css";

type Platform = "all" | "facebook" | "instagram" | "linkedin";
type Post = {
  id: string;
  platform: "facebook" | "instagram" | "linkedin";
  caption: string;
  image_url: string | null;
  post_type: string;
  status: string;
  scheduled_for: string;
};

const PLATFORM_COLORS = {
  facebook: "#1877f2",
  instagram: "#e1306c",
  linkedin: "#0a66c2",
};

const PLATFORM_ICONS = {
  facebook: "f",
  instagram: "📸",
  linkedin: "in",
};

export default function SocialPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [filter, setFilter] = useState<Platform>("all");
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCaption, setEditCaption] = useState("");
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
        .from("social_posts")
        .select("*")
        .eq("business_id", business.id)
        .order("scheduled_for", { ascending: true });

      setPosts(socialPosts || []);
      setLoading(false);
    }
    load();
  }, []);

  async function handleGenerate() {
    if (!businessId) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/generate-social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_id: businessId }),
      });
      if (res.ok) {
        // Reload posts
        const { data } = await supabase
          .from("social_posts").select("*").eq("business_id", businessId)
          .order("scheduled_for", { ascending: true });
        setPosts(data || []);
      }
    } finally {
      setGenerating(false);
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

  const filtered = filter === "all" ? posts : posts.filter(p => p.platform === filter);
  const counts = {
    facebook: posts.filter(p => p.platform === "facebook").length,
    instagram: posts.filter(p => p.platform === "instagram").length,
    linkedin: posts.filter(p => p.platform === "linkedin").length,
  };

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
                ? `${posts.length} posts ready · ${posts.filter(p => p.status === "scheduled").length} approved`
                : "Generate your 30-day content calendar"}
            </p>
          </div>
          <button
            className={styles.generateBtn}
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? (
              <><span className={styles.spinner} /> Generating...</>
            ) : posts.length > 0 ? (
              "↺ Regenerate"
            ) : (
              "✨ Generate Posts"
            )}
          </button>
        </div>

        {generating && (
          <div className={styles.generatingBanner}>
            <div className={styles.generatingSpinner} />
            <div>
              <div className={styles.generatingTitle}>Writing your social content...</div>
              <div className={styles.generatingDesc}>Claude is generating {posts.length > 0 ? "new" : "30 days of"} posts for Facebook, Instagram, and LinkedIn using your brand and services. Takes about 30 seconds.</div>
            </div>
          </div>
        )}

        {!loading && posts.length === 0 && !generating && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📱</div>
            <h2>No posts yet</h2>
            <p>Click "Generate Posts" and we'll write a full month of content for Facebook, Instagram, and LinkedIn — all tailored to your business and brand.</p>
          </div>
        )}

        {posts.length > 0 && (
          <>
            {/* Platform summary */}
            <div className={styles.platformSummary}>
              {(["facebook", "instagram", "linkedin"] as const).map(p => (
                <div key={p} className={styles.platformCard} style={{ borderTop: `3px solid ${PLATFORM_COLORS[p]}` }}>
                  <div className={styles.platformName} style={{ color: PLATFORM_COLORS[p] }}>{p}</div>
                  <div className={styles.platformCount}>{counts[p]} posts</div>
                  <div className={styles.platformApproved}>
                    {posts.filter(post => post.platform === p && post.status === "scheduled").length} approved
                  </div>
                </div>
              ))}
            </div>

            {/* Filter tabs */}
            <div className={styles.filterTabs}>
              {(["all", "facebook", "instagram", "linkedin"] as const).map(tab => (
                <button
                  key={tab}
                  className={`${styles.filterTab} ${filter === tab ? styles.filterTabActive : ""}`}
                  onClick={() => setFilter(tab)}
                  style={filter === tab && tab !== "all" ? { borderColor: PLATFORM_COLORS[tab], color: PLATFORM_COLORS[tab] } : {}}
                >
                  {tab === "all" ? `All (${posts.length})` : `${tab} (${counts[tab]})`}
                </button>
              ))}
            </div>

            {/* Posts grid */}
            <div className={styles.postsGrid}>
              {filtered.map(post => (
                <div key={post.id} className={`${styles.postCard} ${post.status === "scheduled" ? styles.approved : ""}`}>
                  {/* Image */}
                  {post.image_url && (
                    <div className={styles.postImage}>
                      <img
                        src={post.image_url}
                        alt="Post visual"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                      <div className={styles.platformBadge} style={{ background: PLATFORM_COLORS[post.platform] }}>
                        {post.platform}
                      </div>
                      {post.status === "scheduled" && (
                        <div className={styles.approvedBadge}>✓ Approved</div>
                      )}
                    </div>
                  )}

                  {/* Caption */}
                  <div className={styles.postBody}>
                    {editingId === post.id ? (
                      <div className={styles.editWrap}>
                        <textarea
                          className={styles.editTextarea}
                          value={editCaption}
                          onChange={e => setEditCaption(e.target.value)}
                          rows={5}
                          autoFocus
                        />
                        <div className={styles.editActions}>
                          <button className={styles.cancelBtn} onClick={() => setEditingId(null)}>Cancel</button>
                          <button className={styles.saveBtn} onClick={() => handleSaveEdit(post.id)}>Save</button>
                        </div>
                      </div>
                    ) : (
                      <p className={styles.postCaption}>{post.caption}</p>
                    )}

                    <div className={styles.postMeta}>
                      <span className={styles.postDate}>
                        📅 {new Date(post.scheduled_for).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                      {post.post_type && (
                        <span className={styles.postType}>{post.post_type.replace(/_/g, " ")}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className={styles.postActions}>
                    {post.status !== "scheduled" ? (
                      <button className={styles.approveBtn} onClick={() => handleApprove(post.id)}>
                        ✓ Approve
                      </button>
                    ) : (
                      <button className={styles.approvedBtn} onClick={() => handleApprove(post.id)} disabled>
                        ✓ Approved
                      </button>
                    )}
                    <button
                      className={styles.editBtn}
                      onClick={() => { setEditingId(post.id); setEditCaption(post.caption); }}
                    >
                      ✏️ Edit
                    </button>
                    <button className={styles.deleteBtn} onClick={() => handleDelete(post.id)}>
                      🗑
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
