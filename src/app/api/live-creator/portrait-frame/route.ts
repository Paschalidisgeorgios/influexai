import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { configureFalClient, getFalKey, uploadDataUrlToFal } from "@/lib/fal-image";
import { FAL_LIVE_PORTRAIT_FALLBACK } from "@/lib/live-creator-config";
import { fal } from "@fal-ai/client";
import { assertGatedFeature } from "@/lib/access.server";

export const maxDuration = 60;

type PortraitFrameBody = {
  sourceImage?: string;
  drivingFrame?: string;
  drivingVideoDataUrl?: string;
};

function extractFrameUrl(result: unknown): string | null {
  const r = result as {
    data?: {
      image?: { url?: string };
      video?: { url?: string };
    };
    image?: { url?: string };
    video?: { url?: string };
  };
  return (
    r.data?.image?.url ??
    r.image?.url ??
    r.data?.video?.url ??
    r.video?.url ??
    null
  );
}

/** Fallback: poll live-portrait with webcam clip (2–5 fps). */
export async function POST(request: NextRequest) {
  const denied = await assertGatedFeature("live-creator");
  if (denied) return denied;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  if (!getFalKey()) {
    return NextResponse.json(
      { error: "Live Creator ist gerade nicht verfügbar." },
      { status: 503 }
    );
  }

  const body = (await request.json()) as PortraitFrameBody;
  const { sourceImage, drivingFrame, drivingVideoDataUrl } = body;

  if (!sourceImage) {
    return NextResponse.json({ error: "sourceImage required" }, { status: 400 });
  }

  if (!drivingFrame && !drivingVideoDataUrl) {
    return NextResponse.json(
      { error: "drivingFrame or drivingVideoDataUrl required" },
      { status: 400 }
    );
  }

  try {
    configureFalClient();

    const [imageUrl, drivingUrl] = await Promise.all([
      uploadDataUrlToFal(sourceImage),
      drivingVideoDataUrl
        ? uploadDataUrlToFal(drivingVideoDataUrl)
        : uploadDataUrlToFal(drivingFrame!),
    ]);

    const result = await fal.subscribe(FAL_LIVE_PORTRAIT_FALLBACK, {
      input: {
        image_url: imageUrl,
        video_url: drivingUrl,
        dsize: 512,
        batch_size: 8,
        flag_stitching: true,
        flag_pasteback: true,
        flag_relative: true,
      },
      logs: false,
    });

    const mediaUrl = extractFrameUrl(result);
    if (!mediaUrl) {
      return NextResponse.json(
        { error: "Kein Animations-Frame erhalten" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      imageUrl: mediaUrl,
      mode: "live-portrait-fallback",
    });
  } catch (err: unknown) {
    console.error("[live-creator/portrait-frame]", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Portrait-Frame konnte nicht generiert werden",
      },
      { status: 500 }
    );
  }
}
