import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase-server";
import { cookies } from "next/headers";
import styles from "@/app/dashboard/dashboard.module.css";
import MobileNav from "@/components/MobileNav";

export const dynamic = "force-dynamic";

const ADMIN_SECRET = process.env.ADMIN_DASHBOARD_SECRET || "exsisto-admin-2026";

export default async function AdminClientDashboard({
  params,
}: {
  params: { business_id: string };
}) {
  // Simple cookie-based auth check
  const cookieStore = cookies();
  const adminToken = cookieStore.get("admin_token")?.value;
  if (adminToken !== ADMIN_SECRET) {
    redirect("/admin");
  }

  const { business_id } = params;
  const supabase = createAdminClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", business_id)
    .single();

  if (!business) redirect("/admin");

  const { data: customer } = await supabase
    .from("customers")
    .select("*")
    .eq("id", business.customer_id)
    .single();

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("customer_id", business.customer_id)
    .single();

  const { data: website } = await supabase
    .from("websites")
    .select("*")
    .eq("business_id", business_id)
    .single();

  const { data: blogPosts } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("business_id", business_id)
    .order("created_at", { ascending: false })
    .limit(4);

  const { data: socialPosts } = await supabase
    .from("social_posts")
    .select("*")
    .eq("business_id", business_id)
    .order("created_at", { ascending: false })
    .limit(12);

  const plan = subscription?.plan || customer?.plan || "starter";
  const siteStatus = website?.status || null;

  const pendingBlogs = (blogPosts || []).filter(
    (p: any) => p.status === "pending" || p.status === "draft"
  ).length;

  const fbPosts = (socialPosts || []).filter((p: any) => p.platform === "facebook");
  const igPosts = (socialPosts || []).filter((p: any) => p.platform === "instagram");
  const ttPosts = (socialPosts || []).filter((p: any) => p.platform === "tiktok");

  const blogFreq: Record<string, string> = {
    starter: "1 post/week",
    pro: "2 posts/week",
    premium: "4 posts/week",
  };
  const socialFreq: Record<string, string> = {
    starter: "—",
    pro: "Social included",
    premium: "Social auto-post",
  };

  const nextPost = (socialPosts || [])
    .filter((p: any) => p.scheduled_for && new Date(p.scheduled_for) > new Date())
    .sort((a: any, b: any) => new Date(a.scheduled_for).getTime() - new Date(b.scheduled_for).getTime())[0];

  const nextPostDate = nextPost
    ? new Date(nextPost.scheduled_for).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : null;

  return (
    <div className={styles.layout}>
      {/* Admin banner */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 9999,
        background: "#1b1b25", color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 20px", fontFamily: "'Inter', sans-serif", fontSize: "12px",
      }}>
        <span>
          <span style={{ color: "#6366f1", fontWeight: 700 }}>ADMIN VIEW</span>
          <span style={{ color: "#9090a8", margin: "0 8px" }}>·</span>
          <span style={{ color: "#fff", fontWeight: 600 }}>{business.name}</span>
          <span style={{ color: "#9090a8", margin: "0 8px" }}>·</span>
          <span style={{ color: "#9090a8" }}>{customer?.email}</span>
        </span>
        <a
          href="/admin"
          style={{
            background: "#2d2d3d", color: "#fff", padding: "5px 14px",
            borderRadius: "6px", textDecoration: "none", fontWeight: 600,
            fontSize: "11px", letterSpacing: "0.3px",
          }}
        >
          ← Back to admin
        </a>
      </div>
      <div style={{ height: "37px" }} />

      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>
          <a href="/">Ex<span>sisto</span></a>
        </div>
        <nav className={styles.nav}>
          <a href={`/admin/clients/${business_id}`} className={`${styles.navItem} ${styles.active}`}>
            <span>⚡</span> Overview
          </a>
          <a href={`/admin/clients/${business_id}/website`} className={styles.navItem}>
            <span>🌐</span> Website
          </a>
          <a href={`/admin/clients/${business_id}/blog`} className={styles.navItem}>
            <span>✍️</span> Blog Posts
            {pendingBlogs > 0 && <span className={styles.navBadge}>{pendingBlogs}</span>}
          </a>
          <a href={`/admin/clients/${business_id}/social`} className={styles.navItem}>
            <span>📱</span> Social Media
          </a>
        </nav>
        <div className={styles.sidebarBottom}>
          <div className={styles.planBadge}>{plan} plan</div>
          <div className={styles.bizName}>{business.name}</div>
          <div className={styles.bizLocation}>
            {business.city}{business.state ? `, ${business.state}` : ""}
          </div>
          <div style={{ fontSize: "11px", color: "#9090a8", marginTop: "6px" }}>{customer?.email}</div>
        </div>
      </aside>

      <main className={styles.main}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.greeting}>
              {business.name}
            </h1>
            <p className={styles.subGreeting}>
              {business.city}{business.state ? `, ${business.state}` : ""} · {plan} plan · {customer?.email}
            </p>
          </div>
          <div className={styles.headerActions}>
            {website?.vercel_url && (
              <a href={website.vercel_url} target="_blank" rel="noreferrer" className={styles.viewSiteBtn}>
                View live site →
              </a>
            )}
            {website?.custom_html && (
              <a
                href={`/api/admin/preview/${business_id}?secret=${ADMIN_SECRET}`}
                target="_blank"
                rel="noreferrer"
                className={styles.editSiteBtn}
              >
                Preview site ↗
              </a>
            )}
          </div>
        </div>

        {/* Status banner */}
        {(!siteStatus || siteStatus === "pending" || siteStatus === "building") && (
          <div className={styles.deployBanner} style={{ background: "linear-gradient(135deg, #f5f2ff, #eeeeff)", borderColor: "#c7c4f0" }}>
            <div>
              <div className={styles.deployBannerTitle}>🔨 {siteStatus === "building" ? "Building…" : "Site not built yet"}</div>
              <div className={styles.deployBannerSub}>Go to the admin dashboard to build and approve this site.</div>
            </div>
            <a href="/admin" className={styles.deployBannerBtn}>Admin dashboard →</a>
          </div>
        )}

        {siteStatus === "admin_review" && (
          <div className={styles.deployBanner}>
            <div>
              <div className={styles.deployBannerTitle}>👀 Ready for your review</div>
              <div className={styles.deployBannerSub}>Preview the site and approve it to send live.</div>
            </div>
            <a
              href={`/api/admin/preview/${business_id}?secret=${ADMIN_SECRET}`}
              target="_blank"
              className={styles.deployBannerBtn}
            >
              Preview & approve →
            </a>
          </div>
        )}

        {/* Stat grid */}
        <div className={styles.statusGrid}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Website</div>
            <div className={styles.statValue}>
              {siteStatus === "live" ? "Live" : siteStatus === "admin_review" ? "Ready" : siteStatus === "building" ? "Building" : "Pending"}
            </div>
            <div className={`${styles.statSub} ${siteStatus === "live" ? styles.statGreen : styles.statAmber}`}>
              {siteStatus === "live" ? "● Published" : siteStatus === "admin_review" ? "● Awaiting approval" : "● In progress"}
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statLabel}>Blog posts</div>
            <div className={styles.statValue}>
              {pendingBlogs > 0 ? `${pendingBlogs} pending` : `${blogPosts?.length || 0} total`}
            </div>
            <div className={`${styles.statSub} ${pendingBlogs > 0 ? styles.statAmber : styles.statGreen}`}>
              {pendingBlogs > 0 ? "● Needs review" : "● Up to date"}
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statLabel}>Social posts</div>
            <div className={styles.statValue}>{socialPosts?.length || 0} queued</div>
            <div className={`${styles.statSub} ${(socialPosts?.length || 0) > 0 ? styles.statGreen : styles.statGray}`}>
              {(socialPosts?.length || 0) > 0 ? "● Scheduled" : "● None yet"}
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statLabel}>Next post</div>
            <div className={styles.statValue}>{nextPostDate || "—"}</div>
            <div className={`${styles.statSub} ${styles.statGray}`}>
              {nextPost ? `${nextPost.platform} · 9am` : "No posts scheduled"}
            </div>
          </div>
        </div>

        <div className={styles.contentGrid}>

          {/* WEBSITE CARD */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>Website</div>
              <span className={`${styles.badge} ${
                siteStatus === "live" ? styles.badgeGreen :
                siteStatus === "admin_review" ? styles.badgeBlue :
                styles.badgeAmber
              }`}>
                {siteStatus === "live" ? "Live" : siteStatus === "admin_review" ? "Ready to review" : siteStatus || "Pending"}
              </span>
            </div>

            {website?.custom_html ? (
              <div className={styles.sitePreviewWrap}>
                <a
                  href={`/api/admin/preview/${business_id}?secret=${ADMIN_SECRET}`}
                  target="_blank"
                  style={{ display: "block", height: "100%" }}
                >
                  <iframe
                    srcDoc={website.custom_html}
                    className={styles.sitePreviewIframe}
                    title="Site preview"
                    sandbox="allow-scripts"
                  />
                  <div className={styles.sitePreviewOverlay} />
                </a>
              </div>
            ) : (
              <div className={styles.sitePreviewEmpty}>
                {siteStatus ? "Site is being built…" : "Not built yet"}
              </div>
            )}

            <div className={styles.siteCardActions}>
              <a
                href={`/api/admin/preview/${business_id}?secret=${ADMIN_SECRET}`}
                target="_blank"
                rel="noreferrer"
                className={styles.btnSecondary}
              >
                Preview ↗
              </a>
              {website?.vercel_url ? (
                <a href={website.vercel_url} target="_blank" rel="noreferrer" className={styles.btnPrimary}>
                  View live site →
                </a>
              ) : (
                <a href="/admin" className={styles.btnPrimary}>Build in admin →</a>
              )}
            </div>
          </div>

          {/* BLOG CARD */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>Blog posts</div>
              <div className={styles.cardHeaderRight}>
                {pendingBlogs > 0 && (
                  <span className={`${styles.badge} ${styles.badgeAmber}`}>{pendingBlogs} pending</span>
                )}
              </div>
            </div>

            {blogPosts && blogPosts.length > 0 ? (
              <div className={styles.postList}>
                {blogPosts.slice(0, 4).map((post: any) => (
                  <div key={post.id} className={styles.postItem}>
                    <div className={`${styles.postStatusDot} ${
                      post.status === "published" ? styles.dotGreen :
                      post.status === "pending" ? styles.dotAmber : styles.dotGray
                    }`} />
                    <div className={styles.postInfo}>
                      <div className={styles.postTitle}>{post.title}</div>
                      <div className={styles.postMeta}>
                        {post.status === "published" ? "Published" : post.status === "pending" ? "Pending" : post.status || "Draft"}
                        {post.word_count ? ` · ~${post.word_count} words` : ""}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>✍️</div>
                <p>No blog posts yet.</p>
              </div>
            )}

            <div className={styles.cardFooter}>
              <span className={styles.cardFooterText}>{blogFreq[plan] || "1 post/week"}</span>
            </div>
          </div>

          {/* SOCIAL CARD */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>Social media</div>
            </div>
            <div className={styles.platformList}>
              {[
                { id: "facebook",  label: "Facebook",  color: "#1877f2", abbr: "f",  posts: fbPosts },
                { id: "instagram", label: "Instagram", color: "#e1306c", abbr: "ig", posts: igPosts },
                { id: "tiktok",    label: "TikTok",    color: "#010101", abbr: "tt", posts: ttPosts },
              ].map(({ id, label, color, abbr, posts }) => (
                <div key={id} className={styles.platformRow}>
                  <div className={styles.platformIcon} style={{ background: color }}>{abbr}</div>
                  <div className={styles.platformInfo}>
                    <div className={styles.platformName}>{label}</div>
                    <div className={styles.platformMeta}>
                      {posts.length > 0 ? `${posts.length} posts scheduled` : "No posts yet"}
                    </div>
                  </div>
                  <div className={styles.platformCount} style={{ color: posts.length > 0 ? "#16a34a" : "#9090a8" }}>
                    {posts.length > 0 ? "●" : "○"}
                  </div>
                </div>
              ))}
            </div>
            <div className={styles.cardFooter}>
              <span className={styles.cardFooterText}>{socialFreq[plan] || "—"}</span>
            </div>
          </div>

          {/* QUICK INFO CARD */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>Client info</div>
            </div>
            <div className={styles.actionsList}>
              <div className={styles.actionItem}>
                <div className={styles.actionIcon} style={{ background: "#f0fdf4" }}>📧</div>
                <div className={styles.actionInfo}>
                  <div className={styles.actionLabel}>{customer?.email || "—"}</div>
                  <div className={styles.actionSub}>Account email</div>
                </div>
              </div>
              {business.phone && (
                <div className={styles.actionItem}>
                  <div className={styles.actionIcon} style={{ background: "#fff7ed" }}>📞</div>
                  <div className={styles.actionInfo}>
                    <div className={styles.actionLabel}>{business.phone}</div>
                    <div className={styles.actionSub}>Phone</div>
                  </div>
                </div>
              )}
              {business.custom_domain && (
                <div className={styles.actionItem}>
                  <div className={styles.actionIcon} style={{ background: "#f5f2ff" }}>🌐</div>
                  <div className={styles.actionInfo}>
                    <div className={styles.actionLabel}>{business.custom_domain}</div>
                    <div className={styles.actionSub}>Custom domain</div>
                  </div>
                </div>
              )}
              {website?.vercel_url && (
                <div className={styles.actionItem}>
                  <div className={styles.actionIcon} style={{ background: "#f0fdf4" }}>🔗</div>
                  <div className={styles.actionInfo}>
                    <div className={styles.actionLabel}>{website.vercel_url.replace("https://", "")}</div>
                    <div className={styles.actionSub}>Live URL</div>
                  </div>
                </div>
              )}
              <div className={styles.actionItem}>
                <div className={styles.actionIcon} style={{ background: "#eeeeff" }}>📦</div>
                <div className={styles.actionInfo}>
                  <div className={styles.actionLabel}>{plan} plan</div>
                  <div className={styles.actionSub}>
                    {subscription?.status || "active"} · since {new Date(subscription?.created_at || business.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
