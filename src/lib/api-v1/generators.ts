import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { addCredits, deductCredits, hasEnoughCredits } from "@/lib/credits";
import { createAnthropicMessage } from "@/lib/anthropic";
import {
  buildOutlierUserPrompt,
  normalizeOutlierLanguage,
  OUTLIER_SYSTEM_PROMPT,
  parseOutlierConcepts,
} from "@/lib/outlier-analysis";

import {
  IMAGE_CATEGORY_KEYS,
  VALID_FAL_IMAGE_SIZES,
  type FalImageSize,
  type ImageCategoryKey,
} from "@/lib/generation-config";
import { configureFalClient, getFalKey } from "@/lib/fal-image";
import {
  createGenerationRecord,
  ingestImageGeneratorAssets,
  updateGenerationResult,
} from "@/lib/generation-assets";
import { IMAGE_GEN_CREDITS } from "@/lib/image-generator-credits";
import { generateCategoryImage } from "@/lib/image-generator-fal";
import { prepareImageGeneratorPrompts } from "@/lib/image-generator-prompt-pipeline";
import {
  buildViralScoreUserPrompt,
  parseViralScoreResult,
  VIRAL_SCORE_CREDIT_COST,
  VIRAL_SCORE_SYSTEM_PROMPT,
  type ViralScoreResult,
} from "@/lib/viral-score";
import {
  getDailyRateLimitForPlan,
  startOfUtcDay,
} from "@/lib/api-v1/rate-limits";
import { normalizePlan } from "@/lib/subscription-plans";

configureFalClient();

export const API_CREDIT_COSTS = {
  script: 2,
  niche: 2,
  outlier: 3,
  thumbnail: 1,
  image: IMAGE_GEN_CREDITS.standard,
  viralScore: VIRAL_SCORE_CREDIT_COST,
} as const;

async function callClaude(system: string, user: string, maxTokens = 4096) {
  const result = await createAnthropicMessage({ system, user, maxTokens });
  if (!result.ok) throw new Error(result.error);
  return result.text;
}

export type ApiGenResult<T> =
  | { ok: true; data: T; creditsUsed: number; creditsRemaining: number }
  | {
      ok: false;
      error: string;
      code: "INSUFFICIENT_CREDITS";
      creditsRemaining: number;
    };

async function withCredits<T>(
  userId: string,
  cost: number,
  action: string,
  generationType: string,
  prompt: string,
  run: () => Promise<T>
): Promise<ApiGenResult<T>> {
  const supabase = createServiceSupabaseClient();
  const check = await hasEnoughCredits(supabase, userId, cost);
  if (!check.ok) {
    return {
      ok: false,
      error: "Insufficient credits",
      code: "INSUFFICIENT_CREDITS",
      creditsRemaining: check.credits,
    };
  }

  const deduction = await deductCredits(supabase, userId, cost, action, {
    generationType: `api:${generationType}`,
    prompt: prompt.slice(0, 200),
  });
  if (!deduction.success) {
    return {
      ok: false,
      error: "Insufficient credits",
      code: "INSUFFICIENT_CREDITS",
      creditsRemaining: deduction.remainingCredits,
    };
  }

  try {
    const data = await run();
    return {
      ok: true,
      data,
      creditsUsed: cost,
      creditsRemaining: deduction.remainingCredits,
    };
  } catch {
    await addCredits(supabase, userId, cost, `${action} — Refund`);
    throw new Error("GENERATION_FAILED");
  }
}

function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export async function apiGenerateScript(
  userId: string,
  body: {
    topic: string;
    duration?: string;
    tone?: string;
    language?: string;
    hooks?: boolean;
  }
): Promise<
  ApiGenResult<{
    script: string;
    hookVariants: string[];
    wordCount: number;
    estimatedSeconds: number;
  }>
> {
  const topic = body.topic?.trim();
  if (!topic) throw new Error("INVALID_TOPIC");

  const duration = body.duration ?? "60s";
  const tone = body.tone ?? "energetic";
  const language = body.language ?? "de";
  const hooks = body.hooks !== false;

  return withCredits(
    userId,
    API_CREDIT_COSTS.script,
    "API Script",
    "script-generator",
    topic,
    async () => {
      const text = await callClaude(
        "Du bist ein professioneller Short-Form Video Script Writer. Antworte NUR mit validem JSON.",
        `Thema: ${topic}
Länge: ${duration}
Stil: ${tone}
Sprache: ${language}
${hooks ? "Generiere 3 alternative Hook-Varianten in hookVariants." : "hookVariants: []"}

JSON: { "script": string, "hookVariants": string[], "wordCount": number, "estimatedSeconds": number }`
      );
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      const script = String(parsed.script ?? "");
      const hookVariants =
        hooks && Array.isArray(parsed.hookVariants)
          ? parsed.hookVariants.slice(0, 3).map(String)
          : [];
      const wordCount = Number(parsed.wordCount) || countWords(script);
      const estimatedSeconds =
        Number(parsed.estimatedSeconds) || Math.round(wordCount / 2.5);
      return { script, hookVariants, wordCount, estimatedSeconds };
    }
  );
}

export async function apiAnalyzeNiche(
  userId: string,
  body: { topic: string; audience?: string; format?: string }
): Promise<ApiGenResult<{ niches: unknown[] }>> {
  const topic = body.topic?.trim();
  if (!topic) throw new Error("INVALID_TOPIC");

  return withCredits(
    userId,
    API_CREDIT_COSTS.niche,
    "API Niche",
    "niche-analyzer",
    topic,
    async () => {
      const text = await callClaude(
        "Du bist ein YouTube Growth Experte. Liefere exakt 5 profitable Nischen-Ideen als JSON Array. Nur JSON.",
        `Thema: ${topic}
Zielgruppe: ${body.audience ?? "allgemein"}
Format: ${body.format ?? "shorts"}`
      );
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      const niches = Array.isArray(parsed) ? parsed : (parsed?.niches ?? []);
      return { niches: niches.slice(0, 5) };
    }
  );
}

export async function apiDetectOutliers(
  userId: string,
  body: {
    niche: string;
    period?: string;
    platform?: string;
    channelSize?: string;
    language?: string;
  }
): Promise<ApiGenResult<{ outliers: unknown[]; saved: boolean }>> {
  const niche = body.niche?.trim();
  if (!niche) throw new Error("INVALID_NICHE");

  return withCredits(
    userId,
    API_CREDIT_COSTS.outlier,
    "API Outlier",
    "outlier-detector",
    niche,
    async () => {
      const text = await callClaude(
        OUTLIER_SYSTEM_PROMPT,
        buildOutlierUserPrompt({
          niche,
          period: body.period ?? "Letzter Monat",
          platform: body.platform ?? "YouTube Shorts",
          channelSize: body.channelSize ?? "Alle",
          language: normalizeOutlierLanguage(body.language),
        })
      );
      const outliers = parseOutlierConcepts(text);
      const supabase = createServiceSupabaseClient();
      const { error: saveError } = await supabase.from("outlier_results").insert({
        user_id: userId,
        niche,
        results: outliers,
      });
      return { outliers, saved: !saveError };
    }
  );
}

export async function apiGenerateThumbnail(
  userId: string,
  body: { topic: string; style?: string; colorEnergy?: string }
): Promise<ApiGenResult<{ concepts: unknown[] }>> {
  const topic = body.topic?.trim();
  if (!topic) throw new Error("INVALID_TOPIC");

  return withCredits(
    userId,
    API_CREDIT_COSTS.thumbnail,
    "API Thumbnail",
    "thumbnail-concept",
    topic,
    async () => {
      const text = await callClaude(
        "Du bist ein YouTube Thumbnail Designer. Antworte NUR mit JSON Array von 3 Thumbnail-Konzepten.",
        `Video-Thema: ${topic}
Stil: ${body.style ?? "text_dominant"}
Farb-Energie: ${body.colorEnergy ?? "acid"}`,
        8192
      );
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      const concepts = Array.isArray(parsed)
        ? parsed
        : (parsed?.concepts ?? []);
      return { concepts: concepts.slice(0, 3) };
    }
  );
}

export async function getApiMeInfo(userId: string) {
  const supabase = createServiceSupabaseClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("credits, plan, email")
    .eq("id", userId)
    .single();

  const { data: authUser } = await supabase.auth.admin.getUserById(userId);
  const email = profile?.email ?? authUser?.user?.email ?? null;
  const plan = normalizePlan(profile?.plan);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data: logs } = await supabase
    .from("api_logs")
    .select("credits_used")
    .eq("user_id", userId)
    .gte("created_at", startOfMonth.toISOString());

  const creditsUsedThisMonth = (logs ?? []).reduce(
    (s, r) => s + (r.credits_used ?? 0),
    0
  );

  const sinceDay = startOfUtcDay();
  const { count: requestsToday } = await supabase
    .from("api_logs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", sinceDay);

  return {
    user_id: userId,
    email,
    plan,
    credits_remaining: profile?.credits ?? 0,
    credits_used_this_month: creditsUsedThisMonth,
    requests_today: requestsToday ?? 0,
    rate_limit_per_day: getDailyRateLimitForPlan(plan),
  };
}

/** @deprecated Use getApiMeInfo */
export async function getApiCreditsInfo(userId: string) {
  const me = await getApiMeInfo(userId);
  return {
    credits_remaining: me.credits_remaining,
    credits_used_this_month: me.credits_used_this_month,
  };
}

function isValidImageCategory(c: string): c is ImageCategoryKey {
  return (IMAGE_CATEGORY_KEYS as string[]).includes(c);
}

function protectedImageUrl(generationId: string) {
  return `/api/generated-image/${generationId}?variant=preview`;
}

export async function apiGenerateImage(
  userId: string,
  body: {
    prompt: string;
    category?: string;
    aspect_ratio?: string;
    high_res?: boolean;
  }
): Promise<
  ApiGenResult<{
    generation_id: string;
    image_url: string;
    width?: number;
    height?: number;
    model: string;
  }>
> {
  const prompt = body.prompt?.trim();
  if (!prompt) throw new Error("INVALID_PROMPT");

  if (!getFalKey()) {
    throw new Error("FAL_NOT_CONFIGURED");
  }

  const category: ImageCategoryKey = isValidImageCategory(body.category ?? "")
    ? (body.category as ImageCategoryKey)
    : "creator";
  const imageSize = VALID_FAL_IMAGE_SIZES.includes(
    body.aspect_ratio as FalImageSize
  )
    ? (body.aspect_ratio as FalImageSize)
    : "landscape_16_9";
  const highRes = body.high_res === true;
  const cost = highRes ? IMAGE_GEN_CREDITS.highRes : IMAGE_GEN_CREDITS.standard;

  return withCredits(
    userId,
    cost,
    "API Image",
    "image-generator",
    prompt,
    async () => {
      const supabase = createServiceSupabaseClient();
      const prepared = await prepareImageGeneratorPrompts(prompt, category);
      const falResult = await generateCategoryImage({
        prompt: prepared.enhancedPrompt,
        falPrompt: prepared.enhancedPrompt,
        negativePrompt: prepared.negativePrompt,
        category: prepared.category,
        imageSize,
        highRes,
      });

      const generationId = await createGenerationRecord(
        supabase,
        userId,
        "image",
        {
          paid: false,
          downloadPaid: false,
          mode: "preview",
          assetKind: "image",
          category,
          model: falResult.model,
          width: falResult.width,
          height: falResult.height,
          highRes,
        },
        cost,
        prompt.slice(0, 500)
      );

      const { previewPath, width, height } = await ingestImageGeneratorAssets(
        userId,
        generationId,
        falResult.url
      );

      await updateGenerationResult(supabase, generationId, userId, {
        previewPath,
        width: width ?? falResult.width,
        height: height ?? falResult.height,
        credits_used: cost,
      });

      return {
        generation_id: generationId,
        image_url: protectedImageUrl(generationId),
        width: width ?? falResult.width,
        height: height ?? falResult.height,
        model: falResult.model,
      };
    }
  );
}

export async function apiCalculateViralScore(
  userId: string,
  body: {
    script: string;
    thumbnail_idea: string;
    niche: string;
    language?: string;
  }
): Promise<ApiGenResult<{ score: ViralScoreResult }>> {
  const script = body.script?.trim() ?? "";
  const thumbnailIdea = body.thumbnail_idea?.trim() ?? "";
  const niche = body.niche?.trim() ?? "";

  if (!script || script.length < 20) throw new Error("INVALID_SCRIPT");
  if (!thumbnailIdea) throw new Error("INVALID_THUMBNAIL");
  if (!niche) throw new Error("INVALID_NICHE");

  return withCredits(
    userId,
    API_CREDIT_COSTS.viralScore,
    "API Viral Score",
    "viral-score",
    `${niche} · ${script.slice(0, 80)}`,
    async () => {
      const text = await callClaude(
        VIRAL_SCORE_SYSTEM_PROMPT,
        buildViralScoreUserPrompt({
          script,
          thumbnail_idea: thumbnailIdea,
          niche,
          language: body.language ?? "de",
        }),
        1536
      );
      const score = parseViralScoreResult(text);
      const supabase = createServiceSupabaseClient();
      await supabase.from("generations").insert({
        user_id: userId,
        type: "viral_score",
        prompt: `${niche} · ${script.slice(0, 120)}`,
        credits_used: API_CREDIT_COSTS.viralScore,
        result: score,
      });
      return { score };
    }
  );
}

export async function listApiGenerations(
  userId: string,
  options: { limit?: number; offset?: number; type?: string } = {}
) {
  const limit = Math.min(50, Math.max(1, options.limit ?? 20));
  const offset = Math.max(0, options.offset ?? 0);
  const supabase = createServiceSupabaseClient();

  let query = supabase
    .from("generations")
    .select("id, type, prompt, credits_used, created_at, result")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (options.type?.trim()) {
    query = query.eq("type", options.type.trim());
  }

  const { data, error } = await query;
  if (error) throw new Error("GENERATIONS_FETCH_FAILED");

  return {
    generations: (data ?? []).map((row) => ({
      id: row.id,
      type: row.type,
      prompt: row.prompt,
      credits_used: row.credits_used,
      created_at: row.created_at,
      result: row.result,
    })),
    limit,
    offset,
  };
}
