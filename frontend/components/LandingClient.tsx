"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import {
  Sparkles, ArrowRight, Upload, Shield, Zap, FileSearch,
  Brain, BarChart3, Clock, CheckCircle, AlertTriangle,
  ChevronRight, Globe, Lock, Eye, Crown,
} from "lucide-react";

/* ─────────────────────────────────────────────
   CSS Variables + Global resets (self-contained)
───────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap');

  :root {
    /* Backgrounds — 60% */
    --bg-base:     #0C0D10;
    --bg-surface:  #111318;
    --bg-elevated: #161820;
    --bg-inset:    #0E0F13;

    /* Borders */
    --border:      rgba(255,255,255,0.07);
    --border-md:   rgba(255,255,255,0.11);

    /* Text */
    --text-1: #F0F0F5;
    --text-2: #9899A8;
    --text-3: #5C5D6E;

    /* Blue — 30% */
    --blue:        #3B82F6;
    --blue-dim:    rgba(59,130,246,0.10);
    --blue-border: rgba(59,130,246,0.22);

    /* Orange — 10% accent */
    --accent:        #FF6B35;
    --accent-dim:    rgba(255,107,53,0.10);
    --accent-border: rgba(255,107,53,0.22);
    --accent-2:      #06D6A0;

    /* Status */
    --danger:  #EF4444;
    --warning: #F59E0B;
    --success: #10B981;

    /* Shadow */
    --shadow: 0 4px 24px rgba(0,0,0,0.5), 0 1px 4px rgba(0,0,0,0.4);
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: var(--bg-base);
    color: var(--text-1);
    font-family: 'Inter', sans-serif;
    -webkit-font-smoothing: antialiased;
  }

  .font-display { font-family: 'Plus Jakarta Sans', sans-serif; }

  /* Nav */
  .vx-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    height: 58px; padding: 0 28px;
    display: flex; align-items: center; justify-content: space-between;
    background: rgba(12,13,16,0.80);
    backdrop-filter: blur(18px) saturate(150%);
    border-bottom: 1px solid var(--border);
  }

  .vx-logo { display: flex; align-items: center; gap: 8px; text-decoration: none; }
  .vx-logo-icon {
    width: 28px; height: 28px; border-radius: 7px;
    background: linear-gradient(135deg, var(--accent), #FF9A5C);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }

  .vx-nav-links { display: flex; align-items: center; gap: 4px; }
  .vx-nav-link {
    padding: 6px 14px; border-radius: 7px;
    font-size: 13px; font-weight: 500; color: var(--text-2);
    text-decoration: none; transition: all 0.15s;
  }
  .vx-nav-link:hover { color: var(--text-1); background: rgba(255,255,255,0.05); }

  /* Buttons */
  .vx-btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 8px 16px; border-radius: 8px;
    font-size: 13px; font-weight: 600;
    text-decoration: none; cursor: pointer; border: none;
    font-family: inherit; transition: all 0.15s;
    white-space: nowrap;
  }
  .vx-btn-ghost {
    background: transparent;
    border: 1px solid var(--border-md);
    color: var(--text-2);
  }
  .vx-btn-ghost:hover { border-color: rgba(255,255,255,0.2); color: var(--text-1); }

  .vx-btn-primary {
    background: var(--blue);
    color: #fff;
  }
  .vx-btn-primary:hover { background: #5a9cf8; }

  /* Cards */
  .vx-card {
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 24px;
  }
  .vx-card-hover {
    transition: border-color 0.2s, background 0.2s;
  }
  .vx-card-hover:hover {
    border-color: var(--border-md);
    background: var(--bg-elevated);
  }

  /* Pill badges */
  .vx-pill {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 4px 10px; border-radius: 999px;
    font-size: 11px; font-weight: 700; letter-spacing: 0.04em;
  }
  .vx-pill-blue {
    background: var(--blue-dim); border: 1px solid var(--blue-border); color: var(--blue);
  }
  .vx-pill-orange {
    background: var(--accent-dim); border: 1px solid var(--accent-border); color: var(--accent);
  }
  .vx-pill-danger {
    background: rgba(239,68,68,0.10); border: 1px solid rgba(239,68,68,0.22); color: var(--danger);
  }
  .vx-pill-success {
    background: rgba(16,185,129,0.10); border: 1px solid rgba(16,185,129,0.22); color: var(--success);
  }

  /* Section heading pattern */
  .vx-overline {
    font-size: 11px; font-weight: 700; letter-spacing: 0.1em;
    text-transform: uppercase; color: var(--blue);
    margin-bottom: 12px;
  }

  /* Responsive helpers */
  @media (max-width: 820px) {
    .hero-two-col { grid-template-columns: 1fr !important; }
    .hero-panel-hide { display: none !important; }
  }
  @media (max-width: 760px) {
    .demo-two-col { grid-template-columns: 1fr !important; }
    .pricing-three-col { grid-template-columns: 1fr !important; }
  }
`;

/* ── Fade-in section wrapper ── */
function Fade({ children, className = "", delay = 0 }: {
  children: React.ReactNode; className?: string; delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}>
      {children}
    </motion.div>
  );
}

export default function LandingClient() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  const [demoStage, setDemoStage] = useState<"idle" | "uploading" | "processing" | "done">("idle");
  const demoScore = 72;

  function runDemo() {
    setDemoStage("uploading");
    setTimeout(() => setDemoStage("processing"), 900);
    setTimeout(() => setDemoStage("done"), 2500);
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
    <>
      <style>{STYLES}</style>

      {/* ── Navbar ── */}
      <nav className="vx-nav">
        <Link href="/" className="vx-logo">
          <div className="vx-logo-icon">
            <Sparkles size={13} color="white" fill="white" />
          </div>
          <span className="font-display" style={{ fontWeight: 800, fontSize: 15, color: "var(--text-1)", letterSpacing: "-0.01em" }}>Vaurex</span>
        </Link>

        <div className="vx-nav-links">
          <Link href="/how-it-works" className="vx-nav-link">How it works</Link>
          <Link href="/pricing" className="vx-nav-link">Pricing</Link>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/login" className="vx-btn vx-btn-ghost">Sign in</Link>
          <Link href="/register" className="vx-btn vx-btn-primary">
            Get started <ArrowRight size={13} />
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section ref={heroRef} style={{ paddingTop: 100, paddingBottom: 80, overflow: "hidden", position: "relative" }}>
        {/* Single subtle radial glow */}
        <div style={{
          position: "absolute", top: "5%", left: "50%", transform: "translateX(-50%)",
          width: 700, height: 400, borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(59,130,246,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <motion.div style={{ y: heroY, opacity: heroOpacity }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>
            <div className="hero-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 430px", gap: 56, alignItems: "center" }}>

              {/* ── Copy ── */}
              <div>
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05 }} style={{ marginBottom: 22 }}>
                  <span className="vx-pill vx-pill-blue"><Sparkles size={11} /> AI Document Intelligence</span>
                </motion.div>

                <motion.h1 className="font-display"
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.12 }}
                  style={{ fontSize: "clamp(38px, 4.8vw, 62px)", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.03em", color: "var(--text-1)", marginBottom: 20 }}
                >
                  Know exactly what&apos;s<br />
                  in your{" "}
                  <span style={{ background: "linear-gradient(135deg, var(--blue) 0%, #60a5fa 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>documents</span>
                </motion.h1>

                <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.22 }}
                  style={{ fontSize: 16, color: "var(--text-2)", maxWidth: 460, marginBottom: 32, lineHeight: 1.75 }}>
                  Drop in a PDF, image, or screenshot and get a clear readout in seconds — what matters, what looks risky, and what to do next.
                </motion.p>

                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
                  style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 36 }}>
                  <Link href="/register" className="vx-btn vx-btn-primary" style={{ padding: "11px 24px", fontSize: 14 }}>
                    Start free <ArrowRight size={14} />
                  </Link>
                  <a href="#demo" className="vx-btn vx-btn-ghost" style={{ padding: "11px 22px", fontSize: 14 }}>
                    See it in action <ChevronRight size={14} />
                  </a>
                </motion.div>

                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.42 }}
                  style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                  {[{ icon: Shield, label: "SOC 2 Ready" }, { icon: Globe, label: "Multi-model AI" }, { icon: Clock, label: "Results in seconds" }].map((t, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <t.icon size={13} color="var(--text-3)" />
                      <span style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 500 }}>{t.label}</span>
                    </div>
                  ))}
                </motion.div>
              </div>

              {/* ── Product preview card ── */}
              <motion.div className="hero-panel-hide"
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.25 }}
                style={{ background: "var(--bg-surface)", border: "1px solid var(--border-md)", borderRadius: 16, overflow: "hidden", boxShadow: "var(--shadow)" }}
              >
                {/* Card header */}
                <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg-elevated)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: "var(--blue-dim)", border: "1px solid var(--blue-border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <FileSearch size={14} color="var(--blue)" />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>Final Contract</div>
                      <div style={{ fontSize: 11, color: "var(--text-3)" }}>Scan complete · 6s</div>
                    </div>
                  </div>
                  <span className="vx-pill vx-pill-danger">High Risk · 90</span>
                </div>

                {/* Risk bar */}
                <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-2)" }}>Risk Score</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--danger)" }}>90 / 100</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 999, background: "var(--bg-inset)", border: "1px solid var(--border)", overflow: "hidden" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "90%" }}
                      transition={{ duration: 1.0, delay: 0.45, ease: "easeOut" }}
                      style={{ height: "100%", borderRadius: 999, background: "linear-gradient(90deg, #F59E0B, #EF4444)" }}
                    />
                  </div>
                </div>

                {/* Entities */}
                <div style={{ padding: "13px 18px", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-3)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Detected Entities</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {["Nexus Holdings Ltd", "$4.2M transfer", "James Crowley", "Offshore account"].map((e, i) => (
                      <span key={i} style={{ padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600, background: i === 3 ? "rgba(239,68,68,0.08)" : "var(--blue-dim)", color: i === 3 ? "var(--danger)" : "var(--blue)", border: `1px solid ${i === 3 ? "rgba(239,68,68,0.22)" : "var(--blue-border)"}` }}>{e}</span>
                    ))}
                  </div>
                </div>

                {/* Summary */}
                <div style={{ padding: "13px 18px" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-3)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>Executive Summary</div>
                  <p style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.7 }}>
                    This contract includes a $4.2M offshore transfer and several one-sided clauses. <span style={{ color: "var(--danger)", fontWeight: 600 }}>Best next step: legal review before signing.</span>
                  </p>
                </div>

                <div style={{ padding: "9px 18px", borderTop: "1px solid var(--border)", background: "var(--bg-elevated)", display: "flex", alignItems: "center", gap: 6 }}>
                  <Sparkles size={10} color="var(--accent)" />
                  <span style={{ fontSize: 11, color: "var(--text-3)" }}>How this looks inside your Vaurex workbench</span>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Stats bar ── */}
      <Fade>
        <div style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", background: "var(--bg-surface)" }}>
          <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 24px", display: "flex", justifyContent: "center", gap: 64, flexWrap: "wrap" }}>
            {[{ value: "< 10s", label: "Avg. analysis time" }, { value: "99.2%", label: "OCR accuracy" }, { value: "3+", label: "AI models in pipeline" }].map((s, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div className="font-display" style={{ fontSize: 26, fontWeight: 800, color: "var(--text-1)", letterSpacing: "-0.02em", marginBottom: 4 }}>{s.value}</div>
                <div style={{ fontSize: 12, color: "var(--text-3)" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </Fade>

      {/* ── Interactive Demo ── */}
      <section id="demo" style={{ padding: "80px 24px", maxWidth: 1100, margin: "0 auto" }}>
        <Fade>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div className="vx-overline">Live demo</div>
            <h2 className="font-display" style={{ fontSize: 34, fontWeight: 800, color: "var(--text-1)", letterSpacing: "-0.02em" }}>Try it right now</h2>
            <p style={{ color: "var(--text-2)", fontSize: 15, maxWidth: 440, margin: "10px auto 0" }}>Quick preview — run a sample scan and see the kind of output you’ll get.</p>
          </div>
        </Fade>

        <Fade delay={0.1}>
          <div className="demo-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>
            {/* Upload / demo card */}
            <div className="vx-card" style={{ minHeight: 320, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
              {demoStage === "idle" && (
                <>
                  <div style={{ width: 56, height: 56, borderRadius: 14, marginBottom: 18, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--accent-dim)", border: "1.5px dashed var(--accent-border)" }}>
                    <Upload size={22} color="var(--accent)" />
                  </div>
                  <h3 className="font-display" style={{ fontSize: 17, fontWeight: 700, color: "var(--text-1)", marginBottom: 8 }}>Upload a document</h3>
                  <p style={{ color: "var(--text-2)", fontSize: 13, marginBottom: 22, maxWidth: 240 }}>PDF, photo, or screenshot — if it has text, we can analyze it.</p>
                  <button onClick={runDemo} className="vx-btn vx-btn-primary" style={{ padding: "10px 22px" }}>
                    Run demo scan <Zap size={13} />
                  </button>
                </>
              )}
              {demoStage === "uploading" && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
                  <Upload size={22} color="var(--accent)" />
                  <p style={{ color: "var(--text-2)", fontSize: 13 }}>Uploading your file…</p>
                  <div style={{ width: 180, height: 3, borderRadius: 2, background: "var(--border)", overflow: "hidden" }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 0.8 }} style={{ height: "100%", background: "var(--accent)", borderRadius: 2 }} />
                  </div>
                </div>
              )}
              {demoStage === "processing" && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
                  <Brain size={22} color="var(--blue)" />
                  <p style={{ color: "var(--text-1)", fontSize: 14, fontWeight: 600 }}>Reading your document…</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%", maxWidth: 220 }}>
                    {["OCR extraction", "Entity recognition", "Risk assessment"].map((step, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.4 }}
                        style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-2)" }}>
                        <CheckCircle size={13} color="var(--success)" /> {step}
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
              {demoStage === "done" && (
                <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} style={{ width: "100%", textAlign: "left" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 16 }}>
                    <CheckCircle size={15} color="var(--success)" />
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--success)" }}>Done — here’s your result</span>
                  </div>
                  <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px", marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <span style={{ fontSize: 12, color: "var(--text-3)" }}>Risk Score</span>
                      <span className="font-display" style={{ fontSize: 28, fontWeight: 800, color: "var(--warning)", lineHeight: 1 }}>{demoScore}</span>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: "var(--border)", overflow: "hidden" }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${demoScore}%` }} transition={{ duration: 1, delay: 0.2 }}
                        style={{ height: "100%", borderRadius: 2, background: "var(--warning)" }} />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 7, marginBottom: 14 }}>
                    <span className="vx-pill vx-pill-orange">3 entities</span>
                    <span className="vx-pill vx-pill-danger">2 risk flags</span>
                  </div>
                  <button onClick={() => setDemoStage("idle")} className="vx-btn vx-btn-ghost" style={{ fontSize: 12, padding: "7px 14px" }}>Reset demo</button>
                </motion.div>
              )}
            </div>

            {/* Feature mini-cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { icon: BarChart3,     title: "Risk Intelligence",  desc: "Evidence-based scoring with document-specific reasoning." },
                { icon: FileSearch,    title: "Deep Extraction",    desc: "Entities, dates, financials — automatically structured." },
                { icon: AlertTriangle, title: "Fraud Detection",    desc: "Flag suspicious patterns and anomalies in real-time." },
              ].map((f, i) => (
                <Fade key={i} delay={i * 0.08}>
                  <div className="vx-card vx-card-hover" style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                    <div style={{ width: 38, height: 38, borderRadius: 9, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--blue-dim)", border: "1px solid var(--blue-border)" }}>
                      <f.icon size={16} color="var(--blue)" />
                    </div>
                    <div>
                      <h4 className="font-display" style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)", marginBottom: 4 }}>{f.title}</h4>
                      <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6 }}>{f.desc}</p>
                    </div>
                  </div>
                </Fade>
              ))}
            </div>
          </div>
        </Fade>
      </section>

      {/* ── Features Grid ── */}
      <section style={{ padding: "0 24px 90px", maxWidth: 1100, margin: "0 auto" }}>
        <Fade>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <div className="vx-overline">What you get</div>
            <h2 className="font-display" style={{ fontSize: 34, fontWeight: 800, color: "var(--text-1)", letterSpacing: "-0.02em" }}>Everything you need</h2>
            <p style={{ color: "var(--text-2)", fontSize: 15, maxWidth: 440, margin: "10px auto 0" }}>A complete document intelligence toolkit, powered by a multi-model AI pipeline.</p>
          </div>
        </Fade>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
          {features.map((f, i) => (
            <Fade key={i} delay={i * 0.07}>
              <div className="vx-card vx-card-hover" style={{ height: "100%" }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--blue-dim)", border: "1px solid var(--blue-border)" }}>
                  <f.icon size={18} color="var(--blue)" />
                </div>
                <h3 className="font-display" style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)", marginBottom: 7 }}>{f.title}</h3>
                <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            </Fade>
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section style={{ padding: "0 24px 90px", maxWidth: 900, margin: "0 auto" }}>
        <Fade>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <div className="vx-overline">Process</div>
            <h2 className="font-display" style={{ fontSize: 34, fontWeight: 800, color: "var(--text-1)", letterSpacing: "-0.02em" }}>How it works</h2>
            <p style={{ color: "var(--text-2)", fontSize: 15 }}>Three simple steps to actionable document intelligence.</p>
          </div>
        </Fade>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
          {steps.map((s, i) => (
            <Fade key={i} delay={i * 0.12}>
              <div className="vx-card" style={{ textAlign: "center", height: "100%" }}>
                <div className="font-display" style={{
                  fontSize: 36, fontWeight: 800, marginBottom: 12,
                  background: i === 0 ? "linear-gradient(135deg, var(--accent), #ffb088)"
                             : i === 1 ? "linear-gradient(135deg, var(--blue), #93c5fd)"
                             : "linear-gradient(135deg, var(--accent-2), var(--blue))",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                }}>
                  {s.num}
                </div>
                <h3 className="font-display" style={{ fontSize: 17, fontWeight: 700, color: "var(--text-1)", marginBottom: 8 }}>{s.title}</h3>
                <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.7 }}>{s.desc}</p>
              </div>
            </Fade>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section style={{ padding: "0 24px 90px", maxWidth: 1100, margin: "0 auto" }}>
        <Fade>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <div className="vx-overline">Pricing</div>
            <h2 className="font-display" style={{ fontSize: 34, fontWeight: 800, color: "var(--text-1)", letterSpacing: "-0.02em" }}>Choose your plan</h2>
            <p style={{ color: "var(--text-2)", fontSize: 15, maxWidth: 400, margin: "10px auto 0" }}>Start free, upgrade when you need more.</p>
          </div>
        </Fade>

        <div className="pricing-three-col" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {[
            { id: "free",    label: "Free",    price: "$0",     period: "forever",       color: "var(--accent)", dimColor: "var(--accent-dim)",       borderColor: "var(--accent-border)",         features: ["5 document scans/day", "5 chat sessions/day", "Risk scoring + extraction", "Daily reset"],                link: "/register?plan=free",                                              cta: "Start free",     icon: Shield,  featured: false },
            { id: "pro",     label: "Pro",     price: "$19",    period: "per month",     color: "var(--blue)",   dimColor: "var(--blue-dim)",         borderColor: "var(--blue-border)",           features: ["Unlimited scans", "Unlimited chat", "Priority processing", "Advanced exports"],                   link: "/register?plan=pro",                                               cta: "Get Pro",        icon: Crown,   featured: true  },
            { id: "pro_max", label: "Pro Max", price: "Custom", period: "contact us",    color: "#A78BFA",       dimColor: "rgba(167,139,250,0.10)", borderColor: "rgba(167,139,250,0.22)",       features: ["Everything in Pro", "Custom AI models", "API access", "Dedicated support"],                        link: "mailto:support@vaurex.com?subject=Pro Max Inquiry",                cta: "Contact sales",  icon: Crown,   featured: false },
          ].map((plan, i) => (
            <Fade key={i} delay={i * 0.08}>
              <div style={{
                background: plan.featured ? "var(--bg-elevated)" : "var(--bg-surface)",
                border: `1px solid ${plan.featured ? plan.borderColor : "var(--border)"}`,
                borderRadius: 14, padding: 24, height: "100%",
                display: "flex", flexDirection: "column", position: "relative",
              }}>
                {plan.featured && (
                  <div style={{ position: "absolute", top: -1, left: "50%", transform: "translateX(-50%)" }}>
                    <span style={{ background: "var(--blue)", color: "#fff", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", padding: "3px 12px", borderRadius: "0 0 8px 8px", textTransform: "uppercase" }}>Most popular</span>
                  </div>
                )}
                <div style={{ marginBottom: 6 }}>
                  <span className="vx-pill" style={{ background: plan.dimColor, border: `1px solid ${plan.borderColor}`, color: plan.color }}>{plan.label}</span>
                </div>
                <div className="font-display" style={{ fontSize: 40, fontWeight: 800, color: "var(--text-1)", letterSpacing: "-0.02em", marginTop: 12, lineHeight: 1 }}>{plan.price}</div>
                <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 24, marginTop: 4 }}>{plan.period}</div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                  {plan.features.map((f, j) => (
                    <div key={j} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13, color: "var(--text-2)" }}>
                      <CheckCircle size={14} color={plan.color} style={{ flexShrink: 0 }} />
                      {f}
                    </div>
                  ))}
                </div>
                <div>
                  {plan.id === "pro_max" ? (
                    <a href={plan.link} className="vx-btn vx-btn-ghost" style={{ justifyContent: "center", padding: "11px", width: "100%", borderRadius: 9 }}>
                      <plan.icon size={14} /> {plan.cta}
                    </a>
                  ) : (
                    <Link href={plan.link} className="vx-btn" style={{ justifyContent: "center", padding: "11px", width: "100%", borderRadius: 9, background: plan.featured ? "var(--blue)" : "transparent", border: plan.featured ? "none" : "1px solid var(--border-md)", color: plan.featured ? "#fff" : "var(--text-2)" }}>
                      <plan.icon size={14} /> {plan.cta}
                    </Link>
                  )}
                </div>
              </div>
            </Fade>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <Fade>
        <section style={{ margin: "0 24px 90px", padding: "60px 48px", borderRadius: 20, textAlign: "center", background: "var(--bg-surface)", border: "1px solid var(--border-md)" }}>
          <div className="vx-overline" style={{ display: "flex", justifyContent: "center" }}>Get started</div>
          <h2 className="font-display" style={{ fontSize: 34, fontWeight: 800, color: "var(--text-1)", marginBottom: 12, letterSpacing: "-0.02em" }}>Ready to get started?</h2>
          <p style={{ color: "var(--text-2)", fontSize: 15, maxWidth: 400, margin: "0 auto 32px", lineHeight: 1.7 }}>
            Join professionals using AI to analyze documents instantly.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/register?plan=free" className="vx-btn vx-btn-ghost" style={{ padding: "12px 26px", fontSize: 14 }}>
              <Shield size={14} /> Start free
            </Link>
            <Link href="/register?plan=pro" className="vx-btn vx-btn-primary" style={{ padding: "12px 26px", fontSize: 14 }}>
              <Crown size={14} /> Get Pro <ArrowRight size={14} />
            </Link>
          </div>
        </section>
      </Fade>

      {/* ── Footer ── */}
      <footer style={{ padding: "32px 24px", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: 1100, margin: "0 auto", flexWrap: "wrap", gap: 16 }}>
        <Link href="/" className="vx-logo" style={{ textDecoration: "none" }}>
          <div className="vx-logo-icon"><Sparkles size={11} color="white" fill="white" /></div>
          <span className="font-display" style={{ fontWeight: 800, fontSize: 14, color: "var(--text-1)" }}>Vaurex</span>
        </Link>
        <div style={{ display: "flex", gap: 20 }}>
          {[{ href: "/how-it-works", label: "How it works" }, { href: "/pricing", label: "Pricing" }, { href: "/login", label: "Sign in" }].map((l) => (
            <Link key={l.href} href={l.href} style={{ fontSize: 13, color: "var(--text-3)", textDecoration: "none", fontWeight: 500 }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--text-1)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--text-3)"}
            >{l.label}</Link>
          ))}
        </div>
        <p style={{ fontSize: 12, color: "var(--text-3)" }}>&copy; {new Date().getFullYear()} Vaurex. All rights reserved.</p>
      </footer>
    </>
  );
}