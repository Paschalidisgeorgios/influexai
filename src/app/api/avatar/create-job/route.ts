export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { estimateAvatarCredits } from "@/lib/avatar/pricing";
import type { AvatarRenderOptions } from "@/lib/avatar/types";

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const {
    sourceImageKey,
    sourceImageUrl,
    drivingVideoKey,
    drivingVideoUrl,
    options,
    consentGiven,
  } = (await req.json()) as {
    sourceImageKey: string;
    sourceImageUrl: string;
    drivingVideoKey: string;
    drivingVideoUrl: string;
    options: AvatarRenderOptions;
    consentGiven: boolean;
  };

  if (!consentGiven) {
    return NextResponse.json(
      { error: "Einwilligung erforderlich." },
      { status: 400 }
    );
  }

  const estimatedCredits = estimateAvatarCredits(options);

  const { data: profile } = await supabase
    .from("profiles")
    .select("credits")
    .eq("id", user.id)
    .single();

  if ((profile?.credits ?? 0) < estimatedCredits) {
    return NextResponse.json(
      {
        error: "Nicht genug Credits.",
        required: estimatedCredits,
        available: profile?.credits ?? 0,
      },
      { status: 402 }
    );
  }

  const { data: job, error } = await supabase
    .from("avatar_render_jobs")
    .insert({
      user_id: user.id,
      source_image_key: sourceImageKey,
      source_image_url: sourceImageUrl,
      driving_video_key: drivingVideoKey,
      driving_video_url: drivingVideoUrl,
      options,
      estimated_credits: estimatedCredits,
      status: "draft",
      consent_given: true,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    job,
    estimatedCredits,
  });
}
