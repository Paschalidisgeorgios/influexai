import { NextRequest, NextResponse } from "next/server";

import { AKOOL_TOOL_CREDITS } from "@/lib/akool-credits";
import { createAkoolJob } from "@/lib/akool-status";
import { runAkoolAsyncPost } from "@/lib/akool-async-route";
import { developmentWriteGuardResponse } from "@/lib/environment-safety.server";
import { firstUnsafeExternalUrlMessage } from "@/lib/security/url-validation";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const writeGuard = developmentWriteGuardResponse();
  if (writeGuard) return writeGuard;

  let body: {
    video_url?: string;
    videoUrl?: string;
    audio_url?: string;
    audioUrl?: string;
    model?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const videoUrl = (body.video_url ?? body.videoUrl)?.trim() ?? "";
  const audioUrl = (body.audio_url ?? body.audioUrl)?.trim() ?? "";

  if (!videoUrl || !audioUrl) {
    return NextResponse.json(
      { error: "Video- und Audio-URL erforderlich" },
      { status: 400 }
    );
  }

  const unsafeUrl = firstUnsafeExternalUrlMessage([
    { value: videoUrl, label: "Video-URL" },
    { value: audioUrl, label: "Audio-URL" },
  ]);
  if (unsafeUrl) {
    return NextResponse.json({ error: unsafeUrl }, { status: 400 });
  }

  return runAkoolAsyncPost({
    creditCost: AKOOL_TOOL_CREDITS.lipsync,
    generationType: "akool-lipsync",
    label: "Lip Sync",
    pollType: "lipsync",
    prompt: "Lip Sync",
    createJob: async () =>
      createAkoolJob("/v3/lipsync/create", {
        video_url: videoUrl,
        audio_url: audioUrl,
        model: body.model,
      }),
  });
}
