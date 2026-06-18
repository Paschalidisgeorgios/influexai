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
} from "@/lib/ki-influencer-api";
import { getOwnedCharacter, updateCharacter } from "@/lib/ki-influencer-db";
import { buildTrainingZipFromStorageSession } from "@/lib/ki-influencer-upload-storage";

export const dynamic = "force-dynamic";

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  const writeGuard = developmentWriteGuardResponse();
  if (writeGuard) return writeGuard;

  let body: {
    characterId?: string;
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

  const characterId = body.characterId?.trim() ?? "";

  if (!characterId) {
    return NextResponse.json(
      { success: false, error: "characterId erforderlich." },
      { status: 400 }
    );
  }

  const access = await assertKiInfluencerAccess(0);
  if (access instanceof NextResponse) return access;
  const { userId, supabase } = access;

  const character = await getOwnedCharacter(supabase, characterId, userId);
  if (!character) {
    return NextResponse.json(
      { success: false, error: "Charakter nicht gefunden." },
      { status: 404 }
    );
  }
  if (character.source !== "uploaded") {
    return NextResponse.json(
      { success: false, error: "Nur für hochgeladene Charaktere." },
      { status: 400 }
    );
  }
  if (!character.upload_session_id) {
    return NextResponse.json(
      { success: false, error: "Upload-Session fehlt." },
      { status: 400 }
    );
  }

  if (character.upload_zip_url && character.status === "training_set_ready") {
    console.log("[ki-influencer] finalize-upload", "skip", { characterId });
    return NextResponse.json({
      success: true,
      characterId,
      status: "training_set_ready",
      zipUrl: character.upload_zip_url,
      imageCount: character.upload_image_count ?? 0,
    });
  }

  console.log("[ki-influencer] finalize-upload", "running", { characterId });

  try {
    const { zipUrl, imageCount, thumbnailPath } =
      await buildTrainingZipFromStorageSession({
        userId,
        sessionId: character.upload_session_id,
      });

    await updateCharacter(supabase, characterId, userId, {
      upload_zip_url: zipUrl,
      upload_image_count: imageCount,
      casting_image_url: thumbnailPath ?? character.casting_image_url,
      status: "training_set_ready",
    });

    console.log("[ki-influencer] finalize-upload", "ok", {
      characterId,
      imageCount,
    });

    return NextResponse.json({
      success: true,
      characterId,
      status: "training_set_ready",
      zipUrl,
      imageCount,
    });
  } catch (error) {
    logKiInfluencerError("finalize-upload", error);
    console.log("[ki-influencer] finalize-upload", "error", { characterId });
    const detail = error instanceof Error ? error.message : undefined;
    return kiInfluencerErrorResponse("generation_failed", 500, detail);
  }
}
