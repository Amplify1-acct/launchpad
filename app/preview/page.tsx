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

// Title suggestions per industry
const TITLE_SUGGESTIONS: Record<string, string[]> = {
  "Law Firm": ["Managing Partner", "Senior Attorney", "Associate Attorney", "Partner", "Of Counsel"],
  "Accounting / CPA": ["Founder & CPA", "Senior Accountant", "Tax Manager", "Principal"],
  "Financial Advisory": ["Founder & CFP", "Senior Advisor", "Portfolio Manager", "Principal"],
  "Medical Clinic": ["Medical Director", "Physician", "Nurse Practitioner", "Practice Manager"],
  "Dental Office": ["Lead Dentist", "Associate Dentist", "Dental Hygienist"],
  "Chiropractic": ["Chiropractor", "Lead Physician", "Associate Doctor"],
  "Plumbing": ["Master Plumber", "Owner & Operator", "Lead Technician", "Journeyman Plumber"],
  "Roofing": ["Owner & Operator", "Master Roofer", "Project Manager", "Lead Installer"],
  "HVAC": ["Owner & Operator", "Master Technician", "Lead Installer", "Service Manager"],
  "Electrical": ["Master Electrician", "Owner & Operator", "Lead Electrician", "Project Manager"],
  "General Contractor": ["General Contractor", "Owner & Operator", "Project Manager", "Site Supervisor"],
  "Real Estate": ["Broker / Owner", "Realtor®", "Listing Specialist", "Buyer's Agent"],
  "Hair Salon": ["Owner & Master Stylist", "Senior Stylist", "Color Specialist", "Salon Manager"],
  "Photography": ["Lead Photographer", "Owner & Photographer", "Second Shooter"],
};

function getTitleSuggestions(industry: string): string[] {
  return TITLE_SUGGESTIONS[industry] || ["Owner & Operator", "Founder", "Manager", "Lead Specialist"];
}

function getStatPrompts(industry: string) {
  return STAT_PROMPTS[industry] || DEFAULT_STATS;
}

interface TeamMember {
  name: string;
  title: string;
  bio: string;
  experience: string;
  credentials: string;
  education: string;
  barAdmissions: string;
  specializations: string;
  awards: string;
  publications: string;
  linkedin: string;
}

const emptyMember = (): TeamMember => ({
  name: "", title: "", bio: "", experience: "", credentials: "",
  education: "", barAdmissions: "", specializations: "",
  awards: "", publications: "", linkedin: "",
});

const inp: React.CSSProperties = {
  width: "100%", padding: "0.6rem 0.8rem",
  border: "1.5px solid #e4e4e0", borderRadius: 3,
  fontSize: "0.875rem", fontFamily: "inherit", color: "#222", background: "#fff",
};

const lbl: React.CSSProperties = {
  display: "block", fontSize: "0.66rem", fontWeight: 700,
  textTransform: "uppercase" as const, letterSpacing: "0.08em",
  color: "#777", marginBottom: 3,
};

const sectionHeader = (text: string, sub?: string) => (
  <div style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.12em", color: "#bbb", marginBottom: "0.75rem", paddingTop: "1.25rem", borderTop: "1px solid #f0f0ee" }}>
    {text}
    {sub && <span style={{ fontWeight: 400, color: "#ccc", marginLeft: 6 }}>{sub}</span>}
  </div>
);

export default function PreviewPage() {
  const [form, setForm] = useState({
    businessName: "", industry: "", city: "", state: "",
    description: "", phone: "", email: "", founded: "",
  });
  const [stats, setStats] = useState<string[]>(["", "", "", ""]);
  const [team, setTeam] = useState<TeamMember[]>([emptyMember()]);
  const [loading, setLoading] = useState(false);
  const [pages, setPages] = useState<Record<string, string> | null>(null);
  const [activePage, setActivePage] = useState("index.html");
  const [template, setTemplate] = useState("");
  const [error, setError] = useState("");
  const [timeElapsed, setTimeElapsed] = useState(0);

  const statPrompts = getStatPrompts(form.industry);
  const titleSuggestions = getTitleSuggestions(form.industry);

  function setField(key: string, val: string) {
    setForm(f => ({ ...f, [key]: val }));
    if (key === "industry") setStats(["", "", "", ""]);
  }

  function setMember(i: number, key: keyof TeamMember, val: string) {
    setTeam(t => { const n = [...t]; n[i] = { ...n[i], [key]: val }; return n; });
  }

  function addMember() {
    if (team.length < 5) setTeam(t => [...t, emptyMember()]);
  }

  function removeMember(i: number) {
    setTeam(t => t.filter((_, idx) => idx !== i));
  }

  async function handleGenerate() {
    const missing = [];
    if (!form.businessName.trim()) missing.push("Business Name");
    if (!form.industry) missing.push("Industry");
    if (missing.length > 0) {
      setError(`Please fill in: ${missing.join(", ")}`);
      return;
    }
    // Use a fallback description if blank
    if (!form.description.trim()) {
      setForm(f => ({ ...f, description: `${form.businessName} is a ${form.industry} business serving clients in ${form.city || "the local area"}.` }));
    }
    setError("");
    setLoading(true);
    setPages(null);
    setTimeElapsed(0);
    const timer = setInterval(() => setTimeElapsed(t => t + 1), 1000);

    const realStats = statPrompts
      .map((p, i) => ({ value: stats[i]?.trim() || null, label: p.label }))
      .filter(s => s.value);

    // Only send team members that have at least a name
    const realTeam = team.filter(m => m.name.trim());

    try {
      const res = await fetch("/api/preview-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, realStats, team: realTeam }),
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
    "team.html": "Team",
  };

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'DM Sans', sans-serif", background: "#f8f8f6" }}>

      {/* ── LEFT PANEL ── */}
      <div style={{ width: 380, flexShrink: 0, background: "#fff", borderRight: "1px solid #e4e4e0", display: "flex", flexDirection: "column", overflowY: "auto" }}>

        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #e4e4e0" }}>
          <div style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#bbb", marginBottom: 4 }}>Exsisto</div>
          <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#111" }}>Site Preview</div>
          <div style={{ fontSize: "0.78rem", color: "#999", marginTop: 2 }}>Generate a real site in ~15 seconds</div>
        </div>

        <div style={{ padding: "1.25rem 1.5rem", flex: 1 }}>

          {/* ── BUSINESS INFO ── */}
          <div style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#bbb", marginBottom: "0.75rem" }}>Business Info</div>

          <div style={{ marginBottom: "0.8rem" }}>
            <label style={lbl}>Business Name *</label>
            <input value={form.businessName} onChange={e => setField("businessName", e.target.value)} placeholder="e.g. Miller's Plumbing" style={inp} />
          </div>

          <div style={{ marginBottom: "0.8rem" }}>
            <label style={lbl}>Industry *</label>
            <select value={form.industry} onChange={e => setField("industry", e.target.value)} style={inp}>
              <option value="">Select industry...</option>
              {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 72px", gap: "0.6rem", marginBottom: "0.8rem" }}>
            <div>
              <label style={lbl}>City</label>
              <input value={form.city} onChange={e => setField("city", e.target.value)} placeholder="e.g. Westfield" style={inp} />
            </div>
            <div>
              <label style={lbl}>State</label>
              <input value={form.state} onChange={e => setField("state", e.target.value)} placeholder="NJ" style={inp} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem", marginBottom: "0.8rem" }}>
            <div>
              <label style={lbl}>Phone</label>
              <input value={form.phone} onChange={e => setField("phone", e.target.value)} placeholder="(908) 000-0000" style={inp} />
            </div>
            <div>
              <label style={lbl}>Year Founded</label>
              <input value={form.founded} onChange={e => setField("founded", e.target.value)} placeholder="e.g. 2008" style={inp} />
            </div>
          </div>

          <div style={{ marginBottom: "0.8rem" }}>
            <label style={lbl}>Email</label>
            <input value={form.email} onChange={e => setField("email", e.target.value)} placeholder="hello@yourbusiness.com" style={inp} />
          </div>

          <div style={{ marginBottom: "0.5rem" }}>
            <label style={lbl}>
              Business Description
              <span style={{ fontWeight: 400, color: "#ccc", marginLeft: 6, textTransform: "none", letterSpacing: 0 }}>— optional</span>
            </label>
            <textarea value={form.description} onChange={e => setField("description", e.target.value)}
              placeholder="What do you do, who do you serve, what makes you different... (leave blank and we'll use your business name + industry)"
              rows={3} style={{ ...inp, resize: "vertical" }} />
          </div>

          {/* ── YOUR NUMBERS ── */}
          {sectionHeader("Your Numbers", "— shown on your site")}
          <div style={{ background: "#f8f8f6", border: "1px solid #ece9e4", borderRadius: 4, padding: "0.9rem", marginBottom: "0.5rem" }}>
            <div style={{ fontSize: "0.74rem", color: "#aaa", marginBottom: "0.8rem", lineHeight: 1.5 }}>
              Fill in what applies — skip any that don't.
            </div>
            {statPrompts.map((p, i) => (
              <div key={i} style={{ marginBottom: i < 3 ? "0.65rem" : 0 }}>
                <label style={{ ...lbl, color: "#999" }}>{p.label}</label>
                <input value={stats[i] || ""} onChange={e => { const s = [...stats]; s[i] = e.target.value; setStats(s); }}
                  placeholder={p.placeholder} style={{ ...inp, background: "#fff" }} />
              </div>
            ))}
          </div>

          {/* ── YOUR TEAM ── */}
          {sectionHeader("Your Team", "— principals, partners & key staff")}

          <div style={{ fontSize: "0.74rem", color: "#aaa", marginBottom: "1rem", lineHeight: 1.5 }}>
            Add up to 5 people. Each gets a bio on your site and a dedicated team page. Leave blank to skip.
          </div>

          {team.map((member, i) => (
            <div key={i} style={{ background: "#f8f8f6", border: "1px solid #ece9e4", borderRadius: 4, padding: "1rem", marginBottom: "0.75rem", position: "relative" }}>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <div style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#999" }}>
                  Person {i + 1}
                </div>
                {team.length > 1 && (
                  <button onClick={() => removeMember(i)} style={{ background: "none", border: "none", color: "#ccc", cursor: "pointer", fontSize: "1rem", padding: 0, lineHeight: 1 }}>
                    ×
                  </button>
                )}
              </div>

              <div style={{ marginBottom: "0.6rem" }}>
                <label style={lbl}>Full Name</label>
                <input value={member.name} onChange={e => setMember(i, "name", e.target.value)}
                  placeholder="e.g. Michael Torres" style={{ ...inp, background: "#fff" }} />
              </div>

              <div style={{ marginBottom: "0.6rem" }}>
                <label style={lbl}>Title / Role</label>
                <input value={member.title} onChange={e => setMember(i, "title", e.target.value)}
                  placeholder={titleSuggestions[0] || "e.g. Owner & Operator"} style={{ ...inp, background: "#fff" }} />
                {/* Title suggestions */}
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
                  {titleSuggestions.slice(0, 4).map(s => (
                    <button key={s} onClick={() => setMember(i, "title", s)}
                      style={{ fontSize: "0.68rem", padding: "2px 8px", background: "#fff", border: "1px solid #ddd", borderRadius: 2, cursor: "pointer", color: "#777" }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: "0.6rem" }}>
                <label style={lbl}>Years of Experience</label>
                <input value={member.experience} onChange={e => setMember(i, "experience", e.target.value)}
                  placeholder="e.g. 20" style={{ ...inp, background: "#fff", width: "50%" }} />
              </div>

              <div style={{ marginBottom: "0.6rem" }}>
                <label style={lbl}>Credentials / Licenses</label>
                <input value={member.credentials} onChange={e => setMember(i, "credentials", e.target.value)}
                  placeholder="e.g. Esq., CPA, Master Plumber License #12345"
                  style={{ ...inp, background: "#fff" }} />
              </div>

              <div style={{ marginBottom: "0.6rem" }}>
                <label style={lbl}>
                  Bio
                  <span style={{ fontWeight: 400, color: "#bbb", marginLeft: 6, textTransform: "none", letterSpacing: 0 }}>— background, career, personal touch</span>
                </label>
                <textarea value={member.bio} onChange={e => setMember(i, "bio", e.target.value)}
                  placeholder="Tell their full story — where they trained, career highlights, what drives them, community involvement. No limit — the more detail the better the bio page."
                  rows={5}
                  style={{ ...inp, background: "#fff", resize: "vertical", lineHeight: 1.6 }} />
                <div style={{ fontSize: "0.68rem", color: "#ccc", marginTop: 3 }}>
                  {member.bio.length} characters — no limit
                </div>
              </div>

              <div style={{ marginBottom: "0.6rem" }}>
                <label style={lbl}>Education</label>
                <textarea value={member.education} onChange={e => setMember(i, "education", e.target.value)}
                  placeholder={"e.g.
Harvard Law School, J.D., 2004
Boston College, B.A. Political Science, 2001"}
                  rows={3}
                  style={{ ...inp, background: "#fff", resize: "vertical", lineHeight: 1.6 }} />
              </div>

              <div style={{ marginBottom: "0.6rem" }}>
                <label style={lbl}>Bar Admissions / Licenses</label>
                <textarea value={member.barAdmissions} onChange={e => setMember(i, "barAdmissions", e.target.value)}
                  placeholder={"e.g.
New Jersey State Bar, 2005
New York State Bar, 2006
U.S. District Court, D.N.J."}
                  rows={3}
                  style={{ ...inp, background: "#fff", resize: "vertical", lineHeight: 1.6 }} />
              </div>

              <div style={{ marginBottom: "0.6rem" }}>
                <label style={lbl}>Practice Areas / Specializations</label>
                <input value={member.specializations} onChange={e => setMember(i, "specializations", e.target.value)}
                  placeholder="e.g. Personal Injury, Medical Malpractice, Wrongful Death"
                  style={{ ...inp, background: "#fff" }} />
              </div>

              <div style={{ marginBottom: "0.6rem" }}>
                <label style={lbl}>Awards & Recognitions</label>
                <textarea value={member.awards} onChange={e => setMember(i, "awards", e.target.value)}
                  placeholder={"e.g.
Super Lawyers 2018–2024
Best Lawyers in America 2020
AV Preeminent® Rating, Martindale-Hubbell"}
                  rows={3}
                  style={{ ...inp, background: "#fff", resize: "vertical", lineHeight: 1.6 }} />
              </div>

              <div style={{ marginBottom: "0.6rem" }}>
                <label style={lbl}>Publications / Media <span style={{ fontWeight: 400, color: "#ccc" }}>— optional</span></label>
                <textarea value={member.publications} onChange={e => setMember(i, "publications", e.target.value)}
                  placeholder={"e.g.
"Understanding NJ Personal Injury Law" — NJ Law Journal, 2022
Featured on NBC News, CNN discussing case outcomes"}
                  rows={3}
                  style={{ ...inp, background: "#fff", resize: "vertical", lineHeight: 1.6 }} />
              </div>

              <div>
                <label style={lbl}>LinkedIn URL <span style={{ fontWeight: 400, color: "#ccc" }}>— optional</span></label>
                <input value={member.linkedin} onChange={e => setMember(i, "linkedin", e.target.value)}
                  placeholder="https://linkedin.com/in/name"
                  style={{ ...inp, background: "#fff" }} />
              </div>
            </div>
          ))}

          {team.length < 5 && (
            <button onClick={addMember} style={{
              width: "100%", padding: "0.6rem", background: "none",
              border: "1.5px dashed #ddd", borderRadius: 3,
              fontSize: "0.8rem", color: "#aaa", cursor: "pointer",
              marginBottom: "1.25rem",
            }}>
              + Add another person
            </button>
          )}

          {/* ── GENERATE ── */}
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
              {timeElapsed > 10 && <div>📄 Assembling pages...</div>}
            </div>
          )}

          {template && pages && (
            <div style={{ marginTop: "1rem", padding: "0.85rem", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 3 }}>
              <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#16a34a", marginBottom: 3 }}>✓ Site generated!</div>
              <div style={{ fontSize: "0.73rem", color: "#555" }}>
                Template: <strong>{template}</strong> · {Object.keys(pages).length} pages
                {stats.filter(s => s.trim()).length > 0 && ` · ${stats.filter(s => s.trim()).length} real stats`}
                {team.filter(m => m.name.trim()).length > 0 && ` · ${team.filter(m => m.name.trim()).length} team member${team.filter(m => m.name.trim()).length > 1 ? "s" : ""}`}
              </div>
            </div>
          )}

          <div style={{ height: "2rem" }} />
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {pages && (
          <div style={{ background: "#fff", borderBottom: "1px solid #e4e4e0", padding: "0 1.5rem", display: "flex", alignItems: "center", height: 44 }}>
            {Object.keys(pages).map(page => (
              <button key={page} onClick={() => setActivePage(page)} style={{
                padding: "0 1.1rem", height: "100%", border: "none", background: "none",
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
        button:hover { opacity: 0.8; }
      `}</style>
    </div>
  );
}
