import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { runImageUpscale } from "@/lib/upscale-image-api";
import { developmentWriteGuardResponse } from "@/lib/environment-safety.server";

export const dynamic = "force-dynamic";

export const maxDuration = 120;

/** @deprecated Prefer POST /api/upscale */
export async function POST(request: NextRequest) {
  const writeGuard = developmentWriteGuardResponse();
  if (writeGuard) return writeGuard;

  const { generationId } = (await request.json()) as { generationId?: string };

  if (!generationId) {
    return NextResponse.json({ error: "generationId fehlt" }, { status: 400 });
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
      { error: result.failure.error },
      { status: result.failure.status }
    );
  }

  return NextResponse.json({ success: true, ...result.data });
}
