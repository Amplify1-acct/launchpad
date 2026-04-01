import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import styles from "./dashboard.module.css";
import MobileNav from "@/components/MobileNav";
import { DeployStatus } from "./DeployStatus";
import { GenerateButton } from "./GenerateButton";

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
    .order("created_at", { ascending: false }).limit(5);

  const { data: socialPosts } = await supabase
    .from("social_posts").select("*").eq("business_id", business.id)
    .order("created_at", { ascending: false }).limit(12);

  const plan = subscription?.plan || "starter";
  const planColors: Record<string, string> = {
    starter: "#2563eb", growth: "#16a34a", pro: "#2563eb", premium: "#9333ea"
  };
  const planColor = planColors[plan] || "#2563eb";

  // Derived stats
  const pendingBlogs = blogPosts?.filter((p: any) => p.status === "pending" || p.status === "draft").length || 0;
  const publishedBlogs = blogPosts?.filter((p: any) => p.status === "published").length || 0;
  const fbPosts = socialPosts?.filter((p: any) => p.platform === "facebook") || [];
  const igPosts = socialPosts?.filter((p: any) => p.platform === "instagram") || [];
  const ttPosts = socialPosts?.filter((p: any) => p.platform === "tiktok") || [];

  const siteStatus = website?.status === "live" ? "live"
    : website?.status === "ready_for_review" ? "review"
    : website?.status === "approved" ? "deploying"
    : "building";

  const now = new Date();
  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}><a href="/">Ex<span>sisto</span></a></div>
        <nav className={styles.nav}>
          <a href="/dashboard" className={`${styles.navItem} ${styles.active}`}><span>⚡</span> Overview</a>
          <a href="/dashboard/website" className={styles.navItem}><span>🌐</span> Website</a>
          <a href="/dashboard/blog" className={styles.navItem}><span>✍️</span> Blog Posts</a>
          <a href="/dashboard/social" className={styles.navItem}><span>📱</span> Social Media</a>
          <a href="/dashboard/settings" className={styles.navItem}><span>⚙️</span> Settings</a>
        </nav>
        <div className={styles.sidebarBottom}>
          <div className={styles.planBadge} style={{ borderColor: planColor, color: planColor }}>
            {plan} plan
          </div>
          <form action="/auth/signout" method="post">
            <button type="submit" className={styles.signOut}>Sign out</button>
          </form>
        </div>
      </aside>

      <main className={styles.main}>

        {/* ── HEADER ─────────────────────────────────────────────────────── */}
        <div className={styles.header}>
          <div>
            <div className={styles.greetingLine}>{greeting}</div>
            <h1 className={styles.greeting}>{business.name}</h1>
            <p className={styles.subGreeting}>
              {business.city}{business.state ? `, ${business.state}` : ""}
              <span className={styles.subDot}>·</span>
              Your digital presence, handled.
            </p>
          </div>
          <div className={styles.headerActions}>
            <GenerateButton businessId={business.id} hasWebsite={!!website} websiteStatus={website?.status || null} />
            {website?.vercel_url && (
              <a href={website.vercel_url} target="_blank" rel="noreferrer" className={styles.viewSiteBtn}>
                View live site ↗
              </a>
            )}
          </div>
        </div>

        {/* ── SITE READY BANNER ──────────────────────────────────────────── */}
        {website?.status === "ready_for_review" && (
          <div className={styles.reviewBanner}>
            <div className={styles.reviewBannerLeft}>
              <div className={styles.reviewBannerTitle}>🎉 Your website is ready to review!</div>
              <div className={styles.reviewBannerSub}>Take a look and approve it to go live.</div>
            </div>
            <a href="/dashboard/preview" className={styles.reviewBannerBtn}>Review & Approve →</a>
          </div>
        )}

        {/* ── DEPLOY STATUS ───────────────────────────────────────────────── */}
        <DeployStatus
          businessId={business.id}
          initialStatus={website?.status || null}
          initialUrl={website?.vercel_url || null}
        />

        {/* ── STATUS STRIP ────────────────────────────────────────────────── */}
        <div className={styles.statusStrip}>
          <a href="/dashboard/website" className={styles.statusPill} style={{ textDecoration: "none" }}>
            <div className={styles.statusPillDot} style={{
              background: siteStatus === "live" ? "#16a34a" : siteStatus === "review" ? "#2563eb" : "#f59e0b"
            }} />
            <span className={styles.statusPillLabel}>Website</span>
            <span className={styles.statusPillValue}>
              {siteStatus === "live" ? "Live" : siteStatus === "review" ? "Needs review" : siteStatus === "deploying" ? "Deploying…" : "Building…"}
            </span>
          </a>

          <div className={styles.statusPillDivider} />

          <a href="/dashboard/blog" className={styles.statusPill} style={{ textDecoration: "none" }}>
            <div className={styles.statusPillDot} style={{
              background: pendingBlogs > 0 ? "#f59e0b" : blogPosts && blogPosts.length > 0 ? "#16a34a" : "#d1d5db"
            }} />
            <span className={styles.statusPillLabel}>Blog</span>
            <span className={styles.statusPillValue}>
              {pendingBlogs > 0 ? `${pendingBlogs} awaiting review` : `${publishedBlogs} published`}
            </span>
          </a>

          <div className={styles.statusPillDivider} />

          <a href="/dashboard/social" className={styles.statusPill} style={{ textDecoration: "none" }}>
            <div className={styles.statusPillDot} style={{
              background: (socialPosts?.length || 0) > 0 ? "#16a34a" : "#d1d5db"
            }} />
            <span className={styles.statusPillLabel}>Social</span>
            <span className={styles.statusPillValue}>
              {(socialPosts?.length || 0) > 0 ? `${socialPosts!.length} posts queued` : "Not set up"}
            </span>
          </a>

          <div className={styles.statusPillDivider} />

          <div className={styles.statusPill}>
            <div className={styles.statusPillDot} style={{ background: "#16a34a" }} />
            <span className={styles.statusPillLabel}>Plan</span>
            <span className={styles.statusPillValue} style={{ color: planColor, fontWeight: 700 }}>
              {plan.charAt(0).toUpperCase() + plan.slice(1)} · Active
            </span>
          </div>
        </div>

        {/* ── MAIN CONTENT GRID ───────────────────────────────────────────── */}
        <div className={styles.contentGrid}>

          {/* WEBSITE CARD */}
          <div className={`${styles.card} ${styles.cardWide}`}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>Website</div>
              <div className={styles.cardHeaderRight}>
                <span className={`${styles.badge} ${
                  siteStatus === "live" ? styles.badgeGreen :
                  siteStatus === "review" ? styles.badgeBlue : styles.badgeAmber
                }`}>
                  {siteStatus === "live" ? "● Live" : siteStatus === "review" ? "● Needs review" : "● Building"}
                </span>
                {website?.custom_html && (
                  <a href="/dashboard/preview" className={styles.cardAction}>
                    {siteStatus === "live" ? "Edit site" : "Review"} →
                  </a>
                )}
              </div>
            </div>

            <div className={styles.websitePreviewWrap}>
              {website?.custom_html ? (
                <a href="/dashboard/preview" className={styles.websitePreviewLink}>
                  <iframe
                    srcDoc={website.custom_html}
                    className={styles.websiteIframe}
                    sandbox="allow-scripts"
                    title="Site preview"
                  />
                  <div className={styles.websitePreviewOverlay}>
                    <span className={styles.websitePreviewCta}>
                      {siteStatus === "live" ? "Edit site →" : "Review & approve →"}
                    </span>
                  </div>
                </a>
              ) : (
                <div className={styles.websitePlaceholder}>
                  <div className={styles.buildingDots}><span /><span /><span /></div>
                  <p>Building your website…</p>
                  <p className={styles.emptyMeta}>Usually takes a few minutes</p>
                </div>
              )}
            </div>

            {(website?.vercel_url || website?.custom_html) && (
              <div className={styles.cardFooter}>
                <span className={styles.cardFooterText}>
                  {website?.vercel_url || "Pending deployment"}
                </span>
                {website?.vercel_url && (
                  <a href={website.vercel_url} target="_blank" rel="noreferrer" className={styles.cardAction}>
                    Visit ↗
                  </a>
                )}
              </div>
            )}
          </div>

          {/* BLOG CARD */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>Blog Posts</div>
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
              <span className={styles.cardFooterText}>
                {plan === "starter" ? "2 posts/month" : plan === "pro" ? "4 posts/month" : "8 posts/month"}
              </span>
            </div>
          </div>

          {/* SOCIAL CARD */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>Social Media</div>
              <a href="/dashboard/social" className={styles.cardAction}>Manage →</a>
            </div>

            <div className={styles.platformList}>
              {[
                { id: "facebook", label: "Facebook", color: "#1877f2", posts: fbPosts },
                { id: "instagram", label: "Instagram", color: "#e1306c", posts: igPosts },
                { id: "tiktok", label: "TikTok", color: "#010101", posts: ttPosts },
              ].map(({ id, label, color, posts }) => (
                <a key={id} href="/dashboard/social" className={styles.platformRow} style={{ textDecoration: "none" }}>
                  <div className={styles.platformIcon} style={{ background: color }}>
                    {id === "facebook" ? "f" : id === "instagram" ? "ig" : "tt"}
                  </div>
                  <div className={styles.platformInfo}>
                    <div className={styles.platformName}>{label}</div>
                    <div className={styles.platformMeta}>
                      {posts.length > 0
                        ? (posts[0] as any).caption?.slice(0, 50) + "…"
                        : "No posts yet"}
                    </div>
                  </div>
                  <div className={styles.platformCount} style={{ color: posts.length > 0 ? "#16a34a" : "#9ca3af" }}>
                    {posts.length} posts
                  </div>
                </a>
              ))}
            </div>

            <div className={styles.cardFooter}>
              <span className={styles.cardFooterText}>
                {plan === "starter" ? "8 posts/month" : plan === "pro" ? "16 posts/month" : "32 posts/month"}
              </span>
              <a href="/dashboard/social" className={styles.cardAction}>View all →</a>
            </div>
          </div>

          {/* QUICK ACTIONS CARD */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>Quick Actions</div>
            </div>

            <div className={styles.actionsList}>
              <a href="/dashboard/preview" className={styles.actionItem}>
                <div className={styles.actionIcon} style={{ background: "#eff6ff" }}>🌐</div>
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
                <div className={styles.actionIcon} style={{ background: "#f0fdf4" }}>✍️</div>
                <div className={styles.actionInfo}>
                  <div className={styles.actionLabel}>
                    {pendingBlogs > 0 ? `Review ${pendingBlogs} blog post${pendingBlogs > 1 ? "s" : ""}` : "View blog posts"}
                  </div>
                  <div className={styles.actionSub}>Approve, edit, or schedule</div>
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
                <div className={styles.actionIcon} style={{ background: "#fafafa" }}>⚙️</div>
                <div className={styles.actionInfo}>
                  <div className={styles.actionLabel}>Business settings</div>
                  <div className={styles.actionSub}>Update your info, hours, contact</div>
                </div>
                <span className={styles.actionArrow}>→</span>
              </a>
            </div>
          </div>

        </div>
      </main>

      <MobileNav />
    </div>
  );
}
