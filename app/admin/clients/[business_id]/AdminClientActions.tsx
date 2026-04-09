"use client";

import { useState } from "react";

interface Props {
  businessId: string;
  adminSecret: string;
}

const ACTIONS = [
  { key: "fix-plan",        label: "🔧 Fix plan",          desc: "Sync plan across all records" },
  { key: "generate-blogs",  label: "✍️ Generate blogs",    desc: "Write new blog posts" },
  { key: "regenerate-site", label: "🔨 Regenerate site",   desc: "Rebuild all pages from scratch" },
  { key: "republish",       label: "🚀 Republish",         desc: "Redeploy to Vercel" },
  { key: "all",             label: "⚡ Full rebuild",      desc: "Fix plan + regenerate + republish" },
];

export default function AdminClientActions({ businessId, adminSecret }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  async function runAction(action: string) {
    setLoading(action);
    setError("");
    try {
      const res = await fetch("/api/admin/content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": adminSecret,
        },
        body: JSON.stringify({ business_id: businessId, action }),
      });
      const data = await res.json();
      setResults(prev => ({ ...prev, [action]: data.success ? "✓ Done" : data.error || "Failed" }));
      if (action === "republish" || action === "all" || action === "regenerate-site") {
        setTimeout(() => window.location.reload(), 2000);
      }
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(null);
  }

  async function deleteClient() {
    if (!confirm("DELETE this client permanently?\n\nThis will remove their business, website, blog posts, social posts, subscription, account, and auth user.\n\nThis cannot be undone.")) return;
    setLoading("delete");
    setError("");
    try {
      const res = await fetch("/api/admin/delete-client", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": adminSecret,
        },
        body: JSON.stringify({ business_id: businessId }),
      });
      const data = await res.json();
      if (data.success) {
        window.location.href = "/admin";
      } else {
        setError(data.error || "Delete failed");
        setLoading(null);
      }
    } catch (e: any) {
      setError(e.message);
      setLoading(null);
    }
  }

  return (
    <div style={{
      position: "fixed",
      top: "37px",
      left: 0,
      right: 0,
      zIndex: 9998,
      background: "#23232f",
      borderBottom: "1px solid #35354a",
      padding: "8px 20px 8px 232px",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      flexWrap: "wrap",
      fontFamily: "'Inter', sans-serif",
    }}>
      <span style={{ fontSize: "11px", color: "#6b6b8a", fontWeight: 700, letterSpacing: "0.5px", marginRight: "4px", whiteSpace: "nowrap" }}>
        ACTIONS:
      </span>
      {ACTIONS.map(a => (
        <button
          key={a.key}
          onClick={() => runAction(a.key)}
          disabled={loading !== null}
          title={a.desc}
          style={{
            padding: "5px 13px",
            borderRadius: "6px",
            border: "1px solid #3d3d4d",
            background: loading === a.key ? "#4648d4"
              : results[a.key]?.startsWith("✓") ? "#16a34a22"
              : "#2d2d3d",
            color: loading === a.key ? "#fff"
              : results[a.key]?.startsWith("✓") ? "#4ade80"
              : "#d0d0e0",
            fontSize: "12px",
            fontWeight: 600,
            cursor: loading !== null ? "not-allowed" : "pointer",
            opacity: loading !== null && loading !== a.key ? 0.5 : 1,
            whiteSpace: "nowrap",
            fontFamily: "inherit",
            transition: "background 0.15s",
          }}
        >
          {loading === a.key ? "Running…" : results[a.key] || a.label}
        </button>
      ))}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Delete — separated to the right, red */}
      <button
        onClick={deleteClient}
        disabled={loading !== null}
        title="Permanently delete this client and all their data"
        style={{
          padding: "5px 13px",
          borderRadius: "6px",
          border: "1px solid #7f1d1d",
          background: loading === "delete" ? "#dc2626" : "#2d1515",
          color: loading === "delete" ? "#fff" : "#f87171",
          fontSize: "12px",
          fontWeight: 700,
          cursor: loading !== null ? "not-allowed" : "pointer",
          opacity: loading !== null && loading !== "delete" ? 0.5 : 1,
          whiteSpace: "nowrap",
          fontFamily: "inherit",
          transition: "background 0.15s",
        }}
      >
        {loading === "delete" ? "Deleting…" : "🗑 Delete client"}
      </button>

      {error && <span style={{ fontSize: "11px", color: "#f87171", marginLeft: "8px" }}>{error}</span>}
    </div>
  );
}
