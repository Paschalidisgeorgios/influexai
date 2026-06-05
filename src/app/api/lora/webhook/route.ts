import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { extractLoraFileUrl } from "@/lib/lora-fal";
import {
  markLoraFailed,
  markLoraReady,
} from "@/lib/lora-training-service";

export const maxDuration = 30;

type WebhookPayload = {
  request_id?: string;
  status?: string;
  payload?: unknown;
  error?: string;
  payload_error?: string;
};

export async function POST(request: NextRequest) {
  let payload: WebhookPayload;
  try {
    payload = (await request.json()) as WebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const requestId = payload.request_id;
  if (!requestId) {
    return NextResponse.json({ error: "Missing request_id" }, { status: 400 });
  }

  const service = createServiceSupabaseClient();
  const { data: lora } = await service
    .from("lora_models")
    .select("id, user_id, status")
    .eq("fal_request_id", requestId)
    .maybeSingle();

  if (!lora) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const status = (payload.status ?? "").toUpperCase();

  if (status === "COMPLETED" || status === "OK") {
    const loraUrl = extractLoraFileUrl(payload.payload);
    if (loraUrl) {
      await markLoraReady(lora.id, lora.user_id, loraUrl);
    } else {
      await markLoraFailed(lora.id, lora.user_id, "No LoRA file in webhook response");
    }
    return NextResponse.json({ ok: true });
  }

  if (status === "FAILED" || status === "ERROR") {
    await markLoraFailed(
      lora.id,
      lora.user_id,
      payload.error ?? payload.payload_error ?? "Training failed"
    );
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true, status });
}
