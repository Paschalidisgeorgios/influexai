export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

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
    return NextResponse.json({ error: "Nicht genug Credits." }, { status: 402 });
  }

  await supabase
    .from("profiles")
    .update({
      credits: (profile?.credits ?? 0) - job.estimated_credits,
    })
    .eq("id", user.id);

  await supabase
    .from("avatar_render_jobs")
    .update({
      status: "queued",
      updated_at: new Date().toISOString(),
    })
    .eq("id", jobId);

  // TODO: RunPod Endpoint aufrufen
  // const runpodResponse = await callRunPod(job)
  // await supabase.from('avatar_render_jobs')
  //   .update({ runpod_job_id: runpodResponse.id, status: 'running' })
  //   .eq('id', jobId)

  const estimatedCredits = job.estimated_credits;
  setTimeout(async () => {
    try {
      const admin = createServiceSupabaseClient();
      await admin
        .from("avatar_render_jobs")
        .update({
          status: "completed",
          updated_at: new Date().toISOString(),
          used_credits: estimatedCredits,
        })
        .eq("id", jobId);
    } catch (err) {
      console.error("[avatar/start-render mock]", err);
    }
  }, 5000);

  return NextResponse.json({
    success: true,
    jobId,
    status: "queued",
    message: "Job gestartet. RunPod wird später angebunden.",
  });
}
