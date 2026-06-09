import { NextResponse } from "next/server";

import { assertKiToolAccess } from "@/lib/access.server";
import { addCredits, deductCredits } from "@/lib/credits";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAnthropicMessage } from "@/lib/anthropic";
import { selectOutputWithQualityRetry } from "@/lib/agent/qualityScoring";
import { fetchTrendingVideos } from "@/lib/youtube";
import {
  buildTrendScriptToolUserPrompt,
  isValidTrendScriptPlatform,
  isValidTrendScriptRegion,
  parseTrendScriptToolResult,
  TREND_SCRIPT_TOOL_CREDIT_COST,
  TREND_SCRIPT_TOOL_SYSTEM_PROMPT,
  trendVideosToSources,
} from "@/lib/trend-script-tool";

export const dynamic = "force-dynamic";

export const maxDuration = 90;

type RequestBody = {
  thema?: string;
  plattform?: string;
  region?: string;
};

async function refundTrendScriptCredits(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string
) {
  await addCredits(
    supabase,
    userId,
    TREND_SCRIPT_TOOL_CREDIT_COST,
    "Trend→Script Refund"
  );
}

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

  const thema = body.thema?.trim() ?? "";
  const plattform = body.plattform?.trim() ?? "";
  const region = body.region?.trim() || "DE";

  if (!thema) {
    return NextResponse.json(
      { success: false, error: "Bitte gib ein Thema oder eine Nische ein." },
      { status: 400 }
    );
  }

  if (!isValidTrendScriptPlatform(plattform)) {
    return NextResponse.json(
      { success: false, error: "Bitte wähle eine gültige Plattform." },
      { status: 400 }
    );
  }

  if (!isValidTrendScriptRegion(region)) {
    return NextResponse.json(
      { success: false, error: "Bitte wähle eine gültige Region." },
      { status: 400 }
    );
  }

  const access = await assertKiToolAccess(TREND_SCRIPT_TOOL_CREDIT_COST);
  if (access instanceof NextResponse) return access;
  const { userId, supabase } = access;

  let trends;
  try {
    trends = await fetchTrendingVideos(thema, region);
  } catch (e) {
    console.error("[trend-script] youtube:", e);
    const message =
      e instanceof Error && e.message.includes("YOUTUBE_API_KEY")
        ? "YouTube API ist nicht konfiguriert."
        : "YouTube-Trends konnten nicht geladen werden.";
    return NextResponse.json({ success: false, error: message }, { status: 503 });
  }

  if (trends.length === 0) {
    return NextResponse.json(
      { success: false, error: "Keine Trends gefunden." },
      { status: 404 }
    );
  }

  const sources = trendVideosToSources(trends);
  const promptSummary = `${thema} · ${plattform} · ${region}`.slice(0, 200);

  const deducted = await deductCredits(
    supabase,
    userId,
    TREND_SCRIPT_TOOL_CREDIT_COST,
    "Trend→Script",
    {
      generationType: "trend-script-tool",
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
        required: TREND_SCRIPT_TOOL_CREDIT_COST,
      },
      { status }
    );
  }

  const trendParams = { thema, plattform, trends };

  async function generateScript(retryHint?: string): Promise<string> {
    const claude = await createAnthropicMessage({
      system: TREND_SCRIPT_TOOL_SYSTEM_PROMPT,
      user: buildTrendScriptToolUserPrompt(trendParams, retryHint),
      maxTokens: 4096,
    });

    if (!claude.ok) {
      throw new Error(claude.error);
    }

    return parseTrendScriptToolResult(claude.text);
  }

  let script: string;
  try {
    const picked = await selectOutputWithQualityRetry({
      toolName: "trend-script",
      userGoal: `${thema} · ${plattform}`,
      toOutputText: (value) => value,
      generate: generateScript,
    });
    script = picked.value;
  } catch (e) {
    console.error("[trend-script] generate:", e);
    await refundTrendScriptCredits(supabase, userId);
    return NextResponse.json(
      {
        success: false,
        error:
          e instanceof Error ? e.message : "KI-Antwort konnte nicht gelesen werden.",
      },
      { status: 500 }
    );
  }

  const { error: genErr } = await supabase.from("generations").insert({
    user_id: userId,
    type: "trend-script-tool",
    prompt: promptSummary,
    credits_used: TREND_SCRIPT_TOOL_CREDIT_COST,
    result: { script, sources },
  });

  if (genErr) {
    console.error("[trend-script] generations insert:", genErr.message);
  }

  return NextResponse.json({
    success: true,
    script,
    sources,
    creditsLeft: deducted.remainingCredits,
  });
}
