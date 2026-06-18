import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { deductCredits } from "@/lib/credits";
import {
  LIVE_AVATAR_CREDITS_PER_MINUTE,
  LIVE_AVATAR_LOW_CREDITS_WARNING,
} from "@/lib/akool-live-avatar";
import { assertGatedFeature } from "@/lib/access.server";
import { developmentWriteGuardResponse } from "@/lib/environment-safety.server";

export const dynamic = "force-dynamic";

export async function POST() {
  const writeGuard = developmentWriteGuardResponse();
  if (writeGuard) return writeGuard;

  const denied = await assertGatedFeature("live-creator");
  if (denied) return denied;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  // Billing contract: minute 1 is pre-paid at session start (session/route.ts).
  // The UI MUST NOT call this heartbeat until 60 seconds after session start.
  // Calling it immediately at session start would double-bill the first minute.
  // The session response includes `firstMinutePrepaid: true` as a hint to the UI.
  const deduction = await deductCredits(
    supabase,
    user.id,
    LIVE_AVATAR_CREDITS_PER_MINUTE,
    "Live Creator Mode (pro Minute)",
    { generationType: "live-creator-stream", prompt: "live-avatar-minute" }
  );

  if (!deduction.success) {
    return NextResponse.json({
      success: false,
      endSession: true,
      creditsLeft: deduction.remainingCredits,
      error: deduction.error ?? "Nicht genug Credits",
    });
  }

  const creditsLeft = deduction.remainingCredits;
  return NextResponse.json({
    success: true,
    endSession: creditsLeft < LIVE_AVATAR_CREDITS_PER_MINUTE,
    creditsLeft,
    lowCredits: creditsLeft < LIVE_AVATAR_LOW_CREDITS_WARNING,
    creditsPerMinute: LIVE_AVATAR_CREDITS_PER_MINUTE,
  });
}
