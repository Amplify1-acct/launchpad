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

const STAT_PROMPTS: Record<string, Array<{ label: string; placeholder: string }>> = {
  "Law Firm": [
    { label: "Years in Practice", placeholder: "e.g. 20" },
    { label: "Cases Won", placeholder: "e.g. 500+" },
    { label: "Recovered for Clients", placeholder: "e.g. $50M+" },
    { label: "Success Rate", placeholder: "e.g. 98%" },
  ],
  "Accounting / CPA": [
    { label: "Years in Business", placeholder: "e.g. 15" },
    { label: "Clients Served", placeholder: "e.g. 300+" },
    { label: "Tax Returns Filed", placeholder: "e.g. 5,000+" },
    { label: "Client Retention Rate", placeholder: "e.g. 95%" },
  ],
  "Financial Advisory": [
    { label: "Years of Experience", placeholder: "e.g. 20" },
    { label: "Clients Served", placeholder: "e.g. 200+" },
    { label: "Assets Under Management", placeholder: "e.g. $100M+" },
    { label: "Client Satisfaction", placeholder: "e.g. 98%" },
  ],
  "Real Estate": [
    { label: "Years in Business", placeholder: "e.g. 15" },
    { label: "Homes Sold", placeholder: "e.g. 500+" },
    { label: "Total Sales Volume", placeholder: "e.g. $200M+" },
    { label: "Avg. Days on Market", placeholder: "e.g. 18" },
  ],
  "Medical Clinic": [
    { label: "Years in Practice", placeholder: "e.g. 20" },
    { label: "Patients Served", placeholder: "e.g. 5,000+" },
    { label: "Providers on Staff", placeholder: "e.g. 8" },
    { label: "Patient Satisfaction", placeholder: "e.g. 97%" },
  ],
  "Dental Office": [
    { label: "Years in Practice", placeholder: "e.g. 15" },
    { label: "Patients Served", placeholder: "e.g. 3,000+" },
    { label: "Procedures Completed", placeholder: "e.g. 10,000+" },
    { label: "Patient Satisfaction", placeholder: "e.g. 99%" },
  ],
  "Chiropractic": [
    { label: "Years in Practice", placeholder: "e.g. 12" },
    { label: "Patients Treated", placeholder: "e.g. 2,000+" },
    { label: "Conditions Treated", placeholder: "e.g. 50+" },
    { label: "Patient Satisfaction", placeholder: "e.g. 98%" },
  ],
  "Insurance Agency": [
    { label: "Years in Business", placeholder: "e.g. 20" },
    { label: "Clients Insured", placeholder: "e.g. 1,000+" },
    { label: "Policies Written", placeholder: "e.g. 5,000+" },
    { label: "Claims Satisfaction", placeholder: "e.g. 97%" },
  ],
  "Hair Salon": [
    { label: "Years in Business", placeholder: "e.g. 10" },
    { label: "Happy Clients", placeholder: "e.g. 2,000+" },
    { label: "Stylists on Staff", placeholder: "e.g. 8" },
    { label: "5-Star Reviews", placeholder: "e.g. 300+" },
  ],
  "Fitness Studio": [
    { label: "Years in Business", placeholder: "e.g. 8" },
    { label: "Members Served", placeholder: "e.g. 500+" },
    { label: "Classes per Week", placeholder: "e.g. 30+" },
    { label: "Member Satisfaction", placeholder: "e.g. 98%" },
  ],
};

const DEFAULT_STATS = [
  { label: "Years in Business", placeholder: "e.g. 15" },
  { label: "Customers Served", placeholder: "e.g. 500+" },
  { label: "Jobs Completed", placeholder: "e.g. 1,200+" },
  { label: "Satisfaction Rate", placeholder: "e.g. 100%" },
];

function getStatPrompts(industry: string) {
  return STAT_PROMPTS[industry] || DEFAULT_STATS;
}

const inp: React.CSSProperties = {
  width: "100%", padding: "0.65rem 0.85rem",
  border: "1.5px solid #e4e4e0", borderRadius: 3,
  fontSize: "0.875rem", fontFamily: "inherit", color: "#222", background: "#fff",
};

const lbl: React.CSSProperties = {
  display: "block", fontSize: "0.68rem", fontWeight: 700,
  textTransform: "uppercase" as const, letterSpacing: "0.08em",
  color: "#777", marginBottom: 4,
};

export default function PreviewPage() {
  const [form, setForm] = useState({
    businessName: "", industry: "", city: "", state: "",
    description: "", phone: "", email: "", founded: "",
  });
  const [stats, setStats] = useState<string[]>(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [pages, setPages] = useState<Record<string, string> | null>(null);
  const [activePage, setActivePage] = useState("index.html");
  const [template, setTemplate] = useState("");
  const [error, setError] = useState("");
  const [timeElapsed, setTimeElapsed] = useState(0);

  const statPrompts = getStatPrompts(form.industry);

  function setField(key: string, val: string) {
    setForm(f => ({ ...f, [key]: val }));
    if (key === "industry") setStats(["", "", "", ""]);
  }

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

    const realStats = statPrompts
      .map((p, i) => ({ value: stats[i]?.trim() || null, label: p.label }))
      .filter(s => s.value);

    try {
      const res = await fetch("/api/preview-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, realStats }),
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
    "index.html": "Home", "services.html": "Services",
    "about.html": "About", "contact.html": "Contact",
  };

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'DM Sans', sans-serif", background: "#f8f8f6" }}>

      {/* LEFT PANEL */}
      <div style={{ width: 360, flexShrink: 0, background: "#fff", borderRight: "1px solid #e4e4e0", display: "flex", flexDirection: "column", overflowY: "auto" }}>

        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #e4e4e0" }}>
          <div style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#bbb", marginBottom: 4 }}>Exsisto</div>
          <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#111" }}>Site Preview</div>
          <div style={{ fontSize: "0.78rem", color: "#999", marginTop: 2 }}>Generate a real site in ~15 seconds</div>
        </div>

        <div style={{ padding: "1.25rem 1.5rem", flex: 1 }}>

          {/* Section: Business Info */}
          <div style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#bbb", marginBottom: "0.75rem" }}>Business Info</div>

          <div style={{ marginBottom: "0.85rem" }}>
            <label style={lbl}>Business Name *</label>
            <input value={form.businessName} onChange={e => setField("businessName", e.target.value)} placeholder="e.g. Miller's Plumbing" style={inp} />
          </div>

          <div style={{ marginBottom: "0.85rem" }}>
            <label style={lbl}>Industry *</label>
            <select value={form.industry} onChange={e => setField("industry", e.target.value)} style={inp}>
              <option value="">Select industry...</option>
              {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 72px", gap: "0.6rem", marginBottom: "0.85rem" }}>
            <div>
              <label style={lbl}>City</label>
              <input value={form.city} onChange={e => setField("city", e.target.value)} placeholder="e.g. Westfield" style={inp} />
            </div>
            <div>
              <label style={lbl}>State</label>
              <input value={form.state} onChange={e => setField("state", e.target.value)} placeholder="NJ" style={inp} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem", marginBottom: "0.85rem" }}>
            <div>
              <label style={lbl}>Phone</label>
              <input value={form.phone} onChange={e => setField("phone", e.target.value)} placeholder="(908) 000-0000" style={inp} />
            </div>
            <div>
              <label style={lbl}>Year Founded</label>
              <input value={form.founded} onChange={e => setField("founded", e.target.value)} placeholder="e.g. 2008" style={inp} />
            </div>
          </div>

          <div style={{ marginBottom: "0.85rem" }}>
            <label style={lbl}>Email</label>
            <input value={form.email} onChange={e => setField("email", e.target.value)} placeholder="hello@yourbusiness.com" style={inp} />
          </div>

          <div style={{ marginBottom: "1.25rem" }}>
            <label style={lbl}>Business Description *</label>
            <textarea value={form.description} onChange={e => setField("description", e.target.value)}
              placeholder="What do you do, who do you serve, what makes you different..."
              rows={3} style={{ ...inp, resize: "vertical" }} />
          </div>

          {/* Section: Your Numbers */}
          <div style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#bbb", marginBottom: "0.5rem", paddingTop: "0.25rem", borderTop: "1px solid #f0f0ee" }}>
            Your Numbers
            <span style={{ fontWeight: 400, color: "#ccc", marginLeft: 6 }}>shown on your site</span>
          </div>

          <div style={{ background: "#f8f8f6", border: "1px solid #ece9e4", borderRadius: 4, padding: "0.9rem", marginBottom: "1.25rem" }}>
            <div style={{ fontSize: "0.75rem", color: "#999", marginBottom: "0.85rem", lineHeight: 1.5 }}>
              Fill in what applies — skip any that don't. These appear as trust signals on your homepage.
            </div>
            {statPrompts.map((p, i) => (
              <div key={i} style={{ marginBottom: i < 3 ? "0.7rem" : 0 }}>
                <label style={{ ...lbl, color: "#999" }}>{p.label}</label>
                <input value={stats[i] || ""} onChange={e => { const s = [...stats]; s[i] = e.target.value; setStats(s); }}
                  placeholder={p.placeholder} style={{ ...inp, background: "#fff" }} />
              </div>
            ))}
          </div>

          {error && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 3, padding: "0.75rem", fontSize: "0.82rem", color: "#dc2626", marginBottom: "1rem" }}>
              {error}
            </div>
          )}

          <button onClick={handleGenerate} disabled={loading} style={{
            width: "100%", padding: "0.85rem",
            background: loading ? "#999" : "#111",
            color: "#fff", border: "none", borderRadius: 3,
            fontSize: "0.85rem", fontWeight: 700,
            letterSpacing: "0.06em", textTransform: "uppercase",
            cursor: loading ? "not-allowed" : "pointer",
          }}>
            {loading ? `Generating... (${timeElapsed}s)` : "✨ Generate Site →"}
          </button>

          {loading && (
            <div style={{ marginTop: "0.9rem", fontSize: "0.775rem", color: "#aaa", lineHeight: 1.9 }}>
              <div>🤖 Writing your copy...</div>
              {timeElapsed > 5 && <div>🎨 Building template...</div>}
              {timeElapsed > 10 && <div>📄 Assembling 4 pages...</div>}
            </div>
          )}

          {template && pages && (
            <div style={{ marginTop: "1rem", padding: "0.85rem", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 3 }}>
              <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#16a34a", marginBottom: 3 }}>✓ Site generated!</div>
              <div style={{ fontSize: "0.73rem", color: "#555" }}>
                Template: <strong>{template}</strong> · 4 pages
                {stats.filter(s => s.trim()).length > 0 && ` · ${stats.filter(s => s.trim()).length} real stats`}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {pages && (
          <div style={{ background: "#fff", borderBottom: "1px solid #e4e4e0", padding: "0 1.5rem", display: "flex", alignItems: "center", height: 44 }}>
            {Object.keys(pages).map(page => (
              <button key={page} onClick={() => setActivePage(page)} style={{
                padding: "0 1.25rem", height: "100%", border: "none", background: "none",
                fontSize: "0.8rem", fontWeight: 600, cursor: "pointer",
                color: activePage === page ? "#111" : "#888",
                borderBottom: activePage === page ? "2px solid #111" : "2px solid transparent",
              }}>
                {pageLabels[page] || page}
              </button>
            ))}
            <div style={{ marginLeft: "auto", fontSize: "0.73rem", color: "#bbb" }}>Preview only — Go Live to deploy</div>
          </div>
        )}

        <div style={{ flex: 1, overflow: "hidden" }}>
          {!pages && !loading && (
            <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 10, color: "#ccc" }}>
              <div style={{ fontSize: "2.5rem" }}>🏗️</div>
              <div style={{ fontSize: "1rem", fontWeight: 600, color: "#555" }}>Fill in the form and hit Generate</div>
              <div style={{ fontSize: "0.85rem", color: "#aaa" }}>Your site appears here in ~15 seconds</div>
            </div>
          )}

          {loading && (
            <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 14, color: "#aaa" }}>
              <div style={{ fontSize: "2rem", animation: "spin 2s linear infinite" }}>⚙️</div>
              <div style={{ fontSize: "1rem", fontWeight: 600, color: "#555" }}>Building your site...</div>
              <div style={{ fontSize: "0.85rem" }}>AI is writing copy, picking photos, assembling pages</div>
              <div style={{ marginTop: 6, width: 180, height: 3, background: "#e4e4e0", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", background: "#111", borderRadius: 2, width: `${Math.min(timeElapsed * 6, 95)}%`, transition: "width 1s ease" }} />
              </div>
            </div>
          )}

          {pages && pages[activePage] && (
            <iframe key={activePage} srcDoc={pages[activePage]}
              style={{ width: "100%", height: "100%", border: "none" }}
              title={activePage} sandbox="allow-scripts allow-same-origin" />
          )}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        input:focus, select:focus, textarea:focus { outline: none; border-color: #111 !important; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #ddd; border-radius: 2px; }
      `}</style>
    </div>
  );
}
