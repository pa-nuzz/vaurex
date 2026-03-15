"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle, Crown, Shield, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function getUserPlan(user: { user_metadata?: Record<string, unknown> | null; app_metadata?: Record<string, unknown> | null } | null | undefined): "free" | "pro" | "pro_max" {
  if (!user) return "free";

  const candidates = [
    user.user_metadata?.plan,
    user.user_metadata?.subscription_tier,
    user.user_metadata?.tier,
    user.app_metadata?.plan,
    user.app_metadata?.subscription_tier,
    user.app_metadata?.tier,
  ];

  const planString = candidates.find((value) => typeof value === "string")?.toLowerCase();
  if (planString?.includes("pro_max") || planString?.includes("promax")) return "pro_max";
  if (planString?.includes("pro")) return "pro";
  return "free";
}

const planCards = [
  {
    id: "free",
    title: "Free",
    price: "$0",
    cadence: "/month",
    badge: "Start here",
    features: [
      "5 document scans per day",
      "5-6 chat sessions per day",
      "Risk score and summary",
      "Entity extraction",
      "Workbench access",
      "Session resets daily",
    ],
  },
  {
    id: "pro",
    title: "Pro",
    price: "$19",
    cadence: "/month",
    badge: "Most popular",
    features: [
      "Unlimited document scans",
      "Unlimited chat sessions",
      "AI chat on every report",
      "Priority processing pipeline",
      "Advanced export and support",
      "No session limits",
    ],
  },
  {
    id: "pro_max",
    title: "Pro Max",
    price: "Contact",
    cadence: "",
    badge: "Enterprise",
    features: [
      "Everything in Pro",
      "Custom AI models",
      "API access",
      "Dedicated support",
      "White-label options",
      "Custom integrations",
    ],
    contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "support@vaurex.com",
  },
];

export default function PricingPage() {
  const supabase = useMemo(() => createClient(), []);
  const [plan, setPlan] = useState<"free" | "pro" | "pro_max">("free");

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!active) return;
      setPlan(getUserPlan(user));
    })();

    return () => {
      active = false;
    };
  }, [supabase]);

  return (
    <div className="pricing-shell" style={{ minHeight: "100vh", background: "var(--bg-primary)", padding: "32px 24px 80px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(circle at 20% 10%, rgba(255,107,53,0.08), transparent 30%), radial-gradient(circle at 80% 20%, rgba(6,214,160,0.08), transparent 28%)" }} />
      <div style={{ maxWidth: 1040, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <Link href="/workbench" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "var(--text-muted)", marginBottom: 28, fontSize: 14, textDecoration: "none" }}>
          <ArrowLeft size={15} /> Back to Workbench
        </Link>

        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div className="badge-accent" style={{ marginBottom: 14, display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Sparkles size={12} /> Choose Your Plan
          </div>
          <h1 style={{ fontSize: "clamp(34px, 5vw, 56px)", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.03em", marginBottom: 10 }}>Free, Pro, or Pro Max</h1>
          <p style={{ fontSize: 16, lineHeight: 1.7, color: "var(--text-secondary)", maxWidth: 640, margin: "0 auto" }}>
            Start with Free for daily limits, upgrade to Pro for unlimited access, or contact us for Pro Max enterprise features.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 20 }} className="pricing-grid">
          {planCards.map((card) => {
            const isCurrent = card.id === plan;
            const isPro = card.id === "pro";
            const isProMax = card.id === "pro_max";
            return (
              <div key={card.id} className="pricing-card" style={{ 
                background: "var(--bg-secondary)", 
                border: isCurrent ? `1px solid ${isProMax ? "rgba(139,92,246,0.35)" : isPro ? "rgba(245,158,11,0.35)" : "var(--accent-border)"}` : "1px solid var(--border-primary)", 
                borderRadius: 24, 
                padding: 28, 
                boxShadow: isCurrent ? "0 24px 60px rgba(0,0,0,0.24)" : "none", 
                position: "relative", 
                overflow: "hidden" 
              }}>
                {isCurrent && (
                  <div style={{ 
                    position: "absolute", 
                    top: 16, 
                    right: 16, 
                    display: "inline-flex", 
                    alignItems: "center", 
                    gap: 6, 
                    borderRadius: 999, 
                    padding: "6px 10px", 
                    background: isProMax ? "rgba(139,92,246,0.12)" : isPro ? "rgba(245,158,11,0.12)" : "rgba(255,90,31,0.12)", 
                    border: `1px solid ${isProMax ? "rgba(139,92,246,0.25)" : isPro ? "rgba(245,158,11,0.25)" : "rgba(255,90,31,0.22)"}`, 
                    color: isProMax ? "#8B5CF6" : isPro ? "#F59E0B" : "var(--accent-primary)", 
                    fontSize: 11, 
                    fontWeight: 700, 
                    textTransform: "uppercase", 
                    letterSpacing: "0.08em" 
                  }}>
                    {isProMax ? <Crown size={12} /> : isPro ? <Crown size={12} /> : <Shield size={12} />} Current plan
                  </div>
                )}
                <div style={{ marginBottom: 22 }}>
                  <div style={{ 
                    fontSize: 12, 
                    fontWeight: 700, 
                    color: isProMax ? "#8B5CF6" : isPro ? "#F59E0B" : "var(--accent-primary)", 
                    textTransform: "uppercase", 
                    letterSpacing: "0.08em", 
                    marginBottom: 10 
                  }}>{card.badge}</div>
                  <h2 style={{ fontSize: 26, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em", marginBottom: 8 }}>{card.title}</h2>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                    <span style={{ fontSize: 42, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.03em" }}>{card.price}</span>
                    <span style={{ fontSize: 14, color: "var(--text-muted)" }}>{card.cadence}</span>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
                  {card.features.map((feature) => (
                    <div key={feature} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "var(--text-secondary)" }}>
                      <CheckCircle size={15} color={isProMax ? "#8B5CF6" : isPro ? "#F59E0B" : "var(--accent-primary)"} /> {feature}
                    </div>
                  ))}
                </div>

                {isProMax ? (
                  <a 
                    href={`mailto:${card.contactEmail}?subject=Pro Max Plan Inquiry&body=Hi, I'm interested in the Pro Max plan for Vaurex. Please provide me with pricing and setup details.`}
                    className="btn-primary" 
                    style={{ 
                      width: "100%", 
                      padding: "12px 18px", 
                      borderRadius: 12, 
                      background: "linear-gradient(135deg, #8B5CF6, #7C3AED)",
                      textDecoration: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8
                    }}
                  >
                    <Crown size={15} /> Contact for Pro Max
                  </a>
                ) : isPro ? (
                  <Link href="/register?plan=pro" className="btn-primary" style={{ 
                    width: "100%", 
                    justifyContent: "center", 
                    padding: "12px 18px", 
                    borderRadius: 12, 
                    background: "linear-gradient(135deg, #F59E0B, #D97706)" 
                  }}>
                    <Crown size={15} /> Get Pro
                  </Link>
                ) : (
                  <Link href="/register?plan=free" className="btn-ghost" style={{ 
                    width: "100%", 
                    justifyContent: "center", 
                    padding: "12px 18px", 
                    borderRadius: 12, 
                    border: "1px solid var(--border-primary)" 
                  }}>
                    <Shield size={15} /> Start Free
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 20, background: "var(--bg-secondary)", border: "1px solid var(--border-primary)", borderRadius: 18, padding: 18, fontSize: 13, lineHeight: 1.7, color: "var(--text-muted)" }}>
          <strong>How it works:</strong> Sign up for Free to get started immediately. Upgrade to Pro for unlimited access. For Pro Max enterprise features, contact us directly via email. 
          {process.env.NEXT_PUBLIC_CONTACT_EMAIL && ` Contact: ${process.env.NEXT_PUBLIC_CONTACT_EMAIL}`}
        </div>

        <style>{`
          @media (max-width: 900px) { .pricing-grid { grid-template-columns: 1fr !important; } }
          @media (max-width: 640px) {
            .pricing-shell { padding: 18px 14px 56px !important; }
            .pricing-card { padding: 22px 18px !important; border-radius: 18px !important; }
          }
        `}</style>
      </div>
    </div>
  );
}