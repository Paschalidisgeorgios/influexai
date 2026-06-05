import Link from "next/link";

export default function CreatorNotFound() {
  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        textAlign: "center",
      }}
    >
      <h1
        style={{
          fontFamily: "var(--font-bebas), sans-serif",
          fontSize: "2rem",
          color: "#F0EFE8",
          marginBottom: 12,
        }}
      >
        Profil nicht gefunden
      </h1>
      <p style={{ color: "rgba(255,255,255,0.65)", marginBottom: 24, maxWidth: 360 }}>
        Dieses Creator-Profil existiert nicht oder ist nicht öffentlich.
      </p>
      <Link
        href="/"
        style={{
          padding: "11px 24px",
          borderRadius: 10,
          background: "#B4FF00",
          color: "#060608",
          fontWeight: 700,
          textDecoration: "none",
        }}
      >
        Zur Startseite
      </Link>
    </div>
  );
}
