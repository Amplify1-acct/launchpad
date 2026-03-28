import styles from "./dashboard.module.css";
import { DeployStatus } from "./DeployStatus";
import { GenerateButton } from "./GenerateButton";

export default async function DashboardPage() {
  // ── DEV MODE: auth bypassed, using mock data ──────────────────────────────
  const business = {
    id: "dev-business-id",
    name: "Smith & Jones Law",
    industry: "Law Firm",
    city: "Newark",
    state: "NJ",
    phone: "(973) 555-0100",
    email: "hello@smithjones.com",
    description: "Smith & Jones Law is a New Jersey business law firm.",
    tagline: "Strategic Counsel for NJ Businesses",
    emoji: "⚖️",
    website_url: null,
    customer_id: "dev-customer-id",
  };
  const subscription = { plan: "growth" };
  const blogPosts: any[] = [];
  const socialPosts: any[] = [];
  const website: any = {
    meta_title: "Smith & Jones Law | Business Law in Newark, NJ",
    meta_description: "Expert business law services for New Jersey entrepreneurs.",
    keywords: ["business law Newark NJ", "contract attorney NJ", "LLC formation NJ"],
    status: "live",
    vercel_url: "https://exsisto.ai/preview",
  };
  // ── END DEV MODE ──────────────────────────────────────────────────────────

  const planColors: Record<string, string> = { starter: "#2563eb", growth: "#16a34a", premium: "#9333ea" };
  const planColor = planColors[subscription?.plan || "starter"];

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}><a href="/">Ex<span>sisto</span></a></div>
        <nav className={styles.nav}>
          <a href="/dashboard" className={`${styles.navItem} ${styles.active}`}><span>⚡</span> Overview</a>
          <a href="/dashboard/website" className={styles.navItem}><span>🌐</span> Website</a>
          <a href="/dashboard/blog" className={styles.navItem}><span>✍️</span> Blog Posts</a>
          <a href="/dashboard/social" className={styles.navItem}><span>📱</span> Social Media</a>
          <a href="/dashboard/seo" className={styles.navItem}><span>🔍</span> SEO</a>
          <a href="/dashboard/settings" className={styles.navItem}><span>⚙️</span> Settings</a>
        </nav>
        <div className={styles.sidebarBottom}>
          <div className={styles.planBadge} style={{ borderColor: planColor, color: planColor }}>
            {subscription?.plan || "starter"} plan
          </div>
          <form action="/auth/signout" method="post">
            <button type="submit" className={styles.signOut}>Sign out</button>
          </form>
        </div>
      </aside>

      <main className={styles.main}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.greeting}>{business.emoji || "🏆"} {business.name}</h1>
            <p className={styles.subGreeting}>Your digital presence, handled.</p>
          </div>
          <div className={styles.headerActions}>
            <GenerateButton businessId={business.id} hasWebsite={!!website} websiteStatus={website?.status || null} />
            {website?.vercel_url && (
              <a href={website.vercel_url} target="_blank" rel="noreferrer" className={styles.viewSiteBtn}>View live site →</a>
            )}
          </div>
        </div>

        {/* Site ready for review banner */}
        {website?.status === "ready_for_review" && (
          <div style={{
            background: "linear-gradient(135deg, #0066ff 0%, #0052cc 100%)",
            borderRadius: "16px",
            padding: "20px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "24px",
            boxShadow: "0 4px 20px rgba(0,102,255,0.25)",
            flexWrap: "wrap",
            gap: "16px",
          }}>
            <div>
              <div style={{ fontSize: "16px", fontWeight: 700, color: "#fff", marginBottom: "4px" }}>
                🎉 Your website is ready to review!
              </div>
              <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.75)" }}>
                We built your site using your business info. Take a look and approve it to go live.
              </div>
            </div>
            <a
              href="/dashboard/preview"
              style={{
                background: "#fff",
                color: "#0066ff",
                fontWeight: 700,
                fontSize: "14px",
                padding: "10px 24px",
                borderRadius: "8px",
                textDecoration: "none",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              Review & Approve →
            </a>
          </div>
        )}

        {/* Live deployment status */}
        <DeployStatus
          businessId={business.id}
          initialStatus={website?.status || null}
          initialUrl={website?.vercel_url || null}
        />

        <div className={styles.statusGrid}>
          {[
            { icon: "🌐", label: "Website", detail: website?.status === "live" ? "Live & published" : "Building your site...", active: website?.status === "live", color: "#2563eb" },
            { icon: "✍️", label: "Blog posts", detail: `${blogPosts?.length || 0} posts ready`, active: (blogPosts?.length || 0) > 0, color: "#16a34a" },
            { icon: "📱", label: "Social media", detail: `${socialPosts?.length || 0} posts queued`, active: (socialPosts?.length || 0) > 0, color: "#f59e0b" },
            { icon: "🔍", label: "On-page SEO", detail: website?.meta_title ? "Optimized" : "Generating...", active: !!website?.meta_title, color: "#f97316" },
          ].map((card) => (
            <div key={card.label} className={styles.statusCard}>
              <div className={styles.statusIcon} style={{ background: `${card.color}15` }}>{card.icon}</div>
              <div className={styles.statusInfo}>
                <div className={styles.statusLabel}>{card.label}</div>
                <div className={styles.statusDetail}>{card.detail}</div>
              </div>
              <div className={styles.statusDot} style={{ background: card.active ? "#16a34a" : "#f59e0b" }} />
            </div>
          ))}
        </div>

        <div className={styles.contentGrid}>
          {/* WEBSITE */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>🌐 Your website</div>
              <span className={`${styles.badge} ${website?.status === "live" ? styles.badgeGreen : styles.badgeAmber}`}>
                {website?.status || "Pending"}
              </span>
            </div>
            <div className={styles.websitePreview}>
              {website?.hero_image_url ? (
                <div className={styles.websiteThumb} style={{ backgroundImage: `url(${website.hero_image_url})` }} />
              ) : (
                <div className={styles.websitePlaceholder}>
                  <div className={styles.buildingDots}><span /><span /><span /></div>
                  <p>Building your website...</p>
                </div>
              )}
            </div>
            <div className={styles.cardFooter}>
              <span className={styles.cardFooterText}>{business.name.toLowerCase().replace(/[^a-z0-9]/g, "")}.com</span>
            </div>
          </div>

          {/* BLOG */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>✍️ Blog posts</div>
              <span className={`${styles.badge} ${styles.badgeGreen}`}>{blogPosts?.length || 0} ready</span>
            </div>
            {blogPosts && blogPosts.length > 0 ? (
              <div className={styles.postList}>
                {blogPosts.map((post, i) => (
                  <div key={post.id} className={styles.postItem}>
                    <div className={styles.postNum}>{i + 1}</div>
                    <div className={styles.postInfo}>
                      <div className={styles.postTitle}>{post.title}</div>
                      <div className={styles.postMeta}>~{post.word_count || 800} words · <span className={`${styles.postStatus} ${styles.amber}`}>{post.status}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>✍️</div>
                <p>Your first blog posts are being written.</p>
                <p className={styles.emptyMeta}>SEO-optimized, published every Monday.</p>
              </div>
            )}
          </div>

          {/* SOCIAL */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>📱 Social media</div>
              <span className={`${styles.badge} ${styles.badgeAmber}`}>{socialPosts?.length || 0} queued</span>
            </div>
            {socialPosts && socialPosts.length > 0 ? (
              <div className={styles.socialGrid}>
                {(["facebook", "instagram", "linkedin"] as const).map((platform) => {
                  const posts = socialPosts.filter(p => p.platform === platform);
                  const colors: Record<string, string> = { facebook: "#1877f2", instagram: "#e1306c", linkedin: "#0a66c2" };
                  return (
                    <div key={platform} className={styles.platformCard}>
                      <div className={styles.platformHeader} style={{ background: colors[platform] }}>
                        <span>{platform}</span>
                        <span className={styles.platformCount}>{posts.length} posts</span>
                      </div>
                      {posts[0] && <div className={styles.platformCaption}>{posts[0].caption}</div>}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>📱</div>
                <p>Setting up your social channels.</p>
                <p className={styles.emptyMeta}>Facebook, Instagram & LinkedIn — ready to post.</p>
              </div>
            )}
          </div>

          {/* SEO */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>🔍 On-page SEO</div>
              <span className={`${styles.badge} ${website?.meta_title ? styles.badgeGreen : styles.badgeAmber}`}>
                {website?.meta_title ? "Optimized" : "Pending"}
              </span>
            </div>
            {website?.meta_title ? (
              <div className={styles.seoList}>
                <div className={styles.seoItem}><div className={styles.seoItemCheck}>✓</div><div><div className={styles.seoItemLabel}>Meta title</div><div className={styles.seoItemValue}>{website.meta_title}</div></div></div>
                {website.meta_description && <div className={styles.seoItem}><div className={styles.seoItemCheck}>✓</div><div><div className={styles.seoItemLabel}>Meta description</div><div className={styles.seoItemValue}>{website.meta_description}</div></div></div>}
                {website.keywords && <div className={styles.seoItem}><div className={styles.seoItemCheck}>✓</div><div><div className={styles.seoItemLabel}>Keywords</div><div className={styles.seoKeywords}>{(website.keywords as string[]).map((kw: string) => <span key={kw} className={styles.seoKeyword}>{kw}</span>)}</div></div></div>}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>🔍</div>
                <p>Generating your SEO setup.</p>
                <p className={styles.emptyMeta}>Meta titles, descriptions, schema & keywords.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
