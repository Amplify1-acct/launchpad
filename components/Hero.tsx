"use client";

import styles from "./Hero.module.css";

const mockups = [
  {
    icon: "🌐",
    color: "blue",
    title: "Your Website",
    sub: "Live in 48 hours",
    fill: 72,
    tags: ["Custom design", "SEO ready", "Mobile first"],
  },
  {
    icon: "✍️",
    color: "green",
    title: "Weekly Blog Posts",
    sub: "Published every Monday",
    fill: 55,
    tags: ["SEO optimized", "Your voice", "Auto publish"],
  },
  {
    icon: "📱",
    color: "amber",
    title: "Social Media",
    sub: "3–5 posts per week",
    fill: 88,
    tags: ["FB · IG · LinkedIn", "Scheduled", "Branded"],
  },
  {
    icon: "🔍",
    color: "orange",
    title: "On-Page SEO",
    sub: "Every page optimized",
    fill: 64,
    tags: ["Meta tags", "Schema markup", "Local SEO"],
  },
];

export default function Hero() {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className={styles.hero}>
      <div className={styles.inner}>
        <div className={styles.left}>
          <div className={styles.badge}>
            <div className={styles.badgeDot} />
            Your business, brought to life.
          </div>
          <h1 className={styles.h1}>
            Your Website, Blog,
            Social &{" "}
            <em className={styles.gold}>SEO.</em>
            {" "}Handled.
          </h1>
          <p className={styles.sub}>
            Other website builders make you do all the work yourself.
            We do it <em className={styles.goldText}>for</em> you — your website built,
            your blog written weekly, your social media posted automatically.
            You just run your business.
          </p>
          <div className={styles.difyCta}>
            <div className={styles.difyItem}>
              <span className={styles.difyX}>✗</span>
              <span className={styles.difyOld}>No dragging and dropping for hours</span>
            </div>
            <div className={styles.difyItem}>
              <span className={styles.difyX}>✗</span>
              <span className={styles.difyOld}>No writing your own blog posts</span>
            </div>
            <div className={styles.difyItem}>
              <span className={styles.difyX}>✗</span>
              <span className={styles.difyOld}>No figuring out social media</span>
            </div>
            <div className={styles.difyItem} style={{ marginTop: "0.5rem" }}>
              <span className={styles.difyCheck}>✓</span>
              <span className={styles.difyNew}>We build it, write it, post it, and rank it for you</span>
            </div>
          </div>
          <div className={styles.btns}>
            <button className={styles.btnPrimary} onClick={() => scrollTo("contact")}>
              Get it done for me →
            </button>
            <button className={styles.btnOutline} onClick={() => scrollTo("how")}>
              See how it works
            </button>
          </div>
          <div className={styles.stats}>
            {[
              { num: "33M", label: "Small businesses need this" },
              { num: "48hr", label: "Yours is live" },
              { num: "0hrs", label: "Of your time required" },
            ].map((s) => (
              <div key={s.label}>
                <div className={styles.statNum}>{s.num}</div>
                <div className={styles.statLabel}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.right}>
          {mockups.map((m) => (
            <div key={m.title} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={`${styles.cardIcon} ${styles[m.color]}`}>
                  {m.icon}
                </div>
                <div>
                  <div className={styles.cardTitle}>{m.title}</div>
                  <div className={styles.cardSub}>{m.sub}</div>
                </div>
              </div>
              <div className={styles.bar}>
                <div
                  className={`${styles.barFill} ${styles[m.color]}`}
                  style={{ width: `${m.fill}%` }}
                />
              </div>
              <div className={styles.tags}>
                {m.tags.map((t) => (
                  <span key={t} className={`${styles.tag} ${styles[m.color]}`}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
