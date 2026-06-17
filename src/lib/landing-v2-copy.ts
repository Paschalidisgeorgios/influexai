/** Landing-v2 preview — marketing copy (DE) */

export const LANDING_V2_COPY = {
  nav: {
    workflow: "Workflow",
    paths: "Produktionspfade",
    studio: "Studio",
    pricing: "Preise",
    cta: "Studio starten",
  },
  hero: {
    eyebrow: "Creator Production System",
    headline: "Ein Studio für Kampagnen, Visuals und Motion.",
    subline:
      "Plane Hooks, erstelle Visuals und verwandle Ideen in Bilder, Videos und Kampagnen-Assets — ohne zwischen zehn einzelnen Tools zu springen.",
    ctaPrimary: "Studio starten",
    ctaSecondary: "Preise ansehen",
    chips: ["Creator", "Brands", "E-Commerce", "Lokale Unternehmen"] as const,
  },
  workflow: {
    eyebrow: "Workflow",
    headline: "Vom Briefing zum fertigen Asset.",
    subline:
      "Jede Produktion beginnt mit einer klaren Idee. InfluexAI führt dich vom ersten Kampagnen-Briefing bis zum speicherbaren Visual — strukturiert, nachvollziehbar und bereit für die nächste Veröffentlichung.",
    stations: [
      {
        id: "briefing",
        label: "Briefing",
        title: "Starte mit der Kampagnenidee.",
        description:
          "Beschreibe Ziel, Stil, Produkt, Zielgruppe oder Hook. Das Studio hilft dir, daraus einen verwertbaren Produktionspfad zu machen.",
      },
      {
        id: "path",
        label: "Produktionspfad",
        title: "Wähle den richtigen Weg.",
        description:
          "Bild erstellen, Video erzeugen oder Kampagne planen — statt in einer losen Toolliste zu suchen.",
      },
      {
        id: "image",
        label: "Bild",
        title: "Erzeuge starke Visuals.",
        description:
          "Erstelle Motive, Produktbilder, Creator-Visuals oder Kampagnenentwürfe passend zu deinem Briefing.",
      },
      {
        id: "motion",
        label: "Motion",
        title: "Bringe Assets in Bewegung.",
        description:
          "Verwandle Bilder in kurze Videoideen, Motion-Drafts oder visuelle Sequenzen für Social Media und Kampagnen.",
      },
      {
        id: "gallery",
        label: "Galerie",
        title: "Behalte deine Produktionen im Blick.",
        description:
          "Speichere Ergebnisse, vergleiche Varianten und baue eine wiederverwendbare Asset-Bibliothek auf.",
      },
    ],
  },
  paths: {
    eyebrow: "Produktionspfade",
    headline: "Drei Wege statt Tool-Chaos.",
    subline:
      "InfluexAI ordnet deine Produktion nach dem Ergebnis, das du brauchst — nicht nach technischen Modellnamen.",
    items: [
      {
        id: "image",
        label: "Bild erstellen",
        title: "Für Visuals, Produktmotive und Kampagnenbilder.",
        description:
          "Erstelle hochwertige Bildentwürfe für Social Posts, Ads, Landingpages oder Produktkommunikation.",
        cta: "Bild-Workflow öffnen",
      },
      {
        id: "video",
        label: "Video erstellen",
        title: "Für Motion, Clips und kurze Kampagnen-Sequenzen.",
        description:
          "Verwandle Ideen oder Startbilder in bewegte Assets für Reels, Shorts, Ads und Präsentationen.",
        cta: "Video-Workflow öffnen",
      },
      {
        id: "campaign",
        label: "Kampagne planen",
        title: "Für Hooks, Content-Struktur und Veröffentlichungslogik.",
        description:
          "Entwickle Hook-Ideen, Content-Winkel und Kampagnenpläne, bevor du einzelne Assets produzierst.",
        cta: "Kampagne vorbereiten",
      },
    ],
  },
  studio: {
    eyebrow: "Studio",
    headline: "Gebaut für den gesamten Produktionsfluss.",
    subline:
      "Briefing, Tools, Agent und Galerie greifen ineinander. Du arbeitest nicht in einzelnen Generatoren, sondern in einem Studio, das deine Kampagne zusammenhält.",
    panels: [
      {
        id: "studio",
        label: "Studio Cockpit",
        title: "Dein Überblick vor der Produktion.",
        description:
          "Starte neue Projekte, wähle Produktionswege und behalte aktive Assets im Blick.",
      },
      {
        id: "tools",
        label: "Tools Hub",
        title: "Die richtigen Werkzeuge zur richtigen Aufgabe.",
        description:
          "Nur die aktiven Produktionswege stehen im Vordergrund. Weitere Studios bleiben klar als vorbereitet gekennzeichnet.",
      },
      {
        id: "agent",
        label: "Agent Briefing",
        title: "Aus Ideen werden verwertbare Prompts.",
        description:
          "Der Agent hilft dir, Kampagnenideen zu strukturieren und in konkrete Produktionsschritte zu übersetzen.",
      },
      {
        id: "gallery",
        label: "Galerie",
        title: "Alle Ergebnisse an einem Ort.",
        description:
          "Sammle Visuals, Varianten und Motion-Entwürfe für spätere Kampagnen, Kunden oder Social-Media-Serien.",
      },
    ],
  },
  outputs: {
    eyebrow: "Outputs",
    headline: "Von der Idee zur verwendbaren Asset-Basis.",
    subline:
      "InfluexAI ist auf kontrollierte Produktion ausgelegt: klare Briefings, sichtbare Varianten und Assets, die du weiterverwenden kannst.",
    cards: [
      {
        id: "campaign-visual",
        label: "Campaign Visual",
        description:
          "Visual-Entwürfe für Kampagnen, Social Posts und Produktkommunikation.",
        kind: "image" as const,
      },
      {
        id: "motion-draft",
        label: "Motion Draft",
        description:
          "Kurze Bewegungsentwürfe aus Startbildern oder Kampagnenideen.",
        kind: "video" as const,
      },
      {
        id: "hook-direction",
        label: "Hook Direction",
        description:
          "Content-Winkel und Hook-Ideen als Grundlage für bessere Produktion.",
        kind: "text" as const,
      },
      {
        id: "asset-library",
        label: "Asset Library",
        description:
          "Gespeicherte Ergebnisse und Varianten für zukünftige Kampagnen.",
        kind: "text" as const,
      },
    ],
  },
  pricing: {
    eyebrow: "Preise",
    headline: "Wähle den Zugang, der zu deinem Produktionsvolumen passt.",
    subline:
      "Starte klein, teste Workflows und erweitere dein Studio, wenn du regelmäßig Bilder, Videos oder Kampagnen-Assets produzierst.",
    cta: "Preise ansehen",
    ctaSecondary: "Studio starten",
  },
  finalCta: {
    headline: "Starte dein Creator Studio.",
    subline: "Produziere schneller, klarer und kontrollierter — ohne Tool-Chaos.",
    ctaPrimary: "Studio starten",
    ctaSecondary: "Preise ansehen",
  },
} as const;
