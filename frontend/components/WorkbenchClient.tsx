"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { apiFetch, apiJson, safeUiError } from "@/lib/api";
import {
  Upload, FileText, Loader2, CheckCircle, AlertTriangle, XCircle,
  Sparkles, LogOut, Clock, ChevronRight, BarChart3, Users, FileSearch,
  AlertCircle, Shield, Trash2, RefreshCw, Download, Settings,
  TrendingUp, MessageSquare, Lock, X, Home, History,
  Crown, HelpCircle, ChevronDown, Send, Zap, Star, Bell,
} from "lucide-react";

/* ─── Self-contained CSS ────────────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap');

  :root {
    /* Backgrounds — 60% dark grey */
    --bg-base:     #0C0D10;
    --bg-primary:  #0E0F13;
    --bg-secondary:#111318;
    --bg-elevated: #161820;
    --bg-inset:    #0A0B0E;

    /* Borders */
    --border-primary: rgba(255,255,255,0.07);
    --border-hover:   rgba(255,255,255,0.14);

    /* Text */
    --text-primary:   #F0F0F5;
    --text-secondary: #AAAAB8;
    --text-muted:     #5C5D6E;

    /* Blue — 30% */
    --blue:        #3B82F6;
    --blue-dim:    rgba(59,130,246,0.10);
    --blue-border: rgba(59,130,246,0.22);

    /* Orange — 10% accent */
    --accent-primary:  #FF6B35;
    --accent-secondary:#FF9A5C;
    --accent-surface:  rgba(255,107,53,0.10);
    --accent-border:   rgba(255,107,53,0.22);

    /* Semantic */
    --danger:  #EF4444;
    --warning: #F59E0B;
    --success: #10B981;
    --cyan:    #06D6A0;
    --pro:     #F59E0B;

    /* Shadows */
    --shadow:    0 4px 24px rgba(0,0,0,0.5);
    --shadow-lg: 0 16px 48px rgba(0,0,0,0.6);
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: var(--bg-base);
    color: var(--text-primary);
    font-family: 'Inter', sans-serif;
    -webkit-font-smoothing: antialiased;
  }

  .font-display { font-family: 'Plus Jakarta Sans', sans-serif; }

  /* ── Buttons ── */
  .btn-primary {
    display: inline-flex; align-items: center; justify-content: center; gap: 6px;
    padding: 9px 18px; border-radius: 10px;
    background: var(--blue); color: #fff;
    font-size: 13px; font-weight: 600; font-family: inherit;
    border: none; cursor: pointer; text-decoration: none;
    transition: background 0.15s, opacity 0.15s;
  }
  .btn-primary:hover { background: #5a9cf8; }
  .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

  .btn-ghost {
    display: inline-flex; align-items: center; justify-content: center; gap: 6px;
    padding: 9px 18px; border-radius: 10px;
    background: transparent; color: var(--text-secondary);
    font-size: 13px; font-weight: 600; font-family: inherit;
    border: 1px solid var(--border-hover); cursor: pointer; text-decoration: none;
    transition: all 0.15s;
  }
  .btn-ghost:hover { border-color: rgba(255,255,255,0.22); color: var(--text-primary); }

  /* ── Cards ── */
  .card {
    background: var(--bg-secondary);
    border: 1px solid var(--border-primary);
    border-radius: 14px;
    padding: 20px;
  }

  .card-interactive {
    background: var(--bg-secondary);
    border: 1px solid var(--border-primary);
    border-radius: 14px;
    padding: 20px;
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s;
    text-align: left; width: 100%; font-family: inherit;
    color: var(--text-primary); font-size: 13px;
    display: block; border-style: solid;
  }
  .card-interactive:hover {
    border-color: var(--border-hover);
    background: var(--bg-elevated);
  }

  .card-inset {
    background: var(--bg-inset);
    border: 1px solid var(--border-primary);
    border-radius: 10px;
    padding: 14px;
  }

  .glass-panel {
    background: var(--bg-elevated);
    border: 1px solid var(--border-primary);
    border-radius: 14px;
    padding: 20px;
  }

  /* ── Badges ── */
  .badge-accent {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 4px 10px; border-radius: 999px;
    font-size: 11px; font-weight: 700; letter-spacing: 0.04em;
    background: var(--accent-surface); border: 1px solid var(--accent-border); color: var(--accent-primary);
  }

  /* ── Spin / animations ── */
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
  @keyframes pulseRing {
    0%   { box-shadow: 0 0 0 0 rgba(255,107,53,0.4); }
    70%  { box-shadow: 0 0 0 16px rgba(255,107,53,0); }
    100% { box-shadow: 0 0 0 0 rgba(255,107,53,0); }
  }
  @keyframes typingDot {
    0%,60%,100% { transform: translateY(0); opacity: 0.4; }
    30%          { transform: translateY(-4px); opacity: 1; }
  }

  /* ── Responsive ── */
  @media(max-width:1100px) { .workbench-header-meta { gap: 8px !important; } }
  @media(max-width:900px) {
    .scan-intro-grid      { grid-template-columns: 1fr !important; }
    .scan-stats-grid,
    .history-stats-grid   { grid-template-columns: repeat(2, minmax(0,1fr)) !important; }
  }
  @media(max-width:640px) {
    aside                 { display: none !important; }
    .workbench-mobile-nav { display: block !important; }
    .workbench-header-meta{ display: none !important; }
    .workbench-main       { padding: 16px !important; }
    .scan-stats-grid,
    .history-stats-grid,
    .scan-status-grid,
    .scan-quick-grid      { grid-template-columns: 1fr !important; }
    .chat-shell           { height: calc(100vh - 56px - 126px) !important; }
    .report-top           { grid-template-columns: 1fr !important; }
  }
`;

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface Entity { type: string; value: string; context?: string; }
interface FlagObject {
  severity?: "low" | "medium" | "high" | "critical";
  quote?: string; explanation?: string; action?: string;
}
interface ScanResult {
  id: string; filename: string;
  status: "processing" | "done" | "error" | "failed" | "failure";
  risk_score?: number; risk_label?: string; summary?: string;
  entities?: Entity[]; flags?: (string | FlagObject)[]; error_message?: string;
  clean_text?: string; created_at: string;
}
interface ChatMessage { role: "user" | "assistant"; content: string; }
interface UserProfile { id: string; email: string; name: string; avatar?: string; plan: "free" | "pro" | "pro_max"; }
interface ChatApiResponse {
  reply?: string; answer?: string;
  data?: { reply?: string; answer?: string; };
}

function getUserPlan(user: { user_metadata?: Record<string, unknown> | null; app_metadata?: Record<string, unknown> | null } | null | undefined): "free" | "pro" | "pro_max" {
  if (!user) return "free";
  const candidates = [
    user.user_metadata?.plan, user.user_metadata?.subscription_tier, user.user_metadata?.tier,
    user.app_metadata?.plan, user.app_metadata?.subscription_tier, user.app_metadata?.tier,
  ];
  const p = candidates.find(v => typeof v === "string")?.toString().toLowerCase();
  if (p?.includes("pro_max") || p?.includes("promax")) return "pro_max";
  if (p?.includes("pro")) return "pro";
  return "free";
}

const FREE_SCAN_LIMIT = 5;
const FREE_CHAT_LIMIT = 6;
const PROCESSING_STAGES = ["Uploading", "OCR extraction", "Entity recognition", "Risk assessment", "Generating report"];

async function responseErrorMessage(response: Response, fallback: string): Promise<string> {
  switch (response.status) {
    case 400: return "The request could not be completed.";
    case 401: return "Your session has expired. Please sign in again.";
    case 403: return "You are not allowed to perform this action.";
    case 404: return "The requested resource was not found.";
    case 408: return "The request timed out. Please try again.";
    case 413: return "The uploaded file is too large.";
    case 429: return "Too many requests. Please wait and try again.";
    default:  return fallback;
  }
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function riskColor(s: number) { return s <= 25 ? "#10B981" : s <= 50 ? "#F59E0B" : s <= 75 ? "#EF4444" : "#DC2626"; }
function riskBg(s: number)    { return s <= 25 ? "rgba(16,185,129,0.08)" : s <= 50 ? "rgba(245,158,11,0.08)" : s <= 75 ? "rgba(239,68,68,0.08)" : "rgba(220,38,38,0.10)"; }
function riskLabel(s: number) { return s <= 15 ? "Benign" : s <= 25 ? "Low" : s <= 50 ? "Medium" : s <= 75 ? "High" : "Critical"; }

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function useCountUp(target: number, duration = 1500): number {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target === 0) { setCount(0); return; }
    const step = target / (duration / 16);
    let current = 0;
    const timer = setInterval(() => {
      current += step;
      if (current >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(current));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

/* ─── Avatar ─────────────────────────────────────────────────────────────── */
function Avatar({ profile, size = 32 }: { profile: UserProfile | null; size?: number }) {
  if (profile?.avatar) {
    return <Image src={profile.avatar} alt="profile" width={size} height={size} unoptimized style={{ borderRadius: "50%", objectFit: "cover" }} />;
  }
  const initials = profile?.name
    ? profile.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : profile?.email?.[0]?.toUpperCase() || "U";
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.38, fontWeight: 700, color: "white", flexShrink: 0 }}>
      {initials}
    </div>
  );
}

/* ─── Risk Gauge ─────────────────────────────────────────────────────────── */
function RiskGauge({ score }: { score: number }) {
  const r = 54, sw = 9, circ = 2 * Math.PI * r;
  const pct = Math.min(Math.max(score, 0), 100) / 100;
  const color = riskColor(score);
  return (
    <div style={{ position: "relative", width: 136, height: 136 }}>
      <svg width="136" height="136" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="68" cy="68" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={sw} />
        <circle cx="68" cy="68" r={r} fill="none" stroke={color} strokeWidth={sw}
          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.34,1.56,0.64,1)", filter: `drop-shadow(0 0 8px ${color}60)` }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2 }}>
        <span style={{ fontSize: 34, fontWeight: 800, color, lineHeight: 1, letterSpacing: "-0.03em" }}>{score}</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{riskLabel(score)}</span>
      </div>
    </div>
  );
}

/* ─── Entity Group ───────────────────────────────────────────────────────── */
function EntityGroup({ entities }: { entities: Entity[] }) {
  const grouped: Record<string, Entity[]> = {};
  entities.forEach(e => { (grouped[e.type] ||= []).push(e); });
  const colors: Record<string, string> = {
    PERSON: "#FF6B35", ORGANIZATION: "#3B82F6", ORG: "#3B82F6",
    DATE: "#059669", MONEY: "#D97706", AMOUNT: "#D97706",
    LOCATION: "#DB2777", EMAIL: "#8B5CF6", PHONE: "#0EA5E9",
    TECHNOLOGY: "#06B6D4", CONTRACT_TERM: "#F59E0B",
    JURISDICTION: "#6366F1", LAW: "#DC2626", MISC: "#6B7280",
  };
  const typeIcons: Record<string, string> = {
    PERSON: "👤", ORGANIZATION: "🏢", ORG: "🏢", DATE: "📅",
    MONEY: "💰", AMOUNT: "💰", LOCATION: "📍", EMAIL: "✉️",
    PHONE: "📞", TECHNOLOGY: "⚙️", CONTRACT_TERM: "📄",
    JURISDICTION: "⚖️", LAW: "⚖️", MISC: "🔹",
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {Object.entries(grouped).map(([type, items]) => {
        const col = colors[type] || "#6B7280";
        return (
          <div key={type}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 14 }}>{typeIcons[type] || "🔹"}</span>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: col }}>{type.replace("_", " ")}</span>
              <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 2 }}>({items.length})</span>
              <div style={{ flex: 1, height: 1, background: `${col}20`, marginLeft: 4 }} />
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {items.map((e, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", padding: "5px 12px", borderRadius: 10, background: `${col}10`, border: `1px solid ${col}28` }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: col }}>{e.value}</span>
                  {e.context && <span style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.context}</span>}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Markdown renderer ──────────────────────────────────────────────────── */
function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^#{1,3}\s/.test(line)) {
      elements.push(<div key={i} style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4, marginTop: i > 0 ? 10 : 0 }}>{inlineFormat(line.replace(/^#{1,3}\s/, ""))}</div>);
    } else if (/^[-*•]\s/.test(line)) {
      elements.push(
        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 3 }}>
          <span style={{ color: "var(--accent-primary)", marginTop: 2, flexShrink: 0, fontSize: 10 }}>●</span>
          <span style={{ fontSize: 13, lineHeight: 1.65, color: "var(--text-secondary)" }}>{inlineFormat(line.replace(/^[-*•]\s/, ""))}</span>
        </div>
      );
    } else if (/^\d+\.\s/.test(line)) {
      const num = line.match(/^(\d+)\./)?.[1] || "";
      elements.push(
        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 3 }}>
          <span style={{ color: "var(--accent-primary)", fontWeight: 700, fontSize: 11, flexShrink: 0, minWidth: 18 }}>{num}.</span>
          <span style={{ fontSize: 13, lineHeight: 1.65, color: "var(--text-secondary)" }}>{inlineFormat(line.replace(/^\d+\.\s/, ""))}</span>
        </div>
      );
    } else if (line.trim() === "") {
      if (elements.length > 0) elements.push(<div key={i} style={{ height: 6 }} />);
    } else {
      elements.push(<p key={i} style={{ fontSize: 13, lineHeight: 1.72, color: "var(--text-secondary)", margin: 0 }}>{inlineFormat(line)}</p>);
    }
    i++;
  }
  return <>{elements}</>;
}

function inlineFormat(text: string): React.ReactNode {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={i} style={{ color: "var(--text-primary)", fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("`")  && part.endsWith("`"))  return <code key={i} style={{ fontSize: 11, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, padding: "1px 5px", color: "var(--accent-primary)", fontFamily: "monospace" }}>{part.slice(1, -1)}</code>;
    if (part.startsWith("*")  && part.endsWith("*"))  return <em key={i} style={{ color: "var(--text-muted)", fontStyle: "italic" }}>{part.slice(1, -1)}</em>;
    return part;
  });
}

/* ─── Upgrade Modal ──────────────────────────────────────────────────────── */
function UpgradeModal({ onClose, limitType }: { onClose: () => void; limitType: "scan" | "chat" }) {
  const router = useRouter();
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--accent-border)", borderRadius: 20, padding: 40, maxWidth: 480, width: "100%", boxShadow: "var(--shadow-lg)", position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={18} /></button>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, margin: "0 auto 16px", background: "linear-gradient(135deg, #F59E0B, #D97706)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 24px rgba(245,158,11,0.3)" }}>
            <Crown size={24} color="white" />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", marginBottom: 8, letterSpacing: "-0.02em" }}>
            {limitType === "scan" ? "Scan limit reached" : "Chat limit reached"}
          </h2>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7 }}>
            {limitType === "scan"
              ? `You've used all ${FREE_SCAN_LIMIT} free scans. Go Pro for unlimited access.`
              : `You've used all ${FREE_CHAT_LIMIT} free chats. Go Pro for unlimited access.`}
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
          {["Unlimited document scans", "AI chat on every document", "Advanced entity & financial extraction", "PDF & JSON report downloads", "Priority AI pipeline (3x faster)", "Fraud & anomaly detection"].map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--text-secondary)" }}>
              <CheckCircle size={14} color="var(--pro)" style={{ flexShrink: 0 }} />{f}
            </div>
          ))}
        </div>
        <button onClick={() => router.push("/pricing")} className="btn-primary" style={{ width: "100%", padding: "13px", fontSize: 14, borderRadius: 12, background: "linear-gradient(135deg, #F59E0B, #D97706)", boxShadow: "0 4px 16px rgba(245,158,11,0.3)" }}>
          <Crown size={15} /> View Free vs Pro
        </button>
        <p style={{ marginTop: 10, fontSize: 11, lineHeight: 1.6, color: "var(--text-muted)", textAlign: "center" }}>
          Billing setup is not connected to the backend yet — Pro activation starts from the pricing page.
        </p>
        <button onClick={onClose} style={{ width: "100%", marginTop: 8, padding: "10px", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 13 }}>Maybe later</button>
      </div>
    </div>
  );
}

/* ─── Scan Report ─────────────────────────────────────────────────────────── */
function ScanReport({ result, onDownloadText, downloading, onReset }: {
  result: ScanResult; onDownloadText: () => void; downloading: boolean; onReset: () => void;
}) {
  const [showExtracted, setShowExtracted] = useState(false);
  const score = result.risk_score ?? 0;
  const color = riskColor(score);
  const severityColors: Record<string, string> = { low: "#10B981", medium: "#F59E0B", high: "#EF4444", critical: "#DC2626" };

  function downloadPdf() {
    const esc = (v: string) => v.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
    const ents = result.entities || [];
    const entityRows = ents.map(e => `<tr><td style="padding:7px 12px;border-bottom:1px solid #2a2a2e;color:#cbd5e1;font-size:12px">${esc(e.type)}</td><td style="padding:7px 12px;border-bottom:1px solid #2a2a2e;color:#f8fafc;font-size:12px;font-weight:700">${esc(e.value)}</td><td style="padding:7px 12px;border-bottom:1px solid #2a2a2e;color:#94a3b8;font-size:11px">${esc(e.context||"")}</td></tr>`).join("");
    const flagRows = (result.flags||[]).map((f,idx) => {
      const fo = typeof f==="object" ? f as FlagObject : null;
      const sc = fo?.severity ? severityColors[fo.severity]||"#EF4444" : "#EF4444";
      return fo
        ? `<div style="margin-bottom:14px;padding:14px 18px;border-radius:10px;background:rgba(239,68,68,0.05);border-left:3px solid ${sc}">${fo.severity?`<span style="font-size:10px;font-weight:700;text-transform:uppercase;color:${sc}">${esc(fo.severity)}</span>`:""} ${fo.quote?`<p style="font-size:12px;color:#a1a1aa;font-style:italic">"${esc(fo.quote)}"</p>`:""} ${fo.explanation?`<p style="font-size:13px;color:#d4d4d8">${esc(fo.explanation)}</p>`:""} ${fo.action?`<p style="font-size:12px;color:#9ca3af"><strong>Action:</strong> ${esc(fo.action)}</p>`:""}</div>`
        : `<div style="margin-bottom:8px;padding:10px 14px;border-radius:8px;background:rgba(239,68,68,0.05);border-left:3px solid #EF4444"><p style="font-size:13px;color:#d4d4d8">${esc(String(f))}</p></div>`;
    }).join("");
    const html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Vaurex Report — ${result.filename}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:sans-serif;background:#05070d;color:#f8fafc;padding:44px 52px;line-height:1.65}h2{font-size:15px;font-weight:800;margin-bottom:12px;color:#e2e8f0}.card{background:#0f172a;border:1px solid #334155;border-radius:14px;padding:22px 24px;margin-bottom:20px}.score{font-size:56px;font-weight:800;line-height:1}table{width:100%;border-collapse:collapse}th{text-align:left;padding:8px 12px;font-size:11px;font-weight:700;text-transform:uppercase;color:#94a3b8;border-bottom:1px solid #334155}.summary{font-size:14px;color:#cbd5e1;line-height:1.85;white-space:pre-wrap}.footer{margin-top:40px;padding-top:20px;border-top:1px solid #334155;display:flex;justify-content:space-between;color:#94a3b8}</style></head><body>
<div style="display:flex;align-items:center;gap:12px;margin-bottom:32px"><div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#FF6B35,#3B82F6);display:flex;align-items:center;justify-content:center;font-size:18px">✦</div><div><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#94a3b8;margin-bottom:2px">Vaurex AI Intelligence Report</div><h1 style="font-size:22px;font-weight:800">${esc(result.filename)}</h1></div><div style="margin-left:auto;text-align:right"><div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#94a3b8">Analyzed</div><div style="font-size:13px;color:#cbd5e1">${formatDate(result.created_at)}</div></div></div>
<div style="display:grid;grid-template-columns:180px 1fr;gap:16px;margin-bottom:20px"><div class="card" style="text-align:center;background:${riskBg(score)};border-color:${color}30"><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#94a3b8;margin-bottom:12px">Risk Score</div><div class="score" style="color:${color}">${score}</div><div style="margin-top:10px;font-size:12px;font-weight:700;text-transform:uppercase;color:${color}">${esc(result.risk_label||riskLabel(score))} Risk</div></div><div class="card"><h2>Executive Summary</h2><p class="summary">${esc(result.summary||"No summary available.")}</p></div></div>
${ents.length>0?`<div class="card"><h2>Extracted Entities (${ents.length})</h2><table><thead><tr><th>Type</th><th>Value</th><th>Context</th></tr></thead><tbody>${entityRows}</tbody></table></div>`:""}
${result.flags?.length?`<div class="card"><h2>Risk Flags (${result.flags.length})</h2>${flagRows}</div>`:""}
<div class="footer"><div style="font-size:12px">Generated by Vaurex AI · ${new Date().toLocaleDateString()}</div><div style="font-size:11px">Confidential</div></div></body></html>`;
    const w = window.open("","_blank","width=900,height=700");
    if (!w) return;
    w.document.write(html); w.document.close();
    w.onload = () => { w.focus(); w.print(); };
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header banner */}
      <div style={{ background: `linear-gradient(135deg, ${riskBg(score)}, var(--bg-secondary))`, border: `1px solid ${color}30`, borderRadius: 18, padding: "18px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: riskBg(score), border: `1.5px solid ${color}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CheckCircle size={20} color={color} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "var(--cyan)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Analysis Complete</span>
              <span style={{ fontSize: 10, fontWeight: 700, color, background: `${color}18`, border: `1px solid ${color}30`, padding: "1px 8px", borderRadius: 99, textTransform: "uppercase" }}>{result.risk_label || riskLabel(score)} Risk</span>
            </div>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>{result.filename}</h2>
            <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Analyzed {formatDate(result.created_at)}</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={downloadPdf} className="btn-ghost" style={{ padding: "7px 13px", fontSize: 12, borderRadius: 9 }}><Download size={13} /> Download PDF</button>
          <button onClick={onDownloadText} disabled={downloading} className="btn-ghost" style={{ padding: "7px 13px", fontSize: 12, borderRadius: 9 }}><FileText size={13} /> Raw Text</button>
          <button onClick={onReset} className="btn-primary" style={{ padding: "7px 14px", fontSize: 12, borderRadius: 9 }}><Upload size={13} /> New Scan</button>
        </div>
      </div>

      {/* Risk + Summary */}
      <div className="report-top" style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 16 }}>
        <div style={{ background: riskBg(score), border: `1px solid ${color}25`, borderRadius: 16, padding: "24px 18px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <RiskGauge score={score} />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color }}>{result.risk_label || riskLabel(score)} Risk</div>
            <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 3 }}>out of 100</div>
          </div>
          <div style={{ width: "100%", height: 4, borderRadius: 99, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${score}%`, background: `linear-gradient(90deg, ${color}80, ${color})`, borderRadius: 99, transition: "width 1.2s ease" }} />
          </div>
        </div>

        <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-primary)", borderRadius: 16, padding: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--blue-dim)", border: "1px solid var(--blue-border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <BarChart3 size={14} color="var(--blue)" />
            </div>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>Executive Summary</h3>
          </div>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.85, whiteSpace: "pre-wrap" }}>{result.summary || "No summary available."}</p>
        </div>
      </div>

      {/* Entities */}
      {result.entities && result.entities.length > 0 && (
        <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-primary)", borderRadius: 16, padding: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--blue-dim)", border: "1px solid var(--blue-border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Users size={14} color="var(--blue)" />
            </div>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>Extracted Entities</h3>
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--blue)", background: "var(--blue-dim)", border: "1px solid var(--blue-border)", padding: "1px 8px", borderRadius: 99 }}>{result.entities.length}</span>
          </div>
          <EntityGroup entities={result.entities} />
        </div>
      )}

      {/* Flags */}
      {result.flags && result.flags.length > 0 && (
        <div style={{ background: "rgba(239,68,68,0.03)", border: "1px solid rgba(239,68,68,0.14)", borderRadius: 16, padding: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(239,68,68,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Shield size={14} color="#EF4444" />
            </div>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>Risk Flags</h3>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#EF4444", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", padding: "1px 8px", borderRadius: 99 }}>{result.flags.length}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {result.flags.map((f, i) => {
              if (typeof f === "object" && f !== null) {
                const fo = f as FlagObject;
                const sc = fo.severity ? severityColors[fo.severity] || "#EF4444" : "#EF4444";
                return (
                  <div key={i} style={{ borderRadius: 12, border: `1px solid ${sc}20`, background: `${sc}05`, overflow: "hidden" }}>
                    <div style={{ padding: "9px 14px", borderBottom: `1px solid ${sc}15`, display: "flex", alignItems: "center", gap: 8 }}>
                      <AlertTriangle size={12} color={sc} />
                      {fo.severity && <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: sc, background: `${sc}18`, padding: "2px 8px", borderRadius: 99 }}>{fo.severity}</span>}
                    </div>
                    <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 7 }}>
                      {fo.quote && <blockquote style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic", borderLeft: `2px solid ${sc}60`, paddingLeft: 10, marginLeft: 0 }}>&ldquo;{fo.quote}&rdquo;</blockquote>}
                      {fo.explanation && <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>{fo.explanation}</p>}
                      {fo.action && (
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "7px 10px", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                          <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", flexShrink: 0, marginTop: 2 }}>Action</span>
                          <span style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>{fo.action}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }
              return (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.1)" }}>
                  <AlertTriangle size={12} color="#EF4444" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>{String(f)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Extracted text */}
      {result.clean_text && result.clean_text.trim().length > 10 && (
        <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-primary)", borderRadius: 16, overflow: "hidden" }}>
          <button onClick={() => setShowExtracted(v => !v)} style={{ width: "100%", padding: "14px 22px", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, borderBottom: showExtracted ? "1px solid var(--border-primary)" : "none" }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(99,102,241,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FileSearch size={14} color="#6366F1" />
            </div>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", flex: 1, textAlign: "left" }}>Extracted Contents</h3>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{result.clean_text.trim().split(/\s+/).length.toLocaleString()} words</span>
            <ChevronRight size={14} color="var(--text-muted)" style={{ transform: showExtracted ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
          </button>
          {showExtracted && (
            <div style={{ padding: 22 }}>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 10 }}>Raw OCR / AI-extracted text</p>
              <pre style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.8, whiteSpace: "pre-wrap", wordBreak: "break-word", background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-primary)", borderRadius: 10, padding: "14px 16px", maxHeight: 480, overflowY: "auto", fontFamily: "'SF Mono','Fira Code',monospace" }}>
                {result.clean_text.trim()}
              </pre>
            </div>
          )}
        </div>
      )}

      <FeedbackWidget scanId={result.id} />
    </div>
  );
}

/* ─── Feedback Widget ─────────────────────────────────────────────────────── */
function FeedbackWidget({ scanId }: { scanId: string }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  async function submit() {
    if (!rating) return;
    setSending(true);
    try {
      await apiJson("/api/v1/support", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subject: `Analysis Feedback — Scan ${scanId}`, message: `Rating: ${rating}/5\nScan: ${scanId}\n\n${text || "No comments."}`, name: "User Feedback" }) }, { auth: true, fallbackMessage: "Failed to submit feedback." });
      setSent(true);
    } catch { /* silent */ } finally { setSending(false); }
  }

  if (!open) return (
    <button onClick={() => setOpen(true)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", background: "var(--bg-secondary)", border: "1px solid var(--border-primary)", borderRadius: 10, cursor: "pointer", fontSize: 13, color: "var(--text-muted)", width: "fit-content", transition: "border-color 0.15s" }} onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--border-hover)")} onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border-primary)")}>
      <Star size={14} /> Rate this analysis
    </button>
  );

  return (
    <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-primary)", borderRadius: 14, padding: 22 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>Rate this analysis</h3>
        <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={14} /></button>
      </div>
      {sent ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--cyan)", fontSize: 14 }}>
          <CheckCircle size={15} /> Thanks for your feedback!
        </div>
      ) : (
        <>
          <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
            {[1,2,3,4,5].map(s => (
              <button key={s} onClick={() => setRating(s)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
                <Star size={22} color={s <= rating ? "#F59E0B" : "var(--border-hover)"} fill={s <= rating ? "#F59E0B" : "transparent"} />
              </button>
            ))}
          </div>
          <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Optional: tell us what was accurate or off..." rows={3} style={{ width: "100%", background: "var(--bg-inset)", border: "1px solid var(--border-primary)", borderRadius: 9, padding: "9px 12px", color: "var(--text-primary)", fontSize: 13, resize: "vertical", fontFamily: "inherit", outline: "none", marginBottom: 10 }} />
          <button onClick={submit} disabled={!rating || sending} className="btn-primary" style={{ padding: "8px 18px", fontSize: 13, borderRadius: 9, opacity: !rating ? 0.5 : 1 }}>
            <Send size={13} /> {sending ? "Sending..." : "Send feedback"}
          </button>
        </>
      )}
    </div>
  );
}

/* ─── Main Dashboard ─────────────────────────────────────────────────────── */
export default function WorkbenchClient() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const fileRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDrag] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanId, setScanId] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [history, setHistory] = useState<ScanResult[]>([]);
  const [activeView, setActiveView] = useState<"scan" | "history" | "chat">("scan");
  const [error, setError] = useState("");
  const [scanCount, setScanCount] = useState(0);
  const [dailyScansUsed, setDailyScansUsed] = useState(0);
  const [dailyChatUsed, setDailyChatUsed] = useState(0);
  const [showUpgrade, setShowUpgrade] = useState<{type:"scan"|"chat"}|false>(false);
  const [downloading, setDownloading] = useState(false);
  const [processingStage, setProcessingStage] = useState(0);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState<{ total_documents: number; average_risk: number; high_risk_share: number } | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [liveTime, setLiveTime] = useState(() => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([{ role: "assistant", content: "Hi — I can help you analyze risks, entities, and findings from your documents. Ask anything to start." }]);
  const [chatInput, setChatInput] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval>>();
  const pollStartRef = useRef<number | null>(null);

  const redirectToLogin = useCallback(() => {
    const currentPath = `${window.location.pathname}${window.location.search}`;
    const safePath = currentPath.startsWith("/") && !currentPath.startsWith("//") ? currentPath : "/workbench";
    window.location.replace(`/login?next=${encodeURIComponent(safePath)}`);
  }, []);

  const applySession = useCallback((session: import("@supabase/supabase-js").Session | null) => {
    if (!session) return;
    setHasSession(true);
    const user = session.user;
    setProfile({ id: user.id, email: user.email || "", name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User", avatar: user.user_metadata?.avatar_url || undefined, plan: getUserPlan(user) });
    setAuthLoading(false);
  }, []);

  /* Auth */
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!active) return;
        if (session) { applySession(session); }
        else {
          const { data: { session: refreshed } } = await supabase.auth.refreshSession();
          if (!active) return;
          if (refreshed) applySession(refreshed);
          else setTimeout(() => redirectToLogin(), 1000);
        }
      } catch { if (active) setTimeout(() => redirectToLogin(), 1000); }
    })();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string, session: import("@supabase/supabase-js").Session | null) => {
      if (event === "SIGNED_OUT") { setHasSession(false); redirectToLogin(); return; }
      if (session) applySession(session);
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, [applySession, redirectToLogin, supabase]);

  /* History */
  const fetchHistory = useCallback(async () => {
    if (!hasSession) return;
    try {
      const json = await apiJson<ScanResult[] | { data?: ScanResult[] }>("/api/v1/scans", {}, { auth: true, fallbackMessage: "Unable to load scan history." });
      const scans: ScanResult[] = Array.isArray(json) ? json : (json?.data ?? []);
      setHistory(scans);
      setScanCount(scans.filter(s => s.status === "done").length);
    } catch { setHistory([]); setScanCount(0); }
  }, [hasSession]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  /* Quota */
  useEffect(() => {
    if (!hasSession) return;
    (async () => {
      try {
        const quota = await apiJson<{ scans_used: number; chat_used: number }>("/api/v1/quota", {}, { auth: true, fallbackMessage: "Unable to load quota." });
        if (typeof quota.scans_used === "number") setDailyScansUsed(quota.scans_used);
        if (typeof quota.chat_used  === "number") setDailyChatUsed(quota.chat_used);
      } catch {}
    })();
  }, [hasSession]);

  /* Stats */
  const fetchStats = useCallback(async () => {
    if (!hasSession) return;
    setStatsLoading(true);
    try {
      const res = await apiJson<{ success?: boolean; data?: { total_documents: number; average_risk: number; high_risk_share: number } }>("/api/v1/scans/stats", {}, { auth: true, fallbackMessage: "Unable to load stats." });
      const d = res?.data;
      if (d && typeof d.total_documents === "number") setStats({ total_documents: d.total_documents, average_risk: d.average_risk ?? 0, high_risk_share: d.high_risk_share ?? 0 });
      else setStats(null);
    } catch { setStats(null); } finally { setStatsLoading(false); }
  }, [hasSession]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  /* Notif outside click */
  useEffect(() => {
    if (!notifOpen) return;
    const handle = (e: MouseEvent) => { if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false); };
    document.addEventListener("click", handle);
    return () => document.removeEventListener("click", handle);
  }, [notifOpen]);

  /* Live clock */
  useEffect(() => {
    const t = setInterval(() => setLiveTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })), 1000);
    return () => clearInterval(t);
  }, []);

  /* Backend health */
  useEffect(() => {
    let active = true;
    const check = async () => {
      try { const r = await fetch("/api/v1/health", { method: "GET", cache: "no-store" }); if (active) setBackendOnline(r.ok); }
      catch { if (active) setBackendOnline(false); }
    };
    check();
    const t = setInterval(check, 15000);
    return () => { active = false; clearInterval(t); };
  }, []);

  /* Chat scroll */
  useEffect(() => { if (chatScrollRef.current) chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight; }, [chatMessages, chatSending]);

  /* Processing animation */
  useEffect(() => {
    if (!scanning) { setProcessingStage(0); return; }
    const iv = setInterval(() => setProcessingStage(p => Math.min(p + 1, PROCESSING_STAGES.length - 1)), 3500);
    return () => clearInterval(iv);
  }, [scanning]);

  /* Poll */
  useEffect(() => {
    if (!scanId || !hasSession) return;
    pollStartRef.current = Date.now();
    pollRef.current = setInterval(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { clearInterval(pollRef.current); setScanning(false); setError("Session expired."); return; }
        const res = await apiFetch(`/api/v1/scans/${scanId}/poll`, {}, { auth: true, timeoutMs: 20000 });
        if (!res.ok) { if (res.status === 404) { clearInterval(pollRef.current); setScanning(false); setError("Scan not found."); } return; }
        const json = await res.json();
        const data: ScanResult = json?.data ?? json;
        const status = (data.status || "").toLowerCase();
        if (["done", "error", "failed", "failure"].includes(status)) {
          clearInterval(pollRef.current); setScanning(false); fetchHistory(); fetchStats();
          setResult({ ...data, status: status === "failure" ? "failed" : status as ScanResult["status"] });
        }
        if (Date.now() - (pollStartRef.current ?? Date.now()) > 180000) { clearInterval(pollRef.current); setScanning(false); setError("Analysis timed out."); }
      } catch {}
    }, 2000);
    return () => clearInterval(pollRef.current);
  }, [scanId, fetchHistory, fetchStats, router, supabase, hasSession]);

  /* Upload */
  async function handleUpload() {
    if (!file) return;
    if (profile?.plan === "free" && dailyScansUsed >= FREE_SCAN_LIMIT) { setShowUpgrade({type:"scan"}); return; }
    setScanning(true); setError(""); setResult(null); setScanId(null);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setError("Session expired."); setScanning(false); return; }
    const form = new FormData(); form.append("file", file);
    try {
      const res = await apiFetch("/api/v1/upload", { method: "POST", body: form }, { auth: true, timeoutMs: 60000 });
      if (!res.ok) throw new Error(await responseErrorMessage(res, `Upload failed (${res.status})`));
      const json = await res.json();
      const id = json?.data?.scan_id ?? json?.scan_id;
      if (!id) throw new Error("No scan ID returned.");
      setScanId(id);
      if (profile?.plan === "free") setDailyScansUsed(p => p + 1);
    } catch (err: unknown) { setError(safeUiError(err, "Upload failed")); setScanning(false); }
  }

  /* Download */
  async function downloadReport(format: "json" | "text") {
    if (!result) return; setDownloading(true);
    try {
      const url = format === "json" ? `/api/v1/scans/${result.id}/download/report` : `/api/v1/scans/${result.id}/download/text`;
      const res = await apiFetch(url, {}, { auth: true, timeoutMs: 30000 });
      if (!res.ok) throw new Error(await responseErrorMessage(res, "Download failed"));
      const fname = result.filename.replace(/\.[^.]+$/, "");
      if (format === "json") {
        const data = await res.json(); const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${fname}-report.json`; a.click();
      } else {
        const text = await res.text(); const blob = new Blob([text], { type: "text/plain" });
        const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${fname}-text.txt`; a.click();
      }
    } catch (e: unknown) { setError(safeUiError(e, "Download failed.")); } finally { setDownloading(false); }
  }

  /* Delete */
  async function deleteScan(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      const res = await apiFetch(`/api/v1/scans/${id}`, { method: "DELETE" }, { auth: true, timeoutMs: 20000 });
      if (!res.ok) throw new Error(await responseErrorMessage(res, "Delete failed."));
      setHistory(prev => prev.filter(s => s.id !== id));
      if (result?.id === id) setResult(null);
    } catch (e: unknown) { setError(safeUiError(e, "Delete failed.")); }
  }

  function onDrop(e: React.DragEvent) { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) setFile(f); }

  async function signOut() { setHasSession(false); await supabase.auth.signOut(); router.push("/"); }

  async function handleSendChat() {
    const message = chatInput.trim();
    if (!message || chatSending) return;
    if (profile?.plan === "free" && dailyChatUsed >= FREE_CHAT_LIMIT) { setShowUpgrade({type:"chat"}); return; }
    const nextMessages: ChatMessage[] = [...chatMessages, { role: "user", content: message }];
    setChatMessages(nextMessages); setChatInput(""); setChatSending(true);
    try {
      const response = await apiJson<ChatApiResponse & { conversation_history?: ChatMessage[] }>(
        "/api/v1/chat",
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message, conversation_history: nextMessages }) },
        { auth: true, fallbackMessage: "Unable to send message." }
      );
      const reply = response.reply || response.answer || response.data?.reply || response.data?.answer || "I could not generate a response. Please try again.";
      setChatMessages(prev => [...prev, { role: "assistant", content: reply }]);
      if (profile?.plan === "free") setDailyChatUsed(p => p + 1);
    } catch (chatError: unknown) {
      setChatMessages(prev => [...prev, { role: "assistant", content: safeUiError(chatError, "The assistant is currently unavailable. Please try again.") }]);
    } finally { setChatSending(false); }
  }

  const scansLeft = Math.max(0, FREE_SCAN_LIMIT - dailyScansUsed);
  const isPro = profile?.plan === "pro" || profile?.plan === "pro_max";
  const latestCompletedScan = history.find(s => s.status === "done");
  const countTotal    = useCountUp(stats?.total_documents ?? 0, 1200);
  const countAvgRisk  = useCountUp(Math.round(stats?.average_risk ?? 0), 1200);
  const countHighRisk = useCountUp(Math.round(stats?.high_risk_share ?? 0), 1200);
  const recentCompletions = history.filter(s => s.status === "done").slice(0, 5);

  if (authLoading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "var(--bg-base)" }}>
      <style>{STYLES}</style>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 34, height: 34, border: "3px solid rgba(255,255,255,0.07)", borderTop: "3px solid var(--accent-primary)", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
        <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Loading…</p>
      </div>
    </div>
  );

  const navItems = [
    { id: "scan"    as const, icon: Upload,       label: "New Scan" },
    { id: "history" as const, icon: History,      label: "History",  badge: history.length || undefined },
    { id: "chat"    as const, icon: MessageSquare, label: "AI Chat" },
  ];
  const accountItems = [
    { icon: Settings,   label: "Settings", action: () => router.push("/settings") },
    { icon: HelpCircle, label: "Support",  action: () => router.push("/support")  },
  ];

  return (
    <>
      <style>{STYLES}</style>
      <div style={{ display: "flex", height: "100vh", background: "var(--bg-primary)", overflow: "hidden" }}>
        {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} limitType={showUpgrade.type} />}

        {/* ── Sidebar ── */}
        <aside style={{ width: sidebarCollapsed ? 64 : 220, flexShrink: 0, transition: "width 0.2s ease", background: "var(--bg-secondary)", borderRight: "1px solid var(--border-primary)", display: "flex", flexDirection: "column", zIndex: 30 }}>
          {/* Logo */}
          <div style={{ padding: "16px 14px", borderBottom: "1px solid var(--border-primary)", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Sparkles size={14} color="white" fill="white" />
            </div>
            {!sidebarCollapsed && <span className="font-display" style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>Vaurex</span>}
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: "10px 8px", display: "flex", flexDirection: "column", gap: 3 }}>
            {navItems.map(item => (
              <button key={item.id} onClick={() => setActiveView(item.id)} style={{
                display: "flex", alignItems: "center", gap: 10, padding: sidebarCollapsed ? "10px" : "9px 12px",
                borderRadius: 9, border: "none", cursor: "pointer", transition: "all 0.15s",
                justifyContent: sidebarCollapsed ? "center" : "flex-start",
                background: activeView === item.id
                  ? "var(--blue-dim)"
                  : "transparent",
                color: activeView === item.id
                  ? "var(--blue)"
                  : "var(--text-muted)",
                boxShadow: activeView === item.id
                  ? "inset 0 0 0 1px var(--blue-border)"
                  : "none",
              }}>
                <item.icon size={16} />
                {!sidebarCollapsed && <span style={{ fontSize: 13, fontWeight: activeView === item.id ? 700 : 500, flex: 1, textAlign: "left" }}>{item.label}</span>}
                {!sidebarCollapsed && item.badge ? <span style={{ fontSize: 10, fontWeight: 700, background: "var(--blue-dim)", color: "var(--blue)", border: "1px solid var(--blue-border)", borderRadius: 99, padding: "1px 6px" }}>{item.badge}</span> : null}
              </button>
            ))}

            <div style={{ marginTop: 8, marginBottom: 3, padding: "0 4px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", opacity: sidebarCollapsed ? 0 : 1, transition: "opacity 0.2s" }}>Account</div>

            {accountItems.map((item, idx) => (
              <button key={idx} onClick={item.action} style={{ display: "flex", alignItems: "center", gap: 10, padding: sidebarCollapsed ? "10px" : "9px 12px", borderRadius: 9, border: "none", cursor: "pointer", background: "transparent", color: "var(--text-muted)", transition: "background 0.15s", justifyContent: sidebarCollapsed ? "center" : "flex-start" }} onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                <item.icon size={16} />
                {!sidebarCollapsed && <span style={{ fontSize: 13, fontWeight: 500 }}>{item.label}</span>}
              </button>
            ))}
          </nav>

          {/* Bottom */}
          <div style={{ padding: "10px 8px", borderTop: "1px solid var(--border-primary)", display: "flex", flexDirection: "column", gap: 7 }}>
            {!sidebarCollapsed && !isPro && (
              <button onClick={() => setShowUpgrade({type:"scan"})} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 9, background: "linear-gradient(135deg, rgba(245,158,11,0.12), rgba(217,119,6,0.08))", border: "1px solid rgba(245,158,11,0.28)", cursor: "pointer", width: "100%" }}>
                <Crown size={13} color="var(--pro)" />
                <div style={{ flex: 1, textAlign: "left" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#F59E0B" }}>Upgrade to Pro</div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{scansLeft} scan{scansLeft !== 1 ? "s" : ""} left</div>
                </div>
              </button>
            )}
            {!sidebarCollapsed && isPro && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 9, background: "linear-gradient(135deg, rgba(245,158,11,0.1), rgba(217,119,6,0.06))", border: "1px solid rgba(245,158,11,0.22)" }}>
                <Crown size={12} color="var(--pro)" />
                <span style={{ fontSize: 11, fontWeight: 700, color: "#F59E0B" }}>Pro Account</span>
              </div>
            )}
            <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "5px", borderRadius: 7, background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
              <ChevronRight size={14} style={{ transform: sidebarCollapsed ? "rotate(0deg)" : "rotate(180deg)", transition: "transform 0.2s" }} />
            </button>
          </div>
        </aside>

        {/* ── Main ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Header */}
          <header style={{ height: 56, flexShrink: 0, borderBottom: "1px solid var(--border-primary)", background: "var(--bg-secondary)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", gap: 12 }}>
            <div>
              <h1 className="font-display" style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
                {activeView === "scan" ? "New Scan" : activeView === "history" ? "Scan History" : "AI Chat"}
              </h1>
              <p style={{ fontSize: 11, color: "var(--text-muted)" }}>
                {activeView === "scan" ? "Drop in a file and we’ll break it down for you" : activeView === "history" ? `${history.length} document${history.length !== 1 ? "s" : ""} analyzed so far` : "Ask anything about your scans"}
              </p>
            </div>

            <div className="workbench-header-meta" style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 99, border: "1px solid var(--border-primary)", color: "var(--text-muted)", fontSize: 11, fontWeight: 600 }}>
                <Clock size={11} /> {liveTime}
              </div>

              {/* Notifications */}
              <div ref={notifRef} style={{ position: "relative" }}>
                <button onClick={() => setNotifOpen(!notifOpen)} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: 9, background: notifOpen ? "var(--blue-dim)" : "transparent", border: `1px solid ${notifOpen ? "var(--blue-border)" : "var(--border-primary)"}`, cursor: "pointer", color: notifOpen ? "var(--blue)" : "var(--text-muted)", transition: "all 0.15s" }}>
                  <Bell size={16} />
                </button>
                {notifOpen && (
                  <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, background: "var(--bg-elevated)", border: "1px solid var(--border-hover)", borderRadius: 12, boxShadow: "var(--shadow-lg)", width: 300, padding: 14, zIndex: 100 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 10 }}>Notifications</div>
                    {recentCompletions.length === 0 ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", color: "var(--text-muted)", fontSize: 13 }}>
                        <Bell size={15} style={{ flexShrink: 0 }} /> No new notifications
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        {recentCompletions.map(scan => (
                          <button key={scan.id} onClick={() => { setNotifOpen(false); router.push(`/workbench/scan/${scan.id}`); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 8, background: "none", border: "none", cursor: "pointer", textAlign: "left", width: "100%", transition: "background 0.15s" }} onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")} onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                            <FileText size={13} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{scan.filename}</div>
                              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Scan complete · {formatDate(scan.created_at)}</div>
                            </div>
                            {scan.risk_score != null && <span style={{ fontSize: 11, fontWeight: 700, color: riskColor(scan.risk_score) }}>{scan.risk_score}</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {!isPro && (
                <button onClick={() => setShowUpgrade({type:"scan"})} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 12px", borderRadius: 99, background: "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(217,119,6,0.1))", border: "1px solid rgba(245,158,11,0.28)", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#F59E0B" }}>
                  <Crown size={11} /> Upgrade
                </button>
              )}
              {isPro && <span style={{ fontSize: 11, fontWeight: 700, color: "#F59E0B", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.22)", padding: "3px 10px", borderRadius: 99 }}>✦ Pro</span>}

              {/* Profile */}
              <div style={{ position: "relative" }}>
                <button onClick={() => setProfileMenuOpen(!profileMenuOpen)} style={{ display: "flex", alignItems: "center", gap: 7, padding: "3px 7px 3px 3px", borderRadius: 99, background: profileMenuOpen ? "rgba(255,255,255,0.06)" : "transparent", border: `1px solid ${profileMenuOpen ? "var(--border-hover)" : "var(--border-primary)"}`, cursor: "pointer", transition: "all 0.15s" }}>
                  <Avatar profile={profile} size={26} />
                  {profile && <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", maxWidth: 90, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{profile.name}</span>}
                  <ChevronDown size={12} color="var(--text-muted)" style={{ transform: profileMenuOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
                </button>

                {profileMenuOpen && (
                  <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, background: "var(--bg-secondary)", border: "1px solid var(--border-primary)", borderRadius: 14, padding: 8, minWidth: 200, boxShadow: "var(--shadow-lg)", zIndex: 100 }}>
                    <div style={{ padding: "9px 12px", borderBottom: "1px solid var(--border-primary)", marginBottom: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Avatar profile={profile} size={34} />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{profile?.name}</div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{profile?.email}</div>
                        </div>
                      </div>
                      {isPro && <div style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10, fontWeight: 700, color: "#F59E0B", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", padding: "2px 8px", borderRadius: 99 }}><Crown size={9} /> Pro</div>}
                    </div>
                    {[
                      { label: "Account Settings", icon: Settings, action: () => { router.push("/settings"); setProfileMenuOpen(false); } },
                      { label: "Pricing",           icon: Crown,    action: () => { router.push("/pricing");  setProfileMenuOpen(false); } },
                      { label: "Support",           icon: HelpCircle, action: () => { router.push("/support"); setProfileMenuOpen(false); } },
                    ].map((item, i) => (
                      <button key={i} onClick={item.action} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "8px 12px", borderRadius: 8, background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--text-secondary)", transition: "background 0.15s", textAlign: "left" }} onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")} onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                        <item.icon size={14} /> {item.label}
                      </button>
                    ))}
                    <div style={{ borderTop: "1px solid var(--border-primary)", marginTop: 6, paddingTop: 6 }}>
                      <button onClick={signOut} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "8px 12px", borderRadius: 8, background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#EF4444", transition: "background 0.15s", textAlign: "left" }} onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.08)")} onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                        <LogOut size={14} /> Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Backend warning */}
          {backendOnline === false && (
            <div style={{ margin: "12px 16px 0", padding: "9px 14px", borderRadius: 10, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)", color: "#FCA5A5", display: "flex", alignItems: "center", gap: 10, fontSize: 12, fontWeight: 600 }}>
              <AlertTriangle size={14} color="#FCA5A5" />
              Backend connection unavailable. Uploads and chat may fail until the API is reachable.
            </div>
          )}

          {/* Mobile nav */}
          <div className="workbench-mobile-nav" style={{ padding: "12px 16px 0", background: "var(--bg-primary)", display: "none" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 8 }}>
              {navItems.map(item => (
                <button key={item.id} onClick={() => setActiveView(item.id)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 10px", borderRadius: 10, border: activeView === item.id ? "1px solid var(--blue-border)" : "1px solid var(--border-primary)", background: activeView === item.id ? "var(--blue-dim)" : "var(--bg-secondary)", color: activeView === item.id ? "var(--blue)" : "var(--text-secondary)", fontSize: 12, fontWeight: 600 }}>
                  <item.icon size={13} /> {item.label}
                </button>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 8 }}>
              {accountItems.map((item, idx) => (
                <button key={idx} onClick={item.action} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 10px", borderRadius: 10, border: "1px solid var(--border-primary)", background: "var(--bg-secondary)", color: "var(--text-secondary)", fontSize: 12, fontWeight: 600 }}>
                  <item.icon size={13} /> {item.label}
                </button>
              ))}
            </div>
          </div>

          {profileMenuOpen && <div style={{ position: "fixed", inset: 0, zIndex: 50 }} onClick={() => setProfileMenuOpen(false)} />}

          {/* ── Content ── */}
          <main className="workbench-main" style={{ flex: 1, overflow: "auto", padding: 24 }}>

            {/* ── SCAN VIEW ── */}
            {activeView === "scan" && (
              <div style={{ maxWidth: 820, margin: "0 auto" }}>
                {/* Stats */}
                <div style={{ marginBottom: 22 }}>
                  {statsLoading ? (
                    <div className="scan-stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
                      {[1,2,3].map(i => <div key={i} style={{ height: 84, background: "var(--bg-secondary)", border: "1px solid var(--border-primary)", borderRadius: 12, animation: "pulse 1.5s ease infinite" }} />)}
                    </div>
                  ) : (
                    <div className="scan-stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
                      {[
                        { label: "Total Documents",  value: countTotal,    subtitle: "All time",                    icon: FileText,      color: "var(--accent)" },
                        { label: "Average Risk Score",value: countAvgRisk,  subtitle: "Across completed scans",     icon: BarChart3,     color: "var(--blue)" },
                        { label: "High-Risk Share",   value: countHighRisk, subtitle: "% of docs with risk > 50",   icon: AlertTriangle, color: "var(--danger)" },
                      ].map((s, i) => (
                        <div key={i} className="stat-card" style={{ borderLeftColor: s.color }}>
                          <div style={{ position: "absolute", top: 14, right: 14, color: s.color, opacity: 0.3 }}><s.icon size={20} /></div>
                          <div className="stat-label">{s.label}</div>
                          <div className="stat-number">{s.value}</div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>{s.subtitle}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {!scanning && !result && (
                  <div className="scan-intro-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0,1.4fr) minmax(280px,0.9fr)", gap: 18 }}>
                    {/* Drop zone */}
                    <div
                      onDragOver={e => { e.preventDefault(); setDrag(true); }}
                      onDragLeave={() => setDrag(false)}
                      onDrop={onDrop}
                      onClick={() => !file && fileRef.current?.click()}
                      className={`card-lift ${dragOver ? "animate-pulse-glow" : ""}`}
                      style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", minHeight: 320, cursor: file ? "default" : "pointer", borderRadius: "var(--radius-lg)", border: `2px dashed ${dragOver ? "var(--blue)" : file ? "var(--success)" : "var(--border-accent)"}`, background: dragOver ? "var(--blue-dim)" : file ? "rgba(46,204,113,0.03)" : "var(--accent-dim)", transition: "all 0.3s ease", position: "relative", overflow: "hidden" }}
                    >
                      <input ref={fileRef} type="file" hidden accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.bmp,.tiff" onChange={e => { if (e.target.files?.[0]) setFile(e.target.files[0]); }} />
                      {file ? (
                        <div style={{ padding: "0 24px" }}>
                          <div style={{ width: 64, height: 64, borderRadius: "var(--radius-md)", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(46,204,113,0.1)", border: "1.5px solid rgba(46,204,113,0.25)" }}>
                            <FileText size={28} color="var(--success)" />
                          </div>
                          <p className="font-display" style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)", marginBottom: 5, letterSpacing: "-0.02em" }}>{file.name}</p>
                          <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 20 }}>{(file.size / 1024 / 1024).toFixed(2)} MB · {file.type || "document"}</p>
                          <div style={{ display: "flex", gap: 9, justifyContent: "center", flexWrap: "wrap" }}>
                            <button onClick={e => { e.stopPropagation(); handleUpload(); }} className="btn-primary" style={{ padding: "12px 28px", borderRadius: "var(--radius-md)", background: "var(--accent)", boxShadow: "var(--shadow-accent)" }}><Zap size={15} /> Analyze document</button>
                            <button onClick={e => { e.stopPropagation(); setFile(null); }} className="btn-ghost" style={{ padding: "12px 16px", borderRadius: "var(--radius-sm)" }}><Trash2 size={15} /></button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div style={{ width: 64, height: 64, borderRadius: "var(--radius-md)", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--accent-surface)", border: "1.5px dashed var(--accent-border)" }}>
                            <Upload size={28} color="var(--accent)" />
                          </div>
                          <span className="badge-accent" style={{ marginBottom: 12 }}>Document Intelligence Workbench</span>
                          <p className="font-display" style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", marginBottom: 8, letterSpacing: "-0.02em" }}>Drop a document or click to browse</p>
                          <p style={{ fontSize: 13, color: "var(--text-muted)", maxWidth: 360, lineHeight: 1.7 }}>PDF, PNG, JPG, WEBP, BMP, TIFF. Vaurex extracts entities, scores risk, and gives you an executive summary in one pass.</p>
                        </>
                      )}
                    </div>

                    {/* Right panel */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {!isPro && (
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-muted)", marginBottom: 5 }}>
                            <span>Daily scans</span>
                            <span style={{ color: dailyScansUsed >= FREE_SCAN_LIMIT ? "var(--danger)" : "var(--text-muted)" }}>{dailyScansUsed}/{FREE_SCAN_LIMIT}</span>
                          </div>
                          <div style={{ height: 4, borderRadius: 2, background: "var(--border-primary)", overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${Math.min(100, (dailyScansUsed / FREE_SCAN_LIMIT) * 100)}%`, borderRadius: 2, background: dailyScansUsed >= FREE_SCAN_LIMIT ? "var(--danger)" : "var(--accent-primary)", transition: "width 0.4s ease" }} />
                          </div>
                        </div>
                      )}

                      <div className="glass-panel">
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Workspace Status</div>
                            <div className="font-display" style={{ fontSize: 17, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em", marginTop: 4 }}>
                              {isPro ? "Pro pipeline ready" : `${scansLeft} free scan${scansLeft !== 1 ? "s" : ""} left`}
                            </div>
                          </div>
                          <div style={{ width: 40, height: 40, borderRadius: 12, background: isPro ? "rgba(245,158,11,0.12)" : "rgba(6,214,160,0.1)", display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${isPro ? "rgba(245,158,11,0.22)" : "rgba(6,214,160,0.18)"}` }}>
                            {isPro ? <Crown size={17} color="var(--pro)" /> : <Shield size={17} color="var(--cyan)" />}
                          </div>
                        </div>
                        <div className="scan-status-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 9 }}>
                          <div className="card-inset"><div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 5 }}>Formats</div><div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>PDF, images, scans</div></div>
                          <div className="card-inset"><div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 5 }}>Pipeline</div><div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>OCR + risk + chat</div></div>
                        </div>
                      </div>

                      <div className="scan-quick-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
                        <button onClick={() => setActiveView("history")} className="card-interactive" style={{ padding: 16 }}>
                          <History size={16} color="var(--accent-primary)" style={{ marginBottom: 9 }} />
                          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 3 }}>Recent scans</div>
                          <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>{history.length ? `${history.length} doc${history.length !== 1 ? "s" : ""} in history` : "No history yet"}</div>
                        </button>
                        <button onClick={() => router.push("/support")} className="card-interactive" style={{ padding: 16 }}>
                          <HelpCircle size={16} color="var(--pro)" style={{ marginBottom: 9 }} />
                          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 3 }}>Stuck on something?</div>
                          <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>Open FAQs or message support</div>
                        </button>
                      </div>

                      <div className="card" style={{ padding: 18 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
                          <MessageSquare size={14} color="var(--blue)" />
                          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>Latest activity</div>
                        </div>
                        {latestCompletedScan ? (
                          <>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{latestCompletedScan.filename}</div>
                            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12 }}>{formatDate(latestCompletedScan.created_at)} · Risk {latestCompletedScan.risk_score ?? "—"}</div>
                            <button onClick={() => { setResult(latestCompletedScan); setActiveView("scan"); }} className="btn-ghost" style={{ padding: "7px 12px", borderRadius: 9, fontSize: 12 }}>
                              Open report <ChevronRight size={13} />
                            </button>
                          </>
                        ) : (
                          <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>Your latest completed scan will show up here for quick access.</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", borderRadius: 10, marginTop: 14, background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)", color: "#EF4444", fontSize: 13 }}>
                    <AlertCircle size={15} style={{ flexShrink: 0 }} />{error}
                    <button onClick={() => setError("")} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#EF4444" }}><X size={13} /></button>
                  </div>
                )}

                {scanning && (
                  <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-primary)", borderRadius: 18, padding: 48, textAlign: "center" }}>
                    <div style={{ width: 56, height: 56, borderRadius: 16, margin: "0 auto 18px", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--accent-surface)", animation: "pulseRing 2s ease infinite" }}>
                      <Loader2 size={24} color="var(--accent-primary)" style={{ animation: "spin 0.8s linear infinite" }} />
                    </div>
                    <p className="font-display" style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 5 }}>{PROCESSING_STAGES[processingStage]}</p>
                    <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 22 }}>Multi-model AI pipeline · Usually 10–20s</p>
                    <div style={{ display: "flex", gap: 5, maxWidth: 260, margin: "0 auto 10px" }}>
                      {PROCESSING_STAGES.map((_, i) => <div key={i} style={{ flex: 1, height: 3, borderRadius: 99, background: i <= processingStage ? "var(--accent-primary)" : "rgba(255,255,255,0.07)", transition: "background 0.4s", boxShadow: i <= processingStage ? "0 0 6px rgba(255,107,53,0.5)" : "none" }} />)}
                    </div>
                    <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Step {processingStage + 1} of {PROCESSING_STAGES.length}</p>
                  </div>
                )}

                {result && result.status === "done" && (
                  <ScanReport result={result} onDownloadText={() => downloadReport("text")} downloading={downloading} onReset={() => { setResult(null); setFile(null); setScanId(null); }} />
                )}

                {result && ["error","failed","failure"].includes(result.status) && (
                  <div style={{ background: "var(--bg-secondary)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 18, padding: 48, textAlign: "center" }}>
                    <XCircle size={36} color="#EF4444" style={{ margin: "0 auto 14px" }} />
                    <h3 className="font-display" style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>Analysis failed</h3>
                    <p style={{ color: "var(--text-secondary)", fontSize: 14, maxWidth: 380, margin: "0 auto 24px" }}>{result.error_message || "An error occurred. Please try again."}</p>
                    <button onClick={() => { setResult(null); setFile(null); setScanId(null); }} className="btn-primary" style={{ padding: "10px 24px" }}>Try again</button>
                  </div>
                )}
              </div>
            )}

            {/* ── HISTORY VIEW ── */}
            {activeView === "history" && (
              <div style={{ maxWidth: 820, margin: "0 auto" }}>
                {history.length > 0 && (
                  <div className="history-stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 20 }}>
                    {[
                      { label: "Total Scans",    value: history.length, icon: FileSearch,  color: "var(--accent-primary)" },
                      { label: "Avg Risk",       value: (() => { const d = history.filter(s => s.status === "done" && s.risk_score != null); return d.length ? Math.round(d.reduce((a, s) => a + (s.risk_score ?? 0), 0) / d.length) : "—"; })(), icon: TrendingUp, color: "var(--cyan)" },
                      { label: "High Risk Docs", value: history.filter(s => (s.risk_score ?? 0) > 55).length, icon: AlertTriangle, color: "#EF4444" },
                    ].map((s, i) => (
                      <div key={i} style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-primary)", borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 11 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 9, background: `${s.color}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><s.icon size={16} color={s.color} /></div>
                        <div><div className="font-display" style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>{s.value}</div><div style={{ fontSize: 11, color: "var(--text-muted)" }}>{s.label}</div></div>
                      </div>
                    ))}
                  </div>
                )}

                {history.length === 0 ? (
                  <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-primary)", borderRadius: 18, padding: 56, textAlign: "center" }}>
                    <Clock size={30} color="var(--text-muted)" style={{ margin: "0 auto 12px" }} />
                    <p style={{ color: "var(--text-secondary)", fontSize: 15, marginBottom: 5, fontWeight: 600 }}>No scans yet</p>
                    <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 16 }}>Run your first scan and we’ll start building your timeline.</p>
                    <button onClick={() => setActiveView("scan")} className="btn-primary" style={{ padding: "9px 22px" }}>New scan <ChevronRight size={13} /></button>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    {history.map(scan => (
                      <div key={scan.id} onClick={() => { setResult(scan); setActiveView("scan"); }}
                        style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--bg-secondary)", border: "1px solid var(--border-primary)", borderRadius: 12, padding: "11px 14px", cursor: "pointer", transition: "all 0.15s" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-hover)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-primary)"; (e.currentTarget as HTMLElement).style.transform = "none"; }}
                      >
                        <div style={{ width: 36, height: 36, borderRadius: 9, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: scan.status === "done" ? "rgba(6,214,160,0.08)" : "rgba(239,68,68,0.07)", border: `1px solid ${scan.status === "done" ? "rgba(6,214,160,0.22)" : "rgba(239,68,68,0.18)"}` }}>
                          {scan.status === "done" ? <FileSearch size={15} color="var(--cyan)" /> : <XCircle size={15} color="#EF4444" />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{scan.filename}</div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{formatDate(scan.created_at)} · {scan.status}</div>
                        </div>
                        {scan.status === "done" && scan.risk_score != null && (
                          <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 8, minWidth: 100 }}>
                            <div style={{ flex: 1, height: 3, borderRadius: 99, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                              <div style={{ height: "100%", width: `${scan.risk_score}%`, background: riskColor(scan.risk_score), borderRadius: 99 }} />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 700, color: riskColor(scan.risk_score), minWidth: 22 }}>{scan.risk_score}</span>
                          </div>
                        )}
                        <button onClick={e => deleteScan(scan.id, e)} style={{ opacity: 0.35, background: "none", border: "none", cursor: "pointer", color: "#EF4444", padding: 4, borderRadius: 6, transition: "opacity 0.15s", flexShrink: 0 }} onMouseEnter={e => (e.currentTarget.style.opacity = "1")} onMouseLeave={e => (e.currentTarget.style.opacity = "0.35")}>
                          <Trash2 size={13} />
                        </button>
                        <ChevronRight size={13} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── CHAT VIEW ── */}
            {activeView === "chat" && (
              <div className="chat-shell" style={{ maxWidth: 760, margin: "0 auto", height: "calc(100vh - 56px - 48px)" }}>
                <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-primary)", borderRadius: 16, height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                  {/* Chat header */}
                  <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border-primary)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 9, background: "linear-gradient(135deg, var(--accent-primary), var(--blue))", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Sparkles size={15} color="white" fill="white" />
                      </div>
                      <div>
                        <h3 className="font-display" style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1 }}>Vaurex AI</h3>
                        <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>
                          {isPro ? "Unlimited · Pro" : `${Math.max(0, FREE_CHAT_LIMIT - dailyChatUsed)} free chats left today`}
                        </p>
                      </div>
                    </div>
                    {!isPro && (
                      <button onClick={() => setShowUpgrade({type:"chat"})} style={{ padding: "5px 11px", borderRadius: 99, border: "1px solid rgba(245,158,11,0.32)", background: "rgba(245,158,11,0.09)", color: "#F59E0B", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>
                        <Crown size={11} /> Upgrade
                      </button>
                    )}
                  </div>

                  {/* Messages */}
                  <div ref={chatScrollRef} style={{ flex: 1, overflow: "auto", padding: "18px 14px", display: "flex", flexDirection: "column", gap: 14 }}>
                    {chatMessages.map((message, index) => (
                      <div key={`${message.role}-${index}`} style={{ display: "flex", flexDirection: "column", alignItems: message.role === "user" ? "flex-end" : "flex-start", gap: 4 }}>
                        {message.role === "assistant" && (
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                            <div style={{ width: 18, height: 18, borderRadius: 5, background: "linear-gradient(135deg, var(--accent-primary), var(--blue))", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <Sparkles size={9} color="white" fill="white" />
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)" }}>Vaurex AI</span>
                          </div>
                        )}
                        <div style={{ maxWidth: "82%", padding: message.role === "user" ? "9px 14px" : "12px 16px", borderRadius: message.role === "user" ? "16px 16px 4px 16px" : "4px 16px 16px 16px", background: message.role === "user" ? "var(--blue-dim)" : "var(--bg-primary)", border: message.role === "user" ? "1px solid var(--blue-border)" : "1px solid var(--border-primary)", boxShadow: message.role === "assistant" ? "0 2px 10px rgba(0,0,0,0.2)" : "none" }}>
                          {message.role === "user"
                            ? <span style={{ fontSize: 13, lineHeight: 1.6, color: "var(--text-primary)" }}>{message.content}</span>
                            : <div style={{ fontSize: 13, lineHeight: 1.72, color: "var(--text-secondary)" }}>{renderMarkdown(message.content)}</div>}
                        </div>
                      </div>
                    ))}

                    {chatSending && (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                          <div style={{ width: 18, height: 18, borderRadius: 5, background: "linear-gradient(135deg, var(--accent-primary), var(--blue))", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Sparkles size={9} color="white" fill="white" />
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)" }}>Vaurex AI</span>
                        </div>
                        <div style={{ padding: "11px 14px", borderRadius: "4px 16px 16px 16px", border: "1px solid var(--border-primary)", background: "var(--bg-primary)", display: "flex", alignItems: "center", gap: 5 }}>
                          {[0,1,2].map(j => <div key={j} style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--accent-primary)", animation: `typingDot 1.2s ease ${j * 0.2}s infinite` }} />)}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input */}
                  <div style={{ padding: "10px 12px", borderTop: "1px solid var(--border-primary)", display: "flex", gap: 8, alignItems: "flex-end" }}>
                    <input
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void handleSendChat(); } }}
                      placeholder="Ask about findings, entities, or risk interpretation…"
                      style={{ flex: 1, background: "var(--bg-primary)", border: "1px solid var(--border-primary)", borderRadius: 10, color: "var(--text-primary)", padding: "10px 13px", fontSize: 13, outline: "none", transition: "border-color 0.15s", fontFamily: "inherit" }}
                      onFocus={e => (e.target.style.borderColor = "var(--blue)")}
                      onBlur={e  => (e.target.style.borderColor = "var(--border-primary)")}
                    />
                    <button
                      onClick={() => void handleSendChat()}
                      disabled={chatSending || !chatInput.trim()}
                      style={{ width: 40, height: 40, borderRadius: 10, border: "none", cursor: chatSending || !chatInput.trim() ? "not-allowed" : "pointer", background: chatSending || !chatInput.trim() ? "var(--bg-elevated)" : "var(--blue)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.15s" }}
                    >
                      <Send size={14} color={chatSending || !chatInput.trim() ? "var(--text-muted)" : "white"} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}