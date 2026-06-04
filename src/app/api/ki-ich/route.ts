import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { fal } from "@fal-ai/client";

const CREDIT_COST = 2;

fal.config({ credentials: process.env.FAL_API_KEY });

export async function POST(request: NextRequest) {
  const { imageUrl, scene } = await request.json();

  if (!imageUrl || !scene) {
    return NextResponse.json({ error: "Fehlende Parameter" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("credits")
    .eq("id", user.id)
    .single();

  if (!profile || profile.credits < CREDIT_COST) {
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

    const r = result as any;
    const outputUrl =
      r?.data?.image?.url ||
      r?.images?.[0]?.url ||
      r?.image?.url;

    if (!outputUrl) {
      throw new Error(`Kein Bild im Response. Keys: ${Object.keys(result as object).join(", ")}`);
    }

    // Credits abziehen
    await supabase
      .from("profiles")
      .update({ credits: profile.credits - CREDIT_COST })
      .eq("id", user.id);

    return NextResponse.json({
      imageUrl: outputUrl,
      creditsUsed: CREDIT_COST,
      creditsLeft: profile.credits - CREDIT_COST,
    });
  } catch (error: any) {
    console.error("InfluexAI Vision Error:", JSON.stringify(error?.body || error?.message || error));
    return NextResponse.json(
      { error: error?.message || "Bildgenerierung fehlgeschlagen" },
      { status: 500 }
    );
  }
}
