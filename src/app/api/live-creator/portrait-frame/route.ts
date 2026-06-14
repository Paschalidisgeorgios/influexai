import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { withCreditDeduction } from "@/lib/credits-with-refund";
import { configureFalClient, getFalKey, uploadDataUrlToFal } from "@/lib/fal-image";
import {
  FAL_LIVE_PORTRAIT_FALLBACK,
  LIVE_CREATOR_PORTRAIT_CREDIT_COST,
} from "@/lib/live-creator-config";
import {
  createGenerationRecord,
  ingestFinalAssetFromUrl,
  updateGenerationResult,
} from "@/lib/generation-assets";
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

function extractFrameUrl(result: unknown): {
  url: string | null;
  kind: "image" | "video";
} {
  const r = result as {
    data?: {
      image?: { url?: string };
      video?: { url?: string };
    };
    image?: { url?: string };
    video?: { url?: string };
  };
  const videoUrl = r.data?.video?.url ?? r.video?.url ?? null;
  if (videoUrl) {
    return { url: videoUrl, kind: "video" };
  }
  const imageUrl = r.data?.image?.url ?? r.image?.url ?? null;
  return { url: imageUrl, kind: "image" };
}

function protectedAssetUrl(generationId: string, kind: "image" | "video") {
  return kind === "video"
    ? `/api/generated-video/${generationId}`
    : `/api/generated-image/${generationId}?variant=final`;
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

  try {
    configureFalClient();

    const deductionResult = await withCreditDeduction(
      {
        supabase,
        userId: user.id,
        amount: LIVE_CREATOR_PORTRAIT_CREDIT_COST,
        description: "Live Creator — Portrait-Frame",
        generationType: "live-creator",
        skipGenerationLog: true,
      },
      async () => {
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

        const { url: mediaUrl, kind } = extractFrameUrl(result);
        if (!mediaUrl) {
          throw new Error("Kein Animations-Frame erhalten");
        }

        const generationId = await createGenerationRecord(
          supabase,
          user.id,
          "live-creator",
          {
            paid: true,
            downloadPaid: true,
            assetKind: kind,
            mode: "final",
            model: FAL_LIVE_PORTRAIT_FALLBACK,
          },
          LIVE_CREATOR_PORTRAIT_CREDIT_COST,
          "Live Creator — Portrait-Frame"
        );

        const { path: finalPath } = await ingestFinalAssetFromUrl(
          user.id,
          generationId,
          mediaUrl,
          kind
        );

        await updateGenerationResult(supabase, generationId, user.id, {
          finalPath,
          credits_used: LIVE_CREATOR_PORTRAIT_CREDIT_COST,
        });

        return {
          imageUrl: protectedAssetUrl(generationId, kind),
        };
      }
    );

    if (!deductionResult.ok) {
      return NextResponse.json(
        { error: deductionResult.error },
        { status: deductionResult.status }
      );
    }

    return NextResponse.json({
      success: true,
      imageUrl: deductionResult.data.imageUrl,
      mode: "live-portrait-fallback",
      creditsUsed: LIVE_CREATOR_PORTRAIT_CREDIT_COST,
      creditsLeft: deductionResult.remainingCredits,
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
