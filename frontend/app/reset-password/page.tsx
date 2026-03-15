"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { GoogleButton, AuthDivider } from "@/components/ui/OtpInput";

export default function ResetPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [handleExchangeCode, setHandleExchangeCode] = useState<(() => Promise<void>) | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (!code) {
      // No code parameter, redirect to forgot-password
      window.location.href = '/forgot-password';
      return;
    }

    const handleExchangeCode = async () => {
      setLoading(true);
      setError("");

      const supabase = createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        setError('Invalid or expired reset link. Please try again.');
      } else {
        // Show success state briefly before redirect
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
      }
      setLoading(false);
    };

    setHandleExchangeCode(() => handleExchangeCode);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      <div style={{ maxWidth: 440, margin: "0 auto", padding: "24px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h1 style={{ 
            fontSize: "clamp(32px, 4vw, 48px)", 
            fontWeight: 800, 
            color: "var(--text-primary)", 
            marginBottom: 16,
            letterSpacing: "-0.02em"
          }}>
            Set new password
          </h1>
          <p style={{ 
            fontSize: 18, 
            color: "var(--text-secondary)", 
            lineHeight: 1.6,
            maxWidth: 600,
            margin: "0 auto"
          }}>
            Enter your new password to complete the reset process.
          </p>
        </div>

        <AuthDivider />

        {/* Exchange code form */}
        <form onSubmit={(e) => {
          e.preventDefault();
          handleExchangeCode?.();
        }}>
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
                Exchange code received
              </h3>
              <p style={{ fontSize: 16, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 16 }}>
                Check your email for a reset code and enter it above.
              </p>
            </div>
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
            {loading ? 'Exchanging code...' : 'Exchange code'}
          </button>
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
              <Mail size={15} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}
        </form>

        <div style={{ textAlign: "center", marginTop: 24 }}>
          <Link href="/forgot-password" style={{ color: "var(--text-3)", fontSize: 14 }}>
            Request new reset code
          </Link>
        </div>

        <div style={{ textAlign: "center", marginTop: 24 }}>
          <Link href="/login" style={{ color: "var(--text-3)", fontSize: 14 }}>
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
