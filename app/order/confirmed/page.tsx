import styles from "./confirmed.module.css";

export default function OrderConfirmedPage() {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.icon}>🎉</div>
        <h1>You're all set!</h1>
        <p className={styles.sub}>
          We received your order and are starting on your site right now.
        </p>
        <div className={styles.timeline}>
          <div className={styles.timelineItem}>
            <div className={`${styles.dot} ${styles.dotDone}`}>✓</div>
            <div>
              <div className={styles.timelineLabel}>Order confirmed</div>
              <div className={styles.timelineSub}>Payment received</div>
            </div>
          </div>
          <div className={styles.timelineItem}>
            <div className={`${styles.dot} ${styles.dotActive}`}>→</div>
            <div>
              <div className={styles.timelineLabel}>Building your site</div>
              <div className={styles.timelineSub}>We'll review it before sending it to you</div>
            </div>
          </div>
          <div className={styles.timelineItem}>
            <div className={styles.dot}>3</div>
            <div>
              <div className={styles.timelineLabel}>Account email incoming</div>
              <div className={styles.timelineSub}>Check your inbox for a login link to your dashboard</div>
            </div>
          </div>
          <div className={styles.timelineItem}>
            <div className={styles.dot}>4</div>
            <div>
              <div className={styles.timelineLabel}>Site live</div>
              <div className={styles.timelineSub}>DNS instructions will be emailed to you</div>
            </div>
          </div>
        </div>

        <a href="/dashboard" className={styles.dashBtn}>
          Go to my dashboard →
        </a>

        <div className={styles.note}>
          Questions? Email us at <a href="mailto:support@exsisto.ai">support@exsisto.ai</a>
        </div>
        <a href="/" className={styles.homeLink}>← Back to exsisto.ai</a>
      </div>
    </div>
  );
}
