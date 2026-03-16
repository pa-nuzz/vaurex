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
import { GoogleButton, AuthDivider } from "@/components/ui/OtpInput";

function sanitizeRegisterErrorMessage(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("already") || m.includes("exists") || m.includes("taken")) {
    return "An account with this email already exists.";
  }
  if (m.includes("password") && m.includes("weak")) {
    return "Please choose a stronger password.";
  }
  if (m.includes("too many") || m.includes("rate limit")) {
    return "Too many attempts. Please wait and try again.";
  }
  return "Unable to create your account right now. Please try again.";
}

function RegisterInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<"free" | "pro">("free");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [show, setShow] = useState(false);
  const [isDuplicateEmail, setIsDuplicateEmail] = useState(false);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    setError("");
    setIsDuplicateEmail(false);
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
        const msg = error.message.toLowerCase();
        if (
          msg.includes("already registered") ||
          msg.includes("already exists") ||
          msg.includes("already taken")
        ) {
          setIsDuplicateEmail(true);
        } else {
          setError(sanitizeRegisterErrorMessage(error.message));
        }
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
        setError(sanitizeRegisterErrorMessage(error.message));
        return;
      }
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <div className="auth-shell">
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
        className="auth-back-link"
        style={{
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

      <div className="auth-card" style={{ maxWidth: 520 }}>
        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 28,
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "var(--radius-md)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, var(--accent), var(--accent-bright))",
              boxShadow: "var(--shadow-accent)",
            }}
          >
            <Shield size={24} color="white" />
          </div>
          <span
            style={{
              fontWeight: 800,
              fontSize: 26,
              color: "var(--text-primary)",
              fontFamily: "var(--font-display)",
              letterSpacing: "-0.02em",
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
                fontSize: 28,
                fontWeight: 800,
                color: "var(--text-primary)",
                marginBottom: 8,
                textAlign: "center",
                fontFamily: "var(--font-display)",
                letterSpacing: "-0.03em",
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

            {isDuplicateEmail && (
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: 12,
                  borderRadius: 8,
                  marginBottom: 20,
                  background: "rgba(245,158,11,0.1)",
                  border: "1px solid rgba(245,158,11,0.25)",
                  color: "var(--pro)",
                  fontSize: 14,
                }}
              >
                <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>
                  An account with this email already exists.{" "}
                  <Link href="/login" style={{ color: "var(--accent-primary)", fontWeight: 600, textDecoration: "underline" }}>
                    Sign in instead →
                  </Link>
                </span>
              </div>
            )}

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
                    className="premium-input"
                    style={{
                      width: "100%",
                      padding: "12px 14px 12px 44px",
                      fontSize: 14,
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
                    className="premium-input"
                    style={{
                      width: "100%",
                      padding: "12px 14px 12px 44px",
                      fontSize: 14,
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
                    className="premium-input"
                    style={{
                      width: "100%",
                      padding: "12px 44px 12px 44px",
                      fontSize: 14,
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
                      color: "var(--text-secondary)",
                    }}
                  >
                    <span>Password strength</span>
                    <span style={{ color: strengthColor, fontFamily: "var(--font-mono)" }}>{strengthLabel}</span>
                  </div>
                )}
                {/* Password strength meter */}
                {strength > 0 && (
                  <div style={{ marginTop: 6 }}>
                    <div style={{
                      height: 3,
                      borderRadius: 999,
                      background: "var(--border-faint)",
                      overflow: "hidden",
                    }}>
                      <div style={{
                        height: "100%",
                        width: `${(strength / 3) * 100}%`,
                        borderRadius: 999,
                        background: strengthColor,
                        transition: "all 0.3s ease",
                      }} />
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{
                  width: "100%",
                  padding: "14px",
                  fontSize: 15,
                  borderRadius: "var(--radius-md)",
                  background: "var(--accent)",
                  boxShadow: "var(--shadow-accent)",
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