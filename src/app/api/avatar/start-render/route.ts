export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

import { chargeAvatarCredits } from "@/lib/avatar/credits";
import { isRunPodConfigured, submitRunPodJob } from "@/lib/avatar/runpod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceSupabaseClient } from "@/lib/supabase/service";

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { jobId } = (await req.json()) as { jobId?: string };

  if (!jobId) {
    return NextResponse.json({ error: "jobId required" }, { status: 400 });
  }

  const { data: job } = await supabase
    .from("avatar_render_jobs")
    .select("*")
    .eq("id", jobId)
    .eq("user_id", user.id)
    .single();

  if (!job) {
    return NextResponse.json({ error: "Job nicht gefunden." }, { status: 404 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("credits")
    .eq("id", user.id)
    .single();

  if ((profile?.credits ?? 0) < job.estimated_credits) {
    return NextResponse.json(
      {
        error: "Nicht genug Credits.",
        required: job.estimated_credits,
        available: profile?.credits ?? 0,
      },
      { status: 402 }
    );
  }

  await supabase
    .from("avatar_render_jobs")
    .update({
      status: "queued",
      updated_at: new Date().toISOString(),
    })
    .eq("id", jobId);

  if (isRunPodConfigured()) {
    try {
      const { runpodJobId } = await submitRunPodJob({
        jobId,
        sourceImageUrl: job.source_image_url ?? "",
        drivingVideoUrl: job.driving_video_url ?? "",
        options: (job.options ?? {}) as Record<string, unknown>,
      });

      await supabase
        .from("avatar_render_jobs")
        .update({
          runpod_job_id: runpodJobId,
          status: "running",
          updated_at: new Date().toISOString(),
        })
        .eq("id", jobId);

      return NextResponse.json({
        success: true,
        jobId,
        runpodJobId,
        status: "running",
      });
    } catch (err) {
      await supabase
        .from("avatar_render_jobs")
        .update({
          status: "failed",
          error: err instanceof Error ? err.message : "RunPod Fehler",
          updated_at: new Date().toISOString(),
        })
        .eq("id", jobId);

      return NextResponse.json(
        { error: "Render konnte nicht gestartet werden." },
        { status: 500 }
      );
    }
  }

  await supabase
    .from("avatar_render_jobs")
    .update({
      status: "running",
      updated_at: new Date().toISOString(),
    })
    .eq("id", jobId);

  const estimatedCredits = job.estimated_credits;
  const userId = user.id;

  setTimeout(async () => {
    try {
      const admin = createServiceSupabaseClient();
      await chargeAvatarCredits(admin, userId, estimatedCredits, jobId);

      await admin
        .from("avatar_render_jobs")
        .update({
          status: "completed",
          used_credits: estimatedCredits,
          updated_at: new Date().toISOString(),
        })
        .eq("id", jobId);
    } catch (err) {
      console.error("[avatar/start-render mock]", err);
      try {
        const admin = createServiceSupabaseClient();
        await admin
          .from("avatar_render_jobs")
          .update({
            status: "failed",
            error: err instanceof Error ? err.message : "Mock render failed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", jobId);
      } catch (cleanupErr) {
        console.error("[avatar/start-render mock cleanup]", cleanupErr);
      }
    }
  }, 5000);

  return NextResponse.json({
    success: true,
    jobId,
    status: "running",
    message: "Mock-Modus aktiv.",
  });
}
