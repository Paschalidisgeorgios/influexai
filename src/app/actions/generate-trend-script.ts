"use server";

import { getLocale } from "next-intl/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { deductCredits, hasEnoughCredits } from "@/lib/credits";
import { insufficientCreditsError } from "@/lib/credit-action-result";
import {
  createAnthropicMessage,
  SCRIPT_GENERATOR_MODEL,
} from "@/lib/anthropic";
import {
  buildTrendScriptUserPrompt,
  parseTrendScriptResult,
  TREND_SCRIPT_SYSTEM_PROMPT,
  type TrendScriptResult,
  type GenerateTrendScriptInput,
} from "@/lib/trend-script-analysis";

const TREND_SCRIPT_CREDIT_COST = 4;

type Success = {
  success: true;
  result: TrendScriptResult;
  creditsLeft: number;
};

type Failure = {
  success: false;
  error: string;
  credits?: number;
  required?: number;
};

export async function generateTrendScript(
  input: GenerateTrendScriptInput
): Promise<Success | Failure> {
  const trend = input.trend?.trim();
  const niche = input.niche?.trim();
  if (!trend) {
    return { success: false, error: "Bitte gib ein Trend-Thema ein." };
  }
  if (!niche) {
    return { success: false, error: "Bitte gib deine Nische ein." };
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Nicht eingeloggt." };

  const creditCheck = await hasEnoughCredits(
    supabase,
    user.id,
    TREND_SCRIPT_CREDIT_COST
  );
  if (!creditCheck.ok) {
    return insufficientCreditsError(creditCheck.credits, TREND_SCRIPT_CREDIT_COST);
  }

  await getLocale();

  try {
    const claude = await createAnthropicMessage({
      system: TREND_SCRIPT_SYSTEM_PROMPT,
      user: buildTrendScriptUserPrompt({
        trend,
        niche,
        platform: input.platform,
        tone: input.tone,
        language: input.language,
      }),
      model: SCRIPT_GENERATOR_MODEL,
      maxTokens: 4096,
    });

    if (!claude.ok) {
      return { success: false, error: claude.error };
    }

    const result = parseTrendScriptResult(claude.text);

    const deduction = await deductCredits(
      supabase,
      user.id,
      TREND_SCRIPT_CREDIT_COST,
      "Trend → Script",
      {
        generationType: "trend-to-script",
        prompt: `${trend} · ${niche}`.slice(0, 200),
      }
    );

    if (!deduction.success) {
      return {
        success: false,
        error: deduction.error ?? "Nicht genug Credits.",
      };
    }

    return {
      success: true,
      result,
      creditsLeft: deduction.remainingCredits,
    };
  } catch (e) {
    console.error("generateTrendScript:", e);
    if (e instanceof Error && e.stack) console.error(e.stack);
    return {
      success: false,
      error:
        e instanceof Error && e.message.length <= 180
          ? e.message
          : "Script-Generierung fehlgeschlagen. Bitte erneut versuchen.",
    };
  }
}
