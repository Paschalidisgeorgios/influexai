import { NextResponse } from "next/server";
import { detectOutliers } from "@/app/actions/detect-outliers";

export const maxDuration = 60;

function httpStatusForDetectFailure(result: {
  success: false;
  error: string;
  credits?: number;
  required?: number;
}): number {
  if (result.error === "Nicht eingeloggt.") return 401;
  if (
    result.error === "Nicht genug Credits." ||
    typeof result.credits === "number"
  ) {
    return 402;
  }
  if (result.error.startsWith("Bitte gib")) return 400;
  return 500;
}

/**
 * POST /api/outlier-detector
 * Body: { niche, period?, platform?, channelSize?, language? }
 * Requires logged-in session (same as dashboard Server Action).
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const result = await detectOutliers(
    String(body.niche ?? ""),
    String(body.period ?? "Letzter Monat"),
    String(body.platform ?? "YouTube Shorts"),
    String(body.channelSize ?? "Alle"),
    body.language ? String(body.language) : undefined
  );

  const status = result.success
    ? 200
    : httpStatusForDetectFailure(result);
  return NextResponse.json(result, { status });
}
