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

const PROMPT_SCORER_SYSTEM = `Du bewertest Bild-Prompts für Social-Media (ohne das Bild zu sehen). Score 0-100 mit Breakdown:
- engagement: Scroll-Stopper, emotionale Trigger, Hook-Potenzial
- clarity: klare Szene, Motiv, Komposition, keine Widersprüche
- platformFit: passt zu Plattform-Format und Best Practices
Antworte NUR JSON: {"score": number, "breakdown": {"engagement": number, "clarity": number, "platformFit": number}, "weaknesses": ["..."], "passed": boolean}`;

export type VisualQualityBreakdown = {
  engagement: number;
  clarity: number;
  platformFit: number;
};

export type VisualScoreResult = {
  score: number;
  weaknesses: string[];
  passed: boolean;
  breakdown?: VisualQualityBreakdown;
};

function clampScore(value: unknown): number | null {
  return typeof value === "number"
    ? Math.max(0, Math.min(100, Math.round(value)))
    : null;
}

function parseBreakdown(raw: unknown): VisualQualityBreakdown | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const row = raw as Record<string, unknown>;
  const engagement = clampScore(row.engagement);
  const clarity = clampScore(row.clarity);
  const platformFit = clampScore(row.platformFit);
  if (engagement == null || clarity == null || platformFit == null) return undefined;
  return { engagement, clarity, platformFit };
}

function parseVisionJson(raw: string): VisualScoreResult | null {
  try {
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned) as {
      score?: unknown;
      weaknesses?: unknown;
      passed?: unknown;
      breakdown?: unknown;
    };
    const score = clampScore(parsed.score);
    if (score == null) return null;
    const weaknesses = Array.isArray(parsed.weaknesses)
      ? parsed.weaknesses.map((w) => String(w).trim()).filter(Boolean)
      : [];
    const passed =
      typeof parsed.passed === "boolean" ? parsed.passed : score >= 70;
    return {
      score,
      weaknesses,
      passed,
      breakdown: parseBreakdown(parsed.breakdown),
    };
  } catch {
    return null;
  }
}

/** Prompt-based visual scoring when image bytes are unavailable. */
export async function scorePromptVisualQuality(
  prompt: string,
  platform: string,
  userGoal: string
): Promise<VisualScoreResult> {
  const trimmed = prompt.trim();
  if (!trimmed) {
    return {
      score: 0,
      weaknesses: ["Leerer Prompt"],
      passed: false,
      breakdown: { engagement: 0, clarity: 0, platformFit: 0 },
    };
  }

  const result = await createAnthropicMessage({
    model: VISION_MODEL,
    maxTokens: 500,
    system: PROMPT_SCORER_SYSTEM,
    user: `Plattform: ${platform}
Briefing: ${userGoal.trim()}
Prompt:
${trimmed}`,
  });

  if (!result.ok) {
    console.warn("[visualQA] prompt scoring failed:", result.error);
    return {
      score: 55,
      weaknesses: ["Prompt-Scoring fehlgeschlagen"],
      passed: false,
      breakdown: { engagement: 55, clarity: 55, platformFit: 55 },
    };
  }

  const parsed = parseVisionJson(result.text);
  if (!parsed) {
    return {
      score: 55,
      weaknesses: ["Prompt-Scoring unparsebar"],
      passed: false,
      breakdown: { engagement: 55, clarity: 55, platformFit: 55 },
    };
  }

  console.log("[visualQA] prompt score:", parsed.score, parsed.breakdown);
  return parsed;
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
  generationId?: string,
  promptFallback?: string,
  platform = "instagram"
): Promise<VisualScoreResult> {
  const base64 = supabase
    ? await imageUrlToBase64(supabase, imageUrl, generationId)
    : null;

  if (!base64) {
    console.warn("[visualQA] could not load image — using prompt analysis");
    if (promptFallback?.trim()) {
      return scorePromptVisualQuality(promptFallback, platform, userGoal);
    }
    return {
      score: 50,
      weaknesses: ["Bild nicht ladbar und kein Prompt für Analyse"],
      passed: false,
      breakdown: { engagement: 50, clarity: 50, platformFit: 50 },
    };
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
    if (promptFallback?.trim()) {
      return scorePromptVisualQuality(promptFallback, platform, userGoal);
    }
    return {
      score: 50,
      weaknesses: ["Vision-Scoring fehlgeschlagen"],
      passed: false,
      breakdown: { engagement: 50, clarity: 50, platformFit: 50 },
    };
  }

  const parsed = parseVisionJson(result.text);
  if (!parsed) {
    if (promptFallback?.trim()) {
      return scorePromptVisualQuality(promptFallback, platform, userGoal);
    }
    return {
      score: 50,
      weaknesses: ["Vision-Scoring unparsebar"],
      passed: false,
      breakdown: { engagement: 50, clarity: 50, platformFit: 50 },
    };
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
    first.generationId,
    params.prompt,
    params.platform
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
    second.generationId,
    params.prompt,
    params.platform
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
