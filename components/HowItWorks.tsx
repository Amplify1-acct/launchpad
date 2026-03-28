import styles from "./HowItWorks.module.css";

const steps = [
  {
    num: "01",
    title: "Fill out one short form",
    desc: "Tell us your business name, what you do, and who you serve. Takes 3 minutes.",
  },
  {
    num: "02",
    title: "We build everything",
    desc: "We design your site, write your content, and set up your social channels. You do nothing.",
  },
  {
    num: "03",
    title: "You approve & go live",
    desc: "Review a preview of your site. One click and it's live.",
  },
  {
    num: "04",
    title: "Autopilot, forever",
    desc: "New blog posts and social content every single week — automatically.",
  },
];

export default function HowItWorks() {
  return (
    <section className={styles.section} id="how">
      <div className={styles.inner}>
        <div className={styles.header}>
          <span className={styles.label}>The process</span>
          <h2 className={styles.title}>Four steps.<br />Three of them are ours.</h2>
          <p className={styles.sub}>
            No tech skills. No back-and-forth. Just tell us about your business
            and we handle the rest.
          </p>
        </div>

        <div className={styles.steps}>
          {steps.map((s, i) => (
            <div key={s.num} className={styles.step}>
              <div className={styles.stepTop}>
                <div className={styles.stepNum}>{s.num}</div>
                {i < steps.length - 1 && <div className={styles.connector} />}
              </div>
              <h3 className={styles.stepTitle}>{s.title}</h3>
              <p className={styles.stepDesc}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
