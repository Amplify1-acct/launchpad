"use client";

import { useState, useEffect, useCallback } from "react";
const ADMIN_SECRET = "exsisto-admin-2026";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.exsisto.ai";

type SiteStatus = "pending" | "building" | "admin_review" | "live" | "error" | string;

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  post_status: string;
  created_at: string;
}

interface Order {
  id: string;
  name: string;
  industry: string;
  city: string;
  state: string;
  phone: string;
  custom_domain: string | null;
  subdomain: string | null;
  website_url: string | null;
  created_at: string;
  customers: { id: string; email: string; plan: string; created_at: string; } | null;
  websites: { id: string; status: SiteStatus; template_id: string | null; vercel_url: string | null; custom_html: string | null; deployed_at: string | null; plan: string | null; } | null;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:      { label: "Pending build",   color: "#f59e0b" },
  building:     { label: "Building…",       color: "#6366f1" },
  admin_review: { label: "Ready for QA",    color: "#4648d4" },
  live:         { label: "Live",            color: "#16a34a" },
  error:        { label: "Error",           color: "#dc2626" },
};

const PLAN_IMAGES: Record<string, string> = { starter: "5 images", pro: "8 images", premium: "12 images" };
const PLAN_BLOGS:  Record<string, string> = { starter: "1 blog post", pro: "2 blog posts", premium: "4 blog posts" };

export default function AdminPage() {
  const [authed, setAuthed]       = useState(false);
  const [password, setPassword]   = useState("");
  const [pwError, setPwError]     = useState("");
  const [orders, setOrders]       = useState<Order[]>([]);
  const [loading, setLoading]     = useState(false);
  const [filter, setFilter]       = useState<string>("all");
  const [preview, setPreview]     = useState<Order | null>(null);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [editNotes, setEditNotes] = useState<Record<string, string>>({});
  const [actionStates, setActionStates] = useState<Record<string, string>>({});
  const [expandedPost, setExpandedPost] = useState<string | null>(null);

  function setAction(id: string, state: string) {
    setActionStates(s => ({ ...s, [id]: state }));
  }

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/orders", { headers: { "x-admin-secret": ADMIN_SECRET } });
    const data = await res.json();
    setOrders(data.businesses || []);
    setLoading(false);
  }, []);

  async function fetchBlogPosts(businessId: string) {
    const res = await fetch(`/api/admin/content?business_id=${businessId}`, {
      headers: { "x-admin-secret": ADMIN_SECRET },
    });
    const data = await res.json();
    setBlogPosts(data.posts || []);
  }

  useEffect(() => {
    if (authed) fetchOrders();
  }, [authed, fetchOrders]);

  useEffect(() => {
    if (preview) fetchBlogPosts(preview.id);
  }, [preview]);

  function login() {
    if (password === ADMIN_SECRET || password === "exsisto-admin-2026") {
      setAuthed(true);
    } else {
      setPwError("Incorrect password.");
    }
  }

  async function buildSite(businessId: string) {
    setAction(businessId, "building");
    const res = await fetch("/api/admin/build", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-secret": ADMIN_SECRET },
      body: JSON.stringify({ business_id: businessId }),
    });
    const data = await res.json();
    if (data.success) {
      setAction(businessId, "");
      fetchOrders();
      alert(`✅ Build started for ${data.message}\n\nThis takes 10-15 minutes. You\'ll get an email when it\'s ready for QA.`);
    } else {
      setAction(businessId, "error");
      alert(`Build failed: ${data.error}`);
    }
  }

  async function requestEdits(businessId: string) {
    const notes = editNotes[businessId];
    if (!notes?.trim()) {
      alert("Please enter your edit notes first.");
      return;
    }
    setAction(businessId, "rebuilding");
    const res = await fetch("/api/generate-site", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-internal-secret": "exsisto-internal-2026" },
      body: JSON.stringify({ business_id: businessId, revision_notes: notes }),
    });
    const data = await res.json();
    if (data.success) {
      setAction(businessId, "");
      setEditNotes(n => ({ ...n, [businessId]: "" }));
      fetchOrders();
      if (preview?.id === businessId) fetchBlogPosts(businessId);
      alert("✅ Edits applied. Review the updated site.");
    } else {
      setAction(businessId, "error");
      alert(`Edits failed: ${data.error}`);
    }
  }

  async function approveSite(businessId: string) {
    if (!confirm("Approve this site and push it live? The customer will receive their login link and DNS instructions.")) return;
    setAction(businessId, "approving");
    const res = await fetch("/api/admin/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-secret": ADMIN_SECRET },
      body: JSON.stringify({ business_id: businessId }),
    });
    const data = await res.json();
    if (data.success) {
      setAction(businessId, "");
      setPreview(null);
      fetchOrders();
    } else {
      setAction(businessId, "error");
      alert(`Approve failed: ${data.error}`);
    }
  }

  const filtered = filter === "all" ? orders : orders.filter(o => (o.websites?.status || "pending") === filter);
  const counts = {
    all:          orders.length,
    pending:      orders.filter(o => (o.websites?.status || "pending") === "pending").length,
    admin_review: orders.filter(o => o.websites?.status === "admin_review").length,
    live:         orders.filter(o => o.websites?.status === "live").length,
  };

  if (!authed) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8f7ff" }}>
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #ede9f8", padding: "40px", width: 360, textAlign: "center" }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#1b1b25", marginBottom: 6 }}>Ex<span style={{ color: "#4648d4" }}>sisto</span> Admin</div>
          <p style={{ color: "#9090a8", fontSize: 14, marginBottom: 24 }}>Matt only. Keep it that way.</p>
          <input
            type="password"
            placeholder="Admin password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && login()}
            style={{ width: "100%", padding: "12px 16px", border: "1px solid #dde2ff", borderRadius: 8, fontSize: 15, marginBottom: 12 }}
            autoFocus
          />
          {pwError && <div style={{ color: "#dc2626", fontSize: 13, marginBottom: 12 }}>{pwError}</div>}
          <button onClick={login} style={{ width: "100%", padding: "12px", background: "#4648d4", color: "#fff", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
            Sign in →
          </button>
        </div>
      </div>
    );
  }

  const s: Record<string, any> = {
    page: { minHeight: "100vh", background: "#f8f7ff", fontFamily: "system-ui, sans-serif" },
    header: { background: "#4648d4", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" },
    headerLogo: { fontSize: 20, fontWeight: 800, color: "#fff" },
    main: { maxWidth: 1200, margin: "0 auto", padding: "32px 24px" },
    filters: { display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" as const },
    filterBtn: (active: boolean) => ({ padding: "8px 16px", borderRadius: 100, border: "1px solid", borderColor: active ? "#4648d4" : "#dde2ff", background: active ? "#4648d4" : "#fff", color: active ? "#fff" : "#4648d4", fontSize: 13, fontWeight: 600, cursor: "pointer" }),
    card: { background: "#fff", borderRadius: 14, border: "1px solid #ede9f8", marginBottom: 16, overflow: "hidden" },
    cardHeader: { padding: "20px 24px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 },
    cardTitle: { fontSize: 18, fontWeight: 700, color: "#1b1b25", marginBottom: 4 },
    cardMeta: { fontSize: 13, color: "#9090a8" },
    statusBadge: (status: string) => ({
      display: "inline-block", padding: "4px 12px", borderRadius: 100, fontSize: 12, fontWeight: 700,
      background: (STATUS_LABELS[status]?.color || "#888") + "20",
      color: STATUS_LABELS[status]?.color || "#888",
    }),
    actions: { display: "flex", gap: 8, flexWrap: "wrap" as const, marginTop: 16 },
    btn: (color: string) => ({ padding: "10px 18px", borderRadius: 8, border: "none", background: color, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }),
    btnOutline: { padding: "10px 18px", borderRadius: 8, border: "1.5px solid #4648d4", background: "transparent", color: "#4648d4", fontSize: 14, fontWeight: 600, cursor: "pointer" },
    editArea: { padding: "0 24px 20px" },
    editLabel: { fontSize: 12, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "#9090a8", marginBottom: 6, display: "block" },
    editInput: { width: "100%", padding: "12px 16px", border: "1px solid #dde2ff", borderRadius: 8, fontSize: 14, minHeight: 80, resize: "vertical" as const, fontFamily: "system-ui, sans-serif" },
    planChip: { fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 100, background: "#f0f0ff", color: "#4648d4", marginLeft: 8 },
    blogSection: { padding: "0 24px 24px", borderTop: "1px solid #ede9f8", marginTop: 4 },
    blogPost: { border: "1px solid #ede9f8", borderRadius: 10, marginTop: 12, overflow: "hidden" },
    blogPostHeader: { padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", background: "#fafaff" },
    blogPostBody: { padding: "12px 16px", fontSize: 14, color: "#555", lineHeight: 1.7, borderTop: "1px solid #ede9f8" },
    previewPanel: { position: "fixed" as const, inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", flexDirection: "column" as const },
    previewHeader: { background: "#fff", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #ede9f8" },
    previewFrame: { flex: 1, border: "none", background: "#fff" },
  };

  return (
    <div style={s.page}>
      <header style={s.header}>
        <div style={s.headerLogo}>Ex<span style={{ color: "#a3a6ff" }}>sisto</span> Admin</div>
        <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>
          {counts.admin_review > 0 && <span style={{ background: "#ef4444", color: "#fff", borderRadius: 100, padding: "2px 10px", marginRight: 8, fontWeight: 700 }}>{counts.admin_review} needs QA</span>}
          {orders.length} total orders
        </div>
      </header>

      <div style={s.main}>
        {/* Filters */}
        <div style={s.filters}>
          {[["all","All",counts.all],["pending","Pending",counts.pending],["admin_review","Needs QA",counts.admin_review],["live","Live",counts.live]].map(([val,label,count]) => (
            <button key={val} style={s.filterBtn(filter === val)} onClick={() => setFilter(val as string)}>
              {label} {count > 0 && `(${count})`}
            </button>
          ))}
          <button onClick={fetchOrders} style={{ ...s.filterBtn(false), marginLeft: "auto" }}>↻ Refresh</button>
        </div>

        {loading && <p style={{ color: "#9090a8", textAlign: "center" }}>Loading orders…</p>}

        {filtered.map(order => {
          const status  = order.websites?.status || "pending";
          const plan    = order.customers?.plan || order.websites?.plan || "starter";
          const action  = actionStates[order.id] || "";
          const siteUrl = order.website_url || (order.subdomain ? `https://${order.subdomain}.exsisto.ai` : null);

          return (
            <div key={order.id} style={s.card}>
              <div style={s.cardHeader}>
                <div>
                  <div style={s.cardTitle}>
                    {order.name}
                    <span style={s.planChip}>{plan}</span>
                    <span style={{ ...s.planChip, background: "#f0fff4", color: "#16a34a" }}>{PLAN_IMAGES[plan]}</span>
                    <span style={{ ...s.planChip, background: "#fff7f0", color: "#ea580c" }}>{PLAN_BLOGS[plan]}</span>
                  </div>
                  <div style={s.cardMeta}>
                    {order.industry} · {order.city}, {order.state} · {order.customers?.email}
                    {order.custom_domain && <span> · 🌐 {order.custom_domain}</span>}
                  </div>
                  <div style={s.cardMeta}>Template: {order.websites?.template_id || "skeleton-clean"} · Ordered: {new Date(order.created_at).toLocaleDateString()}</div>
                </div>
                <span style={s.statusBadge(status)}>{STATUS_LABELS[status]?.label || status}</span>
              </div>

              {/* Actions */}
              <div style={{ ...s.actions, padding: "0 24px 16px" }}>
                {status === "pending" && (
                  <button style={s.btn("#4648d4")} onClick={() => buildSite(order.id)} disabled={action === "building"}>
                    {action === "building" ? "⏳ Building…" : "🏗️ Build Site"}
                  </button>
                )}
                {status === "building" && (
                  <div style={{ color: "#6366f1", fontSize: 14, fontWeight: 600, padding: "10px 0" }}>⏳ Building… check back in 10-15 min</div>
                )}
                {status === "admin_review" && (
                  <>
                    {siteUrl && (
                      <a href={siteUrl} target="_blank" style={s.btn("#1d4ed8")}>🔍 Preview Site</a>
                    )}
                    <button style={s.btn("#16a34a")} onClick={() => approveSite(order.id)} disabled={action === "approving"}>
                      {action === "approving" ? "⏳ Approving…" : "✅ Approve & Go Live"}
                    </button>
                    <button style={s.btn("#7c3aed")} onClick={() => setPreview(order)}>
                      📋 Review Blog Posts
                    </button>
                    <button style={s.btn("#dc2626")} onClick={() => buildSite(order.id)}>
                      🔄 Rebuild
                    </button>
                  </>
                )}
                {status === "live" && siteUrl && (
                  <a href={siteUrl} target="_blank" style={s.btn("#16a34a")}>🌐 View Live Site</a>
                )}
                {status === "error" && (
                  <button style={s.btn("#dc2626")} onClick={() => buildSite(order.id)}>🔄 Retry Build</button>
                )}
              </div>

              {/* Edit notes — only show for admin_review */}
              {status === "admin_review" && (
                <div style={s.editArea}>
                  <label style={s.editLabel}>Edit Notes — type changes, then click Request Edits</label>
                  <textarea
                    style={s.editInput}
                    placeholder="e.g. Make the headline punchier. Change service 3 to 'Emergency Repairs'. The about section is too generic — mention they've been in Springfield since 2006."
                    value={editNotes[order.id] || ""}
                    onChange={e => setEditNotes(n => ({ ...n, [order.id]: e.target.value }))}
                  />
                  <button
                    style={{ ...s.btn("#7c3aed"), marginTop: 8 }}
                    onClick={() => requestEdits(order.id)}
                    disabled={action === "rebuilding"}
                  >
                    {action === "rebuilding" ? "⏳ Applying edits…" : "✏️ Request Edits"}
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && !loading && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#9090a8" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
            <p>No orders in this status.</p>
          </div>
        )}
      </div>

      {/* Blog Post Review Panel */}
      {preview && (
        <div style={s.previewPanel}>
          <div style={s.previewHeader}>
            <div>
              <strong style={{ fontSize: 16 }}>{preview.name}</strong>
              <span style={{ fontSize: 13, color: "#9090a8", marginLeft: 12 }}>Blog Post Review</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={s.btn("#16a34a")} onClick={() => { approveSite(preview.id); setPreview(null); }}>
                ✅ Approve Everything & Go Live
              </button>
              <button onClick={() => setPreview(null)} style={{ ...s.btnOutline, borderColor: "#ddd", color: "#666" }}>
                Close ✕
              </button>
            </div>
          </div>

          <div style={{ flex: 1, overflow: "auto", background: "#f8f7ff", padding: 24 }}>
            <div style={{ maxWidth: 800, margin: "0 auto" }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: "#1b1b25" }}>
                Blog Posts ({blogPosts.length})
              </h2>

              {blogPosts.length === 0 && (
                <div style={{ background: "#fff", borderRadius: 12, padding: 32, textAlign: "center", color: "#9090a8" }}>
                  No blog posts found. They may still be generating.
                </div>
              )}

              {blogPosts.map(post => (
                <div key={post.id} style={s.blogPost}>
                  <div style={s.blogPostHeader} onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: "#1b1b25" }}>{post.title}</div>
                      <div style={{ fontSize: 12, color: "#9090a8", marginTop: 3 }}>{post.excerpt?.slice(0, 100)}…</div>
                    </div>
                    <span style={{ fontSize: 18, color: "#9090a8" }}>{expandedPost === post.id ? "▲" : "▼"}</span>
                  </div>
                  {expandedPost === post.id && (
                    <div style={s.blogPostBody}>
                      {post.content?.split("

").map((para: string, i: number) => (
                        <p key={i} style={{ marginBottom: 14 }}>{para}</p>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {preview.websites?.status === "admin_review" && (
                <div style={{ marginTop: 24 }}>
                  <label style={s.editLabel}>Edit Notes (applies to site + blog posts)</label>
                  <textarea
                    style={s.editInput}
                    placeholder="e.g. Blog post 2 is too generic. Make it more specific to Springfield. Also update the hero headline."
                    value={editNotes[preview.id] || ""}
                    onChange={e => setEditNotes(n => ({ ...n, [preview.id]: e.target.value }))}
                  />
                  <button
                    style={{ ...s.btn("#7c3aed"), marginTop: 8 }}
                    onClick={() => requestEdits(preview.id)}
                    disabled={actionStates[preview.id] === "rebuilding"}
                  >
                    {actionStates[preview.id] === "rebuilding" ? "⏳ Applying edits…" : "✏️ Request Edits"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
