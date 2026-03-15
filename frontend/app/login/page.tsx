"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Mail, Lock, Loader2, AlertCircle, ArrowRight, Eye, EyeOff, ArrowLeft, Shield } from "lucide-react";
import { GoogleButton, AuthDivider } from "@/components/ui/OtpInput";

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
          setError(`Authentication error: ${authError}`);
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
        setError(error.message);
        return;
      }

      await supabase.auth.getSession();
      router.push(next);
    } finally {
      setLoading(false);
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
          background: "var(--bg-surface)",
          backdropFilter: "blur(8px)",
        }}
      >
        <ArrowLeft size={16} /> Home
      </Link>

      {/* Login card */}
      <div
        style={{
          width: "100%",
          maxWidth: 420,
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
            marginBottom: 32,
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
              background: "var(--accent)",
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

        <h1
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: "var(--accent)",
            marginBottom: 8,
            textAlign: "center",
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
                  e.target.style.borderColor = "var(--accent)";
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
                  e.target.style.borderColor = "var(--accent)";
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
                color: "var(--accent)",
                fontWeight: 500,
              }}
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              background: "var(--accent)",
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
              color: "var(--accent)",
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

