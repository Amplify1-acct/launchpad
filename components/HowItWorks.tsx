import styles from "./HowItWorks.module.css";

const steps = [
  {
    num: "1",
    title: "Tell us about your business",
    desc: "Complete a simple intake form with your business details, goals, and brand preferences.",
  },
  {
    num: "2",
    title: "We build your digital presence",
    desc: "Our team designs your website, sets up social channels, and creates your content calendar.",
  },
  {
    num: "3",
    title: "Review & approve",
    desc: "You get a full preview before anything goes live. Full control, zero hassle.",
  },
  {
    num: "4",
    title: "We keep it all running",
    desc: "Weekly blogs, social posts, and ongoing updates — handled for you automatically.",
  },
];

export default function HowItWorks() {
  return (
    <section className={styles.section} id="how">
      <div className={styles.inner}>
        <div className={styles.header}>
          <p className={styles.label}>The process</p>
          <h2 className={styles.title}>Up and running in four simple steps</h2>
          <p className={styles.sub}>
            No tech skills needed. No back-and-forth headaches. Just fill out a
            short form and we handle everything from start to finish.
          </p>
        </div>
        <div className={styles.steps}>
          <div className={styles.connector} />
          {steps.map((s) => (
            <div key={s.num} className={styles.step}>
              <div className={styles.stepNum}>{s.num}</div>
              <h3 className={styles.stepTitle}>{s.title}</h3>
              <p className={styles.stepDesc}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
