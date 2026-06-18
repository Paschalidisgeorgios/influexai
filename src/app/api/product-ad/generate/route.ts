import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { addCredits, deductCredits, hasEnoughCredits } from "@/lib/credits";
import { invalidateUserGenerations } from "@/lib/cache";
import { notifyGenerationCompletePush } from "@/lib/push-notifications";
import {
  PRODUCT_AD_CREDITS,
  PRODUCT_AD_PLATFORMS,
  PRODUCT_AD_STYLES,
  type ProductAdPlatform,
  type ProductAdStyle,
  type ProductAdVariationFocus,
} from "@/lib/product-ad-config";
import {
  buildVideoPrompt,
  generateProductAdScript,
  scriptToDisplayText,
  type ProductAdScript,
} from "@/lib/product-ad-script";
import { runWithQualityRetry } from "@/lib/agent/qualityScoring";
import { AgentSafetyError, checkAgentInputSafety } from "@/lib/agent/guards";
import { generateKlingProductVideo, parseFalVideoError } from "@/lib/fal-video";
import {
  configureFalClient,
  getFalKey,
  uploadDataUrlToFal,
} from "@/lib/fal-image";
import { assertGatedFeature } from "@/lib/access.server";
import { developmentWriteGuardResponse } from "@/lib/environment-safety.server";
import {
  createGenerationRecord,
  ingestFinalAssetFromUrl,
} from "@/lib/generation-assets";
import { isValidLocale, type Locale } from "@/lib/locale";

export const dynamic = "force-dynamic";

export const maxDuration = 300;

type GenerateBody = {
  productName?: string;
  productDescription?: string;
  imageUrl?: string;
  audience?: string;
  platform?: string;
  style?: string;
  language?: string;
  ctaText?: string;
  batch?: boolean;
  upscale?: boolean;
  variation?: boolean;
  variationFocus?: ProductAdVariationFocus;
  parentGenerationId?: string;
  editedScript?: ProductAdScript;
  seed?: number;
};

function protectedVideoUrl(generationId: string) {
  return `/api/generated-video/${generationId}`;
}

function isValidPlatform(p: string): p is ProductAdPlatform {
  return PRODUCT_AD_PLATFORMS.some((x) => x.id === p);
}

function isValidStyle(s: string): s is ProductAdStyle {
  return (PRODUCT_AD_STYLES as string[]).includes(s);
}

async function resolveImageUrl(imageUrl: string): Promise<string> {
  if (imageUrl.startsWith("data:image/")) {
    return uploadDataUrlToFal(imageUrl);
  }
  return imageUrl;
}

type AdGenerationResult = {
  generationId: string;
  videoUrl: string;
  script: ProductAdScript;
  scriptText: string;
  platform: ProductAdPlatform;
  style: ProductAdStyle;
  variationFocus?: ProductAdVariationFocus;
  creditsUsed: number;
};

async function runSingleGeneration(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string,
  params: {
    productName: string;
    productDescription: string;
    imageUrl: string;
    falImageUrl?: string;
    audience: string;
    platform: ProductAdPlatform;
    style: ProductAdStyle;
    language: Locale;
    ctaText: string;
    upscale: boolean;
    variationFocus?: ProductAdVariationFocus;
    editedScript?: ProductAdScript;
    seed?: number;
  },
  creditCost: number,
  batchId?: string
): Promise<AdGenerationResult> {
  configureFalClient();

  let script: ProductAdScript;
  let falImageUrl: string;

  if (params.editedScript) {
    script = params.editedScript;
    falImageUrl =
      params.falImageUrl ?? (await resolveImageUrl(params.imageUrl));
  } else {
    const scriptInput = {
      productName: params.productName,
      productDescription: params.productDescription,
      audience: params.audience,
      platform: params.platform,
      style: params.style,
      language: params.language,
      ctaText: params.ctaText,
      variationFocus: params.variationFocus,
    };

    const [picked, resolvedImageUrl] = await Promise.all([
      runWithQualityRetry({
        toolName: "product-ad",
        userGoal: `${params.productName} · ${params.audience} · ${params.platform}`,
        toOutputText: scriptToDisplayText,
        generate: async (retryHint) => {
          const scriptResult = await generateProductAdScript(scriptInput, retryHint);
          if (!scriptResult.ok) {
            throw new Error(scriptResult.error);
          }
          return scriptResult.script;
        },
      }),
      params.falImageUrl
        ? Promise.resolve(params.falImageUrl)
        : resolveImageUrl(params.imageUrl),
    ]);

    script = picked.value;
    falImageUrl = resolvedImageUrl;
  }

  const variationSuffix =
    params.seed != null
      ? `variation seed ${params.seed}, unique camera angle`
      : undefined;

  const videoPrompt = buildVideoPrompt(
    script,
    params.style,
    params.upscale
      ? `${variationSuffix ?? ""}, ultra sharp 4K commercial quality, premium detail`
      : variationSuffix
  );

  const { videoUrl: falVideoUrl, model } = await generateKlingProductVideo({
    imageUrl: falImageUrl,
    prompt: videoPrompt,
    duration: params.upscale ? "10" : "5",
    aspectRatio: "9:16",
    cfgScale: params.upscale ? 0.65 : 0.5,
  });

  const generationId = crypto.randomUUID();
  const { path: finalPath } = await ingestFinalAssetFromUrl(
    userId,
    generationId,
    falVideoUrl,
    "video"
  );

  await createGenerationRecord(
    supabase,
    userId,
    "product_ad",
    {
      paid: true,
      downloadPaid: true,
      assetKind: "video",
      mode: "final",
      model,
      platform: params.platform,
      style: params.style,
      script: script as unknown as Record<string, unknown>,
      scriptText: scriptToDisplayText(script),
      variationFocus: params.variationFocus,
      batchId,
      seed: params.seed,
      upscaled: params.upscale,
      finalPath,
    },
    creditCost,
    params.productName.slice(0, 500),
    generationId
  );

  return {
    generationId,
    videoUrl: protectedVideoUrl(generationId),
    script,
    scriptText: scriptToDisplayText(script),
    platform: params.platform,
    style: params.style,
    variationFocus: params.variationFocus,
    creditsUsed: creditCost,
  };
}

export async function POST(request: NextRequest) {
  const writeGuard = developmentWriteGuardResponse();
  if (writeGuard) return writeGuard;

  const denied = await assertGatedFeature("produkt-ads");
  if (denied) return denied;

  let body: GenerateBody;
  try {
    body = (await request.json()) as GenerateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const productName = body.productName?.trim() ?? "";
  const productDescription = body.productDescription?.trim() ?? "";
  const imageUrl = body.imageUrl?.trim() ?? "";
  const audience = body.audience?.trim() ?? "";
  const ctaText = body.ctaText?.trim() ?? "Shop now";
  const platform = body.platform ?? "tiktok";
  const style = body.style ?? "lifestyle";
  const language = isValidLocale(body.language) ? body.language : "de";
  const batch = body.batch === true;
  const upscale = body.upscale === true;
  const isVariation = body.variation === true;

  if (!productName) {
    return NextResponse.json({ error: "Product name required" }, { status: 400 });
  }
  if (!imageUrl) {
    return NextResponse.json(
      { error: "Product image required (upload or URL scrape)" },
      { status: 400 }
    );
  }
  if (!audience) {
    return NextResponse.json({ error: "Target audience required" }, { status: 400 });
  }
  if (!isValidPlatform(platform)) {
    return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
  }
  if (!isValidStyle(style)) {
    return NextResponse.json({ error: "Invalid style" }, { status: 400 });
  }

  try {
    checkAgentInputSafety(
      [productName, productDescription, audience].filter(Boolean).join("\n")
    );
  } catch (err) {
    if (err instanceof AgentSafetyError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }

  if (!getFalKey()) {
    return NextResponse.json(
      { error: "Video generation is not configured." },
      { status: 503 }
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const baseCost = batch
    ? PRODUCT_AD_CREDITS.batch
    : PRODUCT_AD_CREDITS.standard;
  const creditCost = baseCost + (upscale ? PRODUCT_AD_CREDITS.upscaleExtra : 0);

  const creditCheck = await hasEnoughCredits(supabase, user.id, creditCost);
  if (!creditCheck.ok) {
    return NextResponse.json(
      { error: "Not enough credits", credits: creditCheck.credits },
      { status: 402 }
    );
  }

  const perItemCost = batch
    ? Math.floor(creditCost / 3)
    : creditCost;

  const started = Date.now();
  const batchId = batch ? crypto.randomUUID() : undefined;
  const seed =
    typeof body.seed === "number"
      ? body.seed
      : isVariation
        ? Math.floor(Math.random() * 999999)
        : undefined;

  const deductMeta = {
    generationType: "product_ad",
    prompt: productName.slice(0, 500),
    skipGenerationLog: true,
  } as const;

  try {
    if (batch) {
      const focuses: ProductAdVariationFocus[] = [
        "hook",
        "lifestyle",
        "problem_solution",
      ];
      const falImageUrl = await resolveImageUrl(imageUrl);

      const results = await Promise.all(
        focuses.map(async (focus) => {
          const deduction = await deductCredits(
            supabase,
            user.id,
            perItemCost,
            "Product Ad — 3 variations",
            deductMeta
          );

          if (!deduction.success) {
            return {
              ok: false as const,
              error: deduction.error ?? "Not enough credits",
              variationFocus: focus,
            };
          }

          try {
            const result = await runSingleGeneration(
              supabase,
              user.id,
              {
                productName,
                productDescription,
                imageUrl,
                falImageUrl,
                audience,
                platform,
                style,
                language,
                ctaText,
                upscale,
                variationFocus: focus,
              },
              perItemCost,
              batchId
            );
            return {
              ok: true as const,
              result,
              variationFocus: focus,
              creditsLeft: deduction.remainingCredits,
            };
          } catch (e) {
            await addCredits(
              supabase,
              user.id,
              perItemCost,
              "Product Ad — 3 variations — Refund"
            );
            const message =
              e instanceof Error
                ? parseFalVideoError(e)
                : "Generation failed";
            return {
              ok: false as const,
              error: message,
              variationFocus: focus,
            };
          }
        })
      );

      const variations = results
        .filter((r): r is Extract<typeof r, { ok: true }> => r.ok)
        .map((r) => r.result);
      const creditsUsed = variations.length * perItemCost;
      const lastCreditsLeft = [...results]
        .reverse()
        .find((r): r is Extract<typeof r, { ok: true }> => r.ok)?.creditsLeft;

      if (variations.length > 0) {
        await invalidateUserGenerations(user.id);
        notifyGenerationCompletePush(
          user.id,
          "Product Ad Videos",
          "/dashboard/product-ad"
        );
      }

      return NextResponse.json({
        success: variations.length > 0,
        batch: true,
        batchId,
        variations,
        results,
        creditsUsed,
        creditsLeft: lastCreditsLeft,
        generationTimeMs: Date.now() - started,
      });
    }

    const deduction = await deductCredits(
      supabase,
      user.id,
      creditCost,
      isVariation ? "Product Ad — Variation" : "Product Ad — Video",
      deductMeta
    );

    if (!deduction.success) {
      const status =
        deduction.error === "Nicht genug Credits." ? 402 : 500;
      return NextResponse.json(
        { error: deduction.error ?? "Not enough credits" },
        { status }
      );
    }

    const falImageUrl =
      body.editedScript != null
        ? await resolveImageUrl(imageUrl)
        : undefined;

    try {
      const result = await runSingleGeneration(
        supabase,
        user.id,
        {
          productName,
          productDescription,
          imageUrl,
          falImageUrl,
          audience,
          platform,
          style,
          language,
          ctaText,
          upscale,
          variationFocus: body.variationFocus ?? "default",
          editedScript: body.editedScript,
          seed,
        },
        perItemCost
      );

      await invalidateUserGenerations(user.id);

      notifyGenerationCompletePush(
        user.id,
        "Product Ad Video",
        `/dashboard/product-ad?generation=${result.generationId}`
      );

      return NextResponse.json({
        success: true,
        ...result,
        creditsUsed: creditCost,
        creditsLeft: deduction.remainingCredits,
        generationTimeMs: Date.now() - started,
        seed,
      });
    } catch (e) {
      await addCredits(
        supabase,
        user.id,
        creditCost,
        isVariation ? "Product Ad — Variation — Refund" : "Product Ad — Video — Refund"
      );
      throw e;
    }
  } catch (error) {
    console.error("product-ad/generate:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? parseFalVideoError(error)
            : "Generation failed",
      },
      { status: 500 }
    );
  }
}
