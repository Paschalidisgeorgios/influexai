import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { deductCredits, hasEnoughCredits } from "@/lib/credits";
import {
  getOwnedGeneration,
  unlockDownloadFromSource,
  updateGenerationResult,
} from "@/lib/generation-assets";
import { IMAGE_GEN_CREDITS } from "@/lib/image-generator-credits";

export const dynamic = "force-dynamic";

function protectedImageUrl(generationId: string) {
  return `/api/generated-image/${generationId}?variant=final`;
}

export async function POST(request: NextRequest) {
  const { generationId } = (await request.json()) as { generationId?: string };

  if (!generationId) {
    return NextResponse.json({ error: "generationId fehlt" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const row = await getOwnedGeneration(supabase, generationId, user.id);
  if (!row?.asset?.sourcePath) {
    return NextResponse.json({ error: "Generierung nicht gefunden" }, { status: 404 });
  }

  if (row.asset.downloadPaid && row.asset.finalPath) {
    return NextResponse.json({
      success: true,
      generationId,
      imageUrl: protectedImageUrl(generationId),
      downloadUrl: `/api/download/${generationId}`,
      creditsUsed: 0,
    });
  }

  const creditCost = IMAGE_GEN_CREDITS.download;
  const creditCheck = await hasEnoughCredits(supabase, user.id, creditCost);
  if (!creditCheck.ok) {
    return NextResponse.json({ error: "Nicht genug Credits" }, { status: 402 });
  }

  const deduction = await deductCredits(
    supabase,
    user.id,
    creditCost,
    "Bild Generator — Download",
    {
      generationType: "image",
      skipGenerationLog: true,
    }
  );

  if (!deduction.success) {
    return NextResponse.json(
      { error: deduction.error ?? "Nicht genug Credits" },
      { status: 402 }
    );
  }

  try {
    const finalPath = await unlockDownloadFromSource(user.id, generationId);

    await updateGenerationResult(supabase, generationId, user.id, {
      finalPath,
      downloadPaid: true,
      paid: true,
      credits_used: (row.credits_used ?? 0) + creditCost,
    });

    return NextResponse.json({
      success: true,
      generationId,
      imageUrl: protectedImageUrl(generationId),
      downloadUrl: `/api/download/${generationId}`,
      creditsUsed: creditCost,
      creditsLeft: deduction.remainingCredits,
      locked: false,
    });
  } catch (error: unknown) {
    console.error("purchase-image-download error:", error);
    return NextResponse.json(
      { error: "Download konnte nicht freigeschaltet werden." },
      { status: 500 }
    );
  }
}
