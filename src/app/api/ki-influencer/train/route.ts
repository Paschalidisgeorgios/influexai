import { NextRequest, NextResponse } from "next/server";
import { assertGatedFeature } from "@/lib/access.server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { deductCredits, hasEnoughCredits } from "@/lib/credits";
import { calcLoraCredits } from "@/lib/lora-credits";
import {
  KI_INFLUENCER_DEFAULT_TRIGGER,
  KI_INFLUENCER_LORA_STEPS,
} from "@/lib/ki-influencer-config";
import {
  getOwnedCharacter,
  listTrainingSetGenerationIds,
  updateCharacter,
} from "@/lib/ki-influencer-db";
import { buildLoraZipFromGenerationIds } from "@/lib/ki-influencer-lora-upload";
import { submitLoraTraining } from "@/lib/lora-fal";

export const dynamic = "force-dynamic";

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  const denied = await assertGatedFeature("lora-training");
  if (denied) return denied;

  const body = (await request.json()) as {
    characterId?: string;
    consentAccepted?: boolean;
  };

  const characterId = body.characterId?.trim() ?? "";
  if (!characterId) {
    return NextResponse.json({ error: "characterId erforderlich." }, { status: 400 });
  }

  if (body.consentAccepted !== true) {
    return NextResponse.json(
      {
        error: "Bitte bestätige die Einwilligung vor dem Training.",
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
    return NextResponse.json({ error: "Nicht eingeloggt." }, { status: 401 });
  }

  const character = await getOwnedCharacter(supabase, characterId, user.id);
  if (!character) {
    return NextResponse.json({ error: "Charakter nicht gefunden." }, { status: 404 });
  }
  if (character.status !== "training_set_ready" && character.status !== "training") {
    return NextResponse.json(
      { error: "Trainingsset muss vollständig sein (20/20)." },
      { status: 400 }
    );
  }
  if (!character.character_set_id) {
    return NextResponse.json({ error: "character_set_id fehlt." }, { status: 400 });
  }

  if (character.lora_id && character.status === "training") {
    return NextResponse.json({
      success: true,
      characterId,
      loraId: character.lora_id,
      status: "training",
    });
  }

  const generationIds = await listTrainingSetGenerationIds(
    supabase,
    user.id,
    character.character_set_id
  );

  if (generationIds.length < 10) {
    return NextResponse.json(
      {
        error: `Nur ${generationIds.length} Trainingsbilder gefunden — mindestens 10 erforderlich.`,
      },
      { status: 400 }
    );
  }

  const steps = KI_INFLUENCER_LORA_STEPS;
  const creditCost = calcLoraCredits(steps);
  const creditCheck = await hasEnoughCredits(supabase, user.id, creditCost);
  if (!creditCheck.ok) {
    return NextResponse.json(
      { error: "Nicht genug Credits.", credits: creditCheck.credits },
      { status: 402 }
    );
  }

  const sessionId = crypto.randomUUID();
  const suffix = characterId.replace(/-/g, "").slice(0, 4).toUpperCase();
  const triggerWord = `${KI_INFLUENCER_DEFAULT_TRIGGER}_${suffix}`;

  try {
    const { zipUrl, thumbnailPath, imageCount } = await buildLoraZipFromGenerationIds(
      supabase,
      user.id,
      generationIds,
      sessionId
    );

    const { data: loraRow, error: insertErr } = await supabase
      .from("lora_models")
      .insert({
        user_id: user.id,
        name: `KI-Influencer: ${character.name}`,
        trigger_word: triggerWord,
        type: "character",
        status: "training",
        thumbnail_url: thumbnailPath,
        training_images_count: imageCount,
        steps,
        session_id: sessionId,
        is_style: false,
        progress: 0,
      })
      .select("id")
      .single();

    if (insertErr || !loraRow?.id) {
      return NextResponse.json(
        { error: "LoRA-Datensatz konnte nicht erstellt werden." },
        { status: 500 }
      );
    }

    const loraId = loraRow.id as string;
    const { requestId, endpoint } = await submitLoraTraining({
      type: "character",
      zipUrl,
      triggerWord,
      steps,
      isStyle: false,
    });

    await supabase
      .from("lora_models")
      .update({ fal_request_id: requestId })
      .eq("id", loraId);

    const deduction = await deductCredits(
      supabase,
      user.id,
      creditCost,
      `KI-Influencer LoRA — ${character.name}`,
      {
        generationType: "lora_training",
        prompt: character.name.slice(0, 500),
        skipGenerationLog: true,
      }
    );

    if (!deduction.success) {
      await supabase
        .from("lora_models")
        .update({ status: "failed", error_message: "Credit deduction failed" })
        .eq("id", loraId);
      return NextResponse.json(
        { error: deduction.error ?? "Nicht genug Credits" },
        { status: 402 }
      );
    }

    await supabase
      .from("lora_models")
      .update({ credits_used: creditCost })
      .eq("id", loraId);

    await updateCharacter(supabase, characterId, user.id, {
      lora_id: loraId,
      trigger_word: triggerWord,
      status: "training",
    });

    return NextResponse.json({
      success: true,
      characterId,
      loraId,
      requestId,
      endpoint,
      triggerWord,
      status: "training",
      creditsUsed: creditCost,
      creditsLeft: deduction.remainingCredits,
      estimatedMinutes: "10–15",
    });
  } catch (error) {
    console.error("ki-influencer train:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Training konnte nicht gestartet werden.",
      },
      { status: 500 }
    );
  }
}
