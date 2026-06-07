export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

import { chargeAvatarCredits, refundCredits } from "@/lib/avatar/credits";
import type { AvatarQualityReport } from "@/lib/avatar/types";
import { createServiceSupabaseClient } from "@/lib/supabase/service";

type CallbackBody = {
  jobId?: string;
  status?: string;
  rawOutputUrl?: string;
  qualityReport?: AvatarQualityReport;
  error?: string;
  runpodJobId?: string;
  output?: {
    rawOutputUrl?: string;
    qualityReport?: AvatarQualityReport;
    error?: string;
  };
};

function isQualityPassed(report: AvatarQualityReport | undefined): boolean {
  if (!report) return true;
  return report.passed !== false;
}

export async function POST(req: NextRequest) {
  // TODO: RunPod Webhook Secret validieren (Header x-runpod-webhook-secret)
  const webhookSecret = process.env.RUNPOD_WEBHOOK_SECRET?.trim();
  if (webhookSecret) {
    const headerSecret =
      req.headers.get("x-runpod-webhook-secret") ??
      req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (headerSecret !== webhookSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let body: CallbackBody;
  try {
    body = (await req.json()) as CallbackBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const jobId = body.jobId;
  const status = body.status;
  const rawOutputUrl = body.rawOutputUrl ?? body.output?.rawOutputUrl;
  const qualityReport = body.qualityReport ?? body.output?.qualityReport;
  const errorMessage = body.error ?? body.output?.error;
  const runpodJobId = body.runpodJobId;

  if (!jobId) {
    return NextResponse.json({ error: "jobId required" }, { status: 400 });
  }

  const supabase = createServiceSupabaseClient();

  const { data: job, error: jobError } = await supabase
    .from("avatar_render_jobs")
    .select("*")
    .eq("id", jobId)
    .maybeSingle();

  if (jobError || !job) {
    return NextResponse.json({ error: "Job nicht gefunden." }, { status: 404 });
  }

  if (
    runpodJobId &&
    job.runpod_job_id &&
    job.runpod_job_id !== runpodJobId
  ) {
    return NextResponse.json({ error: "Job mismatch." }, { status: 403 });
  }

  const normalizedStatus = (status ?? "").toUpperCase();
  const qualityPassed = isQualityPassed(qualityReport);
  const isSuccess = normalizedStatus === "COMPLETED" && qualityPassed;
  const isFailed =
    normalizedStatus === "FAILED" || !qualityPassed || Boolean(errorMessage);

  if (isSuccess) {
    let usedCredits = job.used_credits ?? 0;

    if (usedCredits === 0 && job.estimated_credits > 0) {
      const newBalance = await chargeAvatarCredits(
        supabase,
        job.user_id,
        job.estimated_credits,
        jobId
      );

      if (newBalance !== null) {
        usedCredits = job.estimated_credits;
      }
    }

    await supabase
      .from("avatar_render_jobs")
      .update({
        status: "completed",
        raw_output_url: rawOutputUrl ?? null,
        quality_report: qualityReport ?? null,
        used_credits: usedCredits > 0 ? usedCredits : job.estimated_credits,
        error: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    return NextResponse.json({ received: true, status: "completed" });
  }

  if (isFailed) {
    const priorCharge = job.used_credits ?? 0;
    if (priorCharge > 0) {
      await refundCredits(
        supabase,
        job.user_id,
        priorCharge,
        `Avatar job ${jobId} failed`
      );
    }

    const issues =
      qualityReport?.issues?.length && !qualityPassed
        ? qualityReport.issues.join(", ")
        : null;

    await supabase
      .from("avatar_render_jobs")
      .update({
        status: "failed",
        raw_output_url: rawOutputUrl ?? null,
        quality_report: qualityReport ?? null,
        used_credits: 0,
        error:
          errorMessage ??
          issues ??
          (qualityPassed ? "Render fehlgeschlagen." : "Qualitätsprüfung fehlgeschlagen."),
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    return NextResponse.json({ received: true, status: "failed" });
  }

  return NextResponse.json({ received: true, status: "ignored" });
}
