import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { runImageUpscale } from "@/lib/upscale-image-api";

export const maxDuration = 120;

/**
 * POST { generationId } — preferred (credits + storage)
 * POST { imageUrl, generationId } — imageUrl ignored; generationId required for billing
 */
export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    generationId?: string;
    imageUrl?: string;
  };

  const generationId = body.generationId?.trim();
  if (!generationId) {
    return NextResponse.json(
      {
        error:
          body.imageUrl?.trim()
            ? "Bitte generationId mitsenden — Upscale läuft über deine gespeicherte Generierung."
            : "generationId fehlt",
      },
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

  const result = await runImageUpscale(supabase, user.id, generationId);

  if (!result.ok) {
    return NextResponse.json(
      { success: false, error: result.failure.error },
      { status: result.failure.status }
    );
  }

  return NextResponse.json({ success: true, ...result.data });
}
