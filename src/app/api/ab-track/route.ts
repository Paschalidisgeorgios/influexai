import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";


const VALID_VARIANTS = new Set(["a", "b"]);
const VALID_EVENTS = new Set(["view", "signup_click", "signup_complete"]);

export async function POST(request: NextRequest) {
  let body: { variant?: string; event?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = body.event;
  if (!event || !VALID_EVENTS.has(event)) {
    return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  }

  const cookieVariant = request.cookies.get("ab_variant")?.value;
  const variant =
    body.variant && VALID_VARIANTS.has(body.variant)
      ? body.variant
      : cookieVariant && VALID_VARIANTS.has(cookieVariant)
        ? cookieVariant
        : "a";

  let sessionId = request.cookies.get("ab_session_id")?.value;
  const response = NextResponse.json({ ok: true });

  if (!sessionId) {
    sessionId = randomUUID();
    response.cookies.set("ab_session_id", sessionId, {
      maxAge: 60 * 60 * 24 * 30,
      httpOnly: true,
      path: "/",
      sameSite: "lax",
    });
  }

  const userAgent = request.headers.get("user-agent") ?? "";

  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabaseAdmin.from("ab_events").insert({
      variant,
      event,
      session_id: sessionId,
      user_agent: userAgent.slice(0, 500),
    });

    if (error) {
      console.warn("[ab-track]", error.message);
    }
  } catch (err) {
    console.warn("[ab-track]", err);
  }

  return response;
}
