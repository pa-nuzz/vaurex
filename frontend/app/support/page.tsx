"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Send, HelpCircle, MessageSquare, Book, Zap,
  Shield, FileSearch, ChevronDown, ChevronRight, CheckCircle,
  Mail,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import { apiJson, safeUiError } from "@/lib/api";

const FAQ = [
  {
    q: "What file formats does Vaurex support?",
    a: "Vaurex supports PDF, PNG, JPG/JPEG, WEBP, GIF, BMP, and TIFF files up to 20 MB. Both text-based PDFs and scanned/image documents are supported via our OCR vision pipeline.",
  },
  {
    q: "How accurate is the risk scoring?",
    a: "Our multi-model AI pipeline (Gemini + Groq + OpenRouter) achieves 99.2% OCR accuracy. Risk scores are evidence-based — the AI cites specific clauses or patterns in its reasoning, not guesswork.",
  },
  {
    q: "Are my documents stored permanently?",
    a: "No. Documents are processed in memory and encrypted at rest. Raw file content is never retained longer than processing requires. Only the analysis results (risk score, entities, summary) are stored in your account.",
  },
  {
    q: "What's the difference between Free and Pro?",
    a: "Free accounts get 5 document scans with full analysis. Pro ($19/mo) gives unlimited scans, AI chat on every document, advanced financial entity extraction, PDF report downloads, and priority pipeline access.",
  },
  {
    q: "How does the AI chat work?",
    a: "After a document is analyzed, the AI chat has full context — risk score, entities, flags, and extracted text. You can ask it to explain clauses, summarize sections, or find specific information.",
  },
  {
    q: "Can I use Vaurex via API?",
    a: "API access is coming soon for Pro and Enterprise plans. Join the waitlist by contacting us and we'll notify you when it's available.",
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        background: open ? "rgba(255,90,31,0.03)" : "var(--bg-secondary)",
        border: `1px solid ${open ? "var(--accent-border)" : "var(--border-primary)"}`,
        borderRadius: 14, overflow: "hidden", transition: "all 0.2s",
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 20px", background: "none", border: "none", cursor: "pointer", textAlign: "left", gap: 12,
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.4 }}>{q}</span>
        {open ? <ChevronDown size={16} color="var(--accent-primary)" style={{ flexShrink: 0 }} /> : <ChevronRight size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />}
      </button>
      {open && (
        <div style={{ padding: "0 20px 18px", fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.75 }}>
          {a}
        </div>
      )}
    </div>
  );
}

export default function SupportPage() {
  const { toast } = useToast();
  const [subject, setSubject] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !email.trim() || !message.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session) headers["Authorization"] = `Bearer ${session.access_token}`;

      await apiJson(
        "/api/v1/support",
        {
          method: "POST",
          headers,
          body: JSON.stringify({
          subject: subject.trim().slice(0, 200),
          email: email.trim().slice(0, 200),
          message: message.trim().slice(0, 2000),
        }),
        },
        { auth: Boolean(session), fallbackMessage: "Failed to send request." },
      );
      setSent(true);
      setSubject(""); setEmail(""); setMessage("");
      toast.success("Support request sent! We'll reply within 24 hours.");
    } catch (err: unknown) {
      toast.error(safeUiError(err, "Unable to send support request."));
    } finally {
      setLoading(false);
    }
  };

  const quickLinks = [
    { icon: Book, title: "Documentation", desc: "Guides, API reference, and tutorials", href: "/how-vaurex-works", color: "var(--accent-primary)" },
    { icon: Zap, title: "Getting started", desc: "Upload your first document in 60 seconds", href: "/workbench", color: "var(--cyan)" },
    { icon: Shield, title: "Security & privacy", desc: "How we protect your data", href: "/settings", color: "#3B82F6" },
    { icon: FileSearch, title: "Pricing FAQ", desc: "Free vs Pro — what's included", href: "/#pricing", color: "#D97706" },
  ];
  const serviceIndicators = [
    { label: "First reply", value: "< 24h" },
    { label: "Coverage", value: "Product + billing" },
    { label: "Channel", value: "In-app + email" },
  ];
  const supportChannels = [
    { icon: MessageSquare, title: "Product questions", detail: "Workflows, scans, AI chat, and usage guidance" },
    { icon: Shield, title: "Security concerns", detail: "Data handling, privacy, and account safety issues" },
    { icon: Mail, title: "Billing help", detail: "Subscription, plan limits, and invoice support" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", padding: "24px 24px 80px" }}>
      {/* Ambient glow */}
      <div style={{ position: "fixed", top: "-10%", left: "-10%", width: "40vw", height: "40vw", borderRadius: "50%", background: "rgba(255,90,31,0.04)", filter: "blur(100px)", pointerEvents: "none" }} />

      <div style={{ maxWidth: 900, margin: "0 auto", position: "relative" }}>
        <Link href="/workbench" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "var(--text-muted)", marginBottom: 32, fontSize: 14, textDecoration: "none" }}>
          <ArrowLeft size={15} /> Back to Workbench
        </Link>

        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--accent-surface)", border: "1px solid var(--accent-border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <HelpCircle size={20} color="var(--accent-primary)" />
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.03em" }}>Support Center</h1>
          </div>
          <p style={{ fontSize: 15, color: "var(--text-secondary)", maxWidth: 520 }}>
            Browse our FAQ, explore quick links, or send us a message. We typically respond within 24 hours.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 18 }}>
            {serviceIndicators.map((item) => (
              <div
                key={item.label}
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid var(--border-primary)",
                  minWidth: 132,
                }}
              >
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick links */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 48 }}>
          {quickLinks.map((l, i) => (
            <a
              key={i}
              href={l.href}
              style={{
                display: "flex", alignItems: "flex-start", gap: 12, padding: 18,
                background: "var(--bg-secondary)", border: "1px solid var(--border-primary)",
                borderRadius: 14, textDecoration: "none", transition: "all 0.2s",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-hover)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-primary)"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${l.color}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <l.icon size={17} color={l.color} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 3 }}>{l.title}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.4 }}>{l.desc}</div>
              </div>
            </a>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: 32, alignItems: "start" }} className="support-grid">
          {/* FAQ */}
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", marginBottom: 20, letterSpacing: "-0.02em" }}>
              Frequently asked questions
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {FAQ.map((item, i) => <FAQItem key={i} {...item} />)}
            </div>
          </div>

          {/* Contact form */}
          <div style={{ position: "sticky", top: 24 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ background: "linear-gradient(180deg, rgba(255,90,31,0.08), rgba(255,255,255,0.02))", border: "1px solid var(--accent-border)", borderRadius: 20, padding: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <HelpCircle size={16} color="var(--accent-primary)" />
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>What we can help with</h3>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {supportChannels.map((channel) => (
                    <div key={channel.title} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <div style={{ width: 30, height: 30, borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-primary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <channel.icon size={14} color="var(--accent-primary)" />
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}>{channel.title}</div>
                        <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>{channel.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-primary)", borderRadius: 20, padding: 28 }}>
              {sent ? (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, margin: "0 auto 16px", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <CheckCircle size={24} color="#10B981" />
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>Message sent!</h3>
                  <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 20 }}>We&apos;ll get back to you within 24 hours at the email you provided.</p>
                  <button onClick={() => setSent(false)} className="btn-ghost" style={{ padding: "8px 20px", fontSize: 13, borderRadius: 8 }}>Send another</button>
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
                    <MessageSquare size={17} color="var(--accent-primary)" />
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>Contact us</h3>
                  </div>

                  <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 7 }}>Your email</label>
                      <div style={{ position: "relative" }}>
                        <Mail size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                        <input
                          type="email" value={email} onChange={e => setEmail(e.target.value)} required
                          placeholder="you@company.com"
                          style={{ width: "100%", background: "var(--bg-primary)", border: "1px solid var(--border-primary)", borderRadius: 10, padding: "9px 12px 9px 34px", color: "var(--text-primary)", fontSize: 13, outline: "none" }}
                          onFocus={e => (e.target.style.borderColor = "var(--accent-primary)")}
                          onBlur={e => (e.target.style.borderColor = "var(--border-primary)")}
                        />
                      </div>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 7 }}>Subject</label>
                      <input
                        value={subject} onChange={e => setSubject(e.target.value)} required maxLength={200}
                        placeholder="Brief description of your issue"
                        style={{ width: "100%", background: "var(--bg-primary)", border: "1px solid var(--border-primary)", borderRadius: 10, padding: "9px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none" }}
                        onFocus={e => (e.target.style.borderColor = "var(--accent-primary)")}
                        onBlur={e => (e.target.style.borderColor = "var(--border-primary)")}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 7 }}>Message</label>
                      <textarea
                        value={message} onChange={e => setMessage(e.target.value)} required maxLength={2000} rows={5}
                        placeholder="Describe your issue in detail..."
                        style={{ width: "100%", background: "var(--bg-primary)", border: "1px solid var(--border-primary)", borderRadius: 10, padding: "9px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none", resize: "vertical", fontFamily: "inherit" }}
                        onFocus={e => (e.target.style.borderColor = "var(--accent-primary)")}
                        onBlur={e => (e.target.style.borderColor = "var(--border-primary)")}
                      />
                      <div style={{ textAlign: "right", fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>{message.length}/2000</div>
                    </div>
                    <button type="submit" disabled={loading} className="btn-primary" style={{ width: "100%", padding: "11px", fontSize: 14, borderRadius: 10 }}>
                      {loading ? "Sending..." : <><Send size={14} /> Send message</>}
                    </button>
                  </form>

                  <div style={{ marginTop: 18, paddingTop: 18, borderTop: "1px solid var(--border-primary)", display: "flex", alignItems: "center", gap: 8 }}>
                    <Mail size={13} color="var(--text-muted)" />
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Or email directly: </span>
                    <a href="mailto:support@vaurex.com" style={{ fontSize: 12, color: "var(--accent-primary)", textDecoration: "none" }}>support@vaurex.com</a>
                  </div>
                </>
              )}
            </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`@media(max-width:768px){.support-grid{grid-template-columns:1fr !important}}`}</style>
    </div>
  );
}