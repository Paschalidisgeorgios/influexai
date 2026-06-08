export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { fal } from "@fal-ai/client";

import { assertKiToolAccess } from "@/lib/access.server";
import { deductCredits } from "@/lib/credits";
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
  if (!getFalKey()) {
    return NextResponse.json(
      { error: "Video-Engine ist nicht konfiguriert." },
      { status: 503 }
    );
  }

  let body: {
    imageBase64?: string;
    videoBase64?: string;
    consentAccepted?: boolean;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const { imageBase64, videoBase64, consentAccepted } = body;

  if (!imageBase64 || !videoBase64) {
    return NextResponse.json(
      { error: "Foto und Video erforderlich." },
      { status: 400 }
    );
  }

  const access = await assertKiToolAccess(CREDIT_COST);
  if (access instanceof NextResponse) return access;
  const { userId, supabase } = access;

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

    const deduction = await deductCredits(
      supabase,
      userId,
      CREDIT_COST,
      "Live Portrait",
      {
        generationType: "live-portrait",
        prompt: "live-portrait",
      }
    );

    if (!deduction.success) {
      return NextResponse.json(
        { error: deduction.error ?? "Nicht genug Credits." },
        { status: 402 }
      );
    }

    return NextResponse.json({
      videoUrl,
      creditsLeft: deduction.remainingCredits,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Fehler";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
