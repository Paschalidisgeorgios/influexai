import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

import { assertKiToolAccess } from "@/lib/access.server";
import { getAnthropicConfigError, logAnthropicFailure, mapAnthropicSdkError } from "@/lib/anthropic";
import { addCredits, deductCredits } from "@/lib/credits";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  buildPremiumGeneratePayload,
  buildPremiumGenerateUserPrompt,
  CLAUDE_PREMIUM_MODEL,
  CLAUDE_PREMIUM_SYSTEM_PROMPT,
  parsePremiumScriptFromClaude,
  PREMIUM_GENERATE_CREDIT_COST,
  type PremiumGenerateRequest,
} from "@/lib/claude-premium-generate";

export const dynamic = "force-dynamic";
export const maxDuration = 90;

type RequestBody = {
  topic?: string;
  thema?: string;
  trend_thema?: string;
  platform?: string;
  plattform?: string;
  videoLength?: string;
  video_laenge?: string;
  scriptInput?: string;
  script_input?: string;
  niche?: string;
  nische?: string;
  targetAudience?: string;
  zielgruppe?: string;
  tone?: string;
  toolId?: string;
};

function resolveTopic(body: RequestBody): string {
  return (
    body.topic?.trim() ||
    body.trend_thema?.trim() ||
    body.thema?.trim() ||
    ""
  );
}

function mapSdkError(err: unknown): { status: number; message: string } {
  return mapAnthropicSdkError(err, CLAUDE_PREMIUM_MODEL);
}

async function refundPremiumCredits(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string
) {
  await addCredits(supabase, userId, PREMIUM_GENERATE_CREDIT_COST, "Premium-Script Refund");
}

export async function POST(request: Request) {
  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json(
      { success: false, error: "Ungültiger JSON-Body." },
      { status: 400 }
    );
  }

  const topic = resolveTopic(body);
  if (!topic) {
    return NextResponse.json(
      { success: false, error: "Bitte gib ein Thema oder Trend-Thema an." },
      { status: 400 }
    );
  }

  const configError = getAnthropicConfigError();
  if (configError) {
    return NextResponse.json({ success: false, error: configError }, { status: 503 });
  }

  const access = await assertKiToolAccess(PREMIUM_GENERATE_CREDIT_COST);
  if (access instanceof NextResponse) return access;
  const { userId, supabase } = access;

  const generateInput: PremiumGenerateRequest = {
    topic,
    platform: body.platform?.trim() || body.plattform?.trim() || "TikTok",
    videoLength: body.videoLength?.trim() || body.video_laenge?.trim() || "60s",
    scriptInput: body.scriptInput?.trim() || body.script_input?.trim(),
    niche: body.niche?.trim() || body.nische?.trim(),
    targetAudience: body.targetAudience?.trim() || body.zielgruppe?.trim(),
    tone: body.tone?.trim(),
  };

  const promptSummary = `${topic} · ${generateInput.platform}`.slice(0, 200);

  const deducted = await deductCredits(
    supabase,
    userId,
    PREMIUM_GENERATE_CREDIT_COST,
    "Premium Script + B-Roll",
    {
      generationType: "premium-script",
      skipGenerationLog: true,
      prompt: promptSummary,
    }
  );

  if (!deducted.success) {
    const status = deducted.error === "Nicht genug Credits." ? 402 : 500;
    return NextResponse.json(
      {
        success: false,
        error: deducted.error ?? "Credits konnten nicht abgezogen werden.",
        credits: deducted.remainingCredits,
        required: PREMIUM_GENERATE_CREDIT_COST,
      },
      { status }
    );
  }

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY!.trim(),
  });

  let payload;
  try {
    const message = await anthropic.messages.create({
      model: CLAUDE_PREMIUM_MODEL,
      max_tokens: 4096,
      temperature: 0.65,
      system: CLAUDE_PREMIUM_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: buildPremiumGenerateUserPrompt(generateInput),
        },
      ],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    const rawText = textBlock?.type === "text" ? textBlock.text : "";

    if (!rawText.trim()) {
      throw new Error("Leere Claude-Antwort.");
    }

    const premiumScript = parsePremiumScriptFromClaude(rawText);
    payload = buildPremiumGeneratePayload(premiumScript);
  } catch (err) {
    logAnthropicFailure("api/generate", CLAUDE_PREMIUM_MODEL, err);
    await refundPremiumCredits(supabase, userId);
    const mapped = mapSdkError(err);
    return NextResponse.json(
      { success: false, error: mapped.message },
      { status: mapped.status }
    );
  }

  const { error: genErr } = await supabase.from("generations").insert({
    user_id: userId,
    type: "premium-script",
    prompt: promptSummary,
    credits_used: PREMIUM_GENERATE_CREDIT_COST,
    result: {
      script: payload.formattedScript,
      premiumScript: payload.premiumScript,
      brollSegments: payload.brollSegments,
    },
  });

  if (genErr) {
    console.error("[api/generate] generations insert:", genErr.message);
  }

  return NextResponse.json({
    success: true,
    text: payload.formattedScript,
    script: payload.formattedScript,
    data: {
      premiumScript: payload.premiumScript,
      brollSegments: payload.brollSegments,
      source: "claude-premium",
    },
    creditsLeft: deducted.remainingCredits,
    model: CLAUDE_PREMIUM_MODEL,
  });
}
