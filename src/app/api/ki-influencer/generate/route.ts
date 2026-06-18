import { NextRequest, NextResponse } from "next/server";
import { assertGatedFeature } from "@/lib/access.server";
import { AgentSafetyError, checkAgentInputSafety } from "@/lib/agent/guards";
import { withCreditDeduction } from "@/lib/credits-with-refund";
import { enhanceImagePrompt } from "@/lib/ai/imagePromptEnhancer";
import {
  platformToFalImageSize,
  resolveImagePlatformId,
  resolveImageStyleId,
  type ImagePlatformId,
  type ImageStyleId,
} from "@/lib/ai/imageStylePresets";
import {
  createGenerationRecord,
  ingestImageGeneratorAssets,
  updateGenerationResult,
} from "@/lib/generation-assets";
import { configureFalClient, getFalKey } from "@/lib/fal-image";
import { generateWithLora } from "@/lib/lora-fal";
import { LORA_GENERATION_CREDIT } from "@/lib/lora-config";
import { getOwnedCharacter } from "@/lib/ki-influencer-db";
import { LORA_WEIGHT_DEFAULT } from "@/lib/ki-influencer-config";
import { developmentWriteGuardResponse } from "@/lib/environment-safety.server";
import {
  assertKiInfluencerAccess,
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

  if (userPrompt.length > 2000) {
    return NextResponse.json(
      { error: "Prompt zu lang (max. 2000 Zeichen)." },
      { status: 400 }
    );
  }

  try {
    checkAgentInputSafety(userPrompt);
  } catch (err) {
    if (err instanceof AgentSafetyError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }

  if (!getFalKey()) {
    return NextResponse.json({ error: "Generierung nicht konfiguriert." }, { status: 503 });
  }

  const access = await assertKiInfluencerAccess(LORA_GENERATION_CREDIT);
  if (access instanceof NextResponse) return access;
  const { userId, supabase, isAdmin } = access;

  const character = await getOwnedCharacter(supabase, characterId, userId);
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
    .eq("user_id", userId)
    .single();

  if (!lora?.lora_url || lora.status !== "ready") {
    return NextResponse.json({ error: "LoRA nicht bereit." }, { status: 400 });
  }

  const started = Date.now();

  try {
    const deductionResult = await withCreditDeduction(
      {
        supabase,
        userId,
        amount: LORA_GENERATION_CREDIT,
        description: `KI-Influencer Content — ${character.name}`,
        skipGenerationLog: true,
        generationType: "lora_generation",
        prompt: userPrompt.slice(0, 500),
      },
      async () => {
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

        const generationId = await createGenerationRecord(
          supabase,
          userId,
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
          isAdmin ? 0 : LORA_GENERATION_CREDIT,
          `${triggerWord} ${userPrompt}`.slice(0, 500)
        );

        const { previewPath, sourcePath, width, height } =
          await ingestImageGeneratorAssets(userId, generationId, result.url);

        await updateGenerationResult(supabase, generationId, userId, {
          previewPath,
          sourcePath,
          width,
          height,
        });

        return {
          generationId,
          characterId,
          triggerWord,
          styleId,
          platform,
          enhancedPrompt: enhanced.prompt,
          width: width ?? result.width,
          height: height ?? result.height,
        };
      }
    );

    if (!deductionResult.ok) {
      if (deductionResult.status === 402) {
        return kiInfluencerErrorResponse("insufficient_credits", 402, undefined, {
          credits: deductionResult.remainingCredits,
          required: deductionResult.required,
        });
      }
      return kiInfluencerErrorResponse(
        "generation_failed",
        deductionResult.status,
        deductionResult.error
      );
    }

    const data = deductionResult.data;

    return NextResponse.json({
      success: true,
      generationId: data.generationId,
      imageUrl: protectedImageUrl(data.generationId),
      creditsUsed: isAdmin ? 0 : LORA_GENERATION_CREDIT,
      creditsLeft: deductionResult.remainingCredits,
      characterId: data.characterId,
      triggerWord: data.triggerWord,
      loraWeight: LORA_WEIGHT_DEFAULT,
      styleId: data.styleId,
      platform: data.platform,
      enhancedPrompt: data.enhancedPrompt,
      generationTimeMs: Date.now() - started,
    });
  } catch (error) {
    logKiInfluencerError("content generate", error);
    const detail = error instanceof Error ? error.message : undefined;
    return kiInfluencerErrorResponse("generation_failed", 500, detail);
  }
}
