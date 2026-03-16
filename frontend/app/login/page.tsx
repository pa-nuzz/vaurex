"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { apiJson } from "@/lib/api";
import { Mail, Lock, Loader2, AlertCircle, ArrowRight, Eye, EyeOff, ArrowLeft, Shield } from "lucide-react";
import { GoogleButton, AuthDivider } from "@/components/ui/OtpInput";

function sanitizeLoginErrorMessage(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials") || m.includes("invalid") || m.includes("credentials")) {
    return "Invalid email or password.";
  }
  if (m.includes("email not confirmed") || m.includes("verify")) {
    return "Please verify your email before signing in.";
  }
  if (m.includes("too many") || m.includes("rate limit")) {
    return "Too many attempts. Please wait and try again.";
  }
  return "Sign in failed. Please try again.";
}

function LoginInner() {
  const params = useSearchParams();
  const router = useRouter();
  const nextRaw = params.get("next") || "/workbench";
  const next = nextRaw.startsWith("/") && !nextRaw.startsWith("//") ? nextRaw : "/workbench";
  const authError = params.get("error");
  const authMessage = params.get("message");
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);

  // Set error message from URL params if present
  useEffect(() => {
    if (authError) {
      switch (authError) {
        case 'auth_failed':
          setError("Authentication failed. Please try again.");
          break;
        case 'exchange_failed':
          setError(authMessage || "Email verification failed. Please try again.");
          break;
        case 'callback_failed':
          setError("Authentication callback failed. Please try again.");
          break;
        case 'no_code':
          setError("No verification code provided. Please check your email link.");
          break;
        default:
          setError("Authentication error. Please try again.");
      }
    }
  }, [authError, authMessage]);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(sanitizeLoginErrorMessage(error.message));
        return;
      }

      await supabase.auth.getSession();
      try {
        await apiJson(
          "/api/v1/auth/login-notification",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ provider: "email" }),
          },
          { auth: true, fallbackMessage: "Login notification failed." },
        );
      } catch {
        // non-blocking
      }
      router.push(next);
    } finally {
      setLoading(false);
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
          background: "var(--bg-surface)",
          backdropFilter: "blur(8px)",
        }}
      >
        <ArrowLeft size={16} /> Home
      </Link>

      {/* Login card */}
      <div className="auth-card" style={{ maxWidth: 460 }}>
        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 32,
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
          Welcome back
        </h1>
        <p
          style={{
            color: "var(--text-2)",
            fontSize: 14,
            marginBottom: 28,
            textAlign: "center",
          }}
        >
          Sign in to your account to continue
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

        {/* Google OAuth */}
        <GoogleButton onClick={handleGoogleLogin} loading={googleLoading} />
        
        <AuthDivider />
        
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
              Email
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
          </div>

          <div
            style={{
              textAlign: "right",
              marginTop: -4,
            }}
          >
            <Link
              href="/forgot-password"
              style={{
                fontSize: 13,
                color: "var(--accent-primary)",
                fontWeight: 500,
              }}
            >
              Forgot password?
            </Link>
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
                Sign in <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        <p
          style={{
            textAlign: "center",
            marginTop: 24,
            fontSize: 14,
            color: "var(--text-2)",
          }}
        >
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            style={{
              color: "var(--accent-primary)",
              fontWeight: 500,
            }}
          >
            Sign up
          </Link>
          <span style={{ marginLeft: 4 }}>
            {" "}or use Google button above to sign in instantly.
          </span>
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

