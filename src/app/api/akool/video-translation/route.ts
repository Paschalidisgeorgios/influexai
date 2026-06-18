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
    source_language?: string;
    sourceLanguage?: string;
    target_language?: string;
    targetLanguage?: string;
    voice_clone?: boolean;
    voiceClone?: boolean;
    duration_minutes?: number;
    durationMinutes?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const videoUrl = (body.video_url ?? body.videoUrl)?.trim() ?? "";
  const targetLanguage = (body.target_language ?? body.targetLanguage)?.trim() ?? "de";
  const sourceLanguage = (body.source_language ?? body.sourceLanguage)?.trim() ?? "auto";
  const voiceClone = body.voice_clone ?? body.voiceClone ?? false;
  const minutes = Math.max(
    1,
    Math.ceil(body.duration_minutes ?? body.durationMinutes ?? 1)
  );

  if (!videoUrl) {
    return NextResponse.json({ error: "Video-URL erforderlich" }, { status: 400 });
  }

  const unsafeUrl = firstUnsafeExternalUrlMessage([
    { value: videoUrl, label: "Video-URL" },
  ]);
  if (unsafeUrl) {
    return NextResponse.json({ error: unsafeUrl }, { status: 400 });
  }

  const creditCost = minutes * AKOOL_TOOL_CREDITS.videoTranslationPerMinute;

  return runAkoolAsyncPost({
    creditCost,
    generationType: "akool-video-translation",
    label: "Video Übersetzer",
    pollType: "translation",
    prompt: `${sourceLanguage}→${targetLanguage}`,
    createJob: async () =>
      createAkoolJob("/v3/videoTranslation/create", {
        video_url: videoUrl,
        source_language: sourceLanguage,
        target_language: targetLanguage,
        voice_clone: voiceClone,
      }),
  });
}
