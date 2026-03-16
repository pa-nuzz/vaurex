"use client";

import Link from "next/link";
import { ArrowLeft, Shield, Upload, Brain, FileText, CheckCircle, TrendingUp, Users, ArrowRight, Zap, Lock } from "lucide-react";

export default function HowVaurexWorksPage() {
  const steps = [
    {
      icon: <Upload size={24} color="#FF6B35" />,
      iconBg: "rgba(255,107,53,0.1)",
      iconBorder: "rgba(255,107,53,0.22)",
      num: "01",
      numColor: "linear-gradient(135deg, #FF6B35, #FF9A5C)",
      title: "Upload Documents",
      desc: "Upload PDFs, images, or text files directly to our secure platform. We support multiple formats for comprehensive analysis.",
      features: [
        "Drag & drop or click to upload",
        "Automatic file format detection",
        "Encrypted cloud processing",
      ],
    },
    {
      icon: <Brain size={24} color="#3B82F6" />,
      iconBg: "rgba(59,130,246,0.1)",
      iconBorder: "rgba(59,130,246,0.22)",
      num: "02",
      numColor: "linear-gradient(135deg, #3B82F6, #93C5FD)",
      title: "AI Analysis",
      desc: "Our advanced AI models analyze your documents for risks, entities, compliance issues, and more using cutting-edge multi-model technology.",
      features: [
        "Multi-model AI processing",
        "Risk scoring (0–100 scale)",
        "Entity extraction & NER",
      ],
    },
    {
      icon: <FileText size={24} color="#10B981" />,
      iconBg: "rgba(16,185,129,0.1)",
      iconBorder: "rgba(16,185,129,0.22)",
      num: "03",
      numColor: "linear-gradient(135deg, #10B981, #6EE7B7)",
      title: "Get Results",
      desc: "Receive detailed reports with risk scores, compliance checks, and actionable insights within seconds. Export as PDF or JSON.",
      features: [
        "Comprehensive risk reports",
        "Export to PDF and JSON",
        "AI chat on every document",
      ],
    },
  ];

  const features = [
    {
      icon: <Shield size={20} color="#FF6B35" />,
      bg: "rgba(255,107,53,0.1)",
      title: "Security First",
      desc: "Enterprise-grade encryption. Files are processed in memory and not stored longer than needed.",
    },
    {
      icon: <TrendingUp size={20} color="#3B82F6" />,
      bg: "rgba(59,130,246,0.1)",
      title: "Smart Analytics",
      desc: "AI-powered risk scoring with evidence citations from the actual document — not guesswork.",
    },
    {
      icon: <Users size={20} color="#10B981" />,
      bg: "rgba(16,185,129,0.1)",
      title: "Team Ready",
      desc: "Real-time AI chat for every report. Share findings with your team instantly.",
    },
    {
      icon: <Zap size={20} color="#F59E0B" />,
      bg: "rgba(245,158,11,0.1)",
      title: "Instant Results",
      desc: "Full document pipeline completes in under 30 seconds — OCR, entities, risk, and summary.",
    },
    {
      icon: <Lock size={20} color="#8B5CF6" />,
      bg: "rgba(139,92,246,0.1)",
      title: "Compliance Focused",
      desc: "Automated compliance checking across GDPR, SOC 2, HIPAA, AML, and more frameworks.",
    },
    {
      icon: <CheckCircle size={20} color="#06D6A0" />,
      bg: "rgba(6,214,160,0.1)",
      title: "99.2% OCR Accuracy",
      desc: "Multi-model vision pipeline with Gemini, Groq, and DeepSeek fallbacks for maximum reliability.",
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-base, #0C0D10)",
        color: "var(--text-primary, #F0F0F5)",
        fontFamily: "Inter, system-ui, sans-serif",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      {/* Ambient glow */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "70vw",
          height: "40vh",
          background:
            "radial-gradient(ellipse, rgba(255,107,53,0.07) 0%, rgba(59,130,246,0.05) 50%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div
        style={{
          maxWidth: 1040,
          margin: "0 auto",
          padding: "32px 24px 80px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Back */}
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            color: "rgba(255,255,255,0.4)",
            fontSize: 14,
            marginBottom: 40,
            textDecoration: "none",
            transition: "color 0.2s",
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.8)")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.4)")
          }
        >
          <ArrowLeft size={15} />
          Back to Home
        </Link>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 14px",
              borderRadius: 999,
              background: "rgba(255,107,53,0.1)",
              border: "1px solid rgba(255,107,53,0.22)",
              color: "#FF6B35",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: 20,
            }}
          >
            How It Works
          </div>
          <h1
            style={{
              fontSize: "clamp(36px, 5vw, 60px)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              marginBottom: 20,
            }}
          >
            Document intelligence,{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #FF6B35, #FF9A5C 50%, #3B82F6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              made simple
            </span>
          </h1>
          <p
            style={{
              fontSize: 17,
              color: "rgba(255,255,255,0.5)",
              maxWidth: 540,
              margin: "0 auto",
              lineHeight: 1.75,
            }}
          >
            From upload to insight in under 30 seconds. Vaurex combines OCR,
            entity extraction, and risk analysis into a single seamless pipeline.
          </p>
        </div>

        {/* Steps */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 20,
            marginBottom: 72,
          }}
        >
          {steps.map((s, i) => (
            <div
              key={i}
              style={{
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 20,
                padding: 28,
                position: "relative",
                overflow: "hidden",
                transition: "border-color 0.2s, transform 0.2s",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = "rgba(255,255,255,0.14)";
                el.style.transform = "translateY(-3px)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = "rgba(255,255,255,0.07)";
                el.style.transform = "translateY(0)";
              }}
            >
              {/* Step number watermark */}
              <div
                style={{
                  position: "absolute",
                  top: 16,
                  right: 20,
                  fontSize: 52,
                  fontWeight: 900,
                  letterSpacing: "-0.04em",
                  lineHeight: 1,
                  background: s.numColor,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  opacity: 0.2,
                }}
              >
                {s.num}
              </div>

              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: s.iconBg,
                  border: `1px solid ${s.iconBorder}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 20,
                }}
              >
                {s.icon}
              </div>

              <h3
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  marginBottom: 10,
                  letterSpacing: "-0.01em",
                }}
              >
                {s.title}
              </h3>
              <p
                style={{
                  fontSize: 14,
                  color: "rgba(255,255,255,0.45)",
                  lineHeight: 1.7,
                  marginBottom: 20,
                }}
              >
                {s.desc}
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {s.features.map((f) => (
                  <div
                    key={f}
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <div
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: "50%",
                        background: s.iconBg,
                        border: `1px solid ${s.iconBorder}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <CheckCircle size={10} style={{ color: "inherit" }} />
                    </div>
                    <span
                      style={{ fontSize: 13, color: "rgba(255,255,255,0.55)" }}
                    >
                      {f}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Features Grid */}
        <div style={{ marginBottom: 72 }}>
          <h2
            style={{
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              marginBottom: 8,
              textAlign: "center",
            }}
          >
            Platform Features
          </h2>
          <p
            style={{
              fontSize: 15,
              color: "rgba(255,255,255,0.4)",
              textAlign: "center",
              marginBottom: 36,
            }}
          >
            Everything you need to review documents faster and make better calls.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 16,
            }}
          >
            {features.map((f, i) => (
              <div
                key={i}
                style={{
                  background: "rgba(255,255,255,0.025)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 14,
                  padding: "20px 22px",
                  display: "flex",
                  gap: 14,
                  alignItems: "flex-start",
                  transition: "border-color 0.2s",
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.borderColor =
                    "rgba(255,255,255,0.13)")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.borderColor =
                    "rgba(255,255,255,0.07)")
                }
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: f.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {f.icon}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      marginBottom: 5,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {f.title}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: "rgba(255,255,255,0.42)",
                      lineHeight: 1.6,
                    }}
                  >
                    {f.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div
          style={{
            textAlign: "center",
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 24,
            padding: "52px 40px",
          }}
        >
          <h2
            style={{
              fontSize: 30,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              marginBottom: 12,
            }}
          >
            Ready to Get Started?
          </h2>
          <p
            style={{
              fontSize: 16,
              color: "rgba(255,255,255,0.45)",
              maxWidth: 440,
              margin: "0 auto 32px",
              lineHeight: 1.7,
            }}
          >
            Join professionals using Vaurex for secure, instant document
            analysis.
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
                gap: 8,
                padding: "13px 30px",
                background: "linear-gradient(135deg, #FF6B35, #FF8A56)",
                color: "#fff",
                textDecoration: "none",
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 600,
                boxShadow: "0 4px 20px rgba(255,107,53,0.3)",
                transition: "all 0.2s",
              }}
            >
              Start Free Trial <ArrowRight size={15} />
            </Link>
            <Link
              href="/workbench"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "13px 30px",
                background: "transparent",
                color: "rgba(255,255,255,0.7)",
                textDecoration: "none",
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 600,
                border: "1px solid rgba(255,255,255,0.12)",
                transition: "all 0.2s",
              }}
            >
              Open Workbench
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}