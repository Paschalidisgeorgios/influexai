import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hasEnoughCredits } from "@/lib/credits";
import { logGeneration } from "@/lib/activity-log";
import { invalidateUserGenerations } from "@/lib/cache";
import { createAnthropicMessage } from "@/lib/anthropic";
import {
  buildCompetitorUserPrompt,
  COMPETITOR_ANALYSIS_CREDIT_COST,
  COMPETITOR_ANALYSIS_SYSTEM_PROMPT,
  parseCompetitorAnalysis,
  type CompetitorAnalysisResponse,
} from "@/lib/competitor-analysis";
import { fetchYouTubeChannelBundle } from "@/lib/youtube-channel";

export const maxDuration = 60;

export async function POST(request: Request) {
  let body: { channel_url?: string };
  try {
    body = (await request.json()) as { channel_url?: string };
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const channelUrl = body.channel_url?.trim() ?? "";
  if (!channelUrl) {
    return NextResponse.json(
      { success: false, error: "Bitte gib eine YouTube-Kanal-URL oder @handle ein." },
      { status: 400 }
    );
  }

  if (!process.env.YOUTUBE_API_KEY?.trim()) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Video-Metadaten sind gerade nicht verfügbar. Bitte Titel und Beschreibung manuell eingeben.",
      },
      { status: 503 }
    );
  }

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

  const creditCheck = await hasEnoughCredits(
    supabase,
    user.id,
    COMPETITOR_ANALYSIS_CREDIT_COST
  );
  if (!creditCheck.ok) {
    return NextResponse.json(
      {
        success: false,
        error: "Nicht genug Credits.",
        credits: creditCheck.credits,
        required: COMPETITOR_ANALYSIS_CREDIT_COST,
      },
      { status: 402 }
    );
  }

  let bundle;
  try {
    bundle = await fetchYouTubeChannelBundle(channelUrl);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "YouTube-Daten konnten nicht geladen werden.";
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }

  const claude = await createAnthropicMessage({
    system: COMPETITOR_ANALYSIS_SYSTEM_PROMPT,
    user: buildCompetitorUserPrompt(bundle),
    maxTokens: 2048,
    model: "claude-opus-4-5",
  });

  if (!claude.ok) {
    return NextResponse.json(
      { success: false, error: claude.error },
      { status: 503 }
    );
  }

  let analysis;
  try {
    analysis = parseCompetitorAnalysis(claude.text, bundle);
  } catch (e) {
    console.error("[competitor-analysis] parse:", e);
    return NextResponse.json(
      { success: false, error: "KI-Antwort konnte nicht gelesen werden." },
      { status: 500 }
    );
  }

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("credits")
    .eq("id", user.id)
    .single();

  if (profileErr || !profile) {
    return NextResponse.json(
      { success: false, error: "Profil nicht gefunden." },
      { status: 500 }
    );
  }

  const previousCredits = profile.credits ?? 0;
  if (previousCredits < COMPETITOR_ANALYSIS_CREDIT_COST) {
    return NextResponse.json(
      {
        success: false,
        error: "Nicht genug Credits.",
        credits: previousCredits,
        required: COMPETITOR_ANALYSIS_CREDIT_COST,
      },
      { status: 402 }
    );
  }

  const remainingCredits = previousCredits - COMPETITOR_ANALYSIS_CREDIT_COST;
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ credits: remainingCredits })
    .eq("id", user.id);

  if (updateError) {
    return NextResponse.json(
      { success: false, error: "Credits konnten nicht abgezogen werden." },
      { status: 500 }
    );
  }

  const payload: CompetitorAnalysisResponse = {
    channel: bundle.channel,
    topVideos: bundle.topVideos.slice(0, 5),
    analysis,
  };

  const promptSummary = `${bundle.channel.title} · ${channelUrl.slice(0, 120)}`;

  const { error: genErr } = await supabase.from("generations").insert({
    user_id: user.id,
    type: "competitor_analysis",
    prompt: promptSummary,
    credits_used: COMPETITOR_ANALYSIS_CREDIT_COST,
    result: payload,
  });

  if (genErr) {
    await logGeneration(supabase, user.id, {
      type: "competitor_analysis",
      prompt: promptSummary,
      creditsUsed: COMPETITOR_ANALYSIS_CREDIT_COST,
    });
  }

  await supabase.from("credit_transactions").insert({
    user_id: user.id,
    amount: -COMPETITOR_ANALYSIS_CREDIT_COST,
    description: "competitor_analysis",
  });

  invalidateUserGenerations(user.id);

  return NextResponse.json({
    success: true,
    ...payload,
    creditsLeft: remainingCredits,
  });
}
