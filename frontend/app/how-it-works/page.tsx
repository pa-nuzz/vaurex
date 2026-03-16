"use client";

import Link from "next/link";
import {
  ArrowLeft, Upload, Brain, FileText,
  Shield, CheckCircle, ArrowRight,
} from "lucide-react";

export default function HowItWorksPage() {
  const steps = [
    {
      number: "01",
      icon: Upload,
      iconBg: "rgba(255,107,53,0.12)",
      iconColor: "#FF6B35",
      title: "Upload Your Document",
      description:
        "Drag and drop any PDF, image, or screenshot into the workbench. Our system accepts multiple formats and file sizes up to 20 MB.",
      tags: ["PDF", "PNG", "JPG", "JPEG", "WebP", "Screenshot"],
    },
    {
      number: "02",
      icon: Brain,
      iconBg: "rgba(59,130,246,0.12)",
      iconColor: "#3B82F6",
      title: "AI Analysis Pipeline",
      description:
        "Our multi-model AI pipeline processes your document through several stages: OCR extraction, entity recognition, risk assessment, and executive summary generation.",
      checklist: [
        "Text extraction with 99%+ accuracy",
        "Named entity recognition (people, organizations, dates)",
        "Financial risk scoring and anomaly detection",
        "Executive summary generation",
        "Compliance flag identification",
      ],
    },
    {
      number: "03",
      icon: FileText,
      iconBg: "rgba(6,214,160,0.12)",
      iconColor: "#06D6A0",
      title: "Get Intelligence Report",
      description:
        "Receive a comprehensive intelligence report with risk scores, extracted entities, compliance flags, and actionable insights.",
      stats: [
        { label: "Risk Score",       value: "0–100" },
        { label: "Entities Found",   value: "50+" },
        { label: "Processing Time",  value: "< 30s" },
        { label: "Export Formats",   value: "PDF, JSON" },
      ],
    },
    {
      number: "04",
      icon: Shield,
      iconBg: "rgba(245,158,11,0.12)",
      iconColor: "#F59E0B",
      title: "Chat & Take Action",
      description:
        "Ask follow-up questions about your document using our AI chat. Get specific insights, explanations, or recommendations instantly.",
      checklist: [
        "Ask about specific clauses or terms",
        "Request explanations for risk factors",
        "Get compliance recommendations",
        "Extract specific data points",
        "Download detailed reports",
      ],
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-base, #0A0A0B)",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 24px 80px" }}>
        {/* Back */}
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            color: "rgba(255,255,255,0.4)",
            fontSize: 14,
            fontWeight: 500,
            textDecoration: "none",
            marginBottom: 40,
            transition: "color 0.15s",
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.85)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.4)")}
        >
          <ArrowLeft size={16} /> Back to Home
        </Link>

        {/* Header */}
        <div style={{ marginBottom: 56, textAlign: "center" }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#FF6B35",
              marginBottom: 14,
            }}
          >
            Documentation
          </p>
          <h1
            style={{
              fontSize: "clamp(32px, 5vw, 48px)",
              fontWeight: 800,
              color: "#F0F0F5",
              marginBottom: 14,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
            }}
          >
            How Vaurex Works
          </h1>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,0.45)", lineHeight: 1.7, maxWidth: 520, margin: "0 auto" }}>
            AI-powered document intelligence made simple. Upload, analyze, and act on your documents in seconds.
          </p>
        </div>

        {/* Steps */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {steps.map((step, idx) => (
            <div
              key={idx}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 18,
                padding: "28px 28px 28px 24px",
                display: "flex",
                gap: 20,
                alignItems: "flex-start",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Step number watermark */}
              <div
                style={{
                  position: "absolute",
                  right: 20,
                  top: 16,
                  fontSize: 48,
                  fontWeight: 900,
                  color: "rgba(255,255,255,0.03)",
                  letterSpacing: "-0.04em",
                  userSelect: "none",
                  lineHeight: 1,
                }}
              >
                {step.number}
              </div>

              {/* Icon */}
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  background: step.iconBg,
                  border: `1px solid ${step.iconColor}25`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <step.icon size={22} color={step.iconColor} />
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: "#F0F0F5",
                    marginBottom: 8,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {step.number}. {step.title}
                </h3>
                <p
                  style={{
                    fontSize: 14,
                    color: "rgba(255,255,255,0.5)",
                    lineHeight: 1.75,
                    marginBottom: step.checklist || step.tags || step.stats ? 16 : 0,
                  }}
                >
                  {step.description}
                </p>

                {/* Format tags */}
                {step.tags && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                    {step.tags.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: "3px 10px",
                          background: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.09)",
                          borderRadius: 6,
                          color: "rgba(255,255,255,0.55)",
                          letterSpacing: "0.03em",
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Checklist */}
                {step.checklist && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {step.checklist.map((item) => (
                      <div
                        key={item}
                        style={{ display: "flex", alignItems: "center", gap: 9 }}
                      >
                        <CheckCircle size={14} color={step.iconColor} style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.5 }}>
                          {item}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Stats grid */}
                {step.stats && (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(2, 1fr)",
                      gap: 10,
                    }}
                  >
                    {step.stats.map((stat) => (
                      <div
                        key={stat.label}
                        style={{
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.07)",
                          borderRadius: 10,
                          padding: "10px 12px",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: "rgba(255,255,255,0.35)",
                            textTransform: "uppercase",
                            letterSpacing: "0.07em",
                            marginBottom: 4,
                          }}
                        >
                          {stat.label}
                        </div>
                        <div
                          style={{
                            fontSize: 16,
                            fontWeight: 700,
                            color: "#F0F0F5",
                            letterSpacing: "-0.01em",
                          }}
                        >
                          {stat.value}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div
          style={{
            marginTop: 48,
            padding: "40px 32px",
            background:
              "linear-gradient(135deg, rgba(255,107,53,0.08), rgba(59,130,246,0.06))",
            border: "1px solid rgba(255,107,53,0.18)",
            borderRadius: 20,
            textAlign: "center",
          }}
        >
          <h2
            style={{
              fontSize: 24,
              fontWeight: 800,
              color: "#F0F0F5",
              marginBottom: 10,
              letterSpacing: "-0.02em",
            }}
          >
            Ready to analyze your documents?
          </h2>
          <p
            style={{
              fontSize: 15,
              color: "rgba(255,255,255,0.45)",
              marginBottom: 28,
              lineHeight: 1.65,
            }}
          >
            Join professionals using AI to make smarter document decisions.
          </p>
          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <Link
              href="/register"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: "11px 24px",
                background: "#FF6B35",
                color: "white",
                textDecoration: "none",
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                letterSpacing: "-0.01em",
              }}
            >
              Start free <ArrowRight size={14} />
            </Link>
            <Link
              href="/login"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: "11px 22px",
                background: "transparent",
                color: "rgba(255,255,255,0.65)",
                textDecoration: "none",
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              Sign in
            </Link>
          </div>
        </div>

        <style>{`
          @media (max-width: 600px) {
            div[style*="gap: 20px"] > div { padding: 20px 16px !important; }
          }
        `}</style>
      </div>
    </div>
  );
}