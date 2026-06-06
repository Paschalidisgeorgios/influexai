"use server";

import { getLocale } from "next-intl/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { deductCredits, hasEnoughCredits } from "@/lib/credits";
import { insufficientCreditsError } from "@/lib/credit-action-result";
import {
  createAnthropicMessage,
  SCRIPT_GENERATOR_MODEL,
} from "@/lib/anthropic";
import { extractYouTubeVideoId, isYouTubeUrl } from "@/lib/youtube";
import { fetchYouTubeVideoSnippet } from "@/lib/youtube-metadata";
import {
  buildViralHookUserPrompt,
  parseViralHookResult,
  VIRAL_HOOK_SYSTEM_PROMPT,
  type ViralHookResult,
} from "@/lib/viral-hook-analysis";
import type { Locale } from "@/lib/locale";
import { localeToPromptLanguage } from "@/lib/locale";

export const VIRAL_HOOK_CREDIT_COST = 3;

export type ExtractViralHookInput = {
  mode: "url" | "manual";
  youtubeUrl?: string;
  manualDescription?: string;
  userNiche?: string;
};

type Success = {
  success: true;
  result: ViralHookResult;
  creditsLeft: number;
  usedYouTubeApi: boolean;
};

type Failure = {
  success: false;
  error: string;
  credits?: number;
  required?: number;
};

export async function extractViralHook(
  input: ExtractViralHookInput
): Promise<Success | Failure> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Nicht eingeloggt." };

  const creditCheck = await hasEnoughCredits(
    supabase,
    user.id,
    VIRAL_HOOK_CREDIT_COST
  );
  if (!creditCheck.ok) {
    return insufficientCreditsError(creditCheck.credits, VIRAL_HOOK_CREDIT_COST);
  }

  let title = "";
  let description = "";
  let channelTitle = "";
  let usedYouTubeApi = false;

  if (input.mode === "url") {
    const url = input.youtubeUrl?.trim() ?? "";
    if (!url || !isYouTubeUrl(url)) {
      return {
        success: false,
        error: "Bitte eine gültige YouTube-URL eingeben.",
      };
    }
    const videoId = extractYouTubeVideoId(url);
    if (!videoId) {
      return { success: false, error: "YouTube-Video-ID nicht erkannt." };
    }

    const snippet = await fetchYouTubeVideoSnippet(videoId);
    if (snippet) {
      title = snippet.title;
      description = snippet.description;
      channelTitle = snippet.channelTitle;
      usedYouTubeApi = true;
    } else {
      title = `YouTube Video ${videoId}`;
      description =
        input.manualDescription?.trim() ||
        "Keine Metadaten verfügbar — analysiere anhand der URL und typischer viraler Short-Form-Muster.";
      channelTitle = "Unbekannt";
    }
  } else {
    const manual = input.manualDescription?.trim() ?? "";
    if (manual.length < 20) {
      return {
        success: false,
        error: "Bitte beschreibe das Video ausführlicher (mind. 20 Zeichen).",
      };
    }
    title = "Manuelle Video-Beschreibung";
    description = manual;
    channelTitle = "Creator";
  }

  const locale = (await getLocale()) as Locale;
  const language = localeToPromptLanguage[locale] ?? "German";

  try {
    const claude = await createAnthropicMessage({
      system: VIRAL_HOOK_SYSTEM_PROMPT,
      user: buildViralHookUserPrompt({
        title,
        description,
        channelTitle,
        manualDescription:
          input.mode === "manual" ? input.manualDescription : undefined,
        userNiche: input.userNiche,
        language,
      }),
      model: SCRIPT_GENERATOR_MODEL,
      maxTokens: 4096,
    });

    if (!claude.ok) {
      return { success: false, error: claude.error };
    }

    const result = parseViralHookResult(claude.text);
    if (!result.sourceTitle) {
      result.sourceTitle = title;
    }

    const deduction = await deductCredits(
      supabase,
      user.id,
      VIRAL_HOOK_CREDIT_COST,
      "Viral Hook Extraktor",
      {
        generationType: "viral-hook",
        prompt: (input.youtubeUrl ?? input.manualDescription ?? title).slice(
          0,
          200
        ),
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
      usedYouTubeApi,
    };
  } catch (e) {
    console.error("extractViralHook:", e);
    if (e instanceof Error && e.stack) console.error(e.stack);
    return {
      success: false,
      error:
        e instanceof Error && e.message.length <= 180
          ? e.message
          : "Hook-Extraktion fehlgeschlagen. Bitte erneut versuchen.",
    };
  }
}
