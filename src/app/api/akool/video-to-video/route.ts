import { NextRequest, NextResponse } from "next/server";

import { AKOOL_TOOL_CREDITS } from "@/lib/akool-credits";
import { createAkoolJob } from "@/lib/akool-status";
import { runAkoolAsyncPost } from "@/lib/akool-async-route";
import { providerRouteGuardResponse } from "@/lib/environment-safety.server";
import { firstUnsafeExternalUrlMessage } from "@/lib/security/url-validation";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const writeGuard = providerRouteGuardResponse();
  if (writeGuard) return writeGuard;

  let body: {
    video_url?: string;
    videoUrl?: string;
    style_prompt?: string;
    stylePrompt?: string;
    strength?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const videoUrl = (body.video_url ?? body.videoUrl)?.trim() ?? "";
  const stylePrompt = (body.style_prompt ?? body.stylePrompt)?.trim() ?? "";

  if (!videoUrl || !stylePrompt) {
    return NextResponse.json(
      { error: "Video und Stil-Prompt erforderlich" },
      { status: 400 }
    );
  }

  const unsafeUrl = firstUnsafeExternalUrlMessage([
    { value: videoUrl, label: "Video-URL" },
  ]);
  if (unsafeUrl) {
    return NextResponse.json({ error: unsafeUrl }, { status: 400 });
  }

  const strength = Math.min(100, Math.max(0, body.strength ?? 50));

  return runAkoolAsyncPost({
    creditCost: AKOOL_TOOL_CREDITS.videoEditor,
    generationType: "akool-video-editor",
    label: "Video Editor",
    pollType: "videoEditor",
    prompt: stylePrompt.slice(0, 500),
    createJob: async () =>
      createAkoolJob("/v3/video/style-transfer", {
        video_url: videoUrl,
        style_prompt: stylePrompt,
        strength,
      }),
  });
}
