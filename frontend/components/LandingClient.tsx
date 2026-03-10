"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import {
  Sparkles, ArrowRight, Upload, Shield, Zap, FileSearch,
  Brain, BarChart3, Clock, CheckCircle, AlertTriangle,
  ChevronRight, Globe, Lock, Eye,
} from "lucide-react";

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
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Link href="/login" className="btn-ghost" style={{ padding: "8px 16px", fontSize: 13 }}>Sign in</Link>
          <Link href="/register" className="btn-primary" style={{ padding: "8px 18px", fontSize: 13 }}>
            Get started <ArrowRight size={13} />
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section ref={heroRef} style={{ position: "relative", overflow: "hidden", paddingTop: 140, paddingBottom: 80 }}>
        {/* Ambient orbs */}
        <div style={{ position: "absolute", top: "10%", left: "15%", width: 400, height: 400, borderRadius: "50%", background: "rgba(124,92,252,0.06)", filter: "blur(100px)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "30%", right: "10%", width: 300, height: 300, borderRadius: "50%", background: "rgba(6,214,160,0.04)", filter: "blur(80px)", pointerEvents: "none" }} />

        <motion.div style={{ y: heroY, opacity: heroOpacity, position: "relative", zIndex: 1 }}>
          <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center", padding: "0 24px" }}>
            <div className="badge-accent" style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 24, fontSize: 12 }}>
              <Sparkles size={12} /> AI Document Intelligence Platform
            </div>

            <h1 className="font-display" style={{
              fontSize: "clamp(40px, 6vw, 72px)", fontWeight: 800, lineHeight: 1.08,
              color: "var(--text-primary)", marginBottom: 20, letterSpacing: "-0.02em",
            }}>
              Know what&apos;s in your<br />
              <span style={{
                background: "linear-gradient(135deg, var(--accent-primary), var(--cyan))",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>
                documents
              </span>
            </h1>

            <p style={{ fontSize: 18, color: "var(--text-secondary)", maxWidth: 560, margin: "0 auto 36px", lineHeight: 1.7 }}>
              Drop any PDF, image, or screenshot. Get an instant AI intelligence report — risk scoring, entity extraction, and executive summary.
            </p>

            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/register" className="btn-primary" style={{ padding: "14px 28px", fontSize: 15 }}>
                Start free <ArrowRight size={15} />
              </Link>
              <a href="#demo" className="btn-ghost" style={{ padding: "14px 28px", fontSize: 15 }}>
                See it in action <ChevronRight size={15} />
              </a>
            </div>

            {/* Trust bar */}
            <div style={{ display: "flex", justifyContent: "center", gap: 32, marginTop: 48, flexWrap: "wrap" }}>
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
                  <div className="card-interactive" style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
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
                  background: "linear-gradient(135deg, var(--accent-primary), var(--cyan))",
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

      {/* ── CTA ── */}
      <FadeSection>
        <section style={{
          margin: "0 24px 100px", padding: 64, borderRadius: 24, textAlign: "center",
          background: "linear-gradient(135deg, rgba(124,92,252,0.08) 0%, rgba(6,214,160,0.06) 100%)",
          border: "1px solid var(--accent-border)",
        }}>
          <h2 className="font-display" style={{ fontSize: 32, fontWeight: 800, color: "var(--text-primary)", marginBottom: 12 }}>
            Ready to see what&apos;s in your documents?
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: 16, marginBottom: 32, maxWidth: 440, margin: "0 auto 32px" }}>
            Start with 3 free scans. No credit card required.
          </p>
          <Link href="/register" className="btn-primary" style={{ padding: "14px 32px", fontSize: 15 }}>
            Get started free <ArrowRight size={15} />
          </Link>
        </section>
      </FadeSection>

      {/* ── Footer ── */}
      <footer style={{
        padding: "40px 24px", borderTop: "1px solid var(--border-primary)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        maxWidth: 1100, margin: "0 auto", flexWrap: "wrap", gap: 16,
      }}>
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
