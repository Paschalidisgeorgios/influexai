import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { deductCredits, hasEnoughCredits } from "@/lib/credits";
import { notifyGenerationCompletePush } from "@/lib/push-notifications";
import {
  createUgcTalkingAvatarVideo,
  getAkoolVideoResult,
  listUgcAvatars,
  mapAkoolVideoStatus,
  UGC_VIDEO_CREDIT_COST,
} from "@/lib/akool-ugc";
import {
  isValidElevenLabsVoiceId,
  synthesizeElevenLabsSpeech,
} from "@/lib/elevenlabs-tts";
import { configureFalClient, getFalKey } from "@/lib/fal-image";
import { uploadAudioDataUrlToFal } from "@/lib/upload-audio-fal";
import { sanitizeUserMessage } from "@/lib/sanitize-user-message";

export const maxDuration = 300;

const JOB_PROMPT_PREFIX = "ugc-video-job:";

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
        user.id,
        "UGC Video",
        "/dashboard/ugc-video"
      );
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
  };

  const script = body.script?.trim() ?? "";
  const avatarId = body.avatarId?.trim();
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

  if (!process.env.AKOOL_CLIENT_ID || !process.env.AKOOL_API_KEY) {
    return NextResponse.json(
      { error: "UGC-Video ist gerade nicht verfügbar." },
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

  const creditCheck = await hasEnoughCredits(
    supabase,
    user.id,
    UGC_VIDEO_CREDIT_COST
  );
  if (!creditCheck.ok) {
    return NextResponse.json(
      { error: `Nicht genug Credits (${UGC_VIDEO_CREDIT_COST} benötigt)` },
      { status: 402 }
    );
  }

  try {
    const avatars = await listUgcAvatars(1, 100);
    const avatar = avatars.find((a) => a.avatar_id === avatarId);
    if (!avatar) {
      return NextResponse.json({ error: "Avatar nicht gefunden" }, { status: 404 });
    }

    let audioUrl: string | undefined;
    let akoolVoiceId = voiceId || avatar.voice_id;

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
          { error: "Bitte eine Akool-Stimme wählen" },
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
    });

    return NextResponse.json({
      success: true,
      jobId: job._id,
      status: "processing",
    });
  } catch (err: unknown) {
    console.error("[ugc-video POST]", err);
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
