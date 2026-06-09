import { NextResponse } from "next/server";

import { assertKiToolAccess } from "@/lib/access.server";
import { deductCredits } from "@/lib/credits";
import { createAnthropicMessage } from "@/lib/anthropic";
import { selectOutputWithQualityRetry } from "@/lib/agent/qualityScoring";
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

export const dynamic = "force-dynamic";

export const maxDuration = 90;

type RequestBody = {
  nische?: string;
  plattform?: string;
  frequenz?: string;
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

  const access = await assertKiToolAccess(CONTENT_KALENDER_TOOL_CREDIT_COST);
  if (access instanceof NextResponse) return access;
  const { userId, supabase } = access;

  const kalenderParams = { nische, plattform, frequenz: frequenz as ContentKalenderFrequency };

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

  let entries: ContentKalenderEntry[];
  try {
    const picked = await selectOutputWithQualityRetry({
      toolName: "content-kalender",
      userGoal: `${nische} · ${plattform} · ${frequenz}`,
      toOutputText: (items) =>
        items.map((e) => `${e.tag}: ${e.idee} (${e.format})`).join("\n"),
      generate: generateEntries,
    });
    entries = picked.value;
  } catch (e) {
    console.error("[content-kalender] generate:", e);
    return NextResponse.json(
      {
        success: false,
        error:
          e instanceof Error ? e.message : "KI-Antwort konnte nicht gelesen werden.",
      },
      { status: 500 }
    );
  }

  const promptSummary = `${nische} · ${plattform} · ${frequenz}`.slice(0, 200);

  const deducted = await deductCredits(
    supabase,
    userId,
    CONTENT_KALENDER_TOOL_CREDIT_COST,
    "Content Kalender KI",
    {
      generationType: "content-kalender-tool",
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
        required: CONTENT_KALENDER_TOOL_CREDIT_COST,
      },
      { status }
    );
  }

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
    creditsLeft: deducted.remainingCredits,
  });
}
