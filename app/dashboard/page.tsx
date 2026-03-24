import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import styles from "./dashboard.module.css";

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch customer + business data
  const { data: customer } = await supabase
    .from("customers")
    .select("*, businesses(*), subscriptions(*)")
    .eq("user_id", user.id)
    .single();

  const business = customer?.businesses?.[0] || null;
  const subscription = customer?.subscriptions?.[0] || null;

  // If no business yet, redirect to onboarding
  if (!business) redirect("/onboarding");

  // Fetch deliverables
  const { data: blogPosts } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: socialPosts } = await supabase
    .from("social_posts")
    .select("*")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false })
    .limit(6);

  const { data: website } = await supabase
    .from("websites")
    .select("*")
    .eq("business_id", business.id)
    .single();

  const { data: jobs } = await supabase
    .from("generation_jobs")
    .select("*")
    .eq("business_id", business.id);

  const planColors: Record<string, string> = {
    starter: "#2563eb",
    growth: "#16a34a",
    premium: "#9333ea",
  };
  const planColor = planColors[subscription?.plan || "starter"];

  return (
    <div className={styles.layout}>
      {/* SIDEBAR */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>
          <a href="/">Launch<span>Pad</span></a>
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
          </a>
          <a href="/dashboard/social" className={styles.navItem}>
            <span>📱</span> Social Media
          </a>
          <a href="/dashboard/seo" className={styles.navItem}>
            <span>🔍</span> SEO
          </a>
          <a href="/dashboard/settings" className={styles.navItem}>
            <span>⚙️</span> Settings
          </a>
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

      {/* MAIN */}
      <main className={styles.main}>
        {/* HEADER */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.greeting}>
              {business.emoji || "🏆"} {business.name}
            </h1>
            <p className={styles.subGreeting}>Your digital presence, handled.</p>
          </div>
          <div className={styles.headerActions}>
            {website?.vercel_url && (
              <a href={website.vercel_url} target="_blank" rel="noreferrer" className={styles.viewSiteBtn}>
                View live site →
              </a>
            )}
          </div>
        </div>

        {/* STATUS CARDS */}
        <div className={styles.statusGrid}>
          {[
            {
              icon: "🌐",
              label: "Website",
              status: website?.status || "pending",
              detail: website?.status === "live" ? "Live & published" : "Building your site...",
              color: "#2563eb",
            },
            {
              icon: "✍️",
              label: "Blog posts",
              status: (blogPosts?.length || 0) > 0 ? "active" : "pending",
              detail: `${blogPosts?.length || 0} posts ready`,
              color: "#16a34a",
            },
            {
              icon: "📱",
              label: "Social media",
              status: (socialPosts?.length || 0) > 0 ? "active" : "pending",
              detail: `${socialPosts?.length || 0} posts queued`,
              color: "#f59e0b",
            },
            {
              icon: "🔍",
              label: "On-page SEO",
              status: website?.meta_title ? "active" : "pending",
              detail: website?.meta_title ? "Optimized" : "Generating...",
              color: "#f97316",
            },
          ].map((card) => (
            <div key={card.label} className={styles.statusCard}>
              <div className={styles.statusIcon} style={{ background: `${card.color}15` }}>
                {card.icon}
              </div>
              <div className={styles.statusInfo}>
                <div className={styles.statusLabel}>{card.label}</div>
                <div className={styles.statusDetail}>{card.detail}</div>
              </div>
              <div
                className={styles.statusDot}
                style={{ background: card.status === "active" || card.status === "live" ? "#16a34a" : "#f59e0b" }}
              />
            </div>
          ))}
        </div>

        {/* MAIN GRID */}
        <div className={styles.contentGrid}>

          {/* WEBSITE CARD */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>🌐 Your website</div>
              <span className={`${styles.badge} ${website?.status === "live" ? styles.badgeGreen : styles.badgeAmber}`}>
                {website?.status || "Pending"}
              </span>
            </div>
            <div className={styles.websitePreview}>
              {website?.hero_image_url ? (
                <div
                  className={styles.websiteThumb}
                  style={{ backgroundImage: `url(${website.hero_image_url})` }}
                />
              ) : (
                <div className={styles.websitePlaceholder}>
                  <div className={styles.buildingDots}>
                    <span /><span /><span />
                  </div>
                  <p>Building your website...</p>
                </div>
              )}
            </div>
            {website?.meta_title && (
              <div className={styles.seoRow}>
                <span className={styles.seoChip}>📄 {website.meta_title}</span>
              </div>
            )}
            <div className={styles.cardFooter}>
              <span className={styles.cardFooterText}>
                {website?.vercel_url ? website.vercel_url : `${business.name.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`}
              </span>
              {website?.vercel_url && (
                <a href={website.vercel_url} target="_blank" rel="noreferrer" className={styles.cardLink}>
                  Open →
                </a>
              )}
            </div>
          </div>

          {/* BLOG POSTS */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>✍️ Blog posts</div>
              <span className={`${styles.badge} ${styles.badgeGreen}`}>
                {blogPosts?.length || 0} ready
              </span>
            </div>
            {blogPosts && blogPosts.length > 0 ? (
              <div className={styles.postList}>
                {blogPosts.map((post, i) => (
                  <div key={post.id} className={styles.postItem}>
                    <div className={styles.postNum}>{i + 1}</div>
                    <div className={styles.postInfo}>
                      <div className={styles.postTitle}>{post.title}</div>
                      <div className={styles.postMeta}>
                        {post.word_count ? `~${post.word_count} words` : "~800 words"} · SEO optimized ·{" "}
                        <span className={`${styles.postStatus} ${post.status === "published" ? styles.green : styles.amber}`}>
                          {post.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>✍️</div>
                <p>Your first blog posts are being written.</p>
                <p className={styles.emptyMeta}>SEO-optimized, in your voice, auto-published every Monday.</p>
              </div>
            )}
          </div>

          {/* SOCIAL MEDIA */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>📱 Social media</div>
              <span className={`${styles.badge} ${styles.badgeAmber}`}>
                {socialPosts?.length || 0} queued
              </span>
            </div>
            {socialPosts && socialPosts.length > 0 ? (
              <div className={styles.socialGrid}>
                {(["facebook", "instagram", "linkedin"] as const).map((platform) => {
                  const platformPosts = socialPosts.filter(p => p.platform === platform);
                  const icons: Record<string, string> = { facebook: "f", instagram: "ig", linkedin: "in" };
                  const colors: Record<string, string> = { facebook: "#1877f2", instagram: "#e1306c", linkedin: "#0a66c2" };
                  return (
                    <div key={platform} className={styles.platformCard}>
                      <div className={styles.platformHeader} style={{ background: colors[platform] }}>
                        <span>{icons[platform]}</span>
                        <span>{platform}</span>
                        <span className={styles.platformCount}>{platformPosts.length} posts</span>
                      </div>
                      {platformPosts[0] && (
                        <div className={styles.platformCaption}>{platformPosts[0].caption}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>📱</div>
                <p>Setting up your social channels.</p>
                <p className={styles.emptyMeta}>Facebook, Instagram & LinkedIn — branded & scheduled.</p>
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
                <div className={styles.seoItem}>
                  <div className={styles.seoItemCheck}>✓</div>
                  <div>
                    <div className={styles.seoItemLabel}>Meta title</div>
                    <div className={styles.seoItemValue}>{website.meta_title}</div>
                  </div>
                </div>
                {website.meta_description && (
                  <div className={styles.seoItem}>
                    <div className={styles.seoItemCheck}>✓</div>
                    <div>
                      <div className={styles.seoItemLabel}>Meta description</div>
                      <div className={styles.seoItemValue}>{website.meta_description}</div>
                    </div>
                  </div>
                )}
                {website.keywords && (
                  <div className={styles.seoItem}>
                    <div className={styles.seoItemCheck}>✓</div>
                    <div>
                      <div className={styles.seoItemLabel}>Target keywords</div>
                      <div className={styles.seoKeywords}>
                        {(website.keywords as string[]).map((kw: string) => (
                          <span key={kw} className={styles.seoKeyword}>{kw}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div className={styles.seoItem}>
                  <div className={styles.seoItemCheck}>✓</div>
                  <div>
                    <div className={styles.seoItemLabel}>Schema markup</div>
                    <div className={styles.seoItemValue}>LocalBusiness JSON-LD injected</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>🔍</div>
                <p>Generating your SEO setup.</p>
                <p className={styles.emptyMeta}>Meta titles, descriptions, schema markup & keywords.</p>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
