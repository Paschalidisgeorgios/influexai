import { NextRequest, NextResponse } from "next/server";

import { AKOOL_TOOL_CREDITS } from "@/lib/akool-credits";
import { createAkoolJob } from "@/lib/akool-status";
import { runAkoolAsyncPost } from "@/lib/akool-async-route";
import { providerRouteGuardResponse } from "@/lib/environment-safety.server";
import { getFalKey } from "@/lib/fal-image";
import { resolveImageUrlForSeedance } from "@/lib/seedance-generate";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const FORMATS: Record<string, string> = {
  square: "1:1",
  portrait: "9:16",
  landscape: "16:9",
};

export async function POST(request: NextRequest) {
  const writeGuard = providerRouteGuardResponse();
  if (writeGuard) return writeGuard;

  if (!getFalKey()) {
    return NextResponse.json(
      { error: "Medien-Upload ist gerade nicht verfügbar." },
      { status: 503 }
    );
  }

  let body: {
    product_image_url?: string;
    productImageUrl?: string;
    background_prompt?: string;
    backgroundPrompt?: string;
    format?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const productImageUrl =
    (body.product_image_url ?? body.productImageUrl)?.trim() ?? "";
  const backgroundPrompt =
    (body.background_prompt ?? body.backgroundPrompt)?.trim() ?? "";
  const formatKey = body.format ?? "square";
  const format = FORMATS[formatKey] ?? "1:1";

  if (!productImageUrl || !backgroundPrompt) {
    return NextResponse.json(
      { error: "Produktbild und Hintergrund-Beschreibung erforderlich" },
      { status: 400 }
    );
  }

  return runAkoolAsyncPost({
    creditCost: AKOOL_TOOL_CREDITS.ecommerceAds,
    generationType: "akool-ecommerce-ads",
    label: "E-Commerce Ads",
    pollType: "ecommerceAds",
    prompt: backgroundPrompt.slice(0, 500),
    assetKind: "image",
    createJob: async ({ supabase, userId }) => {
      const publicImage = await resolveImageUrlForSeedance(
        supabase,
        userId,
        productImageUrl
      );
      return createAkoolJob("/v3/product-ad/create", {
        product_image_url: publicImage,
        background_prompt: backgroundPrompt,
        format,
      });
    },
  });
}
