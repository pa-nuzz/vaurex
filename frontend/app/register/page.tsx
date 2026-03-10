"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Mail, Lock, User, Loader2, AlertCircle, CheckCircle, Sparkles, ArrowRight, Eye, EyeOff, Shield, Zap, FileSearch } from "lucide-react";

export default function RegisterPage() {
  const router   = useRouter();
  const supabase = createClient();

  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [show,     setShow]     = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [done,     setDone]     = useState(false);

  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const strengthLabel = ["", "Weak", "Good", "Strong"][strength];
  const strengthColor = ["", "#EF4444", "#F59E0B", "#10B981"][strength];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    setError("");
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
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

  if (done) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "var(--bg-primary)" }}>
      <div style={{ width: "100%", maxWidth: 440, borderRadius: 16, border: "1px solid var(--border-primary)", padding: 48, textAlign: "center", background: "var(--bg-secondary)" }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--cyan-surface)", border: "1.5px solid var(--cyan-border)" }}>
          <CheckCircle size={26} color="var(--cyan)" />
        </div>
        <h2 className="font-display" style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)", marginBottom: 8 }}>Check your email</h2>
        <p style={{ color: "var(--text-secondary)", fontSize: 15, marginBottom: 32, lineHeight: 1.7 }}>
          We sent a confirmation link to <strong style={{ color: "var(--text-primary)" }}>{email}</strong>. Click it to activate your account.
        </p>
        <Link href="/login" className="btn-primary" style={{ justifyContent: "center", width: "100%", padding: 12 }}>
          Back to sign in <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );

  const features = [
    { icon: Shield, label: "Military-grade encryption" },
    { icon: Zap,    label: "Instant AI analysis" },
    { icon: FileSearch, label: "Deep entity extraction" },
  ];

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "var(--bg-primary)" }}>
      {/* Decorative left panel */}
      <div style={{
        display: "none", flex: 1, position: "relative", overflow: "hidden",
        background: "linear-gradient(160deg, #0C0C14 0%, #1A1030 100%)",
      }} className="hidden lg:flex">
        <div style={{
          position: "absolute", top: "10%", right: "10%", width: 260, height: 260,
          borderRadius: "50%", background: "rgba(124,92,252,0.08)", filter: "blur(80px)",
        }} />
        <div style={{
          position: "absolute", bottom: "15%", left: "10%", width: 200, height: 200,
          borderRadius: "50%", background: "rgba(6,214,160,0.06)", filter: "blur(60px)",
        }} />
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 64px" }}>
          <h2 className="font-display" style={{ fontSize: 36, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.2, marginBottom: 16 }}>
            Start scanning<br />documents<br /><span style={{ color: "var(--cyan)" }}>for free.</span>
          </h2>
          <p style={{ fontSize: 15, color: "var(--text-secondary)", maxWidth: 320, lineHeight: 1.7, marginBottom: 32 }}>
            Get 3 free document scans. No credit card required.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {features.map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--accent-surface)", border: "1px solid var(--accent-border)" }}>
                  <f.icon size={16} color="var(--accent-primary)" />
                </div>
                <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Register form */}
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
              Create account
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: 15, marginBottom: 32 }}>
              3 free scans included — no credit card needed
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
                  Full Name
                </label>
                <div style={{ position: "relative" }}>
                  <User size={15} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                  <input type="text" required value={name} onChange={e => setName(e.target.value)}
                    placeholder="Jane Doe" className="field field-icon" />
                </div>
              </div>

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

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 8 }}>
                  Password
                </label>
                <div style={{ position: "relative" }}>
                  <Lock size={15} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                  <input type={show ? "text" : "password"} required value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min. 6 characters" className="field field-icon" style={{ paddingRight: 44 }} />
                  <button type="button" onClick={() => setShow(!show)}
                    style={{ position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 2 }}>
                    {show ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {password.length > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                    <div style={{ flex: 1, height: 3, borderRadius: 2, overflow: "hidden", background: "var(--border-primary)" }}>
                      <div style={{ height: "100%", borderRadius: 2, background: strengthColor, width: `${(strength / 3) * 100}%`, transition: "width .3s" }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: strengthColor }}>{strengthLabel}</span>
                  </div>
                )}
              </div>

              <button type="submit" disabled={loading} className="btn-primary"
                style={{ width: "100%", justifyContent: "center", padding: "12px", opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer" }}>
                {loading ? <Loader2 size={15} className="animate-spin" /> : <>Create account <ArrowRight size={14} /></>}
              </button>
            </form>

            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "24px 0" }}>
              <div style={{ flex: 1, height: 1, background: "var(--border-secondary)" }} />
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>or</span>
              <div style={{ flex: 1, height: 1, background: "var(--border-secondary)" }} />
            </div>

            <Link href="/login" className="btn-ghost" style={{ width: "100%", justifyContent: "center", padding: 11 }}>
              Sign in to existing account <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
