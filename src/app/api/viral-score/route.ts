import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { deductCredits, hasEnoughCredits } from "@/lib/credits";
import { createAnthropicMessage } from "@/lib/anthropic";
import { logGeneration } from "@/lib/activity-log";
import { invalidateUserGenerations } from "@/lib/cache";
import {
  buildViralScoreUserPrompt,
  parseViralScoreResult,
  VIRAL_SCORE_CREDIT_COST,
  VIRAL_SCORE_SYSTEM_PROMPT,
  type ViralScoreResult,
} from "@/lib/viral-score";

export const maxDuration = 60;

type RequestBody = {
  script?: string;
  thumbnail_idea?: string;
  niche?: string;
  language?: string;
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

  const script = body.script?.trim() ?? "";
  const thumbnailIdea = body.thumbnail_idea?.trim() ?? "";
  const niche = body.niche?.trim() ?? "";

  if (!script || script.length < 20) {
    return NextResponse.json(
      { success: false, error: "Bitte gib ein Script mit mindestens 20 Zeichen ein." },
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

  const userPrompt = buildViralScoreUserPrompt({
    script,
    thumbnail_idea: thumbnailIdea,
    niche,
    language: body.language ?? "de",
  });

  const claude = await createAnthropicMessage({
    system: VIRAL_SCORE_SYSTEM_PROMPT,
    user: userPrompt,
    maxTokens: 1536,
    model: "claude-opus-4-5",
  });

  if (!claude.ok) {
    return NextResponse.json(
      { success: false, error: claude.error },
      { status: 503 }
    );
  }

  let score: ViralScoreResult;
  try {
    score = parseViralScoreResult(claude.text);
  } catch (e) {
    console.error("[viral-score] parse:", e);
    return NextResponse.json(
      { success: false, error: "KI-Antwort konnte nicht gelesen werden." },
      { status: 500 }
    );
  }

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("credits")
    .eq("id", user.id)
    .single();

  if (profileErr || !profile) {
    return NextResponse.json(
      { success: false, error: "Profil nicht gefunden." },
      { status: 500 }
    );
  }

  const previousCredits = profile.credits ?? 0;
  if (previousCredits < VIRAL_SCORE_CREDIT_COST) {
    return NextResponse.json(
      {
        success: false,
        error: "Nicht genug Credits.",
        credits: previousCredits,
        required: VIRAL_SCORE_CREDIT_COST,
      },
      { status: 402 }
    );
  }

  const remainingCredits = previousCredits - VIRAL_SCORE_CREDIT_COST;
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ credits: remainingCredits })
    .eq("id", user.id);

  if (updateError) {
    console.error("[viral-score] credits update:", updateError.message);
    return NextResponse.json(
      { success: false, error: "Credits konnten nicht abgezogen werden." },
      { status: 500 }
    );
  }

  const promptSummary = `${niche} · ${script.slice(0, 120)}`;

  const { error: genErr } = await supabase.from("generations").insert({
    user_id: user.id,
    type: "viral_score",
    prompt: promptSummary,
    credits_used: VIRAL_SCORE_CREDIT_COST,
    result: score,
  });

  if (genErr) {
    console.error("[viral-score] generations insert:", genErr.message);
    await logGeneration(supabase, user.id, {
      type: "viral_score",
      prompt: promptSummary,
      creditsUsed: VIRAL_SCORE_CREDIT_COST,
    });
  }

  await supabase.from("credit_transactions").insert({
    user_id: user.id,
    amount: -VIRAL_SCORE_CREDIT_COST,
    description: "viral_score",
  });

  invalidateUserGenerations(user.id);

  return NextResponse.json({
    success: true,
    score,
    creditsLeft: remainingCredits,
  });
}
