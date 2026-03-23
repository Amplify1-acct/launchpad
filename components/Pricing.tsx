"use client";

import styles from "./Pricing.module.css";

const plans = [
  {
    name: "Starter",
    price: "$299",
    desc: "Perfect for getting your business online for the first time.",
    features: [
      "5-page professional website",
      "2 blog posts per month",
      "Facebook + Instagram setup",
      "8 social posts per month",
      "Monthly performance report",
    ],
    popular: false,
  },
  {
    name: "Growth",
    price: "$599",
    desc: "Ideal for businesses ready to grow their online presence fast.",
    features: [
      "10-page website + blog",
      "4 blog posts per month",
      "FB, IG + LinkedIn setup",
      "20 social posts per month",
      "SEO keyword strategy",
      "Weekly performance report",
      "Priority support",
    ],
    popular: true,
  },
  {
    name: "Premium",
    price: "$999",
    desc: "Full-service digital marketing for established businesses.",
    features: [
      "Unlimited pages + ecommerce",
      "Weekly blog posts",
      "All social platforms",
      "Daily social posts",
      "Google & Meta ads setup",
      "Dedicated account manager",
      "Custom strategy sessions",
    ],
    popular: false,
  },
];

export default function Pricing() {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className={styles.section} id="pricing">
      <div className={styles.inner}>
        <div className={styles.header}>
          <p className={styles.label}>Simple, transparent pricing</p>
          <h2 className={styles.title}>One flat monthly fee, no surprises</h2>
          <p className={styles.sub}>
            Pick the plan that fits your stage. Upgrade or cancel any time —
            no contracts, no hidden fees.
          </p>
        </div>
        <div className={styles.grid}>
          {plans.map((p) => (
            <div
              key={p.name}
              className={`${styles.card} ${p.popular ? styles.popular : ""}`}
            >
              {p.popular && <div className={styles.popBadge}>Most popular</div>}
              <div className={styles.planName}>{p.name}</div>
              <div className={styles.price}>
                {p.price}<span>/mo</span>
              </div>
              <div className={styles.planDesc}>{p.desc}</div>
              <ul className={styles.features}>
                {p.features.map((f) => (
                  <li key={f}>
                    <div className={styles.check}>✓</div>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                className={`${styles.btn} ${p.popular ? styles.btnPrimary : ""}`}
                onClick={() => scrollTo("contact")}
              >
                Get started
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
