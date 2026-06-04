import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { deductCredits, hasEnoughCredits } from "@/lib/credits";
import {
  configureFalClient,
  generateKiIchPortrait,
  getFalKey,
  parseFalError,
  uploadDataUrlToFal,
  type FalImageMode,
} from "@/lib/fal-image";

const CREDIT_COST = 2;

configureFalClient();

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { imageUrl, scene, mode: modeRaw } = body as {
    imageUrl?: string;
    scene?: string;
    mode?: FalImageMode;
  };

  const mode: FalImageMode = modeRaw === "preview" ? "preview" : "final";

  if (!imageUrl || !scene) {
    return NextResponse.json({ error: "Fehlende Parameter" }, { status: 400 });
  }

  if (!getFalKey()) {
    console.error("ki-ich: FAL_API_KEY / FAL_KEY not set");
    return NextResponse.json(
      { error: "Bildgenerierung ist nicht konfiguriert (API Key fehlt)." },
      { status: 503 }
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  if (mode === "final") {
    const creditCheck = await hasEnoughCredits(supabase, user.id, CREDIT_COST);
    if (!creditCheck.ok) {
      return NextResponse.json({ error: "Nicht genug Credits" }, { status: 402 });
    }
  }

  try {
    const uploadedUrl = await uploadDataUrlToFal(imageUrl);
    const outputUrl = await generateKiIchPortrait(uploadedUrl, scene, mode);

    if (mode === "preview") {
      return NextResponse.json({
        success: true,
        imageUrl: outputUrl,
        mode: "preview",
        creditsUsed: 0,
      });
    }

    const deduction = await deductCredits(
      supabase,
      user.id,
      CREDIT_COST,
      "Mein KI-Ich – Bildgenerierung",
      { generationType: "ki-ich", prompt: scene }
    );

    if (!deduction.success) {
      return NextResponse.json(
        { error: deduction.error ?? "Nicht genug Credits" },
        { status: 402 }
      );
    }

    return NextResponse.json({
      success: true,
      imageUrl: outputUrl,
      mode: "final",
      creditsUsed: CREDIT_COST,
      creditsLeft: deduction.remainingCredits,
    });
  } catch (error: unknown) {
    const bodyDetail =
      error && typeof error === "object" && "body" in error
        ? (error as { body?: unknown }).body
        : undefined;
    console.error("ki-ich fal error:", JSON.stringify(bodyDetail ?? error));

    return NextResponse.json(
      { success: false, error: parseFalError(error) },
      { status: 500 }
    );
  }
}
