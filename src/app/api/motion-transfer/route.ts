import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getFalKey } from "@/lib/fal-image";
import { hasEnoughCredits } from "@/lib/credits";
import { runMotionTransferGeneration } from "@/lib/motion-transfer-generate";
import { MOTION_TRANSFER_CREDIT_COST } from "@/lib/motion-transfer-config";
import { sanitizeUserMessage } from "@/lib/sanitize-user-message";

export const dynamic = "force-dynamic";

export const maxDuration = 300;

type MotionTransferBody = {
  sourceImage?: string;
  referenceVideo?: string;
  sourceIsVideo?: boolean;
};

export async function POST(request: NextRequest) {
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

  if (!getFalKey()) {
    return NextResponse.json(
      { error: "Video-Engine ist nicht konfiguriert." },
      { status: 503 }
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const creditCheck = await hasEnoughCredits(
    supabase,
    user.id,
    MOTION_TRANSFER_CREDIT_COST
  );
  if (!creditCheck.ok) {
    return NextResponse.json(
      { error: "Nicht genug Credits.", credits: creditCheck.credits },
      { status: 402 }
    );
  }

  const result = await runMotionTransferGeneration(supabase, user.id, {
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
