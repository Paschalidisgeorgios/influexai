import { NextRequest, NextResponse } from "next/server";
import { assertGatedFeature } from "@/lib/access.server";
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
import {
  assertKiInfluencerAccess,
  deductKiInfluencerCredits,
  kiInfluencerErrorResponse,
  logKiInfluencerError,
  mapSupabaseWriteError,
} from "@/lib/ki-influencer-api";

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

  const steps = KI_INFLUENCER_LORA_STEPS;
  const creditCost = calcLoraCredits(steps);

  const access = await assertKiInfluencerAccess(creditCost);
  if (access instanceof NextResponse) return access;
  const { userId, supabase, isAdmin } = access;

  const character = await getOwnedCharacter(supabase, characterId, userId);
  if (!character) {
    return NextResponse.json({ error: "Charakter nicht gefunden." }, { status: 404 });
  }
  if (character.status !== "training_set_ready" && character.status !== "training") {
    return NextResponse.json(
      { error: "Fotos müssen vollständig sein, bevor der Charakter lernen kann." },
      { status: 400 }
    );
  }

  const isUploaded = character.source === "uploaded";

  if (!isUploaded && !character.character_set_id) {
    return NextResponse.json({ error: "character_set_id fehlt." }, { status: 400 });
  }

  if (isUploaded && !character.upload_zip_url) {
    return NextResponse.json(
      { error: "Upload-Daten fehlen — bitte Fotos erneut hochladen." },
      { status: 400 }
    );
  }

  if (character.lora_id && character.status === "training") {
    return NextResponse.json({
      success: true,
      characterId,
      loraId: character.lora_id,
      status: "training",
    });
  }

  const sessionId =
    (isUploaded && character.upload_session_id) || crypto.randomUUID();
  const suffix = characterId.replace(/-/g, "").slice(0, 4).toUpperCase();
  const triggerWord = `${KI_INFLUENCER_DEFAULT_TRIGGER}_${suffix}`;

  try {
    let zipUrl: string;
    let thumbnailPath: string;
    let imageCount: number;

    if (isUploaded) {
      zipUrl = character.upload_zip_url!;
      thumbnailPath = character.casting_image_url ?? "";
      imageCount = character.upload_image_count ?? 10;
    } else {
      const generationIds = await listTrainingSetGenerationIds(
        supabase,
        userId,
        character.character_set_id!
      );

      if (generationIds.length < 10) {
        return NextResponse.json(
          {
            error: `Nur ${generationIds.length} Trainingsbilder gefunden — mindestens 10 erforderlich.`,
          },
          { status: 400 }
        );
      }

      const built = await buildLoraZipFromGenerationIds(
        supabase,
        userId,
        generationIds,
        sessionId
      );
      zipUrl = built.zipUrl;
      thumbnailPath = built.thumbnailPath;
      imageCount = built.imageCount;
    }

    const { data: loraRow, error: insertErr } = await supabase
      .from("lora_models")
      .insert({
        user_id: userId,
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
      if (insertErr) {
        return mapSupabaseWriteError("lora_models insert", insertErr);
      }
      return kiInfluencerErrorResponse("generation_failed", 500);
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

    const deduction = await deductKiInfluencerCredits(
      supabase,
      userId,
      creditCost,
      `KI-Influencer LoRA — ${character.name}`,
      {
        isAdmin,
        meta: {
          generationType: "lora_training",
          prompt: character.name.slice(0, 500),
          skipGenerationLog: true,
        },
      }
    );

    if (!deduction.success) {
      await supabase
        .from("lora_models")
        .update({ status: "failed", error_message: "Credit deduction failed" })
        .eq("id", loraId);
      return kiInfluencerErrorResponse("insufficient_credits", 402, undefined, {
        credits: deduction.remainingCredits,
        required: creditCost,
      });
    }

    await supabase
      .from("lora_models")
      .update({ credits_used: isAdmin ? 0 : creditCost })
      .eq("id", loraId);

    await updateCharacter(supabase, characterId, userId, {
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
      creditsUsed: isAdmin ? 0 : creditCost,
      creditsLeft: deduction.remainingCredits,
      estimatedMinutes: "10–15",
    });
  } catch (error) {
    logKiInfluencerError("train", error);
    const detail = error instanceof Error ? error.message : undefined;
    return kiInfluencerErrorResponse("generation_failed", 500, detail);
  }
}
