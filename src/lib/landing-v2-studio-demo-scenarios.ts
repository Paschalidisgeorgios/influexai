/** Landing preview — rotating studio demo scenarios (mock / preview only) */

export const LORA_REFERENCE_IMAGES = [
  {
    src: "/images/landing/lora-training/lora-reference-01.jpg",
    alt: "Referenzbild 1 — Demo",
  },
  {
    src: "/images/landing/lora-training/lora-reference-02.jpg",
    alt: "Referenzbild 2 — Demo",
  },
  {
    src: "/images/landing/lora-training/lora-reference-03.jpg",
    alt: "Referenzbild 3 — Demo",
  },
  {
    src: "/images/landing/lora-training/lora-reference-04.jpg",
    alt: "Referenzbild 4 — Demo",
  },
] as const;

export type StudioDemoSignal = { label: string; value: string };
export type StudioDemoRow = { label: string; value: string };
export type StudioDemoThumbnail = { src: string; alt: string };

export type StudioDemoScenario = {
  id: string;
  label: string;
  cockpit: {
    command: string;
    signals: StudioDemoSignal[];
  };
  agent: {
    original: string;
    optimized: string;
    chips: string[];
  };
  workflow: {
    title: string;
    rows: StudioDemoRow[];
    actions: string[];
  };
  gallery: {
    thumbnails?: readonly StudioDemoThumbnail[];
    demoNote?: string;
    assets: string[];
    actions: string[];
  };
};

export const LANDING_V2_STUDIO_DEMO_SCENARIOS: readonly StudioDemoScenario[] = [
  {
    id: "campaign-visual",
    label: "Kampagnenbild",
    cockpit: {
      command: "Erstelle ein Kampagnenbild für Instagram für ein Premium-Olivenöl.",
      signals: [
        { label: "Intent", value: "Bild erstellen" },
        { label: "Plattform", value: "Instagram" },
        { label: "Format", value: "4:5" },
        { label: "Engine", value: "Image" },
      ],
    },
    agent: {
      original: "Erstelle ein Bild von Olivenöl bei Sonnenuntergang.",
      optimized:
        "Premium product visual of Greek olive oil, golden hour lighting, editorial composition, Mediterranean atmosphere, high-detail campaign asset.",
      chips: ["Prompt optimiert", "Format erkannt", "Rückfrage bereit"],
    },
    workflow: {
      title: "Bild erstellen",
      rows: [
        { label: "Format", value: "4:5" },
        { label: "Stil", value: "Premium" },
        { label: "Qualität", value: "Standard / Premium" },
        { label: "Status", value: "Vorbereitung" },
      ],
      actions: ["Zu Video", "Hook schreiben", "In Kampagne"],
    },
    gallery: {
      assets: ["Campaign Visual", "Motion Draft", "Hook Set", "Varianten"],
      actions: ["Wiederverwenden", "Als Video", "In Kampagne"],
    },
  },
  {
    id: "ugc-video",
    label: "UGC Video",
    cockpit: {
      command: "Erstelle ein UGC-Reel aus meinem Produktvisual für Instagram.",
      signals: [
        { label: "Intent", value: "Motion" },
        { label: "Plattform", value: "Instagram" },
        { label: "Format", value: "9:16" },
        { label: "Engine", value: "Video" },
      ],
    },
    agent: {
      original: "Mach aus dem Bild ein kurzes UGC-Reel.",
      optimized:
        "Short-form UGC reel from product visual, handheld energy, natural lighting, social-native pacing, hook-ready opening frame.",
      chips: ["Format erkannt", "Motion vorbereitet", "Hook bereit"],
    },
    workflow: {
      title: "Video erstellen",
      rows: [
        { label: "Format", value: "9:16" },
        { label: "Stil", value: "UGC" },
        { label: "Qualität", value: "Standard" },
        { label: "Status", value: "Vorbereitung" },
      ],
      actions: ["Hook schreiben", "In Kampagne", "Export vorbereiten"],
    },
    gallery: {
      assets: ["Motion Draft", "Hook Set", "Product Visual", "Varianten"],
      actions: ["Als Video", "Wiederverwenden", "In Kampagne"],
    },
  },
  {
    id: "topaz-upscale",
    label: "Topaz Upscale",
    cockpit: {
      command: "Verbessere dieses Video für den Export in höherer Qualität.",
      signals: [
        { label: "Intent", value: "Upscale" },
        { label: "Typ", value: "Video" },
        { label: "Engine", value: "Topaz" },
        { label: "Ziel", value: "Export" },
      ],
    },
    agent: {
      original: "Das Video soll schärfer und hochwertiger wirken.",
      optimized:
        "Topaz video upscale for export-ready delivery, preserve motion detail, reduce compression artifacts, premium clarity for campaign use.",
      chips: ["Quelle erkannt", "Preset gewählt", "Pipeline bereit"],
    },
    workflow: {
      title: "Video Upscale vorbereiten",
      rows: [
        { label: "Quelle", value: "Motion Draft" },
        { label: "Preset", value: "Export Premium" },
        { label: "Qualität", value: "Topaz" },
        { label: "Status", value: "Vorbereitung" },
      ],
      actions: ["Vorschau", "Export vorbereiten", "In Galerie"],
    },
    gallery: {
      assets: ["Source Clip", "Upscale Draft", "Export Preview", "Varianten"],
      actions: ["Export", "Vergleichen", "In Kampagne"],
    },
  },
  {
    id: "lora-training",
    label: "LoRA Training",
    cockpit: {
      command: "Trainiere einen AI Influencer im mediterranen Luxus-Stil.",
      signals: [
        { label: "Intent", value: "AI Creator" },
        { label: "Workflow", value: "LoRA Training" },
        { label: "Stil", value: "Mediterranean Luxury" },
        { label: "Engine", value: "Training" },
      ],
    },
    agent: {
      original: "Ich will eine wiedererkennbare virtuelle Creatorin erstellen.",
      optimized:
        "Build a consistent AI creator persona with Mediterranean luxury aesthetic, premium beauty editorial look, repeatable facial identity and brand-ready visual direction.",
      chips: ["Persona erkannt", "Referenzen geprüft", "Consent erforderlich"],
    },
    workflow: {
      title: "LoRA Training vorbereiten",
      rows: [
        { label: "Typ", value: "AI Influencer" },
        { label: "Referenzen", value: "4 Bilder erkannt" },
        { label: "Qualität", value: "Premium" },
        { label: "Status", value: "Vorbereitung" },
      ],
      actions: ["Bilder prüfen", "Training vorbereiten", "Brand Look speichern"],
    },
    gallery: {
      thumbnails: LORA_REFERENCE_IMAGES,
      demoNote: "Demo-Referenzen — kein trainiertes Modell.",
      assets: ["Reference Set", "Persona Draft", "Training Batch", "Creator DNA"],
      actions: ["Visual erstellen", "UGC Script", "Kampagne"],
    },
  },
  {
    id: "ugc-beauty-hooks",
    label: "UGC Hooks Beauty",
    cockpit: {
      command: "Schreibe 5 UGC-Hooks für eine Beauty-Marke — natürlich, nahbar, TikTok-tauglich.",
      signals: [
        { label: "Intent", value: "Hooks" },
        { label: "Branche", value: "Beauty" },
        { label: "Plattform", value: "TikTok" },
        { label: "Engine", value: "Script" },
      ],
    },
    agent: {
      original: "Ich brauche Hooks für meine Skincare-Marke.",
      optimized:
        "Five UGC hook variants for a beauty brand: conversational tone, problem-solution openers, social-native pacing, platform-ready for TikTok and Reels.",
      chips: ["Zielgruppe erkannt", "Ton angepasst", "Hook-Set bereit"],
    },
    workflow: {
      title: "Hook Generator",
      rows: [
        { label: "Format", value: "Hook Set" },
        { label: "Stil", value: "UGC / Beauty" },
        { label: "Anzahl", value: "5 Varianten" },
        { label: "Status", value: "Vorbereitung" },
      ],
      actions: ["Visual erstellen", "Reel vorbereiten", "In Kampagne"],
    },
    gallery: {
      assets: ["Hook Set", "Script Draft", "Visual Idee", "Varianten"],
      actions: ["Als Video", "Wiederverwenden", "Export vorbereiten"],
    },
  },
  {
    id: "ugc-skincare-campaign",
    label: "UGC Hautpflege",
    cockpit: {
      command: "Erstelle UGC-Kampagnenassets für ein neues Hautpflegeprodukt — Hook, Visual und Reel-Idee.",
      signals: [
        { label: "Intent", value: "Kampagne" },
        { label: "Produkt", value: "Hautpflege" },
        { label: "Format", value: "9:16" },
        { label: "Engine", value: "Mixed" },
      ],
    },
    agent: {
      original: "Wir launchen eine neue Serum-Linie und brauchen UGC-Content.",
      optimized:
        "UGC campaign prep for skincare launch: hook variants, product visual direction, short-form reel structure, brand-safe tone for social ads.",
      chips: ["Produkt erkannt", "Kampagnenpfad", "Assets geplant"],
    },
    workflow: {
      title: "Kampagnenvorbereitung",
      rows: [
        { label: "Format", value: "9:16 + 4:5" },
        { label: "Stil", value: "UGC / Skincare" },
        { label: "Deliverables", value: "Hook + Visual + Reel" },
        { label: "Status", value: "Vorbereitung" },
      ],
      actions: ["Visual erstellen", "Hook schreiben", "In Galerie"],
    },
    gallery: {
      assets: ["Campaign Brief", "Hook Set", "Product Visual", "Reel Draft"],
      actions: ["Wiederverwenden", "Als Video", "Varianten"],
    },
  },
] as const;
