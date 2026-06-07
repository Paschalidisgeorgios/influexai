import { createClient } from "@/lib/supabase/client";
import type { AgentExecution, CampaignPlatform, CampaignResult } from "./types";

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
      assumptions: result.assumptionsMade,
      items: result.items,
      overall_scores: result.overallScores,
      estimated_credits: result.estimatedCredits,
      used_credits: result.usedCredits,
      title: result.title,
      summary: result.summary,
    });
  } catch (e) {
    console.error("[saveCampaignResult]", e);
  }
}
