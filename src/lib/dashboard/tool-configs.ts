export type ToolType =
  | "agent-autopilot"
  | "viral-hook"
  | "content-kalender"
  | "trend-script"
  | "produkt-werbung"
  | "bild-generator"
  | "ki-ich"
  | "lora-training"
  | "szenen-generator"
  | "story-creator"
  | "video-transformer"
  | "video-uebersetzer"
  | "live-creator"
  | "avatar-studio"
  | "character-studio";

export interface CustomField {
  id: string;
  label: string;
  type: "select" | "slider" | "toggle";
  options?: string[];
  min?: number;
  max?: number;
  defaultValue: string | number | boolean;
}

export interface AllowedModel {
  id: string;
  name: string;
  type: "video" | "image";
}

export interface ToolConfig {
  id: ToolType;
  title: string;
  category: string;
  icon: string;
  allowedModels: AllowedModel[];
  defaultModel: string;
  options: {
    hasPromptInput: boolean;
    promptPlaceholder: string;
    customFields: CustomField[];
  };
}

export const TOOL_CONFIGS: Record<ToolType, ToolConfig> = {
  "agent-autopilot": {
    id: "agent-autopilot",
    title: "Agent Autopilot",
    category: "AUTOMATION",
    icon: "⭐",
    allowedModels: [
      { id: "seedance-2.0-fast", name: "Seedance 2.0 Fast", type: "video" },
      { id: "kling-3.0-omni", name: "Kling 3.0 Omni", type: "video" },
      { id: "hallu-2.3-fast", name: "Hallu 2.3 Fast", type: "image" },
    ],
    defaultModel: "seedance-2.0-fast",
    options: {
      hasPromptInput: true,
      promptPlaceholder:
        "Beschreibe was du brauchst – der Agent erledigt den Rest...",
      customFields: [
        {
          id: "creator-dna",
          label: "Creator DNA / Ästhetik",
          type: "select",
          options: [
            "Griechische Ästhetik (Instagram)",
            "Cyberpunk Noir (TikTok)",
            "Clean Tech (LinkedIn)",
          ],
          defaultValue: "Griechische Ästhetik (Instagram)",
        },
        {
          id: "auto-optimize",
          label: "Prompt durch KI erweitern (Auto-Enhance)",
          type: "toggle",
          defaultValue: true,
        },
      ],
    },
  },
  "viral-hook": {
    id: "viral-hook",
    title: "Viral Hook Generator",
    category: "ERSTELLEN",
    icon: "⚡",
    allowedModels: [{ id: "hallu-2.3-fast", name: "Hallu 2.3 Fast", type: "image" }],
    defaultModel: "hallu-2.3-fast",
    options: {
      hasPromptInput: true,
      promptPlaceholder: "Füge deine Video-Idee oder eine URL ein...",
      customFields: [
        {
          id: "hook-count",
          label: "Anzahl der Hooks",
          type: "slider",
          min: 3,
          max: 15,
          defaultValue: 5,
        },
        {
          id: "psychology-trigger",
          label: "Psychologischer Trigger",
          type: "select",
          options: ["FOMO", "Neugier-Spalt (Curiosity Gap)", "Ego-Stichelung"],
          defaultValue: "Neugier-Spalt (Curiosity Gap)",
        },
      ],
    },
  },
  "content-kalender": {
    id: "content-kalender",
    title: "Content Kalender",
    category: "ERSTELLEN",
    icon: "📅",
    allowedModels: [{ id: "hallu-2.3-fast", name: "Hallu 2.3 Fast", type: "image" }],
    defaultModel: "hallu-2.3-fast",
    options: {
      hasPromptInput: true,
      promptPlaceholder: "Beschreibe deine Nische für den Monatsplan...",
      customFields: [
        {
          id: "duration",
          label: "Zeitraum",
          type: "select",
          options: ["7 Tage Sprint", "30 Tage Plan", "90 Tage Strategie"],
          defaultValue: "30 Tage Plan",
        },
        {
          id: "post-frequency",
          label: "Frequenz pro Tag",
          type: "slider",
          min: 1,
          max: 4,
          defaultValue: 1,
        },
        {
          id: "generate-thumbnails",
          label: "KI-Vorschaubilder generieren",
          type: "toggle",
          defaultValue: true,
        },
      ],
    },
  },
  "trend-script": {
    id: "trend-script",
    title: "Trend Script Writer",
    category: "ERSTELLEN",
    icon: "📈",
    allowedModels: [{ id: "hallu-2.3-fast", name: "Hallu 2.3 Fast", type: "image" }],
    defaultModel: "hallu-2.3-fast",
    options: {
      hasPromptInput: true,
      promptPlaceholder: "Füge einen Trend-Ausschnitt oder ein Thema ein...",
      customFields: [
        {
          id: "video-length",
          label: "Geplante Videolänge",
          type: "select",
          options: ["15 Sekunden", "60 Sekunden", "90+ Sekunden"],
          defaultValue: "60 Sekunden",
        },
        {
          id: "pacing",
          label: "Sprechtempo / Pacing",
          type: "select",
          options: ["Koffein-Modus (Sehr schnell)", "Normaler Redefluss"],
          defaultValue: "Koffein-Modus (Sehr schnell)",
        },
      ],
    },
  },
  "produkt-werbung": {
    id: "produkt-werbung",
    title: "Produkt-Werbung",
    category: "ERSTELLEN",
    icon: "📢",
    allowedModels: [
      { id: "seedance-2.0-fast", name: "Seedance 2.0 Fast", type: "video" },
      { id: "kling-3.0-omni", name: "Kling 3.0 Omni", type: "video" },
    ],
    defaultModel: "seedance-2.0-fast",
    options: {
      hasPromptInput: true,
      promptPlaceholder: "Welches Produkt bewirbst du? Nenne USPs...",
      customFields: [
        {
          id: "ad-angle",
          label: "Werbe-Blickwinkel (Angle)",
          type: "select",
          options: ["Problem-Lösung", "UGC Unboxing Style", "Cinematic Slam"],
          defaultValue: "Problem-Lösung",
        },
        {
          id: "commercial-bg",
          label: "Werbe-Musik unterlegen",
          type: "toggle",
          defaultValue: true,
        },
      ],
    },
  },
  "bild-generator": {
    id: "bild-generator",
    title: "Bild Generator",
    category: "VISUALS",
    icon: "🖼",
    allowedModels: [{ id: "hallu-2.3-fast", name: "Hallu 2.3 Fast", type: "image" }],
    defaultModel: "hallu-2.3-fast",
    options: {
      hasPromptInput: true,
      promptPlaceholder: "Ein kinoreifer Shot von...",
      customFields: [
        {
          id: "aspect-ratio",
          label: "Seitenverhältnis",
          type: "select",
          options: ["9:16 (Vertical)", "16:9 (Cinematic)", "1:1 (Square)"],
          defaultValue: "9:16 (Vertical)",
        },
        {
          id: "visual-style",
          label: "Stilrichtung",
          type: "select",
          options: ["Fotorealismus 8K", "Cyberpunk Neon", "Studio-Fotografie"],
          defaultValue: "Fotorealismus 8K",
        },
        {
          id: "cfg-scale",
          label: "Prompt-Treue (CFG Scale)",
          type: "slider",
          min: 1,
          max: 20,
          defaultValue: 7,
        },
      ],
    },
  },
  "ki-ich": {
    id: "ki-ich",
    title: "KI-Ich Studio",
    category: "VISUALS",
    icon: "👤",
    allowedModels: [{ id: "hallu-2.3-fast", name: "Hallu 2.3 Fast", type: "image" }],
    defaultModel: "hallu-2.3-fast",
    options: {
      hasPromptInput: true,
      promptPlaceholder: "Aktion oder Kleidung deines Klons beschreiben...",
      customFields: [
        {
          id: "avatar-dataset",
          label: "Gesichts-Datensatz (Klon)",
          type: "select",
          options: ["Mein Haupt-Avatar (Georgios_v2)", "Model_Business_Male"],
          defaultValue: "Mein Haupt-Avatar (Georgios_v2)",
        },
        {
          id: "pose-match",
          label: "Posen-Treue (Inference)",
          type: "slider",
          min: 50,
          max: 100,
          defaultValue: 85,
        },
      ],
    },
  },
  "lora-training": {
    id: "lora-training",
    title: "LoRA Training Hub",
    category: "VISUALS",
    icon: "🎨",
    allowedModels: [{ id: "hallu-2.3-fast", name: "Hallu 2.3 Fast", type: "image" }],
    defaultModel: "hallu-2.3-fast",
    options: {
      hasPromptInput: false,
      promptPlaceholder: "",
      customFields: [
        {
          id: "dataset-size",
          label: "Anzahl der Bilder",
          type: "select",
          options: ["15 Bilder (Schnell)", "50 Bilder (HQ)", "100 Bilder (Max)"],
          defaultValue: "15 Bilder (Schnell)",
        },
        {
          id: "training-steps",
          label: "Trainings-Epochen (Steps)",
          type: "slider",
          min: 1000,
          max: 5000,
          defaultValue: 2000,
        },
      ],
    },
  },
  "szenen-generator": {
    id: "szenen-generator",
    title: "Szenen Generator",
    category: "VIDEO & FILM",
    icon: "🎬",
    allowedModels: [
      { id: "seedance-2.0-fast", name: "Seedance 2.0 Fast", type: "video" },
      { id: "kling-3.0-omni", name: "Kling 3.0 Omni", type: "video" },
    ],
    defaultModel: "seedance-2.0-fast",
    options: {
      hasPromptInput: true,
      promptPlaceholder:
        "Beschreibe die Videoszene (z.B. Kamera fährt an Sportwagen vorbei)...",
      customFields: [
        {
          id: "camera-movement",
          label: "Kamerabewegung",
          type: "select",
          options: ["Dolly Zoom In", "Pan Left-to-Right", "Orbit Around Object"],
          defaultValue: "Dolly Zoom In",
        },
        {
          id: "motion-intensity",
          label: "Bewegungs-Intensität",
          type: "slider",
          min: 1,
          max: 10,
          defaultValue: 6,
        },
        {
          id: "video-fps",
          label: "Bildrate",
          type: "select",
          options: ["24 FPS (Cinema)", "60 FPS (Ultra Fluid)"],
          defaultValue: "60 FPS (Ultra Fluid)",
        },
      ],
    },
  },
  "story-creator": {
    id: "story-creator",
    title: "Story Creator",
    category: "VIDEO & FILM",
    icon: "✨",
    allowedModels: [{ id: "seedance-2.0-fast", name: "Seedance 2.0 Fast", type: "video" }],
    defaultModel: "seedance-2.0-fast",
    options: {
      hasPromptInput: true,
      promptPlaceholder: "Schreibe den groben Handlungsbogen deiner Story...",
      customFields: [
        {
          id: "scene-count",
          label: "Anzahl der Szenen",
          type: "slider",
          min: 3,
          max: 10,
          defaultValue: 4,
        },
        {
          id: "narrator-voice",
          label: "Erzähler-Stimme (AI Voice)",
          type: "select",
          options: ["Deutscher Tiefen-Sprecher (Stefan)", "US-Trailer-Voice (Mitch)"],
          defaultValue: "Deutscher Tiefen-Sprecher (Stefan)",
        },
      ],
    },
  },
  "video-transformer": {
    id: "video-transformer",
    title: "Video Transformer",
    category: "VIDEO & FILM",
    icon: "🎭",
    allowedModels: [
      { id: "seedance-2.0-fast", name: "Seedance 2.0 Fast", type: "video" },
      { id: "kling-3.0-omni", name: "Kling 3.0 Omni", type: "video" },
    ],
    defaultModel: "seedance-2.0-fast",
    options: {
      hasPromptInput: true,
      promptPlaceholder: "Beschreibe, in was das Video transformiert werden soll...",
      customFields: [
        {
          id: "input-source",
          label: "Quell-Video wählen",
          type: "select",
          options: ["Letzter Upload.mp4", "Aus Archiv wählen"],
          defaultValue: "Letzter Upload.mp4",
        },
        {
          id: "transform-style",
          label: "Ziel-Stil",
          type: "select",
          options: ["Reale Person → Anime", "Tag-Aufnahme → Cyberpunk-Nacht"],
          defaultValue: "Reale Person → Anime",
        },
        {
          id: "structural-fidelity",
          label: "Struktur-Erhalt",
          type: "slider",
          min: 10,
          max: 100,
          defaultValue: 75,
        },
      ],
    },
  },
  "video-uebersetzer": {
    id: "video-uebersetzer",
    title: "Video Übersetzer",
    category: "VIDEO & FILM",
    icon: "🌐",
    allowedModels: [{ id: "kling-3.0-omni", name: "Kling 3.0 Omni", type: "video" }],
    defaultModel: "kling-3.0-omni",
    options: {
      hasPromptInput: false,
      promptPlaceholder: "",
      customFields: [
        {
          id: "target-language",
          label: "Zielsprache",
          type: "select",
          options: ["Englisch (US Accent)", "Spanisch", "Japanisch"],
          defaultValue: "Englisch (US Accent)",
        },
        {
          id: "lip-sync",
          label: "KI-Lippensynchronisation (Lip-Sync)",
          type: "toggle",
          defaultValue: true,
        },
        {
          id: "voice-clone-accuracy",
          label: "Stimmklon-Präzision",
          type: "slider",
          min: 70,
          max: 100,
          defaultValue: 95,
        },
      ],
    },
  },
  "live-creator": {
    id: "live-creator",
    title: "Live Creator",
    category: "AVATAR & LIVE",
    icon: "🎥",
    allowedModels: [{ id: "seedance-2.0-fast", name: "Seedance 2.0 Fast", type: "video" }],
    defaultModel: "seedance-2.0-fast",
    options: {
      hasPromptInput: true,
      promptPlaceholder: "Füge das Live-Skript oder Verhaltensregeln für den Chat ein...",
      customFields: [
        {
          id: "stream-platform",
          label: "Streaming-Plattform",
          type: "select",
          options: ["TikTok Live", "Twitch", "YouTube Live"],
          defaultValue: "TikTok Live",
        },
        {
          id: "chat-interaction",
          label: "Interaktions-Level",
          type: "slider",
          min: 1,
          max: 10,
          defaultValue: 8,
        },
        {
          id: "moderation-filter",
          label: "Hate-Speech Filter",
          type: "select",
          options: ["Aggressiv blockieren", "Sarkastisch kontern"],
          defaultValue: "Sarkastisch kontern",
        },
      ],
    },
  },
  "avatar-studio": {
    id: "avatar-studio",
    title: "Avatar Studio",
    category: "AVATAR & LIVE",
    icon: "🤖",
    allowedModels: [
      { id: "seedance-2.0-fast", name: "Seedance 2.0 Fast", type: "video" },
      { id: "kling-3.0-omni", name: "Kling 3.0 Omni", type: "video" },
    ],
    defaultModel: "seedance-2.0-fast",
    options: {
      hasPromptInput: true,
      promptPlaceholder: "Sätze eingeben, die der Avatar einsprechen soll...",
      customFields: [
        {
          id: "avatar-model",
          label: "Avatar-Modell",
          type: "select",
          options: ["Business Suit Male", "Casual Hoodie Female", "Streetwear Influencer"],
          defaultValue: "Streetwear Influencer",
        },
        {
          id: "mic-input",
          label: "Audio-Quelle",
          type: "select",
          options: ["KI-Text-To-Speech", "Eigene Voice-Datei (.wav)"],
          defaultValue: "KI-Text-To-Speech",
        },
        {
          id: "micro-expressions",
          label: "Mikro-Mimik (Blinzeln, Atmen)",
          type: "toggle",
          defaultValue: true,
        },
      ],
    },
  },
  "character-studio": {
    id: "character-studio",
    title: "Character Studio",
    category: "AVATAR & LIVE",
    icon: "👥",
    allowedModels: [{ id: "hallu-2.3-fast", name: "Hallu 2.3 Fast", type: "image" }],
    defaultModel: "hallu-2.3-fast",
    options: {
      hasPromptInput: true,
      promptPlaceholder: "Beschreibe die Persönlichkeit und Herkunft des Charakters...",
      customFields: [
        {
          id: "char-backstory",
          label: "Archetyp / Rolle",
          type: "select",
          options: [
            "Der Mentor / Business-Coach",
            "Die Fitness-Motivation",
            "Der Tech-Nerd",
          ],
          defaultValue: "Der Mentor / Business-Coach",
        },
        {
          id: "creativity-bias",
          label: "Antwort-Kreativität (Temperature)",
          type: "slider",
          min: 1,
          max: 10,
          defaultValue: 7,
        },
        {
          id: "memory-depth",
          label: "Gedächtnis-Tiefe (Kontext)",
          type: "select",
          options: ["Kurzzeit (Nur Session)", "Langzeit (User-Memory)"],
          defaultValue: "Langzeit (User-Memory)",
        },
      ],
    },
  },
};

export const TOOL_CATEGORIES = [
  "AUTOMATION",
  "ERSTELLEN",
  "VISUALS",
  "VIDEO & FILM",
  "AVATAR & LIVE",
] as const;

export function getToolsByCategory(category: string): ToolConfig[] {
  return Object.values(TOOL_CONFIGS).filter((t) => t.category === category);
}

export function getDefaultFieldValues(toolId: ToolType): Record<string, string | number | boolean> {
  const config = TOOL_CONFIGS[toolId];
  const defaults: Record<string, string | number | boolean> = {};
  for (const field of config.options.customFields) {
    defaults[field.id] = field.defaultValue;
  }
  return defaults;
}
