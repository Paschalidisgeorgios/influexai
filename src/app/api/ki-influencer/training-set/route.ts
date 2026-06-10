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
  const body = (await request.json()) as {
    characterId?: string;
    start?: boolean;
    index?: number;
  };

  const characterId = body.characterId?.trim() ?? "";
  if (!characterId) {
    return NextResponse.json({ error: "characterId erforderlich." }, { status: 400 });
  }

  if (!getFalKey()) {
    return NextResponse.json(
      { error: "Charakter-Generierung ist nicht konfiguriert." },
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
    return NextResponse.json({ error: "Charakter nicht gefunden." }, { status: 404 });
  }
  if (character.status !== "casting_confirmed" && character.status !== "training_set") {
    return NextResponse.json(
      { error: "Bitte zuerst das Casting-Bild bestätigen." },
      { status: 400 }
    );
  }
  if (!character.casting_image_url) {
    return NextResponse.json(
      { error: "Casting-Bild fehlt." },
      { status: 400 }
    );
  }

  if (body.start === true) {
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
      return kiInfluencerErrorResponse("insufficient_credits", 402, undefined, {
        credits: deduction.remainingCredits,
        required: KI_INFLUENCER_TRAINING_SET_CREDITS,
      });
    }

    await updateCharacter(supabase, characterId, userId, {
      character_set_id: characterSetId,
      status: "training_set",
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
    return NextResponse.json(
      { error: `index muss 0–${KI_INFLUENCER_TRAINING_SET_SIZE - 1} sein.` },
      { status: 400 }
    );
  }

  if (!character.character_set_id) {
    return NextResponse.json(
      { error: "Trainingsset zuerst starten (start: true)." },
      { status: 400 }
    );
  }

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
    const detail = error instanceof Error ? error.message : undefined;
    return kiInfluencerErrorResponse("generation_failed", 500, detail);
  }
}
