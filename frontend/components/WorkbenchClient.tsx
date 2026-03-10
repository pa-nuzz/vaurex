"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Upload, FileText, Loader2, CheckCircle, AlertTriangle, XCircle,
  Sparkles, LogOut, Clock, ChevronRight, BarChart3, Users, FileSearch,
  AlertCircle, Shield, Trash2, RefreshCw,
} from "lucide-react";

/* ── Types ── */
interface Entity {
  type: string;
  value: string;
  context?: string;
}
interface ScanResult {
  id: string;
  filename: string;
  status: "processing" | "done" | "error" | "failed" | "failure";
  risk_score?: number;
  risk_label?: string;
  summary?: string;
  entities?: Entity[];
  flags?: string[];
  error_message?: string;
  created_at: string;
}

/* ── Risk helpers ── */
function riskColor(score: number) {
  if (score <= 35) return "#10B981";
  if (score <= 55) return "#F59E0B";
  if (score <= 75) return "#EF4444";
  return "#DC2626";
}
function riskLabel(score: number) {
  if (score <= 15) return "Benign";
  if (score <= 35) return "Low";
  if (score <= 55) return "Medium";
  if (score <= 75) return "High";
  return "Critical";
}

/* ── Risk Gauge SVG ── */
function RiskGauge({ score }: { score: number }) {
  const r = 56, stroke = 8, circ = 2 * Math.PI * r;
  const pct = Math.min(score, 100) / 100;
  const color = riskColor(score);
  return (
    <div style={{ position: "relative", width: 140, height: 140 }}>
      <svg width="140" height="140" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="70" cy="70" r={r} fill="none" stroke="var(--border-secondary)" strokeWidth={stroke} />
        <circle cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
          strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span className="font-display" style={{ fontSize: 32, fontWeight: 800, color, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", marginTop: 4 }}>{riskLabel(score)}</span>
      </div>
    </div>
  );
}

/* ── Entity group ── */
function EntityGroup({ entities }: { entities: Entity[] }) {
  const grouped: Record<string, Entity[]> = {};
  entities.forEach(e => { (grouped[e.type] ||= []).push(e); });
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {Object.entries(grouped).map(([type, items]) => (
        <div key={type}>
          <div style={{
            fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em",
            color: "var(--accent-primary)", marginBottom: 6,
          }}>{type}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {items.map((e, i) => (
              <span key={i} className="badge-accent">{e.value}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function WorkbenchClient() {
  const router   = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const fileRef  = useRef<HTMLInputElement>(null);

  const [user, setUser]       = useState<{ id: string; email?: string } | null>(null);
  const [file, setFile]       = useState<File | null>(null);
  const [dragOver, setDrag]   = useState(false);
  const [scanning, setScanning]     = useState(false);
  const [scanId, setScanId]         = useState<string | null>(null);
  const [result, setResult]         = useState<ScanResult | null>(null);
  const [history, setHistory]       = useState<ScanResult[]>([]);
  const [tab, setTab]               = useState<"scan" | "history">("scan");
  const [error, setError]           = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval>>();
  const pollStartRef = useRef<number | null>(null);

  const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  /* Auth */
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push("/login");
        return;
      }
      setUser({ id: user.id, email: user.email });
    });
  }, [router, supabase]);

  /* Fetch history */
  const fetchHistory = useCallback(async () => {
    if (!user) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    try {
      const res = await fetch(`${BACKEND}/scans`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const scans = await res.json();
        setHistory(scans);
      }
    } catch { /* silent */ }
  }, [user, BACKEND]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  /* Poll for results */
  useEffect(() => {
    if (!scanId || !user) return;

    pollStartRef.current = Date.now();

    pollRef.current = setInterval(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          clearInterval(pollRef.current);
          setScanning(false);
          setError("Session expired. Please sign in again.");
          return;
        }

        const res = await fetch(`${BACKEND}/scans/${scanId}/poll`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        if (!res.ok) {
          if (res.status === 404) {
            clearInterval(pollRef.current);
            setScanning(false);
            setError("Scan not found or access denied.");
          }
          return;
        }

        const data = await res.json();
        const status = (data.status || "").toLowerCase();
        const terminal = ["done", "error", "failed", "failure"].includes(status);

        if (terminal) {
          clearInterval(pollRef.current);
          setResult({ ...data, status: status === "failure" ? "failed" : status });
          setScanning(false);
          fetchHistory();
          return;
        }

        const startedAt = pollStartRef.current ?? Date.now();
        if (Date.now() - startedAt > 180000) {
          clearInterval(pollRef.current);
          setScanning(false);
          setError("Analysis timed out. Please try again.");
        }
      } catch {
        // keep polling until timeout
      }
    }, 2000);

    return () => clearInterval(pollRef.current);
  }, [scanId, BACKEND, fetchHistory, supabase, user]);

  /* Upload */
  async function handleUpload() {
    if (!file) return;
    setScanning(true); setError(""); setResult(null); setScanId(null);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setError("Session expired. Please sign in again."); setScanning(false); return; }

    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch(`${BACKEND}/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: form,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || `Upload failed (${res.status})`);
      }
      const { scan_id } = await res.json();
      setScanId(scan_id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setScanning(false);
    }
  }

  /* Drag handlers */
  function onDrop(e: React.DragEvent) {
    e.preventDefault(); setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login"); router.refresh();
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", position: "relative", zIndex: 1 }}>
      {/* ── Top Nav ── */}
      <nav className="glass" style={{
        position: "sticky", top: 0, zIndex: 40,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 24px", borderBottom: "1px solid var(--border-primary)",
        borderRadius: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
            background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
          }}>
            <Sparkles size={14} color="white" fill="white" />
          </div>
          <span className="font-display" style={{ fontWeight: 800, fontSize: 16, color: "var(--text-primary)" }}>Vaurex</span>
          <span className="badge-accent" style={{ marginLeft: 8 }}>Workbench</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{user?.email}</span>
          <button onClick={signOut} className="btn-ghost" style={{ padding: "6px 12px", fontSize: 12, gap: 6 }}>
            <LogOut size={13} /> Sign out
          </button>
        </div>
      </nav>

      {/* ── Tab Bar ── */}
      <div style={{
        display: "flex", gap: 0, maxWidth: 900, margin: "24px auto 0", padding: "0 24px",
      }}>
        {(["scan", "history"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: "12px 0", fontSize: 14, fontWeight: 600, cursor: "pointer",
            background: "none", border: "none", borderBottom: `2px solid ${tab === t ? "var(--accent-primary)" : "var(--border-primary)"}`,
            color: tab === t ? "var(--text-primary)" : "var(--text-muted)",
            transition: "all 0.2s",
          }}>
            {t === "scan" ? "New Scan" : "History"}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px 80px" }}>
        {tab === "scan" ? (
          <>
            {/* ── Upload Zone ── */}
            {!scanning && !result && (
              <div
                onDragOver={e => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={onDrop}
                onClick={() => fileRef.current?.click()}
                className="card-glow"
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  textAlign: "center", minHeight: 260, cursor: "pointer",
                  borderStyle: "dashed",
                  borderColor: dragOver ? "var(--accent-primary)" : file ? "var(--cyan-border)" : "var(--accent-border)",
                  background: dragOver ? "var(--accent-surface)" : file ? "var(--cyan-surface)" : "var(--bg-secondary)",
                  transition: "all 0.2s",
                }}
              >
                <input ref={fileRef} type="file" hidden accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.bmp,.tiff"
                  onChange={e => { if (e.target.files?.[0]) setFile(e.target.files[0]); }} />

                {file ? (
                  <>
                    <div style={{
                      width: 56, height: 56, borderRadius: 14, marginBottom: 16,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: "var(--cyan-surface)", border: "1.5px solid var(--cyan-border)",
                    }}>
                      <FileText size={24} color="var(--cyan)" />
                    </div>
                    <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>{file.name}</p>
                    <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>
                      {(file.size / 1024).toFixed(0)} KB
                    </p>
                    <div style={{ display: "flex", gap: 10 }}>
                      <button onClick={(e) => { e.stopPropagation(); handleUpload(); }} className="btn-primary" style={{ padding: "10px 24px" }}>
                        Scan document <Sparkles size={14} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setFile(null); }} className="btn-ghost" style={{ padding: "10px 16px" }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{
                      width: 56, height: 56, borderRadius: 14, marginBottom: 16,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: "var(--accent-surface)", border: "1.5px dashed var(--accent-border)",
                    }}>
                      <Upload size={24} color="var(--accent-primary)" />
                    </div>
                    <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
                      Drop a document here or click to browse
                    </p>
                    <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                      PDF, PNG, JPG, WEBP — up to 20 MB
                    </p>
                  </>
                )}
              </div>
            )}

            {/* ── Error ── */}
            {error && (
              <div style={{
                display: "flex", alignItems: "center", gap: 10, padding: 14, borderRadius: 12, marginTop: 16,
                background: "rgba(239,68,68,0.08)", border: "1.5px solid rgba(239,68,68,0.2)", color: "#EF4444", fontSize: 14,
              }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />{error}
              </div>
            )}

            {/* ── Scanning ── */}
            {scanning && !result && (
              <div className="card-glow" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", minHeight: 260, marginTop: 0 }}>
                <div className="animate-pulse-ring" style={{
                  width: 56, height: 56, borderRadius: 14, marginBottom: 20,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: "var(--accent-surface)",
                }}>
                  <Loader2 size={24} color="var(--accent-primary)" className="animate-spin" />
                </div>
                <p style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>
                  Analyzing document...
                </p>
                <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  AI pipeline is running — this usually takes 10–20 seconds.
                </p>
              </div>
            )}

            {/* ── Results ── */}
            {result && result.status === "done" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 0 }}>
                {/* Header */}
                <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <CheckCircle size={16} color="var(--cyan)" />
                      <span style={{ fontSize: 14, fontWeight: 600, color: "var(--cyan)" }}>Analysis complete</span>
                    </div>
                    <h2 className="font-display" style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>
                      {result.filename}
                    </h2>
                  </div>
                  <button onClick={() => { setResult(null); setFile(null); setScanId(null); }} className="btn-primary" style={{ padding: "10px 20px" }}>
                    <RefreshCw size={14} /> New scan
                  </button>
                </div>

                {/* Risk + Summary grid */}
                <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 20 }} className="results-grid">
                  {/* Risk gauge */}
                  <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minWidth: 200 }}>
                    <RiskGauge score={result.risk_score ?? 0} />
                    <div style={{ marginTop: 12, fontSize: 13, fontWeight: 600, color: riskColor(result.risk_score ?? 0), textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {result.risk_label || riskLabel(result.risk_score ?? 0)} Risk
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="card">
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                      <BarChart3 size={16} color="var(--accent-primary)" />
                      <h3 className="font-display" style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>Executive Summary</h3>
                    </div>
                    <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
                      {result.summary || "No summary available."}
                    </p>
                  </div>
                </div>

                {/* Entities */}
                {result.entities && result.entities.length > 0 && (
                  <div className="card">
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                      <Users size={16} color="var(--accent-primary)" />
                      <h3 className="font-display" style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
                        Extracted Entities ({result.entities.length})
                      </h3>
                    </div>
                    <EntityGroup entities={result.entities} />
                  </div>
                )}

                {/* Flags */}
                {result.flags && result.flags.length > 0 && (
                  <div className="card" style={{ borderColor: "rgba(239,68,68,0.15)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                      <Shield size={16} color="#EF4444" />
                      <h3 className="font-display" style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
                        Risk Flags ({result.flags.length})
                      </h3>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {result.flags.map((f, i) => (
                        <div key={i} style={{
                          display: "flex", alignItems: "flex-start", gap: 10, padding: 12, borderRadius: 10,
                          background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.1)",
                        }}>
                          <AlertTriangle size={14} color="#EF4444" style={{ flexShrink: 0, marginTop: 2 }} />
                          <span style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <style>{`
                  @media (max-width: 640px) {
                    .results-grid { grid-template-columns: 1fr !important; }
                  }
                `}</style>
              </div>
            )}

            {/* ── Error Result ── */}
            {result && ["error", "failed", "failure"].includes(result.status) && (
              <div className="card" style={{ textAlign: "center", marginTop: 0 }}>
                <XCircle size={32} color="#EF4444" style={{ margin: "0 auto 12px" }} />
                <h3 className="font-display" style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
                  Analysis failed
                </h3>
                <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 20 }}>
                  {result.error_message || "An error occurred while processing the document."}
                </p>
                <button onClick={() => { setResult(null); setFile(null); setScanId(null); }} className="btn-primary" style={{ padding: "10px 20px" }}>
                  Try again
                </button>
              </div>
            )}
          </>
        ) : (
          /* ── History Tab ── */
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {history.length === 0 ? (
              <div className="card" style={{ textAlign: "center", padding: 48 }}>
                <Clock size={28} color="var(--text-muted)" style={{ margin: "0 auto 12px" }} />
                <p style={{ color: "var(--text-muted)", fontSize: 15 }}>No scans yet. Run your first scan!</p>
                <button onClick={() => setTab("scan")} className="btn-primary" style={{ marginTop: 20, padding: "10px 24px" }}>
                  New scan <ChevronRight size={14} />
                </button>
              </div>
            ) : (
              history.map((scan) => (
                <button
                  key={scan.id}
                  onClick={() => { setResult(scan); setTab("scan"); }}
                  className="card-interactive"
                  style={{ display: "flex", alignItems: "center", gap: 16, textAlign: "left", width: "100%", border: "1px solid var(--border-primary)" }}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: scan.status === "done" ? "var(--cyan-surface)" : scan.status === "error" ? "rgba(239,68,68,0.08)" : "var(--accent-surface)",
                    border: `1px solid ${scan.status === "done" ? "var(--cyan-border)" : scan.status === "error" ? "rgba(239,68,68,0.2)" : "var(--accent-border)"}`,
                  }}>
                    {scan.status === "done" ? <FileSearch size={18} color="var(--cyan)" /> :
                     ["error", "failed", "failure"].includes(scan.status) ? <XCircle size={18} color="#EF4444" /> :
                     <Loader2 size={18} color="var(--accent-primary)" className="animate-spin" />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {scan.filename}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                      {new Date(scan.created_at).toLocaleDateString()} · {scan.status === "done" ? `Score: ${scan.risk_score}` : scan.status}
                    </div>
                  </div>
                  {scan.status === "done" && scan.risk_score != null && (
                    <div style={{
                      fontSize: 18, fontWeight: 800, color: riskColor(scan.risk_score),
                      fontFamily: "var(--font-sans)",
                    }}>
                      {scan.risk_score}
                    </div>
                  )}
                  <ChevronRight size={16} color="var(--text-muted)" />
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
