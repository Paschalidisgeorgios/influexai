import { NextResponse } from "next/server";

import { assertKiToolAccess } from "@/lib/access.server";
import { getAkoolImageToVideoModels } from "@/lib/akool-models";
import { isAkoolConfigured } from "@/lib/akool-env";
import { sanitizeUserMessage } from "@/lib/sanitize-user-message";

export const dynamic = "force-dynamic";

export const maxDuration = 60;

/** GET — available Akool image-to-video models (cached 1h server-side) */
export async function GET() {
  if (!isAkoolConfigured()) {
    return NextResponse.json(
      { error: "Video-Engine ist nicht konfiguriert." },
      { status: 503 }
    );
  }

  const access = await assertKiToolAccess(0);
  if (access instanceof NextResponse) return access;

  try {
    const models = await getAkoolImageToVideoModels();
    return NextResponse.json({ models });
  } catch (err: unknown) {
    console.error("[seedance/models GET]", err);
    return NextResponse.json(
      {
        error: sanitizeUserMessage(
          err instanceof Error
            ? err.message
            : "Modellliste konnte nicht geladen werden"
        ),
      },
      { status: 500 }
    );
  }
}
