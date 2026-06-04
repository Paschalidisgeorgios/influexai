/**
 * ElevenLabs voice IDs — premade voices (multilingual v2 compatible).
 * Snapshot: https://github.com/nexmo-se/elevenlabs-agent-ws-connector (2025-01-02)
 * Refresh: node scripts/sync-elevenlabs-voices.mjs (requires valid ELEVENLABS_API_KEY)
 */

export const ELEVENLABS_TTS_MODEL_ID = "eleven_multilingual_v2" as const;

/** App locales (matches next-intl / messages/*.json). */
export type ElevenLabsAppLocale =
  | "de"
  | "en"
  | "el"
  | "tr"
  | "es"
  | "fr"
  | "ar"
  | "pt";

/**
 * Default voice per UI language — all premade, multilingual-capable with eleven_multilingual_v2.
 */
export const ELEVENLABS_VOICES: Record<ElevenLabsAppLocale, string> = {
  de: "onwK4e9ZLuTAKqWW03F9", // Daniel — authoritative, DE/EN
  en: "EXAVITQu4vr4xnSDxMaL", // Sarah — soft female
  es: "XB0fDUnXU5powFXDhCwa", // Charlotte — multilingual female
  fr: "XrExE9yKIg1WjnnlVkGX", // Matilda — warm female
  pt: "pFZP5JQG7iQjIQuC4Bku", // Lily — warm female
  tr: "SAz9YHcvj6GT2YYXdXww", // River — neutral multilingual
  el: "JBFqnCBsd6RMkjVDRZzb", // George — male, clear
  ar: "IKne3meq5aSn9XLyUdCD", // Charlie — casual male
};

export const DEFAULT_ELEVENLABS_VOICE_ID = ELEVENLABS_VOICES.de;

export function getDefaultVoiceIdForLocale(locale: string): string {
  const code = locale.split("-")[0].toLowerCase() as ElevenLabsAppLocale;
  if (code in ELEVENLABS_VOICES) {
    return ELEVENLABS_VOICES[code];
  }
  return DEFAULT_ELEVENLABS_VOICE_ID;
}

export type ElevenLabsFallbackVoice = {
  id: string;
  name: string;
  label: string;
  locale: ElevenLabsAppLocale | "multilingual";
  gender: "male" | "female" | "neutral";
  category: "premade";
};

/** Curated list for UI when GET /v1/voices fails (401, offline). */
export const ELEVENLABS_FALLBACK_VOICES: readonly ElevenLabsFallbackVoice[] = [
  {
    id: ELEVENLABS_VOICES.de,
    name: "Daniel",
    label: "Daniel – DE/EN (Standard)",
    locale: "de",
    gender: "male",
    category: "premade",
  },
  {
    id: ELEVENLABS_VOICES.en,
    name: "Sarah",
    label: "Sarah – English",
    locale: "en",
    gender: "female",
    category: "premade",
  },
  {
    id: "Xb7hH8MSUJpSbSDYk0k2",
    name: "Alice",
    label: "Alice – British female (DE/EN)",
    locale: "de",
    gender: "female",
    category: "premade",
  },
  {
    id: ELEVENLABS_VOICES.el,
    name: "George",
    label: "George – multilingual male",
    locale: "el",
    gender: "male",
    category: "premade",
  },
  {
    id: ELEVENLABS_VOICES.es,
    name: "Charlotte",
    label: "Charlotte – ES/multilingual",
    locale: "es",
    gender: "female",
    category: "premade",
  },
  {
    id: ELEVENLABS_VOICES.fr,
    name: "Matilda",
    label: "Matilda – FR/multilingual",
    locale: "fr",
    gender: "female",
    category: "premade",
  },
  {
    id: ELEVENLABS_VOICES.pt,
    name: "Lily",
    label: "Lily – PT/EN",
    locale: "pt",
    gender: "female",
    category: "premade",
  },
  {
    id: ELEVENLABS_VOICES.tr,
    name: "River",
    label: "River – TR/neutral multilingual",
    locale: "tr",
    gender: "neutral",
    category: "premade",
  },
  {
    id: ELEVENLABS_VOICES.ar,
    name: "Charlie",
    label: "Charlie – AR/multilingual",
    locale: "ar",
    gender: "male",
    category: "premade",
  },
  {
    id: "9BWtsMINqrJLrRacOk9x",
    name: "Aria",
    label: "Aria – expressive (EN)",
    locale: "en",
    gender: "female",
    category: "premade",
  },
  {
    id: "nPczCjzI2devNBz1zQrb",
    name: "Brian",
    label: "Brian – deep male (EN)",
    locale: "en",
    gender: "male",
    category: "premade",
  },
  {
    id: "TX3LPaxmHKxFdv7VOQHJ",
    name: "Liam",
    label: "Liam – professional (EN)",
    locale: "en",
    gender: "male",
    category: "premade",
  },
  {
    id: "FGY2WhTYpPnrIDTdsKH5",
    name: "Laura",
    label: "Laura – upbeat (EN)",
    locale: "en",
    gender: "female",
    category: "premade",
  },
] as const;

/** All known-good premade IDs used in this project (for sync script validation). */
export const ELEVENLABS_KNOWN_PREMADE_IDS = new Set<string>([
  ...Object.values(ELEVENLABS_VOICES),
  ...ELEVENLABS_FALLBACK_VOICES.map((v) => v.id),
]);

/**
 * Legacy default voice IDs (pre-2025) → current premade IDs.
 * @see https://elevenlabs.io/docs — deprecated defaults
 */
export const ELEVENLABS_LEGACY_VOICE_ID_MAP: Record<string, string> = {
  "21m00Tcm4TlvDq8ikWAM": ELEVENLABS_VOICES.en, // Rachel → Sarah
  AZnzlk1XvdvUeBnXmlld: "FGY2WhTYpPnrIDTdsKH5", // Domi → Laura
  EXAVITQu4vr4xnSDxMaL: ELEVENLABS_VOICES.en,
  ErXwobaYiN019PkySvjV: ELEVENLABS_VOICES.de, // Antoni → Daniel
  MF3mGyEYCl7XYWbV9V6O: "9BWtsMINqrJLrRacOk9x", // Elli → Aria
  TxGEqnHWrfWFTfGW9XjX: "TX3LPaxmHKxFdv7VOQHJ", // Josh → Liam
  VR6AewLTigWG4xSOukaG: "CwhRBWXzGAHq8TQ4Fs17", // Arnold → Roger
  pNInz6obpgDQGcFmaJgB: "nPczCjzI2devNBz1zQrb", // Adam → Brian
  yoZ06aMxZJJ28mfd3POQ: "cjVigY5qzO86Huf0OWal", // Sam → Eric
  /** Locale codes sometimes stored by mistake */
  de: ELEVENLABS_VOICES.de,
  en: ELEVENLABS_VOICES.en,
  es: ELEVENLABS_VOICES.es,
  fr: ELEVENLABS_VOICES.fr,
  pt: ELEVENLABS_VOICES.pt,
  tr: ELEVENLABS_VOICES.tr,
  el: ELEVENLABS_VOICES.el,
  ar: ELEVENLABS_VOICES.ar,
};

export function resolveElevenLabsVoiceId(voiceId: string): string {
  const id = voiceId?.trim();
  if (!id) return DEFAULT_ELEVENLABS_VOICE_ID;
  return ELEVENLABS_LEGACY_VOICE_ID_MAP[id] ?? id;
}
