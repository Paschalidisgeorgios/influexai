import { analyzeNiche } from "@/app/actions/analyze-niche";
import { detectOutliers } from "@/app/actions/detect-outliers";
import { generateScript } from "@/app/actions/generate-script";
import { generateThumbnailConcepts } from "@/app/actions/generate-thumbnail";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAnthropicMessage } from "@/lib/anthropic";
import {
  buildViralScoreUserPrompt,
  parseViralScoreResult,
  VIRAL_SCORE_CREDIT_COST,
  VIRAL_SCORE_SYSTEM_PROMPT,
} from "@/lib/viral-score";
import { deductCredits, hasEnoughCredits } from "@/lib/credits";
import { logGeneration } from "@/lib/activity-log";
import { invalidateUserGenerations } from "@/lib/cache";
import { AGENT_TOOL_CREDITS } from "./credits";
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
  switch (name) {
    case "analyze_niche": {
      const niche = String(input.niche ?? "");
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
        creditsUsed: 2,
        creditsLeft: result.creditsLeft,
      };
    }

    case "find_outliers": {
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
        creditsUsed: AGENT_TOOL_CREDITS.find_outliers,
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

    case "create_thumbnail_concept": {
      const title = String(input.title ?? "");
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
        creditsUsed: AGENT_TOOL_CREDITS.create_thumbnail_concept,
        creditsLeft: result.creditsLeft,
      };
    }

    case "calculate_viral_score": {
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

    case "suggest_video_ideas": {
      const niche = String(input.niche ?? "");
      const count = Math.min(5, Math.max(1, Number(input.count ?? 3)));
      const claude = await createAnthropicMessage({
        system:
          "Du bist YouTube Shorts Stratege. Antworte NUR mit validem JSON.",
        user: `Nische: ${niche}
Erstelle ${count} konkrete Video-Ideen als JSON:
{"ideas":[{"title":string,"hook":string,"why_viral":string}]}`,
        maxTokens: 1024,
      });
      if (!claude.ok) {
        return { ok: false, error: claude.error, creditsUsed: 0 };
      }
      try {
        const parsed = JSON.parse(
          claude.text.replace(/```json|```/gi, "").trim()
        ) as { ideas?: unknown };
        outputs.videoIdeas = parsed.ideas ?? parsed;
        return {
          ok: true,
          data: outputs.videoIdeas,
          creditsUsed: 0,
        };
      } catch {
        return {
          ok: false,
          error: "Video-Ideen konnten nicht gelesen werden.",
          creditsUsed: 0,
        };
      }
    }

    default:
      return { ok: false, error: `Unbekanntes Tool: ${name}`, creditsUsed: 0 };
  }
}
