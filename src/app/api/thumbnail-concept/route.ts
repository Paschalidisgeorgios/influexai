import { NextResponse } from "next/server";

import { generateThumbnailConcepts } from "@/app/actions/generate-thumbnail";
import {
  resolveThumbnailColorEnergy,
  resolveThumbnailStyle,
} from "@/lib/canvas/tool-param-validation";

export const maxDuration = 90;

function httpStatusForFailure(result: {
  success: false;
  error: string;
}): number {
  if (result.error.includes("eingeloggt")) return 401;
  if (result.error.includes("Plan")) return 403;
  if (result.error.includes("Credits")) return 402;
  if (result.error.startsWith("Bitte gib")) return 400;
  return 500;
}

/** POST /api/thumbnail-concept — Body: { topic, style?, colorEnergy? } */
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
  const style = resolveThumbnailStyle(
    typeof body.style === "string" ? body.style : undefined
  );
  const colorEnergy = resolveThumbnailColorEnergy(
    typeof body.colorEnergy === "string" ? body.colorEnergy : undefined
  );

  const result = await generateThumbnailConcepts({
    topic,
    style,
    colorEnergy,
  });

  const status = result.success ? 200 : httpStatusForFailure(result);
  return NextResponse.json(result, { status });
}
