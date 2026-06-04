import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { deductCredits, hasEnoughCredits } from "@/lib/credits";
import {
  isValidElevenLabsVoiceId,
  synthesizeElevenLabsSpeech,
} from "@/lib/elevenlabs-tts";
import { configureFalClient, getFalKey, uploadDataUrlToFal } from "@/lib/fal-image";
import { uploadAudioDataUrlToFal } from "@/lib/upload-audio-fal";
import {
  createTalkingPhotoVideo,
  getAkoolVideoResult,
  mapAkoolVideoStatus,
} from "@/lib/akool";

export const maxDuration = 300;

const CREDIT_COST = 10;
const JOB_PROMPT_PREFIX = "akool-job:";

async function generationExistsForJob(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string,
  jobId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("generations")
    .select("id")
    .eq("user_id", userId)
    .eq("type", "live-creator")
    .eq("prompt", `${JOB_PROMPT_PREFIX}${jobId}`)
    .maybeSingle();
  return !!data;
}

/** GET ?jobId= — poll status and deduct credits once when video is ready */
export async function GET(request: NextRequest) {
  const jobId = request.nextUrl.searchParams.get("jobId");
  if (!jobId) {
    return NextResponse.json({ error: "jobId required" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  try {
    const job = await getAkoolVideoResult(jobId);
    const mapped = mapAkoolVideoStatus(job.video_status);

    if (mapped.status !== "completed" || !job.video) {
      return NextResponse.json({
        success: true,
        status: mapped.status,
        progress: mapped.progress,
        videoUrl: null,
      });
    }

    const alreadyCharged = await generationExistsForJob(
      supabase,
      user.id,
      jobId
    );

    let creditsLeft: number | undefined;
    if (!alreadyCharged) {
      const deduction = await deductCredits(
        supabase,
        user.id,
        CREDIT_COST,
        "Live Creator",
        {
          generationType: "live-creator",
          prompt: job.video.slice(0, 500),
        }
      );
      if (!deduction.success) {
        return NextResponse.json(
          { error: deduction.error ?? "Credit-Abzug fehlgeschlagen" },
          { status: 402 }
        );
      }
      creditsLeft = deduction.remainingCredits;
    } else {
      const { data: profile } = await supabase
        .from("profiles")
        .select("credits")
        .eq("id", user.id)
        .single();
      creditsLeft = profile?.credits ?? undefined;
    }

    return NextResponse.json({
      success: true,
      status: "completed",
      videoUrl: job.video,
      progress: 100,
      creditsLeft,
    });
  } catch (err: unknown) {
    console.error("[live-creator GET]", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Status-Abfrage fehlgeschlagen",
      },
      { status: 500 }
    );
  }
}

/** POST — upload media, start Akool job, return jobId immediately (no blocking wait) */
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
      { error: "Avatar-Video ist gerade nicht verfügbar." },
      { status: 503 }
    );
  }
  if (!getFalKey()) {
    return NextResponse.json(
      { error: "Medien-Upload ist gerade nicht verfügbar." },
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
        { error: "ElevenLabs ist gerade nicht verfügbar." },
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

    return NextResponse.json({
      success: true,
      jobId: job._id,
      status: "processing",
    });
  } catch (err: unknown) {
    console.error("[live-creator POST]", err);
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
