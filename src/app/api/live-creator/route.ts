import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { deductCredits, hasEnoughCredits } from "@/lib/credits";
import {
  isValidElevenLabsVoiceId,
  synthesizeElevenLabsSpeech,
} from "@/lib/elevenlabs-tts";
import {
  configureFalClient,
  getFalKey,
  uploadDataUrlToFal,
} from "@/lib/fal-image";
import { fal } from "@fal-ai/client";
import {
  createTalkingPhotoVideo,
  waitForAkoolVideo,
} from "@/lib/akool";

const CREDIT_COST = 10;
async function uploadAudioDataUrlToFal(audioDataUrl: string): Promise<string> {
  const base64Data = audioDataUrl.replace(/^data:audio\/\w+;base64,/, "");
  const buffer = Buffer.from(base64Data, "base64");
  const blob = new Blob([buffer], { type: "audio/mpeg" });
  const file = new File([blob], "speech.mp3", { type: "audio/mpeg" });
  return fal.storage.upload(file);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    photoDataUrl,
    script,
    voiceId,
  } = body as {
    photoDataUrl?: string;
    script?: string;
    voiceId?: string;
  };

  const trimmedScript = script?.trim();
  if (!photoDataUrl || !trimmedScript) {
    return NextResponse.json(
      { error: "Foto und Script sind erforderlich" },
      { status: 400 }
    );
  }
  if (trimmedScript.length > 500) {
    return NextResponse.json(
      { error: "Maximal 500 Zeichen" },
      { status: 400 }
    );
  }
  if (!voiceId || !isValidElevenLabsVoiceId(voiceId)) {
    return NextResponse.json({ error: "Ungültige Stimme" }, { status: 400 });
  }

  if (!process.env.AKOOL_CLIENT_ID || !process.env.AKOOL_API_KEY) {
    return NextResponse.json(
      { error: "Akool API ist nicht konfiguriert" },
      { status: 503 }
    );
  }
  if (!process.env.ELEVENLABS_API_KEY) {
    return NextResponse.json(
      { error: "ElevenLabs API ist nicht konfiguriert" },
      { status: 503 }
    );
  }
  if (!getFalKey()) {
    return NextResponse.json(
      { error: "FAL_KEY fehlt für Medien-Upload" },
      { status: 503 }
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const creditCheck = await hasEnoughCredits(supabase, user.id, CREDIT_COST);
  if (!creditCheck.ok) {
    return NextResponse.json(
      { error: "Nicht genug Credits (10 benötigt)" },
      { status: 402 }
    );
  }

  try {
    configureFalClient();
    const tts = await synthesizeElevenLabsSpeech(trimmedScript, voiceId, 50);
    if (!tts.ok) {
      return NextResponse.json({ error: tts.error }, { status: 502 });
    }
    const audioDataUrl = tts.audioDataUrl;
    const [talkingPhotoUrl, audioUrl] = await Promise.all([
      uploadDataUrlToFal(photoDataUrl),
      uploadAudioDataUrlToFal(audioDataUrl),
    ]);

    const job = await createTalkingPhotoVideo({
      talking_photo_url: talkingPhotoUrl,
      audio_url: audioUrl,
    });

    const videoUrl = await waitForAkoolVideo(job._id);

    const deduction = await deductCredits(
      supabase,
      user.id,
      CREDIT_COST,
      "Live Creator – Talking Avatar",
      { generationType: "live-creator", prompt: trimmedScript.slice(0, 200) }
    );

    if (!deduction.success) {
      return NextResponse.json(
        { error: deduction.error ?? "Credit-Abzug fehlgeschlagen" },
        { status: 402 }
      );
    }

    return NextResponse.json({
      success: true,
      videoUrl,
      creditsLeft: deduction.remainingCredits,
    });
  } catch (err: unknown) {
    console.error("[live-creator]", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Video-Generierung fehlgeschlagen",
      },
      { status: 500 }
    );
  }
}
