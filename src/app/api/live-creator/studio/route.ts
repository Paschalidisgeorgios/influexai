import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hasEnoughCredits } from "@/lib/credits";
import {
  LIVE_CREATOR_CREDITS_PER_MINUTE,
  LIVE_CREATOR_LOW_CREDITS_WARNING,
  PRESET_LIVE_CHARACTERS,
} from "@/lib/live-creator-config";
import { resolveUserKiIchCharacter } from "@/lib/live-creator-ki-ich";
import { getFalKey } from "@/lib/fal-image";
import { assertGatedFeature } from "@/lib/access.server";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  if (!getFalKey()) {
    return NextResponse.json(
      { error: "Live Creator ist gerade nicht verfügbar." },
      { status: 503 }
    );
  }

  const kiIch = await resolveUserKiIchCharacter(supabase, user.id);
  const characters = kiIch
    ? [kiIch, ...PRESET_LIVE_CHARACTERS]
    : [...PRESET_LIVE_CHARACTERS];

  const { data: profile } = await supabase
    .from("profiles")
    .select("credits")
    .eq("id", user.id)
    .single();

  const credits = profile?.credits ?? 0;
  const preferredId =
    kiIch?.id ?? PRESET_LIVE_CHARACTERS[0]?.id ?? "";

  return NextResponse.json({
    success: true,
    characters,
    preferredCharacterId: preferredId,
    credits,
    creditsPerMinute: LIVE_CREATOR_CREDITS_PER_MINUTE,
    lowCreditsWarning: LIVE_CREATOR_LOW_CREDITS_WARNING,
    modelId: "fal-ai/flashhead",
  });
}

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

  if (!getFalKey()) {
    return NextResponse.json(
      { error: "Live Creator ist gerade nicht verfügbar." },
      { status: 503 }
    );
  }

  const creditCheck = await hasEnoughCredits(
    supabase,
    user.id,
    LIVE_CREATOR_CREDITS_PER_MINUTE
  );

  if (!creditCheck.ok) {
    return NextResponse.json(
      {
        error: `Nicht genug Credits (${LIVE_CREATOR_CREDITS_PER_MINUTE} pro Minute benötigt)`,
      },
      { status: 402 }
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("credits")
    .eq("id", user.id)
    .single();

  return NextResponse.json({
    success: true,
    credits: profile?.credits ?? 0,
    creditsPerMinute: LIVE_CREATOR_CREDITS_PER_MINUTE,
  });
}
