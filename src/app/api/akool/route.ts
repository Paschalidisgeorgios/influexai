import { NextRequest, NextResponse } from "next/server";

import { assertKiToolAccess } from "@/lib/access.server";
import { getAkoolVideoResult, mapAkoolVideoStatus } from "@/lib/akool";
import {
  MSG_VIDEO_SERVICE_UNAVAILABLE,
  sanitizeUserMessage,
} from "@/lib/sanitize-user-message";

export const dynamic = "force-dynamic";

export const maxDuration = 300;

/** Matches /api/live-creator — credits are deducted on GET /api/live-creator when the job completes, not on submit. */
const CREDIT_COST = 10;

function serviceUnavailableResponse() {
  return NextResponse.json(
    { success: false, error: MSG_VIDEO_SERVICE_UNAVAILABLE },
    { status: 503 }
  );
}

function akoolConfigured(): boolean {
  return Boolean(
    process.env.AKOOL_CLIENT_ID?.trim() && process.env.AKOOL_API_KEY?.trim()
  );
}

/** POST disabled — jobs must go through POST /api/live-creator (credit deduction on completion). */
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: "Dieser Endpunkt ist deaktiviert. Bitte Live Creator verwenden.",
    },
    { status: 410 }
  );
}

/** GET ?jobId= — poll Akool video status (fast, no long wait) */
export async function GET(request: NextRequest) {
  const access = await assertKiToolAccess(CREDIT_COST);
  if (access instanceof NextResponse) return access;

  const jobId = request.nextUrl.searchParams.get("jobId");
  if (!jobId) {
    return NextResponse.json(
      { success: false, error: "jobId required" },
      { status: 400 }
    );
  }

  if (!akoolConfigured()) {
    return serviceUnavailableResponse();
  }

  try {
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
    console.error("[akool GET]", error);
    return NextResponse.json(
      {
        success: false,
        error: sanitizeUserMessage(
          error instanceof Error ? error.message : "Status check failed"
        ),
      },
      { status: 500 }
    );
  }
}
