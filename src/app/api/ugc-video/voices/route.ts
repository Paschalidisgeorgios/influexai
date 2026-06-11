import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listAkoolVoices } from "@/lib/akool-ugc";
import { isAkoolConfigured } from "@/lib/akool-env";
import { sanitizeUserMessage } from "@/lib/sanitize-user-message";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isAkoolConfigured()) {
    return NextResponse.json(
      { error: "Stimmen sind gerade nicht verfügbar." },
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

  try {
    const voices = await listAkoolVoices(1, 40);
    return NextResponse.json({ success: true, voices });
  } catch (err: unknown) {
    console.error("[ugc-video/voices]", err);
    return NextResponse.json(
      {
        error: sanitizeUserMessage(
          err instanceof Error ? err.message : "Stimmen-Liste fehlgeschlagen"
        ),
      },
      { status: 500 }
    );
  }
}
