import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { sanitizeUserMessage } from "@/lib/sanitize-user-message";
import { hasEnoughCredits, deductCredits, addCredits } from "@/lib/credits";
import {
  closeLiveAvatarSession,
  createLiveAvatarSession,
  listStreamingAvatars,
  LIVE_AVATAR_CREDITS_PER_MINUTE,
  LIVE_AVATAR_LOW_CREDITS_WARNING,
} from "@/lib/akool-live-avatar";
import { resolvePreferredLiveAvatarId } from "@/lib/preferred-live-avatar";
import { assertGatedFeature } from "@/lib/access.server";
import { isAkoolConfigured } from "@/lib/akool-env";

export const dynamic = "force-dynamic";

export const maxDuration = 60;

/** GET — list streaming avatars for picker */
export async function GET() {
  const denied = await assertGatedFeature("live-creator");
  if (denied) return denied;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  if (!isAkoolConfigured()) {
    return NextResponse.json(
      { error: "Live-Avatar ist gerade nicht verfügbar." },
      { status: 503 }
    );
  }

  try {
    const avatars = await listStreamingAvatars();
    const preferredAvatarId = await resolvePreferredLiveAvatarId(
      supabase,
      user.id,
      avatars
    );
    const { data: profile } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", user.id)
      .single();

    return NextResponse.json({
      success: true,
      avatars,
      preferredAvatarId,
      credits: profile?.credits ?? 0,
      creditsPerMinute: LIVE_AVATAR_CREDITS_PER_MINUTE,
      lowCreditsWarning: LIVE_AVATAR_LOW_CREDITS_WARNING,
    });
  } catch (err: unknown) {
    console.error("[live-avatar GET]", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Avatar-Liste konnte nicht geladen werden",
      },
      { status: 500 }
    );
  }
}

/** POST — create Akool live session + return Agora credentials */
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

  if (!isAkoolConfigured()) {
    return NextResponse.json(
      { error: "Live-Avatar ist gerade nicht verfügbar." },
      { status: 503 }
    );
  }

  let avatarId: string | undefined;
  let language = "de";
  try {
    const body = await request.json();
    avatarId =
      typeof body?.avatarId === "string" ? body.avatarId.trim() : undefined;
    if (typeof body?.language === "string" && body.language.trim()) {
      language = body.language.trim();
    }
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!avatarId) {
    return NextResponse.json({ error: "avatarId required" }, { status: 400 });
  }

  // Pre-check: verify balance before attempting deduction
  const creditCheck = await hasEnoughCredits(
    supabase,
    user.id,
    LIVE_AVATAR_CREDITS_PER_MINUTE
  );
  if (!creditCheck.ok) {
    return NextResponse.json(
      {
        error: `Nicht genug Credits (${LIVE_AVATAR_CREDITS_PER_MINUTE} pro Minute)`,
        credits: creditCheck.credits,
      },
      { status: 402 }
    );
  }

  // Pre-pay: deduct 1 credit for the first minute BEFORE starting the provider session.
  // This prevents Akool/Agora costs without any credit deduction (billing gap fix).
  //
  // IMPORTANT for future UI: heartbeat must start its interval AFTER 60 seconds
  // (not immediately at session start) to avoid double-billing minute 1.
  // The session response includes `firstMinutePrepaid: true` as a signal to the UI.
  const deduction = await deductCredits(
    supabase,
    user.id,
    LIVE_AVATAR_CREDITS_PER_MINUTE,
    "Live Avatar — Session Start (Minute 1)",
    { generationType: "live-avatar-session-start", prompt: "live-avatar-minute-1" }
  );
  if (!deduction.success) {
    return NextResponse.json(
      {
        error: deduction.error ?? `Nicht genug Credits (${LIVE_AVATAR_CREDITS_PER_MINUTE} pro Minute)`,
        credits: deduction.remainingCredits,
      },
      { status: 402 }
    );
  }

  try {
    const session = await createLiveAvatarSession({ avatarId, language });
    const { agora_app_id, agora_channel, agora_token, agora_uid } =
      session.credentials;
    return NextResponse.json({
      success: true,
      session_id: session.sessionId,
      sessionId: session.sessionId,
      agora_app_id,
      agora_channel,
      agora_token,
      agora_uid,
      credentials: session.credentials,
      credits: deduction.remainingCredits,
      creditsPerMinute: LIVE_AVATAR_CREDITS_PER_MINUTE,
      lowCreditsWarning: LIVE_AVATAR_LOW_CREDITS_WARNING,
      // Signal to the UI: minute 1 is already paid — start heartbeat interval
      // only after 60 seconds to avoid double-billing the first minute.
      firstMinutePrepaid: true,
    });
  } catch (err: unknown) {
    console.error("[live-avatar POST]", err);
    // Provider failed after successful deduction — refund the pre-paid credit.
    await addCredits(
      supabase,
      user.id,
      LIVE_AVATAR_CREDITS_PER_MINUTE,
      "Live Avatar — Refund (Session Start fehlgeschlagen)"
    );
    return NextResponse.json(
      {
        error: sanitizeUserMessage(
          err instanceof Error
            ? err.message
            : "Live-Session konnte nicht gestartet werden"
        ),
      },
      { status: 500 }
    );
  }
}

/** DELETE — close Akool session */
export async function DELETE(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  let sessionId =
    request.nextUrl.searchParams.get("sessionId")?.trim() ??
    request.nextUrl.searchParams.get("session_id")?.trim() ??
    "";
  if (!sessionId) {
    try {
      const body = (await request.json()) as Record<string, unknown>;
      sessionId = String(
        body.session_id ?? body.sessionId ?? body._id ?? ""
      ).trim();
    } catch {
      /* query-only close */
    }
  }
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }

  try {
    await closeLiveAvatarSession(sessionId);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("[live-avatar DELETE]", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Session konnte nicht beendet werden",
      },
      { status: 500 }
    );
  }
}
