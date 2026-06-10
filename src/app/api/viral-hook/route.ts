import { NextResponse } from "next/server";

import { assertKiToolAccess } from "@/lib/access.server";
import { deductCredits } from "@/lib/credits";
import { createAnthropicMessage } from "@/lib/anthropic";
import { runWithQualityRetry } from "@/lib/agent/qualityScoring";
import {
  buildViralHookExtractorUserPrompt,
  parseViralHookExtractorResult,
  VIRAL_HOOK_EXTRACTOR_CREDIT_COST,
  VIRAL_HOOK_EXTRACTOR_SYSTEM_PROMPT,
} from "@/lib/viral-hook-extraktor";

export const dynamic = "force-dynamic";

export const maxDuration = 60;

type RequestBody = {
  input?: string;
};

export async function POST(request: Request) {
  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const input = body.input?.trim() ?? "";
  if (!input || input.length < 10) {
    return NextResponse.json(
      {
        success: false,
        error: "Bitte gib mindestens 10 Zeichen ein (Thema, Nische oder Transkript).",
      },
      { status: 400 }
    );
  }

  const access = await assertKiToolAccess(VIRAL_HOOK_EXTRACTOR_CREDIT_COST);
  if (access instanceof NextResponse) return access;
  const { userId, supabase } = access;

  async function generateHooks(retryHint?: string): Promise<string[]> {
    const claude = await createAnthropicMessage({
      system: VIRAL_HOOK_EXTRACTOR_SYSTEM_PROMPT,
      user: buildViralHookExtractorUserPrompt(input, retryHint),
      maxTokens: 1536,
    });

    if (!claude.ok) {
      throw new Error(claude.error);
    }

    return parseViralHookExtractorResult(claude.text);
  }

  let hooks: string[];
  try {
    const picked = await runWithQualityRetry({
      toolName: "viral-hook",
      userGoal: input,
      toOutputText: (items) => items.join("\n"),
      generate: generateHooks,
    });
    hooks = picked.value;
  } catch (e) {
    console.error("[viral-hook] generate:", e);
    return NextResponse.json(
      {
        success: false,
        error:
          e instanceof Error ? e.message : "KI-Antwort konnte nicht gelesen werden.",
      },
      { status: 500 }
    );
  }

  const promptSummary = input.slice(0, 200);

  const deducted = await deductCredits(
    supabase,
    userId,
    VIRAL_HOOK_EXTRACTOR_CREDIT_COST,
    "Viral Hook Extraktor",
    {
      generationType: "viral-hook-extraktor",
      skipGenerationLog: true,
      prompt: promptSummary,
    }
  );

  if (!deducted.success) {
    const status =
      deducted.error === "Nicht genug Credits." ? 402 : 500;
    return NextResponse.json(
      {
        success: false,
        error: deducted.error ?? "Credits konnten nicht abgezogen werden.",
        credits: deducted.remainingCredits,
        required: VIRAL_HOOK_EXTRACTOR_CREDIT_COST,
      },
      { status }
    );
  }

  const { error: genErr } = await supabase.from("generations").insert({
    user_id: userId,
    type: "viral-hook-extraktor",
    prompt: promptSummary,
    credits_used: VIRAL_HOOK_EXTRACTOR_CREDIT_COST,
    result: { hooks },
  });

  if (genErr) {
    console.error("[viral-hook] generations insert:", genErr.message);
  }

  return NextResponse.json({
    success: true,
    hooks,
    creditsLeft: deducted.remainingCredits,
  });
}
