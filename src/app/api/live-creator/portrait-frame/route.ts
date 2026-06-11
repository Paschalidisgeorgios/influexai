import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { deductCredits, hasEnoughCredits } from "@/lib/credits";
import { configureFalClient, getFalKey, uploadDataUrlToFal } from "@/lib/fal-image";
import {
  FAL_LIVE_PORTRAIT_FALLBACK,
  LIVE_CREATOR_PORTRAIT_CREDIT_COST,
} from "@/lib/live-creator-config";
import { fal } from "@fal-ai/client";
import { assertGatedFeature } from "@/lib/access.server";

export const dynamic = "force-dynamic";

export const maxDuration = 300;

type PortraitFrameBody = {
  sourceImage?: string;
  drivingFrame?: string;
  drivingVideoDataUrl?: string;
  consentAccepted?: boolean;
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
  const { sourceImage, drivingFrame, drivingVideoDataUrl, consentAccepted } = body;

  if (consentAccepted !== true) {
    return NextResponse.json(
      {
        error:
          "Bitte bestätige die Einwilligung, bevor die KI-Verarbeitung startet.",
        code: "CONSENT_REQUIRED",
      },
      { status: 400 }
    );
  }

  if (!sourceImage) {
    return NextResponse.json({ error: "sourceImage required" }, { status: 400 });
  }

  if (!drivingFrame && !drivingVideoDataUrl) {
    return NextResponse.json(
      { error: "drivingFrame or drivingVideoDataUrl required" },
      { status: 400 }
    );
  }

  const creditCheck = await hasEnoughCredits(
    supabase,
    user.id,
    LIVE_CREATOR_PORTRAIT_CREDIT_COST
  );
  if (!creditCheck.ok) {
    return NextResponse.json(
      {
        error: `Nicht genug Credits (${LIVE_CREATOR_PORTRAIT_CREDIT_COST} benötigt)`,
        credits: creditCheck.credits,
      },
      { status: 402 }
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

    const deduction = await deductCredits(
      supabase,
      user.id,
      LIVE_CREATOR_PORTRAIT_CREDIT_COST,
      "Live Creator — Portrait-Frame",
      {
        generationType: "live-creator",
        skipGenerationLog: true,
      }
    );

    if (!deduction.success) {
      return NextResponse.json(
        { error: deduction.error ?? "Credit-Abzug fehlgeschlagen" },
        { status: 402 }
      );
    }

    return NextResponse.json({
      success: true,
      imageUrl: mediaUrl,
      mode: "live-portrait-fallback",
      creditsUsed: LIVE_CREATOR_PORTRAIT_CREDIT_COST,
      creditsLeft: deduction.remainingCredits,
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
