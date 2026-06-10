import { analyzeNiche } from "@/app/actions/analyze-niche";
import { detectOutliers } from "@/app/actions/detect-outliers";
import { generateScript } from "@/app/actions/generate-script";
import { generateThumbnailConcepts } from "@/app/actions/generate-thumbnail";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAnthropicMessage } from "@/lib/anthropic";
import { runCompetitorAnalysis } from "@/lib/competitor-run";
import { runImageGeneratorGeneration } from "@/lib/image-generator-run";
import { enhanceImagePromptForAgent } from "@/lib/ai/imagePromptEnhancer";
import { inferImageStyleAndPlatform } from "@/lib/ai/imageStylePresets";
import { runProductAdPreviewGeneration } from "@/lib/product-ad-preview-run";
import { runSeedanceGeneration } from "@/lib/seedance-generate";
import {
  buildViralScoreUserPrompt,
  parseViralScoreResult,
  VIRAL_SCORE_CREDIT_COST,
  VIRAL_SCORE_SYSTEM_PROMPT,
} from "@/lib/viral-score";
import { deductCredits, hasEnoughCredits } from "@/lib/credits";
import { invalidateUserGenerations } from "@/lib/cache";
import { AGENT_TOOL_CREDITS } from "./credits";
import {
  buildAgentRedirect,
  isAgentRedirectTool,
} from "./redirect-tools";
import type { AgentOutputs, AgentToolName } from "./types";

export type ToolExecutionResult =
  | {
      ok: true;
      data: unknown;
      creditsUsed: number;
      creditsLeft?: number;
    }
  | { ok: false; error: string; creditsUsed: number };

function durationLabel(seconds: number): string {
  if (seconds <= 20) return "15 Sek";
  if (seconds <= 45) return "30 Sek";
  if (seconds <= 90) return "60 Sek";
  return "3 Min";
}

function languageLabel(code: string): string {
  const c = code.toLowerCase().slice(0, 2);
  if (c === "en") return "Englisch";
  if (c === "es") return "Español";
  return "Deutsch";
}

async function runViralScoreTool(input: {
  script: string;
  thumbnail: string;
  niche: string;
  language?: string;
}): Promise<ToolExecutionResult> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Nicht eingeloggt.", creditsUsed: 0 };

  const creditCheck = await hasEnoughCredits(
    supabase,
    user.id,
    VIRAL_SCORE_CREDIT_COST
  );
  if (!creditCheck.ok) {
    return {
      ok: false,
      error: "Nicht genug Credits.",
      creditsUsed: 0,
    };
  }

  const claude = await createAnthropicMessage({
    system: VIRAL_SCORE_SYSTEM_PROMPT,
    user: buildViralScoreUserPrompt({
      script: input.script,
      thumbnail_idea: input.thumbnail,
      niche: input.niche,
      language: input.language ?? "de",
    }),
    maxTokens: 1536,
  });

  if (!claude.ok) {
    return { ok: false, error: claude.error, creditsUsed: 0 };
  }

  let score;
  try {
    score = parseViralScoreResult(claude.text);
  } catch {
    return {
      ok: false,
      error: "Viral Score konnte nicht gelesen werden.",
      creditsUsed: 0,
    };
  }

  const deduction = await deductCredits(
    supabase,
    user.id,
    VIRAL_SCORE_CREDIT_COST,
    "viral_score",
    {
      generationType: "viral_score",
      prompt: `${input.niche} · ${input.script.slice(0, 80)}`,
    }
  );

  if (!deduction.success) {
    return {
      ok: false,
      error: deduction.error ?? "Credits konnten nicht abgezogen werden.",
      creditsUsed: 0,
    };
  }

  const promptSummary = `${input.niche} · ${input.script.slice(0, 120)}`;
  await supabase.from("generations").insert({
    user_id: user.id,
    type: "viral_score",
    prompt: promptSummary,
    credits_used: VIRAL_SCORE_CREDIT_COST,
    result: score,
  });
  invalidateUserGenerations(user.id);

  return {
    ok: true,
    data: score,
    creditsUsed: VIRAL_SCORE_CREDIT_COST,
    creditsLeft: deduction.remainingCredits,
  };
}

export async function executeAgentTool(
  name: AgentToolName,
  input: Record<string, unknown>,
  outputs: AgentOutputs
): Promise<ToolExecutionResult> {
  if (isAgentRedirectTool(name)) {
    const redirect = buildAgentRedirect(name, input);
    outputs.redirects = [...(outputs.redirects ?? []), redirect];
    return { ok: true, data: redirect, creditsUsed: 0 };
  }

  switch (name) {
    case "analyze_niche": {
      const niche = String(input.niche ?? input.topic ?? "");
      const result = await analyzeNiche(
        niche,
        "YouTube Shorts Zuschauer",
        "YouTube Shorts"
      );
      if (!result.success) {
        return { ok: false, error: result.error, creditsUsed: 0 };
      }
      outputs.niche = result.niches;
      return {
        ok: true,
        data: result.niches,
        creditsUsed: AGENT_TOOL_CREDITS.analyze_niche,
        creditsLeft: result.creditsLeft,
      };
    }

    case "detect_outlier": {
      const niche = String(input.niche ?? "");
      const lang = String(input.language ?? "de");
      const result = await detectOutliers(
        niche,
        "Letzter Monat",
        "YouTube Shorts",
        "Alle",
        lang
      );
      if (!result.success) {
        return { ok: false, error: result.error, creditsUsed: 0 };
      }
      outputs.outliers = result.outliers;
      return {
        ok: true,
        data: result.outliers,
        creditsUsed: AGENT_TOOL_CREDITS.detect_outlier,
        creditsLeft: result.creditsLeft,
      };
    }

    case "generate_script": {
      const topic = String(input.topic ?? "");
      const hook = String(input.hook ?? "");
      const durationSec = Number(input.duration ?? 30);
      const fullTopic = hook ? `${topic} — Hook: ${hook}` : topic;
      const result = await generateScript({
        topic: fullTopic,
        duration: durationLabel(durationSec),
        tone: "Energetisch & Motivierend",
        language: languageLabel(String(input.language ?? "de")),
        hookVariants: true,
        bRoll: true,
      });
      if (!result.success) {
        return { ok: false, error: result.error, creditsUsed: 0 };
      }
      outputs.script = result.result;
      return {
        ok: true,
        data: result.result,
        creditsUsed: AGENT_TOOL_CREDITS.generate_script,
        creditsLeft: result.creditsLeft,
      };
    }

    case "generate_thumbnail": {
      const title = String(input.title ?? input.topic ?? "");
      const style = String(input.style ?? "bold, high CTR");
      const result = await generateThumbnailConcepts({
        topic: title,
        style,
        colorEnergy: "hochkontrast, acid neon",
      });
      if (!result.success) {
        return { ok: false, error: result.error, creditsUsed: 0 };
      }
      outputs.thumbnail = result.concepts;
      return {
        ok: true,
        data: result.concepts,
        creditsUsed: AGENT_TOOL_CREDITS.generate_thumbnail,
        creditsLeft: result.creditsLeft,
      };
    }

    case "viral_score": {
      const viralResult = await runViralScoreTool({
        script: String(input.script ?? ""),
        thumbnail: String(input.thumbnail ?? ""),
        niche: String(input.niche ?? ""),
        language: String(input.language ?? "de"),
      });
      if (viralResult.ok) {
        outputs.viralScore = viralResult.data;
      }
      return viralResult;
    }

    case "analyze_competitor": {
      const supabase = await createServerSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { ok: false, error: "Nicht eingeloggt.", creditsUsed: 0 };
      }

      const channelUrl = String(
        input.channelUrl ?? input.channel_url ?? ""
      );
      const result = await runCompetitorAnalysis(
        supabase,
        user.id,
        channelUrl
      );

      if (!result.ok) {
        return {
          ok: false,
          error: result.failure.error,
          creditsUsed: 0,
        };
      }

      const { creditsLeft, ...payload } = result.data;
      outputs.competitor = payload;

      return {
        ok: true,
        data: payload,
        creditsUsed: AGENT_TOOL_CREDITS.analyze_competitor,
        creditsLeft,
      };
    }

    case "generate_image": {
      const supabase = await createServerSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { ok: false, error: "Nicht eingeloggt.", creditsUsed: 0 };
      }

      const userPrompt = String(input.prompt ?? "");
      const { styleId, platform } = inferImageStyleAndPlatform(userPrompt);
      const enhanced = await enhanceImagePromptForAgent(userPrompt, {
        styleId,
        platform,
      });
      console.log("[agent-image]", {
        styleId: enhanced.styleId,
        platform: enhanced.platform,
        model: "flux",
        source: "execute-tool",
      });

      const result = await runImageGeneratorGeneration(supabase, user.id, {
        prompt: userPrompt,
        category: "creator",
        styleId: enhanced.styleId,
        platform: enhanced.platform,
        preEnhanced: {
          enhancedPrompt: enhanced.prompt,
          negativePrompt: enhanced.negative_prompt,
          category: "creator",
          styleId: enhanced.styleId,
          platform: enhanced.platform,
        },
      });

      if (!result.ok) {
        return { ok: false, error: result.error, creditsUsed: 0 };
      }

      const imageOutput = {
        imageUrl: result.imageUrl,
        generationId: result.generationId,
        prompt: userPrompt,
      };
      outputs.image = imageOutput;

      return {
        ok: true,
        data: imageOutput,
        creditsUsed: result.creditsUsed,
        creditsLeft: result.creditsLeft,
      };
    }

    case "generate_video_from_image": {
      const supabase = await createServerSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { ok: false, error: "Nicht eingeloggt.", creditsUsed: 0 };
      }

      const imageUrl = String(
        input.imageUrl ??
          outputs.productPreview?.imageUrl ??
          outputs.image?.imageUrl ??
          ""
      );
      const motionPrompt = String(
        input.motionPrompt ??
          input.prompt ??
          "Authentic UGC creator presenting product, subtle hand movement, natural lighting, TikTok 9:16 vertical"
      );

      const result = await runSeedanceGeneration(supabase, user.id, {
        imageUrl,
        prompt: motionPrompt,
      });

      if (!result.ok) {
        return { ok: false, error: result.error, creditsUsed: 0 };
      }

      const videoOutput = {
        videoUrl: result.videoUrl,
        generationId: result.generationId,
        motionPrompt,
      };
      outputs.video = videoOutput;

      return {
        ok: true,
        data: videoOutput,
        creditsUsed: result.creditsUsed,
        creditsLeft: result.creditsLeft,
      };
    }

    case "generate_product_preview": {
      const supabase = await createServerSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { ok: false, error: "Nicht eingeloggt.", creditsUsed: 0 };
      }

      const result = await runProductAdPreviewGeneration(supabase, user.id, {
        productName: String(input.productName ?? ""),
        productDescription: String(input.productDescription ?? ""),
        productUrl: String(input.productUrl ?? input.product_url ?? ""),
        imageUrl: String(input.imageUrl ?? input.image_url ?? ""),
      });

      if (!result.ok) {
        return { ok: false, error: result.error, creditsUsed: 0 };
      }

      const previewOutput = {
        imageUrl: result.imageUrl,
        generationId: result.generationId,
        productName: result.productName,
        productDescription: result.productDescription,
        sourceImageUrl: result.sourceImageUrl,
        productUrl: result.productUrl,
      };
      outputs.productPreview = previewOutput;
      outputs.image = {
        imageUrl: result.imageUrl,
        generationId: result.generationId,
        prompt: result.productName,
      };

      return {
        ok: true,
        data: previewOutput,
        creditsUsed: result.creditsUsed,
        creditsLeft: result.creditsLeft,
      };
    }

    default:
      return { ok: false, error: `Unbekanntes Tool: ${name}`, creditsUsed: 0 };
  }
}
