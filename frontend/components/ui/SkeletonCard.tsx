"use client";

interface SkeletonCardProps {
  variant?: "stats-card" | "scan-row" | "chat-message" | "collection-card";
}

export default function SkeletonCard({ variant = "stats-card" }: SkeletonCardProps) {
  const baseClass = "animate-pulse";
  
  switch (variant) {
    case "stats-card":
      return (
        <div className={`${baseClass} p-6 rounded-lg border`} style={{ background: "var(--bg-1)", borderColor: "var(--border)" }}>
          <div className="h-4 rounded mb-3" style={{ background: "var(--bg-2)", width: "60%" }}></div>
          <div className="h-8 rounded mb-2" style={{ background: "var(--bg-2)", width: "40%" }}></div>
          <div className="h-3 rounded" style={{ background: "var(--bg-2)", width: "80%" }}></div>
        </div>
      );
      
    case "scan-row":
      return (
        <div className={`${baseClass} flex items-center gap-4 p-4 rounded-lg border`} style={{ background: "var(--bg-1)", borderColor: "var(--border)" }}>
          <div className="w-3 h-3 rounded-full" style={{ background: "var(--bg-2)" }}></div>
          <div className="flex-1">
            <div className="h-4 rounded mb-2" style={{ background: "var(--bg-2)", width: "70%" }}></div>
            <div className="h-3 rounded" style={{ background: "var(--bg-2)", width: "40%" }}></div>
          </div>
          <div className="h-6 rounded" style={{ background: "var(--bg-2)", width: "60px" }}></div>
        </div>
      );
      
    case "chat-message":
      return (
        <div className={`${baseClass} flex gap-3 mb-4`}>
          <div className="w-8 h-8 rounded-full" style={{ background: "var(--bg-2)" }}></div>
          <div className="flex-1">
            <div className="p-4 rounded-lg" style={{ background: "var(--bg-1)", borderColor: "var(--border)", border: "1px solid" }}>
              <div className="h-3 rounded mb-2" style={{ background: "var(--bg-2)", width: "90%" }}></div>
              <div className="h-3 rounded mb-2" style={{ background: "var(--bg-2)", width: "75%" }}></div>
              <div className="h-3 rounded" style={{ background: "var(--bg-2)", width: "85%" }}></div>
            </div>
          </div>
        </div>
      );
      
    case "collection-card":
      return (
        <div className={`${baseClass} p-6 rounded-lg border`} style={{ background: "var(--bg-1)", borderColor: "var(--border)" }}>
          <div className="h-5 rounded mb-3" style={{ background: "var(--bg-2)", width: "70%" }}></div>
          <div className="h-3 rounded mb-4" style={{ background: "var(--bg-2)", width: "90%" }}></div>
          <div className="flex items-center justify-between">
            <div className="h-4 rounded" style={{ background: "var(--bg-2)", width: "80px" }}></div>
            <div className="h-8 rounded" style={{ background: "var(--bg-2)", width: "100px" }}></div>
          </div>
        </div>
      );
      
    default:
      return null;
  }
}
