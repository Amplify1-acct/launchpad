import { notFound } from "next/navigation";
import Link from "next/link";
import { getPost, posts } from "../posts";
import styles from "./page.module.css";

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const post = getPost(params.slug);
  if (!post) return {};
  return {
    title: `${post.title} | LaunchPad Blog`,
    description: post.excerpt,
  };
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = getPost(params.slug);
  if (!post) notFound();

  const otherPosts = posts.filter((p) => p.slug !== post.slug);

  return (
    <div className={styles.page}>

      {/* NAV */}
      <nav className={styles.nav}>
        <Link href="/" className={styles.navLogo}>Launch<span>Pad</span></Link>
        <Link href="/#contact" className={styles.navCta}>Get started</Link>
      </nav>

      {/* HERO */}
      <div className={styles.hero} style={{ backgroundImage: `url(${post.image})` }}>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <div className={styles.heroBreadcrumb}>
            <Link href="/">Home</Link>
            <span>›</span>
            <span>Blog</span>
            <span>›</span>
            <span>{post.industry}</span>
          </div>
          <div className={styles.heroIndustry}>{post.industry}</div>
          <h1 className={styles.heroTitle}>{post.title}</h1>
          <div className={styles.heroMeta}>
            <span>{post.author}</span>
            <span>·</span>
            <span>{post.date}</span>
            <span>·</span>
            <span>{post.readTime}</span>
          </div>
        </div>
      </div>

      {/* ARTICLE */}
      <div className={styles.articleWrap}>
        <article className={styles.article}>

          {/* AUTHOR BAR */}
          <div className={styles.authorBar}>
            <div className={styles.authorAvatar}>
              {post.author.charAt(0)}
            </div>
            <div>
              <div className={styles.authorName}>{post.author}</div>
              <div className={styles.authorRole}>{post.authorRole}</div>
            </div>
            <div className={styles.authorBadge}>✍️ Written by LaunchPad AI</div>
          </div>

          {/* CONTENT */}
          {post.content.map((section, i) => {
            if (section.type === "intro") return (
              <p key={i} className={styles.intro}>{section.text}</p>
            );
            if (section.type === "h2") return (
              <h2 key={i} className={styles.h2}>{section.text}</h2>
            );
            if (section.type === "p") return (
              <p key={i} className={styles.p}>{section.text}</p>
            );
            if (section.type === "ul") return (
              <ul key={i} className={styles.ul}>
                {section.items?.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ul>
            );
            if (section.type === "tip") return (
              <div key={i} className={styles.tip}>
                <div className={styles.tipIcon}>💡</div>
                <p>{section.text}</p>
              </div>
            );
            if (section.type === "cta") return (
              <div key={i} className={styles.ctaBox}>
                <p>{section.text}</p>
                <Link href="/#contact" className={styles.ctaBtn}>
                  Get in touch →
                </Link>
              </div>
            );
            return null;
          })}
        </article>

        {/* SIDEBAR */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarCard}>
            <div className={styles.sidebarTitle}>This post was written by LaunchPad</div>
            <p className={styles.sidebarText}>
              Every week we write SEO-optimized blog posts like this one for small businesses — fully tailored to your industry, voice, and local market.
            </p>
            <Link href="/#contact" className={styles.sidebarCta}>
              Get weekly posts for my business →
            </Link>
          </div>

          <div className={styles.sidebarCard}>
            <div className={styles.sidebarTitle}>More sample posts</div>
            <div className={styles.sidebarPosts}>
              {otherPosts.map((p) => (
                <Link key={p.slug} href={`/blog/${p.slug}`} className={styles.sidebarPost}>
                  <div className={styles.sidebarPostImg}
                    style={{ backgroundImage: `url(${p.image})` }} />
                  <div>
                    <div className={styles.sidebarPostIndustry}>{p.industry}</div>
                    <div className={styles.sidebarPostTitle}>{p.title}</div>
                    <div className={styles.sidebarPostMeta}>{p.readTime}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* BOTTOM CTA */}
      <div className={styles.bottomCta}>
        <h2 className={styles.bottomCtaTitle}>Want posts like this for your business?</h2>
        <p className={styles.bottomCtaSub}>We write one every week — SEO optimized, in your voice, auto-published to your site.</p>
        <Link href="/#contact" className={styles.bottomCtaBtn}>Start for free →</Link>
      </div>

      {/* FOOTER */}
      <footer className={styles.footer}>
        <Link href="/" className={styles.footerLogo}>Launch<span>Pad</span></Link>
        <p>© 2026 LaunchPad Digital. All rights reserved.</p>
      </footer>
    </div>
  );
}
