"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Mail,
  Lock,
  User,
  Loader2,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Eye,
  EyeOff,
  ArrowLeft,
  Shield,
  Crown,
} from "lucide-react";
import { GoogleButton, AuthDivider, OtpInput } from "@/components/ui/OtpInput";

function RegisterInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<"free" | "pro">("free");
  const [step, setStep] = useState<'form'|'verify'>('form');
  const [loading, setLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const plan = searchParams.get("plan") as "free" | "pro" | null;
    if (plan === "free" || plan === "pro") {
      setSelectedPlan(plan);
    }
  }, [searchParams]);

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    // Stays loading until redirect
  }

  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const strengthLabel = ["", "Weak", "Good", "Strong"][strength];
  const strengthColor = ["", "var(--danger)", "var(--pro)", "var(--success)"][strength];

  async function handleVerifyOtp(code: string) {
    setVerifyLoading(true);
    setError('');
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'signup'
    });
    if (error) {
      setError('Invalid or expired code. Try again.');
      setVerifyLoading(false);
      return;
    }
    router.push('/workbench');
  }

  async function handleResend() {
    setResendLoading(true);
    await supabase.auth.resend({ type: 'signup', email });
    setResendLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { 
            full_name: name,
            plan: selectedPlan,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setError(error.message);
        return;
      }

      // If email confirmation is required, Supabase returns a user but no session.
      if (data?.user && !data.session) {
        setDone(true);
        return;
      }

      // If a session exists (email confirmation disabled), redirect straight to workbench.
      if (data?.session) {
        router.push("/workbench");
        return;
      }

      // Fallback: show done state.
      setDone(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleResendEmail() {
    setResendLoading(true);
    setError("");
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setError(error.message);
        return;
      }
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-base)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Radial gradient background glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          background:
            "radial-gradient(ellipse 80% 60% at 50% -20%, rgba(255,107,53,0.08), transparent)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          background:
            "radial-gradient(ellipse 60% 40% at 80% 80%, rgba(59,130,246,0.06), transparent)",
          pointerEvents: "none",
        }}
      />

      {/* Back to Home button */}
      <Link
        href="/"
        style={{
          position: "absolute",
          top: 24,
          left: 24,
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          gap: 6,
          color: "var(--text-2)",
          fontSize: 14,
          fontWeight: 500,
          transition: "color 150ms",
          padding: "8px 12px",
          borderRadius: 8,
          border: "1px solid var(--border)",
          background: "rgba(44,44,46,0.8)",
          backdropFilter: "blur(8px)",
        }}
      >
        <ArrowLeft size={16} /> Home
      </Link>

      <div
        style={{
          width: "100%",
          maxWidth: 440,
          position: "relative",
          zIndex: 1,
          background: "var(--bg-surface)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16,
          padding: 40,
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 24,
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--accent-primary)",
            }}
          >
            <Shield size={20} color="white" />
          </div>
          <span
            style={{
              fontWeight: 700,
              fontSize: 22,
              color: "var(--text-1)",
            }}
          >
            Vaurex
          </span>
        </div>

        {done ? (
          <>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 12,
                margin: "0 auto 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(16,185,129,0.1)",
                border: "1px solid rgba(16,185,129,0.2)",
              }}
            >
              <CheckCircle size={26} color="var(--success)" />
            </div>
            <h1
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: "var(--text-1)",
                marginBottom: 8,
                textAlign: "center",
              }}
            >
              Check your email
            </h1>
            <p
              style={{
                color: "var(--text-2)",
                fontSize: 15,
                marginBottom: 16,
                textAlign: "center",
                lineHeight: 1.7,
              }}
            >
              We sent a magic link to{" "}
              <strong style={{ color: "var(--text-1)" }}>{email}</strong>. Follow it to verify your
              account.
            </p>
            <p
              style={{
                color: "#71717A",
                fontSize: 13,
                marginBottom: 24,
                textAlign: "center",
              }}
            >
              Didn&apos;t receive it? Check your spam folder or{" "}
              <button
                onClick={handleResendEmail}
                disabled={resendLoading}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--accent-primary)",
                  cursor: resendLoading ? "not-allowed" : "pointer",
                  textDecoration: "underline",
                  fontSize: 13,
                }}
              >
                {resendLoading ? "Sending..." : "click to resend"}
              </button>
            </p>
            <button
              type="button"
              onClick={() => {
                setDone(false);
                setPassword("");
              }}
              style={{
                width: "100%",
                background: "var(--accent-orange)",
                color: "white",
                border: "none",
                borderRadius: 8,
                padding: "12px",
                fontWeight: 600,
                fontSize: 15,
                cursor: "pointer",
                transition: "background 150ms, transform 150ms",
              }}
            >
              Back to sign in
            </button>
          </>
        ) : (
          <>
            <h1
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: "var(--text-1)",
                marginBottom: 8,
                textAlign: "center",
              }}
            >
              Create your account
            </h1>
            <p
              style={{
                color: "var(--text-2)",
                fontSize: 14,
                marginBottom: 24,
                textAlign: "center",
              }}
            >
              Start shipping trusted document intelligence in minutes.
            </p>

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

            {/* Plan Selection */}
            <div style={{ marginBottom: 24 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--text-1)",
                  marginBottom: 12,
                }}
              >
                Choose your plan
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setSelectedPlan("free")}
                  style={{
                    padding: "16px 12px",
                    border: selectedPlan === "free" ? "2px solid var(--accent-primary)" : "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                    background: selectedPlan === "free" ? "var(--accent-dim)" : "transparent",
                    color: selectedPlan === "free" ? "var(--accent-primary)" : "var(--text-2)",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <Shield size={16} />
                  <div>
                    <div style={{ fontWeight: 700 }}>Free</div>
                    <div style={{ fontSize: 12, opacity: 0.8 }}>5 scans/day</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPlan("pro")}
                  style={{
                    padding: "16px 12px",
                    border: selectedPlan === "pro" ? "2px solid var(--pro)" : "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                    background: selectedPlan === "pro" ? "rgba(245,158,11,0.1)" : "transparent",
                    color: selectedPlan === "pro" ? "var(--pro)" : "var(--text-2)",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <Crown size={16} />
                  <div>
                    <div style={{ fontWeight: 700 }}>Pro</div>
                    <div style={{ fontSize: 12, opacity: 0.8 }}>$19/month</div>
                  </div>
                </button>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              style={{
                display: "grid",
                gap: 16,
              }}
            >
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
                  Full name
                </label>
                <div
                  style={{
                    position: "relative",
                  }}
                >
                  <User
                    size={16}
                    style={{
                      position: "absolute",
                      left: 14,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--text-3)",
                    }}
                  />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Carter"
                    style={{
                      width: "100%",
                      background: "#1C1C1E",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 8,
                      color: "var(--text-1)",
                      padding: "12px 14px 12px 44px",
                      fontSize: 14,
                      outline: "none",
                      transition: "border-color 150ms",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "var(--accent-primary)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "rgba(255,255,255,0.1)";
                    }}
                  />
                </div>
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
                  Work email
                </label>
                <div
                  style={{
                    position: "relative",
                  }}
                >
                  <Mail
                    size={16}
                    style={{
                      position: "absolute",
                      left: 14,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--text-3)",
                    }}
                  />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    style={{
                      width: "100%",
                      background: "#1C1C1E",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 8,
                      color: "var(--text-1)",
                      padding: "12px 14px 12px 44px",
                      fontSize: 14,
                      outline: "none",
                      transition: "border-color 150ms",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "var(--accent-primary)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "rgba(255,255,255,0.1)";
                    }}
                  />
                </div>
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
                  Password
                </label>
                <div
                  style={{
                    position: "relative",
                  }}
                >
                  <Lock
                    size={16}
                    style={{
                      position: "absolute",
                      left: 14,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--text-3)",
                    }}
                  />
                  <input
                    type={show ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{
                      width: "100%",
                      background: "#1C1C1E",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 8,
                      color: "var(--text-1)",
                      padding: "12px 44px 12px 44px",
                      fontSize: 14,
                      outline: "none",
                      transition: "border-color 150ms",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "var(--accent-primary)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "rgba(255,255,255,0.1)";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShow(!show)}
                    style={{
                      position: "absolute",
                      right: 14,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--text-3)",
                      padding: 4,
                    }}
                  >
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {strength > 0 && (
                  <div
                    style={{
                      marginTop: 8,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontSize: 12,
                      color: "var(--text-2)",
                    }}
                  >
                    <span>Password strength</span>
                    <span style={{ color: strengthColor }}>{strengthLabel}</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  background: "var(--accent-orange)",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  padding: "12px",
                  fontWeight: 600,
                  fontSize: 15,
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.7 : 1,
                  transition: "background 150ms, transform 150ms",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    Create account <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>

            <GoogleButton onClick={handleGoogleLogin} loading={googleLoading} />
            <AuthDivider />
            {step === 'form' && (
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
                  <Mail size={24} color="var(--accent-primary)" />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
                    1. Create your account
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
                        Name
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your full name"
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
                        Password
                      </label>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="•••••••"
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
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        marginBottom: 16,
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <label
                          style={{
                            display: "block",
                            fontSize: 13,
                            fontWeight: 500,
                            color: "var(--text-1)",
                            marginBottom: 8,
                          }}
                        >
                          Plan
                        </label>
                        <select
                          value={selectedPlan}
                          onChange={(e) => setSelectedPlan(e.target.value as "free" | "pro")}
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
                        >
                          <option value="free">Free - 5 scans/day</option>
                          <option value="pro">Pro - Unlimited scans</option>
                        </select>
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      style={{
                        width: "100%",
                        padding: "12px 24px",
                        background: "var(--accent-orange)",
                        color: "white",
                        border: "none",
                        borderRadius: 8,
                        fontSize: 15,
                        fontWeight: 600,
                        cursor: loading ? "not-allowed" : "pointer",
                        transition: "all 0.15s"
                      }}
                    >
                      {loading ? 'Creating account...' : 'Create account'}
                    </button>
                  </form>
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
                    2. Verify your email
                  </h3>
                  <p style={{ fontSize: 16, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 16 }}>
                    We sent a 6-digit code to <strong>{email}</strong>
                  </p>
                  <OtpInput onComplete={handleVerifyOtp} loading={verifyLoading} />
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
                        color: resendLoading ? "var(--text-3)" : "var(--accent-primary)"
                      }}
                    >
                      {resendLoading ? 'Resend code' : 'Resend code'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {step === 'verify' && done && (
              <div style={{
                textAlign: "center",
                marginTop: 48,
                padding: 32,
                background: "var(--bg-surface)",
                borderRadius: 16,
                border: "1px solid var(--border-primary)"
              }}>
                <h2 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16 }}>
                  Account created!
                </h2>
                <p style={{ fontSize: 16, color: "var(--text-secondary)", marginBottom: 16 }}>
                  Redirecting you to workbench...
                </p>
              </div>
            )}
            <p
              style={{
                textAlign: "center",
                marginTop: 20,
                fontSize: 13,
                color: "var(--text-2)",
              }}
            >
              Already have an account?{" "}
              <Link
                href="/login"
                style={{
                  color: "var(--accent-primary)",
                  fontWeight: 500,
                }}
              >
                Sign in
              </Link>
            </p>

            <p
              style={{
                textAlign: "center",
                marginTop: 20,
                fontSize: 12,
                color: "#52525B",
              }}
            >
              By continuing you agree to our Terms and Privacy Policy
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterInner />
    </Suspense>
  );
}