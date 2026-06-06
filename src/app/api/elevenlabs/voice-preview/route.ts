import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  isValidElevenLabsVoiceId,
  resolveElevenLabsVoiceId,
  synthesizeElevenLabsSpeech,
} from "@/lib/elevenlabs-tts";

const PREVIEW_TEXT = "Hallo, das ist eine kurze Vorschau meiner Stimme.";

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

  const tts = await synthesizeElevenLabsSpeech(
    PREVIEW_TEXT,
    resolveElevenLabsVoiceId(voiceId),
    75
  );

  if (!tts.ok) {
    return NextResponse.json({ error: tts.error }, { status: 502 });
  }

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
