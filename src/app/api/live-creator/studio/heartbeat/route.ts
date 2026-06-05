import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { deductCredits } from "@/lib/credits";
import {
  LIVE_CREATOR_CREDITS_PER_MINUTE,
  LIVE_CREATOR_LOW_CREDITS_WARNING,
} from "@/lib/live-creator-config";

export async function POST() {
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
    LIVE_CREATOR_CREDITS_PER_MINUTE,
    "Live Creator Mode (pro Minute)",
    { generationType: "live-creator-stream", prompt: "flashhead-minute" }
  );

  if (!deduction.success) {
    return NextResponse.json({
      success: false,
      endSession: true,
      creditsLeft: deduction.remainingCredits,
      creditsUsed: 0,
      error: deduction.error ?? "Nicht genug Credits",
    });
  }

  const creditsLeft = deduction.remainingCredits;
  return NextResponse.json({
    success: true,
    endSession: creditsLeft < LIVE_CREATOR_CREDITS_PER_MINUTE,
    creditsLeft,
    creditsUsed: LIVE_CREATOR_CREDITS_PER_MINUTE,
    lowCredits: creditsLeft < LIVE_CREATOR_LOW_CREDITS_WARNING,
    creditsPerMinute: LIVE_CREATOR_CREDITS_PER_MINUTE,
  });
}
