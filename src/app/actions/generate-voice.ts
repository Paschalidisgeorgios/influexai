"use server";

import { randomUUID } from "crypto";

import { requireKiToolAccessForAction } from "@/lib/access.server";
import { deductCredits } from "@/lib/credits";
import { insufficientCreditsError } from "@/lib/credit-action-result";
import {
  createGenerationRecord,
  ingestAudioFromDataUrl,
} from "@/lib/generation-assets";
import {
  isValidElevenLabsVoiceId,
  synthesizeElevenLabsSpeech,
} from "@/lib/elevenlabs-tts";

const CREDIT_COST = 3;

type GenerateSuccess = {
  success: true;
  audioUrl: string;
  generationId: string;
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

  const access = await requireKiToolAccessForAction(CREDIT_COST);
  if (!access.ok) {
    if (access.credits !== undefined) {
      return insufficientCreditsError(access.credits, CREDIT_COST);
    }
    return { success: false, error: access.error };
  }
  const { userId, supabase } = access;

  try {
    const tts = await synthesizeElevenLabsSpeech(
      trimmed,
      voiceId,
      stabilityPercent
    );

    if (!tts.ok) {
      return { success: false, error: tts.error };
    }

    const generationId = randomUUID();
    const finalPath = await ingestAudioFromDataUrl(
      userId,
      generationId,
      tts.audioDataUrl
    );

    await createGenerationRecord(
      supabase,
      userId,
      "audio",
      {
        finalPath,
        assetKind: "audio",
        paid: true,
        mimeType: "audio/mpeg",
      },
      CREDIT_COST,
      trimmed,
      generationId
    );

    const deduction = await deductCredits(
      supabase,
      userId,
      CREDIT_COST,
      `KI Stimme (${voiceId})`,
      { generationType: "audio", prompt: trimmed.slice(0, 500) }
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
      generationId,
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
