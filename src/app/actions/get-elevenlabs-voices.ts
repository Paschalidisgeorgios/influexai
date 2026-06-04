"use server";

import { ELEVENLABS_FALLBACK_VOICES } from "@/lib/elevenlabs-config";
import type { ElevenLabsVoice } from "@/lib/elevenlabs-voice-types";

type RawVoice = {
  voice_id: string;
  name: string;
  category?: string;
  preview_url?: string | null;
  gender?: string | null;
  language?: string | null;
  description?: string | null;
  labels?: {
    gender?: string;
    accent?: string;
    age?: string;
    use_case?: string;
    description?: string;
    "use case"?: string;
  };
  fine_tuning?: { language?: string };
};

function mapVoice(v: RawVoice, source: string): ElevenLabsVoice {
  return {
    id: v.voice_id,
    name: v.name,
    category: v.category ?? "generated",
    previewUrl: v.preview_url ?? null,
    gender: v.labels?.gender ?? v.gender ?? null,
    accent: v.labels?.accent ?? null,
    age: v.labels?.age ?? null,
    useCase: v.labels?.use_case ?? v.labels?.["use case"] ?? null,
    description: v.labels?.description ?? v.description ?? null,
    language: v.fine_tuning?.language ?? v.language ?? null,
    source,
  };
}

function fallbackVoices(): ElevenLabsVoice[] {
  return ELEVENLABS_FALLBACK_VOICES.map((v) => ({
    id: v.id,
    name: v.name,
    category: v.category,
    previewUrl: null,
    gender: v.gender === "neutral" ? null : v.gender,
    accent: null,
    age: null,
    useCase: null,
    description: v.label,
    language:
      v.locale === "multilingual" ? "multilingual" : v.locale,
    source: "fallback",
  }));
}

export async function getElevenLabsVoices(): Promise<{
  success: boolean;
  voices: ElevenLabsVoice[];
  error?: string;
}> {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY?.trim() ?? "";

    if (!apiKey) {
      return { success: false, voices: fallbackVoices(), error: "NO_KEY" };
    }

    const [myVoicesRes, sharedVoicesRes] = await Promise.all([
      fetch("https://api.elevenlabs.io/v1/voices", {
        headers: { "xi-api-key": apiKey },
        cache: "no-store",
      }),
      fetch(
        "https://api.elevenlabs.io/v1/voices/shared?page_size=100&sort=usage_character_count_1y&featured=false",
        {
          headers: { "xi-api-key": apiKey },
          cache: "no-store",
        }
      ),
    ]);

    const myVoicesData = myVoicesRes.ok
      ? ((await myVoicesRes.json()) as { voices?: RawVoice[] })
      : { voices: [] };
    const sharedVoicesData = sharedVoicesRes.ok
      ? ((await sharedVoicesRes.json()) as { voices?: RawVoice[] })
      : { voices: [] };

    const myVoices = (myVoicesData.voices ?? []).map((v) =>
      mapVoice(v, "my_voices")
    );
    const sharedVoices = (sharedVoicesData.voices ?? []).map((v) =>
      mapVoice(v, "shared")
    );

    const seen = new Set(myVoices.map((v) => v.id));
    const uniqueShared = sharedVoices.filter((v) => !seen.has(v.id));

    const voices = [...myVoices, ...uniqueShared];

    if (voices.length === 0) {
      return {
        success: false,
        voices: fallbackVoices(),
        error: "Keine Stimmen von der API erhalten",
      };
    }

    return { success: true, voices };
  } catch (error: unknown) {
    return {
      success: false,
      voices: fallbackVoices(),
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
