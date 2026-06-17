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
      headline: "Ein Produktionssystem statt einzelner Generatoren.",
      body: "InfluexAI verbindet Briefing, Visuals, Motion und Galerie zu einem Workflow, der Kampagnen zusammenhält.",
      flow: "Briefing → Visual → Motion → Galerie",
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
      body: "Cockpit, Agent, Tools und Galerie arbeiten zusammen — nicht als getrennte Generatoren, sondern als Produktionsumgebung.",
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
    eyebrow: "AI-NATIVE CREATOR OPERATING SYSTEM",
    headline: "Das Studio, das Kampagnen in Assets verwandelt.",
    headlineAlt: "Campaigns become assets here.",
    headlineLines: ["Das Studio,", "das Kampagnen", "in Assets verwandelt."] as const,
    subline:
      "Briefing, Visuals, Motion und Galerie in einem Produktionssystem — für Creator, Brands und Teams, die schneller veröffentlichen wollen, ohne in Tool-Chaos zu arbeiten.",
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
      "Cockpit, Agent, Tools und Galerie — als zusammenhängende Produktionsumgebung.",
    panels: [
      {
        id: "cockpit",
        label: "Cockpit",
        title: "Überblick vor der Produktion.",
        description: "Projekte starten, Wege wählen, aktive Assets im Blick.",
      },
      {
        id: "agent",
        label: "Agent",
        title: "Aus Ideen werden Prompts.",
        description: "Kampagnenideen in konkrete Produktionsschritte übersetzen.",
      },
      {
        id: "tools",
        label: "Tools",
        title: "Werkzeuge zur richtigen Aufgabe.",
        description: "Produktionswege im Vordergrund — klar strukturiert.",
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
