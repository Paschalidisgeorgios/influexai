import { NextResponse } from "next/server";

import { assertGatedFeature } from "@/lib/access.server";
import {
  assertKiInfluencerAccess,
  kiInfluencerErrorResponse,
  logKiInfluencerError,
  mapSupabaseWriteError,
} from "@/lib/ki-influencer-api";

export const dynamic = "force-dynamic";

/** GET — list user's trained (ready) characters for content generation */
export async function GET() {
  const denied = await assertGatedFeature("lora-training");
  if (denied) return denied;

  const access = await assertKiInfluencerAccess(0);
  if (access instanceof NextResponse) return access;
  const { userId, supabase } = access;

  try {
    const { data, error } = await supabase
      .from("characters")
      .select("id, name, status, trigger_word, casting_image_url, updated_at")
      .eq("user_id", userId)
      .eq("status", "ready")
      .order("updated_at", { ascending: false });

    if (error) {
      return mapSupabaseWriteError("characters list", error);
    }

    return NextResponse.json({
      success: true,
      characters: data ?? [],
    });
  } catch (error) {
    logKiInfluencerError("characters list", error);
    return kiInfluencerErrorResponse("generation_failed", 500);
  }
}
