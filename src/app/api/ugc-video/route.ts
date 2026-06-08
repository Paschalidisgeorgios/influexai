import { NextRequest, NextResponse } from "next/server";

import { assertKiToolAccess } from "@/lib/access.server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { deductCredits } from "@/lib/credits";
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

async function generationExistsForJob(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string,
  jobId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("generations")
    .select("id")
    .eq("user_id", userId)
    .eq("type", "ugc-video")
    .eq("prompt", `${JOB_PROMPT_PREFIX}${jobId}`)
    .maybeSingle();
  return !!data;
}

/** GET ?jobId= — poll status and deduct credits once when ready */
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

    const alreadyCharged = await generationExistsForJob(
      supabase,
      userId,
      jobId
    );

    let creditsLeft: number | undefined;
    if (!alreadyCharged) {
      const deduction = await deductCredits(
        supabase,
        userId,
        UGC_VIDEO_CREDIT_COST,
        "UGC Video",
        {
          generationType: "ugc-video",
          prompt: `${JOB_PROMPT_PREFIX}${jobId}`,
        }
      );
      if (!deduction.success) {
        return NextResponse.json(
          { error: deduction.error ?? "Credit-Abzug fehlgeschlagen" },
          { status: 402 }
        );
      }
      creditsLeft = deduction.remainingCredits;
      notifyGenerationCompletePush(
        userId,
        "UGC Video",
        "/dashboard/ugc-video"
      );
    } else {
      const { data: profile } = await supabase
        .from("profiles")
        .select("credits")
        .eq("id", userId)
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

/** POST — start UGC talking avatar video */
export async function POST(request: NextRequest) {
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

  if (!process.env.AKOOL_CLIENT_ID || !process.env.AKOOL_API_KEY) {
    return NextResponse.json(
      { error: "UGC-Video ist gerade nicht verfügbar." },
      { status: 503 }
    );
  }

  const access = await assertKiToolAccess(UGC_VIDEO_CREDIT_COST);
  if (access instanceof NextResponse) return access;

  try {
    const avatars = await listUgcAvatars(1, 100);
    const lookupId =
      customPhotoUrl && (!avatarId || avatarId === "custom")
        ? CUSTOM_AVATAR_BASE_ID
        : avatarId;
    const avatar = avatars.find((a) => a.avatar_id === lookupId);
    if (!avatar) {
      return NextResponse.json({ error: "Avatar nicht gefunden" }, { status: 404 });
    }

    let avatarImageUrl: string | undefined;
    if (customPhotoUrl) {
      const targetImageUrl = avatar.thumbnail ?? avatar.url;
      if (!targetImageUrl) {
        return NextResponse.json(
          { error: "Avatar-Vorschaubild nicht verfügbar" },
          { status: 400 }
        );
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
        return NextResponse.json({ error: "Ungültige Stimme" }, { status: 400 });
      }
      if (!process.env.ELEVENLABS_API_KEY) {
        return NextResponse.json(
          { error: "ElevenLabs ist gerade nicht verfügbar." },
          { status: 503 }
        );
      }
      if (!getFalKey()) {
        return NextResponse.json(
          { error: "Audio-Upload ist gerade nicht verfügbar." },
          { status: 503 }
        );
      }

      const tts = await synthesizeElevenLabsSpeech(script, voiceId, 75);
      if (!tts.ok) {
        return NextResponse.json({ error: tts.error }, { status: 502 });
      }
      configureFalClient();
      audioUrl = await uploadAudioDataUrlToFal(tts.audioDataUrl);
    } else {
      if (!akoolVoiceId) {
        return NextResponse.json(
          { error: "Bitte eine InfluexAI Voice wählen" },
          { status: 400 }
        );
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

    return NextResponse.json({
      success: true,
      jobId: job._id,
      status: "processing",
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
