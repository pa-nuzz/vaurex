"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { apiFetch, apiJson, safeUiError } from "@/lib/api";
import {
  ArrowLeft, FileText, Download, CheckCircle, XCircle, Loader2, Check,
  BarChart3, Users, Shield, AlertTriangle, Star, Send, MessageSquare,
} from "lucide-react";

type Entity = { type: string; value: string; context?: string };
type ScanResult = {
  id: string; filename: string;
  status: "processing" | "done" | "error" | "failed" | "failure";
  risk_score?: number; risk_label?: string; summary?: string;
  entities?: Entity[]; flags?: string[]; error_message?: string; created_at: string;
};

const PROCESSING_STAGES = ["Uploading document", "Extracting text", "Analyzing risks", "Generating summary"];

function riskColor(s: number) {
  return s <= 30 ? "var(--success)" : s <= 60 ? "var(--pro)" : "var(--danger)";
}
function riskBg(s: number) {
  return s <= 30 ? "rgba(16,185,129,0.08)" : s <= 60 ? "rgba(245,158,11,0.08)" : "rgba(239,68,68,0.08)";
}
function riskLabel(s: number) {
  return s <= 15 ? "Benign" : s <= 30 ? "Low" : s <= 60 ? "Medium" : "High";
}
function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function RiskGauge({ score }: { score: number }) {
  const r = 54; const sw = 9; const circ = 2 * Math.PI * r;
  const pct = Math.min(Math.max(score, 0), 100) / 100;
  const color = riskColor(score);
  return (
    <div style={{ position: "relative", width: 136, height: 136 }}>
      <svg width="136" height="136" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="68" cy="68" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={sw} />
        <circle cx="68" cy="68" r={r} fill="none" stroke={color} strokeWidth={sw}
          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1.2s ease", filter: `drop-shadow(0 0 8px ${color}60)` }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2 }}>
        <span style={{ fontSize: 34, fontWeight: 800, color, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>{riskLabel(score)}</span>
      </div>
    </div>
  );
}

function EntityGroup({ entities }: { entities: Entity[] }) {
  const grouped: Record<string, Entity[]> = {};
  entities.forEach(e => { (grouped[e.type] ||= []).push(e); });
  const colors: Record<string, string> = { PERSON: "var(--accent)", ORG: "#3B82F6", DATE: "#059669", MONEY: "var(--pro)", LOCATION: "#DB2777", LAW: "var(--danger)", MISC: "#6B7280" };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {Object.entries(grouped).map(([type, items]) => {
        const col = colors[type] || "#6B7280";
        return (
          <div key={type}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: col }} />
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: col }}>{type}</span>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>({items.length})</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {items.map((e, i) => (
                <span key={i} style={{ fontSize: 12, fontWeight: 500, padding: "3px 10px", borderRadius: 20, background: `${col}15`, color: col, border: `1px solid ${col}30` }}>{e.value}</span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function ScanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params?.id === "string" ? params.id : "";
  const [scan, setScan] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [sessionToken, setSessionToken] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval>>();

  const fetchScan = useCallback(async () => {
    if (!id) return;
    try {
      const res = await apiFetch(`/api/v1/scans/${id}/poll`, {}, { auth: true, timeoutMs: 15000 });
      if (!res.ok) {
        if (res.status === 404) setError("Scan not found.");
        return null;
      }
      const data: ScanResult = await res.json();
      const status = (data.status || "").toLowerCase();
      const normalized: ScanResult = {
        ...data,
        status: status === "failure" ? "failed" : (status as ScanResult["status"]),
      };
      return normalized;
    } catch (e) {
      setError(safeUiError(e, "Failed to load scan."));
      return null;
    }
  }, [id]);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError("Missing scan ID.");
      return;
    }
    let active = true;
    (async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        if (active) router.replace("/login?next=" + encodeURIComponent("/workbench/scan/" + id));
        return;
      }
      if (active) setSessionToken(session.access_token);
      const data = await fetchScan();
      if (!active) return;
      setScan(data || null);
      setLoading(false);
      if (data?.status === "processing") {
        setCurrentStep(0);
        const iv = setInterval(() => setCurrentStep(c => Math.min(c + 1, PROCESSING_STAGES.length - 1)), 2000);
        return () => clearInterval(iv);
      }
    })();
    return () => { active = false; };
  }, [id, fetchScan, router]);

  useEffect(() => {
    if (!scan || scan.status !== "processing" || !id) return;
    pollRef.current = setInterval(async () => {
      const data = await fetchScan();
      if (data) {
        setScan(data);
        if (data.status !== "processing") clearInterval(pollRef.current!);
      }
    }, 2500);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- poll only when status is processing; avoid full scan in deps
  }, [id, scan?.status, fetchScan]);

  const handleDownload = async (format: "json" | "text") => {
    if (!scan) return;
    setDownloading(true);
    try {
      const path = format === "json" ? `/api/v1/scans/${scan.id}/download/report` : `/api/v1/scans/${scan.id}/download/text`;
      const res = await apiFetch(path, {}, { auth: true, timeoutMs: 30000 });
      if (!res.ok) throw new Error("Download failed");
      const fname = scan.filename.replace(/\.[^.]+$/, "");
      if (format === "json") {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${fname}-report.json`; a.click();
      } else {
        const text = await res.text();
        const blob = new Blob([text], { type: "text/plain" });
        const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${fname}-text.txt`; a.click();
      }
    } catch {
      setError("Download failed.");
    } finally {
      setDownloading(false);
    }
  };

  if (loading && !scan) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 40, height: 40, border: "2px solid rgba(255,255,255,0.08)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error && !scan) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-primary)", padding: 24, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <XCircle size={48} color="var(--danger)" />
        <p style={{ color: "var(--text-primary)", fontSize: 16 }}>{error}</p>
        <Link href="/workbench" style={{ color: "var(--accent)", fontSize: 14 }}>← Back to Workbench</Link>
      </div>
    );
  }

  if (scan?.status === "processing") {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-primary)", padding: 24, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24 }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", border: "2px solid rgba(255,107,53,0.3)", borderTopColor: "var(--accent)", animation: "spin 0.8s linear infinite" }} />
        <p style={{ color: "var(--text-primary)", fontWeight: 600 }}>Analyzing your document...</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%", maxWidth: 280 }}>
          {PROCESSING_STAGES.map((step, i) => (
            <div key={step} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "var(--text-muted)" }}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", background: i < currentStep ? "var(--accent)" : "#3F3F46", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {i < currentStep && <Check size={12} color="white" />}
              </div>
              {step}
            </div>
          ))}
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (scan?.status && ["error", "failed", "failure"].includes(scan.status)) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-primary)", padding: 24, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <XCircle size={48} color="var(--danger)" />
        <h1 style={{ color: "var(--text-primary)", fontSize: 18 }}>Analysis failed</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>{scan.error_message || "Something went wrong."}</p>
        <Link href="/workbench" style={{ color: "var(--accent)", fontSize: 14 }}>← Back to Workbench</Link>
      </div>
    );
  }

  if (!scan || scan.status !== "done") return null;

  const score = scan.risk_score ?? 0;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", padding: 24 }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <Link href="/workbench" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "var(--text-muted)", fontSize: 14, marginBottom: 24 }} className="hover:text-white transition-colors">
          <ArrowLeft size={16} /> Back to Workbench
        </Link>

        {/* Header */}
        <div style={{ background: "#2C2C2E", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 24, display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>{scan.filename}</h1>
            <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{formatDate(scan.created_at)}</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <span style={{ padding: "4px 12px", borderRadius: 8, fontSize: 13, fontWeight: 700, background: riskBg(score), color: riskColor(score), border: `1px solid ${riskColor(score)}30` }}>
              Risk {score}
            </span>
            <button onClick={() => handleDownload("json")} disabled={downloading} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(255,107,53,0.4)", background: "transparent", color: "var(--accent)", fontSize: 13, cursor: "pointer" }}>
              <Download size={14} style={{ verticalAlign: "middle", marginRight: 6 }} /> Download Report
            </button>
          </div>
        </div>

        {/* Executive Summary */}
        <div style={{ background: "#2C2C2E", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 12 }}>Executive Summary</h2>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.8 }}>{scan.summary || "No summary available."}</p>
        </div>

        {/* Risk + Flags */}
        <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 24, marginBottom: 24 }} className="scan-report-grid">
          <div style={{ background: riskBg(score), border: `1px solid ${riskColor(score)}25`, borderRadius: 16, padding: 24, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <RiskGauge score={score} />
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: riskColor(score) }}>{scan.risk_label || riskLabel(score)}</span>
          </div>
          <div>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12 }}>Risk Flags</h3>
            {scan.flags && scan.flags.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {scan.flags.map((f, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.1)" }}>
                    <AlertTriangle size={14} color="#EF4444" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{typeof f === "string" ? f : JSON.stringify(f)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 13, color: "var(--text-muted)" }}>No risk flags identified.</p>
            )}
          </div>
        </div>

        {/* Entities */}
        {scan.entities && scan.entities.length > 0 && (
          <div style={{ background: "#2C2C2E", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 24, marginBottom: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 16 }}>Extracted Entities</h3>
            <EntityGroup entities={scan.entities} />
          </div>
        )}

        {/* Feedback */}
        <div style={{ background: "#2C2C2E", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 12 }}>Was this analysis helpful?</h3>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>Your feedback helps us improve.</p>
          <Link href="/workbench" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "var(--accent)", color: "white", borderRadius: 8, fontSize: 13, fontWeight: 500 }}>
            <MessageSquare size={14} /> Chat about this document
          </Link>
        </div>

        <style>{`@media(max-width:640px){.scan-report-grid{grid-template-columns:1fr !important}}`}</style>
      </div>
    </div>
  );
}
