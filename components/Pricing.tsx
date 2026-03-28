"use client";

import styles from "./Pricing.module.css";

const plans = [
  {
    name: "Starter",
    price: "$99",
    period: "/mo",
    desc: "Get your business online fast.",
    features: [
      "5-page professional website",
      "2 blog posts per month",
      "Facebook + Instagram setup",
      "8 social posts per month",
      "On-page SEO on all pages",
      "Monthly performance report",
    ],
    popular: false,
    cta: "Get started",
  },
  {
    name: "Growth",
    price: "$299",
    period: "/mo",
    desc: "Everything you need to grow online.",
    features: [
      "10-page website + blog",
      "4 blog posts per month",
      "FB, IG + LinkedIn setup",
      "20 social posts per month",
      "On-page SEO + schema markup",
      "Local SEO optimization",
      "Weekly performance report",
      "Priority support",
    ],
    popular: true,
    cta: "Get started",
  },
  {
    name: "Premium",
    price: "$599",
    period: "/mo",
    desc: "Full-service for established businesses.",
    features: [
      "Unlimited pages + ecommerce",
      "Weekly blog posts",
      "All social platforms",
      "Daily social posts",
      "Full SEO suite + monthly audit",
      "Google Business Profile mgmt",
      "Google & Meta ads setup",
      "Dedicated account manager",
    ],
    popular: false,
    cta: "Get started",
  },
];

export default function Pricing() {
  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <section className={styles.section} id="pricing">
      <div className={styles.inner}>
        <div className={styles.header}>
          <span className={styles.label}>Pricing</span>
          <h2 className={styles.title}>Simple, transparent pricing</h2>
          <p className={styles.sub}>
            No setup fees. No long-term contracts. Cancel anytime.
          </p>
        </div>

        <div className={styles.grid}>
          {plans.map((p) => (
            <div key={p.name} className={`${styles.card} ${p.popular ? styles.popular : ""}`}>
              {p.popular && <div className={styles.popularBadge}>Most popular</div>}
              <div className={styles.planName}>{p.name}</div>
              <div className={styles.priceRow}>
                <span className={styles.price}>{p.price}</span>
                <span className={styles.period}>{p.period}</span>
              </div>
              <p className={styles.planDesc}>{p.desc}</p>
              <ul className={styles.features}>
                {p.features.map((f) => (
                  <li key={f} className={styles.feature}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2.5 7l3 3 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                className={p.popular ? styles.primaryBtn : styles.secondaryBtn}
                onClick={() => scrollTo("contact")}
              >
                {p.cta}
              </button>
            </div>
          ))}
        </div>

        <p className={styles.note}>
          All plans include a 14-day free trial. No credit card required.
        </p>
      </div>
    </section>
  );
}
