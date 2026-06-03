import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { fal } from "@fal-ai/client";

const CREDIT_COST = 4;

fal.config({ credentials: process.env.FAL_API_KEY });

export async function POST(request: NextRequest) {
  const { imageUrl, scene } = await request.json();

  if (!imageUrl || !scene) {
    return NextResponse.json({ error: "Fehlende Parameter" }, { status: 400 });
  }

  // Auth + Credits prüfen
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
    const result = await fal.subscribe("fal-ai/instant-id", {
      input: {
        face_image_url: imageUrl,
        prompt: `professional high quality photo of a person, ${scene}, photorealistic, 8k`,
        negative_prompt: "cartoon, anime, illustration, painting, drawing, bad quality, blurry",
        num_inference_steps: 30,
        guidance_scale: 5,
        ip_adapter_scale: 0.8,
        controlnet_conditioning_scale: 0.8,
      },
    });

    const outputUrl = (result as any)?.images?.[0]?.url || (result as any)?.image?.url;

    if (!outputUrl) {
      throw new Error("Kein Bild generiert");
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
    console.error("InfluexAI Vision Error:", error);
    return NextResponse.json(
      { error: "Bildgenerierung fehlgeschlagen. Bitte versuche es erneut." },
      { status: 500 }
    );
  }
}
