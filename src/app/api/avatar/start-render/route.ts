export const dynamic = "force-dynamic";
export const maxDuration = 300;

import { fal } from "@fal-ai/client";
import { NextRequest, NextResponse } from "next/server";

import { chargeAvatarCredits, refundCredits } from "@/lib/avatar/credits";
import { configureFalClient, getFalKey } from "@/lib/fal-image";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { providerRouteGuardResponse } from "@/lib/environment-safety.server";

export async function POST(req: NextRequest) {
  const writeGuard = providerRouteGuardResponse();
  if (writeGuard) return writeGuard;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!getFalKey()) {
    return NextResponse.json(
      { error: "Video-Engine ist nicht konfiguriert." },
      { status: 503 }
    );
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

  if (!job.source_image_url || !job.driving_video_url) {
    return NextResponse.json(
      { error: "Bild oder Video fehlt im Job." },
      { status: 400 }
    );
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

  // Pre-Pay: Credits upfront abziehen, bevor der fal.ai-Render startet.
  // estimated_credits stammt unverändert aus create-job (dort gesetzt, hier nur gelesen).
  let creditCharged = false;
  const charged = await chargeAvatarCredits(
    supabase,
    user.id,
    job.estimated_credits,
    jobId
  );

  if (charged === null) {
    await supabase
      .from("avatar_render_jobs")
      .update({
        status: "failed",
        error: "Credit-Abzug fehlgeschlagen.",
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    return NextResponse.json(
      { error: "Credit-Abzug fehlgeschlagen. Bitte erneut versuchen." },
      { status: 402 }
    );
  }

  // Credits erfolgreich abgezogen — ab hier Refund bei Fehler nötig.
  creditCharged = true;

  await supabase
    .from("avatar_render_jobs")
    .update({
      status: "running",
      updated_at: new Date().toISOString(),
    })
    .eq("id", jobId);

  try {
    configureFalClient();

    const result = (await fal.subscribe("fal-ai/live-portrait", {
      input: {
        image_url: job.source_image_url,
        video_url: job.driving_video_url,
        flag_do_crop: true,
        flag_do_rot: true,
        dsize: 512,
        scale: 2.3,
      },
    })) as { video?: { url: string }; data?: { video?: { url: string } } };

    const videoUrl = result?.data?.video?.url ?? result?.video?.url;
    if (!videoUrl) {
      await refundCredits(
        supabase,
        user.id,
        job.estimated_credits,
        "Avatar Video — Refund"
      );
      await supabase
        .from("avatar_render_jobs")
        .update({
          status: "failed",
          error: "Kein Video generiert.",
          updated_at: new Date().toISOString(),
        })
        .eq("id", jobId);

      return NextResponse.json(
        { error: "Render fehlgeschlagen." },
        { status: 500 }
      );
    }

    await supabase
      .from("avatar_render_jobs")
      .update({
        status: "completed",
        final_output_url: videoUrl,
        raw_output_url: videoUrl,
        used_credits: job.estimated_credits,
        error: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    return NextResponse.json({
      success: true,
      jobId,
      status: "completed",
      videoUrl,
      creditsLeft: charged,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Render fehlgeschlagen.";

    if (creditCharged) {
      await refundCredits(
        supabase,
        user.id,
        job.estimated_credits,
        "Avatar Video — Refund"
      );
    }

    await supabase
      .from("avatar_render_jobs")
      .update({
        status: "failed",
        error: message,
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    return NextResponse.json({ error: "Render fehlgeschlagen." }, { status: 500 });
  }
}
