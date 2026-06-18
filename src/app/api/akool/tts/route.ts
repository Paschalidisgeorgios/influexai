import { NextRequest, NextResponse } from "next/server";

import { AKOOL_TOOL_CREDITS } from "@/lib/akool-credits";
import { createAkoolSyncResult } from "@/lib/akool-status";
import { runAkoolSyncPost } from "@/lib/akool-async-route";
import { developmentWriteGuardResponse } from "@/lib/environment-safety.server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const writeGuard = developmentWriteGuardResponse();
  if (writeGuard) return writeGuard;

  let body: {
    text?: string;
    voice_id?: string;
    voiceId?: string;
    language?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const text = body.text?.trim() ?? "";
  const voiceId = (body.voice_id ?? body.voiceId)?.trim() ?? "";

  if (!text || !voiceId) {
    return NextResponse.json(
      { error: "Text und Stimme erforderlich" },
      { status: 400 }
    );
  }
  if (text.length > 5000) {
    return NextResponse.json({ error: "Maximal 5000 Zeichen" }, { status: 400 });
  }

  return runAkoolSyncPost({
    creditCost: AKOOL_TOOL_CREDITS.tts,
    generationType: "akool-tts",
    label: "Text zu Sprache",
    prompt: text.slice(0, 500),
    assetKind: "audio",
    createResult: async () =>
      createAkoolSyncResult("/v4/voice/tts", {
        text,
        voice_id: voiceId,
        language: body.language ?? "de",
      }),
  });
}
