import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { deductCredits, hasEnoughCredits } from "@/lib/credits";

export const API_CREDIT_COSTS = {
  script: 2,
  niche: 2,
  outlier: 3,
  thumbnail: 1,
} as const;

async function callClaude(system: string, user: string, maxTokens = 4096) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!response.ok) throw new Error("API_ERROR");
  const data = await response.json();
  return (data.content?.[0]?.text ?? "") as string;
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

  try {
    const data = await run();
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
    return {
      ok: true,
      data,
      creditsUsed: cost,
      creditsRemaining: deduction.remainingCredits,
    };
  } catch {
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
  body: { niche: string; period?: string; channelSize?: string }
): Promise<ApiGenResult<{ outliers: unknown[] }>> {
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
        "Du bist ein YouTube Viral Content Analyst. Antworte NUR mit validem JSON Array von 6 Outlier-Konzepten.",
        `Nische: ${niche}
Zeitraum: ${body.period ?? "month"}
Kanal-Größe: ${body.channelSize ?? "micro"}`
      );
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      const outliers = Array.isArray(parsed)
        ? parsed
        : (parsed?.outliers ?? []);
      return { outliers: outliers.slice(0, 6) };
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

export async function getApiCreditsInfo(userId: string) {
  const supabase = createServiceSupabaseClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("credits")
    .eq("id", userId)
    .single();

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

  return {
    credits_remaining: profile?.credits ?? 0,
    credits_used_this_month: creditsUsedThisMonth,
  };
}
