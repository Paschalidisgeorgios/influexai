import { NextResponse } from "next/server";
import { akoolGet } from "@/lib/akool";
import { requireAkoolAccess } from "@/lib/akool-route-handler";
import { isAkoolConfigured } from "@/lib/akool-env";
import { sanitizeUserMessage } from "@/lib/sanitize-user-message";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isAkoolConfigured()) {
    return NextResponse.json({ error: "Sprachdienst nicht konfiguriert" }, { status: 503 });
  }
  const access = await requireAkoolAccess(0);
  if (access instanceof NextResponse) return access;

  try {
    const json = await akoolGet<Array<{ voice_id?: string; name?: string; label?: string }>>(
      "/v4/voice/list"
    );
    if (json.code === 1000 && Array.isArray(json.data) && json.data.length > 0) {
      const voices = json.data.map((v) => {
        const raw = v.label ?? v.name ?? v.voice_id ?? "Stimme";
        const label = raw.replace(/^Akool\s+/i, "").trim() || "Stimme";
        return {
          id: v.voice_id ?? v.name ?? "default",
          label,
        };
      });
      return NextResponse.json({ voices });
    }
  } catch {
    /* fallback below */
  }

  return NextResponse.json({
    voices: [
      { id: "multilingual-3", label: "Multilingual 3" },
      { id: "multilingual-1", label: "Multilingual 1" },
    ],
  });
}
