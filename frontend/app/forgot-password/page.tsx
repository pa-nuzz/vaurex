"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, AlertCircle, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { apiJson } from "@/lib/api";

type Step = "email" | "code" | "password" | "done";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    const cleanedEmail = email.trim();
    if (!cleanedEmail) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await apiJson(
        "/api/v1/auth/password-reset/request-code",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: cleanedEmail }),
        },
        { fallbackMessage: "Could not send reset code." },
      );
      setStep("code");
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : "Could not send reset code.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) {
      setError("Please enter the 6-digit code.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const supabase = createClient();
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: code.trim(),
        type: "recovery",
      });
      if (verifyError) {
        setError("Invalid or expired code. Please try again.");
        return;
      }
      setStep("password");
    } finally {
      setLoading(false);
    }
  }

  async function updatePassword(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message);
        return;
      }
      setStep("done");
      setTimeout(() => {
        window.location.href = "/login";
      }, 1500);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 460, background: "var(--bg-surface)", border: "1px solid var(--border-primary)", borderRadius: 16, padding: 32 }}>
        <Link href="/login" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "var(--text-muted)", fontSize: 14, textDecoration: "none", marginBottom: 24 }}>
          <ArrowLeft size={16} /> Back to login
        </Link>

        <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary)", marginBottom: 8, letterSpacing: "-0.02em" }}>
          Reset password
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>
          {step === "email" && "Enter your email to get a 6-digit reset code."}
          {step === "code" && `Enter the 6-digit code sent to ${email.trim()}.`}
          {step === "password" && "Set your new password."}
          {step === "done" && "Password reset successful. Redirecting to login..."}
        </p>

        {error && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 12, borderRadius: 10, border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.1)", color: "var(--danger)", fontSize: 13, marginBottom: 14 }}>
            <AlertCircle size={15} /> {error}
          </div>
        )}

        {step === "done" ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 12, borderRadius: 10, border: "1px solid rgba(16,185,129,0.25)", background: "rgba(16,185,129,0.1)", color: "var(--text-primary)", fontSize: 13 }}>
            <CheckCircle size={15} color="var(--success)" /> Password updated successfully.
          </div>
        ) : (
          <>
            {step === "email" && (
              <form onSubmit={requestCode} style={{ display: "grid", gap: 12 }}>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border-primary)", borderRadius: 10, color: "var(--text-primary)", padding: "11px 12px", fontSize: 14, outline: "none" }}
                />
                <button
                  type="submit"
                  disabled={loading}
                  style={{ width: "100%", background: "var(--accent-orange)", color: "white", border: "none", borderRadius: 10, padding: "11px 14px", fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? "Sending..." : "Send 6-digit code"}
                </button>
              </form>
            )}

            {step === "code" && (
              <form onSubmit={verifyCode} style={{ display: "grid", gap: 12 }}>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="Enter 6-digit code"
                  style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border-primary)", borderRadius: 10, color: "var(--text-primary)", padding: "11px 12px", fontSize: 16, letterSpacing: "0.12em", outline: "none" }}
                />
                <button
                  type="submit"
                  disabled={loading}
                  style={{ width: "100%", background: "var(--accent-orange)", color: "white", border: "none", borderRadius: 10, padding: "11px 14px", fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? "Verifying..." : "Verify code"}
                </button>
              </form>
            )}

            {step === "password" && (
              <form onSubmit={updatePassword} style={{ display: "grid", gap: 12 }}>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New password"
                  style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border-primary)", borderRadius: 10, color: "var(--text-primary)", padding: "11px 12px", fontSize: 14, outline: "none" }}
                />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border-primary)", borderRadius: 10, color: "var(--text-primary)", padding: "11px 12px", fontSize: 14, outline: "none" }}
                />
                <button
                  type="submit"
                  disabled={loading}
                  style={{ width: "100%", background: "var(--accent-orange)", color: "white", border: "none", borderRadius: 10, padding: "11px 14px", fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? "Updating..." : "Reset password"}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
