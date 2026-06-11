import type { SupabaseClient } from "@supabase/supabase-js";
import { createAnthropicMessage, SCRIPT_GENERATOR_MODEL } from "@/lib/anthropic";
import { runWithQualityRetry } from "@/lib/agent/qualityScoring";
import { deductCredits, hasEnoughCredits } from "@/lib/credits";
import type { AgentIntent, AgentTextToolRun } from "@/lib/agent/types";
import {
  buildContentKalenderToolUserPrompt,
  CONTENT_KALENDER_TOOL_SYSTEM_PROMPT,
  CONTENT_KALENDER_TOOL_CREDIT_COST,
  parseContentKalenderToolResult,
  type ContentKalenderEntry,
  type ContentKalenderFrequency,
  type ContentKalenderPlatform,
} from "@/lib/content-kalender-tool";
import {
  generateProductAdScript,
  scriptToDisplayText,
  type ProductAdScript,
  type ProductAdScriptInput,
} from "@/lib/product-ad-script";
import {
  buildTrendScriptToolUserPrompt,
  parseTrendScriptToolResult,
  TREND_SCRIPT_TOOL_SYSTEM_PROMPT,
  TREND_SCRIPT_TOOL_CREDIT_COST,
  trendVideosToSources,
  type TrendScriptPlatform,
  type TrendScriptRegion,
  type TrendScriptSource,
} from "@/lib/trend-script-tool";
import {
  buildViralHookExtractorUserPrompt,
  parseViralHookExtractorResult,
  VIRAL_HOOK_EXTRACTOR_CREDIT_COST,
  VIRAL_HOOK_EXTRACTOR_SYSTEM_PROMPT,
} from "@/lib/viral-hook-extraktor";
import { fetchTrendingVideos } from "@/lib/youtube";

const PRODUCT_AD_SCRIPT_CREDIT_COST = 0;

export type AgentTextToolName =
  | "viral-hook"
  | "content-kalender"
  | "trend-script"
  | "product-ad";

const AGENT_TEXT_TOOL_CREDIT_COSTS: Record<AgentTextToolName, number> = {
  "viral-hook": VIRAL_HOOK_EXTRACTOR_CREDIT_COST,
  "content-kalender": CONTENT_KALENDER_TOOL_CREDIT_COST,
  "trend-script": TREND_SCRIPT_TOOL_CREDIT_COST,
  "product-ad": PRODUCT_AD_SCRIPT_CREDIT_COST,
};

const AGENT_TEXT_TOOL_ACTIONS: Record<AgentTextToolName, string> = {
  "viral-hook": "KI Agent — Viral Hook",
  "content-kalender": "KI Agent — Content Kalender",
  "trend-script": "KI Agent — Trend Script",
  "product-ad": "KI Agent — Product Ad Script",
};

export class AgentTextToolBillingError extends Error {
  readonly status: 402 | 500;
  readonly remainingCredits: number;
  readonly requiredCredits: number;

  constructor(params: {
    error: string;
    status: 402 | 500;
    remainingCredits: number;
    requiredCredits: number;
  }) {
    super(params.error);
    this.name = "AgentTextToolBillingError";
    this.status = params.status;
    this.remainingCredits = params.remainingCredits;
    this.requiredCredits = params.requiredCredits;
  }
}

function isAgentTextToolName(tool: string): tool is AgentTextToolName {
  return tool in AGENT_TEXT_TOOL_CREDIT_COSTS;
}

export function getAgentTextToolCreditCost(tool: string): number {
  return isAgentTextToolName(tool) ? AGENT_TEXT_TOOL_CREDIT_COSTS[tool] : 0;
}

export function getAgentTextToolNamesForIntent(
  intent: AgentIntent
): AgentTextToolName[] {
  switch (intent) {
    case "hook_generation":
      return ["viral-hook"];
    case "script_generation":
      return ["trend-script"];
    case "content_calendar":
      return ["content-kalender"];
    case "product_ad":
      return ["product-ad"];
    case "video_briefing":
      return ["trend-script", "viral-hook"];
    case "multi_tool_content_package":
      return ["viral-hook", "trend-script", "content-kalender"];
    case "image_generation":
      return [];
    default:
      return ["viral-hook"];
  }
}

export function sumAgentTextToolCredits(tools: readonly string[]): number {
  return tools.reduce((sum, tool) => sum + getAgentTextToolCreditCost(tool), 0);
}

export async function checkAgentTextToolCredits(params: {
  supabase: SupabaseClient;
  userId: string;
  tools: readonly string[];
}): Promise<
  | { ok: true; requiredCredits: number; credits: number }
  | { ok: false; requiredCredits: number; credits: number; error: string }
> {
  const requiredCredits = sumAgentTextToolCredits(params.tools);
  const creditCheck = await hasEnoughCredits(
    params.supabase,
    params.userId,
    requiredCredits
  );

  if (requiredCredits <= 0 || creditCheck.ok) {
    return { ok: true, requiredCredits, credits: creditCheck.credits };
  }

  return {
    ok: false,
    requiredCredits,
    credits: creditCheck.credits,
    error: "Nicht genug Credits.",
  };
}

function promptForBilling(run: AgentTextToolRun, prompt?: string): string {
  const fromPrompt = prompt?.trim();
  if (fromPrompt) return fromPrompt.slice(0, 500);
  return JSON.stringify(run.input).slice(0, 500);
}

export async function deductAgentTextToolRunCredits(params: {
  supabase: SupabaseClient;
  userId: string;
  run: AgentTextToolRun;
  prompt?: string;
}): Promise<{ creditsUsed: number; remainingCredits?: number }> {
  const cost = getAgentTextToolCreditCost(params.run.tool);
  if (cost <= 0) return { creditsUsed: 0 };

  const toolName = isAgentTextToolName(params.run.tool)
    ? params.run.tool
    : "viral-hook";
  const deduction = await deductCredits(
    params.supabase,
    params.userId,
    cost,
    AGENT_TEXT_TOOL_ACTIONS[toolName],
    {
      generationType: `agent-${toolName}`,
      prompt: promptForBilling(params.run, params.prompt),
    }
  );

  if (!deduction.success) {
    throw new AgentTextToolBillingError({
      error: deduction.error ?? "Credits konnten nicht abgezogen werden.",
      status: deduction.error === "Nicht genug Credits." ? 402 : 500,
      remainingCredits: deduction.remainingCredits,
      requiredCredits: cost,
    });
  }

  return { creditsUsed: cost, remainingCredits: deduction.remainingCredits };
}

export async function deductAgentTextToolRunsCredits(params: {
  supabase: SupabaseClient;
  userId: string;
  runs: readonly AgentTextToolRun[];
  prompt?: string;
}): Promise<{ usedCredits: number; remainingCredits?: number }> {
  let usedCredits = 0;
  let remainingCredits: number | undefined;

  for (const run of params.runs) {
    const billed = await deductAgentTextToolRunCredits({
      supabase: params.supabase,
      userId: params.userId,
      run,
      prompt: params.prompt,
    });
    usedCredits += billed.creditsUsed;
    if (typeof billed.remainingCredits === "number") {
      remainingCredits = billed.remainingCredits;
    }
  }

  return { usedCredits, remainingCredits };
}

export async function runViralHookTextTool(
  input: string
): Promise<AgentTextToolRun<string[]>> {
  const trimmed = input.trim();
  const picked = await runWithQualityRetry<string[]>({
    toolName: "viral-hook",
    userGoal: trimmed,
    toOutputText: (items) => items.join("\n"),
    generate: async (retryHint) => {
      const claude = await createAnthropicMessage({
        model: SCRIPT_GENERATOR_MODEL,
        system: VIRAL_HOOK_EXTRACTOR_SYSTEM_PROMPT,
        user: buildViralHookExtractorUserPrompt(trimmed, retryHint),
        maxTokens: 1536,
      });
      if (!claude.ok) throw new Error(claude.error);
      return parseViralHookExtractorResult(claude.text);
    },
  });

  return {
    tool: "viral-hook",
    input: { input: trimmed },
    output: picked.value,
    qualityScore: picked.score,
    retried: picked.wasRetried,
  };
}

export async function runContentKalenderTextTool(params: {
  nische: string;
  plattform: ContentKalenderPlatform;
  frequenz: ContentKalenderFrequency;
}): Promise<AgentTextToolRun<ContentKalenderEntry[]>> {
  const userGoal = `${params.nische} · ${params.plattform} · ${params.frequenz}`;
  const picked = await runWithQualityRetry<ContentKalenderEntry[]>({
    toolName: "content-kalender",
    userGoal,
    toOutputText: (items) =>
      items.map((e) => `${e.tag}: ${e.idee} (${e.format})`).join("\n"),
    generate: async (retryHint) => {
      const claude = await createAnthropicMessage({
        model: SCRIPT_GENERATOR_MODEL,
        system: CONTENT_KALENDER_TOOL_SYSTEM_PROMPT,
        user: buildContentKalenderToolUserPrompt(params, retryHint),
        maxTokens: 4096,
      });
      if (!claude.ok) throw new Error(claude.error);
      return parseContentKalenderToolResult(claude.text);
    },
  });

  return {
    tool: "content-kalender",
    input: { ...params },
    output: picked.value,
    qualityScore: picked.score,
    retried: picked.wasRetried,
  };
}

export async function runTrendScriptTextTool(params: {
  thema: string;
  plattform: TrendScriptPlatform;
  region?: TrendScriptRegion;
}): Promise<
  AgentTextToolRun<{ script: string; sources: TrendScriptSource[] }>
> {
  const region = params.region ?? "DE";
  const thema = params.thema.trim();
  const trends = await fetchTrendingVideos(thema, region);
  if (trends.length === 0) {
    throw new Error("Keine Trends gefunden.");
  }

  const sources = trendVideosToSources(trends);
  const trendParams = { thema, plattform: params.plattform, trends };

  const picked = await runWithQualityRetry<string>({
    toolName: "trend-script",
    userGoal: `${thema} · ${params.plattform}`,
    toOutputText: (value) => value,
    generate: async (retryHint) => {
      const claude = await createAnthropicMessage({
        model: SCRIPT_GENERATOR_MODEL,
        system: TREND_SCRIPT_TOOL_SYSTEM_PROMPT,
        user: buildTrendScriptToolUserPrompt(trendParams, retryHint),
        maxTokens: 4096,
      });
      if (!claude.ok) throw new Error(claude.error);
      return parseTrendScriptToolResult(claude.text);
    },
  });

  return {
    tool: "trend-script",
    input: { thema, plattform: params.plattform, region },
    output: { script: picked.value, sources },
    qualityScore: picked.score,
    retried: picked.wasRetried,
  };
}

export async function runProductAdTextTool(
  params: ProductAdScriptInput
): Promise<
  AgentTextToolRun<{ script: ProductAdScript; scriptText: string }>
> {
  const picked = await runWithQualityRetry<ProductAdScript>({
    toolName: "product-ad",
    userGoal: `${params.productName} · ${params.audience} · ${params.platform}`,
    toOutputText: scriptToDisplayText,
    generate: async (retryHint) => {
      const scriptResult = await generateProductAdScript(params, retryHint);
      if (!scriptResult.ok) throw new Error(scriptResult.error);
      return scriptResult.script;
    },
  });

  return {
    tool: "product-ad",
    input: {
      productName: params.productName,
      productDescription: params.productDescription,
      audience: params.audience,
      platform: params.platform,
      style: params.style,
      language: params.language,
      ctaText: params.ctaText,
    },
    output: {
      script: picked.value,
      scriptText: scriptToDisplayText(picked.value),
    },
    qualityScore: picked.score,
    retried: picked.wasRetried,
  };
}
