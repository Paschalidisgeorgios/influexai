import { after, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { executeRealCampaign } from "@/lib/agent/campaignExecutor";
import {
  createCampaignExecution,
} from "@/lib/agent/mockExecutor";
import {
  enqueueJob,
  needsJobQueue,
  updateJobStatus,
} from "@/lib/agent/jobQueue";
import {
  saveCampaignExecutionServer,
  saveCampaignResultServer,
} from "@/lib/agent/persistExecution";
import type {
  CampaignExecution,
  CampaignGoal,
  CampaignMode,
  CampaignPlatform,
  CampaignResult,
  CampaignTone,
} from "@/lib/agent/types";
import { assertKiToolAccess } from "@/lib/access.server";
import { CAMPAIGN_AUTOPILOT_IS_PREVIEW } from "@/lib/agent/campaignPlanner";

export const dynamic = "force-dynamic";

export const maxDuration = 300;

type RequestBody = {
  prompt?: string;
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

const CAMPAIGN_PREVIEW_ERROR =
  "Preview konnte nicht erstellt werden. Bitte versuche es erneut.";

function sanitizeCampaignError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (
    /invalid input syntax for type uuid|PGRST|postgres|violates|duplicate key/i.test(
      msg
    )
  ) {
    return CAMPAIGN_PREVIEW_ERROR;
  }
  return msg || CAMPAIGN_PREVIEW_ERROR;
}

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

async function runJobAsync(
  jobId: string,
  execution: CampaignExecution,
  supabase: SupabaseClient,
  userId: string
) {
  try {
    await updateJobStatus(supabase, jobId, "running");
    const result = await executeRealCampaign({
      exec: execution,
      supabase,
      userId,
      jobId,
    });

    if (!CAMPAIGN_AUTOPILOT_IS_PREVIEW) {
      const completedExec = completeCampaignExecution(
        { ...execution, result, usedCredits: result.usedCredits },
        result.usedCredits
      );
      await saveCampaignResultServer(
        supabase,
        result,
        userId,
        execution.prompt,
        execution.platforms
      );
      await saveCampaignExecutionServer(supabase, completedExec, result);
    }

    await updateJobStatus(supabase, jobId, "completed", {
      ...result,
      usedCredits: result.usedCredits,
    });
  } catch (err) {
    const msg = sanitizeCampaignError(err);
    await updateJobStatus(supabase, jobId, "failed", undefined, msg);
  }
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
      { error: "Bitte gib einen Kampagnen-Prompt ein." },
      { status: 400 }
    );
  }

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

  if (needsJobQueue(estimatedCredits)) {
    const jobId = await enqueueJob(supabase, {
      type: "campaign",
      userId,
      payload: {
        prompt,
        mode,
        platforms,
        goal,
        tone,
        executionId: exec.id,
        estimatedCredits,
      },
      estimatedDuration: Math.ceil(estimatedCredits * 3),
    });

    after(() =>
      runJobAsync(jobId, execWithUser, supabase, userId).catch((err) =>
        console.error("[campaign job]", err)
      )
    );

    return NextResponse.json({
      jobId,
      execution: execWithUser,
      status: "queued",
      message: "Großer Job wurde in die Warteschlange gestellt.",
      pollUrl: `/api/agent/job/${jobId}`,
    });
  }

  let result: CampaignResult;
  try {
    result = await executeRealCampaign({
      exec: execWithUser,
      supabase,
      userId,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: sanitizeCampaignError(err) },
      { status: 500 }
    );
  }

  const usedCredits = result.usedCredits;

  const completedExec = completeCampaignExecution({
    ...execWithUser,
    result,
    usedCredits,
  });

  if (!CAMPAIGN_AUTOPILOT_IS_PREVIEW) {
    try {
      await saveCampaignResultServer(supabase, result, userId, prompt, platforms);
      await saveCampaignExecutionServer(supabase, completedExec, result);
    } catch (err: unknown) {
      return NextResponse.json(
        { error: sanitizeCampaignError(err) },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({
    execution: completedExec,
    result,
    usedCredits,
  });
}
