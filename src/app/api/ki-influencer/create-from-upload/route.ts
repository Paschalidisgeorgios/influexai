import { NextRequest, NextResponse } from "next/server";
import {
  consentRequiredResponse,
  KI_INFLUENCER_UPLOAD_CONSENT_MESSAGE,
  readIdentityUploadConsentFromJson,
} from "@/lib/consent.server";
import { developmentWriteGuardResponse } from "@/lib/environment-safety.server";
import {
  assertKiInfluencerAccess,
  kiInfluencerErrorResponse,
  logKiInfluencerError,
  mapSupabaseWriteError,
} from "@/lib/ki-influencer-api";

export const dynamic = "force-dynamic";

export const maxDuration = 15;

export async function POST(request: NextRequest) {
  const writeGuard = developmentWriteGuardResponse();
  if (writeGuard) return writeGuard;

  let body: {
    name?: string;
    sessionId?: string;
    thumbnailPath?: string;
    imageCount?: number;
    consentAccepted?: boolean | string;
    rightsConfirmed?: boolean | string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Ungültige JSON-Daten." },
      { status: 400 }
    );
  }

  if (!readIdentityUploadConsentFromJson(body)) {
    return consentRequiredResponse(KI_INFLUENCER_UPLOAD_CONSENT_MESSAGE);
  }

  const name = body.name?.trim() ?? "";
  const sessionId = body.sessionId?.trim() ?? "";
  const thumbnailPath = body.thumbnailPath?.trim() ?? "";
  const imageCount = body.imageCount ?? 0;

  if (!name || !sessionId || imageCount < 10) {
    return NextResponse.json(
      {
        success: false,
        error: "Name, sessionId und mindestens 10 Fotos erforderlich.",
      },
      { status: 400 }
    );
  }

  const access = await assertKiInfluencerAccess(0);
  if (access instanceof NextResponse) return access;
  const { userId, supabase } = access;

  console.log("[ki-influencer] create-from-upload", "running", {
    sessionId,
    imageCount,
  });

  try {
    const { data, error } = await supabase
      .from("characters")
      .insert({
        user_id: userId,
        name,
        description: "Eigene Fotos hochgeladen",
        source: "uploaded",
        upload_session_id: sessionId,
        upload_zip_url: null,
        upload_image_count: imageCount,
        casting_image_url: thumbnailPath || null,
        status: "upload_ready",
      })
      .select("id")
      .single();

    if (error || !data?.id) {
      if (error) {
        console.log("[ki-influencer] create-from-upload", "error", error.message);
        return mapSupabaseWriteError("create-from-upload insert", error);
      }
      return kiInfluencerErrorResponse("generation_failed", 500);
    }

    console.log("[ki-influencer] create-from-upload", "ok", {
      characterId: data.id,
    });

    return NextResponse.json({
      success: true,
      characterId: data.id,
      status: "upload_ready",
      source: "uploaded",
    });
  } catch (error) {
    logKiInfluencerError("create-from-upload", error);
    console.log("[ki-influencer] create-from-upload", "error");
    return kiInfluencerErrorResponse("generation_failed", 500);
  }
}
