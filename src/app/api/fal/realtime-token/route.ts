import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getFalKey } from "@/lib/fal-image";
import { assertGatedFeature } from "@/lib/access";

const TOKEN_EXPIRATION_SECONDS = 120;

export async function POST(request: NextRequest) {
  const denied = await assertGatedFeature("live-creator");
  if (denied) return denied;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const key = getFalKey();
  if (!key) {
    return NextResponse.json(
      { error: "Live Creator ist gerade nicht verfügbar." },
      { status: 503 }
    );
  }

  let app = "fal-ai/flashhead";
  try {
    const body = await request.json();
    if (typeof body?.app === "string" && body.app.trim()) {
      app = body.app.trim();
    }
  } catch {
    /* default app */
  }

  try {
    const appAlias = app.replace(/^\/+/, "").split("/").slice(0, 2).join("/");
    const res = await fetch("https://rest.alpha.fal.ai/tokens/", {
      method: "POST",
      headers: {
        Authorization: `Key ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        allowed_apps: [appAlias],
        token_expiration: TOKEN_EXPIRATION_SECONDS,
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      throw new Error(detail || "Token-Anfrage fehlgeschlagen");
    }

    const token = await res.text();
    const normalized =
      token.startsWith("{") ? (JSON.parse(token) as { detail?: string }).detail ?? token : token;

    return new NextResponse(normalized, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  } catch (err: unknown) {
    console.error("[fal/realtime-token]", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Realtime-Token konnte nicht erstellt werden",
      },
      { status: 500 }
    );
  }
}
