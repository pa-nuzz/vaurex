"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { GoogleButton, AuthDivider, OtpInput } from "@/components/ui/OtpInput";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<'email'|'verify'|'reset'>('email');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    });

    if (error) {
      setError(error.message);
    } else {
      setStep('verify');
    }
    setLoading(false);
  }

  async function handleVerifyReset(code: string) {
    setVerifyLoading(true);
    setError('');

    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'recovery' as any
    });

    if (error) {
      setError('Invalid or expired code. Try again.');
      setVerifyLoading(false);
      return;
    }
    setStep('reset');
  }

  async function handleResend() {
    setResendLoading(true);
    const supabase = createClient();
    await supabase.auth.resend({ type: 'recovery' as any, email });
    setResendLoading(false);
  }

  async function handleUpdatePassword(newPassword: string) {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setTimeout(() => {
      window.location.href = '/login';
    }, 1500);
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      <div style={{ maxWidth: 440, margin: "0 auto", padding: "24px" }}>
        {/* Back button */}
        <Link href="/login" style={{ 
          display: "inline-flex", 
          alignItems: "center", 
          gap: 8, 
          color: "var(--text-muted)", 
          fontSize: 14, 
          marginBottom: 32,
          textDecoration: "none",
          transition: "color 0.2s"
        }} 
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--accent)"} 
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"}>
          <ArrowLeft size={16} /> Back to Login
        </Link>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h1 style={{ 
            fontSize: "clamp(32px, 4vw, 48px)", 
            fontWeight: 800, 
            color: "var(--text-primary)", 
            marginBottom: 16,
            letterSpacing: "-0.02em"
          }}>
            Reset your password
          </h1>
          <p style={{ 
            fontSize: 18, 
            color: "var(--text-secondary)", 
            lineHeight: 1.6,
            maxWidth: 600,
            margin: "0 auto"
          }}>
            Enter your email and we&apos;ll send you a 6-digit reset code.
          </p>
        </div>

        {step === 'email' && (
          <div style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-primary)",
            borderRadius: 16,
            padding: 32,
            display: "flex",
            gap: 24,
            alignItems: "flex-start"
          }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              background: "var(--accent-dim)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0
            }}>
              <Mail size={24} color="var(--accent)" />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
                1. Enter your email
              </h3>
              <form onSubmit={handleSubmit}>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 13,
                      fontWeight: 500,
                      color: "var(--text-1)",
                      marginBottom: 8,
                    }}
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    style={{
                      width: "100%",
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border-primary)",
                      borderRadius: 8,
                      padding: "12px 44px 12px 44px",
                      fontSize: 14,
                      color: "var(--text-1)",
                      outline: "none",
                      transition: "border-color 150ms",
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "12px 24px",
                    background: "var(--accent)",
                    color: "white",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: loading ? "not-allowed" : "pointer",
                    transition: "all 0.15s"
                  }}
                >
                  {loading ? 'Sending reset code...' : 'Send reset code'}
                </button>
              </form>
              {error && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: 12,
                    borderRadius: 8,
                    marginBottom: 20,
                    background: "rgba(239,68,68,0.1)",
                    border: "1px solid rgba(239,68,68,0.2)",
                    color: "var(--danger)",
                    fontSize: 14,
                  }}
                >
                  <AlertCircle size={15} style={{ flexShrink: 0 }} />
                  {error}
                </div>
              )}
            </div>
          </div>
        )}

        {step === 'verify' && (
          <div style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-primary)",
            borderRadius: 16,
            padding: 32,
            display: "flex",
            gap: 24,
            alignItems: "flex-start"
          }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              background: "var(--blue-dim)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0
            }}>
              <Mail size={24} color="var(--blue)" />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
                2. Enter reset code
              </h3>
              <p style={{ fontSize: 16, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 16 }}>
                6-digit code sent to <strong>{email}</strong>
              </p>
              <OtpInput onComplete={handleVerifyReset} loading={verifyLoading} />
              <div style={{ marginTop: 16 }}>
                <button
                  onClick={handleResend}
                  disabled={resendLoading}
                  style={{
                    padding: "8px 16px",
                    fontSize: 14,
                    fontWeight: 600,
                    borderRadius: 8,
                    border: "none",
                    cursor: resendLoading ? "not-allowed" : "pointer",
                    transition: "all 0.15s",
                    color: resendLoading ? "var(--text-3)" : "var(--accent)"
                  }}
                >
                  {resendLoading ? 'Resend code' : 'Resend code'}
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 'reset' && (
          <div style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-primary)",
            borderRadius: 16,
            padding: 32,
            display: "flex",
            gap: 24,
            alignItems: "flex-start"
          }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              background: "rgba(245,158,11,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0
            }}>
              <Mail size={24} color="var(--success)" />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
                3. Set new password
              </h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                const newPassword = (e.currentTarget as HTMLFormElement).newPassword.value;
                const confirmPassword = (e.currentTarget as HTMLFormElement).confirmPassword.value;
                
                if (newPassword !== confirmPassword) {
                  setError("Passwords don't match");
                  return;
                }
                if (newPassword.length < 6) {
                  setError("Min 6 characters");
                  return;
                }
                
                setError('');
                handleUpdatePassword(newPassword);
              }}>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 13,
                      fontWeight: 500,
                      color: "var(--text-1)",
                      marginBottom: 8,
                    }}
                  >
                    New password
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    required
                    style={{
                      width: "100%",
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border-primary)",
                      borderRadius: 8,
                      padding: "12px 44px 12px 44px",
                      fontSize: 14,
                      color: "var(--text-1)",
                      outline: "none",
                      transition: "border-color 150ms",
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 13,
                      fontWeight: 500,
                      color: "var(--text-1)",
                      marginBottom: 8,
                    }}
                  >
                    Confirm password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    required
                    style={{
                      width: "100%",
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border-primary)",
                      borderRadius: 8,
                      padding: "12px 44px 12px 44px",
                      fontSize: 14,
                      color: "var(--text-1)",
                      outline: "none",
                      transition: "border-color 150ms",
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "12px 24px",
                    background: "var(--accent)",
                    color: "white",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: loading ? "not-allowed" : "pointer",
                    transition: "all 0.15s"
                  }}
                >
                  {loading ? 'Updating password...' : 'Update password'}
                </button>
              </form>
              {error && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: 12,
                    borderRadius: 8,
                    marginBottom: 20,
                    background: "rgba(239,68,68,0.1)",
                    border: "1px solid rgba(239,68,68,0.2)",
                    color: "var(--danger)",
                    fontSize: 14,
                  }}
                >
                  <AlertCircle size={15} style={{ flexShrink: 0 }} />
                  {error}
                </div>
              )}
            </div>
          </div>
        )}

        {step === 'reset' && (
          <div style={{
            textAlign: "center",
            marginTop: 48,
            padding: 32,
            background: "var(--bg-surface)",
            borderRadius: 16,
            border: "1px solid var(--border-primary)"
          }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16 }}>
              Password updated!
            </h2>
            <p style={{ fontSize: 16, color: "var(--text-secondary)", marginBottom: 16 }}>
              Redirecting you in...
            </p>
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 24 }}>
          <Link href="/login" style={{ color: "var(--text-3)", fontSize: 14 }}>
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
