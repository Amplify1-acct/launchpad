import Link from "next/link";
import { posts } from "@/app/blog/posts";
import styles from "./BlogPreview.module.css";

const industryColors: Record<string, string> = {
  "Plumbing": "#2563eb",
  "Photography": "#db2777",
  "Real Estate": "#16a34a",
};

export default function BlogPreview() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <p className={styles.label}>Sample blog posts</p>
          <h2 className={styles.title}>See the quality for yourself</h2>
          <p className={styles.sub}>
            Every week we publish a fully written, SEO-optimized blog post for your business — in your voice, for your industry. Here are real examples.
          </p>
        </div>

        <div className={styles.grid}>
          {posts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className={styles.card}>
              <div
                className={styles.cardImg}
                style={{ backgroundImage: `url(${post.image})` }}
              >
                <div className={styles.cardImgOverlay} />
                <div
                  className={styles.industryTag}
                  style={{ background: industryColors[post.industry] || "#2563eb" }}
                >
                  {post.industry}
                </div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.cardMeta}>
                  <span>{post.date}</span>
                  <span>·</span>
                  <span>{post.readTime}</span>
                </div>
                <h3 className={styles.cardTitle}>{post.title}</h3>
                <p className={styles.cardExcerpt}>{post.excerpt}</p>
                <div className={styles.cardFooter}>
                  <div className={styles.cardAuthor}>
                    <div className={styles.authorDot}
                      style={{ background: industryColors[post.industry] || "#2563eb" }}
                    />
                    {post.author}
                  </div>
                  <span className={styles.readMore}>Read post →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className={styles.note}>
          <span>✍️</span>
          <p>These posts were written for fictional sample businesses — but this is exactly what we write for real businesses every week, fully tailored to your industry, voice, and local market.</p>
        </div>
      </div>
    </section>
  );
}
