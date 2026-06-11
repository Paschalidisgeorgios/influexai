import { NextRequest, NextResponse } from "next/server";

import { AKOOL_TOOL_CREDITS } from "@/lib/akool-credits";
import { createAkoolSyncResult } from "@/lib/akool-status";
import { runAkoolSyncPost } from "@/lib/akool-async-route";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  let body: {
    input_text?: string;
    text?: string;
    voice_url?: string;
    voiceUrl?: string;
    rate?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const text = (body.input_text ?? body.text)?.trim() ?? "";
  const voiceUrl = (body.voice_url ?? body.voiceUrl)?.trim() ?? "";

  if (!text || !voiceUrl) {
    return NextResponse.json(
      { error: "Text und Stimm-Sample erforderlich" },
      { status: 400 }
    );
  }

  return runAkoolSyncPost({
    creditCost: AKOOL_TOOL_CREDITS.voiceClone,
    generationType: "akool-voice-clone",
    label: "Stimme klonen",
    prompt: text.slice(0, 500),
    assetKind: "audio",
    createResult: async () =>
      createAkoolSyncResult("/v4/voice/clone", {
        input_text: text,
        voice_url: voiceUrl,
        rate: body.rate ?? 1,
      }),
  });
}
