import { NextRequest, NextResponse } from "next/server";

import { AKOOL_TOOL_CREDITS } from "@/lib/akool-credits";
import { createAkoolJob } from "@/lib/akool-status";
import { runAkoolAsyncPost } from "@/lib/akool-async-route";
import { getFalKey } from "@/lib/fal-image";
import { resolveImageUrlForSeedance } from "@/lib/seedance-generate";
import { firstUnsafeExternalUrlMessage } from "@/lib/security/url-validation";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  if (!getFalKey()) {
    return NextResponse.json(
      { error: "Medien-Upload ist gerade nicht verfügbar." },
      { status: 503 }
    );
  }

  let body: {
    image_url?: string;
    imageUrl?: string;
    video_url?: string;
    videoUrl?: string;
    mode?: "animate" | "replace";
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const imageUrl = (body.image_url ?? body.imageUrl)?.trim() ?? "";
  const videoUrl = (body.video_url ?? body.videoUrl)?.trim() ?? "";
  const mode = body.mode === "replace" ? "replace" : "animate";

  if (!imageUrl || !videoUrl) {
    return NextResponse.json(
      { error: "Charakterbild und Video erforderlich" },
      { status: 400 }
    );
  }

  const unsafeUrl = firstUnsafeExternalUrlMessage([
    { value: videoUrl, label: "Video-URL" },
  ]);
  if (unsafeUrl) {
    return NextResponse.json({ error: unsafeUrl }, { status: 400 });
  }

  return runAkoolAsyncPost({
    creditCost: AKOOL_TOOL_CREDITS.characterStudio,
    generationType: "akool-character-studio",
    label: "Character Studio",
    pollType: "characterSwap",
    prompt: mode,
    createJob: async ({ supabase, userId }) => {
      const publicImage = await resolveImageUrlForSeedance(
        supabase,
        userId,
        imageUrl
      );
      return createAkoolJob("/v4/characterSwap/create", {
        image_url: publicImage,
        video_url: videoUrl,
        mode,
      });
    },
  });
}
