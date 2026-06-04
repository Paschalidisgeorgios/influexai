import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { deductCredits, hasEnoughCredits } from "@/lib/credits";

const CREDIT_COST = 2;

export async function POST(request: NextRequest) {
  const { text, voiceId } = await request.json();
  if (!text || !voiceId)
    return NextResponse.json({ error: "Fehlende Parameter" }, { status: 400 });

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
    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": process.env.ELEVENLABS_API_KEY!,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      }
    );

    if (!res.ok) throw new Error("TTS fehlgeschlagen");

    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const audioUrl = `data:audio/mpeg;base64,${base64}`;

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
