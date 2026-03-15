export default function ComplianceLoading() {
  return (
    <div style={{ 
      display: "flex", 
      justifyContent: "center", 
      alignItems: "center", 
      height: "100vh",
      background: "var(--bg-0)"
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: 40,
          height: 40,
          border: "3px solid var(--border)",
          borderTop: "3px solid var(--accent)",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
          margin: "0 auto 16px"
        }} />
        <p style={{ color: "var(--text-2)", fontSize: 14 }}>Loading compliance...</p>
      </div>
    </div>
  );
}
