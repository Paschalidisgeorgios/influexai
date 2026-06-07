"use client";

import { useEffect, useState } from "react";

const STEPS = [
  "Anfrage verstehen",
  "DNA laden",
  "Zielgruppe",
  "Plattform",
  "Trend-Fit",
  "Hook gen.",
  "Spot-Text",
  "CTA",
  "Caption",
  "Hashtags",
  "Risk",
  "Fertig",
];

const DEMOS = [
  {
    tool: "Script Generator",
    user: "Schreib mir ein TikTok-Script über meine Fitness-App.",
    agent: "Ich erstelle Hook, Story, CTA und Hashtags.",
    tags: ["Fitness", "TikTok", "3 Credits"],
    title: "SCRIPT BEREIT",
    score: "Hook Score 91 · Risk LOW",
    blocks: [
      {
        l: "🎬 Hook",
        t: '"Du trainierst seit Monaten ohne Ergebnisse. Das hier ändert alles."',
        bold: true,
      },
      {
        l: "📖 Story",
        t: "Ich hab 6 Monate trainiert ohne Plan. Dann diese App — in 8 Wochen mehr erreicht als davor.",
      },
      { l: "🎯 CTA", t: "7 Tage gratis. Kein Abo. Link in Bio." },
    ],
    hashtags: ["#FitnessApp", "#Training2026", "#TikTokFitness"],
    scores: [
      ["Hook Score", "91"],
      ["Klarheit", "88"],
      ["CTA", "85"],
    ],
  },
  {
    tool: "Viral Hook Extraktor",
    user: "Gib mir 5 virale Hooks für meine Immobilien-Seite.",
    agent: "Ich analysiere Trend-Muster und extrahiere 5 Hooks.",
    tags: ["Immobilien", "Instagram", "1 Credit"],
    title: "5 HOOKS BEREIT",
    score: "Avg. Score 87 · Risk LOW",
    blocks: [
      {
        l: "Hook 1",
        t: '"Diese Wohnung hat sich in 4 Stunden verkauft."',
        bold: true,
      },
      { l: "Hook 2", t: '"Die meisten Makler verschweigen dir das."' },
      { l: "Hook 3", t: '"Deine Wohnung ist mehr wert als du denkst."' },
    ],
    hashtags: ["#Immobilien", "#Makler", "#Wohnung"],
    scores: [
      ["Viral-Fit", "91"],
      ["Klarheit", "85"],
      ["CTA", "82"],
    ],
  },
  {
    tool: "Produkt-Werbung",
    user: "Erstelle eine Reel-Ad für meine KI-Steuer-App.",
    agent: "Ich erstelle Hook, Spot-Text, CTA und Caption.",
    tags: ["Finance", "Instagram Reels", "5 Credits"],
    title: "AD SCRIPT BEREIT",
    score: "Hook Score 88 · Risk LOW",
    blocks: [
      {
        l: "🎬 Hook",
        t: '"Selbstständig und trotzdem keine Steuer-Panik."',
        bold: true,
      },
      {
        l: "📖 Spot-Text",
        t: "Ich hab früher jede Erklärung verschoben. Jetzt dauert's 12 Minuten.",
      },
      { l: "🎯 CTA", t: "14 Tage kostenlos — Link in Bio." },
    ],
    hashtags: ["#Steuern2026", "#Freelancer", "#KI"],
    scores: [
      ["Hook Score", "88"],
      ["Klarheit", "91"],
      ["CTA", "82"],
    ],
  },
  {
    tool: "Content Kalender",
    user: "Erstelle einen Content-Kalender für 1 Woche TikTok.",
    agent: "Ich plane 7 Tage Content mit Formaten und Zeiten.",
    tags: ["Content Plan", "TikTok", "2 Credits"],
    title: "KALENDER BEREIT",
    score: "Plattform-Fit HIGH · Risk LOW",
    blocks: [
      { l: "Mo", t: "Behind the Scenes — wie dein Produkt entsteht" },
      { l: "Mi", t: "Tutorial — 3 Tricks in 30 Sekunden" },
      { l: "Fr", t: "UGC-Style Testimonial — authentisch & direkt" },
    ],
    hashtags: ["#ContentPlan", "#TikTok", "#Creator"],
    scores: [
      ["Posts", "7"],
      ["Formate", "4"],
      ["Reichweite", "HIGH"],
    ],
  },
  {
    tool: "Bild Generator",
    user: "Erstelle ein Beauty-Ad Bild ohne Text und Logo.",
    agent: "Ich generiere Bildprompt mit Hard Constraints.",
    tags: ["Beauty", "Instagram", "3 Credits"],
    title: "BILD-BRIEFING BEREIT",
    score: "Quality HIGH · Risk LOW",
    blocks: [
      {
        l: "✅ Positiv",
        t: "One adult female subject, soft studio lighting, beauty editorial style",
        bold: true,
      },
      {
        l: "❌ Negativ",
        t: "man, text overlay, logo, extra people, distorted anatomy",
      },
      { l: "📌 Hinweis", t: "Text und Logo als Design-Overlay hinzufügen." },
    ],
    hashtags: ["#BeautyAd", "#AIImage", "#InfluexAI"],
    scores: [
      ["Gender", "✓"],
      ["Anatomy", "✓"],
      ["Kein Text", "✓"],
    ],
  },
  {
    tool: "Mein KI-Ich",
    user: "Erstelle meinen KI-Avatar aus meinem Foto.",
    agent: "Ich erstelle deinen personalisierten Avatar.",
    tags: ["Avatar", "fal.ai", "3 Credits"],
    title: "AVATAR BEREIT",
    score: "Face-Match HIGH · Consent ✓",
    blocks: [
      {
        l: "✅ Status",
        t: "Gesicht erkannt — Avatar generiert",
        bold: true,
      },
      { l: "📸 Stil", t: "Professional Creator Look — clean, modern" },
      { l: "🔒 Consent", t: "Nur dein eigenes Bildmaterial verwendet." },
    ],
    hashtags: ["#KIAvatar", "#Creator", "#InfluexAI"],
    scores: [
      ["Face-Fit", "98%"],
      ["Stil", "HIGH"],
      ["Safety", "✓"],
    ],
  },
  {
    tool: "Thumbnail Konzept",
    user: "Erstelle 3 Thumbnail-Konzepte für mein YouTube-Video.",
    agent: "Ich erstelle 3 Varianten mit Visual-Briefing.",
    tags: ["YouTube", "Thumbnail", "2 Credits"],
    title: "3 KONZEPTE BEREIT",
    score: "CTR-Fit HIGH · Risk LOW",
    blocks: [
      {
        l: "Variante 1",
        t: "Gesicht groß + Schockgesicht + roter Text",
        bold: true,
      },
      { l: "Variante 2", t: "Split-Screen vorher/nachher + gelber Rahmen" },
      { l: "Variante 3", t: "Dunkler Hintergrund + Neon-Text + Produktshot" },
    ],
    hashtags: ["#Thumbnail", "#YouTube", "#CTR"],
    scores: [
      ["CTR-Score", "89"],
      ["Klarheit", "87"],
      ["Visual", "HIGH"],
    ],
  },
  {
    tool: "Trend → Script",
    user: "Welche Trends laufen auf TikTok DE? Schreib ein Script.",
    agent: "Ich analysiere aktuelle Trends und erstelle Script.",
    tags: ["Trend-Analyse", "TikTok DE", "3 Credits"],
    title: "TREND-SCRIPT BEREIT",
    score: "Trend-Fit HIGH · Risk LOW",
    blocks: [
      { l: "📈 Trend", t: '"Quiet Luxury" trending in DE', bold: true },
      { l: "🎬 Hook", t: '"Kein Lärm. Kein Drama. Nur Ergebnisse."' },
      {
        l: "📖 Script",
        t: "Ich hab meinen Content-Stil geändert. Die Zahlen haben sich verdoppelt.",
      },
    ],
    hashtags: ["#QuietLuxury", "#TikTokDE", "#Trend"],
    scores: [
      ["Trend-Fit", "94"],
      ["Timing", "HIGH"],
      ["Viral", "88"],
    ],
  },
  {
    tool: "LoRA Training",
    user: "Trainiere ein LoRA-Modell für meine Produktbilder.",
    agent: "Ich starte das Training mit deinen Referenzbildern.",
    tags: ["LoRA", "fal.ai", "variabel"],
    title: "TRAINING GESTARTET",
    score: "Steps 1000 · ETA 8 Min",
    blocks: [
      {
        l: "✅ Status",
        t: "Training läuft — 23% abgeschlossen",
        bold: true,
      },
      { l: "📊 Parameter", t: "Steps: 1000 · LR: 0.0004 · 512px" },
      { l: "🎯 Ergebnis", t: "Modell wird in der Gallery gespeichert." },
    ],
    hashtags: ["#LoRA", "#AITraining", "#Custom"],
    scores: [
      ["Steps", "1000"],
      ["Progress", "23%"],
      ["ETA", "8 Min"],
    ],
  },
  {
    tool: "Stimme & Musik",
    user: "Erstelle ein Voiceover für mein TikTok-Video.",
    agent: "Ich generiere dein Voiceover mit InfluexAI Voice.",
    tags: ["ElevenLabs", "Voiceover", "3 Credits"],
    title: "VOICEOVER BEREIT",
    score: "Voice-Fit HIGH · Quality HD",
    blocks: [
      {
        l: "🎙️ Stimme",
        t: "Professional DE · Warm & Direct · 128kbps",
        bold: true,
      },
      { l: "📝 Text", t: '"Keine Steuer-Panik. 14 Tage gratis testen."' },
      { l: "⏱️ Dauer", t: "8 Sekunden · MP3 · Bereit zum Download" },
    ],
    hashtags: ["#Voiceover", "#AIVoice", "#TikTok"],
    scores: [
      ["Qualität", "HD"],
      ["Dauer", "8s"],
      ["Format", "MP3"],
    ],
  },
  {
    tool: "Live Creator",
    user: "Starte einen KI-Avatar Live-Stream für TikTok.",
    agent: "Ich bereite deinen LiveSwap™ Avatar vor.",
    tags: ["Akool LiveSwap™", "TikTok Live", "10 Credits"],
    title: "AVATAR LIVE BEREIT",
    score: "Face-Match HIGH · Latency LOW",
    blocks: [
      {
        l: "🎭 Avatar",
        t: "Dein KI-Gesicht ist geladen und bereit",
        bold: true,
      },
      { l: "📡 Stream", t: "RTMP-Link bereit · TikTok Live · 1080p" },
      { l: "🔒 Consent", t: "Einwilligung bestätigt." },
    ],
    hashtags: ["#LiveCreator", "#AIAvatar", "#TikTokLive"],
    scores: [
      ["Latenz", "<200ms"],
      ["Auflösung", "1080p"],
      ["FPS", "30"],
    ],
  },
  {
    tool: "Campaign Autopilot",
    user: "Erstelle 1 Monat Content für meine Immobilienfirma.",
    agent: "Ich plane 30 Tage — Reels, Carousels, Stories, Ads.",
    tags: ["Monthly Campaign", "Multi-Platform", "80 Credits"],
    title: "KAMPAGNE BEREIT",
    score: "Brand-Fit 88 · Risk LOW",
    blocks: [
      {
        l: "📅 Plan",
        t: "30 Tage · 24 Reels · 8 Carousels · 4 Ads",
        bold: true,
      },
      {
        l: "🏢 Brand DNA",
        t: "Immobilien DE · Seriös & Modern · Keine Preisgarantien",
      },
      { l: "🎯 Ziel", t: "Reichweite & Trust · CTA: Beratungsgespräch buchen" },
    ],
    hashtags: ["#Immobilien", "#Kampagne", "#Autopilot"],
    scores: [
      ["Items", "38"],
      ["Plattformen", "3"],
      ["Brand-Fit", "88"],
    ],
  },
];

export function AgentPreviewDemo() {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [demoIdx, setDemoIdx] = useState(0);

  const demo = DEMOS[demoIdx];

  useEffect(() => {
    setStep(0);
    setDone(false);
  }, [demoIdx]);

  useEffect(() => {
    if (done) return;
    if (step >= STEPS.length) {
      setDone(true);
      return;
    }
    const t = setTimeout(
      () => setStep((s) => s + 1),
      step < STEPS.length - 1 ? 500 : 0
    );
    return () => clearTimeout(t);
  }, [step, done]);

  const pct = Math.round((step / STEPS.length) * 100);

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 440,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        fontFamily: "DM Sans, sans-serif",
      }}
    >
      <div
        style={{
          fontSize: 10,
          color: "#B4FF00",
          letterSpacing: "0.14em",
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#B4FF00",
            boxShadow: "0 0 6px #B4FF00",
            display: "inline-block",
          }}
        />
        AGENT PREVIEW · {demo.tool}
      </div>

      <div
        style={{
          background: "rgba(180,255,0,0.07)",
          border: "1px solid rgba(180,255,0,0.2)",
          borderRadius: 4,
          padding: "10px 14px",
        }}
      >
        <div
          style={{
            fontSize: 9,
            color: "#B4FF00",
            letterSpacing: "0.12em",
            fontWeight: 700,
            textTransform: "uppercase",
            marginBottom: 4,
          }}
        >
          DU
        </div>
        <div
          style={{
            fontSize: 13,
            color: "rgba(255,255,255,0.9)",
            lineHeight: 1.5,
          }}
        >
          {demo.user}
        </div>
      </div>

      <div
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 4,
          padding: "10px 14px",
        }}
      >
        <div
          style={{
            fontSize: 9,
            color: "rgba(255,255,255,0.35)",
            letterSpacing: "0.12em",
            fontWeight: 700,
            textTransform: "uppercase",
            marginBottom: 4,
          }}
        >
          AGENT
        </div>
        <div
          style={{
            fontSize: 13,
            color: "rgba(255,255,255,0.7)",
            lineHeight: 1.5,
          }}
        >
          {demo.agent}
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {demo.tags.map((t) => (
          <span
            key={t}
            style={{
              padding: "3px 10px",
              borderRadius: 3,
              border: "1px solid rgba(255,255,255,0.15)",
              fontSize: 11,
              color: "rgba(255,255,255,0.55)",
            }}
          >
            {t}
          </span>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span
            style={{
              fontSize: 10,
              color: "rgba(255,255,255,0.4)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            AUSFÜHRUNG
          </span>
          <span style={{ fontSize: 11, color: "#B4FF00", fontWeight: 700 }}>
            {step} / {STEPS.length}
          </span>
        </div>
        <div
          style={{
            height: 3,
            background: "rgba(255,255,255,0.08)",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              background: "#B4FF00",
              borderRadius: 2,
              width: `${pct}%`,
              transition: "width 0.3s ease",
            }}
          />
        </div>
        <div style={{ fontSize: 11, color: "#B4FF00", minHeight: 16 }}>
          {!done && step < STEPS.length ? STEPS[step] : ""}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4,1fr)",
            gap: 4,
          }}
        >
          {STEPS.map((s, i) => (
            <div
              key={s}
              style={{
                padding: "4px 3px",
                borderRadius: 3,
                textAlign: "center",
                fontSize: 9,
                lineHeight: 1.2,
                border:
                  i < step
                    ? "1px solid rgba(180,255,0,0.3)"
                    : i === step
                      ? "1px solid #B4FF00"
                      : "1px solid rgba(255,255,255,0.08)",
                background:
                  i < step
                    ? "rgba(180,255,0,0.04)"
                    : i === step
                      ? "#B4FF00"
                      : "rgba(255,255,255,0.03)",
                color:
                  i < step
                    ? "rgba(180,255,0,0.7)"
                    : i === step
                      ? "#060608"
                      : "rgba(255,255,255,0.3)",
                fontWeight: i === step ? 700 : 400,
              }}
            >
              {s}
            </div>
          ))}
        </div>
      </div>

      {done && (
        <div
          style={{
            border: "1px solid rgba(180,255,0,0.25)",
            borderRadius: 6,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "10px 14px",
              borderBottom: "1px solid rgba(255,255,255,0.07)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: 11,
                color: "#B4FF00",
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              ✓ {demo.title}
            </span>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>
              {demo.score}
            </span>
          </div>
          <div
            style={{
              padding: "12px 14px",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {demo.blocks.map((b) => (
              <div key={b.l}>
                <div
                  style={{
                    fontSize: 9,
                    color: "rgba(180,255,0,0.6)",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    fontWeight: 700,
                    marginBottom: 3,
                  }}
                >
                  {b.l}
                </div>
                <div
                  style={{
                    fontSize: b.bold ? 13 : 12,
                    color: b.bold ? "#fff" : "rgba(255,255,255,0.75)",
                    fontWeight: b.bold ? 600 : 400,
                    lineHeight: 1.5,
                  }}
                >
                  {b.t}
                </div>
              </div>
            ))}

            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {demo.hashtags.map((h) => (
                <span
                  key={h}
                  style={{
                    fontSize: 10,
                    color: "rgba(180,255,0,0.7)",
                    background: "rgba(180,255,0,0.08)",
                    border: "1px solid rgba(180,255,0,0.15)",
                    borderRadius: 3,
                    padding: "2px 6px",
                  }}
                >
                  {h}
                </span>
              ))}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3,1fr)",
                gap: 5,
              }}
            >
              {demo.scores.map(([l, v]) => (
                <div
                  key={l}
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 4,
                    padding: "6px 8px",
                  }}
                >
                  <div
                    style={{
                      fontSize: 9,
                      color: "rgba(255,255,255,0.35)",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                    }}
                  >
                    {l}
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#B4FF00",
                    }}
                  >
                    {v}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              padding: "8px 14px",
              borderTop: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              gap: 8,
              alignItems: "center",
            }}
          >
            <button
              type="button"
              style={{
                padding: "5px 12px",
                borderRadius: 3,
                border: "1px solid rgba(180,255,0,0.3)",
                background: "transparent",
                color: "rgba(180,255,0,0.8)",
                fontSize: 11,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Kopieren
            </button>
            <button
              type="button"
              style={{
                padding: "5px 12px",
                borderRadius: 3,
                border: "none",
                background: "#B4FF00",
                color: "#060608",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Exportieren
            </button>
            <button
              type="button"
              onClick={() => setDemoIdx((i) => (i + 1) % DEMOS.length)}
              style={{
                marginLeft: "auto",
                padding: "5px 12px",
                borderRadius: 3,
                border: "1px solid rgba(255,255,255,0.15)",
                background: "transparent",
                color: "rgba(255,255,255,0.5)",
                fontSize: 11,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Nächstes Tool →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
