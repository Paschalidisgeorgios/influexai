import { NextResponse } from "next/server";
import { executeRealCampaign } from "@/lib/agent/campaignExecutor";
import {
  createCampaignExecution,
  createExecution,
} from "@/lib/agent/mockExecutor";
import {
  saveCampaignResultServer,
  saveExecutionServer,
  saveTextToolRunsServer,
} from "@/lib/agent/persistExecution";
import { orchestrate } from "@/lib/agent/toolOrchestrator";
import { estimateKiAgentOrchestrateCredits } from "@/lib/agent/ki-agent-orchestrate-credits";
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
import { CAMPAIGN_AUTOPILOT_IS_PREVIEW } from "@/lib/agent/campaignPlanner";
import {
  buildPlannerBlockedPayload,
  evaluatePlannerGuard,
  isBlockingPlannerDecision,
} from "@/lib/agent/planner-guard";
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

function completeCampaignExecution(
  exec: CampaignExecution,
  usedCredits?: number
): CampaignExecution {
  const completedSteps = exec.steps.map((step) => ({
    ...step,
    status: "completed" as const,
  }));
  return {
    ...exec,
    status: "completed",
    steps: completedSteps,
    usedCredits: usedCredits ?? exec.estimatedCredits ?? 0,
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

    const completedExec = completeCampaignExecution(execWithUser, 0);

    let result;
    try {
      result = await executeRealCampaign({
        exec: completedExec,
        supabase,
        userId,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    if (!CAMPAIGN_AUTOPILOT_IS_PREVIEW) {
      try {
        await saveCampaignResultServer(
          supabase,
          result,
          userId,
          prompt,
          platforms
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        const friendly =
          /invalid input syntax for type uuid|PGRST|postgres|violates|duplicate key/i.test(
            msg
          )
            ? "Kampagne konnte nicht gespeichert werden. Bitte erneut versuchen."
            : msg || "Kampagne konnte nicht gespeichert werden.";
        return NextResponse.json({ error: friendly }, { status: 500 });
      }
    }

    const finalExec = completeCampaignExecution(
      { ...execWithUser, result },
      result.usedCredits
    );

    return NextResponse.json({
      execution: finalExec,
      result,
      usedCredits: result.usedCredits,
    });
  }


  const access = await assertKiToolAccess(0);
  if (access instanceof NextResponse) return access;
  const { userId, supabase } = access;

  let availableCredits: number | undefined;
  const { data: profileBefore } = await supabase
    .from("profiles")
    .select("credits")
    .eq("id", userId)
    .maybeSingle();
  if (typeof profileBefore?.credits === "number") {
    availableCredits = profileBefore.credits;
  }

  const plan = evaluatePlannerGuard(prompt, availableCredits);
  if (isBlockingPlannerDecision(plan.decision)) {
    return NextResponse.json(buildPlannerBlockedPayload(plan));
  }

  const exec = createExecution(prompt);
  const billingEstimate = estimateKiAgentOrchestrateCredits(exec.intent);

  const creditAccess = await assertKiToolAccess(billingEstimate.max);
  if (creditAccess instanceof NextResponse) return creditAccess;

  const execWithUser = {
    ...exec,
    userId,
    estimatedCredits: billingEstimate.typical,
  };

  let result: AgentResult;
  try {
    result = await orchestrate(execWithUser.intent, prompt, {
      supabase,
      userId,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Fehler";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  const { data: profileAfter } = await supabase
    .from("profiles")
    .select("credits")
    .eq("id", userId)
    .single();

  const completedSteps = execWithUser.steps.map((step) => ({
    ...step,
    status: "completed" as const,
  }));
  const completedExec: AgentExecution = {
    ...execWithUser,
    status: "completed",
    steps: completedSteps,
    result,
    usedCredits: 0,
    updatedAt: new Date().toISOString(),
  };

  await saveExecutionServer(supabase, completedExec);

  if (result.toolRuns?.length) {
    await saveTextToolRunsServer(
      supabase,
      userId,
      completedExec.id,
      prompt,
      result.toolRuns
    );
  }

  return NextResponse.json({
    execution: completedExec,
    result,
    usedCredits: 0,
    estimatedCredits: billingEstimate.typical,
    billingNote:
      "Credits werden von den ausgeführten Tools abgezogen — keine separate Agent-Gebühr.",
    remainingCredits: profileAfter?.credits,
  });
}
