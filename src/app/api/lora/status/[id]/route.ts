import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  extractLoraFileUrl,
  getLoraQueueStatus,
  parseTrainingProgress,
} from "@/lib/lora-fal";
import { trainingFalEndpoint } from "@/lib/lora-config";
import {
  markLoraFailed,
  markLoraReady,
} from "@/lib/lora-training-service";
import type { LoraModelType } from "@/lib/lora-config";
import { providerRouteGuardResponse } from "@/lib/environment-safety.server";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const { data: lora, error } = await supabase
    .from("lora_models")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !lora) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (lora.status !== "training" || !lora.fal_request_id) {
    return NextResponse.json({
      id: lora.id,
      status: lora.status,
      progress: lora.progress ?? (lora.status === "ready" ? 100 : 0),
      loraUrl: lora.lora_url,
      errorMessage: lora.error_message,
    });
  }

  const writeGuard = providerRouteGuardResponse();
  if (writeGuard) return writeGuard;

  try {
    const endpoint = trainingFalEndpoint(lora.type as LoraModelType);
    const queueStatus = await getLoraQueueStatus(endpoint, lora.fal_request_id);
    const qStatus = (queueStatus.status ?? "").toUpperCase();
    const progress = parseTrainingProgress(queueStatus.logs, lora.steps ?? 1000);

    if (progress > (lora.progress ?? 0)) {
      await supabase
        .from("lora_models")
        .update({ progress })
        .eq("id", id);
    }

    if (qStatus === "COMPLETED") {
      const loraUrl = extractLoraFileUrl(queueStatus.response);
      if (loraUrl) {
        await markLoraReady(lora.id, user.id, loraUrl);

        return NextResponse.json({
          id: lora.id,
          status: "ready",
          progress: 100,
          loraUrl,
          logs: queueStatus.logs?.slice(-5).map((l) => l.message).filter(Boolean),
        });
      }
    }

    if (qStatus === "FAILED") {
      await markLoraFailed(lora.id, user.id, queueStatus.error ?? "Training failed");

      return NextResponse.json({
        id: lora.id,
        status: "failed",
        errorMessage: queueStatus.error,
      });
    }

    const logLines =
      queueStatus.logs?.slice(-8).map((l) => l.message).filter(Boolean) ?? [];

    return NextResponse.json({
      id: lora.id,
      status: "training",
      progress,
      steps: lora.steps,
      queueStatus: queueStatus.status,
      logs: logLines,
    });
  } catch (err) {
    return NextResponse.json({
      id: lora.id,
      status: lora.status,
      progress: lora.progress ?? 0,
      pollError: err instanceof Error ? err.message : "Poll failed",
    });
  }
}
