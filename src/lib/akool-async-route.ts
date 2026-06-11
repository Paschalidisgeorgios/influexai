import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import {
  createPendingAkoolGeneration,
  refundAkoolToolCredits,
  requireAkoolAccess,
  deductAkoolToolCredits,
  akoolRouteError,
  type AkoolJobPollType,
} from "@/lib/akool-route-handler";

export async function runAkoolAsyncPost(params: {
  creditCost: number;
  generationType: string;
  label: string;
  pollType: AkoolJobPollType;
  prompt: string;
  model?: string;
  assetKind?: "video" | "audio" | "image";
  createJob: (ctx: {
    supabase: SupabaseClient;
    userId: string;
  }) => Promise<string>;
}) {
  const access = await requireAkoolAccess(params.creditCost);
  if (access instanceof NextResponse) return access;
  const { userId, supabase } = access;

  const deduction = await deductAkoolToolCredits(
    supabase,
    userId,
    params.creditCost,
    params.label,
    params.generationType,
    params.prompt
  );

  if (!deduction.success) {
    return NextResponse.json(
      { error: deduction.error ?? "Credit-Abzug fehlgeschlagen" },
      { status: 402 }
    );
  }

  try {
    const jobId = await params.createJob({ supabase, userId });
    const generationId = await createPendingAkoolGeneration(
      supabase,
      userId,
      params.generationType,
      jobId,
      params.creditCost,
      params.prompt,
      params.model,
      params.assetKind ?? "video"
    );

    return NextResponse.json({
      jobId,
      generationId,
      pollType: params.pollType,
      status: "processing",
      creditsCharged: params.creditCost,
      creditsLeft: deduction.remainingCredits,
    });
  } catch (error) {
    await refundAkoolToolCredits(
      supabase,
      userId,
      params.creditCost,
      params.label
    );
    return NextResponse.json(
      { error: akoolRouteError(error) },
      { status: 500 }
    );
  }
}

export async function runAkoolSyncPost(params: {
  creditCost: number;
  generationType: string;
  label: string;
  prompt: string;
  assetKind: "video" | "audio" | "image";
  model?: string;
  createResult: (ctx: {
    supabase: SupabaseClient;
    userId: string;
  }) => Promise<string>;
}) {
  const access = await requireAkoolAccess(params.creditCost);
  if (access instanceof NextResponse) return access;
  const { userId, supabase } = access;

  const deduction = await deductAkoolToolCredits(
    supabase,
    userId,
    params.creditCost,
    params.label,
    params.generationType,
    params.prompt
  );

  if (!deduction.success) {
    return NextResponse.json(
      { error: deduction.error ?? "Credit-Abzug fehlgeschlagen" },
      { status: 402 }
    );
  }

  try {
    const resultUrl = await params.createResult({ supabase, userId });
    const generationId = await createPendingAkoolGeneration(
      supabase,
      userId,
      params.generationType,
      `sync-${Date.now()}`,
      params.creditCost,
      params.prompt,
      params.model,
      params.assetKind
    );

    const { finalizeAkoolGenerationAsset } = await import(
      "@/lib/akool-route-handler"
    );
    const protectedUrl = await finalizeAkoolGenerationAsset(
      supabase,
      userId,
      generationId,
      resultUrl,
      params.assetKind
    );

    return NextResponse.json({
      resultUrl: protectedUrl,
      generationId,
      creditsCharged: params.creditCost,
      creditsLeft: deduction.remainingCredits,
    });
  } catch (error) {
    await refundAkoolToolCredits(
      supabase,
      userId,
      params.creditCost,
      params.label
    );
    return NextResponse.json(
      { error: akoolRouteError(error) },
      { status: 500 }
    );
  }
}

export async function pollAkoolGeneration(params: {
  supabase: SupabaseClient;
  userId: string;
  jobId: string;
  generationType: string;
  pollType: AkoolJobPollType;
  assetKind?: "video" | "audio" | "image";
}) {
  const { getAkoolGenerationByJobId, finalizeAkoolGenerationAsset, refundAkoolToolCredits } =
    await import("@/lib/akool-route-handler");
  const { pollAkoolJobStatus } = await import("@/lib/akool-status");

  const row = await getAkoolGenerationByJobId(
    params.supabase,
    params.userId,
    params.jobId,
    params.generationType
  );
  if (!row) {
    return { status: "failed" as const, error: "Job nicht gefunden", refunded: false };
  }

  const generationId = row.id as string;
  const creditsUsed = (row.credits_used as number) ?? 0;

  try {
    const job = await pollAkoolJobStatus(params.pollType, params.jobId);

    if (job.status === "processing") {
      return { status: "processing" as const, progress: 50 };
    }

    if (job.status === "failed" || !job.resultUrl) {
      const refunded =
        creditsUsed > 0
          ? await refundAkoolToolCredits(
              params.supabase,
              params.userId,
              creditsUsed,
              params.generationType
            )
          : false;
      return {
        status: "failed" as const,
        error: "Generierung fehlgeschlagen",
        refunded,
      };
    }

    const resultUrl = await finalizeAkoolGenerationAsset(
      params.supabase,
      params.userId,
      generationId,
      job.resultUrl,
      params.assetKind ?? "video"
    );

    const { data: profile } = await params.supabase
      .from("profiles")
      .select("credits")
      .eq("id", params.userId)
      .single();

    return {
      status: "completed" as const,
      resultUrl,
      generationId,
      creditsLeft: profile?.credits,
    };
  } catch (error) {
    const refunded =
      creditsUsed > 0
        ? await refundAkoolToolCredits(
            params.supabase,
            params.userId,
            creditsUsed,
            params.generationType
          )
        : false;
    return {
      status: "failed" as const,
      error: akoolRouteError(error),
      refunded,
    };
  }
}
