import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { deductCredits, hasEnoughCredits, addCredits } from "@/lib/credits";
import { notifyGenerationCompletePush } from "@/lib/push-notifications";
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
import { assertGatedFeature } from "@/lib/access.server";
import { developmentWriteGuardResponse } from "@/lib/environment-safety.server";
import { isAkoolConfigured } from "@/lib/akool-env";
import { mapAkoolErrorMessage } from "@/lib/akool-errors";
import { sanitizeUserMessage } from "@/lib/sanitize-user-message";
import { createGenerationRecord } from "@/lib/generation-assets";
import { finalizeGenerationVideoFromUrl } from "@/lib/generation-protected-url";

export const dynamic = "force-dynamic";

export const maxDuration = 300;

const CREDIT_COST = 10;
const JOB_PROMPT_PREFIX = "akool-job:";

async function getGenerationForJob(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string,
  jobId: string
) {
  const { data } = await supabase
    .from("generations")
    .select("id, result")
    .eq("user_id", userId)
    .eq("type", "live-creator")
    .eq("prompt", `${JOB_PROMPT_PREFIX}${jobId}`)
    .maybeSingle();
  return data;
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

  const writeGuard = developmentWriteGuardResponse();
  if (writeGuard) return writeGuard;

  try {
    const job = await getAkoolVideoResult(jobId);
    const mapped = mapAkoolVideoStatus(job.video_status);

    if (mapped.status === "failed") {
      const failedGen = await getGenerationForJob(supabase, user.id, jobId);
      if (failedGen) {
        const resultMeta = (failedGen.result ?? {}) as Record<string, unknown>;
        if (
          resultMeta.paidOnPost === true &&
          resultMeta.refundedOnFail !== true
        ) {
          await addCredits(
            supabase,
            user.id,
            CREDIT_COST,
            "Live Creator — Refund"
          );
          await supabase
            .from("generations")
            .update({
              result: { ...resultMeta, refundedOnFail: true },
            })
            .eq("id", failedGen.id);
        }
      }
      return NextResponse.json({
        success: true,
        status: "failed",
        progress: 0,
        videoUrl: null,
        error: "Video-Generierung fehlgeschlagen",
      });
    }

    if (mapped.status !== "completed" || !job.video) {
      return NextResponse.json({
        success: true,
        status: mapped.status,
        progress: mapped.progress,
        videoUrl: null,
      });
    }

    let generation = await getGenerationForJob(supabase, user.id, jobId);
    let creditsLeft: number | undefined;

    if (!generation) {
      // Legacy deferred billing — jobs started before POST pre-pay
      const deduction = await deductCredits(
        supabase,
        user.id,
        CREDIT_COST,
        "Live Creator",
        {
          generationType: "live-creator",
          prompt: `${JOB_PROMPT_PREFIX}${jobId}`,
          skipGenerationLog: true,
        }
      );
      if (!deduction.success) {
        return NextResponse.json(
          { error: deduction.error ?? "Credit-Abzug fehlgeschlagen" },
          { status: 402 }
        );
      }
      creditsLeft = deduction.remainingCredits;

      const generationId = await createGenerationRecord(
        supabase,
        user.id,
        "live-creator",
        {
          jobId,
          paid: true,
          downloadPaid: true,
          assetKind: "video",
          mode: "final",
        },
        CREDIT_COST,
        `${JOB_PROMPT_PREFIX}${jobId}`
      );
      generation = { id: generationId, result: { jobId, paid: true } };
      notifyGenerationCompletePush(
        user.id,
        "Talking Avatar Video",
        "/dashboard/live-creator"
      );
    } else {
      const { data: profile } = await supabase
        .from("profiles")
        .select("credits")
        .eq("id", user.id)
        .single();
      creditsLeft = profile?.credits ?? undefined;
    }

    const resultMeta = (generation.result ?? {}) as Record<string, unknown>;
    const videoUrl = await finalizeGenerationVideoFromUrl(
      supabase,
      user.id,
      generation.id,
      resultMeta,
      job.video
    );

    return NextResponse.json({
      success: true,
      status: "completed",
      videoUrl,
      generationId: generation.id,
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
  const writeGuard = developmentWriteGuardResponse();
  if (writeGuard) return writeGuard;

  const denied = await assertGatedFeature("live-creator");
  if (denied) return denied;

  const body = await request.json();
  const {
    photoDataUrl,
    customAvatarUrl,
    audioSource = "own",
    script,
    voiceId,
    audioDataUrl,
    consentAccepted,
  } = body as {
    photoDataUrl?: string;
    customAvatarUrl?: string;
    audioSource?: "elevenlabs" | "own";
    script?: string;
    voiceId?: string;
    audioDataUrl?: string;
    consentAccepted?: boolean;
  };

  if (consentAccepted !== true) {
    return NextResponse.json(
      { error: "Consent erforderlich", code: "CONSENT_REQUIRED" },
      { status: 403 }
    );
  }

  const trimmedCustomAvatarUrl = customAvatarUrl?.trim() ?? "";
  const trimmedPhotoDataUrl = photoDataUrl?.trim() ?? "";

  if (!trimmedCustomAvatarUrl && !trimmedPhotoDataUrl) {
    return NextResponse.json({ error: "Foto ist erforderlich" }, { status: 400 });
  }

  if (!isAkoolConfigured()) {
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

  let finalAudioDataUrl: string;
  const trimmedScript = script?.trim() ?? "";

  if (audioSource === "own") {
    if (!audioDataUrl) {
      return NextResponse.json(
        { error: "Bitte nimm deine Stimme auf" },
        { status: 400 }
      );
    }
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
  }

  let creditsReserved = false;
  let creditsLeft: number | undefined;

  try {
    const deduction = await deductCredits(
      supabase,
      user.id,
      CREDIT_COST,
      "Live Creator",
      {
        generationType: "live-creator",
        prompt: `${JOB_PROMPT_PREFIX}pending`,
        skipGenerationLog: true,
      }
    );
    if (!deduction.success) {
      return NextResponse.json(
        { error: deduction.error ?? "Credit-Abzug fehlgeschlagen" },
        { status: 402 }
      );
    }
    creditsReserved = true;
    creditsLeft = deduction.remainingCredits;

    if (audioSource === "own") {
      finalAudioDataUrl = audioDataUrl!;
    } else {
      const tts = await synthesizeElevenLabsSpeech(trimmedScript, voiceId!, 75);
      if (!tts.ok) {
        throw new Error(tts.error);
      }
      finalAudioDataUrl = tts.audioDataUrl;
    }

    configureFalClient();
    const akoolAudioUrl = await uploadAudioDataUrlToFal(finalAudioDataUrl);
    const talkingPhotoUrl = trimmedCustomAvatarUrl
      ? trimmedCustomAvatarUrl
      : await uploadDataUrlToFal(trimmedPhotoDataUrl);

    const job = await createTalkingPhotoVideo({
      talking_photo_url: talkingPhotoUrl,
      audio_url: akoolAudioUrl,
    });

    await createGenerationRecord(
      supabase,
      user.id,
      "live-creator",
      {
        jobId: job._id,
        paid: true,
        paidOnPost: true,
        downloadPaid: true,
        assetKind: "video",
        mode: "final",
      },
      CREDIT_COST,
      `${JOB_PROMPT_PREFIX}${job._id}`
    );

    return NextResponse.json({
      success: true,
      jobId: job._id,
      status: "processing",
      creditsLeft,
    });
  } catch (err: unknown) {
    if (creditsReserved) {
      await addCredits(supabase, user.id, CREDIT_COST, "Live Creator — Refund");
    }
    console.error("[live-creator POST]", err);
    const raw = err instanceof Error ? err.message : "Video-Generierung fehlgeschlagen";
    return NextResponse.json(
      {
        error: sanitizeUserMessage(mapAkoolErrorMessage(raw, "general")),
      },
      { status: 500 }
    );
  }
}
