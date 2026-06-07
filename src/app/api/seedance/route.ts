import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getFalKey } from "@/lib/fal-image";
import { hasEnoughCredits } from "@/lib/credits";
import { runSeedanceGeneration } from "@/lib/seedance-generate";
import { SEEDANCE_CREDIT_COST } from "@/lib/seedance-config";
import { sanitizeUserMessage } from "@/lib/sanitize-user-message";

export const dynamic = "force-dynamic";

export const maxDuration = 300;

type SeedanceBody = {
  image_url?: string;
  prompt?: string;
};

export async function POST(request: NextRequest) {
  let body: SeedanceBody;
  try {
    body = (await request.json()) as SeedanceBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const imageUrl = body.image_url?.trim() ?? "";
  const prompt = body.prompt?.trim() ?? "";

  if (!imageUrl) {
    return NextResponse.json({ error: "Bild-URL erforderlich" }, { status: 400 });
  }
  if (!prompt) {
    return NextResponse.json(
      { error: "Bewegungs-Prompt erforderlich" },
      { status: 400 }
    );
  }

  if (!getFalKey()) {
    return NextResponse.json(
      { error: "Video-Engine ist nicht konfiguriert." },
      { status: 503 }
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const creditCheck = await hasEnoughCredits(
    supabase,
    user.id,
    SEEDANCE_CREDIT_COST
  );
  if (!creditCheck.ok) {
    return NextResponse.json(
      { error: "Nicht genug Credits", credits: creditCheck.credits },
      { status: 402 }
    );
  }

  const result = await runSeedanceGeneration(supabase, user.id, {
    imageUrl,
    prompt,
  });

  if (!result.ok) {
    const status =
      result.error.includes("Credits") || result.error.includes("Credit")
        ? 402
        : 500;
    return NextResponse.json(
      { error: sanitizeUserMessage(result.error) },
      { status }
    );
  }

  return NextResponse.json({
    videoUrl: result.videoUrl,
    generationId: result.generationId,
    creditsLeft: result.creditsLeft,
  });
}
