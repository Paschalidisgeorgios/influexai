/** Landing-v2 preview — editorial operating-system copy (DE) */

export const LANDING_V2_COPY = {
  brandIntro: {
    scrollHint: "Scroll to enter",
  },
  nav: {
    system: "System",
    workflow: "Workflow",
    studio: "Studio",
    pricing: "Preise",
    cta: "Studio starten",
  },
  chapters: {
    system: {
      number: "01",
      label: "System",
      headline: "Ein Eingabefeld wird zum Produktionssystem.",
      body: "Der Nutzer beschreibt ein Ziel. InfluexAI erkennt den passenden Workflow, optimiert den Prompt und führt von Briefing zu Visual, Motion oder Galerie.",
      flow: "Eingabe → Agent → Workflow → Vorschau → Galerie",
    },
    workflow: {
      number: "02",
      label: "Workflow",
      headline: "Vom Briefing zum Asset.",
      headlineLines: ["Vom Briefing", "zum Asset."] as const,
      body: "Aus einer Kampagnenidee entsteht ein Produktionspfad — klar genug für Teams, schnell genug für Creator.",
      steps: "Briefing → Visual → Motion → Galerie",
    },
    paths: {
      number: "03",
      label: "Production Paths",
      headline: "Drei Produktionswege. Ein Studio.",
      headlineLines: ["Drei Produktionswege.", "Ein Studio."] as const,
      body: "Ordnet nach Ergebnis — nicht nach technischen Modellnamen.",
    },
    studio: {
      number: "04",
      label: "Studio",
      headline: "Alle Flächen deiner Produktion in einem System.",
      headlineLines: ["Alle Flächen deiner Produktion", "in einem System."] as const,
      body: "Cockpit, Agent, Workflow und Galerie arbeiten zusammen — nicht als getrennte Generatoren, sondern als Produktionsumgebung.",
    },
    pricing: {
      number: "05",
      label: "Preise",
      headline: "Zugang nach Produktionsvolumen.",
      body: "Alle Details und Konditionen findest du auf der Pricing-Seite.",
      cta: "Preise ansehen",
    },
  },
  hero: {
    workflowLine: "Briefing → Visual → Motion → Galerie",
    headline: "Das Studio, das Kampagnen in Assets verwandelt.",
    headlineAlt: "Campaigns become assets here.",
    headlineLines: ["Das Studio,", "das Kampagnen", "in Assets verwandelt."] as const,
    primaryHeadlineLines: [
      "Aus Briefings",
      "werden Visuals.",
      "Aus Visuals",
      "wird Motion.",
    ] as const,
    primaryHeadlineHighlight: "Motion",
    rotatingHeadlines: [
      {
        id: "campaigns",
        lines: ["Das Studio, das", "Kampagnen in Assets", "verwandelt."] as const,
        highlight: "Kampagnen",
      },
      {
        id: "motion",
        lines: ["Aus Briefings werden Visuals.", "Aus Visuals wird Motion."] as const,
        highlight: "Motion",
      },
      {
        id: "workflow",
        lines: ["Ein Workflow für", "Creator, Marken", "und Kampagnen."] as const,
        highlight: "Workflow",
      },
      {
        id: "asset",
        lines: ["Von der Idee zum Asset —", "ohne Tool-Chaos."] as const,
        highlight: "Asset",
      },
      {
        id: "studio",
        lines: ["Produziere Visuals, Motion", "und Kampagnen in einem Studio."] as const,
        highlight: "Studio",
      },
    ] as const,
    subline:
      "Briefing, Visuals und Motion in einem klaren Produktionsfluss. Von der ersten Idee bis zur gespeicherten Variante — ohne Tool-Chaos.",
    ctaPrimary: "Studio starten",
    ctaSecondary: "Preise ansehen",
  },
  creatorProductionFlow: {
    kicker: "CREATOR PRODUCTION FLOW",
    headline: "Briefing → Visual → Motion → Gallery",
    subline: "Ein Workflow vom ersten Kampagnenbriefing bis zum gespeicherten Asset.",
    stations: [
      {
        index: "01",
        label: "Briefing",
        description: "Kampagnenidee, Zielgruppe und Stilrichtung",
      },
      {
        index: "02",
        label: "Visual",
        description: "Bildmotive und Kampagnen-Visuals",
      },
      {
        index: "03",
        label: "Motion",
        description: "Bewegung, Clips und kurze Sequenzen",
      },
      {
        index: "04",
        label: "Gallery",
        description: "Varianten speichern und weiterverwenden",
      },
    ] as const,
  },
  systemModel: {
    kicker: "Command-first Produktion",
    steps: [
      {
        id: "input",
        label: "Eingabe",
        hint: "Ziel beschreiben",
      },
      {
        id: "agent",
        label: "Agent",
        hint: "Workflow erkennen",
      },
      {
        id: "workflow",
        label: "Workflow",
        hint: "Prompt & Format vorbereiten",
      },
      {
        id: "preview",
        label: "Vorschau",
        hint: "Ergebnis prüfen",
      },
      {
        id: "gallery",
        label: "Galerie",
        hint: "Weiterverwenden",
      },
    ] as const,
  },
  /** @deprecated Preview uses creatorProductionFlow */
  systemSurface: {
    label: "Creator Production Flow",
    signal: "",
    layers: [
      { id: "briefing", index: "01", label: "Briefing", hint: "Kampagnenidee" },
      { id: "visual", index: "02", label: "Visual", hint: "Motive & Assets" },
      { id: "motion", index: "03", label: "Motion", hint: "Bewegung" },
      { id: "gallery", index: "04", label: "Gallery", hint: "Produktionen" },
    ] as const,
    status: "",
  },
  workflow: {
    eyebrow: "Workflow",
    headline: "Vom Briefing zum Asset.",
    headlineLines: ["Vom Briefing", "zum Asset."] as const,
    subline:
      "Fünf Stationen — von der ersten Idee bis zur gespeicherten Produktion. Klar geführt, ruhig erzählt.",
    steps: "Briefing → Pfad → Visual → Motion → Galerie",
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
        label: "Visual",
        chapter: "Visual",
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
    headline: "Drei Produktionswege. Ein Studio.",
    headlineLines: ["Drei Produktionswege.", "Ein Studio."] as const,
    subline: "Ordnet nach Ergebnis — nicht nach technischen Modellnamen.",
    items: [
      {
        id: "image",
        index: "01",
        label: "Bild erstellen",
        title: "Visuals und Kampagnenbilder.",
        description: "Social, Ads und Produktkommunikation.",
        cta: "Bild-Workflow",
      },
      {
        id: "video",
        index: "02",
        label: "Video erstellen",
        title: "Motion und kurze Sequenzen.",
        description: "Reels, Shorts und bewegte Kampagnen-Assets.",
        cta: "Video-Workflow",
      },
      {
        id: "campaign",
        index: "03",
        label: "Kampagne planen",
        title: "Hooks und Content-Struktur.",
        description: "Kampagnenwinkel vor der Asset-Produktion.",
        cta: "Kampagne planen",
      },
    ],
  },
  studio: {
    eyebrow: "Studio",
    headline: "Alle Flächen deiner Produktion in einem System.",
    headlineLines: ["Alle Flächen deiner Produktion", "in einem System."] as const,
    subline:
      "Cockpit, Agent, Workflow und Galerie — als zusammenhängende Produktionsumgebung.",
    panels: [
      {
        id: "cockpit",
        label: "Cockpit",
        title: "Command-first Start.",
        description: "Ziel beschreiben — Signale und Workflow werden erkannt.",
      },
      {
        id: "agent",
        label: "Agent",
        title: "Prompt wird produktionsreif.",
        description: "Originalidee in optimierte Produktionssprache übersetzt.",
      },
      {
        id: "workflow",
        label: "Workflow",
        title: "Produktionsweg öffnet sich.",
        description: "Format, Stil und nächste Schritte im selben Flow.",
      },
      {
        id: "gallery",
        label: "Galerie",
        title: "Assets bleiben verwertbar.",
        description: "Visuals, Motion und Hooks für spätere Kampagnen.",
      },
    ] as const,
    scenes: [
      {
        id: "cockpit",
        index: "01",
        label: "Cockpit",
        command:
          "Erstelle ein Kampagnenbild für Instagram für ein Premium-Olivenöl.",
        signals: [
          { label: "Intent", value: "Bild erstellen" },
          { label: "Plattform", value: "Instagram" },
          { label: "Format", value: "4:5" },
          { label: "Engine", value: "Image" },
        ],
      },
      {
        id: "agent",
        index: "02",
        label: "Agent",
        original: "Erstelle ein Bild von Olivenöl bei Sonnenuntergang.",
        optimized:
          "Premium product visual of Greek olive oil, golden hour lighting, editorial composition, Mediterranean atmosphere, high-detail campaign asset.",
        chips: ["Prompt optimiert", "Format erkannt", "Rückfrage bereit"],
      },
      {
        id: "workflow",
        index: "03",
        label: "Workflow",
        route: "Bild erstellen",
        options: [
          { label: "Format", value: "4:5" },
          { label: "Stil", value: "Premium" },
          { label: "Qualität", value: "Standard / Premium" },
        ],
        nextActions: ["Zu Video", "Hook schreiben", "In Kampagne"],
      },
      {
        id: "gallery",
        index: "04",
        label: "Galerie",
        assets: ["Campaign Visual", "Motion Draft", "Hook Set", "Varianten"],
        actions: ["Wiederverwenden", "Als Video", "In Kampagne"],
      },
    ] as const,
  },
  outputs: {
    eyebrow: "Outputs",
    headline: "Kampagnen-Assets, die weiterverwendet werden.",
    headlineLines: ["Kampagnen-Assets,", "die weiterverwendet werden."] as const,
    subline: "Gespeicherte Produktionen — ohne Fake-Metriken oder erfundene Ergebnisse.",
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
    headline: "Zugang nach Produktionsvolumen.",
    subline: "Alle Details und Konditionen findest du auf der Pricing-Seite.",
    cta: "Preise ansehen",
  },
  finalCta: {
    headline: "Starte dein Creator Operating System.",
    subline: "Produziere schneller, klarer und kontrollierter — ohne Tool-Chaos.",
    ctaPrimary: "Studio starten",
    ctaSecondary: "Preise ansehen",
  },
} as const;
