"use client";

import styles from "./Navbar.module.css";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <nav className={`${styles.nav} ${scrolled ? styles.scrolled : ""}`}>
      <div className={styles.inner}>
        <div className={styles.logo}>
          Exsisto<span className={styles.dot}>.</span>
        </div>

        <div className={styles.links}>
          <button onClick={() => scrollTo("how")}>How it works</button>
          <button onClick={() => scrollTo("services")}>Services</button>
          <button onClick={() => scrollTo("pricing")}>Pricing</button>
        </div>

        <div className={styles.actions}>
          <a href="/login" className={styles.login}>Sign in</a>
          <button className={styles.cta} onClick={() => scrollTo("contact")}>
            Get started
          </button>
        </div>
      </div>
    </nav>
  );
}
