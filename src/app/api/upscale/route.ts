import { NextRequest, NextResponse } from "next/server";

import { assertKiToolAccess } from "@/lib/access.server";
import { IMAGE_GEN_CREDITS } from "@/lib/image-generator-credits";
import { runImageUpscaleRequest } from "@/lib/upscale-image-api";
import { developmentWriteGuardResponse } from "@/lib/environment-safety.server";

export const dynamic = "force-dynamic";

export const maxDuration = 120;

/**
 * POST { generationId } — gallery image
 * POST { imageDataUrl } — uploaded image (base64 data URL)
 */
export async function POST(request: NextRequest) {
  const writeGuard = developmentWriteGuardResponse();
  if (writeGuard) return writeGuard;

  const body = (await request.json()) as {
    generationId?: string;
    imageDataUrl?: string;
  };

  const generationId = body.generationId?.trim();
  const imageDataUrl = body.imageDataUrl?.trim();

  if (!generationId && !imageDataUrl) {
    return NextResponse.json(
      { error: "generationId oder imageDataUrl erforderlich" },
      { status: 400 }
    );
  }

  const access = await assertKiToolAccess(IMAGE_GEN_CREDITS.upscale);
  if (access instanceof NextResponse) return access;
  const { userId, supabase } = access;

  const result = await runImageUpscaleRequest(supabase, userId, {
    generationId,
    imageDataUrl,
  });

  if (!result.ok) {
    return NextResponse.json(
      { success: false, error: result.failure.error },
      { status: result.failure.status }
    );
  }

  return NextResponse.json({ success: true, ...result.data });
}
