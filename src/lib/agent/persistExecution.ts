import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type {
  AgentExecution,
  AgentTextToolRun,
  CampaignExecution,
  CampaignPlatform,
  CampaignResult,
} from "./types";

export async function saveTextToolRunServer(
  supabase: SupabaseClient,
  params: {
    userId: string;
    parentExecutionId: string;
    prompt: string;
    run: AgentTextToolRun;
  }
): Promise<void> {
  try {
    const { error } = await supabase.from("agent_executions").insert({
      user_id: params.userId,
      prompt: params.prompt,
      intent: params.run.tool,
      selected_tools: [params.run.tool],
      status: "completed",
      steps: [],
      result: {
        tool: params.run.tool,
        input: params.run.input,
        output: params.run.output,
        qualityScore: params.run.qualityScore,
        retried: params.run.retried,
        parentExecutionId: params.parentExecutionId,
      },
      estimated_credits: 0,
      used_credits: 0,
    });
    if (error) console.error("[persistExecution] tool run:", error.message);
  } catch (e) {
    console.error("[persistExecution] tool run:", e);
  }
}

export async function saveTextToolRunsServer(
  supabase: SupabaseClient,
  userId: string,
  parentExecutionId: string,
  prompt: string,
  toolRuns: AgentTextToolRun[]
): Promise<void> {
  for (const run of toolRuns) {
    await saveTextToolRunServer(supabase, {
      userId,
      parentExecutionId,
      prompt,
      run,
    });
  }
}

export async function saveExecutionServer(
  supabase: SupabaseClient,
  exec: AgentExecution
): Promise<void> {
  try {
    const { error } = await supabase.from("agent_executions").upsert({
      id: exec.id,
      user_id: exec.userId,
      prompt: exec.prompt,
      intent: exec.intent,
      selected_tools: exec.selectedTools,
      status: exec.status,
      steps: exec.steps,
      result: exec.result ?? null,
      estimated_credits: exec.estimatedCredits ?? 0,
      used_credits: exec.usedCredits ?? 0,
      updated_at: new Date().toISOString(),
    });
    if (error) console.error("[persistExecution]", error.message);
  } catch (e) {
    console.error("[persistExecution]", e);
  }
}

export async function saveCampaignExecutionServer(
  supabase: SupabaseClient,
  exec: CampaignExecution,
  result: CampaignResult
): Promise<void> {
  try {
    const { error } = await supabase.from("agent_executions").upsert({
      id: exec.id,
      user_id: exec.userId,
      prompt: exec.prompt,
      intent: "campaign_autopilot",
      selected_tools: ["campaign_autopilot"],
      status: "completed",
      steps: exec.steps,
      result: {
        type: "campaign",
        mode: result.mode,
        goal: exec.goal,
        tone: exec.tone,
        platforms: exec.platforms,
        campaignResult: result,
      },
      estimated_credits: exec.estimatedCredits ?? 0,
      used_credits: result.usedCredits,
      updated_at: new Date().toISOString(),
    });
    if (error) console.error("[persistExecution] campaign exec:", error.message);
  } catch (e) {
    console.error("[persistExecution] campaign exec:", e);
  }
}

export async function saveCampaignResultServer(
  supabase: SupabaseClient,
  result: CampaignResult,
  userId: string,
  prompt = "",
  platforms: CampaignPlatform[] = []
): Promise<void> {
  try {
    const { error } = await supabase.from("campaign_results").insert({
      id: result.id,
      user_id: userId,
      mode: result.mode,
      prompt,
      platforms: result.brandDNA?.platforms ?? platforms,
      brand_dna: result.brandDNA,
      assumptions: [
        ...(result.assumptionsMade ?? []),
        ...(result.tips ?? []),
      ],
      items: result.items,
      overall_scores: {
        ...result.overallScores,
        expectedReach: result.expectedReach,
        tips: result.tips,
        strategy: result.strategy,
      },
      estimated_credits: result.estimatedCredits,
      used_credits: result.usedCredits,
      title: result.title,
      summary: result.summary,
    });
    if (error) throw new Error(error.message);
  } catch (e) {
    console.error("[saveCampaignResult]", e);
    if (e instanceof Error) throw e;
    throw new Error("Speichern fehlgeschlagen");
  }
}

export async function saveExecution(exec: AgentExecution): Promise<void> {
  try {
    const supabase = createClient();
    await supabase.from("agent_executions").upsert({
      id: exec.id,
      user_id: exec.userId,
      prompt: exec.prompt,
      intent: exec.intent,
      selected_tools: exec.selectedTools,
      status: exec.status,
      steps: exec.steps,
      result: exec.result ?? null,
      estimated_credits: exec.estimatedCredits ?? 0,
      used_credits: exec.usedCredits ?? 0,
      updated_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error("[persistExecution]", e);
  }
}

export async function saveFeedback(feedback: {
  executionId?: string;
  action: string;
  tool?: string;
  intent?: string;
  rating?: number;
}): Promise<void> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase.from("agent_feedback").insert({
      user_id: user?.id,
      execution_id: feedback.executionId ?? null,
      action: feedback.action,
      tool: feedback.tool ?? null,
      intent: feedback.intent ?? null,
      rating: feedback.rating ?? null,
    });
  } catch (e) {
    console.error("[saveFeedback]", e);
  }
}

export async function saveCampaignResult(
  result: CampaignResult,
  userId?: string,
  prompt = "",
  platforms: CampaignPlatform[] = []
): Promise<void> {
  try {
    const supabase = createClient();
    await supabase.from("campaign_results").insert({
      id: result.id,
      user_id: userId,
      mode: result.mode,
      prompt,
      platforms: result.brandDNA?.platforms ?? platforms,
      brand_dna: result.brandDNA,
      assumptions: [
        ...(result.assumptionsMade ?? []),
        ...(result.tips ?? []),
      ],
      items: result.items,
      overall_scores: {
        ...result.overallScores,
        expectedReach: result.expectedReach,
        tips: result.tips,
        strategy: result.strategy,
      },
      estimated_credits: result.estimatedCredits,
      used_credits: result.usedCredits,
      title: result.title,
      summary: result.summary,
    });
  } catch (e) {
    console.error("[saveCampaignResult]", e);
  }
}
