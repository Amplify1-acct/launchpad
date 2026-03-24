import styles from "./Services.module.css";

// Services updated for DIFY positioning
const services = [
  {
    icon: "🌐",
    color: "blue",
    name: "Professional Website",
    desc: "A fully custom-designed website built specifically for your business, optimized for search engines and mobile devices.",
    features: [
      "Custom design & branding",
      "Mobile responsive layout",
      "SEO foundation built in",
      "Contact forms & booking",
      "Google Analytics connected",
    ],
    featured: false,
  },
  {
    icon: "✍️",
    color: "green",
    name: "Weekly Blog Content",
    desc: "Fresh, SEO-optimized blog posts published every week — written in your voice and tailored to your industry.",
    features: [
      "1 post per week minimum",
      "Keyword research included",
      "Written in your brand voice",
      "Auto-published to your site",
      "Monthly performance report",
    ],
    featured: false,
  },
  {
    icon: "📱",
    color: "purple",
    name: "Social Media Management",
    desc: "Channels set up and managed across all major platforms, with consistent branded content posted weekly.",
    features: [
      "Facebook, Instagram, LinkedIn",
      "3–5 posts per week",
      "Custom graphics & captions",
      "Community engagement",
      "Monthly analytics recap",
    ],
    featured: false,
  },
  {
    icon: "🔍",
    color: "orange",
    name: "On-Page SEO",
    desc: "Every page of your site optimized so Google can find you — meta titles, descriptions, schema markup, and more.",
    features: [
      "Meta titles & descriptions",
      "Schema markup (JSON-LD)",
      "Local SEO optimization",
      "Page speed optimization",
      "Monthly ranking report",
    ],
    featured: true,
  },
];

export default function Services() {
  return (
    <section className={styles.section} id="services">
      <div className={styles.inner}>
        <div className={styles.header}>
          <p className={styles.label}>What we deliver</p>
          <h2 className={styles.title}>Four services. Zero effort on your part.</h2>
          <p className={styles.sub}>
            Website, blog, social, and SEO — all done for you, every week,
            while you run your business.
          </p>
        </div>
        <div className={styles.grid}>
          {services.map((s) => (
            <div
              key={s.name}
              className={`${styles.card} ${s.featured ? styles.featured : ""}`}
            >
              {s.featured && <div className={styles.badge}>New</div>}
              <div className={`${styles.icon} ${styles[s.color]}`}>{s.icon}</div>
              <h3 className={styles.name}>{s.name}</h3>
              <p className={styles.desc}>{s.desc}</p>
              <ul className={styles.features}>
                {s.features.map((f) => (
                  <li key={f}>
                    <div className={styles.check}>✓</div>
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
