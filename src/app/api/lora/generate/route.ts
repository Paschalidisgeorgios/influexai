import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { deductCredits, hasEnoughCredits } from "@/lib/credits";
import { LORA_GENERATION_CREDIT } from "@/lib/lora-config";
import { generateWithLora } from "@/lib/lora-fal";
import { configureFalClient, getFalKey, parseFalError } from "@/lib/fal-image";
import {
  createGenerationRecord,
  ingestImageGeneratorAssets,
  updateGenerationResult,
} from "@/lib/generation-assets";
import { assertGatedFeature } from "@/lib/access";

export const maxDuration = 120;

configureFalClient();

function protectedImageUrl(generationId: string) {
  return `/api/generated-image/${generationId}?variant=preview`;
}

export async function POST(request: NextRequest) {
  const denied = await assertGatedFeature("lora-training");
  if (denied) return denied;

  let body: {
    loraId?: string;
    prompt?: string;
    imageSize?: "portrait_16_9" | "landscape_16_9" | "square_hd";
    loraScale?: number;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const loraId = body.loraId?.trim();
  const prompt = body.prompt?.trim() ?? "";

  if (!loraId || !prompt) {
    return NextResponse.json({ error: "loraId and prompt required" }, { status: 400 });
  }

  if (!getFalKey()) {
    return NextResponse.json({ error: "Generation not configured" }, { status: 503 });
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const { data: lora } = await supabase
    .from("lora_models")
    .select("id, name, trigger_word, lora_url, status")
    .eq("id", loraId)
    .eq("user_id", user.id)
    .single();

  if (!lora || lora.status !== "ready" || !lora.lora_url) {
    return NextResponse.json({ error: "LoRA not ready" }, { status: 400 });
  }

  const creditCheck = await hasEnoughCredits(
    supabase,
    user.id,
    LORA_GENERATION_CREDIT
  );
  if (!creditCheck.ok) {
    return NextResponse.json({ error: "Not enough credits" }, { status: 402 });
  }

  const started = Date.now();

  try {
    const result = await generateWithLora({
      prompt,
      loraUrl: lora.lora_url,
      triggerWord: lora.trigger_word,
      loraScale: body.loraScale ?? 0.9,
      imageSize: body.imageSize ?? "portrait_16_9",
    });

    const deduction = await deductCredits(
      supabase,
      user.id,
      LORA_GENERATION_CREDIT,
      `LoRA Generation — ${lora.name}`,
      {
        generationType: "lora_generation",
        prompt: prompt.slice(0, 500),
        skipGenerationLog: true,
      }
    );

    if (!deduction.success) {
      return NextResponse.json({ error: "Not enough credits" }, { status: 402 });
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
      },
      LORA_GENERATION_CREDIT,
      `${lora.trigger_word} ${prompt}`.slice(0, 500)
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
      loraId,
      triggerWord: lora.trigger_word,
    });
  } catch (error) {
    console.error("lora generate:", error);
    return NextResponse.json(
      { error: parseFalError(error) },
      { status: 500 }
    );
  }
}
