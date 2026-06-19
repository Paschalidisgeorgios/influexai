import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  extractLoraFileUrl,
  getLoraQueueStatus,
  parseTrainingProgress,
} from "@/lib/lora-fal";
import { trainingFalEndpoint } from "@/lib/lora-config";
import { markLoraFailed, markLoraReady } from "@/lib/lora-training-service";
import type { LoraModelType } from "@/lib/lora-config";
import { getOwnedCharacter, updateCharacter } from "@/lib/ki-influencer-db";
import { providerRouteGuardResponse } from "@/lib/environment-safety.server";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: characterId } = await context.params;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht eingeloggt." }, { status: 401 });
  }

  const character = await getOwnedCharacter(supabase, characterId, user.id);
  if (!character) {
    return NextResponse.json({ error: "Charakter nicht gefunden." }, { status: 404 });
  }

  if (!character.lora_id) {
    return NextResponse.json({
      characterId,
      status: character.status,
      progress: 0,
    });
  }

  const { data: lora } = await supabase
    .from("lora_models")
    .select("*")
    .eq("id", character.lora_id)
    .eq("user_id", user.id)
    .single();

  if (!lora) {
    return NextResponse.json({ error: "LoRA nicht gefunden." }, { status: 404 });
  }

  if (lora.status === "ready") {
    if (character.status !== "ready") {
      const writeGuard = providerRouteGuardResponse();
      if (writeGuard) return writeGuard;

      await updateCharacter(supabase, characterId, user.id, {
        status: "ready",
        lora_ref: lora.lora_url,
      });
    }
    return NextResponse.json({
      characterId,
      status: "ready",
      progress: 100,
      loraId: lora.id,
      loraUrl: lora.lora_url,
      triggerWord: character.trigger_word ?? lora.trigger_word,
    });
  }

  if (lora.status === "failed") {
    const writeGuard = providerRouteGuardResponse();
    if (writeGuard) return writeGuard;

    await updateCharacter(supabase, characterId, user.id, { status: "failed" });
    return NextResponse.json({
      characterId,
      status: "failed",
      errorMessage: lora.error_message,
    });
  }

  if (lora.status !== "training" || !lora.fal_request_id) {
    return NextResponse.json({
      characterId,
      status: character.status,
      loraStatus: lora.status,
      progress: lora.progress ?? 0,
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
      await supabase.from("lora_models").update({ progress }).eq("id", lora.id);
    }

    if (qStatus === "COMPLETED") {
      const loraUrl = extractLoraFileUrl(queueStatus.response);
      if (loraUrl) {
        await markLoraReady(lora.id, user.id, loraUrl);
        await updateCharacter(supabase, characterId, user.id, {
          status: "ready",
          lora_ref: loraUrl,
        });
        return NextResponse.json({
          characterId,
          status: "ready",
          progress: 100,
          loraUrl,
          triggerWord: character.trigger_word ?? lora.trigger_word,
        });
      }
    }

    if (qStatus === "FAILED") {
      await markLoraFailed(lora.id, user.id, queueStatus.error ?? "Training failed");
      await updateCharacter(supabase, characterId, user.id, { status: "failed" });
      return NextResponse.json({
        characterId,
        status: "failed",
        errorMessage: queueStatus.error,
      });
    }

    return NextResponse.json({
      characterId,
      status: "training",
      progress,
      steps: lora.steps,
      logs:
        queueStatus.logs?.slice(-8).map((l) => l.message).filter(Boolean) ?? [],
    });
  } catch (err) {
    return NextResponse.json({
      characterId,
      status: "training",
      progress: lora.progress ?? 0,
      pollError: err instanceof Error ? err.message : "Poll failed",
    });
  }
}
