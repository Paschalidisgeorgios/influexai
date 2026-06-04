import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { deductCredits, hasEnoughCredits } from "@/lib/credits";
import { fal } from "@fal-ai/client";

const CREDIT_COST = 2;

type FalInstantIdResult = {
  data?: { image?: { url?: string } };
  images?: Array<{ url?: string }>;
  image?: { url?: string };
};

fal.config({ credentials: process.env.FAL_API_KEY });

export async function POST(request: NextRequest) {
  const { imageUrl, scene } = await request.json();

  if (!imageUrl || !scene) {
    return NextResponse.json({ error: "Fehlende Parameter" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const creditCheck = await hasEnoughCredits(supabase, user.id, CREDIT_COST);
  if (!creditCheck.ok) {
    return NextResponse.json({ error: "Nicht genug Credits" }, { status: 402 });
  }

  try {
    // Base64 zu Blob konvertieren und zu fal.ai hochladen
    const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    const blob = new Blob([buffer], { type: "image/jpeg" });
    const file = new File([blob], "face.jpg", { type: "image/jpeg" });

    // Bild zu fal.ai Storage hochladen
    const uploadedUrl = await fal.storage.upload(file);

    // Bild generieren
    const result = await fal.subscribe("fal-ai/instantid", {
      input: {
        face_image_url: uploadedUrl,
        prompt: `${scene}, photorealistic, high quality, 8k`,
        negative_prompt: "blurry, bad quality, cartoon, ugly",
        num_inference_steps: 15,
        guidance_scale: 6,
      },
    });

    const r = result as FalInstantIdResult;
    const outputUrl =
      r.data?.image?.url || r.images?.[0]?.url || r.image?.url;

    if (!outputUrl) {
      throw new Error(
        `Kein Bild im Response. Keys: ${Object.keys(result as object).join(", ")}`
      );
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
      imageUrl: outputUrl,
      creditsUsed: CREDIT_COST,
      creditsLeft: deduction.remainingCredits,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Bildgenerierung fehlgeschlagen";
    const body =
      error && typeof error === "object" && "body" in error
        ? (error as { body?: unknown }).body
        : undefined;
    console.error("InfluexAI Vision Error:", JSON.stringify(body ?? message));
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
