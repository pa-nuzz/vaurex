"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Mail, Lock, Loader2, AlertCircle, Sparkles, ArrowRight, Eye, EyeOff } from "lucide-react";

function LoginInner() {
  const router   = useRouter();
  const params   = useSearchParams();
  const nextRaw  = params.get("next") || "/workbench";
  const next     = nextRaw.startsWith("/") && !nextRaw.startsWith("//") ? nextRaw : "/workbench";
  const supabase = createClient();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [show,     setShow]     = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        return;
      }
      router.replace(next);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "var(--bg-primary)" }}>
      {/* Decorative left panel */}
      <div style={{
        display: "none", flex: 1, position: "relative", overflow: "hidden",
        background: "linear-gradient(160deg, #0C0C14 0%, #1A1030 100%)",
      }} className="hidden lg:flex">
        <div style={{
          position: "absolute", top: "15%", left: "20%", width: 280, height: 280,
          borderRadius: "50%", background: "rgba(124,92,252,0.08)", filter: "blur(80px)",
        }} />
        <div style={{
          position: "absolute", bottom: "20%", right: "15%", width: 220, height: 220,
          borderRadius: "50%", background: "rgba(6,214,160,0.06)", filter: "blur(60px)",
        }} />
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 64px" }}>
          <h2 className="font-display" style={{ fontSize: 36, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.2, marginBottom: 16 }}>
            Document<br />Intelligence,<br /><span style={{ color: "var(--accent-primary)" }}>Instantly.</span>
          </h2>
          <p style={{ fontSize: 15, color: "var(--text-secondary)", maxWidth: 320, lineHeight: 1.7 }}>
            Upload any document and get AI-powered risk scoring, entity extraction, and executive summaries in seconds.
          </p>
        </div>
      </div>

      {/* Login form */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
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
            <h1 className="font-display" style={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary)", marginBottom: 6 }}>
              Welcome back
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: 15, marginBottom: 32 }}>
              Sign in to your account
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
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 8 }}>
                  Email
                </label>
                <div style={{ position: "relative" }}>
                  <Mail size={15} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@company.com" className="field field-icon" />
                </div>
              </div>

              <div style={{ marginBottom: 8 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 8 }}>
                  Password
                </label>
                <div style={{ position: "relative" }}>
                  <Lock size={15} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                  <input type={show ? "text" : "password"} required value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••" className="field field-icon" style={{ paddingRight: 44 }} />
                  <button type="button" onClick={() => setShow(!show)}
                    style={{ position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 2 }}>
                    {show ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div style={{ textAlign: "right", marginBottom: 24 }}>
                <Link href="/forgot-password" style={{ fontSize: 13, color: "var(--accent-primary)", fontWeight: 500 }}>
                  Forgot password?
                </Link>
              </div>

              <button type="submit" disabled={loading} className="btn-primary"
                style={{ width: "100%", justifyContent: "center", padding: "12px", opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer" }}>
                {loading ? <Loader2 size={15} className="animate-spin" /> : <>Sign in <ArrowRight size={14} /></>}
              </button>
            </form>

            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "24px 0" }}>
              <div style={{ flex: 1, height: 1, background: "var(--border-secondary)" }} />
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>or</span>
              <div style={{ flex: 1, height: 1, background: "var(--border-secondary)" }} />
            </div>

            <Link href="/register" className="btn-ghost" style={{ width: "100%", justifyContent: "center", padding: 11 }}>
              Create a free account <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}
