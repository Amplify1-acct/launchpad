"use client";

import { useState } from "react";

const INDUSTRIES = [
  "Plumbing", "Roofing", "HVAC", "Electrical", "General Contractor",
  "Landscaping", "Lawn Care", "House Cleaning", "Pest Control", "Painting",
  "Law Firm", "Accounting / CPA", "Financial Advisory", "Business Consulting",
  "Real Estate", "Insurance Agency", "Bookkeeping", "HR Consulting",
  "Medical Clinic", "Dental Office", "Chiropractic", "Physical Therapy",
  "Hair Salon", "Spa / Wellness", "Fitness Studio", "Photography",
];

export default function PreviewPage() {
  const [form, setForm] = useState({
    businessName: "",
    industry: "",
    city: "",
    state: "",
    description: "",
    phone: "",
    email: "",
  });
  const [loading, setLoading] = useState(false);
  const [pages, setPages] = useState<Record<string, string> | null>(null);
  const [activePage, setActivePage] = useState("index.html");
  const [template, setTemplate] = useState("");
  const [error, setError] = useState("");
  const [timeElapsed, setTimeElapsed] = useState(0);

  async function handleGenerate() {
    if (!form.businessName || !form.industry || !form.description) {
      setError("Please fill in business name, industry, and description.");
      return;
    }
    setError("");
    setLoading(true);
    setPages(null);
    setTimeElapsed(0);

    const timer = setInterval(() => setTimeElapsed(t => t + 1), 1000);

    try {
      const res = await fetch("/api/preview-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPages(data.pages);
      setTemplate(data.template);
      setActivePage("index.html");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
      clearInterval(timer);
    }
  }

  const pageLabels: Record<string, string> = {
    "index.html": "Home",
    "services.html": "Services",
    "about.html": "About",
    "contact.html": "Contact",
  };

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'DM Sans', sans-serif", background: "#f8f8f6" }}>

      {/* ── LEFT PANEL ── */}
      <div style={{ width: 340, flexShrink: 0, background: "#fff", borderRight: "1px solid #e4e4e0", display: "flex", flexDirection: "column", overflowY: "auto" }}>
        <div style={{ padding: "1.5rem", borderBottom: "1px solid #e4e4e0" }}>
          <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#888", marginBottom: 6 }}>Exsisto</div>
          <div style={{ fontSize: "1.3rem", fontWeight: 700, color: "#111" }}>Site Preview</div>
          <div style={{ fontSize: "0.8rem", color: "#888", marginTop: 4 }}>Generate a real site in ~15 seconds</div>
        </div>

        <div style={{ padding: "1.5rem", flex: 1 }}>
          {[
            { label: "Business Name", key: "businessName", placeholder: "e.g. Miller's Plumbing" },
            { label: "City", key: "city", placeholder: "e.g. Springfield" },
            { label: "State", key: "state", placeholder: "e.g. IL" },
            { label: "Phone", key: "phone", placeholder: "e.g. (555) 000-0000" },
            { label: "Email", key: "email", placeholder: "e.g. hello@business.com" },
          ].map(({ label, key, placeholder }) => (
            <div key={key} style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#666", marginBottom: 4 }}>{label}</label>
              <input
                value={(form as any)[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                style={{ width: "100%", padding: "0.65rem 0.85rem", border: "1.5px solid #e4e4e0", borderRadius: 3, fontSize: "0.9rem", fontFamily: "inherit", color: "#222" }}
              />
            </div>
          ))}

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#666", marginBottom: 4 }}>Industry</label>
            <select
              value={form.industry}
              onChange={e => setForm(f => ({ ...f, industry: e.target.value }))}
              style={{ width: "100%", padding: "0.65rem 0.85rem", border: "1.5px solid #e4e4e0", borderRadius: 3, fontSize: "0.9rem", fontFamily: "inherit", color: "#222", background: "#fff" }}
            >
              <option value="">Select industry...</option>
              {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#666", marginBottom: 4 }}>Business Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Describe what this business does, who they serve, and what makes them different..."
              rows={4}
              style={{ width: "100%", padding: "0.65rem 0.85rem", border: "1.5px solid #e4e4e0", borderRadius: 3, fontSize: "0.9rem", fontFamily: "inherit", color: "#222", resize: "vertical" }}
            />
          </div>

          {error && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 3, padding: "0.75rem 1rem", fontSize: "0.85rem", color: "#dc2626", marginBottom: "1rem" }}>
              {error}
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading}
            style={{
              width: "100%", padding: "0.9rem", background: loading ? "#888" : "#111",
              color: "#fff", border: "none", borderRadius: 3, fontSize: "0.9rem",
              fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
              cursor: loading ? "not-allowed" : "pointer", transition: "background 0.2s",
            }}
          >
            {loading ? `Generating... (${timeElapsed}s)` : "✨ Generate Site →"}
          </button>

          {loading && (
            <div style={{ marginTop: "1rem", fontSize: "0.8rem", color: "#888", lineHeight: 1.6 }}>
              <div>🤖 AI is writing copy...</div>
              {timeElapsed > 5 && <div>🎨 Building template...</div>}
              {timeElapsed > 10 && <div>📄 Assembling pages...</div>}
            </div>
          )}

          {template && pages && (
            <div style={{ marginTop: "1.5rem", padding: "1rem", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 3 }}>
              <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#16a34a", marginBottom: 4 }}>✓ Site generated!</div>
              <div style={{ fontSize: "0.75rem", color: "#555" }}>Template: <strong>{template}</strong> · {Object.keys(pages).length} pages</div>
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Page tabs */}
        {pages && (
          <div style={{ background: "#fff", borderBottom: "1px solid #e4e4e0", padding: "0 1.5rem", display: "flex", gap: 0, alignItems: "center", height: 44 }}>
            {Object.keys(pages).map(page => (
              <button
                key={page}
                onClick={() => setActivePage(page)}
                style={{
                  padding: "0 1.25rem", height: "100%", border: "none", background: "none",
                  fontSize: "0.8rem", fontWeight: 600, cursor: "pointer",
                  color: activePage === page ? "#111" : "#888",
                  borderBottom: activePage === page ? "2px solid #111" : "2px solid transparent",
                  letterSpacing: "0.04em",
                }}
              >
                {pageLabels[page] || page}
              </button>
            ))}
            <div style={{ marginLeft: "auto", fontSize: "0.75rem", color: "#aaa" }}>
              Preview only — click Go Live to deploy
            </div>
          </div>
        )}

        {/* Preview area */}
        <div style={{ flex: 1, overflow: "hidden" }}>
          {!pages && !loading && (
            <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, color: "#aaa" }}>
              <div style={{ fontSize: "3rem" }}>🏗️</div>
              <div style={{ fontSize: "1rem", fontWeight: 600, color: "#555" }}>Fill in the form and hit Generate</div>
              <div style={{ fontSize: "0.875rem" }}>Your site will appear here in ~15 seconds</div>
            </div>
          )}

          {loading && (
            <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, color: "#aaa" }}>
              <div style={{ fontSize: "2.5rem", animation: "spin 2s linear infinite" }}>⚙️</div>
              <div style={{ fontSize: "1rem", fontWeight: 600, color: "#555" }}>Building your site...</div>
              <div style={{ fontSize: "0.875rem" }}>AI is writing copy, picking colors, assembling pages</div>
              <div style={{ marginTop: 8, width: 200, height: 4, background: "#e4e4e0", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", background: "#111", borderRadius: 2, width: `${Math.min(timeElapsed * 6, 95)}%`, transition: "width 1s ease" }} />
              </div>
            </div>
          )}

          {pages && pages[activePage] && (
            <iframe
              key={activePage}
              srcDoc={pages[activePage]}
              style={{ width: "100%", height: "100%", border: "none" }}
              title={activePage}
              sandbox="allow-scripts allow-same-origin"
            />
          )}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        input:focus, select:focus, textarea:focus { outline: none; border-color: #111 !important; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
