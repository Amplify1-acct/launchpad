"use client";

import styles from "./Navbar.module.css";

export default function Navbar() {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav className={styles.nav}>
      <div className={styles.logo}>
        Launch<span>Pad</span>
      </div>
      <div className={styles.links}>
        <button onClick={() => scrollTo("how")}>How it works</button>
        <button onClick={() => scrollTo("services")}>Services</button>
        <button onClick={() => scrollTo("pricing")}>Pricing</button>
        <button onClick={() => scrollTo("contact")}>Contact</button>
      </div>
      <button
        className={styles.cta}
        onClick={() => scrollTo("contact")}
      >
        Get started
      </button>
    </nav>
  );
}
