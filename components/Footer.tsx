import styles from "./Footer.module.css";

const links = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "#" },
  { label: "Support", href: "#" },
  { label: "Blog", href: "/blog" },
];

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.left}>
          <div className={styles.logo}>
            Exsisto<span className={styles.dot}>.</span>
          </div>
          <p className={styles.tagline}>Your business, brought to life.</p>
        </div>

        <nav className={styles.links}>
          {links.map((l) => (
            <a key={l.label} href={l.href}>
              {l.label}
            </a>
          ))}
        </nav>

        <p className={styles.copy}>
          © {new Date().getFullYear()} Exsisto
        </p>
      </div>
    </footer>
  );
}
