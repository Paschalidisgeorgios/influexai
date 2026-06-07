"use client";

export default function StimmeMusicPage() {
  const COMING_SOON = true; // auf false setzen wenn ElevenLabs ready

  if (COMING_SOON) {
    return (
      <div
        style={{
          minHeight: "60vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          background: "#060608",
          color: "#fff",
          fontFamily: "DM Sans, sans-serif",
        }}
      >
        <div
          style={{
            border: "1px solid rgba(180,255,0,0.2)",
            borderRadius: 4,
            padding: "32px 48px",
            textAlign: "center",
            maxWidth: 480,
            background: "rgba(255,255,255,0.02)",
          }}
        >
          <div
            style={{
              fontSize: 10,
              letterSpacing: "0.14em",
              color: "rgba(180,255,0,0.6)",
              textTransform: "uppercase",
              marginBottom: 16,
            }}
          >
            InfluexAI Voice
          </div>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: "#fff",
              letterSpacing: "0.04em",
              marginBottom: 12,
            }}
          >
            STIMME & MUSIK
          </h1>
          <p
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.5)",
              lineHeight: 1.6,
              marginBottom: 24,
            }}
          >
            KI-Voiceover und Musik für deine Videos — ohne Studio. Dieses Feature
            wird bald freigeschaltet.
          </p>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 16px",
              border: "1px solid rgba(180,255,0,0.25)",
              borderRadius: 4,
              fontSize: 11,
              color: "#B4FF00",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#B4FF00",
                boxShadow: "0 0 6px #B4FF00",
              }}
            />
            Coming Soon
          </div>
        </div>
      </div>
    );
  }

  // TODO: Echte UI wenn ElevenLabs verfügbar
  return null;
}
