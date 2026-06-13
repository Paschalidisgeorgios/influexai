export type ThemeKey = "green" | "blue" | "violet";

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  tags: string[];
  creditCost: number;
  themeKey: ThemeKey;
  durations: string[];
  resolutions: string[];
  supportsStart: boolean;
  supportsEnd: boolean;
  supportsAudio: boolean;
  supportsReference: boolean;
  supportsCamera: boolean;
  sampleImageUrl: string;
  params: {
    cameraMovement?: string[];
    shotType?: string[];
    expression?: string[];
    atmosphere?: string[];
    light?: string[];
    effectEnhance?: string[];
    aspectRatio?: string[];
    style?: string[];
  };
}

export const THEME_COLORS = {
  green: { r: 0, g: 255, b: 102, hex: "#00FF66", rgb: "0,255,102" },
  blue: { r: 0, g: 102, b: 255, hex: "#0066FF", rgb: "0,102,255" },
  violet: { r: 153, g: 0, b: 255, hex: "#9900FF", rgb: "153,0,255" },
} as const;

const CINEMATIC_PARAMS: AIModel["params"] = {
  cameraMovement: [
    "Keiner",
    "Rotate Around",
    "Zoom In",
    "Zoom Out",
    "Pan Left",
    "Pan Right",
  ],
  shotType: ["Keiner", "Wide", "Medium", "Close-Up", "Extreme Close-Up"],
  expression: ["Keiner", "Happy", "Sad", "Surprised", "Neutral"],
  atmosphere: ["Keiner", "Dramatic", "Romantic", "Mysterious", "Energetic"],
  light: ["None", "Golden Hour", "Soft Box", "Studio", "Natural"],
  effectEnhance: ["Keiner", "Leicht", "Mittel", "Stark"],
  aspectRatio: ["16:9", "9:16", "1:1", "4:5"],
};

export const AI_MODELS: AIModel[] = [
  {
    id: "seedance-2.0",
    name: "Seedance 2.0",
    provider: "Seedance",
    description:
      "Flagship video model with native audio, references and frame animation.",
    tags: ["Start", "End", "Audio", "References"],
    creditCost: 1100,
    themeKey: "blue",
    durations: ["2s", "5s", "8s", "10s"],
    resolutions: ["720p", "1080p"],
    supportsStart: true,
    supportsEnd: true,
    supportsAudio: true,
    supportsReference: true,
    supportsCamera: true,
    sampleImageUrl:
      "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=900&q=85",
    params: { ...CINEMATIC_PARAMS },
  },
  {
    id: "seedance-2.0-fast",
    name: "Seedance 2.0 Fast",
    provider: "Seedance",
    description: "Schnelle Variante für schnelle Iterationen ohne Audio.",
    tags: ["Start", "End", "References"],
    creditCost: 900,
    themeKey: "green",
    durations: ["2s", "5s", "8s"],
    resolutions: ["720p"],
    supportsStart: true,
    supportsEnd: true,
    supportsAudio: false,
    supportsReference: true,
    supportsCamera: true,
    sampleImageUrl:
      "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=900&q=85",
    params: { ...CINEMATIC_PARAMS },
  },
  {
    id: "kling-3.0-omni",
    name: "Kling 3.0 Omni",
    provider: "Kling",
    description: "Omni-Modell für komplexe Szenen mit Start- und Endframe.",
    tags: ["Start", "End", "Camera"],
    creditCost: 1200,
    themeKey: "violet",
    durations: ["5s", "8s", "10s"],
    resolutions: ["720p", "1080p"],
    supportsStart: true,
    supportsEnd: true,
    supportsAudio: false,
    supportsReference: true,
    supportsCamera: true,
    sampleImageUrl:
      "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=900&q=85",
    params: { ...CINEMATIC_PARAMS },
  },
  {
    id: "akool-t2v-fast",
    name: "Akool T2V Fast",
    provider: "Akool",
    description: "Text-to-Video für Story Creator und schnelle Clips.",
    tags: ["Text", "Fast"],
    creditCost: 800,
    themeKey: "blue",
    durations: ["5s", "8s"],
    resolutions: ["720p", "1080p"],
    supportsStart: false,
    supportsEnd: false,
    supportsAudio: false,
    supportsReference: false,
    supportsCamera: true,
    sampleImageUrl:
      "https://images.unsplash.com/photo-1604871000636-074fa5117945?w=900&q=85",
    params: {
      aspectRatio: ["16:9", "9:16"],
      style: ["Cinematic", "Realistic", "Anime", "Documentary"],
    },
  },
  {
    id: "fal-ai/flux-2-pro",
    name: "Flux 2 Pro",
    provider: "fal.ai",
    description: "High-end Bildgenerierung mit präziser Prompt-Kontrolle.",
    tags: ["Image", "Pro"],
    creditCost: 12,
    themeKey: "green",
    durations: [],
    resolutions: ["1024px", "1536px"],
    supportsStart: false,
    supportsEnd: false,
    supportsAudio: false,
    supportsReference: true,
    supportsCamera: false,
    sampleImageUrl:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=900&q=85",
    params: {
      aspectRatio: ["1:1", "16:9", "9:16", "4:5"],
      style: ["Photo", "Illustration", "3D", "Flat"],
    },
  },
  {
    id: "fal-ai/flux-pro",
    name: "Flux Pro",
    provider: "fal.ai",
    description: "Ausgewogenes Bildmodell für schnelle Content-Produktion.",
    tags: ["Image"],
    creditCost: 8,
    themeKey: "violet",
    durations: [],
    resolutions: ["1024px"],
    supportsStart: false,
    supportsEnd: false,
    supportsAudio: false,
    supportsReference: false,
    supportsCamera: false,
    sampleImageUrl:
      "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=900&q=85",
    params: {
      aspectRatio: ["1:1", "16:9", "9:16"],
      style: ["Photo", "Illustration", "Anime"],
    },
  },
];

export function getModelById(id: string): AIModel | undefined {
  return AI_MODELS.find((m) => m.id === id);
}

export function getModelsByIds(ids: string[]): AIModel[] {
  return ids
    .map((id) => getModelById(id))
    .filter((m): m is AIModel => Boolean(m));
}
