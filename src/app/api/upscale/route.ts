import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { runImageUpscaleRequest } from "@/lib/upscale-image-api";

export const maxDuration = 120;

/**
 * POST { generationId } — gallery image
 * POST { imageDataUrl } — uploaded image (base64 data URL)
 */
export async function POST(request: NextRequest) {
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

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const result = await runImageUpscaleRequest(supabase, user.id, {
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
