import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { deductCredits, hasEnoughCredits } from "@/lib/credits";
import { withPlanGuard } from "@/lib/guards/apiGuard";
import { createAnthropicMessage } from "@/lib/anthropic";
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

  const guardError = await withPlanGuard(user.id);
  if (guardError) return guardError;

  const creditCheck = await hasEnoughCredits(
    supabase,
    user.id,
    VIRAL_HOOK_EXTRACTOR_CREDIT_COST
  );
  if (!creditCheck.ok) {
    return NextResponse.json(
      {
        success: false,
        error: "Nicht genug Credits.",
        credits: creditCheck.credits,
        required: VIRAL_HOOK_EXTRACTOR_CREDIT_COST,
      },
      { status: 402 }
    );
  }

  const claude = await createAnthropicMessage({
    system: VIRAL_HOOK_EXTRACTOR_SYSTEM_PROMPT,
    user: buildViralHookExtractorUserPrompt(input),
    maxTokens: 1536,
  });

  if (!claude.ok) {
    return NextResponse.json(
      { success: false, error: claude.error },
      { status: 503 }
    );
  }

  let hooks: string[];
  try {
    hooks = parseViralHookExtractorResult(claude.text);
  } catch (e) {
    console.error("[viral-hook] parse:", e);
    return NextResponse.json(
      { success: false, error: "KI-Antwort konnte nicht gelesen werden." },
      { status: 500 }
    );
  }

  const promptSummary = input.slice(0, 200);

  const deducted = await deductCredits(
    supabase,
    user.id,
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
    user_id: user.id,
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
