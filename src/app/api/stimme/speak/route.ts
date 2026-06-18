import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { withCreditDeduction } from "@/lib/credits-with-refund";
import {
  isValidElevenLabsVoiceId,
  synthesizeElevenLabsSpeech,
} from "@/lib/elevenlabs-tts";
import { assertGatedFeature } from "@/lib/access.server";
import { developmentWriteGuardResponse } from "@/lib/environment-safety.server";

export const dynamic = "force-dynamic";

const CREDIT_COST = 2;

export async function POST(request: NextRequest) {
  const writeGuard = developmentWriteGuardResponse();
  if (writeGuard) return writeGuard;

  const denied = await assertGatedFeature("voice-clone");
  if (denied) return denied;

  const { text, voiceId } = await request.json();
  if (!text || !voiceId)
    return NextResponse.json({ error: "Fehlende Parameter" }, { status: 400 });
  if (!isValidElevenLabsVoiceId(voiceId))
    return NextResponse.json({ error: "Ungültige Stimme" }, { status: 400 });

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

  const result = await withCreditDeduction(
    {
      supabase,
      userId: user.id,
      amount: CREDIT_COST,
      description: "Text zu Sprache",
      generationType: "stimme-speak",
      prompt: text.slice(0, 500),
      refundDescription: "Text zu Sprache — Refund",
    },
    async () => {
      const tts = await synthesizeElevenLabsSpeech(text, voiceId, 50);
      if (!tts.ok) {
        throw new Error(tts.error);
      }
      return tts.audioDataUrl;
    }
  );

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status }
    );
  }

  return NextResponse.json({
    audioUrl: result.data,
    creditsUsed: result.creditsCharged,
    creditsLeft: result.remainingCredits,
  });
}
