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
  buildContentCalendarUserPrompt,
  CONTENT_CALENDAR_SYSTEM_PROMPT,
  parseContentCalendarResult,
  type ContentCalendarFrequency,
  type ContentCalendarResult,
} from "@/lib/content-calendar-analysis";

export const CONTENT_CALENDAR_CREDIT_COST = 5;

export type GenerateContentCalendarInput = {
  niche: string;
  platform: string;
  frequency: ContentCalendarFrequency;
  language: "de" | "en";
};

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

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Nicht eingeloggt." };

  const creditCheck = await hasEnoughCredits(
    supabase,
    user.id,
    CONTENT_CALENDAR_CREDIT_COST
  );
  if (!creditCheck.ok) {
    return insufficientCreditsError(
      creditCheck.credits,
      CONTENT_CALENDAR_CREDIT_COST
    );
  }

  await getLocale();

  try {
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
      return { success: false, error: claude.error };
    }

    const result = parseContentCalendarResult(claude.text);

    const deduction = await deductCredits(
      supabase,
      user.id,
      CONTENT_CALENDAR_CREDIT_COST,
      "Content Kalender KI",
      {
        generationType: "content-kalender",
        prompt: `${niche} · ${input.platform}`.slice(0, 200),
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
    console.error("generateContentCalendar:", e);
    if (e instanceof Error && e.stack) console.error(e.stack);
    return {
      success: false,
      error:
        e instanceof Error && e.message.length <= 180
          ? e.message
          : "Kalender-Generierung fehlgeschlagen. Bitte erneut versuchen.",
    };
  }
}
