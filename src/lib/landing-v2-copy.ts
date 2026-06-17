/** Landing-v2 preview — editorial marketing copy (DE) */

export const LANDING_V2_COPY = {
  brandIntro: {
    scrollHint: "Scroll to enter",
  },
  nav: {
    workflow: "Workflow",
    paths: "Produktionspfade",
    studio: "Studio",
    pricing: "Preise",
    cta: "Studio starten",
  },
  hero: {
    eyebrow: "Creator Production System",
    headline: "Ein Studio. Vom Briefing bis zum Asset.",
    headlineLines: ["Ein Studio.", "Vom Briefing", "bis zum Asset."] as const,
    headlineAlt: "Kampagnen, Visuals und Motion — in einem Studio.",
    subline:
      "Plane Hooks, erstelle Visuals und bringe Kampagnen in Bewegung — ohne Tool-Chaos, Modellnamen oder verstreute Workflows.",
    ctaPrimary: "Studio starten",
    ctaSecondary: "Preise ansehen",
    chips: ["Creator", "Brands", "E-Commerce", "Lokale Unternehmen"] as const,
    productPanel: {
      label: "Studio Cockpit",
      headline: "Briefing, Produktion und Assets in einem Workflow.",
      briefing: {
        title: "Campaign Briefing",
        text: "Ziel, Hook und Stilrichtung",
      },
      paths: {
        title: "Production Paths",
        items: ["Bild erstellen", "Video erstellen", "Kampagne planen"] as const,
      },
      queue: {
        title: "Asset Queue",
        items: [
          { name: "Campaign Visual", status: "Visual draft" },
          { name: "Motion Draft", status: "Motion draft" },
          { name: "Hook Direction", status: "Briefing ready" },
        ] as const,
      },
    },
  },
  workflow: {
    eyebrow: "Workflow",
    headline: "Vom Briefing zum Asset.",
    headlineLines: ["Vom Briefing", "zum Asset."] as const,
    subline:
      "Fünf Stationen — von der ersten Idee bis zur gespeicherten Produktion. Klar geführt, ruhig erzählt.",
    stations: [
      {
        id: "briefing",
        label: "Briefing",
        chapter: "Briefing",
        stageLabel: "Campaign Brief",
        stageStatus: "Briefing ready",
        title: "Starte mit der Kampagnenidee.",
        description:
          "Ziel, Stil, Produkt oder Hook — das Studio macht daraus einen verwertbaren Produktionspfad.",
      },
      {
        id: "path",
        label: "Pfad",
        chapter: "Pfad",
        stageLabel: "Production Path",
        stageStatus: "Route selected",
        title: "Wähle den richtigen Weg.",
        description:
          "Bild, Video oder Kampagne — strukturiert statt in einer losen Toolliste.",
      },
      {
        id: "image",
        label: "Bild",
        chapter: "Bild",
        stageLabel: "Visual Draft",
        stageStatus: "In production",
        title: "Erzeuge starke Visuals.",
        description:
          "Motive, Produktbilder und Kampagnenentwürfe passend zum Briefing.",
      },
      {
        id: "motion",
        label: "Motion",
        chapter: "Motion",
        stageLabel: "Motion Draft",
        stageStatus: "Rendering",
        title: "Bringe Assets in Bewegung.",
        description:
          "Kurze Sequenzen, Motion-Drafts und visuelle Ideen für Social und Kampagnen.",
      },
      {
        id: "gallery",
        label: "Galerie",
        chapter: "Galerie",
        stageLabel: "Asset Library",
        stageStatus: "Saved asset",
        title: "Behalte Produktionen im Blick.",
        description:
          "Varianten speichern, vergleichen und für die nächste Veröffentlichung wiederverwenden.",
      },
    ],
  },
  paths: {
    eyebrow: "Produktionspfade",
    headline: "Drei Wege. Ein Studio.",
    headlineLines: ["Drei Wege.", "Ein Studio."] as const,
    subline:
      "Ordnet nach Ergebnis — nicht nach technischen Modellnamen.",
    items: [
      {
        id: "image",
        label: "Bild erstellen",
        title: "Visuals, Produktmotive und Kampagnenbilder.",
        description:
          "Für Social Posts, Ads, Landingpages und Produktkommunikation.",
        cta: "Bild-Workflow öffnen",
      },
      {
        id: "video",
        label: "Video erstellen",
        title: "Motion, Clips und kurze Kampagnen-Sequenzen.",
        description:
          "Aus Ideen oder Startbildern werden bewegte Assets für Reels, Shorts und Ads.",
        cta: "Video-Workflow öffnen",
      },
      {
        id: "campaign",
        label: "Kampagne planen",
        title: "Hooks, Content-Struktur und Veröffentlichungslogik.",
        description:
          "Kampagnenwinkel klären, bevor einzelne Assets produziert werden.",
        cta: "Kampagne vorbereiten",
      },
    ],
  },
  studio: {
    eyebrow: "Studio",
    headline: "Der gesamte Produktionsfluss.",
    headlineLines: ["Der gesamte", "Produktionsfluss."] as const,
    subline:
      "Cockpit, Briefing, Tools und Galerie — als zusammenhängende Produktionsbühne.",
    panels: [
      {
        id: "studio",
        label: "Studio Cockpit",
        title: "Überblick vor der Produktion.",
        description: "Projekte starten, Wege wählen, aktive Assets im Blick.",
      },
      {
        id: "tools",
        label: "Tools Hub",
        title: "Werkzeuge zur richtigen Aufgabe.",
        description: "Aktive Produktionswege im Vordergrund — klar strukturiert.",
      },
      {
        id: "agent",
        label: "Agent Briefing",
        title: "Aus Ideen werden Prompts.",
        description: "Kampagnenideen in konkrete Produktionsschritte übersetzen.",
      },
      {
        id: "gallery",
        label: "Galerie",
        title: "Ergebnisse an einem Ort.",
        description: "Visuals, Varianten und Motion-Entwürfe für spätere Kampagnen.",
      },
    ],
  },
  outputs: {
    eyebrow: "Outputs",
    headline: "Produktionen, die weiterverwendet werden.",
    headlineLines: ["Produktionen,", "die weiterverwendet werden."] as const,
    subline: "Neutrale Output-Flächen — ohne Fake-Metriken oder erfundene Ergebnisse.",
    cards: [
      {
        id: "campaign-visual",
        label: "Campaign Visual",
        description: "Visual-Entwürfe für Kampagnen und Social.",
        kind: "image" as const,
      },
      {
        id: "motion-draft",
        label: "Motion Draft",
        description: "Bewegungsentwürfe aus Startbildern oder Ideen.",
        kind: "video" as const,
      },
      {
        id: "hook-direction",
        label: "Hook Direction",
        description: "Content-Winkel als Grundlage für Produktion.",
        kind: "text" as const,
      },
      {
        id: "asset-library",
        label: "Asset Library",
        description: "Gespeicherte Varianten für zukünftige Kampagnen.",
        kind: "text" as const,
      },
    ],
  },
  pricing: {
    eyebrow: "Preise",
    headline: "Pläne für dein Produktionsvolumen.",
    subline: "Alle Details und Konditionen findest du auf der Pricing-Seite.",
    cta: "Preise ansehen",
  },
  finalCta: {
    headline: "Starte dein Creator Studio.",
    subline: "Produziere schneller, klarer und kontrollierter — ohne Tool-Chaos.",
    ctaPrimary: "Studio starten",
    ctaSecondary: "Preise ansehen",
  },
} as const;
