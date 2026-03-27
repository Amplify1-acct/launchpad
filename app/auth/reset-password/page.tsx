"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords don't match"); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setDone(true);
    setTimeout(() => router.push("/dashboard"), 2000);
  }

  const inputStyle = {
    width: "100%", padding: "0.65rem 0.85rem",
    border: "1px solid #e4e4e0", borderRadius: 6,
    fontSize: "0.9rem", fontFamily: "inherit", outline: "none",
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8f8f6" }}>
      <div style={{ background: "#fff", border: "1px solid #e4e4e0", borderRadius: 10, padding: "2.5rem", width: "100%", maxWidth: 400 }}>
        <a href="/" style={{ fontFamily: "Georgia, serif", fontSize: "1.2rem", fontWeight: 700, color: "#111", textDecoration: "none", display: "block", marginBottom: "1.5rem" }}>
          Ex<span style={{ color: "#8b4513" }}>sisto</span>
        </a>

        {done ? (
          <>
            <h1 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: 8 }}>Password updated ✓</h1>
            <p style={{ color: "#888", fontSize: "0.9rem" }}>Redirecting to your dashboard...</p>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: 4 }}>Set new password</h1>
            <p style={{ color: "#888", fontSize: "0.875rem", marginBottom: "1.5rem" }}>Choose a strong password for your account.</p>
            {error && <div style={{ background: "#fee2e2", color: "#dc2626", padding: "0.65rem 0.85rem", borderRadius: 6, fontSize: "0.85rem", marginBottom: "1rem" }}>{error}</div>}
            <form onSubmit={handleReset} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: 6 }}>New password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 8 characters" required style={inputStyle} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: 6 }}>Confirm password</label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Same as above" required style={inputStyle} />
              </div>
              <button type="submit" disabled={loading} style={{
                background: "#111", color: "#fff", border: "none", borderRadius: 6,
                padding: "0.75rem", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer",
                fontFamily: "inherit", marginTop: 4,
              }}>
                {loading ? "Updating..." : "Update password →"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
