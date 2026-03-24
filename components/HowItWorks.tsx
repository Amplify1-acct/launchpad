import styles from "./HowItWorks.module.css";

const steps = [
  {
    num: "1",
    title: "You fill out one short form",
    desc: "Tell us your business name, industry, and what you do. Takes 3 minutes. That's the hardest part.",
  },
  {
    num: "2",
    title: "We build everything for you",
    desc: "We design your website, write your first blog posts, and set up your social channels. You do nothing.",
  },
  {
    num: "3",
    title: "You review and say go",
    desc: "We send you a preview. You approve it — or ask for tweaks. One click and it's live.",
  },
  {
    num: "4",
    title: "It runs on autopilot forever",
    desc: "Every week we write a new blog post and schedule your social posts. You never think about it again.",
  },
];

export default function HowItWorks() {
  return (
    <section className={styles.section} id="how">
      <div className={styles.inner}>
        <div className={styles.header}>
          <p className={styles.label}>The process</p>
          <h2 className={styles.title}>Four steps. Three of them are ours.</h2>
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
