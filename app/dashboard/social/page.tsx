"use client";

import { useState, useEffect, useCallback } from "react";

type Platform = "facebook" | "instagram" | "linkedin";
type PostStatus = "queued" | "scheduled" | "posted" | "failed";

interface SocialPost {
  id: string;
  platform: Platform;
  caption: string;
  image_url?: string;
  status: PostStatus;
  scheduled_for?: string;
  posted_at?: string;
}

interface Business {
  id: string;
  name: string;
  industry: string;
  city: string;
  state: string;
}

const PLATFORM_CONFIG = {
  facebook: { label: "Facebook", color: "#1877f2", icon: "f", bg: "#e7f0fd" },
  instagram: { label: "Instagram", color: "#e1306c", icon: "ig", bg: "#fce4ec" },
  linkedin: { label: "LinkedIn", color: "#0a66c2", icon: "in", bg: "#e3f0fb" },
};

const STATUS_CONFIG = {
  queued:    { label: "Queued",    color: "#d97706", bg: "#fef3c7" },
  scheduled: { label: "Scheduled", color: "#2563eb", bg: "#eff6ff" },
  posted:    { label: "Posted",    color: "#16a34a", bg: "#dcfce7" },
  failed:    { label: "Failed",    color: "#dc2626", bg: "#fee2e2" },
};

function formatDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function PostCard({
  post,
  onUpdate,
  onDelete,
}: {
  post: SocialPost;
  onUpdate: (id: string, updates: Partial<SocialPost>) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [caption, setCaption] = useState(post.caption);
  const [saving, setSaving] = useState(false);
  const pc = PLATFORM_CONFIG[post.platform];
  const sc = STATUS_CONFIG[post.status];

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/social-posts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: post.id, caption }),
      });
      if (res.ok) {
        onUpdate(post.id, { caption });
        setEditing(false);
      }
    } finally {
      setSaving(false);
    }
  }

  async function approve() {
    const res = await fetch("/api/social-posts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: post.id, status: "scheduled" }),
    });
    if (res.ok) onUpdate(post.id, { status: "scheduled" });
  }

  async function remove() {
    const res = await fetch(`/api/social-posts?id=${post.id}`, { method: "DELETE" });
    if (res.ok) onDelete(post.id);
  }

  return (
    <div style={{
      background: "#fff",
      border: "1px solid #e4e4e0",
      borderRadius: 8,
      overflow: "hidden",
      transition: "box-shadow 0.2s",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0.75rem 1rem",
        borderBottom: "1px solid #f0f0ee",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 6,
            background: pc.color, color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "0.65rem", fontWeight: 800, letterSpacing: "-0.02em",
          }}>
            {pc.icon}
          </div>
          <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#111" }}>{pc.label}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            fontSize: "0.7rem", fontWeight: 600, padding: "2px 8px", borderRadius: 999,
            background: sc.bg, color: sc.color,
          }}>{sc.label}</span>
          <span style={{ fontSize: "0.72rem", color: "#aaa" }}>{formatDate(post.scheduled_for)}</span>
        </div>
      </div>

      {/* Caption */}
      <div style={{ padding: "1rem" }}>
        {editing ? (
          <textarea
            value={caption}
            onChange={e => setCaption(e.target.value)}
            style={{
              width: "100%", minHeight: 100, padding: "0.6rem", resize: "vertical",
              border: "1px solid #111", borderRadius: 4, fontSize: "0.875rem",
              fontFamily: "inherit", lineHeight: 1.6, outline: "none",
            }}
            autoFocus
          />
        ) : (
          <p style={{ fontSize: "0.875rem", color: "#333", lineHeight: 1.65, margin: 0 }}>
            {post.caption}
          </p>
        )}
      </div>

      {/* Actions */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0.65rem 1rem",
        borderTop: "1px solid #f0f0ee",
        background: "#fafaf8",
      }}>
        <div style={{ display: "flex", gap: 6 }}>
          {editing ? (
            <>
              <button onClick={save} disabled={saving} style={btnStyle("#111", "#fff")}>
                {saving ? "Saving..." : "Save"}
              </button>
              <button onClick={() => { setEditing(false); setCaption(post.caption); }} style={btnStyle("#f0f0ee", "#555")}>
                Cancel
              </button>
            </>
          ) : (
            <>
              {post.status === "queued" && (
                <button onClick={approve} style={btnStyle("#16a34a", "#fff")}>
                  ✓ Approve
                </button>
              )}
              <button onClick={() => setEditing(true)} style={btnStyle("#f0f0ee", "#555")}>
                Edit
              </button>
            </>
          )}
        </div>
        <button onClick={remove} style={{
          background: "none", border: "none", color: "#ccc",
          cursor: "pointer", fontSize: "1rem", lineHeight: 1, padding: "2px 4px",
        }} title="Delete post">×</button>
      </div>
    </div>
  );
}

function btnStyle(bg: string, color: string): React.CSSProperties {
  return {
    background: bg, color, border: "none", borderRadius: 4,
    padding: "5px 12px", fontSize: "0.75rem", fontWeight: 600,
    cursor: "pointer", fontFamily: "inherit",
  };
}

export default function SocialPage() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [business, setBusiness] = useState<Business | null>(null);
  const [activePlatform, setActivePlatform] = useState<Platform | "all">("all");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/social-posts/list");
      const data = await res.json();
      if (data.posts) setPosts(data.posts);
      if (data.business) setBusiness(data.business);
    } catch (e) {
      setError("Failed to load posts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function generate() {
    if (!business) return;
    setGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/generate-social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_id: business.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await load();
    } catch (e: any) {
      setError(e.message || "Generation failed");
    } finally {
      setGenerating(false);
    }
  }

  function updatePost(id: string, updates: Partial<SocialPost>) {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }

  function deletePost(id: string) {
    setPosts(prev => prev.filter(p => p.id !== id));
  }

  const platforms: Platform[] = ["facebook", "instagram", "linkedin"];
  const filtered = activePlatform === "all" ? posts : posts.filter(p => p.platform === activePlatform);
  const counts = {
    all: posts.length,
    facebook: posts.filter(p => p.platform === "facebook").length,
    instagram: posts.filter(p => p.platform === "instagram").length,
    linkedin: posts.filter(p => p.platform === "linkedin").length,
  };
  const pendingApproval = posts.filter(p => p.status === "queued").length;

  return (
    <div style={{ padding: "2rem", maxWidth: 900, margin: "0 auto", fontFamily: "system-ui, sans-serif" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#111", marginBottom: 4 }}>
            Social Media
          </h1>
          <p style={{ fontSize: "0.875rem", color: "#888" }}>
            {business ? `${business.name} · ${business.city}, ${business.state}` : "Loading..."}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {posts.length > 0 && (
            <button onClick={generate} disabled={generating} style={{
              ...btnStyle("#f0f0ee", "#555"),
              padding: "8px 16px", fontSize: "0.82rem",
            }}>
              {generating ? "Generating..." : "↺ Regenerate"}
            </button>
          )}
          <button onClick={generate} disabled={generating || !business} style={{
            ...btnStyle("#111", "#fff"),
            padding: "8px 18px", fontSize: "0.85rem",
            opacity: generating || !business ? 0.5 : 1,
          }}>
            {generating ? "Writing posts..." : posts.length === 0 ? "✦ Generate Posts" : "Generate New Month"}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 6, padding: "0.75rem 1rem", marginBottom: "1.5rem", fontSize: "0.85rem", color: "#dc2626" }}>
          {error}
        </div>
      )}

      {/* Connect accounts banner */}
      <div style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)",
        borderRadius: 10, padding: "1.5rem",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: "2rem", gap: "1rem",
      }}>
        <div>
          <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#fff", marginBottom: 4 }}>
            Connect your social accounts to start posting
          </div>
          <div style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>
            Once connected, approved posts go out automatically on schedule.
            Takes about 2 minutes.
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          {platforms.map(p => {
            const pc = PLATFORM_CONFIG[p];
            return (
              <button key={p} style={{
                background: pc.color, color: "#fff", border: "none",
                borderRadius: 6, padding: "8px 14px",
                fontSize: "0.78rem", fontWeight: 700, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6,
              }}>
                <span style={{ fontWeight: 800, fontSize: "0.7rem" }}>{pc.icon}</span>
                Connect {pc.label}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem", color: "#aaa" }}>
          Loading your posts...
        </div>
      ) : posts.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "4rem 2rem",
          border: "2px dashed #e4e4e0", borderRadius: 10,
        }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>📱</div>
          <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#333", marginBottom: 8 }}>
            No posts yet
          </div>
          <div style={{ fontSize: "0.875rem", color: "#888", marginBottom: "1.5rem", maxWidth: 360, margin: "0 auto 1.5rem" }}>
            Generate a month of posts for Facebook, Instagram, and LinkedIn — written specifically for {business?.name || "your business"}.
          </div>
          <button onClick={generate} disabled={generating} style={{
            ...btnStyle("#111", "#fff"),
            padding: "10px 24px", fontSize: "0.9rem",
          }}>
            {generating ? "Writing posts..." : "✦ Generate My Posts"}
          </button>
        </div>
      ) : (
        <>
          {/* Stats bar */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: "1.5rem" }}>
            {[
              { label: "Total posts", value: posts.length, color: "#111" },
              { label: "Needs approval", value: pendingApproval, color: "#d97706" },
              { label: "Scheduled", value: posts.filter(p => p.status === "scheduled").length, color: "#2563eb" },
              { label: "Posted", value: posts.filter(p => p.status === "posted").length, color: "#16a34a" },
            ].map(stat => (
              <div key={stat.label} style={{
                background: "#fff", border: "1px solid #e4e4e0",
                borderRadius: 8, padding: "1rem",
              }}>
                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: stat.color, lineHeight: 1 }}>{stat.value}</div>
                <div style={{ fontSize: "0.72rem", color: "#888", marginTop: 4, fontWeight: 500 }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Platform tabs */}
          <div style={{
            display: "flex", gap: 0,
            borderBottom: "1px solid #e4e4e0", marginBottom: "1.5rem",
          }}>
            {([["all", "All Platforms", "#111"] as const, ...platforms.map(p => [p, PLATFORM_CONFIG[p].label, PLATFORM_CONFIG[p].color] as const)]).map(([key, label, color]) => {
              const active = activePlatform === key;
              return (
                <button
                  key={key}
                  onClick={() => setActivePlatform(key as Platform | "all")}
                  style={{
                    padding: "0.65rem 1.25rem", border: "none", background: "none",
                    fontSize: "0.82rem", fontWeight: active ? 700 : 500,
                    color: active ? color : "#888", cursor: "pointer",
                    borderBottom: active ? `2px solid ${color}` : "2px solid transparent",
                    fontFamily: "inherit",
                  }}
                >
                  {label} <span style={{ fontSize: "0.72rem", color: active ? color : "#bbb" }}>({counts[key as keyof typeof counts]})</span>
                </button>
              );
            })}
          </div>

          {/* Pending approval banner */}
          {pendingApproval > 0 && (
            <div style={{
              background: "#fef9ec", border: "1px solid #fde68a",
              borderRadius: 8, padding: "0.75rem 1rem",
              marginBottom: "1.25rem",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div style={{ fontSize: "0.85rem", color: "#92400e", fontWeight: 600 }}>
                ⚠ {pendingApproval} post{pendingApproval > 1 ? "s" : ""} waiting for your approval
              </div>
              <button
                onClick={async () => {
                  const queued = posts.filter(p => p.status === "queued");
                  await Promise.all(queued.map(p =>
                    fetch("/api/social-posts", {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ id: p.id, status: "scheduled" }),
                    })
                  ));
                  setPosts(prev => prev.map(p => p.status === "queued" ? { ...p, status: "scheduled" } : p));
                }}
                style={{ ...btnStyle("#d97706", "#fff"), padding: "5px 14px", fontSize: "0.78rem" }}
              >
                Approve all
              </button>
            </div>
          )}

          {/* Post grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {filtered.map(post => (
              <PostCard
                key={post.id}
                post={post}
                onUpdate={updatePost}
                onDelete={deletePost}
              />
            ))}
          </div>

          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "3rem", color: "#aaa" }}>
              No {activePlatform} posts yet.
            </div>
          )}
        </>
      )}
    </div>
  );
}
