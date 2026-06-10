import type { SupabaseClient } from "@supabase/supabase-js";
import { createAnthropicMessage, parseClaudeJson } from "@/lib/anthropic";
import { enhanceImagePromptForAgent } from "@/lib/ai/imagePromptEnhancer";
import { inferImageStyleAndPlatform } from "@/lib/ai/imageStylePresets";
import { runImageGeneratorGeneration } from "@/lib/image-generator-run";
import { parseScriptBlocks } from "@/lib/script-format";
import {
  CAMPAIGN_SPECS,
  CAMPAIGN_STEPS,
  inferBrandDNA,
} from "@/lib/agent/campaignPlanner";
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
  CampaignGoal,
  CampaignMode,
  CampaignPlatform,
  CampaignResult,
  CampaignTone,
  ContentItem,
  ContentScores,
} from "@/lib/agent/types";
import type { ContentKalenderPlatform } from "@/lib/content-kalender-tool";
import type { TrendScriptPlatform, TrendScriptRegion } from "@/lib/trend-script-tool";
import type { ProductAdPlatform } from "@/lib/product-ad-config";

const PLANNER_MODEL = "claude-sonnet-4-5-20250929";

export type CampaignPlanStep = {
  reihenfolge: number;
  tool:
    | "viral-hook"
    | "content-kalender"
    | "trend-script"
    | "product-ad"
    | "image-generator";
  input: Record<string, unknown>;
  begruendung: string;
  contentType?: ContentItem["type"];
  platform?: CampaignPlatform;
};

const PLANNER_SYSTEM = `Du bist Campaign Planner für InfluexAI. Erstelle einen strukturierten Ausführungsplan als JSON.
Verfügbare Tools: viral-hook (input: {input}), content-kalender (input: {nische, plattform, frequenz}), trend-script (input: {thema, plattform, region}), product-ad (input: {productName, productDescription, audience, platform, style, language, ctaText}), image-generator (input: {prompt}).
Antworte NUR mit JSON: {"steps":[{"reihenfolge":1,"tool":"...","input":{...},"begruendung":"...","contentType":"reel|post|ad|visual_briefing|...","platform":"tiktok|instagram|..."}]}`;

function mapCampaignPlatform(p: CampaignPlatform): string {
  const map: Record<CampaignPlatform, string> = {
    instagram: "Instagram",
    tiktok: "TikTok",
    youtube_shorts: "YouTube",
    linkedin: "LinkedIn",
  };
  return map[p];
}

function mapToKalenderPlatform(p: CampaignPlatform): ContentKalenderPlatform {
  if (p === "instagram") return "Instagram";
  if (p === "linkedin") return "LinkedIn";
  if (p === "youtube_shorts") return "YouTube";
  return "TikTok";
}

function mapToTrendPlatform(p: CampaignPlatform): TrendScriptPlatform {
  if (p === "instagram") return "Reels";
  if (p === "youtube_shorts") return "YouTube";
  return "TikTok";
}

function mapToAdPlatform(p: CampaignPlatform): ProductAdPlatform {
  if (p === "instagram") return "instagram";
  if (p === "youtube_shorts") return "youtube";
  return "tiktok";
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

export async function generateCampaignPlan(params: {
  prompt: string;
  mode: CampaignMode;
  platforms: CampaignPlatform[];
  goal: CampaignGoal;
  tone: CampaignTone;
}): Promise<CampaignPlanStep[]> {
  const spec = CAMPAIGN_SPECS[params.mode];
  const user = `Kampagnenziel: ${params.prompt}
Modus: ${params.mode} (${spec.label})
Plattformen: ${params.platforms.join(", ")}
Ziel: ${params.goal}
Ton: ${params.tone}
Lieferumfang: ${spec.reels} Reels, ${spec.posts} Posts, ${spec.ads} Ads, ${spec.visualBriefings} Visuals, ${spec.carousels} Carousels, ${spec.stories} Stories.
Erstelle 6–14 Schritte mit passenden Tools und konkreten Inputs auf Deutsch.`;

  const result = await createAnthropicMessage({
    model: PLANNER_MODEL,
    maxTokens: 4096,
    system: PLANNER_SYSTEM,
    user,
  });

  if (!result.ok) {
    throw new Error(result.error);
  }

  try {
    const parsed = parseClaudeJson<{ steps?: CampaignPlanStep[] }>(result.text);
    const steps = (parsed.steps ?? [])
      .filter((s) => s.tool && s.reihenfolge)
      .sort((a, b) => a.reihenfolge - b.reihenfolge);
    if (steps.length > 0) return steps;
  } catch {
    // fallback below
  }

  return buildFallbackPlan(params);
}

function buildFallbackPlan(params: {
  prompt: string;
  mode: CampaignMode;
  platforms: CampaignPlatform[];
}): CampaignPlanStep[] {
  const platform = params.platforms[0] ?? "tiktok";
  const spec = CAMPAIGN_SPECS[params.mode];
  const steps: CampaignPlanStep[] = [];
  let order = 1;

  steps.push({
    reihenfolge: order++,
    tool: "content-kalender",
    input: {
      nische: params.prompt.slice(0, 80),
      plattform: mapToKalenderPlatform(platform),
      frequenz: spec.days <= 7 ? "5x_woche" : "3x_woche",
    },
    begruendung: "Content-Kalender als Basis",
    contentType: "post",
    platform,
  });

  steps.push({
    reihenfolge: order++,
    tool: "viral-hook",
    input: { input: params.prompt },
    begruendung: "Hooks für Reels",
    contentType: "reel",
    platform,
  });

  for (let i = 0; i < Math.min(spec.reels, 3); i++) {
    steps.push({
      reihenfolge: order++,
      tool: "trend-script",
      input: {
        thema: params.prompt,
        plattform: mapToTrendPlatform(platform),
        region: "DE",
      },
      begruendung: `Reel-Script ${i + 1}`,
      contentType: "reel",
      platform,
    });
  }

  for (let i = 0; i < Math.min(spec.visualBriefings, 2); i++) {
    steps.push({
      reihenfolge: order++,
      tool: "image-generator",
      input: { prompt: `${params.prompt} — Visual ${i + 1}` },
      begruendung: `Visual ${i + 1}`,
      contentType: "visual_briefing",
      platform,
    });
  }

  if (spec.ads > 0) {
    steps.push({
      reihenfolge: order++,
      tool: "product-ad",
      input: {
        productName: params.prompt.slice(0, 60),
        productDescription: params.prompt,
        audience: "Zielgruppe",
        platform: mapToAdPlatform(platform),
        style: "lifestyle",
        language: "de",
        ctaText: "Jetzt entdecken",
      },
      begruendung: "Werbespot-Script",
      contentType: "ad",
      platform,
    });
  }

  return steps;
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

  const plan = await generateCampaignPlan({
    prompt: exec.prompt,
    mode: exec.mode,
    platforms: exec.platforms,
    goal: exec.goal,
    tone: exec.tone,
  });

  const steps: AgentExecutionStep[] = CAMPAIGN_STEPS.map((label, i) => ({
    id: `step-${i}`,
    label,
    status: "pending" as const,
  }));

  const items: ContentItem[] = [];
  let usedCredits = 0;
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

  for (let i = 0; i < plan.length; i++) {
    const stepIdx = Math.min(i + 2, steps.length - 1);
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
      usedCredits += 5;
    } else if (run.tool === "trend-script") {
      usedCredits += 4;
    } else if (run.tool === "viral-hook") {
      usedCredits += 3;
    } else if (run.tool === "content-kalender") {
      usedCredits += 5;
    } else if (run.tool === "product-ad") {
      usedCredits += 3;
    }

    await markStep(stepIdx, "completed");
  }

  for (let i = plan.length + 2; i < steps.length; i++) {
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
      progress: { steps, complete: false },
      partialResult: result,
    });
  }

  return result;
}
