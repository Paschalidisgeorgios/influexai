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
import { assertKiToolAccess } from "@/lib/access.server";
import { deductCredits } from "@/lib/credits";

export const dynamic = "force-dynamic";

export const maxDuration = 120;

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
      tone
    );
    const estimatedCredits = exec.estimatedCredits ?? 0;

    const access = await assertKiToolAccess(estimatedCredits);
    if (access instanceof NextResponse) return access;
    const { userId, supabase } = access;

    const execWithUser = { ...exec, userId };

    const deducted = await deductCredits(
      supabase,
      userId,
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

    const completedExec = completeCampaignExecution(execWithUser);
    const result = buildCampaignResult(completedExec);

    await saveCampaignResultServer(
      supabase,
      result,
      userId,
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

  const exec = createExecution(prompt);
  const estimatedCredits = exec.estimatedCredits ?? 0;
  const authCookie = request.headers.get("cookie") ?? "";

  const access = await assertKiToolAccess(estimatedCredits);
  if (access instanceof NextResponse) return access;
  const { userId, supabase } = access;

  const execWithUser = { ...exec, userId: userId };

  let result: AgentResult;
  try {
    result = await orchestrate(execWithUser.intent, prompt, authCookie);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Fehler";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  const deducted = await deductCredits(supabase, userId, estimatedCredits, "KI Agent", {
    generationType: "ki-agent",
    prompt: prompt.slice(0, 200),
  });
  if (!deducted.success) {
    return NextResponse.json(
      { error: deducted.error ?? "Credits abbuchen fehlgeschlagen." },
      { status: 500 }
    );
  }

  const completedSteps = execWithUser.steps.map((step) => ({
    ...step,
    status: "completed" as const,
  }));
  const completedExec: AgentExecution = {
    ...execWithUser,
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
