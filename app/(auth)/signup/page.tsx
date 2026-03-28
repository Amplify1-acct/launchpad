"use client";
export const dynamic = "force-dynamic";
import React, { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import styles from "../auth.module.css";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } }
    });
    if (error) { setError(error.message); setLoading(false); return; }
    router.push("/onboarding");
    router.refresh();
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <a href="/" className={styles.logo}>Exsisto<span>.</span></a>
        <h1 className={styles.title}>Let&apos;s get started</h1>
        <p className={styles.sub}>Your website, blog, social & SEO — handled.</p>
        {error && <div className={styles.error}>{error}</div>}
        <form onSubmit={handleSignup} className={styles.form}>
          <div className={styles.field}>
            <label>Your name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Matt Johnson" required />
          </div>
          <div className={styles.field}>
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>
          <div className={styles.field}>
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" minLength={8} required />
          </div>
          <button type="submit" className={styles.btn} disabled={loading}>
            {loading ? "Creating account..." : "Create account →"}
          </button>
        </form>
        <p className={styles.switch}>Already have an account? <a href="/login">Sign in</a></p>
        <p className={styles.terms}>By signing up you agree to our <a href="#">Terms</a> and <a href="#">Privacy Policy</a>.</p>
      </div>
    </div>
  );
}
