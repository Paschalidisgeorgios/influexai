import { NextRequest, NextResponse } from "next/server";

import { assertKiToolAccess } from "@/lib/access.server";
import { isAkoolConfigured } from "@/lib/akool-env";
import { pollSeedanceJob } from "@/lib/seedance-generate";
import { sanitizeUserMessage } from "@/lib/sanitize-user-message";

export const dynamic = "force-dynamic";

export const maxDuration = 300;

/** GET ?jobId= — poll Akool image-to-video job status */
export async function GET(request: NextRequest) {
  const jobId = request.nextUrl.searchParams.get("jobId");
  if (!jobId) {
    return NextResponse.json({ error: "jobId required" }, { status: 400 });
  }

  if (!isAkoolConfigured()) {
    return NextResponse.json(
      { error: "Video-Engine ist nicht konfiguriert." },
      { status: 503 }
    );
  }

  const access = await assertKiToolAccess(0);
  if (access instanceof NextResponse) return access;
  const { userId, supabase } = access;

  try {
    const result = await pollSeedanceJob(supabase, userId, jobId);

    if (result.status === "processing") {
      return NextResponse.json({
        status: "processing",
        progress: result.progress,
      });
    }

    if (result.status === "failed") {
      return NextResponse.json({
        status: "failed",
        error: sanitizeUserMessage(result.error),
        refunded: result.refunded,
      });
    }

    return NextResponse.json({
      status: "completed",
      videoUrl: result.videoUrl,
      generationId: result.generationId,
      creditsLeft: result.creditsLeft,
    });
  } catch (err: unknown) {
    console.error("[seedance/status GET]", err);
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
