import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { deductCredits } from "@/lib/credits";
import {
  LIVE_AVATAR_CREDITS_PER_MINUTE,
  LIVE_AVATAR_LOW_CREDITS_WARNING,
} from "@/lib/akool-live-avatar";
import { assertGatedFeature } from "@/lib/access";

export async function POST() {
  const denied = await assertGatedFeature("live-creator");
  if (denied) return denied;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

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
