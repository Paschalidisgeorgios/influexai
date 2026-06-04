"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { deductCredits, hasEnoughCredits } from "@/lib/credits";
import { ELEVENLABS_VOICES } from "@/lib/elevenlabs-voices";

const CREDIT_COST = 3;

const VALID_VOICE_IDS = new Set<string>(ELEVENLABS_VOICES.map((v) => v.id));

type GenerateSuccess = {
  success: true;
  audioUrl: string;
  creditsLeft: number;
};

type GenerateFailure = {
  success: false;
  error: string;
};

export async function generateVoice(
  text: string,
  voiceId: string,
  stabilityPercent: number
): Promise<GenerateSuccess | GenerateFailure> {
  const trimmed = text?.trim();
  if (!trimmed) {
    return { success: false, error: "Bitte gib ein Script ein." };
  }
  if (trimmed.length > 500) {
    return { success: false, error: "Maximal 500 Zeichen." };
  }
  if (!VALID_VOICE_IDS.has(voiceId)) {
    return { success: false, error: "Ungültige Stimme." };
  }

  if (!process.env.ELEVENLABS_API_KEY) {
    return {
      success: false,
      error: "ELEVENLABS_API_KEY fehlt. Bitte in .env.local und Vercel setzen.",
    };
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Nicht eingeloggt." };
  }

  const creditCheck = await hasEnoughCredits(supabase, user.id, CREDIT_COST);
  if (!creditCheck.ok) {
    return { success: false, error: "Nicht genug Credits." };
  }

  const stability = Math.min(1, Math.max(0, stabilityPercent / 100));

  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": process.env.ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text: trimmed,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability,
            similarity_boost: 0.75,
          },
        }),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      console.error("ElevenLabs TTS:", res.status, errText.slice(0, 300));
      return {
        success: false,
        error: "Stimmgenerierung fehlgeschlagen. API-Key oder Voice-ID prüfen.",
      };
    }

    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const audioUrl = `data:audio/mpeg;base64,${base64}`;

    const voiceLabel =
      ELEVENLABS_VOICES.find((v) => v.id === voiceId)?.label ?? voiceId;

    const deduction = await deductCredits(
      supabase,
      user.id,
      CREDIT_COST,
      `KI Stimme (${voiceLabel})`,
      { generationType: "voice-tts", prompt: trimmed.slice(0, 500) }
    );

    if (!deduction.success) {
      return {
        success: false,
        error: deduction.error ?? "Nicht genug Credits.",
      };
    }

    return { success: true, audioUrl, creditsLeft: deduction.remainingCredits };
  } catch (e) {
    console.error("generateVoice:", e);
    return {
      success: false,
      error: "Unerwarteter Fehler bei der Generierung.",
    };
  }
}
