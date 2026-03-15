"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { apiFetch, safeUiError } from "@/lib/api";
import {
  ArrowLeft,
  AlertTriangle,
  Check,
  Download,
  FileText,
  Loader2,
  Sparkles,
  XCircle,
} from "lucide-react";

type Entity = { type: string; value: string; context?: string };
type FlagObject = {
  severity?: "low" | "medium" | "high" | "critical";
  quote?: string;
  explanation?: string;
  action?: string;
};
type ScanResult = {
  id: string;
  filename: string;
  status: "processing" | "done" | "error" | "failed" | "failure";
  risk_score?: number;
  risk_label?: string;
  summary?: string;
  entities?: Entity[];
  flags?: (string | FlagObject)[];
  error_message?: string;
  clean_text?: string;
  created_at: string;
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
  const r = 54;
  const sw = 9;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(Math.max(score, 0), 100) / 100;
  const color = riskColor(score);
  return (
    <div style={{ position: "relative", width: 136, height: 136 }}>
      <svg width="136" height="136" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="68" cy="68" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={sw} />
        <circle
          cx="68"
          cy="68"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={sw}
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct)}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1.2s ease", filter: `drop-shadow(0 0 8px ${color}60)` }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
        }}
      >
        <span style={{ fontSize: 34, fontWeight: 800, color, lineHeight: 1 }}>{score}</span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: "var(--text-muted)",
            textTransform: "uppercase",
          }}
        >
          {riskLabel(score)}
        </span>
      </div>
    </div>
  );
}

function EntityGroup({ entities }: { entities: Entity[] }) {
  const grouped: Record<string, Entity[]> = {};
  entities.forEach((e) => {
    (grouped[e.type] ||= []).push(e);
  });
  const colors: Record<string, string> = {
    PERSON: "#3B82F6",
    ORG: "#A855F7",
    DATE: "#06B6D4",
    MONEY: "#F59E0B",
    LOCATION: "#10B981",
    EMAIL: "#14B8A6",
    PHONE: "#6366F1",
    LAW: "#EF4444",
  };
  const icons: Record<string, string> = {
    PERSON: "👤",
    ORG: "🏢",
    DATE: "📅",
    MONEY: "💰",
    LOCATION: "📍",
    EMAIL: "✉️",
    PHONE: "📞",
    LAW: "⚖️",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {Object.entries(grouped).map(([type, items]) => {
        const col = colors[type] || "#6B7280";
        return (
          <div key={type}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <span style={{ fontSize: 13 }}>{icons[type] || "🏷️"}</span>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: col }}>{type}</span>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>({items.length})</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {items.map((e, i) => (
                <div key={i} style={{ padding: "8px 10px", borderRadius: 10, background: `${col}12`, border: `1px solid ${col}30` }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: col }}>{e.value}</div>
                  {e.context ? <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>{e.context}</div> : null}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
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
  const [showExtracted, setShowExtracted] = useState(false);
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
      return {
        ...data,
        status: status === "failure" ? "failed" : (status as ScanResult["status"]),
        clean_text: data.clean_text || "",
      };
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
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        if (active) router.replace("/login?next=" + encodeURIComponent("/workbench/scan/" + id));
        return;
      }
      const data = await fetchScan();
      if (!active) return;
      setScan(data || null);
      setLoading(false);
      if (data?.status === "processing") {
        setCurrentStep(0);
        const iv = setInterval(() => setCurrentStep((c) => Math.min(c + 1, PROCESSING_STAGES.length - 1)), 2000);
        return () => clearInterval(iv);
      }
    })();
    return () => {
      active = false;
    };
  }, [id, fetchScan, router]);

  useEffect(() => {
    const status = scan?.status;
    if (status !== "processing" || !id) return;
    pollRef.current = setInterval(async () => {
      const data = await fetchScan();
      if (data) {
        setScan(data);
        if (data.status !== "processing") clearInterval(pollRef.current);
      }
    }, 2500);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [id, scan?.status, fetchScan]);

  const handleDownloadText = async () => {
    if (!scan) return;
    setDownloading(true);
    try {
      const res = await apiFetch(`/api/v1/scans/${scan.id}/download/text`, {}, { auth: true, timeoutMs: 30000 });
      if (!res.ok) throw new Error("Download failed");
      const text = await res.text();
      const fname = scan.filename.replace(/\.[^.]+$/, "");
      const blob = new Blob([text], { type: "text/plain" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${fname}-text.txt`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      setError("Text download failed.");
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!scan) return;
    const score = scan.risk_score ?? 0;
    const grouped: Record<string, Entity[]> = {};
    (scan.entities || []).forEach((e) => {
      (grouped[e.type] ||= []).push(e);
    });

    const flagsHtml = (scan.flags || [])
      .map((flag) => {
        if (typeof flag === "string") {
          return `<li style=\"margin-bottom:8px;\">${escapeHtml(flag)}</li>`;
        }
        return `
          <li style=\"margin-bottom:12px; padding:10px; border:1px solid #333; border-radius:8px;\">
            <div style=\"font-weight:700; text-transform:uppercase; font-size:11px; margin-bottom:4px; color:#F59E0B;\">${escapeHtml(flag.severity || "medium")}</div>
            ${flag.quote ? `<blockquote style=\"margin:6px 0; padding-left:10px; border-left:2px solid #555; color:#BDBDBD;\">${escapeHtml(flag.quote)}</blockquote>` : ""}
            ${flag.explanation ? `<p style=\"margin:4px 0;\">${escapeHtml(flag.explanation)}</p>` : ""}
            ${flag.action ? `<p style=\"margin:4px 0; color:#F0F0F0;\"><strong>Action:</strong> ${escapeHtml(flag.action)}</p>` : ""}
          </li>
        `;
      })
      .join("");

    const entitiesHtml = Object.entries(grouped)
      .map(([type, items]) => `<h4 style=\"margin:12px 0 6px;\">${escapeHtml(type)} (${items.length})</h4><ul>${items.map((i) => `<li>${escapeHtml(i.value)}${i.context ? ` — <span style=\"color:#A0A0A0\">${escapeHtml(i.context)}</span>` : ""}</li>`).join("")}</ul>`)
      .join("");

    const html = `
      <html>
        <head>
          <meta charset=\"utf-8\" />
          <title>Scan Report - ${escapeHtml(scan.filename)}</title>
          <style>
            * { box-sizing: border-box; }
            body { font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif; background:#05070d; color:#F8FAFC; padding:24px; line-height:1.65; }
            .card { border:1px solid #334155; border-radius:14px; padding:16px; margin-bottom:16px; background:linear-gradient(180deg,#0f172a 0%, #111827 100%); box-shadow:0 10px 30px rgba(2,6,23,.35); }
            .badge { display:inline-block; padding:5px 11px; border-radius:999px; font-weight:800; font-size:12px; background:#0b1220; border:1px solid #334155; color:#E2E8F0; }
            h1,h2,h3,h4 { margin:0 0 10px; color:#E2E8F0; }
            p, li { color:#CBD5E1; }
            pre { white-space: pre-wrap; overflow-wrap: anywhere; word-break: break-word; background:#0B1220; border:1px solid #334155; border-radius:10px; padding:12px; color:#E2E8F0; font-size:12px; line-height:1.8; }
            .page-break { break-before: page; page-break-before: always; }
            @media print { body { padding: 18px 20px; } @page { margin: 12mm 10mm; } }
          </style>
        </head>
        <body>
          <div class=\"card\">
            <div style=\"display:flex; align-items:center; gap:10px; margin-bottom:8px;\">
              <div style=\"width:34px; height:34px; border-radius:10px; background:linear-gradient(135deg,#FF6B35,#3B82F6); display:flex; align-items:center; justify-content:center; color:#fff; font-weight:800;\">✦</div>
              <div style=\"font-size:10px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#94A3B8;\">Vaurex AI Intelligence Report</div>
            </div>
            <h1 style=\"margin-bottom:4px;\">${escapeHtml(scan.filename)}</h1>
            <div style=\"color:#94A3B8; font-size:12px; margin-bottom:10px;\">Generated ${escapeHtml(formatDate(scan.created_at))}</div>
            <span class=\"badge\">Risk ${score} · ${escapeHtml(scan.risk_label || riskLabel(score))}</span>
          </div>

          <div class=\"card\">
            <h2>Executive Summary</h2>
            <p>${escapeHtml(scan.summary || "No summary available.")}</p>
          </div>

          <div class=\"card\">
            <h2>Risk Flags</h2>
            ${flagsHtml ? `<ul>${flagsHtml}</ul>` : `<p>No risk flags identified.</p>`}
          </div>

          <div class=\"card\">
            <h2>Extracted Entities</h2>
            ${entitiesHtml || "<p>No entities extracted.</p>"}
          </div>

          <div class=\"card page-break\">
            <h2>Extracted Contents (Full)</h2>
            <pre>${escapeHtml(scan.clean_text || "No extracted text available.")}</pre>
          </div>
        </body>
      </html>
    `;

    const w = window.open("", "_blank");
    if (!w) {
      setError("Unable to open PDF window. Please allow popups.");
      return;
    }
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
  };

  if (loading && !scan) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            width: 40,
            height: 40,
            border: "2px solid rgba(255,255,255,0.08)",
            borderTopColor: "var(--accent)",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error && !scan) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--bg-primary)",
          padding: 24,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
        }}
      >
        <XCircle size={48} color="var(--danger)" />
        <p style={{ color: "var(--text-primary)", fontSize: 16 }}>{error}</p>
        <Link href="/workbench" style={{ color: "var(--accent)", fontSize: 14 }}>
          ← Back to Workbench
        </Link>
      </div>
    );
  }

  if (scan?.status === "processing") {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--bg-primary)",
          padding: 24,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            border: "2px solid rgba(255,107,53,0.3)",
            borderTopColor: "var(--accent)",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <p style={{ color: "var(--text-primary)", fontWeight: 600 }}>Analyzing your document...</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%", maxWidth: 280 }}>
          {PROCESSING_STAGES.map((step, i) => (
            <div key={step} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "var(--text-muted)" }}>
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: i < currentStep ? "var(--accent)" : "#3F3F46",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
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
      <div
        style={{
          minHeight: "100vh",
          background: "var(--bg-primary)",
          padding: 24,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
        }}
      >
        <XCircle size={48} color="var(--danger)" />
        <h1 style={{ color: "var(--text-primary)", fontSize: 18 }}>Analysis failed</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>{scan.error_message || "Something went wrong."}</p>
        <Link href="/workbench" style={{ color: "var(--accent)", fontSize: 14 }}>
          ← Back to Workbench
        </Link>
      </div>
    );
  }

  if (!scan || scan.status !== "done") return null;

  const score = scan.risk_score ?? 0;
  const flags = scan.flags || [];
  const hasExtracted = (scan.clean_text || "").trim().length > 0;
  const severityColors: Record<string, { bg: string; border: string; text: string }> = {
    low: { bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.25)", text: "#10B981" },
    medium: { bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.25)", text: "#F59E0B" },
    high: { bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.25)", text: "#EF4444" },
    critical: { bg: "rgba(220,38,38,0.1)", border: "rgba(220,38,38,0.3)", text: "#DC2626" },
  };

  return (
    <div className="scan-detail-shell" style={{ minHeight: "100vh", background: "var(--bg-primary)", padding: 24 }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        <Link
          href="/workbench"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            color: "var(--text-muted)",
            fontSize: 14,
            marginBottom: 18,
          }}
        >
          <ArrowLeft size={16} /> Back to Workbench
        </Link>

        <div
          className="scan-detail-header"
          style={{
            borderRadius: 16,
            border: "1px solid var(--border-primary)",
            background: "linear-gradient(145deg, rgba(59,130,246,0.1), rgba(255,90,31,0.07))",
            padding: "20px 18px",
            marginBottom: 16,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 14,
            flexWrap: "wrap",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  background: "linear-gradient(135deg, var(--accent-primary), #FF8C42)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Sparkles size={11} color="white" fill="white" />
              </div>
              <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Analysis Report
              </span>
            </div>
            <h1 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", marginBottom: 2, lineHeight: 1.3 }}>
              {scan.filename}
            </h1>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{formatDate(scan.created_at)}</div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ padding: "5px 12px", borderRadius: 99, fontSize: 12, fontWeight: 700, background: riskBg(score), color: riskColor(score), border: `1px solid ${riskColor(score)}40` }}>
              Risk {score}
            </span>
            <button
              onClick={handleDownloadPdf}
              disabled={downloading}
              style={{ padding: "9px 13px", borderRadius: 10, border: "1px solid var(--border-primary)", background: "rgba(255,255,255,0.04)", color: "var(--text-primary)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
            >
              <Download size={13} style={{ verticalAlign: "middle", marginRight: 6 }} /> PDF
            </button>
            <button
              onClick={handleDownloadText}
              disabled={downloading}
              style={{ padding: "9px 13px", borderRadius: 10, border: "1px solid var(--accent-border)", background: "var(--accent-surface)", color: "var(--accent-primary)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
            >
              <FileText size={13} style={{ verticalAlign: "middle", marginRight: 6 }} /> Raw Text
            </button>
          </div>
        </div>

        {error ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10, borderRadius: 12, border: "1px solid rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.1)", padding: "10px 12px", color: "#FCA5A5", marginBottom: 12, fontSize: 12, fontWeight: 600 }}>
            <AlertTriangle size={14} /> {error}
          </div>
        ) : null}

        <div style={{ borderRadius: 14, border: "1px solid var(--border-primary)", background: "var(--bg-secondary)", padding: 18, marginBottom: 16 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 10 }}>Executive Summary</h2>
          <p style={{ fontSize: 13, lineHeight: 1.75, color: "var(--text-secondary)", whiteSpace: "pre-wrap" }}>
            {scan.summary || "No summary available."}
          </p>
        </div>

        <div className="scan-report-grid" style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 16, marginBottom: 16 }}>
          <div style={{ borderRadius: 14, border: `1px solid ${riskColor(score)}33`, background: riskBg(score), padding: 16, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <RiskGauge score={score} />
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: riskColor(score) }}>
              {scan.risk_label || riskLabel(score)}
            </div>
          </div>

          <div style={{ borderRadius: 14, border: "1px solid var(--border-primary)", background: "var(--bg-secondary)", padding: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 10 }}>Risk Flags</h3>
            {flags.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {flags.map((flag, i) => {
                  if (typeof flag === "string") {
                    return (
                      <div key={i} style={{ display: "flex", gap: 8, padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.05)" }}>
                        <AlertTriangle size={14} color="#EF4444" style={{ flexShrink: 0, marginTop: 2 }} />
                        <span style={{ fontSize: 12, lineHeight: 1.6, color: "var(--text-secondary)" }}>{flag}</span>
                      </div>
                    );
                  }
                  const severity = (flag.severity || "medium").toLowerCase();
                  const tone = severityColors[severity] || severityColors.medium;
                  return (
                    <div key={i} style={{ padding: "10px 12px", borderRadius: 10, border: `1px solid ${tone.border}`, background: tone.bg }}>
                      <div style={{ display: "inline-flex", padding: "2px 8px", borderRadius: 99, border: `1px solid ${tone.border}`, color: tone.text, fontSize: 10, fontWeight: 700, textTransform: "uppercase", marginBottom: 7 }}>
                        {severity}
                      </div>
                      {flag.quote ? <blockquote style={{ margin: "0 0 7px", paddingLeft: 10, borderLeft: "2px solid rgba(255,255,255,0.2)", color: "var(--text-muted)", fontSize: 12, fontStyle: "italic" }}>{flag.quote}</blockquote> : null}
                      {flag.explanation ? <div style={{ color: "var(--text-secondary)", fontSize: 12, lineHeight: 1.65, marginBottom: flag.action ? 7 : 0 }}>{flag.explanation}</div> : null}
                      {flag.action ? <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "8px 9px", fontSize: 12, color: "var(--text-primary)", lineHeight: 1.6 }}><strong>Action:</strong> {flag.action}</div> : null}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ fontSize: 12, color: "var(--text-muted)" }}>No risk flags identified.</p>
            )}
          </div>
        </div>

        {scan.entities && scan.entities.length > 0 ? (
          <div style={{ borderRadius: 14, border: "1px solid var(--border-primary)", background: "var(--bg-secondary)", padding: 16, marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12 }}>Extracted Entities</h3>
            <EntityGroup entities={scan.entities} />
          </div>
        ) : null}

        {hasExtracted ? (
          <div style={{ borderRadius: 14, border: "1px solid var(--border-primary)", background: "var(--bg-secondary)", padding: 16, marginBottom: 16 }}>
            <button
              onClick={() => setShowExtracted((v) => !v)}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: showExtracted ? 12 : 0 }}
            >
              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>Extracted Contents</span>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{showExtracted ? "Hide" : "Show"} · {(scan.clean_text || "").trim().split(/\s+/).length} words</span>
            </button>
            {showExtracted ? (
              <pre
                style={{
                  maxHeight: 460,
                  overflow: "auto",
                  margin: 0,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  borderRadius: 10,
                  border: "1px solid var(--border-primary)",
                  background: "var(--bg-primary)",
                  color: "var(--text-secondary)",
                  fontSize: 12,
                  lineHeight: 1.65,
                  padding: 12,
                }}
              >
                {scan.clean_text}
              </pre>
            ) : null}
          </div>
        ) : null}

        <style>{`
          @media(max-width:760px){
            .scan-report-grid{grid-template-columns:1fr !important}
            .scan-detail-shell{padding:16px !important}
            .scan-detail-header{padding:16px 14px !important}
          }
        `}</style>
      </div>
    </div>
  );
}
