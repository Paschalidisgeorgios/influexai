"use server";

import { randomUUID } from "crypto";

import { requireKiToolAccessForAction } from "@/lib/access.server";
import { withCreditDeduction } from "@/lib/credits-with-refund";
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

  const deductionResult = await withCreditDeduction(
    {
      supabase,
      userId,
      amount: CREDIT_COST,
      description: `KI Stimme (${voiceId})`,
      generationType: "audio",
      prompt: trimmed.slice(0, 500),
      refundDescription: "KI Stimme — Refund",
    },
    async () => {
      const tts = await synthesizeElevenLabsSpeech(
        trimmed,
        voiceId,
        stabilityPercent
      );

      if (!tts.ok) {
        throw new Error(tts.error);
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

      return { audioDataUrl: tts.audioDataUrl, generationId };
    }
  );

  if (!deductionResult.ok) {
    if (deductionResult.remainingCredits !== undefined) {
      return insufficientCreditsError(
        deductionResult.remainingCredits,
        CREDIT_COST
      );
    }
    return { success: false, error: deductionResult.error };
  }

  return {
    success: true,
    audioUrl: deductionResult.data.audioDataUrl,
    generationId: deductionResult.data.generationId,
    creditsLeft: deductionResult.remainingCredits,
  };
}
