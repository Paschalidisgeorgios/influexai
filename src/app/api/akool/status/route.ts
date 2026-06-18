import { NextRequest, NextResponse } from "next/server";

import { pollAkoolGeneration } from "@/lib/akool-async-route";
import { requireAkoolAccess, akoolRouteError } from "@/lib/akool-route-handler";
import type { AkoolJobPollType } from "@/lib/akool-route-handler";
import { sanitizeUserMessage } from "@/lib/sanitize-user-message";
import { developmentWriteGuardResponse } from "@/lib/environment-safety.server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const TYPE_TO_GENERATION: Record<AkoolJobPollType, string> = {
  image2video: "akool-image-to-video",
  text2video: "akool-text-to-video",
  translation: "akool-video-translation",
  lipsync: "akool-lipsync",
  characterSwap: "akool-character-studio",
  videoEditor: "akool-video-editor",
  ecommerceAds: "akool-ecommerce-ads",
};

const VALID_TYPES = new Set<string>(Object.keys(TYPE_TO_GENERATION));

export async function GET(request: NextRequest) {
  const jobId = request.nextUrl.searchParams.get("jobId");
  const type = request.nextUrl.searchParams.get("type") ?? "image2video";

  if (!jobId) {
    return NextResponse.json({ error: "jobId required" }, { status: 400 });
  }
  if (!VALID_TYPES.has(type)) {
    return NextResponse.json({ error: "Ungültiger type" }, { status: 400 });
  }

  const access = await requireAkoolAccess(0);
  if (access instanceof NextResponse) return access;
  const { userId, supabase } = access;

  const pollType = type as AkoolJobPollType;
  const generationType = TYPE_TO_GENERATION[pollType];
  const assetKind =
    pollType === "ecommerceAds"
      ? "image"
      : pollType === "lipsync" ||
          pollType === "translation" ||
          pollType === "image2video" ||
          pollType === "text2video" ||
          pollType === "characterSwap" ||
          pollType === "videoEditor"
        ? "video"
        : "video";

  const writeGuard = developmentWriteGuardResponse();
  if (writeGuard) return writeGuard;

  try {
    const result = await pollAkoolGeneration({
      supabase,
      userId,
      jobId,
      generationType,
      pollType,
      assetKind,
    });

    if (result.status === "processing") {
      return NextResponse.json({ status: "processing", progress: result.progress });
    }
    if (result.status === "failed") {
      return NextResponse.json({
        status: "failed",
        error: sanitizeUserMessage(result.error),
        refunded: result.refunded,
      });
    }
    return NextResponse.json({
      status: "completed",
      resultUrl: result.resultUrl,
      videoUrl: result.resultUrl,
      generationId: result.generationId,
      creditsLeft: result.creditsLeft,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: akoolRouteError(err) },
      { status: 500 }
    );
  }
}
