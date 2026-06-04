import { NextRequest, NextResponse } from "next/server";
import {
  createTalkingPhotoVideo,
  getAkoolVideoResult,
  mapAkoolVideoStatus,
} from "@/lib/akool";
import { MSG_VIDEO_SERVICE_UNAVAILABLE, sanitizeUserMessage } from "@/lib/sanitize-user-message";

export const maxDuration = 300;

/** POST — submit talking-photo job, return job id immediately */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { talking_photo_url, audio_url } = body as {
      talking_photo_url?: string;
      audio_url?: string;
      imageUrl?: string;
      audioUrl?: string;
    };

    const photoUrl = talking_photo_url ?? body.imageUrl;
    const audioUrl = audio_url ?? body.audioUrl;

    if (!photoUrl || !audioUrl) {
      return NextResponse.json(
        { success: false, error: "talking_photo_url and audio_url required" },
        { status: 400 }
      );
    }

    if (!process.env.AKOOL_CLIENT_ID || !process.env.AKOOL_API_KEY) {
      return NextResponse.json(
        { success: false, error: MSG_VIDEO_SERVICE_UNAVAILABLE },
        { status: 401 }
      );
    }

    const job = await createTalkingPhotoVideo({
      talking_photo_url: photoUrl,
      audio_url: audioUrl,
    });

    return NextResponse.json({
      success: true,
      jobId: job._id,
      status: "processing",
    });
  } catch (error: unknown) {
    const raw =
      error instanceof Error ? error.message : MSG_VIDEO_SERVICE_UNAVAILABLE;
    const status = raw.includes("authentication") ? 401 : 500;
    return NextResponse.json(
      {
        success: false,
        error: sanitizeUserMessage(raw) || MSG_VIDEO_SERVICE_UNAVAILABLE,
      },
      { status }
    );
  }
}

/** GET ?jobId= — poll Akool video status (fast, no long wait) */
export async function GET(request: NextRequest) {
  try {
    const jobId = request.nextUrl.searchParams.get("jobId");
    if (!jobId) {
      return NextResponse.json(
        { success: false, error: "jobId required" },
        { status: 400 }
      );
    }

    if (!process.env.AKOOL_CLIENT_ID || !process.env.AKOOL_API_KEY) {
      return NextResponse.json(
        { success: false, error: "Auth failed" },
        { status: 401 }
      );
    }

    const job = await getAkoolVideoResult(jobId);
    const mapped = mapAkoolVideoStatus(job.video_status);

    return NextResponse.json({
      success: true,
      status: mapped.status,
      videoUrl: job.video_status === 3 ? (job.video ?? null) : null,
      progress: mapped.progress,
      videoStatus: job.video_status,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Status check failed",
      },
      { status: 500 }
    );
  }
}
