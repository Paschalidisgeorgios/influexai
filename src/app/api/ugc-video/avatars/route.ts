import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listUgcAvatars } from "@/lib/akool-ugc";
import { sanitizeUserMessage } from "@/lib/sanitize-user-message";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!process.env.AKOOL_CLIENT_ID || !process.env.AKOOL_API_KEY) {
    return NextResponse.json(
      { error: "UGC-Video ist gerade nicht verfügbar." },
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
    const avatars = await listUgcAvatars(1, 60);
    return NextResponse.json({ success: true, avatars });
  } catch (err: unknown) {
    console.error("[ugc-video/avatars]", err);
    return NextResponse.json(
      {
        error: sanitizeUserMessage(
          err instanceof Error ? err.message : "Avatar-Liste fehlgeschlagen"
        ),
      },
      { status: 500 }
    );
  }
}
