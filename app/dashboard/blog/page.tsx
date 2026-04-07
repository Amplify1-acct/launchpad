"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import styles from "../dashboard.module.css";
import MobileNav from "@/components/MobileNav";

type BlogPost = {
  id: string;
  title: string;
  content: string | null;
  featured_image_url: string | null;
  status: string;
  word_count: number | null;
  created_at: string;
  approved_at: string | null;
  rejected_at: string | null;
};

export default function BlogPage() {
  const router = useRouter();
  const supabase = createClient();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<BlogPost | null>(null);
  const [approving, setApproving] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [business, setBusiness] = useState<any>(null);
  const [plan, setPlan] = useState("starter");
  const [filter, setFilter] = useState<"all" | "pending" | "published" | "rejected">("all");
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { data: customer } = await supabase
      .from("customers").select("id").eq("user_id", user.id).single();
    if (!customer) { router.push("/onboarding"); return; }

    const { data: biz } = await supabase
      .from("businesses").select("*").eq("customer_id", customer.id).single();
    if (!biz) { router.push("/onboarding"); return; }
    setBusiness(biz);

    const { data: sub } = await supabase
      .from("subscriptions").select("plan").eq("customer_id", customer.id).single();
    if (sub?.plan) setPlan(sub.plan);

    const { data: blogPosts } = await supabase
      .from("blog_posts").select("*").eq("business_id", biz.id)
      .order("created_at", { ascending: false });

    setPosts(blogPosts || []);
    setLoading(false);
  }

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  async function approve(post: BlogPost) {
    setApproving(post.id);
    await supabase.from("blog_posts").update({
      status: "published",
      approved_at: new Date().toISOString(),
    }).eq("id", post.id);
    setPosts(ps => ps.map(p => p.id === post.id ? { ...p, status: "published", approved_at: new Date().toISOString() } : p));
    if (selected?.id === post.id) setSelected({ ...post, status: "published" });
    setApproving(null);
    showToast("Post approved and published ✓");
  }

  async function reject(post: BlogPost) {
    setRejecting(post.id);
    await supabase.from("blog_posts").update({
      status: "rejected",
      rejected_at: new Date().toISOString(),
    }).eq("id", post.id);
    setPosts(ps => ps.map(p => p.id === post.id ? { ...p, status: "rejected" } : p));
    if (selected?.id === post.id) setSelected({ ...post, status: "rejected" });
    setRejecting(null);
    showToast("Post rejected", false);
  }

  const filtered = posts.filter(p => filter === "all" ? true : p.status === filter || (p.status === "draft"));
  const pending = posts.filter(p => p.status === "draft").length;
  const published = posts.filter(p => p.status === "published").length;

  const blogFreq: Record<string, string> = { starter: "2/month", pro: "4/month", premium: "8/month" };

  function statusBadge(status: string) {
    if (status === "published") return { bg: "#dcfce7", color: "#166534", label: "Published" };
    if (status === "rejected")  return { bg: "#fee2e2", color: "#991b1b", label: "Rejected" };
    return { bg: "#fef3c7", color: "#92400e", label: "Awaiting review" };
  }

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}><a href="/">Ex<span>sisto</span></a></div>
        <nav className={styles.nav}>
          <a href="/dashboard" className={styles.navItem}><span>⚡</span> Overview</a>
          <a href="/dashboard/website" className={styles.navItem}><span>🌐</span> Website</a>
          <a href="/dashboard/blog" className={`${styles.navItem} ${styles.active}`}>
            <span>✍️</span> Blog Posts
            {pending > 0 && <span className={styles.navBadge}>{pending}</span>}
          </a>
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
            <h1 className={styles.greeting}>Blog Posts</h1>
            <p className={styles.subGreeting}>
              {blogFreq[plan] || "2/month"} · {published} published · {pending} awaiting review
            </p>
          </div>
        </div>

        {/* Pending banner */}
        {pending > 0 && (
          <div className={styles.alertBanner}>
            <div className={styles.alertDot} />
            <div className={styles.alertText}>
              {pending} post{pending > 1 ? "s are" : " is"} ready for your review — approve to publish to your site
            </div>
          </div>
        )}

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
          {(["all", "pending", "published", "rejected"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: "7px 16px", borderRadius: "100px", fontSize: "12px", fontWeight: 600,
              border: filter === f ? "none" : "1px solid #ede9f8",
              background: filter === f ? "#4648d4" : "#fff",
              color: filter === f ? "#fff" : "#6b6b8a",
              cursor: "pointer", fontFamily: "inherit",
            }}>
              {f === "all" ? `All (${posts.length})` :
               f === "pending" ? `To review (${pending})` :
               f === "published" ? `Published (${published})` :
               `Rejected (${posts.filter(p => p.status === "rejected").length})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px", color: "#9090a8" }}>
            <div style={{ width: "32px", height: "32px", border: "3px solid #ede9f8", borderTopColor: "#4648d4", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
            Loading your posts…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ background: "#fff", border: "1px solid #ede9f8", borderRadius: "14px", padding: "56px", textAlign: "center" }}>
            <div style={{ fontSize: "32px", marginBottom: "16px" }}>✍️</div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "#1b1b25", marginBottom: "8px" }}>
              {filter === "all" ? "No blog posts yet" : `No ${filter} posts`}
            </div>
            <div style={{ fontSize: "13px", color: "#9090a8" }}>
              {filter === "all" ? "Your first posts are being written — check back soon." : `You have no ${filter} posts right now.`}
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 1fr" : "1fr", gap: "16px", alignItems: "start" }}>

            {/* Post list */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {filtered.map(post => {
                const badge = statusBadge(post.status);
                const isActive = selected?.id === post.id;
                return (
                  <div key={post.id} onClick={() => setSelected(isActive ? null : post)} style={{
                    background: "#fff",
                    border: `1px solid ${isActive ? "#4648d4" : "#ede9f8"}`,
                    borderRadius: "12px",
                    padding: "18px 20px",
                    cursor: "pointer",
                    transition: "border-color 0.15s",
                    boxShadow: isActive ? "0 0 0 3px rgba(70,72,212,0.1)" : "none",
                  }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                      {/* Status dot */}
                      <div style={{
                        width: "8px", height: "8px", borderRadius: "50%", flexShrink: 0, marginTop: "6px",
                        background: post.status === "published" ? "#16a34a" : post.status === "rejected" ? "#dc2626" : "#f59e0b",
                      }} />

                      <div style={{ flex: 1, minWidth: 0, display: "flex", gap: "12px", alignItems: "center" }}>
                        {post.featured_image_url && (
                          <img src={post.featured_image_url} alt="" style={{ width: "56px", height: "56px", borderRadius: "8px", objectFit: "cover", flexShrink: 0 }} />
                        )}
                        <div>
                          <div style={{ fontSize: "14px", fontWeight: 700, color: "#1b1b25", marginBottom: "4px", lineHeight: 1.4 }}>
                            {post.title || "Untitled post"}
                          </div>
                          <div style={{ fontSize: "11px", color: "#9090a8", display: "flex", gap: "10px", flexWrap: "wrap" }}>
                            <span>{new Date(post.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                            {post.word_count && <span>~{post.word_count} words</span>}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                        <span style={{
                          background: badge.bg, color: badge.color,
                          fontSize: "10px", fontWeight: 700,
                          padding: "3px 10px", borderRadius: "100px",
                        }}>{badge.label}</span>

                        {(post.status === "draft") && (
                          <button onClick={e => { e.stopPropagation(); approve(post); }} disabled={approving === post.id} style={{
                            background: "#4648d4", color: "#fff",
                            border: "none", borderRadius: "6px",
                            padding: "5px 12px", fontSize: "11px", fontWeight: 700,
                            cursor: "pointer", fontFamily: "inherit",
                            opacity: approving === post.id ? 0.6 : 1,
                          }}>
                            {approving === post.id ? "…" : "Approve"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Post reader panel */}
            {selected && (
              <div style={{
                background: "#fff", border: "1px solid #ede9f8", borderRadius: "14px",
                overflow: "hidden", position: "sticky", top: "24px",
              }}>
                {/* Panel header */}
                <div style={{
                  padding: "16px 20px", borderBottom: "1px solid #ede9f8",
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px",
                }}>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#1b1b25", flex: 1, minWidth: 0 }}>
                    {selected.title}
                  </div>
                  <button onClick={() => setSelected(null)} style={{
                    background: "none", border: "none", color: "#9090a8",
                    fontSize: "18px", cursor: "pointer", flexShrink: 0, padding: "0 4px",
                  }}>✕</button>
                </div>

                {/* Post body */}
                <div style={{ padding: "20px", maxHeight: "60vh", overflowY: "auto" }}>
                  {selected.featured_image_url && (
                    <img src={selected.featured_image_url} alt="" style={{ width: "100%", height: "200px", objectFit: "cover", borderRadius: "8px", marginBottom: "16px", display: "block" }} />
                  )}
                  {selected.content ? (
                    <div style={{ fontSize: "14px", color: "#1b1b25", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
                      {selected.content}
                    </div>
                  ) : (
                    <div style={{ textAlign: "center", padding: "40px", color: "#9090a8" }}>
                      <div style={{ fontSize: "24px", marginBottom: "12px" }}>📄</div>
                      <div style={{ fontSize: "13px" }}>Full post content not available yet.</div>
                      <div style={{ fontSize: "11px", marginTop: "6px" }}>The post will be visible once generated.</div>
                    </div>
                  )}
                </div>

                {/* Action footer */}
                {(selected.status === "draft") && (
                  <div style={{
                    padding: "16px 20px", borderTop: "1px solid #ede9f8",
                    display: "flex", gap: "10px",
                  }}>
                    <button onClick={() => reject(selected)} disabled={rejecting === selected.id} style={{
                      flex: 1, padding: "10px", borderRadius: "8px",
                      border: "1px solid #ede9f8", background: "#fff",
                      color: "#dc2626", fontSize: "13px", fontWeight: 600,
                      cursor: "pointer", fontFamily: "inherit",
                      opacity: rejecting === selected.id ? 0.6 : 1,
                    }}>
                      {rejecting === selected.id ? "Rejecting…" : "✕ Reject"}
                    </button>
                    <button onClick={() => approve(selected)} disabled={approving === selected.id} style={{
                      flex: 2, padding: "10px", borderRadius: "8px",
                      border: "none", background: "#4648d4",
                      color: "#fff", fontSize: "13px", fontWeight: 700,
                      cursor: "pointer", fontFamily: "inherit",
                      opacity: approving === selected.id ? 0.6 : 1,
                    }}>
                      {approving === selected.id ? "Approving…" : "✓ Approve & Publish"}
                    </button>
                  </div>
                )}

                {selected.status === "published" && (
                  <div style={{ padding: "16px 20px", borderTop: "1px solid #ede9f8", textAlign: "center" }}>
                    <div style={{ fontSize: "12px", color: "#16a34a", fontWeight: 600 }}>
                      ✓ Published · {selected.approved_at ? new Date(selected.approved_at).toLocaleDateString() : ""}
                    </div>
                  </div>
                )}

                {selected.status === "rejected" && (
                  <div style={{ padding: "16px 20px", borderTop: "1px solid #ede9f8", display: "flex", gap: "10px" }}>
                    <button onClick={() => approve(selected)} style={{
                      flex: 1, padding: "10px", borderRadius: "8px",
                      border: "none", background: "#4648d4",
                      color: "#fff", fontSize: "13px", fontWeight: 700,
                      cursor: "pointer", fontFamily: "inherit",
                    }}>
                      Approve instead →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      <MobileNav />

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)",
          background: toast.ok ? "#1b1b25" : "#dc2626",
          color: "#fff", padding: "12px 24px", borderRadius: "100px",
          fontSize: "13px", fontWeight: 600, zIndex: 999,
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        }}>
          {toast.msg}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
      `}</style>
    </div>
  );
}
