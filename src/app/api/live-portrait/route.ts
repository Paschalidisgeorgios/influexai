export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { fal } from "@fal-ai/client";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { configureFalClient, getFalKey } from "@/lib/fal-image";
import { uploadDataUrlImageToFal } from "@/lib/upload-media-fal";

export const maxDuration = 300;

const CREDIT_COST = 5;

async function uploadDataUrlVideoToFal(dataUrl: string): Promise<string> {
  const match = dataUrl.match(/^data:(video\/[^;]+);base64,(.+)$/);
  if (!match) {
    throw new Error("Ungültiges Video-Format.");
  }

  const mimeType = match[1];
  const buffer = Buffer.from(match[2], "base64");
  const ext = mimeType.includes("quicktime") ? "mov" : "mp4";
  const bytes = new Uint8Array(buffer);
  const blob = new Blob([bytes], { type: mimeType });
  const file = new File([blob], `live-portrait-driving.${ext}`, {
    type: mimeType,
  });
  configureFalClient();
  return fal.storage.upload(file);
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!getFalKey()) {
    return NextResponse.json(
      { error: "Video-Engine ist nicht konfiguriert." },
      { status: 503 }
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("credits")
    .eq("id", user.id)
    .single();

  if ((profile?.credits ?? 0) < CREDIT_COST) {
    return NextResponse.json(
      { error: "Nicht genug Credits." },
      { status: 402 }
    );
  }

  const { imageBase64, videoBase64 } = await req.json();

  if (!imageBase64 || !videoBase64) {
    return NextResponse.json(
      { error: "Foto und Video erforderlich." },
      { status: 400 }
    );
  }

  try {
    configureFalClient();

    const [imageUrl, drivingVideoUrl] = await Promise.all([
      uploadDataUrlImageToFal(imageBase64),
      uploadDataUrlVideoToFal(videoBase64),
    ]);

    const result = (await fal.subscribe("fal-ai/live-portrait", {
      input: {
        image_url: imageUrl,
        video_url: drivingVideoUrl,
        flag_do_crop: true,
        flag_do_rot: true,
        dsize: 512,
        scale: 2.3,
      },
    })) as { video?: { url: string }; data?: { video?: { url: string } } };

    const videoUrl = result?.data?.video?.url ?? result?.video?.url;
    if (!videoUrl) {
      return NextResponse.json(
        { error: "Kein Video generiert. Erneut versuchen." },
        { status: 500 }
      );
    }

    await supabase
      .from("profiles")
      .update({
        credits: (profile?.credits ?? 0) - CREDIT_COST,
      })
      .eq("id", user.id);

    return NextResponse.json({
      videoUrl,
      creditsLeft: (profile?.credits ?? 0) - CREDIT_COST,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Fehler";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
