import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { withCreditDeduction } from "@/lib/credits-with-refund";
import { assertGatedFeature } from "@/lib/access.server";
import { providerRouteGuardResponse } from "@/lib/environment-safety.server";

export const dynamic = "force-dynamic";

const CREDIT_COST = 2;

export async function POST(request: NextRequest) {
  const writeGuard = providerRouteGuardResponse();
  if (writeGuard) return writeGuard;

  const denied = await assertGatedFeature("voice-clone");
  if (denied) return denied;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

  const formData = await request.formData();
  const audio = formData.get("audio") as File;
  const name = formData.get("name") as string;

  if (!audio || !name)
    return NextResponse.json({ error: "Fehlende Parameter" }, { status: 400 });

  if (formData.get("consentAccepted") !== "true") {
    return NextResponse.json(
      {
        error:
          "Bitte bestätige die Einwilligung, bevor die KI-Verarbeitung startet.",
        code: "CONSENT_REQUIRED",
      },
      { status: 400 }
    );
  }

  const result = await withCreditDeduction(
    {
      supabase,
      userId: user.id,
      amount: CREDIT_COST,
      description: "Stimme klonen",
      generationType: "stimme-clone",
      prompt: name,
      refundDescription: "Stimme klonen — Refund",
    },
    async () => {
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
      if (!data.voice_id) {
        throw new Error(data.detail || "Klonen fehlgeschlagen");
      }
      return { voiceId: data.voice_id as string, name };
    }
  );

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status }
    );
  }

  return NextResponse.json(result.data);
}
