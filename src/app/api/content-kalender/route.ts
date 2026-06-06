import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { deductCredits, hasEnoughCredits } from "@/lib/credits";
import { createAnthropicMessage } from "@/lib/anthropic";
import {
  buildContentKalenderToolUserPrompt,
  CONTENT_KALENDER_PLATFORMS,
  CONTENT_KALENDER_TOOL_CREDIT_COST,
  CONTENT_KALENDER_TOOL_SYSTEM_PROMPT,
  isValidContentKalenderFrequency,
  parseContentKalenderToolResult,
  type ContentKalenderEntry,
} from "@/lib/content-kalender-tool";

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
    CONTENT_KALENDER_TOOL_CREDIT_COST
  );
  if (!creditCheck.ok) {
    return NextResponse.json(
      {
        success: false,
        error: "Nicht genug Credits.",
        credits: creditCheck.credits,
        required: CONTENT_KALENDER_TOOL_CREDIT_COST,
      },
      { status: 402 }
    );
  }

  const claude = await createAnthropicMessage({
    system: CONTENT_KALENDER_TOOL_SYSTEM_PROMPT,
    user: buildContentKalenderToolUserPrompt({
      nische,
      plattform,
      frequenz,
    }),
    maxTokens: 4096,
  });

  if (!claude.ok) {
    return NextResponse.json(
      { success: false, error: claude.error },
      { status: 503 }
    );
  }

  let entries: ContentKalenderEntry[];
  try {
    entries = parseContentKalenderToolResult(claude.text);
  } catch (e) {
    console.error("[content-kalender] parse:", e);
    return NextResponse.json(
      { success: false, error: "KI-Antwort konnte nicht gelesen werden." },
      { status: 500 }
    );
  }

  const promptSummary = `${nische} · ${plattform} · ${frequenz}`.slice(0, 200);

  const deducted = await deductCredits(
    supabase,
    user.id,
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
    user_id: user.id,
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
