/** App Studio — data-driven tool & API configuration for the canvas workspace */

import {
  CONTENT_KALENDER_FREQUENCIES,
  CONTENT_KALENDER_PLATFORMS,
} from "@/lib/content-kalender-tool";
import {
  CANVAS_TOOL_BASE_COINS,
  CANVAS_TOOL_HIGH_RES_COINS,
} from "./tool-credit-costs";

export type ToolOutputType = "text" | "script" | "image" | "video" | "audio" | "train" | "agent" | "calendar";

export type ToolCategory =
  | "ERSTELLEN"
  | "VISUALS"
  | "VIDEO & FILM"
  | "AVATAR & LIVE"
  | "AUDIO"
  | "AUTOMATION";

export type ParamFieldType =
  | "string"
  | "textarea"
  | "select"
  | "multiselect"
  | "boolean"
  | "number"
  | "slider"
  | "file"
  | "file-list"
  | "node-ref";

export interface ParamOption {
  value: string;
  label: string;
}

export interface ToolParamSchema {
  key: string;
  label: string;
  type: ParamFieldType;
  required?: boolean;
  defaultValue?: string | number | boolean | string[];
  placeholder?: string;
  options?: ParamOption[];
  min?: number;
  max?: number;
  step?: number;
  acceptsOutputTypes?: ToolOutputType[];
}

export interface StylePreset {
  id: string;
  label: string;
}

export interface ToolApiDefinition {
  id: string;
  label: string;
  icon: string;
  category: ToolCategory;
  outputType: ToolOutputType;
  baseCoins: number;
  highResCoins?: number;
  description: string;
  accent: string;
  accentRgb: string;
  params: ToolParamSchema[];
  stylePresets?: StylePreset[];
  outputDescription: string;
  followUpTools?: string[];
  apiRoute?: string;
}

export const TOOL_CATEGORIES: ToolCategory[] = [
  "ERSTELLEN",
  "VISUALS",
  "VIDEO & FILM",
  "AVATAR & LIVE",
  "AUDIO",
  "AUTOMATION",
];

export const TOOL_API_SCHEMA: Record<string, ToolApiDefinition> = {
  "viral-hook": {
    id: "viral-hook",
    label: "Viral Hook",
    icon: "⚡",
    category: "ERSTELLEN",
    outputType: "text",
    baseCoins: CANVAS_TOOL_BASE_COINS["viral-hook"],
    description: "Generiere scroll-stoppende Hooks für Short-Form Content.",
    accent: "#B7FF00",
    accentRgb: "183,255,0",
    outputDescription: "3 generative Hooks",
    followUpTools: ["trend-script", "flux-image"],
    apiRoute: "/api/viral-hook",
    params: [
      { key: "nische", label: "Nische", type: "string", required: true, placeholder: "z.B. Fitness, SaaS, Food" },
      {
        key: "plattform",
        label: "Plattform",
        type: "select",
        defaultValue: "TikTok",
        options: [
          { value: "TikTok", label: "TikTok" },
          { value: "Reels", label: "Reels" },
          { value: "Shorts", label: "Shorts" },
        ],
      },
      {
        key: "tonfall",
        label: "Tonfall",
        type: "select",
        defaultValue: "neugierig",
        options: [
          { value: "aggressiv", label: "Aggressiv" },
          { value: "neugierig", label: "Neugierig" },
          { value: "story", label: "Story" },
        ],
      },
    ],
  },
  "content-kalender": {
    id: "content-kalender",
    label: "Content Kalender",
    icon: "📅",
    category: "ERSTELLEN",
    outputType: "calendar",
    baseCoins: CANVAS_TOOL_BASE_COINS["content-kalender"],
    description: "Plane Posts mit Themen, Hooks und Zeitfenstern.",
    accent: "#00D5FF",
    accentRgb: "0,213,255",
    outputDescription: "Interaktives Kalender-Grid",
    followUpTools: ["trend-script", "flux-image"],
    apiRoute: "/api/content-kalender",
    params: [
      {
        key: "nische",
        label: "Nische",
        type: "string",
        required: true,
        placeholder: "z.B. Fitness, SaaS, Food",
      },
      {
        key: "zielgruppe",
        label: "Zielgruppe",
        type: "string",
        placeholder: "z.B. Creator 25–35 (optional)",
      },
      {
        key: "plattform",
        label: "Plattform",
        type: "select",
        required: true,
        defaultValue: "TikTok",
        options: CONTENT_KALENDER_PLATFORMS.map((p) => ({ value: p, label: p })),
      },
      {
        key: "frequenz",
        label: "Post-Frequenz",
        type: "select",
        defaultValue: "taeglich",
        options: CONTENT_KALENDER_FREQUENCIES.map((f) => ({
          value: f.id,
          label: f.label,
        })),
      },
    ],
  },
  "trend-script": {
    id: "trend-script",
    label: "Trend Script",
    icon: "📈",
    category: "ERSTELLEN",
    outputType: "text",
    baseCoins: CANVAS_TOOL_BASE_COINS["trend-script"],
    description: "Trend-Thema in fertiges Sprecher-Skript mit B-Roll-Regie.",
    accent: "#FFD84D",
    accentRgb: "255,216,77",
    outputDescription: "Sprecher-Skript + B-Roll Regie",
    followUpTools: ["avatar-studio", "seedance-video", "melodia-studio"],
    apiRoute: "/api/generate",
    params: [
      { key: "trend_thema", label: "Trend-Thema", type: "string", required: true },
      {
        key: "video_laenge",
        label: "Video-Länge",
        type: "select",
        defaultValue: "60s",
        options: [
          { value: "30s", label: "30s" },
          { value: "60s", label: "60s" },
          { value: "90s", label: "90s" },
        ],
      },
      {
        key: "script_input",
        label: "Hook / Vorlage",
        type: "textarea",
        acceptsOutputTypes: ["text"],
        placeholder: "Optional: Hook aus vorheriger Node übernehmen",
      },
    ],
  },
  "script-generator": {
    id: "script-generator",
    label: "Script Generator",
    icon: "📝",
    category: "ERSTELLEN",
    outputType: "script",
    baseCoins: CANVAS_TOOL_BASE_COINS["script-generator"],
    description: "Vollständiges Video-Skript mit Hook, Body und CTA.",
    accent: "#B7FF00",
    accentRgb: "183,255,0",
    outputDescription: "Sprecher-Skript",
    followUpTools: ["seedance-video", "avatar-studio"],
    apiRoute: "/api/generate",
    params: [
      {
        key: "topic",
        label: "Thema / Prompt",
        type: "textarea",
        required: true,
        placeholder: "z.B. Warum KI Creator die Zukunft sind…",
      },
      {
        key: "video_laenge",
        label: "Video-Länge",
        type: "select",
        defaultValue: "60s",
        options: [
          { value: "15s", label: "15 Sek" },
          { value: "30s", label: "30 Sek" },
          { value: "60s", label: "60 Sek" },
          { value: "180s", label: "3 Min" },
        ],
      },
      {
        key: "tonfall",
        label: "Ton / Stil",
        type: "select",
        defaultValue: "energetisch",
        options: [
          { value: "energetisch", label: "Energetisch & Motivierend" },
          { value: "informativ", label: "Informativ & Sachlich" },
          { value: "unterhaltsam", label: "Unterhaltsam & Witzig" },
          { value: "dramatisch", label: "Dramatisch & Emotional" },
        ],
      },
      {
        key: "sprache",
        label: "Sprache",
        type: "select",
        defaultValue: "de",
        options: [
          { value: "de", label: "Deutsch" },
          { value: "en", label: "Englisch" },
          { value: "bilingual", label: "Deutsch + Englisch" },
        ],
      },
    ],
  },
  "produkt-werbung": {
    id: "produkt-werbung",
    label: "Produkt-Werbung",
    icon: "📢",
    category: "ERSTELLEN",
    outputType: "text",
    baseCoins: CANVAS_TOOL_BASE_COINS["produkt-werbung"],
    description: "Ad-Copy und Spot-Texte aus Produkt-USPs.",
    accent: "#FF4DDF",
    accentRgb: "255,77,223",
    outputDescription: "Werbetext + CTA-Varianten",
    followUpTools: ["flux-image", "seedance-video"],
    apiRoute: "/api/product-ad/script",
    params: [
      { key: "produkt_name", label: "Produktname", type: "string", required: true },
      { key: "usps", label: "USPs", type: "textarea", required: true },
      {
        key: "werbe_ziel",
        label: "Werbeziel",
        type: "select",
        defaultValue: "conversion",
        options: [
          { value: "conversion", label: "Conversion" },
          { value: "branding", label: "Branding" },
        ],
      },
    ],
  },
  "flux-image": {
    id: "flux-image",
    label: "Bild Generator",
    icon: "🖼",
    category: "VISUALS",
    outputType: "image",
    baseCoins: CANVAS_TOOL_BASE_COINS["flux-image"],
    highResCoins: CANVAS_TOOL_HIGH_RES_COINS["flux-image"],
    description: "Flux-basierte Bildgenerierung mit Stil-Presets.",
    accent: "#8B5DFF",
    accentRgb: "139,93,255",
    outputDescription: "Generiertes Bild (1–4 Varianten)",
    followUpTools: ["seedance-video", "video-transformer", "ki-ich"],
    apiRoute: "/api/generate-image",
    stylePresets: [
      { id: "ugc", label: "Authentisch / UGC" },
      { id: "editorial", label: "Editorial" },
      { id: "cinematic", label: "Cinematisch" },
      { id: "product", label: "Produkt" },
    ],
    params: [
      { key: "prompt", label: "Beschreibung", type: "textarea", required: true },
      {
        key: "aspect_ratio",
        label: "Seitenverhältnis",
        type: "select",
        defaultValue: "9:16",
        options: [
          { value: "1:1", label: "1:1" },
          { value: "16:9", label: "16:9" },
          { value: "9:16", label: "9:16" },
          { value: "4:3", label: "4:3" },
        ],
      },
      {
        key: "num_images",
        label: "Anzahl Bilder",
        type: "slider",
        min: 1,
        max: 4,
        step: 1,
        defaultValue: 1,
      },
      {
        key: "style_preset",
        label: "Stil",
        type: "select",
        defaultValue: "ugc",
        options: [
          { id: "ugc", label: "Authentisch / UGC" },
          { id: "editorial", label: "Editorial" },
          { id: "cinematic", label: "Cinematisch" },
          { id: "product", label: "Produkt" },
        ].map((p) => ({ value: p.id, label: p.label })),
      },
    ],
  },
  "ki-ich": {
    id: "ki-ich",
    label: "KI-Ich",
    icon: "👤",
    category: "VISUALS",
    outputType: "image",
    baseCoins: CANVAS_TOOL_BASE_COINS["ki-ich"],
    description: "Dein trainierter Avatar-Klon in neuen Szenen.",
    accent: "#B7FF00",
    accentRgb: "183,255,0",
    outputDescription: "Avatar-Bild mit konsistentem Look",
    followUpTools: ["seedance-video", "avatar-studio"],
    apiRoute: "/api/ki-influencer/generate",
    params: [
      { key: "prompt", label: "Szene beschreiben", type: "textarea", required: true },
      {
        key: "characterId",
        label: "Avatar-Klon",
        type: "select",
        required: true,
        defaultValue: "",
        options: [],
      },
      { key: "kleidungs_stil", label: "Kleidungsstil", type: "string", placeholder: "z.B. Business Casual" },
      {
        key: "reference_image",
        label: "Referenzbild",
        type: "node-ref",
        acceptsOutputTypes: ["image"],
      },
    ],
  },
  "lora-training": {
    id: "lora-training",
    label: "LoRA Training",
    icon: "🎨",
    category: "VISUALS",
    outputType: "train",
    baseCoins: CANVAS_TOOL_BASE_COINS["lora-training"],
    description: "Trainiere einen wiedererkennbaren Look für deine Marke.",
    accent: "#FFD84D",
    accentRgb: "255,216,77",
    outputDescription: "Trainiertes LoRA-Modell",
    followUpTools: ["flux-image", "ki-ich"],
    apiRoute: "/api/lora/train",
    params: [
      { key: "dataset_zip", label: "Dataset (ZIP)", type: "file", required: true },
      { key: "trigger_word", label: "Trigger-Wort", type: "string", required: true },
      { key: "training_steps", label: "Training Steps", type: "number", defaultValue: 2000, min: 500, max: 5000 },
    ],
  },
  "seedance-video": {
    id: "seedance-video",
    label: "Video Generator",
    icon: "🎬",
    category: "VIDEO & FILM",
    outputType: "video",
    baseCoins: CANVAS_TOOL_BASE_COINS["seedance-video"],
    highResCoins: CANVAS_TOOL_HIGH_RES_COINS["seedance-video"],
    description: "Seedance Bild-zu-Video mit Audio-Synthese.",
    accent: "#00D5FF",
    accentRgb: "0,213,255",
    outputDescription: "Filmisches KI-Video",
    followUpTools: ["video-transformer", "video-uebersetzer", "lipsync-studio"],
    apiRoute: "/api/seedance",
    params: [
      { key: "prompt", label: "Szenen-Beschreibung", type: "textarea", required: true },
      {
        key: "modelId",
        label: "Modell",
        type: "select",
        required: true,
        defaultValue: "",
        options: [],
      },
      {
        key: "duration",
        label: "Dauer (Sek.)",
        type: "slider",
        min: 4,
        max: 15,
        step: 1,
        defaultValue: 8,
      },
      {
        key: "resolution",
        label: "Auflösung",
        type: "select",
        defaultValue: "720p",
        options: [],
      },
      { key: "generate_audio", label: "Audio generieren", type: "boolean", defaultValue: true },
      {
        key: "images_list",
        label: "Referenzbilder (bis 4)",
        type: "file-list",
        required: true,
        acceptsOutputTypes: ["image"],
      },
      {
        key: "script_ref",
        label: "Skript / Voiceover",
        type: "node-ref",
        acceptsOutputTypes: ["text"],
      },
    ],
  },
  "video-transformer": {
    id: "video-transformer",
    label: "Video Transformer",
    icon: "🎭",
    category: "VIDEO & FILM",
    outputType: "video",
    baseCoins: CANVAS_TOOL_BASE_COINS["video-transformer"],
    description: "Stil-Transfer und Motion auf bestehendem Footage.",
    accent: "#8B5DFF",
    accentRgb: "139,93,255",
    outputDescription: "Transformiertes Video",
    followUpTools: ["video-uebersetzer", "lipsync-studio"],
    apiRoute: "/api/akool/video-to-video",
    params: [
      {
        key: "input_video",
        label: "Input Video",
        type: "node-ref",
        acceptsOutputTypes: ["video", "image"],
        required: true,
      },
      {
        key: "transform_stil",
        label: "Transform-Stil",
        type: "select",
        defaultValue: "Anime",
        options: [
          { value: "Anime", label: "Anime" },
          { value: "Cyberpunk", label: "Cyberpunk" },
          { value: "3D-Pixar", label: "3D-Pixar" },
        ],
      },
      {
        key: "motion_strength",
        label: "Motion Strength",
        type: "slider",
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 50,
      },
    ],
  },
  "video-uebersetzer": {
    id: "video-uebersetzer",
    label: "Video Übersetzer",
    icon: "🌐",
    category: "VIDEO & FILM",
    outputType: "video",
    baseCoins: CANVAS_TOOL_BASE_COINS["video-uebersetzer"],
    description: "Übersetze Videos mit optionaler Lipsync-Korrektur.",
    accent: "#00F0FF",
    accentRgb: "0,240,255",
    outputDescription: "Übersetztes Video",
    apiRoute: "/api/akool/video-translation",
    params: [
      {
        key: "input_video",
        label: "Input Video",
        type: "node-ref",
        acceptsOutputTypes: ["video"],
        required: true,
      },
      {
        key: "ziel_sprache",
        label: "Zielsprache",
        type: "select",
        defaultValue: "Englisch",
        options: [
          { value: "Englisch", label: "Englisch" },
          { value: "Spanisch", label: "Spanisch" },
          { value: "Französisch", label: "Französisch" },
          { value: "Japanisch", label: "Japanisch" },
        ],
      },
      { key: "lipsync_correction", label: "Lipsync-Korrektur", type: "boolean", defaultValue: true },
      {
        key: "duration_minutes",
        label: "Video-Länge (Min.)",
        type: "number",
        defaultValue: 1,
        min: 1,
        max: 30,
      },
    ],
  },
  "avatar-studio": {
    id: "avatar-studio",
    label: "Avatar Studio",
    icon: "🤖",
    category: "AVATAR & LIVE",
    outputType: "video",
    baseCoins: CANVAS_TOOL_BASE_COINS["avatar-studio"],
    description: "Digitaler Zwilling spricht dein Skript in einer Szene.",
    accent: "#B7FF00",
    accentRgb: "183,255,0",
    outputDescription: "Avatar-Video",
    followUpTools: ["video-uebersetzer", "lipsync-studio"],
    apiRoute: "/api/avatar/start-render",
    params: [
      { key: "avatar_id", label: "Avatar", type: "string", placeholder: "Digitaler Zwilling" },
      {
        key: "audio_script",
        label: "Skript / Audio",
        type: "textarea",
        acceptsOutputTypes: ["text", "audio"],
        required: true,
      },
      { key: "background_scene", label: "Hintergrund-Szene", type: "string", placeholder: "z.B. Modernes Studio" },
    ],
  },
  "lipsync-studio": {
    id: "lipsync-studio",
    label: "Lipsync Studio",
    icon: "💋",
    category: "AVATAR & LIVE",
    outputType: "video",
    baseCoins: CANVAS_TOOL_BASE_COINS["lipsync-studio"],
    description: "Neue Stimme auf bestehendes Video legen.",
    accent: "#FF4DDF",
    accentRgb: "255,77,223",
    outputDescription: "Lipsync-Video",
    apiRoute: "/api/akool/lipsync",
    params: [
      {
        key: "input_video",
        label: "Video",
        type: "node-ref",
        acceptsOutputTypes: ["video"],
        required: true,
      },
      {
        key: "input_audio",
        label: "Neue Stimme",
        type: "node-ref",
        acceptsOutputTypes: ["audio"],
        required: true,
      },
    ],
  },
  "melodia-studio": {
    id: "melodia-studio",
    label: "Melodia Studio",
    icon: "🎵",
    category: "AUDIO",
    outputType: "audio",
    baseCoins: CANVAS_TOOL_BASE_COINS["melodia-studio"],
    description: "Musik und SFX aus Text-Prompts.",
    accent: "#8B5DFF",
    accentRgb: "139,93,255",
    outputDescription: "Audio-Track / Wellenform",
    followUpTools: ["avatar-studio", "lipsync-studio", "seedance-video"],
    apiRoute: "/api/melodia",
    params: [
      { key: "message", label: "Musik / SFX Beschreibung", type: "textarea", required: true },
      {
        key: "duration",
        label: "Dauer",
        type: "select",
        defaultValue: "30s",
        options: [
          { value: "10s", label: "10s" },
          { value: "30s", label: "30s" },
          { value: "60s", label: "60s" },
          { value: "120s", label: "2min" },
        ],
      },
      { key: "bpm", label: "BPM", type: "number", defaultValue: 120, min: 60, max: 180 },
    ],
  },
  "agent-autopilot": {
    id: "agent-autopilot",
    label: "KI Agent",
    icon: "⭐",
    category: "AUTOMATION",
    outputType: "agent",
    baseCoins: CANVAS_TOOL_BASE_COINS["agent-autopilot"],
    description: "Stelle eine Aufgabe — der Agent erledigt sie mit den passenden Tools.",
    accent: "#00D5FF",
    accentRgb: "0,213,255",
    outputDescription: "Antwort + Ergebnisse aus genutzten Tools",
    followUpTools: ["flux-image", "seedance-video", "trend-script"],
    apiRoute: "/api/agent",
    params: [
      {
        key: "campaign_goal",
        label: "Anfrage / Aufgabe",
        type: "textarea",
        required: true,
        placeholder: "Was soll der Agent für dich erledigen?",
      },
      {
        key: "platforms",
        label: "Kontext (optional)",
        type: "multiselect",
        defaultValue: ["TikTok", "Instagram"],
        placeholder: "Wird als Kontext an den Agenten übergeben.",
        options: [
          { value: "TikTok", label: "TikTok" },
          { value: "Instagram", label: "Instagram" },
          { value: "YouTube", label: "YouTube" },
          { value: "LinkedIn", label: "LinkedIn" },
        ],
      },
    ],
  },
};

export type ToolId = keyof typeof TOOL_API_SCHEMA;

export const ALL_TOOL_IDS = Object.keys(TOOL_API_SCHEMA) as ToolId[];

export function getToolDefinition(toolId: string): ToolApiDefinition | undefined {
  return TOOL_API_SCHEMA[toolId];
}

export function getToolsByCategory(category: ToolCategory): ToolApiDefinition[] {
  return ALL_TOOL_IDS.map((id) => TOOL_API_SCHEMA[id]).filter((t) => t.category === category);
}

/** Route → canvas tool id for SPA-style spawning */
export const ROUTE_TO_TOOL_ID: Record<string, ToolId> = {
  "/dashboard/viral-hook": "viral-hook",
  "/dashboard/content-kalender": "content-kalender",
  "/dashboard/script-generator": "script-generator",
  "/dashboard/trend-to-script": "trend-script",
  "/dashboard/produkt": "produkt-werbung",
  "/dashboard/image-generator": "flux-image",
  "/dashboard/ki-influencer": "ki-ich",
  "/dashboard/ki-ich": "ki-ich",
  "/dashboard/lora-training": "lora-training",
  "/dashboard/szenen-generator": "seedance-video",
  "/dashboard/seedance": "seedance-video",
  "/dashboard/video-transformer": "video-transformer",
  "/dashboard/video-uebersetzer": "video-uebersetzer",
  "/dashboard/video-translation": "video-uebersetzer",
  "/dashboard/avatar-studio": "avatar-studio",
  "/dashboard/lipsync": "lipsync-studio",
  "/dashboard/lipsync-studio": "lipsync-studio",
  "/dashboard/melodia": "melodia-studio",
  "/dashboard/ki-agent": "agent-autopilot",
  "/dashboard/agent": "agent-autopilot",
  "/dashboard": "agent-autopilot",
};

export function resolveToolIdFromPath(pathname: string): ToolId | null {
  if (ROUTE_TO_TOOL_ID[pathname]) return ROUTE_TO_TOOL_ID[pathname];
  const match = Object.entries(ROUTE_TO_TOOL_ID).find(
    ([route]) => route !== "/dashboard" && pathname.startsWith(route)
  );
  return match ? match[1] : null;
}
