import type { ReactNode } from "react";

/** Static demo data for landing page — no API calls, no credits. */

export type HeroScene = {
  id: string;
  toolLabel: string;
  prompt: string;
  agentSteps: string[];
  agentSummary: string;
  outputs: { label: string; text: string }[];
  resultTitle: string;
  resultSubtitle: string;
  resultScore?: string;
  miniLabel: string;
};

export const heroScenes: HeroScene[] = [
  {
    id: "kalender",
    toolLabel: "Content Kalender",
    prompt: "Plane mir 7 Tage Content für eine Immobilienfirma.",
    agentSteps: [
      "Zielgruppe erkannt",
      "Themencluster erstellt",
      "Hooks optimiert",
      "Kalender formatiert",
    ],
    agentSummary: "Zielgruppe erkannt · Hooks erstellt · Kalender bereit",
    outputs: [
      { label: "Mo", text: "Immobilienwert erklären" },
      { label: "Mi", text: "Verkaufsfehler vermeiden" },
      { label: "Fr", text: "Eigentümer-CTA" },
    ],
    resultTitle: "7 Tage Content bereit",
    resultSubtitle: "Hook Score 91",
    resultScore: "Risk Low",
    miniLabel: "7 Posts · 3 Formate",
  },
  {
    id: "hooks",
    toolLabel: "Viral Hook",
    prompt: "Gib mir 5 starke Hooks für meine Immobilien-Seite.",
    agentSteps: [
      "Trend-Fit analysiert",
      "Hooks generiert",
      "Klarheit optimiert",
      "Risiko geprüft",
    ],
    agentSummary: "Scroll-Stop analysiert · 5 Hooks erstellt · Risk Check bestanden",
    outputs: [
      { label: "Hook 1", text: "Diese Wohnung war in 4 Stunden verkauft." },
      {
        label: "Hook 2",
        text: "Die meisten Eigentümer unterschätzen diesen Fehler.",
      },
      {
        label: "Hook 3",
        text: "Deine Wohnung ist vielleicht mehr wert, als du denkst.",
      },
    ],
    resultTitle: "5 Hooks bereit",
    resultSubtitle: "Hook Score 91",
    resultScore: "Risk Low",
    miniLabel: "Platform Fit: High",
  },
  {
    id: "produkt",
    toolLabel: "Produkt-Werbung",
    prompt: "Schreib mir eine Reel-Ad für eine KI-Steuer-App.",
    agentSteps: [
      "Produkt analysiert",
      "Nutzenversprechen geschärft",
      "Spot-Text erstellt",
      "CTA ergänzt",
    ],
    agentSummary: "Tool gewählt: Produkt Werbung · Finance-Sprache entschärft",
    outputs: [
      {
        label: "Spot",
        text: "Du verlierst Zeit in deiner Buchhaltung — weil deine Belege noch manuell sortiert werden.",
      },
    ],
    resultTitle: "Ad Script bereit",
    resultSubtitle: "Klarheit 88",
    resultScore: "Risk Low",
    miniLabel: "Reels · 15s",
  },
  {
    id: "visual",
    toolLabel: "Bild Generator",
    prompt: "Erstelle ein Ad-Visual für eine nachhaltige Beauty-Routine.",
    agentSteps: [
      "Stil definiert",
      "Bildprompt erstellt",
      "Format gewählt",
      "Quality Gate vorbereitet",
    ],
    agentSummary: "Bildprompt erstellt · Lesbarkeit geprüft · Format 4:5",
    outputs: [
      {
        label: "Briefing",
        text: "Soft studio light · clean skin · sustainable editorial mood",
      },
    ],
    resultTitle: "Visual Briefing bereit",
    resultSubtitle: "Brand Fit: High",
    resultScore: "Risk Low",
    miniLabel: "No text overlay",
  },
  {
    id: "avatar",
    toolLabel: "Mein KI-Ich",
    prompt: "Erstelle meinen KI-Avatar im Tech-Creator-Stil.",
    agentSteps: [
      "Foto geprüft",
      "Stil gewählt",
      "Consent bestätigt",
      "Konsistenz gesichert",
    ],
    agentSummary: "Avatar-Konzept erstellt · Consent-Hinweis · Face Consistent",
    outputs: [
      {
        label: "Stil",
        text: "Tech Creator · clean background · professional look",
      },
    ],
    resultTitle: "Avatar-Konzept bereit",
    resultSubtitle: "Face Consistent",
    resultScore: "Consent ✓",
    miniLabel: "Reels · Ads · Brand",
  },
];

export type ActivityStreamItem = {
  id: string;
  action: string;
  context: string;
  badge: string;
};

export const activityStreamItems: ActivityStreamItem[] = [
  { id: "a1", action: "Zielgruppe erkannt", context: "Immobilien · Eigentümer", badge: "✓" },
  { id: "a2", action: "Hook Score berechnet", context: "Script · TikTok", badge: "91" },
  { id: "a3", action: "Script optimiert", context: "Hook → Story → CTA", badge: "✓" },
  { id: "a4", action: "Bildprompt erstellt", context: "Beauty · 4:5", badge: "✓" },
  { id: "a5", action: "Risk Check bestanden", context: "Finance-Sprache", badge: "Low" },
  { id: "a6", action: "Content-Kalender gebaut", context: "7 Tage · 3 Formate", badge: "✓" },
  { id: "a7", action: "Branding Overlay vorbereitet", context: "Markenfarben", badge: "✓" },
  { id: "a8", action: "Caption gekürzt", context: "Instagram · DE", badge: "✓" },
  { id: "a9", action: "CTA verbessert", context: "Reel-Ad · Produkt", badge: "88" },
  { id: "a10", action: "Platform Fit geprüft", context: "TikTok · Reels", badge: "High" },
  { id: "a11", action: "Thumbnail Score", context: "Kontrast · Lesbarkeit", badge: "91" },
  { id: "a12", action: "Avatar-Konzept erstellt", context: "Consent ✓", badge: "✓" },
];

export type StickyDemoStep = {
  id: string;
  headline: string;
  description: string;
  badge: string;
  input: ReactNode;
  agentDecisions: string[];
  output: ReactNode;
  scores: { label: string; value: string }[];
};

export const stickyDemoSteps: StickyDemoStep[] = [
  {
    id: "script",
    headline: "SCRIPT IN SEKUNDEN",
    description:
      "Der Agent versteht Zielgruppe und Format — und liefert Hook, Story und CTA als fertiges Script.",
    badge: "Script Generator",
    input: (
      <>
        &quot;Erstelle ein TikTok-Script für Immobilien-Einsteiger.&quot;
        <br />
        TikTok · 30s
      </>
    ),
    agentDecisions: [
      "Tool gewählt: Script Generator",
      "Zielgruppe: Immobilien-Einsteiger",
      "Risk Check: keine Finanzversprechen",
    ],
    output: (
      <>
        <p className="mb-2">
          <span style={{ color: "#B4FF00" }}>Hook:</span>
          <br />
          &quot;Die meisten glauben, Immobilien kaufen ist nur was für Reiche. Ich hab mit 25
          angefangen — hier ist der Weg.&quot;
        </p>
        <p className="mb-2">
          <span style={{ color: "#B4FF00" }}>Story:</span>
          <br />
          Budget verstehen, Eigenkapital aufbauen, Förderoptionen prüfen — ohne
          Übertreibungen.
        </p>
        <p>
          <span style={{ color: "#B4FF00" }}>CTA:</span>
          <br />
          &quot;Kommentiere START — ich schick dir die Checkliste.&quot;
        </p>
      </>
    ),
    scores: [
      { label: "Hook", value: "91" },
      { label: "Klarheit", value: "88" },
      { label: "Risk", value: "Low" },
    ],
  },
  {
    id: "product",
    headline: "ADS OHNE LEERES BLATT",
    description:
      "Produktdaten rein — der Agent wählt Spot, Caption und CTA für Reels & Shorts.",
    badge: "Produkt Werbung",
    input: (
      <>
        Produkt: &quot;KI-Steuer-App für Selbstständige&quot;
        <br />
        Instagram Reels
      </>
    ),
    agentDecisions: [
      "Tool gewählt: Produkt Werbung",
      "Nutzenversprechen geschärft",
      "Risk Check: Finance-Sprache entschärft",
    ],
    output: (
      <>
        <p className="mb-2">
          <span style={{ color: "#B4FF00" }}>Hook:</span>
          <br />
          &quot;Du verlierst Zeit in deiner Buchhaltung — weil deine Belege noch manuell
          sortiert werden.&quot;
        </p>
        <p className="mb-2">
          <span style={{ color: "#B4FF00" }}>Spot:</span>
          <br />
          TaxMind erkennt Belege, kategorisiert Ausgaben und bereitet deine Buchhaltung
          KI-gestützt vor.
        </p>
        <p>
          <span style={{ color: "#B4FF00" }}>CTA:</span>
          <br />
          &quot;Link in Bio — 14 Tage testen.&quot;
        </p>
      </>
    ),
    scores: [
      { label: "Hook", value: "89" },
      { label: "Klarheit", value: "90" },
      { label: "Risk", value: "Low" },
    ],
  },
  {
    id: "viral_hook",
    headline: "HOOKS, DIE STOPPEN",
    description:
      "Der Agent bewertet Scroll-Stop, Klarheit und Zielgruppen-Fit — dann liefert Varianten.",
    badge: "Viral Hook Extraktor",
    input: (
      <>
        Thema: &quot;Nachhaltige Beauty-Routine unter 30€&quot;
        <br />
        TikTok
      </>
    ),
    agentDecisions: [
      "Tool gewählt: Viral Hook Extraktor",
      "Scroll-Stop analysiert",
      "5 Varianten optimiert",
    ],
    output: (
      <ol className="m-0 list-decimal space-y-1.5 pl-4 text-[0.82rem]">
        <li>
          Ich hab meine Beauty-Routine auf nachhaltig umgestellt — für unter 30€.
        </li>
        <li>
          Warum gibst du 80€ für Gesichtscreme aus, wenn deine Routine einfacher
          funktionieren kann?
        </li>
        <li>
          POV: Du findest heraus, dass dein Lieblingsprodukt nicht cruelty-free ist.
        </li>
      </ol>
    ),
    scores: [
      { label: "Hook", value: "91" },
      { label: "Scroll-Stop", value: "87" },
      { label: "Risk", value: "Low" },
    ],
  },
  {
    id: "content_kalender",
    headline: "DEIN CONTENT-PLAN STEHT",
    description:
      "Der Agent plant nach Ziel, Frequenz und Plattform — mit Posting-Zeiten und Formaten.",
    badge: "Content Kalender KI",
    input: (
      <>
        Nische: Personal Finance / Geldanlage
        <br />
        Instagram · 5×/Woche · 7 Tage
      </>
    ),
    agentDecisions: [
      "Tool gewählt: Content Kalender KI",
      "Themencluster erstellt",
      "Posting-Zeiten optimiert",
    ],
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
                  <td className="py-1 align-top whitespace-nowrap text-white/55">
                    {format}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[0.78rem]">
          Beste Posting-Zeit: 18:00–20:00 · Platform Fit: High
        </p>
      </>
    ),
    scores: [
      { label: "Plan", value: "92" },
      { label: "Platform", value: "High" },
      { label: "Risk", value: "Low" },
    ],
  },
  {
    id: "avatar",
    headline: "DEIN AVATAR BLEIBT KONSISTENT",
    description:
      "Der Agent erstellt Avatar-Konzepte mit Consent-Hinweis und konsistentem Look.",
    badge: "Mein KI-Ich",
    input: (
      <>
        1 Foto · Stil: Professional / Tech-Creator
        <br />
        Modern Office
      </>
    ),
    agentDecisions: [
      "Tool gewählt: Mein KI-Ich",
      "Consent-Hinweis geprüft",
      "Face Consistency gesichert",
    ],
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
          Avatar-Konzept Preview
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
      </div>
    ),
    scores: [
      { label: "Consistency", value: "94" },
      { label: "Consent", value: "✓" },
      { label: "Risk", value: "Low" },
    ],
  },
];

export type ToolIntelligenceEntry = {
  toolId: string;
  agentHint: string;
};

export const toolIntelligenceData: ToolIntelligenceEntry[] = [
  {
    toolId: "script",
    agentHint: "Agent nutzt dieses Tool für Hook → Story → CTA.",
  },
  {
    toolId: "product",
    agentHint: "Agent wandelt Produktdaten in Reel-Ad, Caption und CTA.",
  },
  {
    toolId: "thumbnail",
    agentHint: "Agent prüft Lesbarkeit, Kontrast und Click-Fit.",
  },
  {
    toolId: "agent",
    agentHint: "Orchestriert mehrere Tools automatisch.",
  },
  {
    toolId: "ki_ich",
    agentHint: "Erstellt Avatar-Konzepte mit Consent-Hinweis.",
  },
  {
    toolId: "image_gen",
    agentHint: "Erstellt Visuals mit Quality Gate gegen Text-/Logo-Fehler.",
  },
  {
    toolId: "viral_hook",
    agentHint: "Bewertet Hooks nach Scroll-Stop, Klarheit und Zielgruppen-Fit.",
  },
  {
    toolId: "content_kalender",
    agentHint: "Plant Content nach Ziel, Frequenz und Plattform.",
  },
  {
    toolId: "trend_script",
    agentHint: "Übersetzt Trends in fertige Video-Scripts.",
  },
  {
    toolId: "voice",
    agentHint: "Bereitet Voiceover und Audio-Stil vor.",
  },
  {
    toolId: "live",
    agentHint: "Avatar-Live-Workflows für spätere Videoformate.",
  },
  {
    toolId: "lora",
    agentHint: "Sichert konsistenten Look für Marken und Creator.",
  },
];

export type CampaignMode = {
  id: string;
  title: string;
  subtitle: string;
  deliverables: string[];
  workflowSteps: string[];
};

export const campaignModes: CampaignMode[] = [
  {
    id: "sprint",
    title: "Sprint Content",
    subtitle: "2–3 Tage Content",
    deliverables: [
      "3–5 Posts",
      "3 Hooks",
      "3 Captions",
      "1 Mini-Kalender",
    ],
    workflowSteps: [
      "Briefing verstehen",
      "Zielgruppe erkennen",
      "Inhalte planen",
      "Qualität prüfen",
    ],
  },
  {
    id: "weekly",
    title: "Weekly Content",
    subtitle: "7 Tage Content",
    deliverables: [
      "5–7 Posts",
      "3 Reels",
      "2 Carousels",
      "Posting-Zeiten",
    ],
    workflowSteps: [
      "Briefing verstehen",
      "Zielgruppe erkennen",
      "Inhalte planen",
      "Qualität prüfen",
    ],
  },
  {
    id: "monthly",
    title: "Monthly Campaign",
    subtitle: "30 Tage Content",
    deliverables: [
      "20–30 Ideen",
      "8–12 Reels",
      "Captions",
      "Visual-Briefings",
    ],
    workflowSteps: [
      "Briefing verstehen",
      "Zielgruppe erkennen",
      "Inhalte planen",
      "Qualität prüfen",
    ],
  },
];

export type QualityCheckArea = {
  id: string;
  title: string;
  items: string[];
};

export const qualityChecks: QualityCheckArea[] = [
  {
    id: "text",
    title: "Text Check",
    items: [
      "Keine falschen Versprechen",
      "CTA klar",
      "Tonalität passend",
      "Risk Low",
    ],
  },
  {
    id: "visual",
    title: "Visual Check",
    items: [
      "Keine kaputten Hände/Finger",
      "Kein falsches Logo",
      "Text nicht von KI verzerrt",
      "Format korrekt",
    ],
  },
  {
    id: "brand",
    title: "Brand Check",
    items: [
      "Markenstimme",
      "Zielgruppe",
      "Plattform-Fit",
      "Wiederholungen vermeiden",
    ],
  },
];

export const pricingCreditExamples = [
  "Scripts & Hooks",
  "Bildideen & Visual-Briefings",
  "Content-Kalender",
  "Avatar-Workflows",
  "Kampagnenpakete",
] as const;
