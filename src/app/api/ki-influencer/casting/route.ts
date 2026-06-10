import { randomUUID } from "crypto";

import { NextRequest, NextResponse } from "next/server";
import { assertKiToolAccess } from "@/lib/access.server";
import { enhanceImagePrompt } from "@/lib/ai/imagePromptEnhancer";
import { deductCredits } from "@/lib/credits";
import { generateCategoryImage } from "@/lib/image-generator-fal";
import {
  createGenerationRecord,
  ingestImageGeneratorAssets,
  updateGenerationResult,
} from "@/lib/generation-assets";
import { configureFalClient, getFalKey, logFalAiError } from "@/lib/fal-image";
import { IMAGE_GEN_CREDITS } from "@/lib/image-generator-credits";
import {
  generationStoragePublicUrl,
} from "@/lib/ki-influencer-lora-upload";
import { getOwnedCharacter, updateCharacter } from "@/lib/ki-influencer-db";
import { platformToFalImageSize } from "@/lib/ai/imageStylePresets";

export const dynamic = "force-dynamic";

export const maxDuration = 120;

configureFalClient();

function protectedImageUrl(generationId: string) {
  return `/api/generated-image/${generationId}?variant=preview`;
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    characterId?: string;
    name?: string;
    description?: string;
    confirm?: boolean;
  };

  const name = body.name?.trim() ?? "";
  const description = body.description?.trim() ?? "";
  const confirmCasting = body.confirm === true;
  const creditCost = IMAGE_GEN_CREDITS.standard;

  if (!getFalKey()) {
    return NextResponse.json(
      { error: "Bildgenerierung ist nicht konfiguriert." },
      { status: 503 }
    );
  }

  const access = await assertKiToolAccess(confirmCasting ? 0 : creditCost);
  if (access instanceof NextResponse) return access;
  const { userId, supabase } = access;

  let characterId = body.characterId?.trim() ?? "";

  if (!characterId) {
    if (!name || description.length < 10) {
      return NextResponse.json(
        {
          error:
            "Name und Beschreibung (min. 10 Zeichen, Alter 18+) erforderlich.",
        },
        { status: 400 }
      );
    }
    const { data, error } = await supabase
      .from("characters")
      .insert({
        user_id: userId,
        name,
        description,
        status: "draft",
      })
      .select("id")
      .single();
    if (error || !data?.id) {
      return NextResponse.json(
        { error: "Charakter konnte nicht angelegt werden." },
        { status: 500 }
      );
    }
    characterId = data.id as string;
  }

  const character = await getOwnedCharacter(supabase, characterId, userId);
  if (!character) {
    return NextResponse.json({ error: "Charakter nicht gefunden." }, { status: 404 });
  }

  if (confirmCasting) {
    if (!character.casting_generation_id) {
      return NextResponse.json(
        { error: "Erst ein Casting-Bild generieren." },
        { status: 400 }
      );
    }
    await updateCharacter(supabase, characterId, userId, {
      status: "casting_confirmed",
    });
    return NextResponse.json({
      success: true,
      characterId,
      status: "casting_confirmed",
      castingGenerationId: character.casting_generation_id,
      castingImageUrl: character.casting_image_url,
    });
  }

  const castingBrief = [
    character.name || name,
    character.description || description,
    "virtual influencer casting photo, adult 25-35, full face visible, neutral background",
  ]
    .filter(Boolean)
    .join(". ");

  const started = Date.now();

  try {
    const enhanced = await enhanceImagePrompt(castingBrief, {
      styleId: "editorial",
      platform: "universal",
      influencerCastingMode: true,
    });

    const falResult = await generateCategoryImage({
      prompt: enhanced.prompt,
      falPrompt: enhanced.prompt,
      negativePrompt: enhanced.negative_prompt,
      category: "portrait",
      imageSize: platformToFalImageSize("universal"),
      imageDimensions: { width: 1080, height: 1080 },
      highRes: false,
    });

    const generationId = randomUUID();
    const { previewPath, sourcePath, width, height } =
      await ingestImageGeneratorAssets(userId, generationId, falResult.url);

    const castingImageUrl = generationStoragePublicUrl(supabase, sourcePath);

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
        source: "ki_influencer_casting",
        character_id: characterId,
      },
      0,
      castingBrief.slice(0, 500),
      generationId
    );

    await updateGenerationResult(supabase, generationId, userId, {
      credits_used: creditCost,
    });

    const deduction = await deductCredits(
      supabase,
      userId,
      creditCost,
      "KI-Influencer — Casting",
      {
        generationType: "image",
        prompt: castingBrief.slice(0, 500),
        skipGenerationLog: true,
      }
    );

    if (!deduction.success) {
      return NextResponse.json(
        { error: deduction.error ?? "Nicht genug Credits" },
        { status: 402 }
      );
    }

    await updateCharacter(supabase, characterId, userId, {
      name: character.name || name,
      description: character.description || description,
      casting_generation_id: generationId,
      casting_image_url: castingImageUrl,
      status: "casting",
    });

    return NextResponse.json({
      success: true,
      characterId,
      generationId,
      imageUrl: protectedImageUrl(generationId),
      castingImageUrl,
      enhancedPrompt: enhanced.prompt,
      creditsUsed: creditCost,
      creditsLeft: deduction.remainingCredits,
      generationTimeMs: Date.now() - started,
    });
  } catch (error) {
    logFalAiError(error);
    const msg = error instanceof Error ? error.message : "Casting fehlgeschlagen";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
