"use server";

import { getLocale } from "next-intl/server";
import { requireKiToolAccessForAction } from "@/lib/access.server";
import { withCreditDeduction } from "@/lib/credits-with-refund";
import { insufficientCreditsError } from "@/lib/credit-action-result";
import {
  createAnthropicMessage,
  SCRIPT_GENERATOR_MODEL,
} from "@/lib/anthropic";
import { AgentSafetyError, checkAgentInputSafety } from "@/lib/agent/guards";
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

  try {
    checkAgentInputSafety(`${trend}\n${niche}`);
  } catch (err) {
    if (err instanceof AgentSafetyError) {
      return { success: false, error: err.message };
    }
    throw err;
  }

  const access = await requireKiToolAccessForAction(TREND_SCRIPT_CREDIT_COST);
  if (!access.ok) {
    if (access.credits !== undefined) {
      return insufficientCreditsError(access.credits, TREND_SCRIPT_CREDIT_COST);
    }
    return { success: false, error: access.error };
  }
  const { userId, supabase } = access;

  await getLocale();

  const deductionResult = await withCreditDeduction(
    {
      supabase,
      userId,
      amount: TREND_SCRIPT_CREDIT_COST,
      description: "Trend → Script",
      generationType: "trend-to-script",
      prompt: `${trend} · ${niche}`.slice(0, 200),
    },
    async () => {
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
        throw new Error(claude.error);
      }

      return parseTrendScriptResult(claude.text);
    }
  );

  if (!deductionResult.ok) {
    if (deductionResult.remainingCredits !== undefined) {
      return insufficientCreditsError(
        deductionResult.remainingCredits,
        TREND_SCRIPT_CREDIT_COST
      );
    }
    return { success: false, error: deductionResult.error };
  }

  return {
    success: true,
    result: deductionResult.data,
    creditsLeft: deductionResult.remainingCredits,
  };
}
