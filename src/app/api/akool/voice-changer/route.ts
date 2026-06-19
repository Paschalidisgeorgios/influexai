import { NextRequest, NextResponse } from "next/server";

import { AKOOL_TOOL_CREDITS } from "@/lib/akool-credits";
import { createAkoolSyncResult } from "@/lib/akool-status";
import { runAkoolSyncPost } from "@/lib/akool-async-route";
import { providerRouteGuardResponse } from "@/lib/environment-safety.server";
import { firstUnsafeExternalUrlMessage } from "@/lib/security/url-validation";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const writeGuard = providerRouteGuardResponse();
  if (writeGuard) return writeGuard;

  let body: {
    audio_url?: string;
    audioUrl?: string;
    voice_id?: string;
    voiceId?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const audioUrl = (body.audio_url ?? body.audioUrl)?.trim() ?? "";
  const voiceId = (body.voice_id ?? body.voiceId)?.trim() ?? "";

  if (!audioUrl || !voiceId) {
    return NextResponse.json(
      { error: "Audio und Zielstimme erforderlich" },
      { status: 400 }
    );
  }

  const unsafeUrl = firstUnsafeExternalUrlMessage([
    { value: audioUrl, label: "Audio-URL" },
  ]);
  if (unsafeUrl) {
    return NextResponse.json({ error: unsafeUrl }, { status: 400 });
  }

  return runAkoolSyncPost({
    creditCost: AKOOL_TOOL_CREDITS.voiceChanger,
    generationType: "akool-voice-changer",
    label: "Stimme ändern",
    prompt: voiceId,
    assetKind: "audio",
    createResult: async () =>
      createAkoolSyncResult("/v4/voice/change", {
        audio_url: audioUrl,
        voice_id: voiceId,
      }),
  });
}
