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
            Your complete digital presence, done for you
          </div>
          <h1 className={styles.h1}>
            Your Business Online,{" "}
            <em className={styles.gold}>Fully Built</em>
            {" "}& Running.
          </h1>
          <p className={styles.sub}>
            We handle everything — your website, weekly blog content, and social
            media channels — so you can focus on what you do best: running your
            business.
          </p>
          <div className={styles.btns}>
            <button className={styles.btnPrimary} onClick={() => scrollTo("contact")}>
              Start for free →
            </button>
            <button className={styles.btnOutline} onClick={() => scrollTo("how")}>
              See how it works
            </button>
          </div>
          <div className={styles.stats}>
            {[
              { num: "500+", label: "Businesses launched" },
              { num: "48hr", label: "Average delivery time" },
              { num: "97%", label: "Client satisfaction" },
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
