import type { ReactNode } from "react";

export type StackedDemoStep = {
  id: string;
  headline: string;
  description: string;
  badge: string;
  input: ReactNode;
  output: ReactNode;
};

export const STACKED_DEMO_STEPS: StackedDemoStep[] = [
  {
    id: "script",
    headline: "SCRIPT IN SEKUNDEN",
    description:
      "Virale Short-Scripts mit Hook, Story und CTA — als Content-Idee formuliert, kein Finanzrat.",
    badge: "Script Generator · 1 Credit",
    input: (
      <>
        Thema: &quot;So kaufst du deine erste Immobilie mit 25&quot;
        <br />
        TikTok · 30s
      </>
    ),
    output: (
      <>
        <p className="mb-2">
          <span style={{ color: "#B4FF00" }}>🎬 Hook:</span>
          <br />
          &quot;Die meisten glauben, Immobilien kaufen ist nur was für Reiche.
          Ich hab mit 25 angefangen — hier ist der Weg, den ich vorher gern
          gekannt hätte.&quot;
        </p>
        <p className="mb-2">
          <span style={{ color: "#B4FF00" }}>📖 Story:</span>
          <br />
          Kein Erbe, kein riesiges Gehalt. Erst Budget verstehen, Eigenkapital
          aufbauen, Förderoptionen prüfen und die erste Wohnung nicht emotional,
          sondern als Investment bewerten.
        </p>
        <p>
          <span style={{ color: "#B4FF00" }}>🎯 CTA:</span>
          <br />
          &quot;Kommentiere &apos;START&apos; — ich schick dir die Checkliste.&quot;
        </p>
      </>
    ),
  },
  {
    id: "product",
    headline: "ADS OHNE LEERES BLATT",
    description:
      "Produkt-Ads für Reels & Shorts — Mockup-Spot, keine Steuerberatung.",
    badge: "Produkt Werbung · 2 Credits",
    input: (
      <>
        Produkt: &quot;KI-Steuer-App für Selbstständige&quot;
        <br />
        Instagram Reels
      </>
    ),
    output: (
      <>
        <p className="mb-2">
          <span style={{ color: "#B4FF00" }}>🎬 Hook:</span>
          <br />
          &quot;Du verlierst Zeit in deiner Buchhaltung — weil deine Belege
          immer noch manuell sortiert werden.&quot;
        </p>
        <p className="mb-2">
          <span style={{ color: "#B4FF00" }}>📖 Spot-Text:</span>
          <br />
          TaxMind erkennt Belege, kategorisiert Ausgaben und bereitet deine
          Buchhaltung KI-gestützt vor. DATEV-kompatibel, DSGVO-konform.
        </p>
        <p>
          <span style={{ color: "#B4FF00" }}>#️⃣</span> #Steuer #Selbstständig
          #FinanzTipp #KI #Buchhaltung
        </p>
      </>
    ),
  },
  {
    id: "viral_hook",
    headline: "HOOKS, DIE STOPPEN",
    description:
      "Fünf Hook-Varianten für Beauty & Nachhaltigkeit — scroll-stoppend formuliert.",
    badge: "Viral Hook Extraktor · 1 Credit",
    input: (
      <>
        Thema: &quot;Nachhaltige Beauty-Routine unter 30€&quot;
        <br />
        TikTok
      </>
    ),
    output: (
      <ol className="m-0 list-decimal space-y-1.5 pl-4 text-[0.82rem]">
        <li>
          Ich hab meine komplette Beauty-Routine auf nachhaltig umgestellt — für
          unter 30€. Das brauchst du wirklich.
        </li>
        <li>
          Warum gibst du 80€ für Gesichtscreme aus, wenn deine Routine auch
          einfacher funktionieren kann?
        </li>
        <li>
          POV: Du findest heraus, dass dein Lieblingsprodukt nicht cruelty-free
          ist.
        </li>
        <li>
          Diese 5 Produkte ersetzen 12 meiner alten — und kosten zusammen weniger
          als eine Serum-Flasche.
        </li>
        <li>
          Das Ergebnis nach 30 Tagen nachhaltiger Skincare hat mich selbst
          überrascht.
        </li>
      </ol>
    ),
  },
  {
    id: "content_kalender",
    headline: "DEIN CONTENT-PLAN STEHT",
    description:
      "Wochenplan für Finance-Content — Formate, Themen und Posting-Zeiten als Mockup.",
    badge: "Content Kalender KI · 2 Credits",
    input: (
      <>
        Nische: Personal Finance / Geldanlage
        <br />
        Instagram · 5×/Woche
      </>
    ),
    output: (
      <>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[260px] border-collapse text-[0.78rem]">
            <tbody>
              {[
                ["Mo", 'ETF-Erklärvideo: "Was ist der MSCI World?"', "Reel 30s"],
                ["Di", 'Tipp: "Sparrate berechnen in 2 Min"', "Carousel"],
                ["Mi", "Story: Meine Depot-Routine diese Woche", "Story"],
                ["Do", 'Vergleich: "Tagesgeld vs. ETF 2026"', "Reel 60s"],
                ["Fr", 'Community-Frage: "Was ist euer Sparziel?"', "Post"],
              ].map(([day, topic, format]) => (
                <tr
                  key={day}
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <td
                    className="py-1 pr-2 font-bold align-top"
                    style={{ color: "#B4FF00", width: "2rem" }}
                  >
                    {day}
                  </td>
                  <td className="py-1 pr-2 align-top">{topic}</td>
                  <td
                    className="py-1 align-top whitespace-nowrap text-white/55"
                  >
                    {format}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[0.78rem]">
          ⏰ Beste Posting-Zeit: 18:00–20:00 Uhr
          <br />
          📈 Reichweiten-Potenzial: Hoch · 🔥 Trend-Signal: Steigend
        </p>
      </>
    ),
  },
  {
    id: "avatar",
    headline: "DEIN AVATAR BLEIBT KONSISTENT",
    description:
      "KI-Avatar aus einem Foto — konsistentes Gesicht für Reels, Ads und Brand-Content.",
    badge: "Mein KI-Ich · 3 Credits",
    input: (
      <>
        1 Foto · Stil: Professional / Tech-Creator
        <br />
        Modern Office
      </>
    ),
    output: (
      <div className="flex flex-col items-center text-center">
        <div
          className="mb-3 flex h-[100px] w-full max-w-[180px] items-center justify-center rounded-[12px] border border-dashed"
          style={{ borderColor: "#B4FF00" }}
        >
          <div
            className="rounded-full"
            style={{
              width: 80,
              height: 80,
              background: "rgba(180,255,0,0.2)",
            }}
            aria-hidden
          />
        </div>
        <p className="mb-2 font-semibold" style={{ color: "#B4FF00" }}>
          KI-Avatar Preview
        </p>
        <div className="mb-2 flex flex-wrap justify-center gap-1.5">
          {["Professional", "Studio BG", "Face Consistent"].map((tag) => (
            <span
              key={tag}
              className="rounded-full px-2 py-0.5 text-[0.68rem]"
              style={{
                border: "1px solid rgba(180,255,0,0.25)",
                color: "rgba(255,255,255,0.7)",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
        <p className="text-[0.72rem] text-white/55">
          Konsistentes Gesicht in jedem generierten Bild.
        </p>
      </div>
    ),
  },
];
