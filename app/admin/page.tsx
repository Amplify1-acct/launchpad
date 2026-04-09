"use client";

import { useState, useEffect, useCallback } from "react";
import styles from "./admin.module.css";

const ADMIN_SECRET = "exsisto-admin-2026"; // matches ADMIN_DASHBOARD_SECRET

type SiteStatus = "pending" | "building" | "admin_review" | "live" | "error" | string;

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
  customers: {
    id: string;
    email: string;
    plan: string;
    created_at: string;
  } | null;
  websites: {
    id: string;
    status: SiteStatus;
    template_id: string | null;
    vercel_url: string | null;
    custom_html: string | null;
    deployed_at: string | null;
    plan: string | null;
  } | null;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:      { label: "Pending build",    color: "#f59e0b" },
  building:     { label: "Building…",        color: "#6366f1" },
  admin_review: { label: "Ready to review",  color: "#4648d4" },
  live:         { label: "Live",             color: "#16a34a" },
  error:        { label: "Error",            color: "#dc2626" },
};

export default function AdminPage() {
  const [authed, setAuthed]   = useState(false);
  const [password, setPassword] = useState("");
  const [pwError, setPwError] = useState("");

  const [orders, setOrders]   = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter]   = useState<string>("all");
  // Per-order action states
  const [actionStates, setActionStates] = useState<Record<string, string>>({});

  function setAction(id: string, state: string) {
    setActionStates(s => ({ ...s, [id]: state }));
  }

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/orders", {
      headers: { "x-admin-secret": ADMIN_SECRET },
    });
    const data = await res.json();
    setOrders(data.businesses || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authed) fetchOrders();
  }, [authed, fetchOrders]);

  function login() {
    // Check against env var via a simple comparison — for a real app use a proper auth check
    if (password === ADMIN_SECRET || password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      setAuthed(true);
    } else {
      setPwError("Incorrect password.");
    }
  }

  async function buildSite(businessId: string) {
    setAction(businessId, "building");
    const res = await fetch("/api/admin/build", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-secret": ADMIN_SECRET,
      },
      body: JSON.stringify({ business_id: businessId }),
    });
    const data = await res.json();
    if (data.success) {
      setAction(businessId, "");
      fetchOrders();
    } else {
      setAction(businessId, "error");
      alert(`Build failed: ${data.error}`);
    }
  }

  async function approveSite(businessId: string) {
    if (!confirm("Approve this site and send it live? The customer will receive their login and DNS instructions.")) return;
    setAction(businessId, "approving");
    const res = await fetch("/api/admin/approve", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-secret": ADMIN_SECRET,
      },
      body: JSON.stringify({ business_id: businessId }),
    });
    const data = await res.json();
    if (data.success) {
      setAction(businessId, "");
      fetchOrders();
    } else {
      setAction(businessId, "error");
      alert(`Approve failed: ${data.error}`);
    }
  }

  const filtered = filter === "all"
    ? orders
    : orders.filter(o => (o.websites?.status || "pending") === filter);

  const counts = {
    all:          orders.length,
    pending:      orders.filter(o => (o.websites?.status || "pending") === "pending").length,
    admin_review: orders.filter(o => o.websites?.status === "admin_review").length,
    live:         orders.filter(o => o.websites?.status === "live").length,
  };

  // ── Login gate ────────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div className={styles.loginPage}>
        <div className={styles.loginCard}>
          <div className={styles.loginLogo}>Ex<span>sisto</span> Admin</div>
          <p className={styles.loginSub}>Matt only. Keep it that way.</p>
          <input
            type="password"
            placeholder="Admin password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && login()}
            className={styles.loginInput}
            autoFocus
          />
          {pwError && <div className={styles.loginError}>{pwError}</div>}
          <button className={styles.loginBtn} onClick={login}>Sign in →</button>
        </div>
      </div>
    );
  }

  // ── Main dashboard ─────────────────────────────────────────────────────────
  return (
    <div className={styles.page}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>Ex<span>sisto</span><br /><small>Admin</small></div>
        <nav className={styles.nav}>
          <a href="/admin" className={`${styles.navItem} ${styles.active}`}>
            <span>📦</span> Orders
          </a>
          <a href="/" className={styles.navItem} target="_blank">
            <span>🌐</span> Public site
          </a>
        </nav>
        <div className={styles.sidebarBottom}>
          <button className={styles.signOut} onClick={() => setAuthed(false)}>Sign out</button>
        </div>
      </aside>

      <main className={styles.main}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Orders</h1>
            <p className={styles.sub}>{orders.length} total · {counts.pending} pending · {counts.admin_review} ready to review</p>
          </div>
          <button className={styles.refreshBtn} onClick={fetchOrders} disabled={loading}>
            {loading ? "Loading…" : "↻ Refresh"}
          </button>
        </div>

        {/* Filter tabs */}
        <div className={styles.tabs}>
          {[
            { key: "all",          label: `All (${counts.all})` },
            { key: "pending",      label: `Pending (${counts.pending})` },
            { key: "admin_review", label: `Ready to Review (${counts.admin_review})` },
            { key: "live",         label: `Live (${counts.live})` },
          ].map(t => (
            <button
              key={t.key}
              className={`${styles.tab} ${filter === t.key ? styles.tabActive : ""}`}
              onClick={() => setFilter(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Order list */}
        {loading ? (
          <div className={styles.empty}>Loading orders…</div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>No orders in this category.</div>
        ) : (
          <div className={styles.orderList}>
            {filtered.map(order => {
              const status = order.websites?.status || "pending";
              const statusInfo = STATUS_LABELS[status] || { label: status, color: "#9090a8" };
              const plan = order.customers?.plan || order.websites?.plan || "starter";
              const actionState = actionStates[order.id] || "";
              const createdAt = new Date(order.created_at).toLocaleDateString("en-US", {
                month: "short", day: "numeric", year: "numeric",
              });

              return (
                <div key={order.id} className={styles.orderCard}>
                  <div className={styles.orderTop}>
                    <div className={styles.orderMeta}>
                      <div className={styles.orderName}>{order.name}</div>
                      <div className={styles.orderDetails}>
                        <span>{order.customers?.email}</span>
                        <span>·</span>
                        <span className={styles.planTag}>{plan}</span>
                        <span>·</span>
                        <span>{[order.city, order.state].filter(Boolean).join(", ")}</span>
                        <span>·</span>
                        <span>{order.industry}</span>
                        <span>·</span>
                        <span className={styles.dateTag}>{createdAt}</span>
                      </div>
                      {order.custom_domain && (
                        <div className={styles.domainTag}>🌐 {order.custom_domain}</div>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div
                        className={styles.statusBadge}
                        style={{ background: statusInfo.color + "18", color: statusInfo.color, borderColor: statusInfo.color + "33" }}
                      >
                        {statusInfo.label}
                      </div>
                    </div>
                  </div>

                  {/* Action row */}
                  <div className={styles.orderActions}>
                    {/* Preview site HTML */}
                    {order.websites?.custom_html && (
                      <button
                        className={styles.actionBtn}
                        onClick={() => setPreview(preview?.id === order.id ? null : order)}
                      >
                        {preview?.id === order.id ? "Hide preview" : "Preview site"}
                      </button>
                    )}

                    {/* View live site */}
                    {order.websites?.vercel_url && (
                      <a
                        className={styles.actionBtn}
                        href={order.websites.vercel_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View live →
                      </a>
                    )}

                    {/* Build button — show for pending/error */}
                    {(status === "pending" || status === "error") && (
                      <button
                        className={`${styles.actionBtn} ${styles.buildBtn}`}
                        onClick={() => buildSite(order.id)}
                        disabled={actionState === "building"}
                      >
                        {actionState === "building" ? "Building…" : "🔨 Build site"}
                      </button>
                    )}

                    {/* Rebuild — show for admin_review */}
                    {status === "admin_review" && (
                      <button
                        className={styles.actionBtn}
                        onClick={() => buildSite(order.id)}
                        disabled={actionState === "building"}
                      >
                        {actionState === "building" ? "Rebuilding…" : "↺ Rebuild"}
                      </button>
                    )}

                    {/* Approve — show for admin_review */}
                    {status === "admin_review" && (
                      <button
                        className={`${styles.actionBtn} ${styles.approveBtn}`}
                        onClick={() => approveSite(order.id)}
                        disabled={actionState === "approving"}
                      >
                        {actionState === "approving" ? "Sending live…" : "✓ Approve & send live"}
                      </button>
                    )}

                    {/* Rebuild live site */}
                    {status === "live" && (
                      <button
                        className={styles.actionBtn}
                        onClick={() => buildSite(order.id)}
                        disabled={actionState === "building"}
                      >
                        {actionState === "building" ? "Rebuilding…" : "↺ Rebuild"}
                      </button>
                    )}
                  </div>


                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
