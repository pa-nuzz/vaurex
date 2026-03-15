export default function Loading() {
  return (
    <div style={{
      display: "flex", justifyContent: "center", alignItems: "center",
      height: "100vh", background: "#09090B",
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: 36, height: 36,
          border: "3px solid rgba(255,255,255,0.08)",
          borderTop: "3px solid #FF5A1F",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
          margin: "0 auto 14px",
        }} />
        <p style={{ color: "#71717A", fontSize: 13 }}>Loading Vaurex…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
