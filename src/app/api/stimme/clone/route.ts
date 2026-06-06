import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { deductCredits, hasEnoughCredits } from "@/lib/credits";
import { assertGatedFeature } from "@/lib/access.server";

const CREDIT_COST = 2;

export async function POST(request: NextRequest) {
  const denied = await assertGatedFeature("voice-clone");
  if (denied) return denied;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

  const creditCheck = await hasEnoughCredits(supabase, user.id, CREDIT_COST);
  if (!creditCheck.ok)
    return NextResponse.json({ error: "Nicht genug Credits" }, { status: 402 });

  const formData = await request.formData();
  const audio = formData.get("audio") as File;
  const name = formData.get("name") as string;

  if (!audio || !name)
    return NextResponse.json({ error: "Fehlende Parameter" }, { status: 400 });

  try {
    const elFormData = new FormData();
    elFormData.append("name", name);
    elFormData.append("files", audio);
    elFormData.append("description", "InfluexAI Voice Clone");

    const res = await fetch("https://api.elevenlabs.io/v1/voices/add", {
      method: "POST",
      headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY! },
      body: elFormData,
    });

    const data = await res.json();
    if (!data.voice_id) throw new Error(data.detail || "Klonen fehlgeschlagen");

    const deduction = await deductCredits(
      supabase,
      user.id,
      CREDIT_COST,
      "Stimme klonen",
      { generationType: "stimme-clone", prompt: name }
    );

    if (!deduction.success) {
      return NextResponse.json(
        { error: deduction.error ?? "Nicht genug Credits" },
        { status: 402 }
      );
    }

    return NextResponse.json({ voiceId: data.voice_id, name });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("ElevenLabs Clone Error:", message);
    return NextResponse.json(
      { error: "Stimmen-Klonung fehlgeschlagen" },
      { status: 500 }
    );
  }
}
