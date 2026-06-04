import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
        background: "#060608",
        color: "#F0EFE8",
        fontFamily: "var(--font-dm), sans-serif",
        textAlign: "center",
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
          fontSize: "clamp(5rem, 15vw, 9rem)",
          letterSpacing: "0.04em",
          lineHeight: 1,
          color: "#B4FF00",
          marginBottom: 16,
        }}
      >
        404
      </p>
      <h1
        style={{
          fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
          fontSize: "clamp(1.5rem, 4vw, 2.5rem)",
          letterSpacing: "0.02em",
          marginBottom: 12,
        }}
      >
        Seite nicht gefunden
      </h1>
      <p style={{ color: "#505055", fontSize: "0.95rem", maxWidth: 400, marginBottom: 28, lineHeight: 1.65 }}>
        Die angeforderte Seite existiert nicht oder wurde verschoben.
      </p>
      <Link
        href="/"
        style={{
          padding: "12px 28px",
          borderRadius: 10,
          background: "#B4FF00",
          color: "#060608",
          fontWeight: 700,
          fontSize: "0.9rem",
          textDecoration: "none",
        }}
      >
        ← Zur Startseite
      </Link>
    </div>
  );
}
