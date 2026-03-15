"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import {
  Sparkles, ArrowRight, Upload, Shield, Zap, FileSearch,
  Brain, BarChart3, Clock, CheckCircle, AlertTriangle,
  ChevronRight, Globe, Lock, Eye, Crown,
} from "lucide-react";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { ShootingStars } from "@/components/ui/shooting-stars";

/* ── Fade-in section wrapper ── */
function FadeSection({ children, className = "", delay = 0 }: {
  children: React.ReactNode; className?: string; delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Risk color helper ── */
function riskColor(score: number) {
  if (score < 30) return "#10B981";
  if (score < 60) return "#F59E0B";
  return "#EF4444";
}

export default function LandingClient() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  /* Demo state */
  const [demoStage, setDemoStage] = useState<"idle" | "uploading" | "processing" | "done">("idle");
  const demoScore = 72;

  function runDemo() {
    setDemoStage("uploading");
    setTimeout(() => setDemoStage("processing"), 800);
    setTimeout(() => setDemoStage("done"), 2400);
  }

  const features = [
    { icon: Shield,     title: "Risk Scoring",       desc: "AI assigns a 0–100 risk score with evidence-based reasoning, not guesswork." },
    { icon: FileSearch, title: "Entity Extraction",   desc: "Names, orgs, dates, financial figures — automatically tagged and categorized." },
    { icon: Brain,      title: "Executive Summary",   desc: "Get a concise, actionable brief that captures what the document means." },
    { icon: Zap,        title: "Instant Processing",  desc: "Upload to results in seconds. Multi-model AI pipeline with smart fallbacks." },
    { icon: Eye,        title: "OCR Vision",          desc: "Scanned PDFs and screenshots are no problem — AI vision reads any image." },
    { icon: Lock,       title: "End-to-End Secure",   desc: "Your documents are encrypted and never stored longer than processing requires." },
  ];

  const steps = [
    { num: "01", title: "Upload",  desc: "Drag & drop any PDF, image, or screenshot into the workbench." },
    { num: "02", title: "Analyze", desc: "Our multi-model AI pipeline extracts text, entities, and risk signals." },
    { num: "03", title: "Act",     desc: "Review the intelligence report, risk score, and take action instantly." },
  ];

  return (
    <div style={{ position: "relative", zIndex: 1 }}>
      {/* ── Navbar ── */}
      <nav
        className="glass"
        style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
          padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between",
          borderBottom: "1px solid var(--border-primary)", borderTop: "none", borderLeft: "none", borderRight: "none",
          borderRadius: 0,
        }}
      >
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
            background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
          }}>
            <Sparkles size={14} color="white" fill="white" />
          </div>
          <span className="font-display" style={{ fontWeight: 800, fontSize: 16, color: "var(--text-primary)" }}>Vaurex</span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <Link href="/how-it-works" style={{ color: "var(--text-1)", textDecoration: "none", fontWeight: 500, transition: "color 0.2s", padding: "8px 0" }} onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--accent)"} onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--text-1)"}>How it works</Link>
          <Link href="/pricing" style={{ color: "var(--text-1)", textDecoration: "none", fontWeight: 500, transition: "color 0.2s", padding: "8px 0" }} onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--accent)"} onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--text-1)"}>Pricing</Link>
          <Link href="/login" className="btn-ghost" style={{ padding: "8px 16px", fontSize: 13 }}>Sign in</Link>
          <Link href="/register" className="btn-primary" style={{ padding: "8px 18px", fontSize: 13 }}>
            Get started <ArrowRight size={13} />
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section ref={heroRef} style={{ position: "relative", overflow: "hidden", paddingTop: 140, paddingBottom: 80 }}>
        {/* Ambient orbs */}
        <div style={{ position: "absolute", top: "10%", left: "15%", width: 400, height: 400, borderRadius: "50%", background: "rgba(255,107,53,0.06)", filter: "blur(100px)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "30%", right: "10%", width: 300, height: 300, borderRadius: "50%", background: "rgba(6,214,160,0.04)", filter: "blur(80px)", pointerEvents: "none" }} />
          <ShootingStars
            minSpeed={14}
            maxSpeed={28}
            minDelay={900}
            maxDelay={2400}
            starColor="#FFF7ED"
            trailColor="#FF8C42"
            starWidth={140}
            starHeight={2}
            className="opacity-80"
          />
         
        <motion.div style={{ y: heroY, opacity: heroOpacity, position: "relative", zIndex: 1 }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }} className="hero-grid">

            {/* ── Left: copy ── */}
            <div>
              <div className="badge-accent" style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 24, fontSize: 12 }}>
                <Sparkles size={12} /> AI Document Intelligence Platform
              </div>

              <h1 className="font-display" style={{
                fontSize: "clamp(36px, 4.5vw, 60px)", fontWeight: 800, lineHeight: 1.08,
                color: "var(--text-primary)", marginBottom: 20, letterSpacing: "-0.02em",
              }}>
                Know exactly<br />
                what&apos;s in your{" "}
                <span style={{
                  background: "linear-gradient(135deg, var(--accent-primary), var(--blue))",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                }}>
                  documents
                </span>
              </h1>

              <p style={{ fontSize: 17, color: "var(--text-secondary)", maxWidth: 480, marginBottom: 36, lineHeight: 1.7 }}>
                Drop any PDF, image, or screenshot. Get an instant AI intelligence report — risk scoring, entity extraction, and an executive summary ready to act on.
              </p>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 40 }}>
                <Link href="/register" className="btn-primary" style={{ padding: "14px 28px", fontSize: 15 }}>
                  Start free <ArrowRight size={15} />
                </Link>
                <a href="#demo" className="btn-ghost" style={{ padding: "14px 28px", fontSize: 15 }}
                   onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = "var(--blue)"}
                   onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"}>
                  See it in action <ChevronRight size={15} />
                </a>
              </div>

              {/* Trust bar */}
              <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                {[
                  { icon: Shield, label: "SOC 2 Ready" },
                  { icon: Globe,  label: "Multi-model AI" },
                  { icon: Clock,  label: "Results in seconds" },
                ].map((t, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <t.icon size={14} color="var(--text-muted)" />
                    <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{t.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Right: product preview card ── */}
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.9, delay: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-primary)",
                borderRadius: 20,
                overflow: "hidden",
                boxShadow: "0 24px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)",
              }}
            >
              {/* Card header */}
              <div style={{
                padding: "14px 18px",
                borderBottom: "1px solid var(--border-primary)",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                background: "rgba(255,255,255,0.02)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--accent-surface)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <FileSearch size={14} color="var(--accent-primary)" />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>contract_v3_final.pdf</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Scan complete · 1.2s</div>
                  </div>
                </div>
                <div style={{
                  padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                  background: "rgba(239,68,68,0.12)", color: "#EF4444",
                  border: "1px solid rgba(239,68,68,0.25)",
                }}>
                  HIGH RISK · 78
                </div>
              </div>

              {/* Risk bar */}
              <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--border-primary)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 12 }}>
                  <span style={{ color: "var(--text-secondary)" }}>Risk Score</span>
                  <span style={{ color: "#EF4444", fontWeight: 700 }}>78 / 100</span>
                </div>
                <div style={{ height: 6, borderRadius: 99, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "78%" }}
                    transition={{ duration: 1.1, delay: 0.6, ease: "easeOut" }}
                    style={{ height: "100%", borderRadius: 99, background: "linear-gradient(90deg, #F59E0B, #EF4444)" }}
                  />
                </div>
              </div>

              {/* Entities */}
              <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border-primary)" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", marginBottom: 10, letterSpacing: "0.06em", textTransform: "uppercase" }}>Entities Detected</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {[
                    { label: "Nexus Holdings Ltd", type: "ORG" },
                    { label: "$4.2M transfer", type: "FIN" },
                    { label: "James Crowley", type: "PER" },
                    { label: "offshore account", type: "RISK" },
                  ].map((e, i) => (
                    <span key={i} style={{
                      padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                      background: e.type === "RISK" ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.06)",
                      color: e.type === "RISK" ? "#EF4444" : "var(--text-secondary)",
                      border: `1px solid ${e.type === "RISK" ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.08)"}`,
                    }}>{e.label}</span>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div style={{ padding: "14px 18px" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", marginBottom: 8, letterSpacing: "0.06em", textTransform: "uppercase" }}>Executive Summary</div>
                <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.65, margin: 0 }}>
                  Document references an offshore account transfer of $4.2M linked to Nexus Holdings Ltd. Multiple high-risk financial clauses identified. <span style={{ color: "#EF4444", fontWeight: 600 }}>Recommend legal review before signing.</span>
                </p>
              </div>

              {/* Powered by bar */}
              <div style={{
                padding: "10px 18px",
                borderTop: "1px solid var(--border-primary)",
                background: "rgba(255,255,255,0.01)",
                display: "flex", alignItems: "center", gap: 6,
              }}>
                <Sparkles size={11} color="var(--accent-primary)" />
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Powered by Vaurex AI · GPT-4o + Claude 3.5</span>
              </div>
            </motion.div>
          </div>

          <style>{`
            @media (max-width: 820px) {
              .hero-grid { grid-template-columns: 1fr !important; }
            }
          `}</style>
        </motion.div>
      </section>

      {/* ── Interactive Demo ── */}
      <section id="demo" style={{ padding: "80px 24px", maxWidth: 1100, margin: "0 auto" }}>
        <FadeSection>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 className="font-display" style={{ fontSize: 36, fontWeight: 800, color: "var(--text-primary)", marginBottom: 12 }}>
              Try it right now
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: 16, maxWidth: 480, margin: "0 auto" }}>
              Click below to see a simulated analysis of a suspicious document.
            </p>
          </div>
        </FadeSection>

        <FadeSection delay={0.15}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }} className="demo-grid">
            {/* Upload card */}
            <div className="card-glow" style={{ minHeight: 340, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
              {demoStage === "idle" && (
                <>
                  <div style={{
                    width: 64, height: 64, borderRadius: 16, marginBottom: 20,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: "var(--accent-surface)", border: "1.5px dashed var(--accent-border)",
                  }}>
                    <Upload size={24} color="var(--accent-primary)" />
                  </div>
                  <h3 className="font-display" style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
                    Upload a document
                  </h3>
                  <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 24, maxWidth: 260 }}>
                    PDFs, images, screenshots — anything with text
                  </p>
                  <button onClick={runDemo} className="btn-primary" style={{ padding: "12px 24px" }}>
                    Run demo scan <Zap size={14} />
                  </button>
                </>
              )}
              {demoStage === "uploading" && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--accent-surface)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Upload size={20} color="var(--accent-primary)" className="animate-pulse" />
                  </div>
                  <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>Uploading document...</p>
                  <div style={{ width: 180, height: 4, borderRadius: 2, background: "var(--border-primary)", overflow: "hidden" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 0.7 }}
                      style={{ height: "100%", borderRadius: 2, background: "var(--accent-primary)" }}
                    />
                  </div>
                </div>
              )}
              {demoStage === "processing" && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                  <div className="animate-pulse-ring" style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: "var(--accent-surface)", display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Brain size={20} color="var(--accent-primary)" />
                  </div>
                  <p style={{ color: "var(--text-primary)", fontSize: 14, fontWeight: 600 }}>AI pipeline running...</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%", maxWidth: 240 }}>
                    {["OCR extraction", "Entity recognition", "Risk assessment"].map((step, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.4 }}
                        style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-secondary)" }}
                      >
                        <CheckCircle size={13} color="var(--cyan)" />
                        {step}
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
              {demoStage === "done" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{ width: "100%", textAlign: "left", padding: 8 }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                    <CheckCircle size={16} color="var(--cyan)" />
                    <span style={{ fontSize: 14, fontWeight: 600, color: "var(--cyan)" }}>Analysis complete</span>
                  </div>
                  <div className="card-inset" style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Risk Score</span>
                      <span style={{ fontSize: 24, fontWeight: 800, color: riskColor(demoScore) }} className="font-display">{demoScore}</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: "var(--border-primary)", overflow: "hidden" }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${demoScore}%` }}
                        transition={{ duration: 1, delay: 0.2 }}
                        style={{ height: "100%", borderRadius: 3, background: riskColor(demoScore) }}
                      />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <span className="badge-accent">3 entities found</span>
                    <span className="badge-cyan">2 risk flags</span>
                  </div>
                  <button onClick={() => setDemoStage("idle")} className="btn-ghost" style={{ marginTop: 16, padding: "8px 16px", fontSize: 13 }}>
                    Reset demo
                  </button>
                </motion.div>
              )}
            </div>

            {/* Feature cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { icon: BarChart3,     title: "Risk Intelligence",   desc: "Evidence-based scoring with document-specific reasoning." },
                { icon: FileSearch,    title: "Deep Extraction",     desc: "Entities, dates, financials — automatically structured." },
                { icon: AlertTriangle, title: "Fraud Detection",     desc: "Flag suspicious patterns and anomalies in real-time." },
              ].map((f, i) => (
                <FadeSection key={i} delay={i * 0.1}>
                  <div style={{ position: "relative" }}>
                    <GlowingEffect spread={32} glow proximity={64} inactiveZone={0.15} />
                    <div className="card-interactive" style={{ display: "flex", gap: 16, alignItems: "flex-start", position: "relative", overflow: "hidden" }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: "var(--accent-surface)", border: "1px solid var(--accent-border)",
                      }}>
                        <f.icon size={18} color="var(--accent-primary)" />
                      </div>
                      <div>
                        <h4 className="font-display" style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>{f.title}</h4>
                        <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>{f.desc}</p>
                      </div>
                    </div>
                  </div>
                </FadeSection>
              ))}
            </div>
          </div>
        </FadeSection>

        {/* Responsive override for demo grid */}
        <style>{`
          @media (max-width: 768px) {
            .demo-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </section>

      {/* ── Stats Bar ── */}
      <FadeSection>
        <div style={{
          maxWidth: 900, margin: "0 auto 80px", padding: "32px 24px",
          display: "flex", justifyContent: "center", gap: 64, flexWrap: "wrap",
          borderTop: "1px solid var(--border-primary)", borderBottom: "1px solid var(--border-primary)",
        }}>
          {[
            { value: "< 10s",  label: "Avg. analysis time" },
            { value: "99.2%",  label: "OCR accuracy" },
            { value: "3+",     label: "AI models in pipeline" },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div className="font-display" style={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary)", marginBottom: 4 }}>
                {s.value}
              </div>
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </FadeSection>

      {/* ── Features Grid ── */}
      <section style={{ padding: "0 24px 100px", maxWidth: 1100, margin: "0 auto" }}>
        <FadeSection>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <h2 className="font-display" style={{ fontSize: 36, fontWeight: 800, color: "var(--text-primary)", marginBottom: 12 }}>
              Everything you need
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: 16, maxWidth: 480, margin: "0 auto" }}>
              A complete document intelligence toolkit, powered by a multi-model AI pipeline.
            </p>
          </div>
        </FadeSection>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
          {features.map((f, i) => (
            <FadeSection key={i} delay={i * 0.08}>
              <div className="card-interactive" style={{ height: "100%" }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, marginBottom: 16,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: "var(--accent-surface)", border: "1px solid var(--accent-border)",
                }}>
                  <f.icon size={20} color="var(--accent-primary)" />
                </div>
                <h3 className="font-display" style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            </FadeSection>
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section style={{ padding: "0 24px 100px", maxWidth: 900, margin: "0 auto" }}>
        <FadeSection>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <h2 className="font-display" style={{ fontSize: 36, fontWeight: 800, color: "var(--text-primary)", marginBottom: 12 }}>
              How it works
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: 16 }}>
              Three simple steps to actionable document intelligence.
            </p>
          </div>
        </FadeSection>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24 }}>
          {steps.map((s, i) => (
            <FadeSection key={i} delay={i * 0.12}>
              <div className="card" style={{ textAlign: "center", height: "100%" }}>
                <div className="font-mono" style={{
                  fontSize: 32, fontWeight: 700, marginBottom: 12,
                  background: i === 0 ? "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))" : 
                           i === 1 ? "linear-gradient(135deg, var(--blue), var(--blue-hover))" : 
                           "linear-gradient(135deg, var(--cyan), var(--accent-primary))",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                }}>
                  {s.num}
                </div>
                <h3 className="font-display" style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7 }}>{s.desc}</p>
              </div>
            </FadeSection>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section style={{ padding: "0 24px 100px", maxWidth: 1100, margin: "0 auto" }}>
        <FadeSection>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <h2 className="font-display" style={{ fontSize: 36, fontWeight: 800, color: "var(--text-primary)", marginBottom: 12 }}>
              Choose Your Plan
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: 16, maxWidth: 480, margin: "0 auto" }}>
              Start free, upgrade to Pro, or contact us for enterprise needs.
            </p>
          </div>
        </FadeSection>

        <div className="pricing-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 20, marginBottom: 60 }}>
          {[
            {
              id: "free",
              title: "Free",
              price: "$0",
              badge: "Start here",
              features: ["5 document scans per day", "5-6 chat sessions per day", "Risk scoring", "Entity extraction", "Daily reset"],
              color: "#FF6B35",
              link: "/register?plan=free"
            },
            {
              id: "pro", 
              title: "Pro",
              price: "$19/month",
              badge: "Most popular",
              features: ["Unlimited scans", "Unlimited chat", "Priority processing", "Advanced exports", "No limits"],
              color: "#3B82F6",
              link: "/register?plan=pro"
            },
            {
              id: "pro_max",
              title: "Pro Max",
              price: "Contact",
              badge: "Enterprise",
              features: ["Everything in Pro", "Custom AI models", "API access", "Dedicated support", "White-label"],
              color: "#8B5CF6",
              link: `mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'support@vaurex.com'}?subject=Pro Max Inquiry`
            }
          ].map((plan, i) => (
            <FadeSection key={i} delay={i * 0.1}>
              <div style={{
                background: "var(--bg-secondary)",
                border: `1px solid ${plan.color}25`,
                borderRadius: 16,
                padding: 28,
                height: "100%",
                position: "relative",
                overflow: "hidden"
              }}>
                <div style={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  background: `${plan.color}15`,
                  border: `1px solid ${plan.color}30`,
                  borderRadius: 20,
                  padding: "4px 10px",
                  fontSize: 11,
                  fontWeight: 700,
                  color: plan.color,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em"
                }}>
                  {plan.badge}
                </div>
                <div style={{ marginBottom: 20 }}>
                  <h3 style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)", marginBottom: 8 }}>
                    {plan.title}
                  </h3>
                  <div style={{ fontSize: 32, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                    {plan.price}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
                  {plan.features.map((feature, j) => (
                    <div key={j} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "var(--text-secondary)" }}>
                      <CheckCircle size={15} color={plan.color} />
                      {feature}
                    </div>
                  ))}
                </div>
                {plan.id === "pro_max" ? (
                  <a
                    href={plan.link}
                    className="btn-primary"
                    style={{
                      width: "100%",
                      padding: "12px 18px",
                      borderRadius: 12,
                      background: `linear-gradient(135deg, ${plan.color}, #7C3AED)`,
                      textDecoration: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8
                    }}
                  >
                    <Crown size={15} /> Contact Sales
                  </a>
                ) : (
                  <Link
                    href={plan.link}
                    className={plan.id === "pro" ? "btn-primary" : "btn-ghost"}
                    style={{
                      width: "100%",
                      padding: "12px 18px",
                      borderRadius: 12,
                      background: plan.id === "pro" ? `linear-gradient(135deg, ${plan.color}, #D97706)` : "transparent",
                      border: plan.id === "free" ? "1px solid var(--border-primary)" : "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8
                    }}
                  >
                    {plan.id === "pro" ? <Crown size={15} /> : <Shield size={15} />}
                    {plan.id === "pro" ? "Get Pro" : "Start Free"}
                  </Link>
                )}
              </div>
            </FadeSection>
          ))}
        </div>

        <style>{`
          @media (max-width: 900px) {
            .pricing-grid { grid-template-columns: 1fr !important; }
          }
          @media (min-width: 600px) and (max-width: 900px) {
            .pricing-grid { grid-template-columns: repeat(2, 1fr) !important; }
          }
        `}</style>
      </section>

      {/* ── CTA ── */}
      <FadeSection>
        <section style={{
          margin: "0 24px 100px", padding: 64, borderRadius: 24, textAlign: "center",
          background: "linear-gradient(135deg, rgba(255,107,53,0.08) 0%, rgba(59,130,246,0.06) 100%)",
          border: "1px solid var(--accent-border)",
        }}>
          <h2 className="font-display" style={{ fontSize: 32, fontWeight: 800, color: "var(--text-primary)", marginBottom: 12 }}>
            Ready to get started?
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: 16, marginBottom: 32, maxWidth: 440, margin: "0 auto 32px" }}>
            Join thousands of professionals using AI to analyze documents instantly.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/register?plan=free" className="btn-ghost" style={{ padding: "14px 28px", fontSize: 15 }}>
              <Shield size={15} /> Start Free
            </Link>
            <Link href="/register?plan=pro" className="btn-primary" style={{ padding: "14px 32px", fontSize: 15 }}>
              <Crown size={15} /> Get Pro <ArrowRight size={15} />
            </Link>
          </div>
        </section>
      </FadeSection>

      {/* ── Footer ── */}
      <footer style={{
        padding: "40px 24px", borderTop: "1px solid var(--border-primary)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        maxWidth: 1100, margin: "0 auto", flexWrap: "wrap", gap: 16,
      }}>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <Link href="/how-it-works" style={{ color: "var(--text-1)", textDecoration: "none", fontWeight: 500, transition: "color 0.2s" }} onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--accent)"} onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--text-1)"}>How it works</Link>
          <Link href="/pricing" style={{ color: "var(--text-1)", textDecoration: "none", fontWeight: 500, transition: "color 0.2s" }} onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--accent)"} onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--text-1)"}>Pricing</Link>
          <Link href="/login" style={{ color: "var(--text-1)", textDecoration: "none", fontWeight: 500, transition: "color 0.2s" }} onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--accent)"} onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--text-1)"}>Sign in</Link>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 24, height: 24, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
            background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
          }}>
            <Sparkles size={11} color="white" fill="white" />
          </div>
          <span className="font-display" style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>Vaurex</span>
        </div>
        <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
          &copy; {new Date().getFullYear()} Vaurex. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
