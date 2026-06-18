import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  isValidElevenLabsVoiceId,
  resolveElevenLabsVoiceId,
  synthesizeElevenLabsSpeech,
} from "@/lib/elevenlabs-tts";
import { developmentWriteGuardResponse } from "@/lib/environment-safety.server";

export const dynamic = "force-dynamic";

const PREVIEW_TEXT = "Hallo, das ist eine kurze Vorschau meiner Stimme.";
const DEFAULT_POST_TEXT = "Hallo, ich bin dein KI-Creator. Lass uns loslegen!";

function previewAudioResponse(tts: { audioDataUrl: string; mimeType: string }) {
  const base64 = tts.audioDataUrl.split(",")[1];
  if (!base64) {
    return NextResponse.json({ error: "Vorschau fehlgeschlagen" }, { status: 502 });
  }

  const buffer = Buffer.from(base64, "base64");
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": tts.mimeType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}

export async function GET(request: NextRequest) {
  const voiceId = request.nextUrl.searchParams.get("voiceId")?.trim();
  if (!voiceId || !isValidElevenLabsVoiceId(voiceId)) {
    return NextResponse.json({ error: "Ungültige Stimme" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const writeGuard = developmentWriteGuardResponse();
  if (writeGuard) return writeGuard;

  const tts = await synthesizeElevenLabsSpeech(
    PREVIEW_TEXT,
    resolveElevenLabsVoiceId(voiceId),
    75
  );

  if (!tts.ok) {
    return NextResponse.json({ error: tts.error }, { status: 502 });
  }

  return previewAudioResponse(tts);
}

export async function POST(request: NextRequest) {
  const writeGuard = developmentWriteGuardResponse();
  if (writeGuard) return writeGuard;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { voiceId?: string; text?: string };
  const voiceId = body.voiceId?.trim();
  const text = body.text?.trim() || DEFAULT_POST_TEXT;

  if (!voiceId || !isValidElevenLabsVoiceId(voiceId)) {
    return NextResponse.json({ error: "Ungültige Stimme" }, { status: 400 });
  }

  const tts = await synthesizeElevenLabsSpeech(
    text,
    resolveElevenLabsVoiceId(voiceId),
    50
  );

  if (!tts.ok) {
    return NextResponse.json({ error: tts.error ?? "ElevenLabs Fehler" }, { status: 502 });
  }

  return previewAudioResponse(tts);
}
