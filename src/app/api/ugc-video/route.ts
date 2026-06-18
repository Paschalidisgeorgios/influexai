import { NextRequest, NextResponse } from "next/server";

import { assertKiToolAccess } from "@/lib/access.server";
import { developmentWriteGuardResponse } from "@/lib/environment-safety.server";
import { isAkoolConfigured } from "@/lib/akool-env";
import { withCreditDeduction } from "@/lib/credits-with-refund";
import { notifyGenerationCompletePush } from "@/lib/push-notifications";
import {
  createUgcTalkingAvatarVideo,
  getAkoolVideoResult,
  listUgcAvatars,
  mapAkoolVideoStatus,
  UGC_VIDEO_CREDIT_COST,
} from "@/lib/akool-ugc";
import {
  createImageFaceswap,
  createFaceswapPlus,
  waitForFaceswapUrl,
} from "@/lib/akool-faceswap";
import { AkoolFaceswapError } from "@/lib/akool-errors";
import {
  isValidElevenLabsVoiceId,
  synthesizeElevenLabsSpeech,
} from "@/lib/elevenlabs-tts";
import { configureFalClient, getFalKey } from "@/lib/fal-image";
import { uploadAudioDataUrlToFal } from "@/lib/upload-audio-fal";
import { sanitizeUserMessage } from "@/lib/sanitize-user-message";
import { createGenerationRecord } from "@/lib/generation-assets";
import {
  finalizeGenerationVideoFromUrl,
} from "@/lib/generation-protected-url";
import { unsafeExternalUrlMessage } from "@/lib/security/url-validation";
import type { SupabaseClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export const maxDuration = 300;

const JOB_PROMPT_PREFIX = "ugc-video-job:";
const CUSTOM_AVATAR_BASE_ID = "sonya_01";

async function swapCustomFaceOntoAvatar(
  customPhotoUrl: string,
  avatarImageUrl: string
): Promise<string> {
  let job;
  try {
    job = await createFaceswapPlus({
      sourceFaceUrl: customPhotoUrl,
      targetMediaUrl: avatarImageUrl,
    });
  } catch {
    job = await createImageFaceswap({
      modifyImageUrl: avatarImageUrl,
      targetFaceUrl: customPhotoUrl,
    });
  }
  return waitForFaceswapUrl(job._id);
}

async function getGenerationForJob(
  supabase: SupabaseClient,
  userId: string,
  jobId: string
) {
  const { data } = await supabase
    .from("generations")
    .select("id, result")
    .eq("user_id", userId)
    .eq("type", "ugc-video")
    .eq("prompt", `${JOB_PROMPT_PREFIX}${jobId}`)
    .maybeSingle();
  return data;
}

/** GET ?jobId= — poll status (credits deducted on POST) */
export async function GET(request: NextRequest) {
  const jobId = request.nextUrl.searchParams.get("jobId");
  if (!jobId) {
    return NextResponse.json({ error: "jobId required" }, { status: 400 });
  }

  const access = await assertKiToolAccess(0);
  if (access instanceof NextResponse) return access;
  const { userId, supabase } = access;

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

    const generation = await getGenerationForJob(supabase, userId, jobId);
    if (!generation) {
      return NextResponse.json(
        { error: "Generierung nicht gefunden." },
        { status: 404 }
      );
    }

    const resultMeta = (generation.result ?? {}) as Record<string, unknown>;

    const videoUrl = await finalizeGenerationVideoFromUrl(
      supabase,
      userId,
      generation.id,
      resultMeta,
      job.video
    );

    if (resultMeta.notified !== true) {
      notifyGenerationCompletePush(
        userId,
        "UGC Video",
        "/dashboard/ugc-video"
      );
      await supabase
        .from("generations")
        .update({
          result: {
            ...resultMeta,
            notified: true,
          },
        })
        .eq("id", generation.id);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", userId)
      .single();

    return NextResponse.json({
      success: true,
      status: "completed",
      videoUrl,
      generationId: generation.id,
      progress: 100,
      creditsLeft: profile?.credits ?? undefined,
    });
  } catch (err: unknown) {
    console.error("[ugc-video GET]", err);
    return NextResponse.json(
      {
        error: sanitizeUserMessage(
          err instanceof Error ? err.message : "Status-Abfrage fehlgeschlagen"
        ),
      },
      { status: 500 }
    );
  }
}

/** POST — start UGC talking avatar video (deduct-first) */
export async function POST(request: NextRequest) {
  const writeGuard = developmentWriteGuardResponse();
  if (writeGuard) return writeGuard;

  const body = (await request.json()) as {
    avatarId?: string;
    script?: string;
    voiceSource?: "akool" | "elevenlabs";
    voiceId?: string;
    language?: string;
    aspectRatio?: "9:16" | "16:9";
    customPhotoUrl?: string;
    consentAccepted?: boolean;
  };

  const script = body.script?.trim() ?? "";
  const avatarId = body.avatarId?.trim();
  const customPhotoUrl = body.customPhotoUrl?.trim();
  const voiceSource = body.voiceSource ?? "akool";
  const voiceId = body.voiceId?.trim();
  const aspectRatio = body.aspectRatio ?? "9:16";

  if (!avatarId) {
    return NextResponse.json({ error: "Bitte einen Avatar wählen" }, { status: 400 });
  }
  if (!script) {
    return NextResponse.json({ error: "Script ist erforderlich" }, { status: 400 });
  }
  if (script.length > 500) {
    return NextResponse.json({ error: "Maximal 500 Zeichen" }, { status: 400 });
  }

  if (customPhotoUrl && body.consentAccepted !== true) {
    return NextResponse.json(
      {
        error:
          "Bitte bestätige die Einwilligung, bevor die KI-Verarbeitung startet.",
        code: "CONSENT_REQUIRED",
      },
      { status: 400 }
    );
  }

  if (customPhotoUrl) {
    const unsafeUrl = unsafeExternalUrlMessage(customPhotoUrl, "Bild-URL");
    if (unsafeUrl) {
      return NextResponse.json({ error: unsafeUrl }, { status: 400 });
    }
  }

  if (!isAkoolConfigured()) {
    return NextResponse.json(
      { error: "UGC-Video ist gerade nicht verfügbar." },
      { status: 503 }
    );
  }

  const access = await assertKiToolAccess(UGC_VIDEO_CREDIT_COST);
  if (access instanceof NextResponse) return access;
  const { userId, supabase } = access;

  try {
    const deductionResult = await withCreditDeduction(
      {
        supabase,
        userId,
        amount: UGC_VIDEO_CREDIT_COST,
        description: "UGC Video",
        skipGenerationLog: true,
        generationType: "ugc-video",
        prompt: script.slice(0, 500),
      },
      async () => {
        const avatars = await listUgcAvatars(1, 100);
        const lookupId =
          customPhotoUrl && (!avatarId || avatarId === "custom")
            ? CUSTOM_AVATAR_BASE_ID
            : avatarId;
        const avatar = avatars.find((a) => a.avatar_id === lookupId);
        if (!avatar) {
          throw new Error("Avatar nicht gefunden");
        }

        let avatarImageUrl: string | undefined;
        if (customPhotoUrl) {
          const targetImageUrl = avatar.thumbnail ?? avatar.url;
          if (!targetImageUrl) {
            throw new Error("Avatar-Vorschaubild nicht verfügbar");
          }
          avatarImageUrl = await swapCustomFaceOntoAvatar(
            customPhotoUrl,
            targetImageUrl
          );
        }

        let audioUrl: string | undefined;
        const akoolVoiceId = voiceId || avatar.voice_id;

        if (voiceSource === "elevenlabs") {
          if (!voiceId || !isValidElevenLabsVoiceId(voiceId)) {
            throw new Error("Ungültige Stimme");
          }
          if (!process.env.ELEVENLABS_API_KEY) {
            throw new Error("ElevenLabs ist gerade nicht verfügbar.");
          }
          if (!getFalKey()) {
            throw new Error("Audio-Upload ist gerade nicht verfügbar.");
          }

          const tts = await synthesizeElevenLabsSpeech(script, voiceId, 75);
          if (!tts.ok) {
            throw new Error(tts.error);
          }
          configureFalClient();
          audioUrl = await uploadAudioDataUrlToFal(tts.audioDataUrl);
        } else {
          if (!akoolVoiceId) {
            throw new Error("Bitte eine InfluexAI Voice wählen");
          }
        }

        const job = await createUgcTalkingAvatarVideo({
          avatar: { avatar_id: avatar.avatar_id, from: avatar.from },
          script,
          voiceId: akoolVoiceId ?? "",
          aspectRatio,
          audioUrl,
          avatarImageUrl,
        });

        await createGenerationRecord(
          supabase,
          userId,
          "ugc-video",
          {
            jobId: job._id,
            paid: true,
            assetKind: "video",
            mode: "final",
          },
          UGC_VIDEO_CREDIT_COST,
          `${JOB_PROMPT_PREFIX}${job._id}`
        );

        return { jobId: job._id, status: "processing" as const };
      }
    );

    if (!deductionResult.ok) {
      const status =
        deductionResult.error === "Avatar nicht gefunden" ? 404 : deductionResult.status;
      return NextResponse.json(
        { error: deductionResult.error },
        { status }
      );
    }

    return NextResponse.json({
      success: true,
      ...deductionResult.data,
      creditsLeft: deductionResult.remainingCredits,
    });
  } catch (err: unknown) {
    console.error("[ugc-video POST]", err);
    if (err instanceof AkoolFaceswapError) {
      return NextResponse.json(
        { error: sanitizeUserMessage(err.userMessage) },
        { status: 400 }
      );
    }
    return NextResponse.json(
      {
        error: sanitizeUserMessage(
          err instanceof Error ? err.message : "Video-Generierung fehlgeschlagen"
        ),
      },
      { status: 500 }
    );
  }
}
