import { NextRequest, NextResponse } from "next/server";
import { assertGatedFeature } from "@/lib/access.server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { enhanceImagePrompt } from "@/lib/ai/imagePromptEnhancer";
import {
  platformToFalImageSize,
  resolveImagePlatformId,
  resolveImageStyleId,
  type ImagePlatformId,
  type ImageStyleId,
} from "@/lib/ai/imageStylePresets";
import { deductCredits, hasEnoughCredits } from "@/lib/credits";
import {
  createGenerationRecord,
  ingestImageGeneratorAssets,
  updateGenerationResult,
} from "@/lib/generation-assets";
import { configureFalClient, getFalKey, parseFalError } from "@/lib/fal-image";
import { generateWithLora } from "@/lib/lora-fal";
import { LORA_GENERATION_CREDIT } from "@/lib/lora-config";
import { getOwnedCharacter } from "@/lib/ki-influencer-db";
import { LORA_WEIGHT_DEFAULT } from "@/lib/ki-influencer-config";

export const dynamic = "force-dynamic";

export const maxDuration = 120;

configureFalClient();

function protectedImageUrl(generationId: string) {
  return `/api/generated-image/${generationId}?variant=preview`;
}

export async function POST(request: NextRequest) {
  const denied = await assertGatedFeature("lora-training");
  if (denied) return denied;

  const body = (await request.json()) as {
    characterId?: string;
    prompt?: string;
    styleId?: ImageStyleId;
    platform?: ImagePlatformId;
  };

  const characterId = body.characterId?.trim() ?? "";
  const userPrompt = body.prompt?.trim() ?? "";
  const styleId = resolveImageStyleId(body.styleId);
  const platform = resolveImagePlatformId(body.platform);

  if (!characterId || !userPrompt) {
    return NextResponse.json(
      { error: "characterId und prompt erforderlich." },
      { status: 400 }
    );
  }

  if (!getFalKey()) {
    return NextResponse.json({ error: "Generierung nicht konfiguriert." }, { status: 503 });
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht eingeloggt." }, { status: 401 });
  }

  const character = await getOwnedCharacter(supabase, characterId, user.id);
  if (!character || character.status !== "ready") {
    return NextResponse.json(
      { error: "Charakter ist noch nicht trainiert." },
      { status: 400 }
    );
  }

  const { data: lora } = await supabase
    .from("lora_models")
    .select("id, lora_url, trigger_word, status")
    .eq("id", character.lora_id)
    .eq("user_id", user.id)
    .single();

  if (!lora?.lora_url || lora.status !== "ready") {
    return NextResponse.json({ error: "LoRA nicht bereit." }, { status: 400 });
  }

  const creditCheck = await hasEnoughCredits(
    supabase,
    user.id,
    LORA_GENERATION_CREDIT
  );
  if (!creditCheck.ok) {
    return NextResponse.json({ error: "Nicht genug Credits." }, { status: 402 });
  }

  const started = Date.now();

  try {
    const enhanced = await enhanceImagePrompt(userPrompt, { styleId, platform });
    const triggerWord = character.trigger_word ?? lora.trigger_word;
    const rawSize = platformToFalImageSize(platform);
    const imageSize =
      rawSize === "portrait_4_3" ? "portrait_16_9" : rawSize;

    const result = await generateWithLora({
      prompt: enhanced.prompt,
      loraUrl: lora.lora_url,
      triggerWord,
      loraScale: LORA_WEIGHT_DEFAULT,
      imageSize,
    });

    const deduction = await deductCredits(
      supabase,
      user.id,
      LORA_GENERATION_CREDIT,
      `KI-Influencer Content — ${character.name}`,
      {
        generationType: "lora_generation",
        prompt: userPrompt.slice(0, 500),
        skipGenerationLog: true,
      }
    );

    if (!deduction.success) {
      return NextResponse.json({ error: "Nicht genug Credits." }, { status: 402 });
    }

    const generationId = await createGenerationRecord(
      supabase,
      user.id,
      "lora_generation",
      {
        paid: true,
        downloadPaid: true,
        assetKind: "image",
        mode: "final",
        model: "fal-ai/flux-lora",
        width: result.width,
        height: result.height,
        generationTimeMs: Date.now() - started,
        source: "ki_influencer_content",
        character_id: characterId,
      },
      LORA_GENERATION_CREDIT,
      `${triggerWord} ${userPrompt}`.slice(0, 500)
    );

    const { previewPath, sourcePath, width, height } =
      await ingestImageGeneratorAssets(user.id, generationId, result.url);

    await updateGenerationResult(supabase, generationId, user.id, {
      previewPath,
      sourcePath,
      width,
      height,
    });

    return NextResponse.json({
      success: true,
      generationId,
      imageUrl: protectedImageUrl(generationId),
      creditsUsed: LORA_GENERATION_CREDIT,
      creditsLeft: deduction.remainingCredits,
      characterId,
      triggerWord,
      loraWeight: LORA_WEIGHT_DEFAULT,
      styleId,
      platform,
      enhancedPrompt: enhanced.prompt,
      generationTimeMs: Date.now() - started,
    });
  } catch (error) {
    console.error("ki-influencer generate:", error);
    return NextResponse.json(
      { error: parseFalError(error) },
      { status: 500 }
    );
  }
}
