"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function WorkbenchError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Workbench error:", error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0C0E12",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
        padding: 24,
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <div
        style={{
          width: 60,
          height: 60,
          borderRadius: 16,
          background: "rgba(239,68,68,0.1)",
          border: "1px solid rgba(239,68,68,0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 28,
        }}
      >
        ⚠️
      </div>

      <div style={{ textAlign: "center", maxWidth: 380 }}>
        <h1
          style={{
            color: "#EEF0F5",
            fontSize: 20,
            fontWeight: 700,
            marginBottom: 8,
            letterSpacing: "-0.02em",
          }}
        >
          Something went wrong
        </h1>
        <p
          style={{
            color: "#4A5060",
            fontSize: 14,
            lineHeight: 1.65,
            marginBottom: 4,
          }}
        >
          The workbench ran into an unexpected error. Your data is safe — this
          is a display issue only.
        </p>
        {error?.digest && (
          <p style={{ color: "#2A3040", fontSize: 11, marginTop: 6 }}>
            Error ID: {error.digest}
          </p>
        )}
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
        <button
          onClick={reset}
          style={{
            padding: "10px 22px",
            background: "#FF7A35",
            color: "white",
            border: "none",
            borderRadius: 9,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            transition: "opacity 0.15s",
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "0.85")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "1")}
        >
          Try again
        </button>
        <Link
          href="/"
          style={{
            padding: "10px 22px",
            background: "transparent",
            color: "#8A90A0",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 9,
            fontSize: 13,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Go home
        </Link>
      </div>
    </div>
  );
}