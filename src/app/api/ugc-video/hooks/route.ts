import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { generateUgcHookVariants } from "@/lib/ugc-hook-generator";
import { sanitizeUserMessage } from "@/lib/sanitize-user-message";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Hook-Generator ist gerade nicht verfügbar." },
      { status: 503 }
    );
  }

  const body = (await request.json()) as {
    topic?: string;
    language?: string;
  };

  try {
    const hooks = await generateUgcHookVariants(
      body.topic ?? "",
      body.language ?? "Deutsch"
    );
    return NextResponse.json({ success: true, hooks });
  } catch (err: unknown) {
    console.error("[ugc-video/hooks]", err);
    return NextResponse.json(
      {
        error: sanitizeUserMessage(
          err instanceof Error ? err.message : "Hook-Generierung fehlgeschlagen"
        ),
      },
      { status: 500 }
    );
  }
}
