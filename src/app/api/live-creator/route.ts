import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { deductCredits, hasEnoughCredits } from "@/lib/credits";
import {
  isValidElevenLabsVoiceId,
  synthesizeElevenLabsSpeech,
} from "@/lib/elevenlabs-tts";
import { configureFalClient, getFalKey, uploadDataUrlToFal } from "@/lib/fal-image";
import { uploadAudioDataUrlToFal } from "@/lib/upload-audio-fal";
import { createTalkingPhotoVideo, waitForAkoolVideo } from "@/lib/akool";

const CREDIT_COST = 10;

export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    photoDataUrl,
    audioSource = "own",
    script,
    voiceId,
    audioDataUrl,
  } = body as {
    photoDataUrl?: string;
    audioSource?: "elevenlabs" | "own";
    script?: string;
    voiceId?: string;
    audioDataUrl?: string;
  };

  if (!photoDataUrl) {
    return NextResponse.json({ error: "Foto ist erforderlich" }, { status: 400 });
  }

  if (!process.env.AKOOL_CLIENT_ID || !process.env.AKOOL_API_KEY) {
    return NextResponse.json(
      { error: "Akool API ist nicht konfiguriert" },
      { status: 503 }
    );
  }
  if (!getFalKey()) {
    return NextResponse.json(
      { error: "FAL_KEY fehlt für Medien-Upload" },
      { status: 503 }
    );
  }

  let finalAudioDataUrl: string;
  const trimmedScript = script?.trim() ?? "";

  if (audioSource === "own") {
    if (!audioDataUrl) {
      return NextResponse.json(
        { error: "Bitte nimm deine Stimme auf" },
        { status: 400 }
      );
    }
    finalAudioDataUrl = audioDataUrl;
  } else {
    if (!trimmedScript) {
      return NextResponse.json({ error: "Script ist erforderlich" }, { status: 400 });
    }
    if (trimmedScript.length > 500) {
      return NextResponse.json({ error: "Maximal 500 Zeichen" }, { status: 400 });
    }
    if (!voiceId || !isValidElevenLabsVoiceId(voiceId)) {
      return NextResponse.json({ error: "Ungültige Stimme" }, { status: 400 });
    }
    if (!process.env.ELEVENLABS_API_KEY) {
      return NextResponse.json(
        { error: "ElevenLabs API ist nicht konfiguriert" },
        { status: 503 }
      );
    }

    const tts = await synthesizeElevenLabsSpeech(trimmedScript, voiceId, 75);
    if (!tts.ok) {
      return NextResponse.json({ error: tts.error }, { status: 502 });
    }
    finalAudioDataUrl = tts.audioDataUrl;
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
    const [talkingPhotoUrl, akoolAudioUrl] = await Promise.all([
      uploadDataUrlToFal(photoDataUrl),
      uploadAudioDataUrlToFal(finalAudioDataUrl),
    ]);

    const job = await createTalkingPhotoVideo({
      talking_photo_url: talkingPhotoUrl,
      audio_url: akoolAudioUrl,
    });

    const videoUrl = await waitForAkoolVideo(job._id);

    const deduction = await deductCredits(
      supabase,
      user.id,
      CREDIT_COST,
      audioSource === "own"
        ? "Live Creator – Eigene Stimme"
        : "Live Creator – KI Stimme",
      {
        generationType: "live-creator",
        prompt: trimmedScript.slice(0, 200) || "own-voice",
      }
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
