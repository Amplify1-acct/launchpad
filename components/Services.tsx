import styles from "./Services.module.css";

const services = [
  {
    icon: "🌐",
    name: "Professional Website",
    desc: "A fully custom site built for your business — optimized for search engines, mobile-ready, and live in 48 hours.",
    features: ["Custom design & branding", "Mobile responsive", "SEO foundation", "Contact forms & booking"],
    accent: "blue",
  },
  {
    icon: "✍️",
    name: "Weekly Blog Content",
    desc: "Fresh, keyword-rich blog posts published every week — written in your voice, auto-published to your site.",
    features: ["1–4 posts per month", "Keyword research included", "Written in your brand voice", "Auto-published"],
    accent: "green",
  },
  {
    icon: "📱",
    name: "Social Media Management",
    desc: "Consistent, branded content across all major platforms — posted weekly, so you never have to think about it.",
    features: ["Facebook, Instagram, LinkedIn", "3–5 posts per week", "Custom graphics & captions", "Scheduled & managed"],
    accent: "purple",
  },
  {
    icon: "🔍",
    name: "On-Page SEO",
    desc: "Every page optimized so Google can find you — meta titles, schema markup, local SEO, and monthly ranking reports.",
    features: ["Meta titles & descriptions", "Schema markup (JSON-LD)", "Local SEO optimization", "Monthly ranking report"],
    accent: "orange",
  },
];

export default function Services() {
  return (
    <section className={styles.section} id="services">
      <div className={styles.inner}>
        <div className={styles.header}>
          <span className={styles.label}>What's included</span>
          <h2 className={styles.title}>Everything your business needs online</h2>
          <p className={styles.sub}>
            One subscription. Four services. All running in the background while you run your business.
          </p>
        </div>

        <div className={styles.grid}>
          {services.map((s) => (
            <div key={s.name} className={`${styles.card} ${styles[s.accent]}`}>
              <div className={styles.cardIcon}>{s.icon}</div>
              <h3 className={styles.cardName}>{s.name}</h3>
              <p className={styles.cardDesc}>{s.desc}</p>
              <ul className={styles.features}>
                {s.features.map((f) => (
                  <li key={f} className={styles.feature}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2.5 7l3 3 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
