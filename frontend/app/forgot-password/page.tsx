"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Mail, Loader2, AlertCircle, CheckCircle, Sparkles, ArrowRight, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [done,    setDone]    = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        setError(error.message);
        return;
      }
      setDone(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "var(--bg-primary)" }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 40, textDecoration: "none" }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
            background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
          }}>
            <Sparkles size={15} color="white" fill="white" />
          </div>
          <span className="font-display" style={{ fontWeight: 800, fontSize: 16, color: "var(--text-primary)" }}>Vaurex</span>
        </Link>

        <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-primary)", borderRadius: 16, padding: 40 }}>
          {done ? (
            <>
              <div style={{
                width: 56, height: 56, borderRadius: 14, margin: "0 auto 20px",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "var(--cyan-surface)", border: "1.5px solid var(--cyan-border)",
              }}>
                <CheckCircle size={26} color="var(--cyan)" />
              </div>
              <h1 className="font-display" style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)", marginBottom: 8, textAlign: "center" }}>
                Check your email
              </h1>
              <p style={{ color: "var(--text-secondary)", fontSize: 15, marginBottom: 32, textAlign: "center", lineHeight: 1.7 }}>
                We sent a reset link to <strong style={{ color: "var(--text-primary)" }}>{email}</strong>.
              </p>
              <Link href="/login" className="btn-ghost" style={{ width: "100%", justifyContent: "center", padding: 11 }}>
                <ArrowLeft size={14} /> Back to sign in
              </Link>
            </>
          ) : (
            <>
              <h1 className="font-display" style={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary)", marginBottom: 6 }}>
                Forgot password?
              </h1>
              <p style={{ color: "var(--text-secondary)", fontSize: 15, marginBottom: 32 }}>
                Enter your email and we&apos;ll send a reset link.
              </p>

              {error && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 10, padding: 12, borderRadius: 12, marginBottom: 20,
                  background: "rgba(239,68,68,0.08)", border: "1.5px solid rgba(239,68,68,0.2)", color: "#EF4444", fontSize: 14,
                }}>
                  <AlertCircle size={15} style={{ flexShrink: 0 }} />{error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 8 }}>
                    Email
                  </label>
                  <div style={{ position: "relative" }}>
                    <Mail size={15} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="you@company.com" className="field field-icon" />
                  </div>
                </div>

                <button type="submit" disabled={loading} className="btn-primary"
                  style={{ width: "100%", justifyContent: "center", padding: "12px", opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer" }}>
                  {loading ? <Loader2 size={15} className="animate-spin" /> : <>Send reset link <ArrowRight size={14} /></>}
                </button>
              </form>

              <div style={{ textAlign: "center", marginTop: 24 }}>
                <Link href="/login" style={{ fontSize: 13, color: "var(--text-secondary)", display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <ArrowLeft size={13} /> Back to sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
