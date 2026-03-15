"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function ResetPasswordInner() {
  const router = useRouter();
  const params = useSearchParams();
  const supabase = useMemo(() => createClient(), []);

  const [initializing, setInitializing] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    const code = params.get("code");
    if (!code) {
      setInitializing(false);
      setError("Reset link is invalid or expired. Request a new reset email.");
      return;
    }

    let active = true;
    (async () => {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (!active) return;
      if (exchangeError) {
        setError("Reset link is invalid or expired. Request a new reset email.");
      }
      setInitializing(false);
    })();

    return () => {
      active = false;
    };
  }, [params, supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSaving(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push("/login"), 1500);
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 460, background: "var(--bg-surface)", border: "1px solid var(--border-primary)", borderRadius: 16, padding: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary)", marginBottom: 8, letterSpacing: "-0.02em" }}>
          Set a new password
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>
          Use your reset link to securely set a new password.
        </p>

        {error && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 12, borderRadius: 10, border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.1)", color: "var(--danger)", fontSize: 13, marginBottom: 14 }}>
            <AlertCircle size={15} /> {error}
          </div>
        )}

        {success ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 12, borderRadius: 10, border: "1px solid rgba(16,185,129,0.25)", background: "rgba(16,185,129,0.1)", color: "var(--text-primary)", fontSize: 13 }}>
            <CheckCircle size={15} color="var(--success)" /> Password updated. Redirecting to login...
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12, opacity: initializing ? 0.7 : 1 }}>
            <input
              type="password"
              required
              disabled={initializing || saving}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
              style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border-primary)", borderRadius: 10, color: "var(--text-primary)", padding: "11px 12px", fontSize: 14, outline: "none" }}
            />
            <input
              type="password"
              required
              disabled={initializing || saving}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border-primary)", borderRadius: 10, color: "var(--text-primary)", padding: "11px 12px", fontSize: 14, outline: "none" }}
            />

            <button
              type="submit"
              disabled={initializing || saving}
              style={{ width: "100%", background: "var(--accent-orange)", color: "white", border: "none", borderRadius: 10, padding: "11px 14px", fontSize: 14, fontWeight: 700, cursor: initializing || saving ? "not-allowed" : "pointer", opacity: initializing || saving ? 0.7 : 1 }}
            >
              {initializing ? "Verifying link..." : saving ? "Updating..." : "Update password"}
            </button>
          </form>
        )}

        <div style={{ textAlign: "center", marginTop: 20 }}>
          <Link href="/forgot-password" style={{ color: "var(--text-muted)", fontSize: 13 }}>
            Request another reset email
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordInner />
    </Suspense>
  );
}
