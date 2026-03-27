"use client";
export const dynamic = "force-dynamic";
import React, { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import styles from "../auth.module.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    router.push("/dashboard");
    router.refresh();
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setResetSent(true);
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <a href="/" className={styles.logo}>Ex<span>sisto</span></a>

        {resetSent ? (
          <>
            <h1 className={styles.title}>Check your email</h1>
            <p className={styles.sub}>We sent a password reset link to <strong>{email}</strong>. Check your inbox and click the link to set a new password.</p>
            <button onClick={() => { setResetSent(false); setShowReset(false); }} className={styles.btn} style={{ marginTop: "1rem" }}>
              Back to sign in
            </button>
          </>
        ) : showReset ? (
          <>
            <h1 className={styles.title}>Reset password</h1>
            <p className={styles.sub}>Enter your email and we&apos;ll send you a reset link.</p>
            {error && <div className={styles.error}>{error}</div>}
            <form onSubmit={handleReset} className={styles.form}>
              <div className={styles.field}>
                <label>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
              </div>
              <button type="submit" className={styles.btn} disabled={loading}>
                {loading ? "Sending..." : "Send reset link →"}
              </button>
            </form>
            <p className={styles.switch}>
              <button onClick={() => setShowReset(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--accent)", fontSize: "inherit", fontFamily: "inherit" }}>
                ← Back to sign in
              </button>
            </p>
          </>
        ) : (
          <>
            <h1 className={styles.title}>Welcome back</h1>
            <p className={styles.sub}>Sign in to your account</p>
            {error && <div className={styles.error}>{error}</div>}
            <form onSubmit={handleLogin} className={styles.form}>
              <div className={styles.field}>
                <label>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
              </div>
              <div className={styles.field}>
                <label>
                  Password
                  <button
                    type="button"
                    onClick={() => setShowReset(true)}
                    style={{ float: "right", background: "none", border: "none", cursor: "pointer", color: "var(--accent)", fontSize: "0.8rem", fontFamily: "inherit", padding: 0 }}
                  >
                    Forgot password?
                  </button>
                </label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
              </div>
              <button type="submit" className={styles.btn} disabled={loading}>
                {loading ? "Signing in..." : "Sign in →"}
              </button>
            </form>
            <p className={styles.switch}>Don&apos;t have an account? <a href="/signup">Get started free</a></p>
          </>
        )}
      </div>
    </div>
  );
}
