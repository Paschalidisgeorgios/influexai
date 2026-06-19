import { NextRequest, NextResponse } from "next/server";

import { assertKiToolAccess } from "@/lib/access.server";
import {
  calculateAkoolModelCredits,
  findAkoolImageToVideoModel,
} from "@/lib/akool-models";
import { isAkoolConfigured } from "@/lib/akool-env";
import { getFalKey } from "@/lib/fal-image";
import { mapAkoolErrorMessage } from "@/lib/akool-errors";
import { startSeedanceJob } from "@/lib/seedance-generate";
import { sanitizeUserMessage } from "@/lib/sanitize-user-message";
import { providerRouteGuardResponse } from "@/lib/environment-safety.server";

export const dynamic = "force-dynamic";

export const maxDuration = 300;

type SeedanceBody = {
  imageUrl?: string;
  image_url?: string;
  prompt?: string;
  modelId?: string;
  duration?: number;
  resolution?: string;
  lastFrameUrl?: string;
  last_frame_url?: string;
};

export async function POST(request: NextRequest) {
  const writeGuard = providerRouteGuardResponse();
  if (writeGuard) return writeGuard;

  let body: SeedanceBody;
  try {
    body = (await request.json()) as SeedanceBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const imageUrl = (body.imageUrl ?? body.image_url)?.trim() ?? "";
  const prompt = body.prompt?.trim() ?? "";
  const modelId = body.modelId?.trim() ?? "";
  const lastFrameUrl = (body.lastFrameUrl ?? body.last_frame_url)?.trim();

  if (!imageUrl) {
    return NextResponse.json({ error: "Bild-URL erforderlich" }, { status: 400 });
  }
  if (!prompt) {
    return NextResponse.json(
      { error: "Bewegungs-Prompt erforderlich" },
      { status: 400 }
    );
  }
  if (!modelId) {
    return NextResponse.json({ error: "Modell erforderlich" }, { status: 400 });
  }

  if (!isAkoolConfigured()) {
    return NextResponse.json(
      { error: "Video-Engine ist nicht konfiguriert." },
      { status: 503 }
    );
  }
  if (!getFalKey()) {
    return NextResponse.json(
      { error: "Medien-Upload ist gerade nicht verfügbar." },
      { status: 503 }
    );
  }

  const model = await findAkoolImageToVideoModel(modelId);
  if (!model) {
    return NextResponse.json({ error: "Unbekanntes Video-Modell" }, { status: 400 });
  }

  const duration =
    body.duration && model.durationList.includes(body.duration)
      ? body.duration
      : model.durationList[0];

  const resolution =
    model.resolutionList.find(
      (item) =>
        item.value.toLowerCase() === (body.resolution ?? "").toLowerCase()
    )?.value ?? model.resolutionList[0]?.value;

  if (!resolution) {
    return NextResponse.json(
      { error: "Auflösung nicht verfügbar" },
      { status: 400 }
    );
  }

  const creditCost = calculateAkoolModelCredits(model, resolution, duration);

  const access = await assertKiToolAccess(creditCost);
  if (access instanceof NextResponse) return access;
  const { userId, supabase } = access;

  const result = await startSeedanceJob(supabase, userId, {
    imageUrl,
    prompt,
    modelId,
    duration,
    resolution,
    lastFrameUrl,
  });

  if (!result.ok) {
    const status =
      result.error.includes("Credits") || result.error.includes("Credit")
        ? 402
        : 500;
    return NextResponse.json(
      {
        error: sanitizeUserMessage(
          mapAkoolErrorMessage(result.error, "general")
        ),
      },
      { status }
    );
  }

  return NextResponse.json({
    jobId: result.jobId,
    generationId: result.generationId,
    status: "processing",
    creditsCharged: result.creditsUsed,
    creditsLeft: result.creditsLeft,
  });
}
