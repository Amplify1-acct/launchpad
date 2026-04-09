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
  { key: "republish",       label: "🚀 Republish",         desc: "Redeploy site to Vercel" },
  { key: "all",             label: "⚡ Full rebuild",      desc: "Fix plan + regenerate + republish" },
];

export default function AdminClientActions({ businessId, adminSecret }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, any>>({});
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
      if (action === "republish" || action === "all") {
        setTimeout(() => window.location.reload(), 2000);
      }
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(null);
  }

  return (
    <div style={{
      background: "#1b1b25",
      borderBottom: "1px solid #2d2d3d",
      padding: "10px 20px",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      flexWrap: "wrap",
      fontFamily: "'Inter', sans-serif",
    }}>
      <span style={{ fontSize: "11px", color: "#6b6b8a", fontWeight: 600, marginRight: "4px", whiteSpace: "nowrap" }}>
        ADMIN ACTIONS:
      </span>
      {ACTIONS.map(a => (
        <button
          key={a.key}
          onClick={() => runAction(a.key)}
          disabled={loading !== null}
          title={a.desc}
          style={{
            padding: "5px 12px",
            borderRadius: "6px",
            border: "1px solid #3d3d4d",
            background: loading === a.key ? "#4648d4" : results[a.key] ? "#16a34a22" : "#2d2d3d",
            color: loading === a.key ? "#fff" : results[a.key] ? "#4ade80" : "#ccc",
            fontSize: "11px",
            fontWeight: 600,
            cursor: loading !== null ? "not-allowed" : "pointer",
            opacity: loading !== null && loading !== a.key ? 0.5 : 1,
            whiteSpace: "nowrap",
            fontFamily: "inherit",
          }}
        >
          {loading === a.key ? "Running…" : results[a.key] ? results[a.key] : a.label}
        </button>
      ))}
      {error && <span style={{ fontSize: "11px", color: "#f87171" }}>{error}</span>}
    </div>
  );
}
