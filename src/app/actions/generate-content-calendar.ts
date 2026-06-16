"use server";

import { getLocale } from "next-intl/server";
import { requireKiToolAccessForAction } from "@/lib/access.server";
import { deductCredits } from "@/lib/credits";
import { withCreditDeduction } from "@/lib/credits-with-refund";
import { insufficientCreditsError } from "@/lib/credit-action-result";
import {
  createAnthropicMessage,
  SCRIPT_GENERATOR_MODEL,
} from "@/lib/anthropic";
import { AgentSafetyError, checkAgentInputSafety } from "@/lib/agent/guards";
import {
  buildContentCalendarUserPrompt,
  CONTENT_CALENDAR_SYSTEM_PROMPT,
  parseContentCalendarResult,
  type ContentCalendarResult,
  type GenerateContentCalendarInput,
} from "@/lib/content-calendar-analysis";

const CONTENT_CALENDAR_CREDIT_COST = 5;

type Success = {
  success: true;
  result: ContentCalendarResult;
  creditsLeft: number;
};

type Failure = {
  success: false;
  error: string;
  credits?: number;
  required?: number;
};

export async function generateContentCalendar(
  input: GenerateContentCalendarInput
): Promise<Success | Failure> {
  const niche = input.niche?.trim();
  if (!niche) {
    return { success: false, error: "Bitte gib deine Nische ein." };
  }

  try {
    checkAgentInputSafety(niche);
  } catch (err) {
    if (err instanceof AgentSafetyError) {
      return { success: false, error: err.message };
    }
    throw err;
  }

  const access = await requireKiToolAccessForAction(CONTENT_CALENDAR_CREDIT_COST);
  if (!access.ok) {
    if (access.credits !== undefined) {
      return insufficientCreditsError(
        access.credits,
        CONTENT_CALENDAR_CREDIT_COST
      );
    }
    return { success: false, error: access.error };
  }
  const { userId, supabase } = access;

  await getLocale();

  const deductionResult = await withCreditDeduction(
    {
      supabase,
      userId,
      amount: CONTENT_CALENDAR_CREDIT_COST,
      description: "Content Kalender KI",
      generationType: "content-kalender",
      prompt: `${niche} · ${input.platform}`.slice(0, 200),
    },
    async () => {
      const claude = await createAnthropicMessage({
        system: CONTENT_CALENDAR_SYSTEM_PROMPT,
        user: buildContentCalendarUserPrompt({
          niche,
          platform: input.platform,
          frequency: input.frequency,
          language: input.language,
        }),
        model: SCRIPT_GENERATOR_MODEL,
        maxTokens: 8192,
      });

      if (!claude.ok) {
        throw new Error(claude.error);
      }

      return parseContentCalendarResult(claude.text);
    }
  );

  if (!deductionResult.ok) {
    if (deductionResult.remainingCredits !== undefined) {
      return insufficientCreditsError(
        deductionResult.remainingCredits,
        CONTENT_CALENDAR_CREDIT_COST
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
