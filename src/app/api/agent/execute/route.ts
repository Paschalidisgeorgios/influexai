import { NextResponse } from "next/server";
import {
  buildCampaignResult,
  createCampaignExecution,
  createExecution,
} from "@/lib/agent/mockExecutor";
import {
  saveCampaignResultServer,
  saveExecutionServer,
} from "@/lib/agent/persistExecution";
import { orchestrate } from "@/lib/agent/toolOrchestrator";
import type {
  AgentExecution,
  AgentResult,
  CampaignExecution,
  CampaignGoal,
  CampaignMode,
  CampaignPlatform,
  CampaignTone,
} from "@/lib/agent/types";
import { deductCredits, hasEnoughCredits } from "@/lib/credits";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ExecuteType = "agent" | "campaign";

type RequestBody = {
  prompt?: string;
  type?: ExecuteType;
  mode?: CampaignMode;
  platforms?: CampaignPlatform[];
  goal?: CampaignGoal;
  tone?: CampaignTone;
};

const CAMPAIGN_MODES: CampaignMode[] = [
  "sprint",
  "weekly",
  "monthly",
  "product_launch",
];

const CAMPAIGN_PLATFORMS: CampaignPlatform[] = [
  "instagram",
  "tiktok",
  "youtube_shorts",
  "linkedin",
];

const CAMPAIGN_GOALS: CampaignGoal[] = [
  "reach",
  "leads",
  "trust",
  "product_sales",
  "branding",
];

const CAMPAIGN_TONES: CampaignTone[] = [
  "professional",
  "modern",
  "direct",
  "trustworthy",
  "bold",
];

function completeCampaignExecution(exec: CampaignExecution): CampaignExecution {
  const completedSteps = exec.steps.map((step) => ({
    ...step,
    status: "completed" as const,
  }));
  return {
    ...exec,
    status: "completed",
    steps: completedSteps,
    usedCredits: exec.estimatedCredits ?? 0,
    updatedAt: new Date().toISOString(),
  };
}

export async function POST(request: Request) {
  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const prompt = body.prompt?.trim() ?? "";
  if (!prompt) {
    return NextResponse.json(
      { error: "Bitte gib einen Prompt ein." },
      { status: 400 }
    );
  }

  const type: ExecuteType = body.type === "campaign" ? "campaign" : "agent";

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht eingeloggt." }, { status: 401 });
  }

  if (type === "campaign") {
    const mode = body.mode;
    const platforms = body.platforms;
    const goal = body.goal;
    const tone = body.tone;

    if (!mode || !CAMPAIGN_MODES.includes(mode)) {
      return NextResponse.json(
        { error: "Ungültiger Kampagnen-Modus." },
        { status: 400 }
      );
    }
    if (
      !platforms?.length ||
      !platforms.every((p) => CAMPAIGN_PLATFORMS.includes(p))
    ) {
      return NextResponse.json(
        { error: "Bitte wähle gültige Plattformen." },
        { status: 400 }
      );
    }
    if (!goal || !CAMPAIGN_GOALS.includes(goal)) {
      return NextResponse.json(
        { error: "Ungültiges Kampagnen-Ziel." },
        { status: 400 }
      );
    }
    if (!tone || !CAMPAIGN_TONES.includes(tone)) {
      return NextResponse.json(
        { error: "Ungültiger Kampagnen-Ton." },
        { status: 400 }
      );
    }

    const exec = createCampaignExecution(
      prompt,
      mode,
      platforms,
      goal,
      tone,
      user.id
    );
    const estimatedCredits = exec.estimatedCredits ?? 0;

    const creditCheck = await hasEnoughCredits(
      supabase,
      user.id,
      estimatedCredits
    );
    if (!creditCheck.ok) {
      return NextResponse.json(
        {
          error: "Nicht genug Credits",
          credits: creditCheck.credits,
          required: estimatedCredits,
        },
        { status: 402 }
      );
    }

    const deducted = await deductCredits(
      supabase,
      user.id,
      estimatedCredits,
      "Campaign Autopilot",
      {
        generationType: "campaign-autopilot",
        prompt: prompt.slice(0, 200),
      }
    );
    if (!deducted.success) {
      return NextResponse.json(
        { error: deducted.error ?? "Credits abbuchen fehlgeschlagen." },
        { status: 500 }
      );
    }

    const completedExec = completeCampaignExecution(exec);
    const result = buildCampaignResult(completedExec);

    await saveCampaignResultServer(
      supabase,
      result,
      user.id,
      prompt,
      platforms
    );

    return NextResponse.json({
      execution: completedExec,
      result,
      usedCredits: estimatedCredits,
      remainingCredits: deducted.remainingCredits,
    });
  }

  const exec = createExecution(prompt, user.id);
  const estimatedCredits = exec.estimatedCredits ?? 0;
  const authCookie = request.headers.get("cookie") ?? "";

  const creditCheck = await hasEnoughCredits(
    supabase,
    user.id,
    estimatedCredits
  );
  if (!creditCheck.ok) {
    return NextResponse.json(
      {
        error: "Nicht genug Credits",
        credits: creditCheck.credits,
        required: estimatedCredits,
      },
      { status: 402 }
    );
  }

  let result: AgentResult;
  try {
    result = await orchestrate(exec.intent, prompt, authCookie);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Fehler";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  const deducted = await deductCredits(supabase, user.id, estimatedCredits, "KI Agent", {
    generationType: "ki-agent",
    prompt: prompt.slice(0, 200),
  });
  if (!deducted.success) {
    return NextResponse.json(
      { error: deducted.error ?? "Credits abbuchen fehlgeschlagen." },
      { status: 500 }
    );
  }

  const completedSteps = exec.steps.map((step) => ({
    ...step,
    status: "completed" as const,
  }));
  const completedExec: AgentExecution = {
    ...exec,
    status: "completed",
    steps: completedSteps,
    result,
    usedCredits: estimatedCredits,
    updatedAt: new Date().toISOString(),
  };

  await saveExecutionServer(supabase, completedExec);

  return NextResponse.json({
    execution: completedExec,
    result,
    usedCredits: estimatedCredits,
    remainingCredits: deducted.remainingCredits,
  });
}
