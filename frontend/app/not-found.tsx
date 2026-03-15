export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#09090B",
        color: "#FAFAFA",
        fontFamily: "Inter, system-ui, sans-serif",
        padding: 24,
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: 28, marginBottom: 8 }}>Page not found</h1>
        <p style={{ color: "#A1A1AA", fontSize: 14 }}>
          The page you are looking for does not exist.
        </p>
      </div>
    </div>
  );
}
