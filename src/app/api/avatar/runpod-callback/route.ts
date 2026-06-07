export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

import { createServiceSupabaseClient } from "@/lib/supabase/service";

export async function POST(req: NextRequest) {
  // TODO: RunPod Webhook Secret validieren
  const body = await req.json();

  const { jobId, status, rawOutputUrl, qualityReport } = body as {
    jobId?: string;
    status?: string;
    rawOutputUrl?: string;
    qualityReport?: unknown;
  };

  if (!jobId) {
    return NextResponse.json({ error: "jobId required" }, { status: 400 });
  }

  const supabase = createServiceSupabaseClient();

  await supabase
    .from("avatar_render_jobs")
    .update({
      status: status === "completed" ? "completed" : "failed",
      raw_output_url: rawOutputUrl ?? null,
      quality_report: qualityReport ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", jobId);

  return NextResponse.json({ received: true });
}
