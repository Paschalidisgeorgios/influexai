import { NextRequest, NextResponse } from "next/server";

import {
  calculateAkoolModelCredits,
  findAkoolImageToVideoModel,
} from "@/lib/akool-models";
import { createAkoolJob } from "@/lib/akool-status";
import { runAkoolAsyncPost } from "@/lib/akool-async-route";
import { getFalKey } from "@/lib/fal-image";
import { resolveImageUrlForSeedance } from "@/lib/seedance-generate";

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
    model?: string;
    modelId?: string;
    image_url?: string;
    imageUrl?: string;
    prompt?: string;
    duration?: number;
    resolution?: string;
    last_frame_url?: string;
    lastFrameUrl?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const modelId = (body.model ?? body.modelId)?.trim() ?? "";
  const imageUrl = (body.image_url ?? body.imageUrl)?.trim() ?? "";
  const prompt = body.prompt?.trim() ?? "";

  if (!modelId || !imageUrl || !prompt) {
    return NextResponse.json(
      { error: "Modell, Bild und Prompt erforderlich" },
      { status: 400 }
    );
  }

  const model = await findAkoolImageToVideoModel(modelId);
  if (!model) {
    return NextResponse.json({ error: "Unbekanntes Modell" }, { status: 400 });
  }

  const duration =
    body.duration && model.durationList.includes(body.duration)
      ? body.duration
      : model.durationList[0];
  const resolution =
    model.resolutionList.find(
      (r) => r.value.toLowerCase() === (body.resolution ?? "").toLowerCase()
    )?.value ?? model.resolutionList[0]?.value;

  if (!resolution) {
    return NextResponse.json({ error: "Auflösung nicht verfügbar" }, { status: 400 });
  }

  const creditCost = calculateAkoolModelCredits(model, resolution, duration);
  const lastRaw = (body.last_frame_url ?? body.lastFrameUrl)?.trim();

  return runAkoolAsyncPost({
    creditCost,
    generationType: "akool-image-to-video",
    label: "Video Generator",
    pollType: "image2video",
    prompt,
    model: modelId,
    createJob: async ({ supabase, userId }) => {
      const publicImage = await resolveImageUrlForSeedance(
        supabase,
        userId,
        imageUrl
      );
      let lastFrame: string | undefined;
      if (lastRaw && model.supportedLastFrame) {
        lastFrame = await resolveImageUrlForSeedance(supabase, userId, lastRaw);
      }
      return createAkoolJob(
        "/v4/image2video/create",
        {
          model: modelId,
          image_url: publicImage,
          prompt,
          duration,
          resolution,
          last_frame_url: lastFrame,
        },
        "/v4/image2Video/createBySourcePrompt"
      );
    },
  });
}
