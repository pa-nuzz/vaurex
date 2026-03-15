"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, CheckCircle, FileText, Shield } from "lucide-react";

import EmptyState from "@/components/ui/EmptyState";
import SkeletonCard from "@/components/ui/SkeletonCard";
import { useToast } from "@/components/ui/Toast";
import { apiJson, safeUiError } from "@/lib/api";

type ComplianceReport = {
  report_id: string;
  scan_id: string;
  industry: string;
  overall_score: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  created_at: string;
};

export default function CompliancePage() {
  const [reports, setReports] = useState<ComplianceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const hasShownError = useRef(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiJson<{ success: boolean; data: { reports: ComplianceReport[] } }>(
          "/api/v1/compliance/reports",
          {},
          { auth: true, fallbackMessage: "Unable to load compliance reports." },
        );
        if (data.success) {
          setReports(data.data.reports ?? []);
        }
      } catch (error) {
        if (!hasShownError.current) {
          hasShownError.current = true;
          toast.error(safeUiError(error, "Unable to load compliance reports."));
        }
        setReports([]);
      } finally {
        setLoading(false);
      }
    };
    void load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scoreColor = (score: number) => {
    if (score >= 85) return "var(--success)";
    if (score >= 65) return "var(--warning)";
    return "var(--danger)";
  };

  const stats = {
    total: reports.length,
    critical: reports.reduce((count, report) => count + report.critical_count, 0),
    high: reports.reduce((count, report) => count + report.high_count, 0),
  };

  return (
    <div className="min-h-screen bg-[#09090B] relative overflow-y-auto w-full pt-10 pb-24 px-8">
      {/* Background glow */}
      <div className="fixed top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-orange-500/5 blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10 w-full mb-8">
        <Link 
          href="/workbench" 
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-10 text-sm font-medium tracking-wide"
        >
          <ArrowLeft size={16} /> Back to Workbench
        </Link>

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">Compliance Reports</h1>
          <p className="text-gray-400 text-sm">Review industry-specific compliance analysis across all your documents.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Stat Cards */}
          <div className="bg-white/[0.02] border border-white/[0.05] rounded-3xl p-6 backdrop-blur-xl relative overflow-hidden group hover:border-white/[0.1] transition-all duration-300">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute top-6 right-6 text-blue-500 opacity-60">
              <Shield size={24} />
            </div>
            <div className="text-4xl font-extrabold text-white mb-2">{stats.total}</div>
            <div className="text-gray-400 font-medium text-sm tracking-wide">Total Reports</div>
          </div>
          <div className="bg-white/[0.02] border border-white/[0.05] rounded-3xl p-6 backdrop-blur-xl relative overflow-hidden group hover:border-white/[0.1] transition-all duration-300">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-red-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute top-6 right-6 text-red-500 opacity-60">
              <AlertTriangle size={24} />
            </div>
            <div className="text-4xl font-extrabold text-red-400 mb-2">{stats.critical}</div>
            <div className="text-gray-400 font-medium text-sm tracking-wide">Critical Violations</div>
          </div>
          <div className="bg-white/[0.02] border border-white/[0.05] rounded-3xl p-6 backdrop-blur-xl relative overflow-hidden group hover:border-white/[0.1] transition-all duration-300">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-yellow-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute top-6 right-6 text-yellow-500 opacity-60">
              <CheckCircle size={24} />
            </div>
            <div className="text-4xl font-extrabold text-yellow-500 mb-2">{stats.high}</div>
            <div className="text-gray-400 font-medium text-sm tracking-wide">High Violations</div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col gap-4">
            <SkeletonCard variant="collection-card" />
            <SkeletonCard variant="collection-card" />
          </div>
        ) : reports.length === 0 ? (
          <EmptyState
            type="no-results"
            title="No compliance reports"
            description="Run compliance analysis from a scanned document to populate this view."
          />
        ) : (
          <div className="flex flex-col gap-4">
            {reports.map((report) => (
              <div 
                key={report.report_id} 
                className="bg-zinc-900 border border-white/[0.05] rounded-2xl p-6 hover:border-orange-500/40 transition-all duration-300 hover:shadow-[0_4px_30px_rgba(255,107,53,0.05)] group"
              >
                <div className="flex justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                        <FileText size={20} className="text-orange-500" />
                      </div>
                      <div>
                        <h3 className="text-white text-lg font-bold mb-0.5 tracking-tight group-hover:text-orange-400 transition-colors">
                          {report.industry} Compliance
                        </h3>
                        <p className="text-zinc-500 text-xs font-mono">ID: {report.report_id}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-4 mb-4">
                      <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-lg border border-white/[0.03]">
                        <div className="w-2 h-2 rounded-full bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.6)]" />
                        <span className="text-zinc-300 text-sm font-medium">Critical: {report.critical_count}</span>
                      </div>
                      <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-lg border border-white/[0.03]">
                        <div className="w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.6)]" />
                        <span className="text-zinc-300 text-sm font-medium">High: {report.high_count}</span>
                      </div>
                      <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-lg border border-white/[0.03]">
                        <div className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]" />
                        <span className="text-zinc-300 text-sm font-medium">Medium: {report.medium_count}</span>
                      </div>
                      <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-lg border border-white/[0.03]">
                        <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]" />
                        <span className="text-zinc-300 text-sm font-medium">Low: {report.low_count}</span>
                      </div>
                    </div>
                    
                    <p className="text-zinc-500 text-xs">
                      Analyzed on {new Date(report.created_at).toLocaleString(undefined, {
                        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                  
                  <div className="text-right flex-shrink-0 flex flex-col justify-center items-end ml-4 border-l border-white/[0.05] pl-8">
                    <div 
                      className="text-5xl font-black tabular-nums tracking-tighter"
                      style={{ color: scoreColor(report.overall_score) }}
                    >
                      {report.overall_score}
                    </div>
                    <div className="text-zinc-400 text-sm font-semibold tracking-wide uppercase mt-1">
                      Score
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
