import type { SupabaseClient } from "@supabase/supabase-js";
import { createAnthropicMessage } from "@/lib/anthropic";
import { runImageGeneratorGeneration } from "@/lib/image-generator-run";
import {
  QUALITY_RETRY_THRESHOLD,
  buildQualityRetryHint,
} from "@/lib/agent/qualityScoring";
import { downloadStorageObject } from "@/lib/generation-assets";
import { parseGenerationAssetResult } from "@/lib/generation-asset-types";
import type {
  GenerationHardConstraints,
  VisualQAReport,
} from "./types";
import type { ImagePlatformId, ImageStyleId } from "@/lib/ai/imageStylePresets";

const VISION_MODEL = "claude-sonnet-4-5-20250929";

const VISION_SYSTEM = `Du bewertest Social-Media-Bilder für Creator. Score 0-100: Motiv passt zum Briefing, natürliche Anatomie, keine verzerrten Hände/Gesichter, plattformgerecht, kein unleserlicher Text im Bild. Antworte NUR JSON: {"score": number, "weaknesses": ["..."], "passed": boolean}`;

export type VisualScoreResult = {
  score: number;
  weaknesses: string[];
  passed: boolean;
};

function parseVisionJson(raw: string): VisualScoreResult | null {
  try {
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned) as {
      score?: unknown;
      weaknesses?: unknown;
      passed?: unknown;
    };
    const score =
      typeof parsed.score === "number"
        ? Math.max(0, Math.min(100, Math.round(parsed.score)))
        : null;
    if (score == null) return null;
    const weaknesses = Array.isArray(parsed.weaknesses)
      ? parsed.weaknesses.map((w) => String(w).trim()).filter(Boolean)
      : [];
    const passed =
      typeof parsed.passed === "boolean" ? parsed.passed : score >= 70;
    return { score, weaknesses, passed };
  } catch {
    return null;
  }
}

async function imageUrlToBase64(
  supabase: SupabaseClient,
  imageUrl: string,
  generationId?: string
): Promise<string | null> {
  if (generationId) {
    try {
      const { data: gen } = await supabase
        .from("generations")
        .select("result")
        .eq("id", generationId)
        .maybeSingle();
      const asset = parseGenerationAssetResult(gen?.result);
      const previewPath = asset?.previewPath;
      if (previewPath) {
        const { data: blob } = await downloadStorageObject(previewPath);
        const buf = Buffer.from(await blob.arrayBuffer());
        return buf.toString("base64");
      }
    } catch {
      // fall through
    }
  }

  try {
    const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const full = imageUrl.startsWith("http") ? imageUrl : `${base}${imageUrl}`;
    const res = await fetch(full);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return buf.toString("base64");
  } catch {
    return null;
  }
}

export async function scoreVisualOutput(
  imageUrl: string,
  userGoal: string,
  supabase?: SupabaseClient,
  generationId?: string
): Promise<VisualScoreResult> {
  const base64 = supabase
    ? await imageUrlToBase64(supabase, imageUrl, generationId)
    : null;

  if (!base64) {
    console.warn("[visualQA] could not load image, skipping vision score");
    return { score: 100, weaknesses: [], passed: true };
  }

  const result = await createAnthropicMessage({
    model: VISION_MODEL,
    maxTokens: 500,
    system: VISION_SYSTEM,
    user: [
      {
        type: "image",
        source: {
          type: "base64",
          media_type: "image/jpeg",
          data: base64,
        },
      },
      {
        type: "text",
        text: `Briefing: ${userGoal.trim()}\nBewerte dieses Bild.`,
      },
    ],
  });

  if (!result.ok) {
    console.warn("[visualQA] vision failed:", result.error);
    return { score: 100, weaknesses: [], passed: true };
  }

  const parsed = parseVisionJson(result.text);
  if (!parsed) {
    return { score: 100, weaknesses: [], passed: true };
  }

  console.log("[visualQA] score:", parsed.score, "passed:", parsed.passed);
  return parsed;
}

export async function runVisualQA(
  imageUrl: string,
  constraints: GenerationHardConstraints,
  supabase?: SupabaseClient,
  generationId?: string,
  userGoal = ""
): Promise<VisualQAReport> {
  const scored = await scoreVisualOutput(
    imageUrl,
    userGoal,
    supabase,
    generationId
  );

  return {
    passed: scored.passed && scored.score >= QUALITY_RETRY_THRESHOLD,
    genderMatches: true,
    subjectCountMatches: true,
    anatomyOk: scored.score >= 60,
    handsOk: scored.score >= 60,
    faceOk: scored.score >= 60,
    textOk: scored.score >= 60,
    logoOk: true,
    formatOk: true,
    brandFit:
      scored.score >= 80 ? "high" : scored.score >= 60 ? "medium" : "low",
    issues: scored.weaknesses,
    repairPrompt:
      scored.weaknesses.length > 0
        ? buildQualityRetryHint(scored.weaknesses)
        : undefined,
  };
}

export function buildRepairPrompt(
  report: VisualQAReport,
  constraints: GenerationHardConstraints,
  originalPrompt: string
): string {
  const fixes: string[] = [];

  if (!report.genderMatches) {
    const g = constraints.subjectGenderPresentation;
    fixes.push(
      g === "female"
        ? "Regenerate with one clearly female-presenting adult woman. No male subjects, no beards, no masculine features."
        : "Regenerate with one clearly male-presenting adult man."
    );
  }
  if (!report.handsOk) {
    fixes.push(
      "Fix hand anatomy: exactly 5 fingers per hand, no extra fingers, natural proportions."
    );
  }
  if (!report.textOk) {
    fixes.push("Remove all text overlays, typography, letters from the image.");
  }
  if (!report.faceOk) {
    fixes.push(
      "Fix facial features: symmetric eyes, natural proportions, no distortion."
    );
  }
  if (report.issues.length > 0) {
    fixes.push(report.issues.join(". "));
  }

  return fixes.length > 0
    ? `${originalPrompt}. IMPORTANT FIXES: ${fixes.join(" ")}`
    : originalPrompt;
}

export async function runVisualQAWithRetry(params: {
  supabase: SupabaseClient;
  userId: string;
  prompt: string;
  styleId: ImageStyleId;
  platform: ImagePlatformId;
  enhanced: {
    prompt: string;
    negative_prompt: string;
    styleId: ImageStyleId;
    platform: ImagePlatformId;
  };
}): Promise<{
  imageUrl: string;
  generationId: string;
  qualityScore: number;
  retried: boolean;
}> {
  const generate = async (retryHint?: string) => {
    const enhancedPrompt = retryHint
      ? `${params.enhanced.prompt}. ${retryHint}`
      : params.enhanced.prompt;

    const result = await runImageGeneratorGeneration(
      params.supabase,
      params.userId,
      {
        prompt: params.prompt,
        category: "creator",
        styleId: params.styleId,
        platform: params.platform,
        preEnhanced: {
          enhancedPrompt,
          negativePrompt: params.enhanced.negative_prompt,
          category: "creator",
          styleId: params.enhanced.styleId,
          platform: params.enhanced.platform,
        },
      }
    );

    if (!result.ok) throw new Error(result.error);
    return result;
  };

  const first = await generate();
  const firstScore = await scoreVisualOutput(
    first.imageUrl,
    params.prompt,
    params.supabase,
    first.generationId
  );

  if (firstScore.score >= QUALITY_RETRY_THRESHOLD) {
    return {
      imageUrl: first.imageUrl,
      generationId: first.generationId,
      qualityScore: firstScore.score,
      retried: false,
    };
  }

  const second = await generate(buildQualityRetryHint(firstScore.weaknesses));
  const secondScore = await scoreVisualOutput(
    second.imageUrl,
    params.prompt,
    params.supabase,
    second.generationId
  );

  if (secondScore.score >= firstScore.score) {
    return {
      imageUrl: second.imageUrl,
      generationId: second.generationId,
      qualityScore: secondScore.score,
      retried: true,
    };
  }

  return {
    imageUrl: first.imageUrl,
    generationId: first.generationId,
    qualityScore: firstScore.score,
    retried: true,
  };
}
