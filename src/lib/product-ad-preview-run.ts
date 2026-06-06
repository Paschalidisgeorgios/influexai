import type { SupabaseClient } from "@supabase/supabase-js";
import { configureFalClient, getFalKey, parseFalError } from "@/lib/fal-image";
import {
  createGenerationRecord,
  ingestImageGeneratorAssets,
  updateGenerationResult,
} from "@/lib/generation-assets";
import { generateCategoryImage } from "@/lib/image-generator-fal";
import { deductCredits, hasEnoughCredits } from "@/lib/credits";
import { invalidateUserGenerations } from "@/lib/cache";
import { IMAGE_GEN_CREDITS } from "@/lib/image-generator-credits";
import { scrapeProductUrl } from "@/lib/scrape-product";

export const PRODUCT_PREVIEW_CREDIT_COST = IMAGE_GEN_CREDITS.standard;

export type ProductPreviewResult =
  | {
      ok: true;
      imageUrl: string;
      generationId: string;
      productName: string;
      productDescription?: string;
      sourceImageUrl?: string;
      productUrl?: string;
      creditsUsed: number;
      creditsLeft: number;
    }
  | { ok: false; error: string };

function protectedImageUrl(generationId: string) {
  return `/api/generated-image/${generationId}?variant=preview`;
}

function buildUgcPreviewPrompt(
  productName: string,
  productDescription?: string
): string {
  const desc = productDescription?.trim();
  return [
    `Authentic UGC product ad for "${productName}"`,
    desc ? `Product: ${desc}` : null,
    "Young creator holding product, natural home setting, TikTok UGC style",
    "9:16 vertical, warm lighting, genuine smile, lifestyle context",
    "Professional but authentic, scroll-stopping product showcase",
  ]
    .filter(Boolean)
    .join(", ");
}

export async function runProductAdPreviewGeneration(
  supabase: SupabaseClient,
  userId: string,
  params: {
    productName?: string;
    productDescription?: string;
    productUrl?: string;
    imageUrl?: string;
  }
): Promise<ProductPreviewResult> {
  let productName = params.productName?.trim() ?? "";
  let productDescription = params.productDescription?.trim();
  let sourceImageUrl = params.imageUrl?.trim();
  let productUrl = params.productUrl?.trim();

  if (productUrl) {
    const scraped = await scrapeProductUrl(productUrl);
    if (scraped.ok) {
      if (!productName && scraped.product.name) {
        productName = scraped.product.name;
      }
      if (!productDescription && scraped.product.description) {
        productDescription = scraped.product.description;
      }
      if (!sourceImageUrl && scraped.product.image) {
        sourceImageUrl = scraped.product.image;
      }
      productUrl = scraped.product.url;
    } else if (!productName && !sourceImageUrl) {
      return { ok: false, error: scraped.error };
    }
  }

  if (!productName) {
    return {
      ok: false,
      error: "Produktname erforderlich (oder gültige Produkt-URL).",
    };
  }

  configureFalClient();
  if (!getFalKey()) {
    return { ok: false, error: "Bildgenerierung ist nicht konfiguriert." };
  }

  const creditCheck = await hasEnoughCredits(
    supabase,
    userId,
    PRODUCT_PREVIEW_CREDIT_COST
  );
  if (!creditCheck.ok) {
    return { ok: false, error: "Nicht genug Credits." };
  }

  const prompt = buildUgcPreviewPrompt(productName, productDescription);
  const started = Date.now();

  try {
    const falResult = await generateCategoryImage({
      prompt,
      category: "product",
      imageSize: "portrait_16_9",
      highRes: false,
    });

    const generationId = await createGenerationRecord(
      supabase,
      userId,
      "product_ad",
      {
        paid: false,
        downloadPaid: false,
        mode: "preview",
        assetKind: "image",
        category: "product",
        model: falResult.model,
        width: falResult.width,
        height: falResult.height,
        generationTimeMs: Date.now() - started,
        platform: "tiktok",
        style: "lifestyle",
      },
      0,
      productName.slice(0, 500)
    );

    const { previewPath, sourcePath, width, height } =
      await ingestImageGeneratorAssets(userId, generationId, falResult.url);

    await updateGenerationResult(supabase, generationId, userId, {
      previewPath,
      sourcePath,
      width: width ?? falResult.width,
      height: height ?? falResult.height,
      credits_used: PRODUCT_PREVIEW_CREDIT_COST,
    });

    const deduction = await deductCredits(
      supabase,
      userId,
      PRODUCT_PREVIEW_CREDIT_COST,
      "Produkt-Werbung — UGC Preview",
      {
        generationType: "product_ad",
        prompt: productName.slice(0, 500),
        skipGenerationLog: true,
      }
    );

    if (!deduction.success) {
      return {
        ok: false,
        error: deduction.error ?? "Credit-Abzug fehlgeschlagen.",
      };
    }

    await invalidateUserGenerations(userId);

    return {
      ok: true,
      generationId,
      imageUrl: protectedImageUrl(generationId),
      productName,
      productDescription,
      sourceImageUrl,
      productUrl,
      creditsUsed: PRODUCT_PREVIEW_CREDIT_COST,
      creditsLeft: deduction.remainingCredits ?? 0,
    };
  } catch (error) {
    console.error("product-ad-preview-run:", error);
    return {
      ok: false,
      error: parseFalError(error),
    };
  }
}
