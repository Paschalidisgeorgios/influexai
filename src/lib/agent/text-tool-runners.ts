import { createAnthropicMessage } from "@/lib/anthropic";
import { runWithQualityRetry } from "@/lib/agent/qualityScoring";
import type { AgentTextToolRun } from "@/lib/agent/types";
import {
  buildContentKalenderToolUserPrompt,
  CONTENT_KALENDER_TOOL_SYSTEM_PROMPT,
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
  trendVideosToSources,
  type TrendScriptPlatform,
  type TrendScriptRegion,
  type TrendScriptSource,
} from "@/lib/trend-script-tool";
import {
  buildViralHookExtractorUserPrompt,
  parseViralHookExtractorResult,
  VIRAL_HOOK_EXTRACTOR_SYSTEM_PROMPT,
} from "@/lib/viral-hook-extraktor";
import { fetchTrendingVideos } from "@/lib/youtube";

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
