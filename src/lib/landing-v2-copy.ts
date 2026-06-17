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
      body: "InfluexAI verbindet Briefing, Bild, Motion und Galerie zu einem Workflow, der Kampagnen zusammenhält.",
    },
    workflow: {
      number: "02",
      label: "Workflow",
      headline: "Vom Briefing zum Asset.",
      headlineLines: ["Vom Briefing", "zum Asset."] as const,
      body: "Fünf Stationen — von der ersten Idee bis zur gespeicherten Produktion. Klar geführt, ruhig erzählt.",
      steps: "Briefing → Pfad → Visual → Motion → Galerie",
    },
    paths: {
      number: "03",
      label: "Production Paths",
      headline: "Drei Wege. Ein Studio.",
      headlineLines: ["Drei Wege.", "Ein Studio."] as const,
      body: "Ordnet nach Ergebnis — nicht nach technischen Modellnamen.",
    },
    studio: {
      number: "04",
      label: "Studio",
      headline: "Alle Produktionsflächen in einem System.",
      headlineLines: ["Alle Produktionsflächen", "in einem System."] as const,
      body: "Cockpit, Briefing, Tools und Galerie — als zusammenhängende Produktionsbühne.",
    },
    pricing: {
      number: "05",
      label: "Preise",
      headline: "Wähle den Zugang, der zu deinem Produktionsvolumen passt.",
      body: "Alle Details und Konditionen findest du auf der Pricing-Seite.",
      cta: "Preise ansehen",
    },
  },
  hero: {
    eyebrow: "AI-Native Creator Operating System",
    headline: "Das Studio, in dem Kampagnen zu Assets werden.",
    headlineLines: ["Das Studio,", "in dem Kampagnen", "zu Assets werden."] as const,
    subline:
      "Briefing, Visuals, Motion und Galerie in einem kontrollierten Produktionsfluss — gebaut für Creator, Brands und Teams, die schneller veröffentlichen wollen, ohne in Tool-Chaos zu arbeiten.",
    ctaPrimary: "Studio starten",
    ctaSecondary: "Preise ansehen",
    productPanel: {
      label: "Studio Cockpit",
      headline: "Produktionsfluss aktiv",
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
    headline: "Drei Wege. Ein Studio.",
    headlineLines: ["Drei Wege.", "Ein Studio."] as const,
    subline: "Ordnet nach Ergebnis — nicht nach technischen Modellnamen.",
    items: [
      {
        id: "image",
        index: "01",
        label: "Bild erstellen",
        title: "Visuals, Produktmotive und Kampagnenbilder.",
        description:
          "Für Social Posts, Ads, Landingpages und Produktkommunikation.",
        cta: "Bild-Workflow öffnen",
      },
      {
        id: "video",
        index: "02",
        label: "Video erstellen",
        title: "Motion, Clips und kurze Kampagnen-Sequenzen.",
        description:
          "Aus Ideen oder Startbildern werden bewegte Assets für Reels, Shorts und Ads.",
        cta: "Video-Workflow öffnen",
      },
      {
        id: "campaign",
        index: "03",
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
    headline: "Alle Produktionsflächen in einem System.",
    headlineLines: ["Alle Produktionsflächen", "in einem System."] as const,
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
        id: "agent",
        label: "Agent Briefing",
        title: "Aus Ideen werden Prompts.",
        description: "Kampagnenideen in konkrete Produktionsschritte übersetzen.",
      },
      {
        id: "tools",
        label: "Tools Hub",
        title: "Werkzeuge zur richtigen Aufgabe.",
        description: "Aktive Produktionswege im Vordergrund — klar strukturiert.",
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
    headline: "Wähle den Zugang, der zu deinem Produktionsvolumen passt.",
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
