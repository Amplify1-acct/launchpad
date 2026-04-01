import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import styles from "./dashboard.module.css";
import MobileNav from "@/components/MobileNav";
import { DeployStatus } from "./DeployStatus";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: customer } = await supabase
    .from("customers").select("*").eq("user_id", user.id).single();
  if (!customer) redirect("/onboarding");

  const { data: business } = await supabase
    .from("businesses").select("*").eq("customer_id", customer.id).single();
  if (!business) redirect("/onboarding");

  const { data: subscription } = await supabase
    .from("subscriptions").select("*").eq("customer_id", customer.id).single();

  const { data: website } = await supabase
    .from("websites").select("*").eq("business_id", business.id).single();

  const { data: blogPosts } = await supabase
    .from("blog_posts").select("*").eq("business_id", business.id)
    .order("created_at", { ascending: false }).limit(4);

  const { data: socialPosts } = await supabase
    .from("social_posts").select("*").eq("business_id", business.id)
    .order("created_at", { ascending: false }).limit(12);

  const plan = subscription?.plan || "starter";
  const siteStatus = website?.status || null;

  const pendingBlogs = (blogPosts || []).filter(
    (p: any) => p.status === "pending" || p.status === "draft"
  ).length;

  const fbPosts = (socialPosts || []).filter((p: any) => p.platform === "facebook");
  const igPosts = (socialPosts || []).filter((p: any) => p.platform === "instagram");
  const ttPosts = (socialPosts || []).filter((p: any) => p.platform === "tiktok");

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const blogFreq: Record<string, string> = { starter: "2 posts/month", pro: "4 posts/month", premium: "8 posts/month" };
  const socialFreq: Record<string, string> = { starter: "8 posts/month", pro: "16 posts/month", premium: "32 posts/month" };

  const nextPost = (socialPosts || [])
    .filter((p: any) => p.scheduled_for && new Date(p.scheduled_for) > new Date())
    .sort((a: any, b: any) => new Date(a.scheduled_for).getTime() - new Date(b.scheduled_for).getTime())[0];

  const nextPostDate = nextPost
    ? new Date(nextPost.scheduled_for).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : null;

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>
          <a href="/">Ex<span>sisto</span></a>
        </div>
        <nav className={styles.nav}>
          <a href="/dashboard" className={`${styles.navItem} ${styles.active}`}>
            <span>⚡</span> Overview
          </a>
          <a href="/dashboard/website" className={styles.navItem}>
            <span>🌐</span> Website
          </a>
          <a href="/dashboard/blog" className={styles.navItem}>
            <span>✍️</span> Blog Posts
            {pendingBlogs > 0 && <span className={styles.navBadge}>{pendingBlogs}</span>}
          </a>
          <a href="/dashboard/social" className={styles.navItem}>
            <span>📱</span> Social Media
          </a>
          <a href="/dashboard/settings" className={styles.navItem}>
            <span>⚙️</span> Settings
          </a>
        </nav>
        <div className={styles.sidebarBottom}>
          <div className={styles.planBadge}>{plan} plan</div>
          {plan === "starter" && (
            <a href="mailto:support@exsisto.ai?subject=Upgrade to Pro" style={{
              display: "block", marginTop: "8px", marginBottom: "4px",
              background: "linear-gradient(135deg, #4648d4, #6366f1)",
              color: "#fff", borderRadius: "8px", padding: "8px 12px",
              fontSize: "11px", fontWeight: 700, textDecoration: "none",
              textAlign: "center", letterSpacing: "0.3px",
            }}>
              ✦ Upgrade to Pro →
            </a>
          )}
          <div className={styles.bizName}>{business.name}</div>
          <div className={styles.bizLocation}>
            {business.city}{business.state ? `, ${business.state}` : ""}
          </div>
          <form action="/auth/signout" method="post">
            <button type="submit" className={styles.signOut}>Sign out</button>
          </form>
        </div>
      </aside>

      <main className={styles.main}>

        <div className={styles.header}>
          <div>
            <h1 className={styles.greeting}>{greeting}! 👋</h1>
            <p className={styles.subGreeting}>
              {business.name} · {business.city}{business.state ? `, ${business.state}` : ""} · {plan} plan
            </p>
          </div>
          <div className={styles.headerActions}>
            {website?.vercel_url && (
              <a href={website.vercel_url} target="_blank" rel="noreferrer" className={styles.viewSiteBtn}>
                View live site →
              </a>
            )}
            <a href="/dashboard/preview" className={styles.editSiteBtn}>
              {siteStatus === "live" ? "Edit website" : "Review website"}
            </a>
          </div>
        </div>

        {pendingBlogs > 0 && (
          <div className={styles.alertBanner}>
            <div className={styles.alertDot} />
            <div className={styles.alertText}>
              {pendingBlogs} blog post{pendingBlogs > 1 ? "s are" : " is"} ready for your review
            </div>
            <a href="/dashboard/blog" className={styles.alertBtn}>Review now →</a>
          </div>
        )}

        {siteStatus === "ready_for_review" && (
          <div className={styles.deployBanner}>
            <div>
              <div className={styles.deployBannerTitle}>🎉 Your website is ready to review!</div>
              <div className={styles.deployBannerSub}>
                We built your site using your business info. Take a look and approve it to go live.
              </div>
            </div>
            <a href="/dashboard/preview" className={styles.deployBannerBtn}>Review & Approve →</a>
          </div>
        )}

        <DeployStatus
          businessId={business.id}
          initialStatus={siteStatus}
          initialUrl={website?.vercel_url || null}
        />

        <div className={styles.statusGrid}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Website</div>
            <div className={styles.statValue}>
              {siteStatus === "live" ? "Live" : siteStatus === "ready_for_review" ? "Ready" : "Building"}
            </div>
            <div className={`${styles.statSub} ${siteStatus === "live" ? styles.statGreen : styles.statAmber}`}>
              {siteStatus === "live" ? "● Published" : siteStatus === "ready_for_review" ? "● Awaiting review" : "● In progress"}
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statLabel}>Blog posts</div>
            <div className={styles.statValue}>
              {pendingBlogs > 0 ? `${pendingBlogs} ready` : `${blogPosts?.length || 0} total`}
            </div>
            <div className={`${styles.statSub} ${pendingBlogs > 0 ? styles.statAmber : styles.statGreen}`}>
              {pendingBlogs > 0 ? "● Awaiting review" : "● All approved"}
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

          {/* WEBSITE */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>Your website</div>
              <span className={`${styles.badge} ${
                siteStatus === "live" ? styles.badgeGreen :
                siteStatus === "ready_for_review" ? styles.badgeBlue :
                styles.badgeAmber
              }`}>
                {siteStatus === "live" ? "Live" :
                 siteStatus === "ready_for_review" ? "Ready to review" :
                 siteStatus || "Building"}
              </span>
            </div>

            {website?.custom_html ? (
              <div className={styles.sitePreviewWrap}>
                <a href="/dashboard/preview" style={{ display: "block", height: "100%" }}>
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
                {siteStatus ? "Your site is being built…" : "No site yet"}
              </div>
            )}

            <div className={styles.siteCardActions}>
              <a href="/dashboard/preview" className={styles.btnSecondary}>Request changes</a>
              {website?.vercel_url ? (
                <a href={website.vercel_url} target="_blank" rel="noreferrer" className={styles.btnPrimary}>
                  View live site →
                </a>
              ) : (
                <a href="/dashboard/preview" className={styles.btnPrimary}>
                  {siteStatus === "ready_for_review" ? "Review & approve →" : "Preview →"}
                </a>
              )}
            </div>
          </div>

          {/* BLOG */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>Blog posts</div>
              <div className={styles.cardHeaderRight}>
                {pendingBlogs > 0 && (
                  <span className={`${styles.badge} ${styles.badgeAmber}`}>
                    {pendingBlogs} to review
                  </span>
                )}
                <a href="/dashboard/blog" className={styles.cardAction}>Manage →</a>
              </div>
            </div>

            {blogPosts && blogPosts.length > 0 ? (
              <div className={styles.postList}>
                {blogPosts.slice(0, 4).map((post: any) => (
                  <div key={post.id} className={styles.postItem}>
                    <div className={`${styles.postStatusDot} ${
                      post.status === "published" ? styles.dotGreen :
                      post.status === "pending" || post.status === "draft" ? styles.dotAmber :
                      styles.dotGray
                    }`} />
                    <div className={styles.postInfo}>
                      <div className={styles.postTitle}>{post.title}</div>
                      <div className={styles.postMeta}>
                        {post.status === "published" ? "Published" :
                         post.status === "pending" ? "Awaiting review" :
                         post.status || "Draft"}
                        {post.word_count ? ` · ~${post.word_count} words` : ""}
                      </div>
                    </div>
                    {(post.status === "pending" || post.status === "draft") && (
                      <a href="/dashboard/blog" className={styles.postReviewBtn}>Review</a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>✍️</div>
                <p>Your first blog posts are being written.</p>
                <p className={styles.emptyMeta}>SEO-optimized, published weekly.</p>
              </div>
            )}

            <div className={styles.cardFooter}>
              <span className={styles.cardFooterText}>{blogFreq[plan] || "2 posts/month"}</span>
            </div>
          </div>

          {/* SOCIAL */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>Social media</div>
              <a href="/dashboard/social" className={styles.cardAction}>Manage →</a>
            </div>

            <div className={styles.platformList}>
              {[
                { id: "facebook",  label: "Facebook",  color: "#1877f2", abbr: "f",  posts: fbPosts },
                { id: "instagram", label: "Instagram", color: "#e1306c", abbr: "ig", posts: igPosts },
                { id: "tiktok",    label: "TikTok",    color: "#010101", abbr: "tt", posts: ttPosts },
              ].map(({ id, label, color, abbr, posts }) => (
                <a key={id} href="/dashboard/social" className={styles.platformRow}>
                  <div className={styles.platformIcon} style={{ background: color }}>{abbr}</div>
                  <div className={styles.platformInfo}>
                    <div className={styles.platformName}>{label}</div>
                    <div className={styles.platformMeta}>
                      {posts.length > 0 ? `${posts.length} posts scheduled` : "No posts yet"}
                    </div>
                  </div>
                  <div className={styles.platformCount}
                    style={{ color: posts.length > 0 ? "#16a34a" : "#9090a8" }}>
                    {posts.length > 0 ? "●" : "○"}
                  </div>
                </a>
              ))}
            </div>

            <div className={styles.cardFooter}>
              <span className={styles.cardFooterText}>{socialFreq[plan] || "8 posts/month"}</span>
              <a href="/dashboard/social" className={styles.cardAction}>View all →</a>
            </div>
          </div>

          {/* QUICK ACTIONS */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>Quick actions</div>
            </div>
            <div className={styles.actionsList}>
              <a href="/dashboard/preview" className={styles.actionItem}>
                <div className={styles.actionIcon} style={{ background: "#eeeeff" }}>🌐</div>
                <div className={styles.actionInfo}>
                  <div className={styles.actionLabel}>
                    {siteStatus === "live" ? "Edit your website" : "Review your website"}
                  </div>
                  <div className={styles.actionSub}>
                    {siteStatus === "live" ? "Request changes or push updates" : "Approve to go live"}
                  </div>
                </div>
                <span className={styles.actionArrow}>→</span>
              </a>

              <a href="/dashboard/blog" className={styles.actionItem}>
                <div className={styles.actionIcon} style={{ background: "#fef3c7" }}>✍️</div>
                <div className={styles.actionInfo}>
                  <div className={styles.actionLabel}>
                    {pendingBlogs > 0
                      ? `Review ${pendingBlogs} blog post${pendingBlogs > 1 ? "s" : ""}`
                      : "View blog posts"}
                  </div>
                  <div className={styles.actionSub}>Approve, edit, or request changes</div>
                </div>
                {pendingBlogs > 0 && <span className={styles.actionBadge}>{pendingBlogs}</span>}
                <span className={styles.actionArrow}>→</span>
              </a>

              <a href="/dashboard/social" className={styles.actionItem}>
                <div className={styles.actionIcon} style={{ background: "#fdf4ff" }}>📱</div>
                <div className={styles.actionInfo}>
                  <div className={styles.actionLabel}>Manage social posts</div>
                  <div className={styles.actionSub}>Facebook, Instagram & TikTok</div>
                </div>
                <span className={styles.actionArrow}>→</span>
              </a>

              <a href="/dashboard/settings" className={styles.actionItem}>
                <div className={styles.actionIcon} style={{ background: "#f5f2ff" }}>⚙️</div>
                <div className={styles.actionInfo}>
                  <div className={styles.actionLabel}>Business settings</div>
                  <div className={styles.actionSub}>Update your info, hours, contact</div>
                </div>
                <span className={styles.actionArrow}>→</span>
              </a>
            </div>
          </div>

          {/* Upgrade card for Starter plan */}
          {plan === "starter" && (
            <div className={styles.card} style={{ borderColor: "#c7c4f0", background: "linear-gradient(135deg, #f5f2ff, #eeeeff)" }}>
              <div style={{ padding: "20px 22px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#4648d4", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>You're on Starter</div>
                <div style={{ fontSize: "16px", fontWeight: 800, color: "#1b1b25", marginBottom: "8px" }}>Unlock a custom AI-designed website</div>
                <p style={{ fontSize: "12px", color: "#6b6b8a", lineHeight: 1.6, marginBottom: "16px" }}>
                  Pro and Premium plans use Stitch AI to generate a fully custom website design — unique to your business, not a template. Plus more blog posts, more social content, and priority support.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "16px" }}>
                  {[
                    { plan: "Pro", price: "$299/mo", features: ["Custom Stitch AI design", "4 blog posts/month", "16 social posts/month"] },
                    { plan: "Premium", price: "$599/mo", features: ["Custom Stitch AI design", "8 blog posts/month", "32 social posts/month"] },
                  ].map(p => (
                    <div key={p.plan} style={{ background: "#fff", borderRadius: "10px", padding: "14px", border: "1px solid #ede9f8" }}>
                      <div style={{ fontSize: "13px", fontWeight: 800, color: "#1b1b25" }}>{p.plan}</div>
                      <div style={{ fontSize: "16px", fontWeight: 800, color: "#4648d4", margin: "2px 0 8px" }}>{p.price}</div>
                      {p.features.map(f => (
                        <div key={f} style={{ fontSize: "11px", color: "#6b6b8a", marginBottom: "3px" }}>✓ {f}</div>
                      ))}
                    </div>
                  ))}
                </div>
                <a href="mailto:support@exsisto.ai?subject=Upgrade my plan" style={{
                  display: "block", textAlign: "center",
                  background: "#4648d4", color: "#fff",
                  padding: "11px", borderRadius: "8px",
                  fontSize: "13px", fontWeight: 700, textDecoration: "none",
                }}>
                  Upgrade my plan →
                </a>
              </div>
            </div>
          )}

        </div>
      </main>

      <MobileNav />
    </div>
  );
}


