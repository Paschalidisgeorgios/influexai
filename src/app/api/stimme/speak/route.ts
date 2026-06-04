import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const CREDIT_COST = 2;

export async function POST(request: NextRequest) {
  const { text, voiceId } = await request.json();
  if (!text || !voiceId)
    return NextResponse.json({ error: "Fehlende Parameter" }, { status: 400 });

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("credits").eq("id", user.id).single();
  if (!profile || profile.credits < CREDIT_COST)
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

    await supabase.from("profiles")
      .update({ credits: profile.credits - CREDIT_COST })
      .eq("id", user.id);

    return NextResponse.json({ audioUrl, creditsUsed: CREDIT_COST });
  } catch (error: any) {
    console.error("ElevenLabs TTS Error:", error.message);
    return NextResponse.json({ error: "Text-zu-Sprache fehlgeschlagen" }, { status: 500 });
  }
}
