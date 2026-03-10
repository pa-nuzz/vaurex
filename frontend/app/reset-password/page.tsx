"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Lock, Loader2, CheckCircle, AlertCircle, Sparkles, ArrowRight, Eye, EyeOff } from "lucide-react";

export default function ResetPasswordPage() {
  const router   = useRouter();
  const supabase = createClient();
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [show,     setShow]     = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [done,     setDone]     = useState(false);
  const [ready,    setReady]    = useState(false);

  useEffect(() => {
    const { data: subscription } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });
    return () => {
      subscription.subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const strengthLabel = ["", "Weak", "Good", "Strong"][strength];
  const strengthColor = ["", "#EF4444", "#F59E0B", "#10B981"][strength];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { error } = await supabase.auth.updateUser({ password });
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
        <div style={{ width: 56, height: 56, borderRadius: 14, margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(16,185,129,0.1)", border: "1.5px solid rgba(16,185,129,0.2)" }}>
          <CheckCircle size={26} color="#10B981" />
        </div>
        <h2 className="font-display" style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)", marginBottom: 8 }}>
          Password updated
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: 15, marginBottom: 32 }}>
          Your password has been changed. You can now sign in.
        </p>
        <Link href="/login" className="btn-primary" style={{ justifyContent: "center", width: "100%", padding: 12 }}>
          Sign in <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );

  if (!ready) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "var(--bg-primary)" }}>
      <div style={{ width: "100%", maxWidth: 440, borderRadius: 16, border: "1px solid var(--border-primary)", padding: 48, textAlign: "center", background: "var(--bg-secondary)" }}>
        <Loader2 size={28} className="animate-spin" style={{ margin: "0 auto 16px", display: "block", color: "var(--accent-primary)" }} />
        <p style={{ color: "var(--text-secondary)" }}>Verifying reset link...</p>
      </div>
    </div>
  );

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
          <h1 className="font-display" style={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary)", marginBottom: 6 }}>
            Set new password
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 15, marginBottom: 32 }}>
            Choose a strong password for your account.
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
                New Password
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

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 8 }}>
                Confirm Password
              </label>
              <div style={{ position: "relative" }}>
                <Lock size={15} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input type={show ? "text" : "password"} required value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Repeat password" className="field field-icon" />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary"
              style={{ width: "100%", justifyContent: "center", padding: "12px", opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer" }}>
              {loading ? <Loader2 size={15} className="animate-spin" /> : <>Update password <ArrowRight size={14} /></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
