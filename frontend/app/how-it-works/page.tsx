"use client";

import Link from "next/link";
import { ArrowLeft, Upload, Brain, FileText, Shield, CheckCircle, ArrowRight } from "lucide-react";

export default function HowItWorksPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px" }}>
        {/* Back button */}
        <Link href="/" style={{ 
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
          <ArrowLeft size={16} /> Back to Home
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
            How Vaurex Works
          </h1>
          <p style={{ 
            fontSize: 18, 
            color: "var(--text-secondary)", 
            lineHeight: 1.6,
            maxWidth: 600,
            margin: "0 auto"
          }}>
            AI-powered document intelligence made simple. Upload, analyze, and act on your documents in seconds.
          </p>
        </div>

        {/* Steps */}
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {/* Step 1 */}
          <div style={{ 
            background: "var(--bg-secondary)", 
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
              <Upload size={24} color="var(--accent)" />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
                1. Upload Your Document
              </h3>
              <p style={{ fontSize: 16, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 16 }}>
                Drag and drop any PDF, image, or screenshot into the workbench. Our system accepts multiple formats and file sizes up to 50MB.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {["PDF", "PNG", "JPG", "JPEG", "WebP", "Screenshot"].map((format) => (
                  <span key={format} style={{
                    fontSize: 12,
                    fontWeight: 600,
                    padding: "4px 8px",
                    background: "var(--bg-elevated)",
                    color: "var(--text-2)",
                    borderRadius: 6,
                    border: "1px solid var(--border-primary)"
                  }}>
                    {format}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div style={{ 
            background: "var(--bg-secondary)", 
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
              <Brain size={24} color="var(--blue)" />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
                2. AI Analysis Pipeline
              </h3>
              <p style={{ fontSize: 16, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 16 }}>
                Our multi-model AI pipeline processes your document through several stages: OCR extraction, entity recognition, risk assessment, and executive summary generation.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  "Text extraction with 99%+ accuracy",
                  "Named entity recognition (people, organizations, dates)",
                  "Financial risk scoring and anomaly detection", 
                  "Executive summary generation",
                  "Compliance flag identification"
                ].map((feature) => (
                  <div key={feature} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <CheckCircle size={16} color="var(--success)" />
                    <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div style={{ 
            background: "var(--bg-secondary)", 
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
              background: "rgba(16,185,129,0.12)", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              flexShrink: 0
            }}>
              <FileText size={24} color="var(--success)" />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
                3. Get Intelligence Report
              </h3>
              <p style={{ fontSize: 16, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 16 }}>
                Receive a comprehensive intelligence report with risk scores, extracted entities, compliance flags, and actionable insights.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
                {[
                  { label: "Risk Score", value: "0-100" },
                  { label: "Entities Found", value: "50+" },
                  { label: "Processing Time", value: "&lt;30s" },
                  { label: "Export Formats", value: "PDF, JSON" }
                ].map((stat) => (
                  <div key={stat.label} style={{ 
                    background: "var(--bg-elevated)", 
                    padding: 12, 
                    borderRadius: 8,
                    border: "1px solid var(--border-primary)"
                  }}>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>{stat.label}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>{stat.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div style={{ 
            background: "var(--bg-secondary)", 
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
              <Shield size={24} color="var(--pro)" />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
                4. Chat & Take Action
              </h3>
              <p style={{ fontSize: 16, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 16 }}>
                Ask follow-up questions about your document using our AI chat. Get specific insights, explanations, or recommendations instantly.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  "Ask about specific clauses or terms",
                  "Request explanations for risk factors",
                  "Get compliance recommendations",
                  "Extract specific data points",
                  "Download detailed reports"
                ].map((capability) => (
                  <div key={capability} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <CheckCircle size={16} color="var(--pro)" />
                    <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>{capability}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div style={{ 
          textAlign: "center", 
          marginTop: 48, 
          padding: 32, 
          background: "var(--bg-secondary)", 
          borderRadius: 16,
          border: "1px solid var(--border-primary)"
        }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16 }}>
            Ready to Analyze Your Documents?
          </h2>
          <p style={{ fontSize: 16, color: "var(--text-secondary)", marginBottom: 24 }}>
            Join thousands of professionals using AI to make smarter document decisions.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/register" style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 24px",
              background: "var(--accent)",
              color: "white",
              textDecoration: "none",
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 600,
              transition: "all 0.2s"
            }}>
              Start Free <ArrowRight size={16} />
            </Link>
            <Link href="/login" style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 24px",
              background: "transparent",
              color: "var(--text-primary)",
              textDecoration: "none",
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 600,
              border: "1px solid var(--border-primary)",
              transition: "all 0.2s"
            }}>
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
