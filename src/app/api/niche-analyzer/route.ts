import { NextResponse } from "next/server";

import { analyzeNiche } from "@/app/actions/analyze-niche";

export const maxDuration = 60;

const FORMAT_LABELS: Record<string, string> = {
  youtube_shorts: "YouTube Shorts",
  long_form: "Long-form",
  beide: "Beide",
};

const AUDIENCE_LABELS: Record<string, string> = {
  "18-24": "18-24",
  "25-34": "25-34",
  "35-44": "35-44",
  alle: "Alle",
};

function httpStatusForFailure(result: {
  success: false;
  error: string;
  credits?: number;
}): number {
  if (result.error === "Nicht eingeloggt.") return 401;
  if (result.error === "Wähle einen Plan um zu starten.") return 403;
  if (
    result.error === "Nicht genug Credits." ||
    typeof result.credits === "number"
  ) {
    return 402;
  }
  if (result.error.startsWith("Bitte gib")) return 400;
  return 500;
}

/** POST /api/niche-analyzer — Body: { topic, audience?, format? } */
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

  const topic = String(body.topic ?? "").trim();
  const audienceKey = String(body.audience ?? "25-34");
  const formatKey = String(body.format ?? "youtube_shorts");

  const result = await analyzeNiche(
    topic,
    AUDIENCE_LABELS[audienceKey] ?? audienceKey,
    FORMAT_LABELS[formatKey] ?? formatKey
  );

  const status = result.success ? 200 : httpStatusForFailure(result);
  return NextResponse.json(result, { status });
}
