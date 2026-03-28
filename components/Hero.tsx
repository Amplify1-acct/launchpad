"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./Hero.module.css";

const STATS = [
  { value: "48h", label: "Site live" },
  { value: "4×", label: "More traffic" },
  { value: "0", label: "Tech skills needed" },
];

const INDUSTRIES = [
  "Law Firms", "Restaurants", "Dentists", "Contractors",
  "Retailers", "Med Spas", "Gyms", "Real Estate",
];

export default function Hero() {
  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActiveIdx(i => (i + 1) % INDUSTRIES.length), 1800);
    return () => clearInterval(t);
  }, []);

  return (
    <section className={styles.hero}>
      <div className={styles.bg}>
        <div className={styles.bgGrid} />
        <div className={styles.bgGlow} />
      </div>

      <div className={styles.inner}>
        <div className={styles.badge}>
          <span className={styles.badgeDot} />
          Done-for-you digital presence
        </div>

        <h1 className={styles.h1}>
          Your website, blog &amp;<br />
          social media —<br />
          <span className={styles.accent}>all handled.</span>
        </h1>

        <p className={styles.sub}>
          Tell us about your business. We build everything.
          You approve it. It runs on autopilot — forever.
        </p>

        <div className={styles.for}>
          Built for{" "}
          <span className={styles.rotator} key={activeIdx}>
            {INDUSTRIES[activeIdx]}
          </span>
        </div>

        <div className={styles.ctas}>
          <button className={styles.primary} onClick={() => scrollTo("demo")}>
            See it in action
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button className={styles.secondary} onClick={() => scrollTo("pricing")}>
            View pricing
          </button>
        </div>

        <div className={styles.stats}>
          {STATS.map(s => (
            <div key={s.label} className={styles.stat}>
              <div className={styles.statVal}>{s.value}</div>
              <div className={styles.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating cards */}
      <div className={styles.cards}>
        <div className={`${styles.card} ${styles.card1}`}>
          <div className={styles.cardIcon}>🌐</div>
          <div>
            <div className={styles.cardTitle}>Website live</div>
            <div className={styles.cardSub}>Riverside Dental Studio</div>
          </div>
          <div className={styles.cardBadge}>Live</div>
        </div>

        <div className={`${styles.card} ${styles.card2}`}>
          <div className={styles.cardIcon}>✍️</div>
          <div>
            <div className={styles.cardTitle}>Blog post published</div>
            <div className={styles.cardSub}>"5 Signs You Need a Plumber"</div>
          </div>
        </div>

        <div className={`${styles.card} ${styles.card3}`}>
          <div className={styles.cardIcon}>📱</div>
          <div>
            <div className={styles.cardTitle}>12 posts scheduled</div>
            <div className={styles.cardSub}>This week · FB, IG, LinkedIn</div>
          </div>
        </div>
      </div>
    </section>
  );
}
