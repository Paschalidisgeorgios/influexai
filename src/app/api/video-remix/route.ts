import { NextResponse } from "next/server";
import { remixVideo } from "@/app/actions/remix-video";
import { assertGatedFeature } from "@/lib/access.server";
import { developmentWriteGuardResponse } from "@/lib/environment-safety.server";

export const maxDuration = 60;

/**
 * POST /api/video-remix
 * Body: { mode: "url"|"manual", url?, originalTitle?, videoDescription?, niche, remixStyle }
 * Requires logged-in session (same as dashboard Server Action).
 *
 * Note: Video Remix uses Claude for concepts — not fal.ai video rendering.
 */
export async function POST(request: Request) {
  const writeGuard = developmentWriteGuardResponse();
  if (writeGuard) return writeGuard;

  const denied = await assertGatedFeature("video-remix");
  if (denied) return denied;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const mode = body.mode === "manual" ? "manual" : "url";

  const result = await remixVideo({
    mode,
    url: body.url ? String(body.url) : undefined,
    originalTitle: body.originalTitle
      ? String(body.originalTitle)
      : undefined,
    videoDescription: body.videoDescription
      ? String(body.videoDescription)
      : undefined,
    niche: String(body.niche ?? ""),
    remixStyle: String(body.remixStyle ?? "Gleiche Idee, andere Zielgruppe"),
  });

  const status = result.success ? 200 : 400;
  return NextResponse.json(result, { status });
}
