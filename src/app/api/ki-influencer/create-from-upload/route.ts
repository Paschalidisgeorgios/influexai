import { NextRequest, NextResponse } from "next/server";
import {
  assertKiInfluencerAccess,
  kiInfluencerErrorResponse,
  logKiInfluencerError,
  mapSupabaseWriteError,
} from "@/lib/ki-influencer-api";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    name?: string;
    sessionId?: string;
    zipUrl?: string;
    thumbnailPath?: string;
    imageCount?: number;
  };

  const name = body.name?.trim() ?? "";
  const sessionId = body.sessionId?.trim() ?? "";
  const zipUrl = body.zipUrl?.trim() ?? "";
  const thumbnailPath = body.thumbnailPath?.trim() ?? "";
  const imageCount = body.imageCount ?? 0;

  if (!name || !sessionId || !zipUrl || imageCount < 10) {
    return NextResponse.json(
      { error: "Name, sessionId, zipUrl und mindestens 10 Fotos erforderlich." },
      { status: 400 }
    );
  }

  const access = await assertKiInfluencerAccess(0);
  if (access instanceof NextResponse) return access;
  const { userId, supabase } = access;

  try {
    const { data, error } = await supabase
      .from("characters")
      .insert({
        user_id: userId,
        name,
        description: "Eigene Fotos hochgeladen",
        source: "uploaded",
        upload_session_id: sessionId,
        upload_zip_url: zipUrl,
        upload_image_count: imageCount,
        casting_image_url: thumbnailPath || null,
        status: "training_set_ready",
      })
      .select("id")
      .single();

    if (error || !data?.id) {
      if (error) {
        return mapSupabaseWriteError("create-from-upload insert", error);
      }
      return kiInfluencerErrorResponse("generation_failed", 500);
    }

    return NextResponse.json({
      success: true,
      characterId: data.id,
      status: "training_set_ready",
      source: "uploaded",
    });
  } catch (error) {
    logKiInfluencerError("create-from-upload", error);
    return kiInfluencerErrorResponse("generation_failed", 500);
  }
}
