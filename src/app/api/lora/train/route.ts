import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { deductCredits, hasEnoughCredits } from "@/lib/credits";
import { calcLoraCredits } from "@/lib/lora-credits";
import {
  LORA_STEPS_DEFAULT,
  LORA_STEPS_MAX,
  LORA_STEPS_MIN,
  LORA_TYPE_META,
  type LoraModelType,
} from "@/lib/lora-config";
import { submitLoraTraining } from "@/lib/lora-fal";
import { assertGatedFeature } from "@/lib/access.server";

export const dynamic = "force-dynamic";

export const maxDuration = 30;

function isValidType(t: string): t is LoraModelType {
  return t in LORA_TYPE_META;
}

export async function POST(request: NextRequest) {
  const denied = await assertGatedFeature("lora-training");
  if (denied) return denied;

  let body: {
    name?: string;
    triggerWord?: string;
    type?: string;
    zipUrl?: string;
    sessionId?: string;
    thumbnailPath?: string;
    imageCount?: number;
    steps?: number;
    isStyle?: boolean;
    consentAccepted?: boolean;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = body.name?.trim() ?? "";
  const triggerWord = body.triggerWord?.trim().toUpperCase() ?? "";
  const type = body.type ?? "portrait";
  const zipUrl = body.zipUrl?.trim() ?? "";
  const sessionId = body.sessionId?.trim() ?? "";
  const thumbnailPath = body.thumbnailPath?.trim() ?? null;
  const imageCount = body.imageCount ?? 0;
  const steps = body.steps ?? LORA_STEPS_DEFAULT;
  const isStyle =
    body.isStyle ?? (isValidType(type) ? LORA_TYPE_META[type].defaultIsStyle : false);

  if (!name || !triggerWord || !zipUrl || !sessionId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (!isValidType(type)) {
    return NextResponse.json({ error: "Invalid training type" }, { status: 400 });
  }
  if (steps < LORA_STEPS_MIN || steps > LORA_STEPS_MAX) {
    return NextResponse.json(
      { error: `Steps must be between ${LORA_STEPS_MIN} and ${LORA_STEPS_MAX}` },
      { status: 400 }
    );
  }
  if (!/^[A-Z][A-Z0-9_]{2,19}$/.test(triggerWord)) {
    return NextResponse.json(
      { error: "Trigger word: 3–20 chars, uppercase letters/numbers/underscore" },
      { status: 400 }
    );
  }

  if (body.consentAccepted !== true) {
    return NextResponse.json(
      {
        error:
          "Bitte bestätige die Einwilligung, bevor die KI-Verarbeitung startet.",
        code: "CONSENT_REQUIRED",
      },
      { status: 400 }
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const creditCost = calcLoraCredits(steps);
  const creditCheck = await hasEnoughCredits(supabase, user.id, creditCost);
  if (!creditCheck.ok) {
    return NextResponse.json(
      { error: "Not enough credits", credits: creditCheck.credits },
      { status: 402 }
    );
  }

  const { data: loraRow, error: insertErr } = await supabase
    .from("lora_models")
    .insert({
      user_id: user.id,
      name,
      trigger_word: triggerWord,
      type,
      status: "training",
      thumbnail_url: thumbnailPath,
      training_images_count: imageCount,
      steps,
      session_id: sessionId,
      is_style: isStyle,
      progress: 0,
    })
    .select("id")
    .single();

  if (insertErr || !loraRow?.id) {
    console.error("lora train insert:", insertErr?.message);
    return NextResponse.json({ error: "Could not create model record" }, { status: 500 });
  }

  const loraId = loraRow.id as string;

  try {
    const { requestId, endpoint } = await submitLoraTraining({
      type,
      zipUrl,
      triggerWord,
      steps,
      isStyle,
    });

    await supabase
      .from("lora_models")
      .update({ fal_request_id: requestId })
      .eq("id", loraId)
      .eq("user_id", user.id);

    const deduction = await deductCredits(
      supabase,
      user.id,
      creditCost,
      `LoRA Training — ${type}`,
      {
        generationType: "lora_training",
        prompt: name.slice(0, 500),
        skipGenerationLog: true,
      }
    );

    if (!deduction.success) {
      await supabase
        .from("lora_models")
        .update({ status: "failed", error_message: "Credit deduction failed" })
        .eq("id", loraId);
      return NextResponse.json(
        { error: deduction.error ?? "Not enough credits" },
        { status: 402 }
      );
    }

    await supabase
      .from("lora_models")
      .update({ credits_used: creditCost })
      .eq("id", loraId);

    return NextResponse.json({
      success: true,
      loraId,
      requestId,
      endpoint,
      status: "training",
      creditsUsed: creditCost,
      creditsLeft: deduction.remainingCredits,
      estimatedMinutes: "10–15",
    });
  } catch (error) {
    console.error("lora train submit:", error);
    await supabase
      .from("lora_models")
      .update({
        status: "failed",
        error_message: error instanceof Error ? error.message : "Submit failed",
      })
      .eq("id", loraId);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Training could not be started",
      },
      { status: 500 }
    );
  }
}
