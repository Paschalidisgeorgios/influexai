import type { SupabaseClient } from "@supabase/supabase-js";
import { enhanceImagePromptForAgent } from "@/lib/ai/imagePromptEnhancer";
import { inferImageStyleAndPlatform } from "@/lib/ai/imageStylePresets";
import { parseScriptBlocks } from "@/lib/script-format";
import {
  CAMPAIGN_SPECS,
  CAMPAIGN_STEPS,
  enrichCampaignItemsWithMeta,
  generateCampaignPlan,
  inferBrandDNA,
  type CampaignPlanStep,
} from "@/lib/agent/campaignPlanner";
import { getCreatorProfile } from "@/lib/agent/creatorMemory";
import { updateJobProgress, updateJobStatus } from "@/lib/agent/jobQueue";
import { saveTextToolRunServer } from "@/lib/agent/persistExecution";
import {
  runContentKalenderTextTool,
  runProductAdTextTool,
  runTrendScriptTextTool,
  runViralHookTextTool,
} from "@/lib/agent/text-tool-runners";
import { runVisualQAWithRetry } from "@/lib/agent/visualQuality";
import type {
  AgentExecutionStep,
  AgentTextToolRun,
  CampaignExecution,
  CampaignPlatform,
  CampaignResult,
  ContentItem,
  ContentScores,
} from "@/lib/agent/types";
import type { ContentKalenderPlatform } from "@/lib/content-kalender-tool";
import type { TrendScriptPlatform, TrendScriptRegion } from "@/lib/trend-script-tool";
import type { ProductAdPlatform } from "@/lib/product-ad-config";

function mapCampaignPlatform(p: CampaignPlatform): string {
  const map: Record<CampaignPlatform, string> = {
    instagram: "Instagram",
    tiktok: "TikTok",
    youtube_shorts: "YouTube",
    linkedin: "LinkedIn",
  };
  return map[p];
}

function newItemId(type: string) {
  return `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function hookFromScript(script: string): string {
  const blocks = parseScriptBlocks(script);
  return (
    blocks.find((b) => b.tag === "hook")?.lines.join("\n").trim() ??
    script.split("\n")[0]?.trim() ??
    ""
  );
}

async function executePlanStep(
  step: CampaignPlanStep,
  ctx: {
    supabase: SupabaseClient;
    userId: string;
    prompt: string;
    executionId: string;
  }
): Promise<{ run: AgentTextToolRun; item?: ContentItem }> {
  const platform = (step.platform ?? "tiktok") as CampaignPlatform;

  switch (step.tool) {
    case "viral-hook": {
      const input = String(step.input.input ?? ctx.prompt);
      const run = await runViralHookTextTool(input);
      await saveTextToolRunServer(ctx.supabase, {
        userId: ctx.userId,
        parentExecutionId: ctx.executionId,
        prompt: ctx.prompt,
        run,
      });
      const hook = run.output[0] ?? "";
      return {
        run,
        item: {
          id: newItemId("reel"),
          type: step.contentType ?? "reel",
          platform,
          title: "Reel Hook",
          hook,
          content: hook,
          status: "generated",
          scores: { overallScore: run.qualityScore, hookScore: run.qualityScore },
        },
      };
    }
    case "content-kalender": {
      const run = await runContentKalenderTextTool({
        nische: String(step.input.nische ?? ctx.prompt.slice(0, 80)),
        plattform: (step.input.plattform as ContentKalenderPlatform) ?? "TikTok",
        frequenz: (step.input.frequenz as "5x_woche" | "3x_woche") ?? "5x_woche",
      });
      await saveTextToolRunServer(ctx.supabase, {
        userId: ctx.userId,
        parentExecutionId: ctx.executionId,
        prompt: ctx.prompt,
        run,
      });
      const first = run.output[0];
      return {
        run,
        item: {
          id: newItemId("post"),
          type: "post",
          platform,
          title: first?.idee?.slice(0, 60) ?? "Kalender-Post",
          content: first?.idee,
          caption: first?.idee,
          status: "generated",
          scores: { overallScore: run.qualityScore },
        },
      };
    }
    case "trend-script": {
      const run = await runTrendScriptTextTool({
        thema: String(step.input.thema ?? ctx.prompt),
        plattform: (step.input.plattform as TrendScriptPlatform) ?? "TikTok",
        region: (step.input.region as TrendScriptRegion) ?? "DE",
      });
      await saveTextToolRunServer(ctx.supabase, {
        userId: ctx.userId,
        parentExecutionId: ctx.executionId,
        prompt: ctx.prompt,
        run,
      });
      const script = run.output.script;
      return {
        run,
        item: {
          id: newItemId("reel"),
          type: "reel",
          platform,
          title: "Reel Script",
          hook: hookFromScript(script),
          script,
          content: script,
          status: "generated",
          scores: { overallScore: run.qualityScore, hookScore: run.qualityScore },
        },
      };
    }
    case "product-ad": {
      const run = await runProductAdTextTool({
        productName: String(step.input.productName ?? ctx.prompt.slice(0, 60)),
        productDescription: String(step.input.productDescription ?? ctx.prompt),
        audience: String(step.input.audience ?? "Zielgruppe"),
        platform: (step.input.platform as ProductAdPlatform) ?? "tiktok",
        style: "lifestyle",
        language: "de",
        ctaText: String(step.input.ctaText ?? "Jetzt entdecken"),
      });
      await saveTextToolRunServer(ctx.supabase, {
        userId: ctx.userId,
        parentExecutionId: ctx.executionId,
        prompt: ctx.prompt,
        run,
      });
      return {
        run,
        item: {
          id: newItemId("ad"),
          type: "ad",
          platform,
          title: "Werbespot",
          script: run.output.scriptText,
          content: run.output.scriptText,
          caption: run.output.scriptText,
          status: "generated",
          scores: { overallScore: run.qualityScore },
        },
      };
    }
    case "image-generator": {
      const userPrompt = String(step.input.prompt ?? ctx.prompt);
      const { styleId, platform: imagePlatform } =
        inferImageStyleAndPlatform(userPrompt);
      const enhanced = await enhanceImagePromptForAgent(userPrompt, {
        styleId,
        platform: imagePlatform,
      });

      console.log("[agent-image]", {
        styleId: enhanced.styleId,
        platform: enhanced.platform,
        model: "flux",
        source: "campaignExecutor",
      });

      const imageResult = await runVisualQAWithRetry({
        supabase: ctx.supabase,
        userId: ctx.userId,
        prompt: userPrompt,
        styleId: enhanced.styleId,
        platform: enhanced.platform,
        enhanced,
      });

      const run: AgentTextToolRun = {
        tool: "image-generator",
        input: step.input,
        output: imageResult,
        qualityScore: imageResult.qualityScore,
        retried: imageResult.retried,
      };
      await saveTextToolRunServer(ctx.supabase, {
        userId: ctx.userId,
        parentExecutionId: ctx.executionId,
        prompt: ctx.prompt,
        run,
      });

      return {
        run,
        item: {
          id: newItemId("visual"),
          type: "visual_briefing",
          platform,
          title: "Visual",
          imagePrompt: userPrompt,
          visualBriefing: userPrompt,
          content: userPrompt,
          caption: imageResult.imageUrl,
          status: "generated",
          scores: { overallScore: imageResult.qualityScore },
        },
      };
    }
    default:
      throw new Error(`Unbekanntes Tool: ${step.tool}`);
  }
}

function computeOverallScores(items: ContentItem[]): ContentScores {
  const scores = items
    .map((i) => i.scores?.overallScore)
    .filter((s): s is number => typeof s === "number");
  const avg =
    scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 75;
  return {
    brandFit: avg,
    clarity: avg,
    platformFit: avg,
    overallScore: avg,
    claimRisk: "low",
    legalRisk: "low",
  };
}

export async function executeRealCampaign(params: {
  exec: CampaignExecution;
  supabase: SupabaseClient;
  userId: string;
  jobId?: string;
}): Promise<CampaignResult> {
  const { exec, supabase, userId, jobId } = params;
  const { dna, assumptions } = inferBrandDNA(exec.prompt);
  const spec = CAMPAIGN_SPECS[exec.mode];
  const creatorDNA = await getCreatorProfile(supabase, userId);

  const plan = await generateCampaignPlan({
    prompt: exec.prompt,
    mode: exec.mode,
    platforms: exec.platforms,
    goal: exec.goal,
    tone: exec.tone,
    creatorDNA,
  });

  const steps: AgentExecutionStep[] = CAMPAIGN_STEPS.map((label, i) => ({
    id: `step-${i}`,
    label,
    status: "pending" as const,
  }));

  const items: ContentItem[] = [];
  const toolRuns: AgentTextToolRun[] = [];

  const markStep = async (idx: number, status: AgentExecutionStep["status"]) => {
    steps[idx] = { ...steps[idx], status };
    if (jobId) {
      await updateJobProgress(supabase, jobId, {
        steps,
        currentStep: idx,
        itemsCount: items.length,
      });
    }
  };

  await markStep(0, "running");
  await markStep(0, "completed");
  await markStep(1, "running");
  await markStep(1, "completed");
  await markStep(2, "running");
  await markStep(2, "completed");

  for (let i = 0; i < plan.length; i++) {
    const stepIdx = Math.min(i + 3, steps.length - 1);
    await markStep(stepIdx, "running");

    const { run, item } = await executePlanStep(plan[i], {
      supabase,
      userId,
      prompt: exec.prompt,
      executionId: exec.id,
    });
    toolRuns.push(run);
    if (item) items.push({ ...item, day: items.length + 1 });

    if (run.tool === "image-generator") {
      // credits tracked in result.usedCredits below
    }

    await markStep(stepIdx, "completed");
  }

  await markStep(7, "running");
  await markStep(7, "completed");

  await markStep(8, "running");
  const enrichedItems = await enrichCampaignItemsWithMeta({
    prompt: exec.prompt,
    goal: exec.goal,
    tone: exec.tone,
    platforms: exec.platforms,
    mode: exec.mode,
    creatorDNA,
    items,
  });
  items.splice(0, items.length, ...enrichedItems);
  await markStep(8, "completed");

  let usedCredits = 0;
  for (const run of toolRuns) {
    if (run.tool === "image-generator") usedCredits += 5;
    else if (run.tool === "trend-script") usedCredits += 4;
    else if (run.tool === "viral-hook") usedCredits += 3;
    else if (run.tool === "content-kalender") usedCredits += 5;
    else if (run.tool === "product-ad") usedCredits += 3;
  }

  for (let i = 9; i < steps.length; i++) {
    await markStep(i, "completed");
  }

  const result: CampaignResult = {
    id: exec.id,
    mode: exec.mode,
    title: `${spec.label} — ${exec.platforms.map(mapCampaignPlatform).join(", ")}`,
    summary: `${items.length} Content-Items für deine Kampagne generiert.`,
    brandDNA: { ...dna, platforms: exec.platforms },
    assumptionsMade: assumptions,
    items,
    overallScores: computeOverallScores(items),
    estimatedCredits: exec.estimatedCredits,
    usedCredits,
    createdAt: new Date().toISOString(),
  };

  if (jobId) {
    await updateJobStatus(supabase, jobId, "running", {
      progress: { steps, complete: true, itemsCount: items.length },
      partialResult: result,
    });
  }

  return result;
}
