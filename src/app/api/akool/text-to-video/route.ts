import { NextRequest, NextResponse } from "next/server";

import { AKOOL_TOOL_CREDITS } from "@/lib/akool-credits";
import {
  calculateAkoolModelCredits,
  findAkoolTextToVideoModel,
  getAkoolTextToVideoModels,
} from "@/lib/akool-models";
import { createAkoolJob } from "@/lib/akool-status";
import { runAkoolAsyncPost } from "@/lib/akool-async-route";
import { providerRouteGuardResponse } from "@/lib/environment-safety.server";
import { requireAkoolAccess } from "@/lib/akool-route-handler";
import { isAkoolConfigured } from "@/lib/akool-env";
import { sanitizeUserMessage } from "@/lib/sanitize-user-message";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET() {
  if (!isAkoolConfigured()) {
    return NextResponse.json({ error: "Akool nicht konfiguriert" }, { status: 503 });
  }
  const access = await requireAkoolAccess(0);
  if (access instanceof NextResponse) return access;
  try {
    const models = await getAkoolTextToVideoModels();
    return NextResponse.json({ models });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: sanitizeUserMessage(err instanceof Error ? err.message : "Fehler") },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const writeGuard = providerRouteGuardResponse();
  if (writeGuard) return writeGuard;

  let body: {
    model?: string;
    modelId?: string;
    prompt?: string;
    duration?: number;
    resolution?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const modelId = (body.model ?? body.modelId)?.trim() ?? "";
  const prompt = body.prompt?.trim() ?? "";
  if (!modelId || !prompt) {
    return NextResponse.json({ error: "Modell und Prompt erforderlich" }, { status: 400 });
  }

  const model = await findAkoolTextToVideoModel(modelId);
  const duration =
    body.duration && model?.durationList.includes(body.duration)
      ? body.duration
      : model?.durationList[0] ?? 5;
  const resolution =
    model?.resolutionList.find(
      (r) => r.value.toLowerCase() === (body.resolution ?? "").toLowerCase()
    )?.value ??
    model?.resolutionList[0]?.value ??
    "720p";

  const creditCost = model
    ? calculateAkoolModelCredits(model, resolution, duration)
    : AKOOL_TOOL_CREDITS.textToVideo;

  return runAkoolAsyncPost({
    creditCost,
    generationType: "akool-text-to-video",
    label: "Text zu Video",
    pollType: "text2video",
    prompt,
    model: modelId,
    createJob: async () =>
      createAkoolJob(
        "/v4/text2video/create",
        { model: modelId, prompt, duration, resolution },
        "/v4/text2Video/createBySourcePrompt"
      ),
  });
}
