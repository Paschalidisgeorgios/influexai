import type { SupabaseClient } from "@supabase/supabase-js";
import { createAnthropicMessage, SCRIPT_GENERATOR_MODEL } from "@/lib/anthropic";
import { hasEnoughCredits } from "@/lib/credits";
import { withCreditDeduction } from "@/lib/credits-with-refund";
import {
  buildCompetitorUserPrompt,
  COMPETITOR_ANALYSIS_CREDIT_COST,
  COMPETITOR_ANALYSIS_SYSTEM_PROMPT,
  parseCompetitorAnalysis,
  type CompetitorAnalysisResponse,
} from "@/lib/competitor-analysis";
import { fetchYouTubeChannelBundle } from "@/lib/youtube-channel";

export type CompetitorRunSuccess = CompetitorAnalysisResponse & {
  creditsLeft: number;
};

export type CompetitorRunFailure = {
  status: number;
  error: string;
  credits?: number;
  required?: number;
};

export async function runCompetitorAnalysis(
  supabase: SupabaseClient,
  userId: string,
  channelUrl: string
): Promise<
  | { ok: true; data: CompetitorRunSuccess }
  | { ok: false; failure: CompetitorRunFailure }
> {
  const trimmed = channelUrl.trim();
  if (!trimmed) {
    return {
      ok: false,
      failure: {
        status: 400,
        error: "Bitte gib eine YouTube-Kanal-URL oder @handle ein.",
      },
    };
  }

  if (!process.env.YOUTUBE_API_KEY?.trim()) {
    return {
      ok: false,
      failure: {
        status: 503,
        error:
          "YouTube-Daten sind gerade nicht verfügbar. Bitte später erneut versuchen.",
      },
    };
  }

  const creditCheck = await hasEnoughCredits(
    supabase,
    userId,
    COMPETITOR_ANALYSIS_CREDIT_COST
  );
  if (!creditCheck.ok) {
    return {
      ok: false,
      failure: {
        status: 402,
        error: "Nicht genug Credits.",
        credits: creditCheck.credits,
        required: COMPETITOR_ANALYSIS_CREDIT_COST,
      },
    };
  }

  const deductionResult = await withCreditDeduction(
    {
      supabase,
      userId,
      amount: COMPETITOR_ANALYSIS_CREDIT_COST,
      description: "competitor_analysis",
      skipGenerationLog: true,
      prompt: trimmed.slice(0, 200),
    },
    async () => {
      const bundle = await fetchYouTubeChannelBundle(trimmed);

      const claude = await createAnthropicMessage({
        system: COMPETITOR_ANALYSIS_SYSTEM_PROMPT,
        user: buildCompetitorUserPrompt(bundle),
        maxTokens: 2048,
        model: SCRIPT_GENERATOR_MODEL,
      });

      if (!claude.ok) {
        throw new Error(claude.error);
      }

      const analysis = parseCompetitorAnalysis(claude.text, bundle);

      const payload: CompetitorAnalysisResponse = {
        channel: bundle.channel,
        topVideos: bundle.topVideos.slice(0, 5),
        analysis,
      };

      const promptSummary = `${bundle.channel.title} · ${trimmed.slice(0, 120)}`;

      const { error: genErr } = await supabase.from("generations").insert({
        user_id: userId,
        type: "competitor_analysis",
        prompt: promptSummary,
        credits_used: COMPETITOR_ANALYSIS_CREDIT_COST,
        result: payload,
      });

      if (genErr) {
        console.error("[competitor] generations insert:", genErr.message);
      }

      return payload;
    }
  );

  if (!deductionResult.ok) {
    return {
      ok: false,
      failure: {
        status: deductionResult.status,
        error: deductionResult.error,
        credits: deductionResult.remainingCredits,
        required: deductionResult.required,
      },
    };
  }

  return {
    ok: true,
    data: { ...deductionResult.data, creditsLeft: deductionResult.remainingCredits },
  };
}
