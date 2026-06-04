"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { deductCredits, hasEnoughCredits } from "@/lib/credits";
import { ELEVENLABS_VOICES } from "@/lib/elevenlabs-voices";
import {
  isValidElevenLabsVoiceId,
  synthesizeElevenLabsSpeech,
} from "@/lib/elevenlabs-tts";

const CREDIT_COST = 3;

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
  if (!isValidElevenLabsVoiceId(voiceId)) {
    return { success: false, error: "Ungültige Stimme." };
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

  try {
    const tts = await synthesizeElevenLabsSpeech(
      trimmed,
      voiceId,
      stabilityPercent
    );

    if (!tts.ok) {
      return { success: false, error: tts.error };
    }

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

    return {
      success: true,
      audioUrl: tts.audioDataUrl,
      creditsLeft: deduction.remainingCredits,
    };
  } catch (e) {
    console.error("generateVoice:", e);
    return {
      success: false,
      error: "Unerwarteter Fehler bei der Generierung.",
    };
  }
}
