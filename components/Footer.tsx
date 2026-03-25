import styles from "./Footer.module.css";

const links = ["Privacy Policy", "Terms of Service", "Support", "Blog"];

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.logo}>
        Exsisto<span>.</span>
      </div>
      <div className={styles.links}>
        {links.map((l) => (
          <a key={l} href="#">
            {l}
          </a>
        ))}
      </div>
      <p className={styles.copy}>
        © {new Date().getFullYear()} Exsisto · Your business, brought to life.
      </p>
    </footer>
  );
}
