"use client";

const FLOWS = [
  {
    id: "live",
    icon: "🎭",
    title: "Live Creator",
    desc: "Streame live ohne dein Gesicht. Dein KI-Charakter übernimmt Mimik und Stimme in Echtzeit.",
    tags: ["Echtzeit", "Face Consistent", "Multi-Platform"],
    color: "#B4FF00",
    credits: "10 Credits / Min",
  },
  {
    id: "ki-ich",
    icon: "📸",
    title: "Mein KI-Ich",
    desc: "Lade ein Foto hoch und erscheine in jeder Szene der Welt. Konsistentes Gesicht in jedem Bild.",
    tags: ["4K", "Face Consistent", "Sofort"],
    color: "#06b6d4",
    credits: "4 Credits / Bild",
  },
  {
    id: "produkt",
    icon: "🛍️",
    title: "Produkt-Werbung",
    desc: "URL oder Produktfoto eingeben — fertiger Werbespot in TikTok, Reel und YouTube-Format.",
    tags: ["URL-to-Video", "A/B Varianten", "Multi-Format"],
    color: "#10b981",
    credits: "20 Credits / Video",
  },
  {
    id: "stimme",
    icon: "🎵",
    title: "Stimme & Musik",
    desc: "Klone deine Stimme in 60 Sekunden. Generiere lizenzfreie Musik für jeden Content-Typ.",
    tags: ["30+ Sprachen", "Lizenzfrei", "60 Sek. Klonung"],
    color: "#f59e0b",
    credits: "2 Credits / Min",
  },
];

export default function DashboardPage() {
  return (
    <div style={{ maxWidth: 960, margin: "0 auto" }}>
      {/* Welcome */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{
          fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
          fontSize: "clamp(2rem, 4vw, 3rem)",
          letterSpacing: "0.02em",
          lineHeight: 1,
          color: "#F0EFE8",
          marginBottom: 8,
        }}>
          Willkommen bei InfluexAI
        </h1>
        <p style={{ color: "#505055", fontSize: "0.9rem" }}>
          Wähle deinen Workflow und starte direkt.
        </p>
      </div>

      {/* Flow Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: 14,
      }}>
        {FLOWS.map((flow) => (
          <div
            key={flow.id}
            style={{
              padding: 28,
              borderRadius: 20,
              background: "#18181d",
              border: "1px solid rgba(255,255,255,0.07)",
              cursor: "pointer",
              transition: "all 0.2s",
              position: "relative",
              overflow: "hidden",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor = flow.color + "55";
              (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
              (e.currentTarget as HTMLDivElement).style.background = "#1e1e24";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.07)";
              (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
              (e.currentTarget as HTMLDivElement).style.background = "#18181d";
            }}
          >
            {/* Top accent line */}
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0,
              height: 2,
              background: flow.color,
              opacity: 0.5,
            }} />

            <div style={{ fontSize: "2rem", marginBottom: 14 }}>{flow.icon}</div>

            <div style={{
              fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
              fontSize: "1.6rem",
              letterSpacing: "0.02em",
              marginBottom: 8,
              color: "#F0EFE8",
            }}>
              {flow.title}
            </div>

            <p style={{
              fontSize: "0.875rem",
              color: "rgba(240,239,232,0.6)",
              lineHeight: 1.7,
              marginBottom: 14,
            }}>
              {flow.desc}
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 18 }}>
              {flow.tags.map((tag) => (
                <span key={tag} style={{
                  fontSize: "0.65rem",
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: 6,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  color: "rgba(255,255,255,0.35)",
                }}>
                  {tag}
                </span>
              ))}
            </div>

            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <span style={{
                fontSize: "0.75rem",
                color: flow.color,
                fontWeight: 600,
              }}>
                {flow.credits}
              </span>
              <button style={{
                padding: "9px 18px",
                borderRadius: 9,
                background: flow.color,
                color: "#060608",
                border: "none",
                fontWeight: 700,
                fontSize: "0.82rem",
                cursor: "pointer",
                fontFamily: "var(--font-dm), sans-serif",
                transition: "opacity 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.opacity = "0.85"}
              onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.opacity = "1"}
              >
                Starten →
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Stats row */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 12,
        marginTop: 20,
      }}>
        {[
          { label: "Generierungen heute", value: "0", sub: "von 100 täglich" },
          { label: "Credits verbleibend", value: "373", sub: "von 500 · Creator Plan" },
          { label: "Letzte Generierung", value: "—", sub: "Noch keine" },
        ].map((stat) => (
          <div key={stat.label} style={{
            padding: "18px 20px",
            borderRadius: 14,
            background: "#0f0f12",
            border: "1px solid rgba(255,255,255,0.07)",
          }}>
            <div style={{
              fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
              fontSize: "1.8rem",
              letterSpacing: "0.02em",
              color: "#F0EFE8",
              lineHeight: 1,
              marginBottom: 4,
            }}>
              {stat.value}
            </div>
            <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "rgba(240,239,232,0.7)", marginBottom: 2 }}>
              {stat.label}
            </div>
            <div style={{ fontSize: "0.72rem", color: "#505055" }}>{stat.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
