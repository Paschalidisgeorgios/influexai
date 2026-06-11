"use server";

import { requireKiToolAccessForAction } from "@/lib/access.server";
import { deductCredits } from "@/lib/credits";
import { insufficientCreditsError } from "@/lib/credit-action-result";
import { createAnthropicMessage } from "@/lib/anthropic";
import {
  e2eMockOutliers,
  isE2eMockGenerationsEnabled,
} from "@/lib/e2e-mock-generations";
import {
  buildOutlierUserPrompt,
  normalizeOutlierLanguage,
  OUTLIER_SYSTEM_PROMPT,
  outlierResultsSaveErrorMessage,
  parseOutlierConcepts,
  type OutlierConcept,
} from "@/lib/outlier-analysis";

const CREDIT_COST = 3;

type DetectSuccess = {
  success: true;
  outliers: OutlierConcept[];
  creditsLeft: number;
  saved: boolean;
  saveWarning?: string;
};

type DetectFailure = {
  success: false;
  error: string;
  credits?: number;
  required?: number;
};

export async function detectOutliers(
  niche: string,
  period: string,
  platform: string,
  channelSize: string,
  language?: string
): Promise<DetectSuccess | DetectFailure> {
  if (!niche?.trim()) {
    return {
      success: false,
      error: "Bitte gib eine Nische oder ein Keyword ein.",
    };
  }

  const lang = normalizeOutlierLanguage(language);

  const access = await requireKiToolAccessForAction(CREDIT_COST);
  if (!access.ok) {
    if (access.credits !== undefined) {
      return insufficientCreditsError(access.credits, CREDIT_COST);
    }
    return { success: false, error: access.error };
  }
  const { userId, supabase } = access;

  if (isE2eMockGenerationsEnabled()) {
    const outliers = e2eMockOutliers(niche.trim(), lang);
    const deduction = await deductCredits(
      supabase,
      userId,
      CREDIT_COST,
      "Outlier Detector",
      { generationType: "outlier-detector", prompt: niche.trim() }
    );
    if (!deduction.success) {
      return {
        success: false,
        error: deduction.error ?? "Nicht genug Credits.",
      };
    }
    const { error: saveError } = await supabase.from("outlier_results").insert({
      user_id: userId,
      niche: niche.trim(),
      results: outliers,
    });
    if (saveError) {
      console.error("outlier_results insert (e2e):", saveError.message);
      return {
        success: true,
        outliers,
        creditsLeft: deduction.remainingCredits,
        saved: false,
        saveWarning: outlierResultsSaveErrorMessage(saveError.code),
      };
    }
    return {
      success: true,
      outliers,
      creditsLeft: deduction.remainingCredits,
      saved: true,
    };
  }

  const userPrompt = buildOutlierUserPrompt({
    niche,
    period,
    platform,
    channelSize,
    language: lang,
  });

  try {
    const claude = await createAnthropicMessage({
      system: OUTLIER_SYSTEM_PROMPT,
      user: userPrompt,
    });
    if (!claude.ok) {
      return { success: false, error: claude.error };
    }

    let outliers: OutlierConcept[];
    try {
      outliers = parseOutlierConcepts(claude.text);
    } catch {
      console.error("Outlier JSON parse failed:", claude.text.slice(0, 500));
      return {
        success: false,
        error: "Antwort konnte nicht gelesen werden. Bitte erneut versuchen.",
      };
    }

    const deduction = await deductCredits(
      supabase,
      userId,
      CREDIT_COST,
      "Outlier Detector",
      { generationType: "outlier-detector", prompt: niche.trim() }
    );

    if (!deduction.success) {
      return {
        success: false,
        error: deduction.error ?? "Nicht genug Credits.",
      };
    }

    const { error: saveError } = await supabase.from("outlier_results").insert({
      user_id: userId,
      niche: niche.trim(),
      results: outliers,
    });

    if (saveError) {
      console.error("outlier_results insert:", saveError.message, saveError.code);
      return {
        success: true,
        outliers,
        creditsLeft: deduction.remainingCredits,
        saved: false,
        saveWarning: outlierResultsSaveErrorMessage(saveError.code),
      };
    }

    return {
      success: true,
      outliers,
      creditsLeft: deduction.remainingCredits,
      saved: true,
    };
  } catch (e) {
    console.error("detectOutliers:", e);
    return { success: false, error: "Unerwarteter Fehler bei der Analyse." };
  }
}
