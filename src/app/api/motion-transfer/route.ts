import { NextRequest, NextResponse } from "next/server";

import { assertKiToolAccess } from "@/lib/access.server";
import { getFalKey } from "@/lib/fal-image";
import { runMotionTransferGeneration } from "@/lib/motion-transfer-generate";
import { MOTION_TRANSFER_CREDIT_COST } from "@/lib/motion-transfer-config";
import { sanitizeUserMessage } from "@/lib/sanitize-user-message";
import { firstUnsafeExternalUrlMessage } from "@/lib/security/url-validation";
import { providerRouteGuardResponse } from "@/lib/environment-safety.server";

export const dynamic = "force-dynamic";

export const maxDuration = 300;

type MotionTransferBody = {
  sourceImage?: string;
  referenceVideo?: string;
  sourceIsVideo?: boolean;
};

export async function POST(request: NextRequest) {
  const writeGuard = providerRouteGuardResponse();
  if (writeGuard) return writeGuard;

  let body: MotionTransferBody;
  try {
    body = (await request.json()) as MotionTransferBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const sourceImage = body.sourceImage?.trim() ?? "";
  const referenceVideo = body.referenceVideo?.trim() ?? "";

  if (!sourceImage || !referenceVideo) {
    return NextResponse.json(
      { error: "Bild und Video erforderlich." },
      { status: 400 }
    );
  }

  const unsafeUrl = firstUnsafeExternalUrlMessage([
    { value: sourceImage, label: "Bild-/Video-URL" },
    { value: referenceVideo, label: "Video-URL" },
  ]);
  if (unsafeUrl) {
    return NextResponse.json({ error: unsafeUrl }, { status: 400 });
  }

  if (!getFalKey()) {
    return NextResponse.json(
      { error: "Video-Engine ist nicht konfiguriert." },
      { status: 503 }
    );
  }

  const access = await assertKiToolAccess(MOTION_TRANSFER_CREDIT_COST);
  if (access instanceof NextResponse) return access;
  const { userId, supabase } = access;

  const result = await runMotionTransferGeneration(supabase, userId, {
    sourceImage,
    referenceVideo,
    sourceIsVideo: body.sourceIsVideo === true,
  });

  if (!result.ok) {
    const status =
      result.error.includes("Credits") || result.error.includes("Credit")
        ? 402
        : 500;
    return NextResponse.json(
      { error: sanitizeUserMessage(result.error) },
      { status }
    );
  }

  return NextResponse.json({
    videoUrl: result.videoUrl,
    generationId: result.generationId,
    creditsLeft: result.creditsLeft,
  });
}
