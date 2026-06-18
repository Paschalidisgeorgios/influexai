import { NextResponse } from "next/server";

import { assertKiToolAccess } from "@/lib/access.server";
import { withCreditDeduction } from "@/lib/credits-with-refund";
import { createAnthropicMessage } from "@/lib/anthropic";
import { runWithQualityRetry } from "@/lib/agent/qualityScoring";
import {
  buildContentKalenderToolUserPrompt,
  CONTENT_KALENDER_PLATFORMS,
  CONTENT_KALENDER_TOOL_CREDIT_COST,
  CONTENT_KALENDER_TOOL_SYSTEM_PROMPT,
  isValidContentKalenderFrequency,
  parseContentKalenderToolResult,
  type ContentKalenderEntry,
  type ContentKalenderFrequency,
} from "@/lib/content-kalender-tool";
import { AgentSafetyError, checkAgentInputSafety } from "@/lib/agent/guards";
import { developmentWriteGuardResponse } from "@/lib/environment-safety.server";

export const dynamic = "force-dynamic";

export const maxDuration = 90;

type RequestBody = {
  nische?: string;
  plattform?: string;
  frequenz?: string;
};

export async function POST(request: Request) {
  const writeGuard = developmentWriteGuardResponse();
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

  const nische = body.nische?.trim() ?? "";
  const plattform = body.plattform?.trim() ?? "";
  const frequenz = body.frequenz?.trim() ?? "";

  if (!nische) {
    return NextResponse.json(
      { success: false, error: "Bitte gib deine Nische ein." },
      { status: 400 }
    );
  }

  if (
    !plattform ||
    !CONTENT_KALENDER_PLATFORMS.includes(
      plattform as (typeof CONTENT_KALENDER_PLATFORMS)[number]
    )
  ) {
    return NextResponse.json(
      { success: false, error: "Bitte wähle eine gültige Plattform." },
      { status: 400 }
    );
  }

  if (!isValidContentKalenderFrequency(frequenz)) {
    return NextResponse.json(
      { success: false, error: "Bitte wähle eine gültige Posting-Frequenz." },
      { status: 400 }
    );
  }

  try {
    checkAgentInputSafety(nische);
  } catch (err) {
    if (err instanceof AgentSafetyError) {
      return NextResponse.json({ success: false, error: err.message }, { status: 400 });
    }
    throw err;
  }

  const access = await assertKiToolAccess(CONTENT_KALENDER_TOOL_CREDIT_COST);
  if (access instanceof NextResponse) return access;
  const { userId, supabase } = access;

  const kalenderParams = { nische, plattform, frequenz: frequenz as ContentKalenderFrequency };
  const promptSummary = `${nische} · ${plattform} · ${frequenz}`.slice(0, 200);

  async function generateEntries(retryHint?: string): Promise<ContentKalenderEntry[]> {
    const claude = await createAnthropicMessage({
      system: CONTENT_KALENDER_TOOL_SYSTEM_PROMPT,
      user: buildContentKalenderToolUserPrompt(kalenderParams, retryHint),
      maxTokens: 4096,
    });

    if (!claude.ok) {
      throw new Error(claude.error);
    }

    return parseContentKalenderToolResult(claude.text);
  }

  const deductionResult = await withCreditDeduction(
    {
      supabase,
      userId,
      amount: CONTENT_KALENDER_TOOL_CREDIT_COST,
      description: "Content Kalender KI",
      skipGenerationLog: true,
      generationType: "content-kalender-tool",
      prompt: promptSummary,
    },
    async () => {
      const picked = await runWithQualityRetry({
        toolName: "content-kalender",
        userGoal: `${nische} · ${plattform} · ${frequenz}`,
        toOutputText: (items) =>
          items.map((e) => `${e.tag}: ${e.idee} (${e.format})`).join("\n"),
        generate: generateEntries,
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

  const entries = deductionResult.data;

  const { error: genErr } = await supabase.from("generations").insert({
    user_id: userId,
    type: "content-kalender-tool",
    prompt: promptSummary,
    credits_used: CONTENT_KALENDER_TOOL_CREDIT_COST,
    result: { entries },
  });

  if (genErr) {
    console.error("[content-kalender] generations insert:", genErr.message);
  }

  return NextResponse.json({
    success: true,
    entries,
    creditsLeft: deductionResult.remainingCredits,
  });
}
