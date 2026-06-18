import { randomUUID } from "crypto";

import { NextRequest, NextResponse } from "next/server";
import { generateCharacterImage } from "@/lib/character-image-fal";
import {
  createGenerationRecord,
  ingestImageGeneratorAssets,
} from "@/lib/generation-assets";
import { configureFalClient, getFalKey, logFalAiError } from "@/lib/fal-image";
import { getOwnedCharacter, updateCharacter } from "@/lib/ki-influencer-db";
import {
  KI_INFLUENCER_TRAINING_SET_CREDITS,
  KI_INFLUENCER_TRAINING_SET_SIZE,
  KI_INFLUENCER_TRAINING_VARIATIONS,
} from "@/lib/ki-influencer-config";
import { developmentWriteGuardResponse } from "@/lib/environment-safety.server";
import {
  assertKiInfluencerAccess,
  deductKiInfluencerCredits,
  kiInfluencerErrorResponse,
  logKiInfluencerError,
} from "@/lib/ki-influencer-api";

export const dynamic = "force-dynamic";

export const maxDuration = 120;

configureFalClient();

function protectedImageUrl(generationId: string) {
  return `/api/generated-image/${generationId}?variant=preview`;
}

export async function POST(request: NextRequest) {
  const writeGuard = developmentWriteGuardResponse();
  if (writeGuard) return writeGuard;

  const body = (await request.json()) as {
    characterId?: string;
    start?: boolean;
    index?: number;
  };

  const characterId = body.characterId?.trim() ?? "";
  if (!characterId) {
    console.log("[ki-influencer] training-set", "validate", "error", {
      reason: "missing characterId",
    });
    return NextResponse.json(
      { success: false, error: "characterId erforderlich." },
      { status: 400 }
    );
  }

  if (!getFalKey()) {
    console.log("[ki-influencer] training-set", "config", "error");
    return NextResponse.json(
      { success: false, error: "Charakter-Generierung ist nicht konfiguriert." },
      { status: 503 }
    );
  }

  const access = await assertKiInfluencerAccess(
    body.start === true ? KI_INFLUENCER_TRAINING_SET_CREDITS : 0
  );
  if (access instanceof NextResponse) return access;
  const { userId, supabase, isAdmin } = access;

  const character = await getOwnedCharacter(supabase, characterId, userId);
  if (!character) {
    console.log("[ki-influencer] training-set", "load", "error", { characterId });
    return NextResponse.json(
      { success: false, error: "Charakter nicht gefunden." },
      { status: 404 }
    );
  }
  if (character.status !== "casting_confirmed" && character.status !== "training_set") {
    console.log("[ki-influencer] training-set", "status", "error", {
      characterId,
      status: character.status,
    });
    return NextResponse.json(
      { success: false, error: "Bitte zuerst das Casting-Bild bestätigen." },
      { status: 400 }
    );
  }
  if (!character.casting_image_url) {
    console.log("[ki-influencer] training-set", "casting", "error", { characterId });
    return NextResponse.json(
      { success: false, error: "Casting-Bild fehlt." },
      { status: 400 }
    );
  }

  if (body.start === true) {
    console.log("[ki-influencer] training-set", "start", "running", { characterId });

    const characterSetId = randomUUID();
    const deduction = await deductKiInfluencerCredits(
      supabase,
      userId,
      KI_INFLUENCER_TRAINING_SET_CREDITS,
      "KI-Influencer — Trainingsset (20 Bilder)",
      {
        isAdmin,
        meta: {
          generationType: "image",
          prompt: `${character.name} training set`.slice(0, 500),
          skipGenerationLog: true,
        },
      }
    );

    if (!deduction.success) {
      console.log("[ki-influencer] training-set", "start", "error", {
        characterId,
        reason: "insufficient_credits",
      });
      return kiInfluencerErrorResponse("insufficient_credits", 402, undefined, {
        credits: deduction.remainingCredits,
        required: KI_INFLUENCER_TRAINING_SET_CREDITS,
      });
    }

    await updateCharacter(supabase, characterId, userId, {
      character_set_id: characterSetId,
      status: "training_set",
    });

    console.log("[ki-influencer] training-set", "start", "ok", {
      characterId,
      characterSetId,
      total: KI_INFLUENCER_TRAINING_SET_SIZE,
    });

    return NextResponse.json({
      success: true,
      characterId,
      characterSetId,
      total: KI_INFLUENCER_TRAINING_SET_SIZE,
      creditsUsed: isAdmin ? 0 : KI_INFLUENCER_TRAINING_SET_CREDITS,
      creditsLeft: deduction.remainingCredits,
    });
  }

  const index = body.index;
  if (typeof index !== "number" || index < 0 || index >= KI_INFLUENCER_TRAINING_SET_SIZE) {
    console.log("[ki-influencer] training-set", "index", "error", { index });
    return NextResponse.json(
      {
        success: false,
        error: `index muss 0–${KI_INFLUENCER_TRAINING_SET_SIZE - 1} sein.`,
      },
      { status: 400 }
    );
  }

  if (!character.character_set_id) {
    console.log("[ki-influencer] training-set", `image-${index}`, "error", {
      reason: "missing character_set_id",
    });
    return NextResponse.json(
      { success: false, error: "Trainingsset zuerst starten (start: true)." },
      { status: 400 }
    );
  }

  console.log("[ki-influencer] training-set", `image-${index}`, "running", {
    characterId,
  });

  const variationPrompt = KI_INFLUENCER_TRAINING_VARIATIONS[index];
  const scenePrompt = `${character.description ?? character.name}. ${variationPrompt}`;

  try {
    const falResult = await generateCharacterImage({
      referenceImageUrls: [character.casting_image_url],
      userPrompt: scenePrompt,
      styleId: "editorial",
      platform: "universal",
    });

    if (!falResult.ok) {
      logKiInfluencerError(`training-set index ${index}`, falResult.error);
      console.log("[ki-influencer] training-set", `image-${index}`, "error", {
        reason: "fal",
      });
      return kiInfluencerErrorResponse("generation_failed", 500, falResult.error);
    }

    const generationId = randomUUID();
    const started = Date.now();
    const { previewPath, sourcePath, width, height } =
      await ingestImageGeneratorAssets(userId, generationId, falResult.url);

    await createGenerationRecord(
      supabase,
      userId,
      "image",
      {
        paid: false,
        downloadPaid: false,
        mode: "preview",
        assetKind: "image",
        category: "portrait",
        model: falResult.model,
        width: width ?? falResult.width,
        height: height ?? falResult.height,
        generationTimeMs: Date.now() - started,
        previewPath,
        sourcePath,
        source: "character_set",
        character_set_id: character.character_set_id,
        character_id: characterId,
        referenceGenerationIds: character.casting_generation_id
          ? [character.casting_generation_id]
          : undefined,
      },
      0,
      scenePrompt.slice(0, 500),
      generationId
    );

    const isLast = index === KI_INFLUENCER_TRAINING_SET_SIZE - 1;
    if (isLast) {
      await updateCharacter(supabase, characterId, userId, {
        status: "training_set_ready",
      });
    }

    console.log("[ki-influencer] training-set", `image-${index}`, "ok", {
      characterId,
      generationId,
      done: isLast,
    });

    return NextResponse.json({
      success: true,
      characterId,
      index,
      total: KI_INFLUENCER_TRAINING_SET_SIZE,
      generationId,
      imageUrl: protectedImageUrl(generationId),
      done: isLast,
      status: isLast ? "training_set_ready" : "training_set",
    });
  } catch (error) {
    logFalAiError(error);
    logKiInfluencerError(`training-set index ${index}`, error);
    console.log("[ki-influencer] training-set", `image-${index}`, "error", {
      reason: "exception",
    });
    const detail = error instanceof Error ? error.message : undefined;
    return kiInfluencerErrorResponse("generation_failed", 500, detail);
  }
}
