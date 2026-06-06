import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { deductCredits, hasEnoughCredits } from "@/lib/credits";
import {
  isValidElevenLabsVoiceId,
  synthesizeElevenLabsSpeech,
} from "@/lib/elevenlabs-tts";
import { assertGatedFeature } from "@/lib/access.server";

const CREDIT_COST = 2;

export async function POST(request: NextRequest) {
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

  const creditCheck = await hasEnoughCredits(supabase, user.id, CREDIT_COST);
  if (!creditCheck.ok)
    return NextResponse.json({ error: "Nicht genug Credits" }, { status: 402 });

  try {
    const tts = await synthesizeElevenLabsSpeech(text, voiceId, 50);
    if (!tts.ok) {
      return NextResponse.json({ error: tts.error }, { status: 502 });
    }
    const audioUrl = tts.audioDataUrl;

    const deduction = await deductCredits(
      supabase,
      user.id,
      CREDIT_COST,
      "Text zu Sprache",
      { generationType: "stimme-speak", prompt: text.slice(0, 500) }
    );

    if (!deduction.success) {
      return NextResponse.json(
        { error: deduction.error ?? "Nicht genug Credits" },
        { status: 402 }
      );
    }

    return NextResponse.json({
      audioUrl,
      creditsUsed: CREDIT_COST,
      creditsLeft: deduction.remainingCredits,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("ElevenLabs TTS Error:", message);
    return NextResponse.json(
      { error: "Text-zu-Sprache fehlgeschlagen" },
      { status: 500 }
    );
  }
}
