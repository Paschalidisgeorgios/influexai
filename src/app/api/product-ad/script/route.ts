import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  PRODUCT_AD_PLATFORMS,
  PRODUCT_AD_STYLES,
  type ProductAdPlatform,
  type ProductAdStyle,
  type ProductAdVariationFocus,
} from "@/lib/product-ad-config";
import {
  generateProductAdScript,
  scriptToDisplayText,
} from "@/lib/product-ad-script";
import { assertGatedFeature } from "@/lib/access.server";
import { isValidLocale, type Locale } from "@/lib/locale";

export const dynamic = "force-dynamic";

export const maxDuration = 60;

type ScriptBody = {
  productName?: string;
  productDescription?: string;
  audience?: string;
  platform?: string;
  style?: string;
  language?: string;
  ctaText?: string;
  variationFocus?: ProductAdVariationFocus;
};

function isValidPlatform(p: string): p is ProductAdPlatform {
  return PRODUCT_AD_PLATFORMS.some((x) => x.id === p);
}

function isValidStyle(s: string): s is ProductAdStyle {
  return (PRODUCT_AD_STYLES as string[]).includes(s);
}

export async function POST(request: NextRequest) {
  const denied = await assertGatedFeature("produkt-ads");
  if (denied) return denied;

  let body: ScriptBody;
  try {
    body = (await request.json()) as ScriptBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const productName = body.productName?.trim() ?? "";
  const productDescription = body.productDescription?.trim() ?? "";
  const audience = body.audience?.trim() ?? "";
  const ctaText = body.ctaText?.trim() ?? "Shop now";
  const platform = body.platform ?? "tiktok";
  const style = body.style ?? "lifestyle";
  const language = isValidLocale(body.language) ? body.language : "de";

  if (!productName) {
    return NextResponse.json({ error: "Product name required" }, { status: 400 });
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

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const scriptResult = await generateProductAdScript({
    productName,
    productDescription,
    audience,
    platform,
    style,
    language,
    ctaText,
    variationFocus: body.variationFocus ?? "default",
  });

  if (!scriptResult.ok) {
    return NextResponse.json({ error: scriptResult.error }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    script: scriptResult.script,
    scriptText: scriptToDisplayText(scriptResult.script),
  });
}
