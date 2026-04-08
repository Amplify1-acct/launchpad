import styles from "@/app/dashboard/dashboard.module.css";

export default function SocialPage() {
  return (
    <div className={styles.pageContent}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Social Media</h1>
        <p className={styles.pageSubtitle}>Automated posting to Facebook, Instagram, and TikTok</p>
      </div>

      <div className={styles.card} style={{ maxWidth: 600, margin: "0 auto", textAlign: "center", padding: "60px 40px" }}>
        <div style={{ fontSize: 48, marginBottom: 20 }}>📱</div>
        <div style={{
          display: "inline-block",
          background: "#f0f9ff",
          color: "#0ea5e9",
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: "1.5px",
          textTransform: "uppercase",
          padding: "4px 12px",
          borderRadius: 100,
          marginBottom: 20,
        }}>
          Coming Soon
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: "#1b1b25", marginBottom: 12 }}>
          Social Media Posting
        </h2>
        <p style={{ fontSize: 14, color: "#9090a8", lineHeight: 1.7, marginBottom: 32, maxWidth: 400, margin: "0 auto 32px" }}>
          We&apos;re putting the finishing touches on automated social posting to Facebook, Instagram, and TikTok.
          Your AI-generated posts will go live on all platforms automatically — no login needed.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 320, margin: "0 auto" }}>
          {[
            { icon: "📘", label: "Facebook", desc: "Posts + Stories" },
            { icon: "📸", label: "Instagram", desc: "Posts + Reels" },
            { icon: "🎵", label: "TikTok", desc: "Short videos" },
          ].map(p => (
            <div key={p.label} style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 16px",
              border: "1.5px solid #ede9f8",
              borderRadius: 10,
              background: "#fafafa",
            }}>
              <span style={{ fontSize: 20 }}>{p.icon}</span>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1b1b25" }}>{p.label}</div>
                <div style={{ fontSize: 11, color: "#9090a8" }}>{p.desc}</div>
              </div>
              <div style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, color: "#9090a8", background: "#f5f5f5", padding: "2px 8px", borderRadius: 100 }}>
                SOON
              </div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 12, color: "#c0c0d0", marginTop: 32 }}>
          We&apos;ll notify you as soon as social posting is available.
        </p>
      </div>
    </div>
  );
}
