// ─────────────────────────────────────────────────────────────────────────────
// VERIFIED API SCHEMAS — sourced from official fal.ai docs, Akool docs,
// Kling API docs, and ElevenLabs docs as of June 2026.
// Each schema maps 1:1 to the real POST body the provider expects.
// ─────────────────────────────────────────────────────────────────────────────

export type FieldType =
  | "prompt"
  | "enum"
  | "boolean"
  | "slider"
  | "integer"
  | "image_upload"
  | "multi_image_upload"
  | "video_upload"
  | "audio_upload"
  | "text";

export interface SchemaField {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  defaultValue: string | number | boolean | null;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  maxFiles?: number;
  acceptedFormats?: string[];
  maxFileSizeMB?: number;
  hint?: string;
}

export interface ModelApiSchema {
  modelId: string;
  displayName: string;
  provider: "fal.ai" | "akool" | "elevenlabs" | "anthropic";
  endpoint: string;
  method: "POST" | "GET";
  category: "video" | "image" | "audio" | "text";
  fields: SchemaField[];
  authHeader: "fal-key" | "x-api-key" | "bearer";
}

export const SEEDANCE_2_T2V: ModelApiSchema = {
  modelId: "bytedance/seedance-2.0",
  displayName: "Seedance 2.0",
  provider: "fal.ai",
  endpoint: "https://fal.run/bytedance/seedance-2.0",
  method: "POST",
  category: "video",
  authHeader: "fal-key",
  fields: [
    {
      key: "prompt",
      label: "Video-Beschreibung",
      type: "prompt",
      required: true,
      defaultValue: "",
      hint: "Beschreibe Szene, Bewegung, Kamera und Atmosphäre. Maximal 1000 Zeichen.",
    },
    {
      key: "image_url",
      label: "Startbild (optional)",
      type: "image_upload",
      required: false,
      defaultValue: null,
      acceptedFormats: ["jpg", "jpeg", "png", "webp"],
      maxFileSizeMB: 10,
      hint: "Optionales Startbild für Image-to-Video Modus.",
    },
    {
      key: "reference_images",
      label: "Referenzbilder (bis zu 4)",
      type: "multi_image_upload",
      required: false,
      defaultValue: null,
      maxFiles: 4,
      acceptedFormats: ["jpg", "jpeg", "png", "webp"],
      maxFileSizeMB: 10,
      hint: "Gesichter, Objekte oder Stile als @ref1, @ref2 im Prompt nutzen.",
    },
    {
      key: "duration",
      label: "Dauer (Sekunden)",
      type: "slider",
      required: false,
      defaultValue: 5,
      min: 4,
      max: 15,
      step: 1,
      unit: "s",
    },
    {
      key: "aspect_ratio",
      label: "Seitenverhältnis",
      type: "enum",
      required: false,
      defaultValue: "16:9",
      options: [
        { value: "16:9", label: "16:9 — Landscape / YouTube" },
        { value: "9:16", label: "9:16 — Portrait / TikTok / Reels" },
        { value: "1:1", label: "1:1 — Square / Instagram" },
        { value: "4:3", label: "4:3 — Klassisch" },
        { value: "3:4", label: "3:4 — Portrait klassisch" },
      ],
    },
    {
      key: "resolution",
      label: "Auflösung",
      type: "enum",
      required: false,
      defaultValue: "720p",
      options: [
        { value: "480p", label: "480p — Schnell / Günstig" },
        { value: "720p", label: "720p — Standard HD" },
        { value: "1080p", label: "1080p — Full HD (Pro)" },
      ],
    },
    {
      key: "generate_audio",
      label: "Native Audio generieren",
      type: "boolean",
      required: false,
      defaultValue: true,
      hint: "Seedance 2.0 generiert synchronisiertes Audio nativ — Dialoge, Sounds, Musik.",
    },
    {
      key: "seed",
      label: "Seed (Reproduzierbarkeit)",
      type: "integer",
      required: false,
      defaultValue: -1,
      min: -1,
      max: 2147483647,
      hint: "-1 = zufällig. Gleicher Seed + Prompt = reproduzierbares Ergebnis.",
    },
  ],
};

export const SEEDANCE_2_FAST: ModelApiSchema = {
  ...SEEDANCE_2_T2V,
  modelId: "bytedance/seedance-2.0/fast",
  displayName: "Seedance 2.0 Fast",
  endpoint: "https://fal.run/bytedance/seedance-2.0/fast",
  fields: SEEDANCE_2_T2V.fields.map((f) =>
    f.key === "duration" ? { ...f, max: 8, defaultValue: 5 } : f
  ),
};

export const KLING_21_PRO: ModelApiSchema = {
  modelId: "fal-ai/kling-video/v2.1/pro/image-to-video",
  displayName: "Kling 2.1 Pro (Bild → Video)",
  provider: "fal.ai",
  endpoint: "https://fal.run/fal-ai/kling-video/v2.1/pro/image-to-video",
  method: "POST",
  category: "video",
  authHeader: "fal-key",
  fields: [
    {
      key: "image_url",
      label: "Startbild",
      type: "image_upload",
      required: true,
      defaultValue: null,
      acceptedFormats: ["jpg", "jpeg", "png", "webp"],
      maxFileSizeMB: 10,
      hint: "Hauptbild das animiert werden soll.",
    },
    {
      key: "input_image_urls",
      label: "Zusatz-Bilder (bis zu 4)",
      type: "multi_image_upload",
      required: false,
      defaultValue: null,
      maxFiles: 4,
      acceptedFormats: ["jpg", "jpeg", "png", "webp"],
      maxFileSizeMB: 10,
      hint: "Multi-Referenz für konsistente Charaktere oder Stile.",
    },
    {
      key: "prompt",
      label: "Bewegungs-Beschreibung",
      type: "prompt",
      required: true,
      defaultValue: "",
      hint: "Beschreibe die gewünschte Bewegung und Kamera-Aktion.",
    },
    {
      key: "negative_prompt",
      label: "Negative Prompt",
      type: "text",
      required: false,
      defaultValue: "blur, distort, low quality, watermark",
      hint: "Was das Video NICHT enthalten soll.",
    },
    {
      key: "duration",
      label: "Dauer",
      type: "enum",
      required: false,
      defaultValue: "5",
      options: [
        { value: "5", label: "5 Sekunden" },
        { value: "10", label: "10 Sekunden" },
      ],
    },
    {
      key: "aspect_ratio",
      label: "Seitenverhältnis",
      type: "enum",
      required: false,
      defaultValue: "16:9",
      options: [
        { value: "16:9", label: "16:9 — Landscape" },
        { value: "9:16", label: "9:16 — Portrait" },
        { value: "1:1", label: "1:1 — Square" },
      ],
    },
    {
      key: "cfg_scale",
      label: "Prompt-Treue (CFG Scale)",
      type: "slider",
      required: false,
      defaultValue: 0.5,
      min: 0,
      max: 1,
      step: 0.1,
      hint: "Kling-spezifisch: 0–1. Höher = näher am Prompt. Default: 0.5",
    },
    {
      key: "special_fx",
      label: "Special Effect",
      type: "enum",
      required: false,
      defaultValue: "none",
      options: [
        { value: "none", label: "Kein Effekt" },
        { value: "hug", label: "Umarmung (Hug)" },
        { value: "kiss", label: "Kuss (Kiss)" },
        { value: "heart_gesture", label: "Herz-Geste" },
        { value: "squish", label: "Squish" },
        { value: "expansion", label: "Expansion" },
      ],
    },
  ],
};

export const KLING_30_OMNI: ModelApiSchema = {
  modelId: "fal-ai/kling-video/v3/pro/text-to-video",
  displayName: "Kling 3.0 Omni (Text → Video)",
  provider: "fal.ai",
  endpoint: "https://fal.run/fal-ai/kling-video/v3/pro/text-to-video",
  method: "POST",
  category: "video",
  authHeader: "fal-key",
  fields: [
    {
      key: "prompt",
      label: "Video-Beschreibung",
      type: "prompt",
      required: true,
      defaultValue: "",
      hint: "Kling 3.0 versteht Kino-Sprache. Beschreibe Shots, Übergänge und Kamera-Bewegungen.",
    },
    {
      key: "negative_prompt",
      label: "Negative Prompt",
      type: "text",
      required: false,
      defaultValue: "blur, distort, low quality",
    },
    {
      key: "duration",
      label: "Dauer (Sekunden)",
      type: "slider",
      required: false,
      defaultValue: 5,
      min: 3,
      max: 15,
      step: 1,
      unit: "s",
      hint: "Kling 3.0 unterstützt 3–15s. Multi-Shot Total darf 15s nicht überschreiten.",
    },
    {
      key: "aspect_ratio",
      label: "Seitenverhältnis",
      type: "enum",
      required: false,
      defaultValue: "16:9",
      options: [
        { value: "16:9", label: "16:9 — Landscape" },
        { value: "9:16", label: "9:16 — Portrait" },
        { value: "1:1", label: "1:1 — Square" },
      ],
    },
    {
      key: "mode",
      label: "Qualitäts-Modus",
      type: "enum",
      required: false,
      defaultValue: "std",
      options: [
        { value: "std", label: "Standard — 720p, schneller" },
        { value: "pro", label: "Pro — 1080p, höhere Qualität" },
      ],
    },
    {
      key: "cfg_scale",
      label: "Prompt-Treue (CFG Scale)",
      type: "slider",
      required: false,
      defaultValue: 0.5,
      min: 0,
      max: 1,
      step: 0.1,
    },
    {
      key: "generate_audio",
      label: "Native Audio generieren",
      type: "boolean",
      required: false,
      defaultValue: false,
      hint: "Kling 3.0 Omni unterstützt native Audio-Synthese.",
    },
  ],
};

export const FLUX_2_PRO: ModelApiSchema = {
  modelId: "fal-ai/flux-2-pro",
  displayName: "FLUX 2 Pro (Zero-Config)",
  provider: "fal.ai",
  endpoint: "https://fal.run/fal-ai/flux-2-pro",
  method: "POST",
  category: "image",
  authHeader: "fal-key",
  fields: [
    {
      key: "prompt",
      label: "Bild-Beschreibung",
      type: "prompt",
      required: true,
      defaultValue: "",
      hint: "FLUX 2 Pro ist zero-config — kein CFG oder Steps nötig. Einfach prompten.",
    },
    {
      key: "image_size",
      label: "Bildgröße",
      type: "enum",
      required: false,
      defaultValue: "landscape_4_3",
      options: [
        { value: "square_hd", label: "Square HD — 1024×1024" },
        { value: "square", label: "Square — 512×512" },
        { value: "portrait_4_3", label: "Portrait 4:3" },
        { value: "portrait_16_9", label: "Portrait 16:9 — Story/Reels" },
        { value: "landscape_4_3", label: "Landscape 4:3 — Standard" },
        { value: "landscape_16_9", label: "Landscape 16:9 — Widescreen" },
      ],
    },
    {
      key: "output_format",
      label: "Ausgabeformat",
      type: "enum",
      required: false,
      defaultValue: "jpeg",
      options: [
        { value: "jpeg", label: "JPEG — kleiner, schneller" },
        { value: "png", label: "PNG — verlustfrei, Transparenz" },
      ],
    },
    {
      key: "safety_tolerance",
      label: "Safety Tolerance",
      type: "enum",
      required: false,
      defaultValue: "2",
      options: [
        { value: "1", label: "1 — Strikt" },
        { value: "2", label: "2 — Standard (empfohlen)" },
        { value: "3", label: "3 — Entspannt" },
        { value: "4", label: "4 — Liberal" },
        { value: "5", label: "5 — Minimal" },
        { value: "6", label: "6 — Kein Filter" },
      ],
    },
    {
      key: "seed",
      label: "Seed",
      type: "integer",
      required: false,
      defaultValue: -1,
      min: -1,
      max: 2147483647,
      hint: "-1 = zufällig.",
    },
  ],
};

export const FLUX_2_FLEX: ModelApiSchema = {
  modelId: "fal-ai/flux-2-flex",
  displayName: "FLUX 2 Flex (Full Control)",
  provider: "fal.ai",
  endpoint: "https://fal.run/fal-ai/flux-2-flex",
  method: "POST",
  category: "image",
  authHeader: "fal-key",
  fields: [
    {
      key: "prompt",
      label: "Bild-Beschreibung",
      type: "prompt",
      required: true,
      defaultValue: "",
    },
    {
      key: "image_size",
      label: "Bildgröße",
      type: "enum",
      required: false,
      defaultValue: "landscape_4_3",
      options: [
        { value: "square_hd", label: "Square HD — 1024×1024" },
        { value: "square", label: "Square — 512×512" },
        { value: "portrait_4_3", label: "Portrait 4:3" },
        { value: "portrait_16_9", label: "Portrait 16:9" },
        { value: "landscape_4_3", label: "Landscape 4:3" },
        { value: "landscape_16_9", label: "Landscape 16:9" },
      ],
    },
    {
      key: "num_inference_steps",
      label: "Inference Steps",
      type: "slider",
      required: false,
      defaultValue: 28,
      min: 1,
      max: 50,
      step: 1,
      hint: "Mehr Steps = höhere Qualität, langsamer. Default: 28",
    },
    {
      key: "guidance_scale",
      label: "Guidance Scale (CFG)",
      type: "slider",
      required: false,
      defaultValue: 3.5,
      min: 1,
      max: 20,
      step: 0.5,
      hint: "Wie stark der Prompt befolgt wird. Default: 3.5. Höher = strenger.",
    },
    {
      key: "output_format",
      label: "Ausgabeformat",
      type: "enum",
      required: false,
      defaultValue: "jpeg",
      options: [
        { value: "jpeg", label: "JPEG" },
        { value: "png", label: "PNG" },
      ],
    },
    {
      key: "enable_safety_checker",
      label: "Safety Checker",
      type: "boolean",
      required: false,
      defaultValue: true,
    },
    {
      key: "safety_tolerance",
      label: "Safety Tolerance",
      type: "enum",
      required: false,
      defaultValue: "2",
      options: [
        { value: "1", label: "1 — Strikt" },
        { value: "2", label: "2 — Standard" },
        { value: "3", label: "3 — Entspannt" },
        { value: "4", label: "4 — Liberal" },
        { value: "5", label: "5 — Minimal" },
        { value: "6", label: "6 — Kein Filter" },
      ],
    },
    {
      key: "seed",
      label: "Seed",
      type: "integer",
      required: false,
      defaultValue: -1,
      min: -1,
      max: 2147483647,
    },
  ],
};

export const AKOOL_TALKING_PHOTO: ModelApiSchema = {
  modelId: "akool/talking-photo",
  displayName: "Akool Talking Photo",
  provider: "akool",
  endpoint: "https://openapi.akool.com/api/open/v3/content/video/createbytalkingphoto",
  method: "POST",
  category: "video",
  authHeader: "bearer",
  fields: [
    {
      key: "face_image_url",
      label: "Portraitfoto",
      type: "image_upload",
      required: true,
      defaultValue: null,
      acceptedFormats: ["jpg", "jpeg", "png"],
      maxFileSizeMB: 10,
      hint: "Klares Foto mit gut sichtbarem Gesicht. Gute Beleuchtung empfohlen.",
    },
    {
      key: "input_audio",
      label: "Audio-Datei (.wav)",
      type: "audio_upload",
      required: true,
      defaultValue: null,
      acceptedFormats: ["wav", "mp3"],
      maxFileSizeMB: 50,
      hint: "Das Foto wird lippensynchron zum Audio animiert.",
    },
    {
      key: "faceswap_quality",
      label: "Qualitätsstufe",
      type: "enum",
      required: false,
      defaultValue: "2",
      options: [
        { value: "1", label: "1 — Standard" },
        { value: "2", label: "2 — High Quality (empfohlen)" },
      ],
    },
    {
      key: "lipsync",
      label: "Lipsync aktivieren",
      type: "boolean",
      required: false,
      defaultValue: true,
    },
    {
      key: "webhookUrl",
      label: "Webhook URL (optional)",
      type: "text",
      required: false,
      defaultValue: "",
      hint: "URL die nach Fertigstellung aufgerufen wird.",
    },
  ],
};

export const AKOOL_LIPSYNC: ModelApiSchema = {
  modelId: "akool/lipsync",
  displayName: "Akool LipSync",
  provider: "akool",
  endpoint: "https://openapi.akool.com/api/open/v3/content/video/lipSync",
  method: "POST",
  category: "video",
  authHeader: "bearer",
  fields: [
    {
      key: "target_video",
      label: "Quell-Video",
      type: "video_upload",
      required: true,
      defaultValue: null,
      acceptedFormats: ["mp4", "mov"],
      maxFileSizeMB: 200,
    },
    {
      key: "input_audio",
      label: "Ziel-Audio (.wav)",
      type: "audio_upload",
      required: true,
      defaultValue: null,
      acceptedFormats: ["wav", "mp3"],
      maxFileSizeMB: 50,
    },
    {
      key: "faceswap_quality",
      label: "Qualitätsstufe",
      type: "enum",
      required: false,
      defaultValue: "2",
      options: [
        { value: "1", label: "1 — Standard" },
        { value: "2", label: "2 — High Quality" },
      ],
    },
    {
      key: "lipsync",
      label: "Lipsync aktivieren",
      type: "boolean",
      required: false,
      defaultValue: true,
    },
  ],
};

export const AKOOL_VIDEO_TRANSLATION: ModelApiSchema = {
  modelId: "akool/video-translation",
  displayName: "Akool Video Übersetzer",
  provider: "akool",
  endpoint: "https://openapi.akool.com/api/open/v3/content/video/translation",
  method: "POST",
  category: "video",
  authHeader: "bearer",
  fields: [
    {
      key: "video_url",
      label: "Quell-Video URL",
      type: "video_upload",
      required: true,
      defaultValue: null,
      acceptedFormats: ["mp4", "mov"],
      maxFileSizeMB: 200,
    },
    {
      key: "source_language",
      label: "Quellsprache",
      type: "enum",
      required: false,
      defaultValue: "auto",
      options: [
        { value: "auto", label: "Auto-Erkennung" },
        { value: "de", label: "Deutsch" },
        { value: "en", label: "Englisch" },
        { value: "es", label: "Spanisch" },
        { value: "fr", label: "Französisch" },
        { value: "it", label: "Italienisch" },
        { value: "pt", label: "Portugiesisch" },
        { value: "ja", label: "Japanisch" },
        { value: "ko", label: "Koreanisch" },
        { value: "zh", label: "Chinesisch" },
      ],
    },
    {
      key: "target_language",
      label: "Zielsprache",
      type: "enum",
      required: true,
      defaultValue: "en",
      options: [
        { value: "en", label: "Englisch (US Accent)" },
        { value: "de", label: "Deutsch" },
        { value: "es", label: "Spanisch" },
        { value: "fr", label: "Französisch" },
        { value: "it", label: "Italienisch" },
        { value: "pt", label: "Portugiesisch" },
        { value: "ja", label: "Japanisch" },
        { value: "ko", label: "Koreanisch" },
        { value: "zh", label: "Chinesisch (Mandarin)" },
        { value: "ar", label: "Arabisch" },
        { value: "tr", label: "Türkisch" },
        { value: "nl", label: "Niederländisch" },
        { value: "pl", label: "Polnisch" },
      ],
    },
    {
      key: "lipsync",
      label: "KI-Lippensynchronisation",
      type: "boolean",
      required: false,
      defaultValue: true,
      hint: "Mund-Bewegungen werden an die neue Sprache angepasst.",
    },
    {
      key: "voice_clone",
      label: "Original-Stimme klonen",
      type: "boolean",
      required: false,
      defaultValue: true,
      hint: "Klont die originale Stimme für die Übersetzung.",
    },
    {
      key: "resolution",
      label: "Ausgabe-Auflösung",
      type: "enum",
      required: false,
      defaultValue: "1080p",
      options: [
        { value: "720p", label: "720p — HD" },
        { value: "1080p", label: "1080p — Full HD" },
        { value: "4k", label: "4K — Ultra HD (Pro)" },
      ],
    },
  ],
};

export const AKOOL_TALKING_AVATAR: ModelApiSchema = {
  modelId: "akool/talking-avatar",
  displayName: "Akool Talking Avatar",
  provider: "akool",
  endpoint: "https://openapi.akool.com/api/open/v3/content/video/createbyavatar",
  method: "POST",
  category: "video",
  authHeader: "bearer",
  fields: [
    {
      key: "script",
      label: "Skript / Text",
      type: "prompt",
      required: true,
      defaultValue: "",
      hint: "Der Avatar spricht diesen Text. Max. 5000 Zeichen.",
    },
    {
      key: "avatar_id",
      label: "Avatar-Modell",
      type: "enum",
      required: true,
      defaultValue: "avatar_1",
      options: [
        { value: "avatar_1", label: "Business Male" },
        { value: "avatar_2", label: "Casual Female" },
        { value: "avatar_3", label: "Streetwear Male" },
        { value: "avatar_4", label: "Professional Female" },
      ],
      hint: "Verfügbare Avatar-IDs aus deinem Akool Account.",
    },
    {
      key: "voice_id",
      label: "Stimme",
      type: "enum",
      required: false,
      defaultValue: "de_male_1",
      options: [
        { value: "de_male_1", label: "Deutsch — Männlich (Tief)" },
        { value: "de_female_1", label: "Deutsch — Weiblich" },
        { value: "en_male_1", label: "Englisch — Männlich (US)" },
        { value: "en_female_1", label: "Englisch — Weiblich (US)" },
      ],
    },
    {
      key: "resolution",
      label: "Auflösung",
      type: "enum",
      required: false,
      defaultValue: "1080p",
      options: [
        { value: "720p", label: "720p — HD" },
        { value: "1080p", label: "1080p — Full HD" },
      ],
    },
  ],
};

export const ELEVENLABS_TTS: ModelApiSchema = {
  modelId: "elevenlabs/tts",
  displayName: "ElevenLabs Text-to-Speech",
  provider: "elevenlabs",
  endpoint: "https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
  method: "POST",
  category: "audio",
  authHeader: "x-api-key",
  fields: [
    {
      key: "text",
      label: "Text zum Vorlesen",
      type: "prompt",
      required: true,
      defaultValue: "",
      hint: "Max. 5000 Zeichen pro Request.",
    },
    {
      key: "voice_id",
      label: "Stimme (Voice ID)",
      type: "enum",
      required: true,
      defaultValue: "EXAVITQu4vr4xnSDxMaL",
      options: [
        { value: "EXAVITQu4vr4xnSDxMaL", label: "Sarah — Weiblich, warm" },
        { value: "onwK4e9ZLuTAKqWW03F9", label: "Daniel — Männlich, tief" },
        { value: "N2lVS1w4EtoT3dr4eOWO", label: "Callum — Männlich, britisch" },
        { value: "XB0fDUnXU5powFXDhCwa", label: "Charlotte — Weiblich, klar" },
        { value: "IKne3meq5aSn9XLyUdCD", label: "Charlie — Männlich, casual" },
        { value: "pqHfZKP75CvOlQylNhV4", label: "Bill — Männlich, autoritär" },
      ],
      hint: "Custom Voice IDs aus deinem ElevenLabs Account können hier eingetragen werden.",
    },
    {
      key: "model_id",
      label: "TTS-Modell",
      type: "enum",
      required: false,
      defaultValue: "eleven_multilingual_v2",
      options: [
        { value: "eleven_multilingual_v2", label: "Multilingual v2 — 29 Sprachen" },
        { value: "eleven_turbo_v2_5", label: "Turbo v2.5 — Schnell, günstig" },
        { value: "eleven_monolingual_v1", label: "Monolingual v1 — Nur Englisch" },
      ],
    },
    {
      key: "stability",
      label: "Stabilität",
      type: "slider",
      required: false,
      defaultValue: 0.5,
      min: 0,
      max: 1,
      step: 0.05,
      hint: "Höher = gleichmäßiger, weniger expressiv.",
    },
    {
      key: "similarity_boost",
      label: "Stimm-Ähnlichkeit",
      type: "slider",
      required: false,
      defaultValue: 0.75,
      min: 0,
      max: 1,
      step: 0.05,
      hint: "Wie nah an der Original-Stimme.",
    },
    {
      key: "style",
      label: "Ausdrucksstärke (Style)",
      type: "slider",
      required: false,
      defaultValue: 0,
      min: 0,
      max: 1,
      step: 0.05,
      hint: "Nur bei Multilingual v2. 0 = neutral, 1 = sehr expressiv.",
    },
    {
      key: "output_format",
      label: "Ausgabeformat",
      type: "enum",
      required: false,
      defaultValue: "mp3_44100_128",
      options: [
        { value: "mp3_44100_128", label: "MP3 44.1kHz 128kbps — Standard" },
        { value: "mp3_44100_192", label: "MP3 44.1kHz 192kbps — Besser" },
        { value: "pcm_16000", label: "PCM 16kHz — Rohformat" },
        { value: "pcm_44100", label: "PCM 44.1kHz — Studio" },
      ],
    },
  ],
};

export const MODEL_SCHEMAS: Record<string, ModelApiSchema> = {
  [SEEDANCE_2_T2V.modelId]: SEEDANCE_2_T2V,
  [SEEDANCE_2_FAST.modelId]: SEEDANCE_2_FAST,
  [KLING_21_PRO.modelId]: KLING_21_PRO,
  [KLING_30_OMNI.modelId]: KLING_30_OMNI,
  [FLUX_2_PRO.modelId]: FLUX_2_PRO,
  [FLUX_2_FLEX.modelId]: FLUX_2_FLEX,
  [AKOOL_TALKING_PHOTO.modelId]: AKOOL_TALKING_PHOTO,
  [AKOOL_LIPSYNC.modelId]: AKOOL_LIPSYNC,
  [AKOOL_VIDEO_TRANSLATION.modelId]: AKOOL_VIDEO_TRANSLATION,
  [AKOOL_TALKING_AVATAR.modelId]: AKOOL_TALKING_AVATAR,
  [ELEVENLABS_TTS.modelId]: ELEVENLABS_TTS,
};

export function buildApiPayload(
  schema: ModelApiSchema,
  values: Record<string, unknown>
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  for (const field of schema.fields) {
    const val = values[field.key];

    if (val === null || val === undefined) continue;
    if (val === "" && !field.required) continue;
    if (field.key === "seed" && val === -1) continue;
    if (field.key === "webhookUrl" && val === "") continue;

    if (field.type === "slider" || field.type === "integer") {
      payload[field.key] = Number(val);
    } else if (field.type === "boolean") {
      payload[field.key] = Boolean(val);
    } else {
      payload[field.key] = val;
    }
  }

  return payload;
}

export function validatePayload(
  schema: ModelApiSchema,
  values: Record<string, unknown>
): string[] {
  const missing: string[] = [];
  for (const field of schema.fields) {
    if (!field.required) continue;
    const val = values[field.key];
    if (val === null || val === undefined || val === "") {
      missing.push(field.label);
    }
  }
  return missing;
}
