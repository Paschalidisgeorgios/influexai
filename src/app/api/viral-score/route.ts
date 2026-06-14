import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hasEnoughCredits } from "@/lib/credits";
import { withCreditDeduction } from "@/lib/credits-with-refund";
import { createAnthropicMessage, SCRIPT_GENERATOR_MODEL } from "@/lib/anthropic";
import {
  buildViralScoreUserPrompt,
  parseViralScoreResult,
  VIRAL_SCORE_CREDIT_COST,
  VIRAL_SCORE_SYSTEM_PROMPT,
  type ViralScoreResult,
} from "@/lib/viral-score";
import { AgentSafetyError, checkAgentInputSafety } from "@/lib/agent/guards";
import { assertGatedFeature } from "@/lib/access.server";

export const dynamic = "force-dynamic";

export const maxDuration = 60;

class ClaudeApiError extends Error {}

type RequestBody = {
  script?: string;
  thumbnail_idea?: string;
  niche?: string;
  language?: string;
};

export async function POST(request: Request) {
  const denied = await assertGatedFeature("viral-score");
  if (denied) return denied;

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const script = body.script?.trim() ?? "";
  const thumbnailIdea = body.thumbnail_idea?.trim() ?? "";
  const niche = body.niche?.trim() ?? "";

  if (!script || script.length < 20) {
    return NextResponse.json(
      { success: false, error: "Bitte gib ein Script mit mindestens 20 Zeichen ein." },
      { status: 400 }
    );
  }
  if (script.length > 12000) {
    return NextResponse.json(
      { success: false, error: "Script zu lang (max. 12000 Zeichen)." },
      { status: 400 }
    );
  }
  if (!thumbnailIdea) {
    return NextResponse.json(
      { success: false, error: "Bitte gib eine Thumbnail-Idee ein." },
      { status: 400 }
    );
  }
  if (!niche) {
    return NextResponse.json(
      { success: false, error: "Bitte gib eine Nische ein." },
      { status: 400 }
    );
  }

  try {
    checkAgentInputSafety(`${script}\n${thumbnailIdea}\n${niche}`);
  } catch (err) {
    if (err instanceof AgentSafetyError) {
      return NextResponse.json({ success: false, error: err.message }, { status: 400 });
    }
    throw err;
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Nicht eingeloggt." },
      { status: 401 }
    );
  }

  const creditCheck = await hasEnoughCredits(
    supabase,
    user.id,
    VIRAL_SCORE_CREDIT_COST
  );
  if (!creditCheck.ok) {
    return NextResponse.json(
      {
        success: false,
        error: "Nicht genug Credits.",
        credits: creditCheck.credits,
        required: VIRAL_SCORE_CREDIT_COST,
      },
      { status: 402 }
    );
  }

  const promptSummary = `${niche} · ${script.slice(0, 120)}`;
  const userPrompt = buildViralScoreUserPrompt({
    script,
    thumbnail_idea: thumbnailIdea,
    niche,
    language: body.language ?? "de",
  });

  const deductionResult = await withCreditDeduction(
    {
      supabase,
      userId: user.id,
      amount: VIRAL_SCORE_CREDIT_COST,
      description: "viral_score",
      skipGenerationLog: true,
      prompt: promptSummary,
    },
    async () => {
      const claude = await createAnthropicMessage({
        system: VIRAL_SCORE_SYSTEM_PROMPT,
        user: userPrompt,
        maxTokens: 1536,
        model: SCRIPT_GENERATOR_MODEL,
      });

      if (!claude.ok) {
        throw new ClaudeApiError(claude.error);
      }

      return parseViralScoreResult(claude.text);
    }
  );

  if (!deductionResult.ok) {
    const status = deductionResult.error.includes("Zu viele Anfragen")
      ? 429
      : deductionResult.status;
    return NextResponse.json(
      {
        success: false,
        error: deductionResult.error,
        credits: deductionResult.remainingCredits,
        required: deductionResult.required,
      },
      { status }
    );
  }

  const score: ViralScoreResult = deductionResult.data;

  const { error: genErr } = await supabase.from("generations").insert({
    user_id: user.id,
    type: "viral_score",
    prompt: promptSummary,
    credits_used: VIRAL_SCORE_CREDIT_COST,
    result: score,
  });

  if (genErr) {
    console.error("[viral-score] generations insert:", genErr.message);
  }

  return NextResponse.json({
    success: true,
    score,
    creditsLeft: deductionResult.remainingCredits,
  });
}
