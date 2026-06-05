import { NextResponse } from "next/server";
import { runCompetitorAnalysis } from "@/lib/competitor-run";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { assertGatedFeature } from "@/lib/access";

export const maxDuration = 60;

/** @deprecated Prefer POST /api/competitor with { channelUrl } */
export async function POST(request: Request) {
  const denied = await assertGatedFeature("competitor");
  if (denied) return denied;

  let body: { channel_url?: string; channelUrl?: string };
  try {
    body = (await request.json()) as { channel_url?: string; channelUrl?: string };
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const channelUrl =
    body.channelUrl?.trim() ?? body.channel_url?.trim() ?? "";

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Nicht eingeloggt." },
      { status: 401 }
    );
  }

  const result = await runCompetitorAnalysis(supabase, user.id, channelUrl);

  if (!result.ok) {
    const { failure } = result;
    return NextResponse.json(
      {
        success: false,
        error: failure.error,
        credits: failure.credits,
        required: failure.required,
      },
      { status: failure.status }
    );
  }

  const { creditsLeft, ...payload } = result.data;

  return NextResponse.json({
    success: true,
    ...payload,
    creditsLeft,
  });
}
