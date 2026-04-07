"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";

const INTERNAL_SECRET = "exsisto-internal-2026";
const CRON_SECRET = "exsisto-cron-2026";

interface Business {
  id: string;
  name: string;
  industry: string;
  city: string;
  phone: string;
  subdomain: string;
}

interface TestResult {
  ok: boolean;
  label: string;
  data?: any;
  error?: string;
  time?: number;
}

const PLATFORMS = [
  { id: "facebook",       label: "Facebook",         emoji: "📘", color: "#1877f2" },
  { id: "instagram",      label: "Instagram",        emoji: "📸", color: "#e1306c" },
  { id: "google_business",label: "Google Business",  emoji: "🔍", color: "#4285f4" },
  { id: "tiktok",         label: "TikTok",           emoji: "🎵", color: "#010101" },
];

export default function DevPanel() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBiz, setSelectedBiz] = useState<Business | null>(null);
  const [results, setResults] = useState<TestResult[]>([]);
  const [running, setRunning] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"site" | "pages" | "social" | "cron" | "oauth">("site");
  const supabase = createClient();

  useEffect(() => {
    // Dev panel: fetch all businesses via admin API
    fetch("/api/dev/businesses")
      .then(r => r.json())
      .then(({ businesses: data }) => {
        if (data?.length) {
          setBusinesses(data);
          // Default to Matty's Automotive if available
          const matty = data.find((b: Business) => b.subdomain?.includes("matty") || b.name?.includes("Matty"));
          setSelectedBiz(matty || data[0]);
        }
      });
  }, []);

  function addResult(result: TestResult) {
    setResults(prev => [result, ...prev].slice(0, 50));
  }

  async function run(label: string, fn: () => Promise<any>) {
    setRunning(label);
    const start = Date.now();
    try {
      const data = await fn();
      addResult({ ok: true, label, data, time: Date.now() - start });
    } catch (e: any) {
      addResult({ ok: false, label, error: e.message, time: Date.now() - start });
    }
    setRunning(null);
  }

  // ── Test functions ────────────────────────────────────────────────────────

  async function testGenerateSite() {
    if (!selectedBiz) return;
    const res = await fetch("/api/generate-site", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-internal-secret": INTERNAL_SECRET },
      body: JSON.stringify({ business_id: selectedBiz.id }),
    });
    return res.json();
  }

  async function testViewPage(page: string) {
    if (!selectedBiz) return;
    const url = `/${page === "home" ? "" : page}`;
    const res = await fetch(`/sites/${selectedBiz.subdomain}${url === "/" ? "" : url}`);
    return { status: res.status, url: `https://${selectedBiz.subdomain}.exsisto.ai${url}`, bytes: (await res.text()).length };
  }

  async function testMockSocialConnect(platform: string) {
    if (!selectedBiz) return;
    // Insert a fake social connection for testing
    const { data, error } = await supabase.from("social_connections").upsert({
      business_id: selectedBiz.id,
      platform,
      access_token: `dev_mock_token_${platform}_${Date.now()}`,
      platform_user_id: `mock_user_${platform}`,
      platform_username: `@${selectedBiz.name.toLowerCase().replace(/\s+/g, "_")}_${platform}`,
      platform_page_id: `mock_page_${platform}_123`,
      platform_page_name: selectedBiz.name,
      scopes: ["mock_scope"],
      connected_at: new Date().toISOString(),
    }, { onConflict: "business_id,platform" }).select();
    return { connected: true, platform, data, error };
  }

  async function testDisconnectSocial(platform: string) {
    if (!selectedBiz) return;
    const { error } = await supabase.from("social_connections")
      .delete().eq("business_id", selectedBiz.id).eq("platform", platform);
    return { disconnected: true, platform, error };
  }

  async function testGetConnections() {
    if (!selectedBiz) return;
    const { data } = await supabase.from("social_connections")
      .select("*").eq("business_id", selectedBiz.id);
    return { connections: data };
  }

  async function testSchedulePost(platform: string) {
    if (!selectedBiz) return;
    const { data: conn } = await supabase.from("social_connections")
      .select("id").eq("business_id", selectedBiz.id).eq("platform", platform).single();
    if (!conn) throw new Error(`No ${platform} connection — connect it first`);

    const scheduled = new Date(Date.now() + 60000).toISOString(); // 1 min from now
    const { data, error } = await supabase.from("social_posts").insert({
      business_id: selectedBiz.id,
      platform,
      caption: `🧪 Test post from ${selectedBiz.name} on ${platform}! This is a dev test scheduled at ${new Date().toLocaleTimeString()}.`,
      image_url: `https://njfulajlqjhukfxmfexv.supabase.co/storage/v1/object/public/industry-images/${selectedBiz.industry}/hero.png`,
      status: "scheduled",
      scheduled_for: scheduled,
      connection_id: conn.id,
    }).select();
    return { scheduled: true, platform, scheduled_for: scheduled, data, error };
  }

  async function testRunCron() {
    const res = await fetch("/api/cron/post-social", {
      method: "POST",
      headers: { "x-cron-secret": CRON_SECRET },
    });
    return res.json();
  }

  async function testAdminGenerate() {
    if (!selectedBiz) return;
    const res = await fetch("/api/admin/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-internal-secret": INTERNAL_SECRET },
      body: JSON.stringify({ email: "matt@amplifyforlawyers.com" }),
    });
    return res.json();
  }

  async function testGenerateBlogs() {
    const res = await fetch("/api/admin/generate-blogs", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-internal-secret": "exsisto-internal-2026" },
      body: JSON.stringify({ email: selectedBusiness?.email || "matt@amplifyforlawyers.com" }),
    });
    const data = await res.json();
    setResult(data);
  }

  async function testGenerateImages() {
    if (!selectedBiz) return;
    const res = await fetch("/api/generate-images", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-internal-secret": INTERNAL_SECRET },
      body: JSON.stringify({
        businessId: selectedBiz.id,
        businessName: selectedBiz.name,
        businessType: selectedBiz.name,
        industry: selectedBiz.industry,
        city: selectedBiz.city,
        tier: "pro",
      }),
    });
    return res.json();
  }

  async function testGetWebsite() {
    if (!selectedBiz) return;
    const { data } = await supabase.from("websites")
      .select("status, template_name, plan, generated_at, services_html, about_html, contact_html, blog_index_html, image_source")
      .eq("business_id", selectedBiz.id).single();
    return {
      ...data,
      has_services: !!data?.services_html,
      has_about: !!data?.about_html,
      has_contact: !!data?.contact_html,
      has_blog: !!data?.blog_index_html,
    };
  }

  async function testPublishSite() {
    if (!selectedBiz) return;
    const { data, error } = await supabase.from("websites")
      .update({ status: "live" }).eq("business_id", selectedBiz.id).select("status");
    return { published: true, data, error };
  }

  async function testUnpublishSite() {
    if (!selectedBiz) return;
    const { data, error } = await supabase.from("websites")
      .update({ status: "ready_for_review" }).eq("business_id", selectedBiz.id).select("status");
    return { unpublished: true, data, error };
  }

  const tabs = [
    { id: "site",   label: "🏗 Site Gen" },
    { id: "pages",  label: "📄 Pages" },
    { id: "social", label: "📱 Social" },
    { id: "cron",   label: "⏱ Cron" },
    { id: "oauth",  label: "🔑 OAuth URLs" },
  ] as const;

  return (
    <div style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace", background: "#0a0a0f", minHeight: "100vh", color: "#e0e0e0", padding: "0" }}>
      {/* Header */}
      <div style={{ background: "#111118", borderBottom: "1px solid #1e1e2e", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ background: "#4648d4", color: "#fff", padding: "4px 10px", borderRadius: "4px", fontSize: "11px", fontWeight: 700, letterSpacing: "1px" }}>DEV</div>
          <span style={{ fontSize: "16px", fontWeight: 700, color: "#fff" }}>Exsisto Developer Panel</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "11px", color: "#666" }}>Business:</span>
          <select
            value={selectedBiz?.id || ""}
            onChange={e => setSelectedBiz(businesses.find(b => b.id === e.target.value) || null)}
            style={{ background: "#1e1e2e", border: "1px solid #333", color: "#fff", padding: "6px 10px", borderRadius: "6px", fontSize: "13px", fontFamily: "inherit" }}
          >
            {businesses.map(b => <option key={b.id} value={b.id}>{b.name} ({b.subdomain})</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", height: "calc(100vh - 57px)" }}>
        {/* Left panel — actions */}
        <div style={{ borderRight: "1px solid #1e1e2e", overflowY: "auto", padding: "16px" }}>
          {/* Tabs */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "20px" }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                style={{ background: activeTab === t.id ? "#1e1e2e" : "transparent", border: activeTab === t.id ? "1px solid #333" : "1px solid transparent", color: activeTab === t.id ? "#fff" : "#888", padding: "8px 12px", borderRadius: "6px", fontSize: "12px", cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}>
                {t.label}
              </button>
            ))}
          </div>

          {selectedBiz && (
            <div style={{ background: "#111118", border: "1px solid #1e1e2e", borderRadius: "8px", padding: "12px", marginBottom: "16px", fontSize: "11px", color: "#666" }}>
              <div style={{ color: "#fff", fontWeight: 700, marginBottom: "6px" }}>{selectedBiz.name}</div>
              <div>{selectedBiz.industry} · {selectedBiz.city}</div>
              <div style={{ marginTop: "4px" }}>
                <a href={`https://${selectedBiz.subdomain}.exsisto.ai`} target="_blank" style={{ color: "#4648d4", textDecoration: "none" }}>
                  ↗ {selectedBiz.subdomain}.exsisto.ai
                </a>
              </div>
            </div>
          )}

          {/* Site Gen Tab */}
          {activeTab === "site" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ fontSize: "10px", color: "#444", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Site Generation</div>
              {[
                { label: "Generate Site (full)", fn: testGenerateSite },
                { label: "Admin Generate Pipeline", fn: testAdminGenerate },
                { label: "Generate Images (Nano Banana)", fn: testGenerateImages },
                { label: "Generate Blog Posts", fn: testGenerateBlogs },
                { label: "Inspect Website Record", fn: testGetWebsite },
                { label: "Publish Site → live", fn: testPublishSite },
                { label: "Unpublish Site → review", fn: testUnpublishSite },
              ].map(({ label, fn }) => (
                <button key={label} onClick={() => run(label, fn)} disabled={!!running}
                  style={{ background: running === label ? "#1a1a4e" : "#1e1e2e", border: "1px solid #333", color: running === label ? "#818cf8" : "#ccc", padding: "10px 12px", borderRadius: "6px", fontSize: "12px", cursor: running ? "default" : "pointer", textAlign: "left", fontFamily: "inherit", opacity: running && running !== label ? 0.5 : 1 }}>
                  {running === label ? "⏳ " : "▶ "}{label}
                </button>
              ))}
            </div>
          )}

          {/* Pages Tab */}
          {activeTab === "pages" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ fontSize: "10px", color: "#444", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Page Serving</div>
              {["home", "services", "about", "contact", "blog"].map(page => (
                <button key={page} onClick={() => run(`View /${page}`, () => testViewPage(page))} disabled={!!running}
                  style={{ background: "#1e1e2e", border: "1px solid #333", color: "#ccc", padding: "10px 12px", borderRadius: "6px", fontSize: "12px", cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}>
                  ▶ View /{page}
                </button>
              ))}
              <div style={{ fontSize: "10px", color: "#444", marginTop: "8px" }}>Opens pages via /sites/[slug] route</div>
              {selectedBiz && (
                <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "8px" }}>
                  {["", "services", "about", "contact", "blog"].map(page => (
                    <a key={page || "home"} href={`https://${selectedBiz.subdomain}.exsisto.ai/${page}`} target="_blank"
                      style={{ color: "#4648d4", fontSize: "11px", textDecoration: "none" }}>
                      ↗ /{page || "(home)"}
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Social Tab */}
          {activeTab === "social" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ fontSize: "10px", color: "#444", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Social Connections (Mock)</div>
              <button onClick={() => run("Get Connections", testGetConnections)} disabled={!!running}
                style={{ background: "#1e1e2e", border: "1px solid #333", color: "#ccc", padding: "10px 12px", borderRadius: "6px", fontSize: "12px", cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}>
                ▶ Get All Connections
              </button>
              {PLATFORMS.map(p => (
                <div key={p.id} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div style={{ fontSize: "11px", color: "#666", padding: "4px 0" }}>{p.emoji} {p.label}</div>
                  <button onClick={() => run(`Mock Connect ${p.label}`, () => testMockSocialConnect(p.id))} disabled={!!running}
                    style={{ background: "#1e1e2e", border: `1px solid ${p.color}33`, color: "#ccc", padding: "8px 12px", borderRadius: "6px", fontSize: "11px", cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}>
                    ▶ Mock Connect
                  </button>
                  <button onClick={() => run(`Schedule Test Post → ${p.label}`, () => testSchedulePost(p.id))} disabled={!!running}
                    style={{ background: "#1e1e2e", border: "1px solid #333", color: "#ccc", padding: "8px 12px", borderRadius: "6px", fontSize: "11px", cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}>
                    ▶ Schedule Test Post
                  </button>
                  <button onClick={() => run(`Disconnect ${p.label}`, () => testDisconnectSocial(p.id))} disabled={!!running}
                    style={{ background: "#1e1e2e", border: "1px solid #ff444433", color: "#f87171", padding: "8px 12px", borderRadius: "6px", fontSize: "11px", cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}>
                    ✕ Disconnect
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Cron Tab */}
          {activeTab === "cron" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ fontSize: "10px", color: "#444", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Cron Jobs</div>
              <button onClick={() => run("Run Post Cron (manual)", testRunCron)} disabled={!!running}
                style={{ background: "#1e1e2e", border: "1px solid #22c55e33", color: "#4ade80", padding: "10px 12px", borderRadius: "6px", fontSize: "12px", cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}>
                ▶ Run Social Post Cron
              </button>
              <div style={{ fontSize: "11px", color: "#555", lineHeight: "1.6", padding: "8px", background: "#111118", borderRadius: "6px", border: "1px solid #1e1e2e" }}>
                Runs normally every hour via Vercel cron. Posts any social_posts where scheduled_for &lt;= now() and status = scheduled.<br/><br/>
                To test end-to-end:<br/>
                1. Mock connect a platform<br/>
                2. Schedule a test post<br/>
                3. Run this cron<br/>
                4. Check result below
              </div>
            </div>
          )}

          {/* OAuth URLs Tab */}
          {activeTab === "oauth" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ fontSize: "10px", color: "#444", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>OAuth URLs (for real accounts)</div>
              <div style={{ fontSize: "11px", color: "#666", marginBottom: "8px" }}>These redirect to the real OAuth flow. Requires env vars to be set.</div>
              {selectedBiz && PLATFORMS.map(p => (
                <a key={p.id} href={`/api/social/connect?platform=${p.id === "google_business" ? "google" : p.id}&business_id=${selectedBiz.id}`}
                  style={{ background: "#1e1e2e", border: `1px solid ${p.color}33`, color: "#ccc", padding: "10px 12px", borderRadius: "6px", fontSize: "12px", textDecoration: "none", display: "block" }}>
                  {p.emoji} Connect {p.label}
                </a>
              ))}
              <div style={{ marginTop: "8px", fontSize: "10px", color: "#444", lineHeight: "1.6" }}>
                Required env vars:<br/>
                META_APP_ID<br/>
                META_APP_SECRET<br/>
                GOOGLE_CLIENT_ID<br/>
                GOOGLE_CLIENT_SECRET<br/>
                TIKTOK_CLIENT_KEY<br/>
                TIKTOK_CLIENT_SECRET
              </div>
            </div>
          )}
        </div>

        {/* Right panel — results */}
        <div style={{ overflowY: "auto", padding: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <div style={{ fontSize: "12px", color: "#666" }}>Results ({results.length})</div>
            <button onClick={() => setResults([])}
              style={{ background: "transparent", border: "1px solid #333", color: "#666", padding: "4px 10px", borderRadius: "4px", fontSize: "11px", cursor: "pointer", fontFamily: "inherit" }}>
              Clear
            </button>
          </div>

          {results.length === 0 && (
            <div style={{ textAlign: "center", padding: "80px 40px", color: "#333" }}>
              <div style={{ fontSize: "32px", marginBottom: "12px" }}>🧪</div>
              <div style={{ fontSize: "14px" }}>Run a test to see results here</div>
            </div>
          )}

          {results.map((r, i) => (
            <div key={i} style={{ background: "#111118", border: `1px solid ${r.ok ? "#22c55e33" : "#ef444433"}`, borderRadius: "8px", marginBottom: "10px", overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", borderBottom: "1px solid #1e1e2e" }}>
                <div style={{ fontSize: "14px" }}>{r.ok ? "✅" : "❌"}</div>
                <div style={{ fontSize: "13px", fontWeight: 600, color: r.ok ? "#4ade80" : "#f87171", flex: 1 }}>{r.label}</div>
                {r.time && <div style={{ fontSize: "11px", color: "#555" }}>{r.time}ms</div>}
              </div>
              <div style={{ padding: "12px 14px" }}>
                <pre style={{ fontSize: "11px", color: r.ok ? "#a3e635" : "#fca5a5", margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-all", maxHeight: "300px", overflowY: "auto" }}>
                  {JSON.stringify(r.data || r.error, null, 2)}
                </pre>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
