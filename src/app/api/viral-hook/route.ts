import { NextResponse } from "next/server";

import { assertKiToolAccess } from "@/lib/access.server";
import { withCreditDeduction } from "@/lib/credits-with-refund";
import { createAnthropicMessage } from "@/lib/anthropic";
import { runWithQualityRetry } from "@/lib/agent/qualityScoring";
import {
  buildViralHookExtractorUserPrompt,
  parseViralHookExtractorResult,
  VIRAL_HOOK_EXTRACTOR_CREDIT_COST,
  VIRAL_HOOK_EXTRACTOR_SYSTEM_PROMPT,
} from "@/lib/viral-hook-extraktor";
import { AgentSafetyError, checkAgentInputSafety } from "@/lib/agent/guards";
import { providerRouteGuardResponse } from "@/lib/environment-safety.server";

export const dynamic = "force-dynamic";

export const maxDuration = 60;

type RequestBody = {
  input?: string;
};

export async function POST(request: Request) {
  const writeGuard = providerRouteGuardResponse();
  if (writeGuard) return writeGuard;

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

  if (input.length > 8000) {
    return NextResponse.json(
      { success: false, error: "Eingabe zu lang (max. 8000 Zeichen)." },
      { status: 400 }
    );
  }

  try {
    checkAgentInputSafety(input);
  } catch (err) {
    if (err instanceof AgentSafetyError) {
      return NextResponse.json({ success: false, error: err.message }, { status: 400 });
    }
    throw err;
  }

  const access = await assertKiToolAccess(VIRAL_HOOK_EXTRACTOR_CREDIT_COST);
  if (access instanceof NextResponse) return access;
  const { userId, supabase } = access;

  const promptSummary = input.slice(0, 200);

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

  const deductionResult = await withCreditDeduction(
    {
      supabase,
      userId,
      amount: VIRAL_HOOK_EXTRACTOR_CREDIT_COST,
      description: "Viral Hook Extraktor",
      skipGenerationLog: true,
      generationType: "viral-hook-extraktor",
      prompt: promptSummary,
    },
    async () => {
      const picked = await runWithQualityRetry({
        toolName: "viral-hook",
        userGoal: input,
        toOutputText: (items) => items.join("\n"),
        generate: generateHooks,
      });
      return picked.value;
    }
  );

  if (!deductionResult.ok) {
    return NextResponse.json(
      {
        success: false,
        error: deductionResult.error,
        credits: deductionResult.remainingCredits,
        required: deductionResult.required,
      },
      { status: deductionResult.status }
    );
  }

  const hooks = deductionResult.data;

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
    creditsLeft: deductionResult.remainingCredits,
  });
}
