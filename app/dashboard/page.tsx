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
    .from("blog_posts").select("*").eq("business_id", business.id).order("created_at", { ascending: false }).limit(5);

  const { data: socialPosts } = await supabase
    .from("social_posts").select("*").eq("business_id", business.id).order("created_at", { ascending: false }).limit(9);

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
            <h1 className={styles.greeting}>{business.name}</h1>
            <p className={styles.subGreeting}>{business.city}{business.state ? `, ${business.state}` : ""} · Your digital presence, handled.</p>
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
            flexWrap: "wrap" as const,
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
            <a href="/dashboard/preview" style={{
              background: "#fff", color: "#0066ff", fontWeight: 700,
              fontSize: "14px", padding: "10px 24px", borderRadius: "8px",
              textDecoration: "none", whiteSpace: "nowrap" as const, flexShrink: 0,
            }}>
              Review & Approve →
            </a>
          </div>
        )}

        <DeployStatus
          businessId={business.id}
          initialStatus={website?.status || null}
          initialUrl={website?.vercel_url || null}
        />

        <div className={styles.statusGrid}>
          {[
            { icon: "🌐", label: "Website", detail: website?.status === "live" ? "Live & published" : website?.status === "ready_for_review" ? "Ready to review" : "Building...", active: website?.status === "live", color: "#2563eb" },
            { icon: "✍️", label: "Blog posts", detail: `${blogPosts?.length || 0} posts ready`, active: (blogPosts?.length || 0) > 0, color: "#16a34a" },
            { icon: "📱", label: "Social media", detail: `${socialPosts?.length || 0} posts queued`, active: (socialPosts?.length || 0) > 0, color: "#f59e0b" },
            { icon: "🔍", label: "SEO", detail: website?.meta_title ? "Optimized" : "Pending", active: !!website?.meta_title, color: "#f97316" },
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
              <span className={`${styles.badge} ${website?.status === "live" ? styles.badgeGreen : website?.status === "ready_for_review" ? styles.badgeBlue : styles.badgeAmber}`}>
                {website?.status === "ready_for_review" ? "Ready to review" : website?.status || "Pending"}
              </span>
            </div>
            <div style={{position:"relative",height:"180px",borderRadius:"8px",overflow:"hidden",border:"1px solid var(--border)"}}>
              {website?.custom_html ? (
                <a href="/dashboard/preview" style={{display:"block",height:"100%",textDecoration:"none"}}>
                  {/* Scaled iframe preview */}
                  <div style={{position:"relative",width:"100%",height:"100%",overflow:"hidden",background:"#fff"}}>
                    <iframe
                      srcDoc={website.custom_html}
                      style={{
                        width:"1280px",
                        height:"960px",
                        border:"none",
                        transform:"scale(0.28)",
                        transformOrigin:"top left",
                        pointerEvents:"none",
                        position:"absolute",
                        top:0,
                        left:0,
                      }}
                      sandbox="allow-scripts"
                      title="Site preview"
                    />
                    {/* Clickable overlay with status badge */}
                    <div style={{
                      position:"absolute",
                      inset:0,
                      background:"linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)",
                      display:"flex",
                      alignItems:"flex-end",
                      padding:"10px 12px",
                    }}>
                      <span style={{
                        background: website.status === "live" ? "#16a34a" : "#0066ff",
                        color:"#fff",
                        fontSize:"11px",
                        fontWeight:700,
                        padding:"3px 10px",
                        borderRadius:"100px",
                      }}>
                        {website.status === "live" ? "● Live" : "● Ready to review"}
                      </span>
                    </div>
                  </div>
                </a>
              ) : (
                <div className={styles.websitePlaceholder} style={{height:"100%"}}>
                  <div className={styles.buildingDots}><span /><span /><span /></div>
                  <p>Building your website...</p>
                </div>
              )}
            </div>
            <div className={styles.cardFooter} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className={styles.cardFooterText}>
                {website?.vercel_url || `${business.name.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`}
              </span>
              {website?.custom_html && (
                <a href="/dashboard/preview" style={{
                  fontSize: "12px", fontWeight: 700, color: "#0066ff",
                  textDecoration: "none"
                }}>
                  {website.status === "live" ? "Edit →" : "Review →"}
                </a>
              )}
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
                {blogPosts.map((post: any, i: number) => (
                  <div key={post.id} className={styles.postItem}>
                    <div className={styles.postNum}>{i + 1}</div>
                    <div className={styles.postInfo}>
                      <div className={styles.postTitle}>{post.title}</div>
                      <div className={styles.postMeta}>~{post.word_count || 800} words · {post.status}</div>
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
              <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                <span className={`${styles.badge} ${(socialPosts?.length || 0) > 0 ? styles.badgeGreen : styles.badgeAmber}`}>
                  {socialPosts?.length || 0} posts
                </span>
                <a href="/dashboard/social" style={{fontSize:"12px",fontWeight:700,color:"var(--accent)",textDecoration:"none"}}>
                  Manage →
                </a>
              </div>
            </div>
            {socialPosts && socialPosts.length > 0 ? (
              <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
                {(["facebook","instagram","tiktok"] as const).map(platform => {
                  const posts = socialPosts.filter((p:any) => p.platform === platform);
                  const colors: Record<string,string> = {facebook:"#1877f2",instagram:"#e1306c",tiktok:"#010101"};
                  const icons: Record<string,string> = {facebook:"f",instagram:"📷",tiktok:"♪"};
                  return (
                    <a key={platform} href="/dashboard/social" style={{textDecoration:"none"}}>
                      <div style={{border:"1px solid var(--border)",borderRadius:"8px",overflow:"hidden"}}>
                        <div style={{background:colors[platform],padding:"5px 10px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                          <span style={{color:"#fff",fontSize:"11px",fontWeight:700,textTransform:"capitalize",display:"flex",alignItems:"center",gap:"5px"}}>
                            {platform}
                          </span>
                          <span style={{color:"rgba(255,255,255,0.8)",fontSize:"11px",fontWeight:600}}>{posts.length} posts</span>
                        </div>
                        <div style={{padding:"7px 10px",fontSize:"12px",color:posts.length > 0 ? "var(--text-mid)" : "var(--text-light)",lineHeight:1.5,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",fontStyle:posts.length === 0 ? "italic" : "normal"}}>
                          {posts.length > 0 ? (posts[0] as any).caption : "No posts yet — click to generate"}
                        </div>
                      </div>
                    </a>
                  );
                })}
              </div>
            ) : (
              <a href="/dashboard/social" style={{textDecoration:"none"}}>
                <div className={styles.emptyState} style={{cursor:"pointer",background:"var(--bg-soft)",borderRadius:"8px",border:"1px dashed var(--border)"}}>
                  <div className={styles.emptyIcon}>📱</div>
                  <p>Generate your social posts</p>
                  <p className={styles.emptyMeta}>Facebook, Instagram & TikTok — click to get started</p>
                </div>
              </a>
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
              </div>
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>🔍</div>
                <p>SEO will generate with your website.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
