import { runWithQualityRetry } from "@/lib/agent/qualityScoring";
import type { AgentTextToolRun } from "@/lib/agent/types";
import {
  productAdToDisplayText,
  runContentKalenderClaude,
  runProductAdClaude,
  runTrendScriptClaude,
  runViralHookClaude,
  trendScriptToDisplayText,
  type ContentKalenderDay,
  type ProductAdResult,
  type TrendScriptResult,
  type ViralHookItem,
} from "@/lib/agent/claude-agent-tools";
import type { ContentKalenderFrequency, ContentKalenderPlatform } from "@/lib/content-kalender-tool";
import type { TrendScriptPlatform, TrendScriptRegion } from "@/lib/trend-script-tool";
import type { ProductAdScriptInput } from "@/lib/product-ad-script";

function throwIfToolError<T>(result: T | { error: string; fallback: null }): T {
  if (result != null && typeof result === "object" && "error" in result) {
    throw new Error(result.error);
  }
  return result as T;
}

export async function runViralHookTextTool(
  input: string,
  platform = "TikTok",
  nische = "Content Creation"
): Promise<AgentTextToolRun<string[]>> {
  const trimmed = input.trim();
  const picked = await runWithQualityRetry<string[]>({
    toolName: "viral-hook",
    userGoal: trimmed,
    toOutputText: (items) => items.join("\n"),
    generate: async () => {
      const result = await runViralHookClaude({
        input: trimmed,
        platform,
        nische,
      });
      const hooks = throwIfToolError<ViralHookItem[]>(result);
      return hooks.map((h) => h.hook);
    },
  });

  return {
    tool: "viral-hook",
    input: { input: trimmed, platform, nische },
    output: picked.value,
    qualityScore: picked.score,
    retried: picked.wasRetried,
  };
}

export async function runContentKalenderTextTool(params: {
  nische: string;
  plattform: ContentKalenderPlatform;
  frequenz: ContentKalenderFrequency;
}): Promise<
  AgentTextToolRun<
    Array<{ tag: string; idee: string; format: string; hook?: string; caption?: string }>
  >
> {
  const userGoal = `${params.nische} · ${params.plattform} · ${params.frequenz}`;
  const picked = await runWithQualityRetry<ContentKalenderDay[]>({
    toolName: "content-kalender",
    userGoal,
    toOutputText: (items) =>
      items.map((e) => `Tag ${e.day}: ${e.topic} (${e.format})`).join("\n"),
    generate: async () => {
      const result = await runContentKalenderClaude({
        nische: params.nische,
        plattform: params.plattform,
        frequenz: params.frequenz,
      });
      return throwIfToolError(result);
    },
  });

  const mapped = picked.value.map((entry) => ({
    tag: entry.date || `Tag ${entry.day}`,
    idee: entry.topic,
    format: entry.format,
    hook: entry.hook,
    caption: entry.caption,
  }));

  return {
    tool: "content-kalender",
    input: { ...params },
    output: mapped,
    qualityScore: picked.score,
    retried: picked.wasRetried,
  };
}

export async function runTrendScriptTextTool(params: {
  thema: string;
  plattform: TrendScriptPlatform;
  region?: TrendScriptRegion;
}): Promise<
  AgentTextToolRun<{ script: string; sources: Array<{ title: string; views: number }> }>
> {
  const region = params.region ?? "DE";
  const thema = params.thema.trim();

  const picked = await runWithQualityRetry<TrendScriptResult>({
    toolName: "trend-script",
    userGoal: `${thema} · ${params.plattform}`,
    toOutputText: trendScriptToDisplayText,
    generate: async () => {
      const result = await runTrendScriptClaude({
        thema,
        plattform: params.plattform,
        region,
      });
      return throwIfToolError(result);
    },
  });

  const scriptText = trendScriptToDisplayText(picked.value);

  return {
    tool: "trend-script",
    input: { thema, plattform: params.plattform, region },
    output: { script: scriptText, sources: [] },
    qualityScore: picked.score,
    retried: picked.wasRetried,
  };
}

export async function runProductAdTextTool(
  params: ProductAdScriptInput
): Promise<
  AgentTextToolRun<{ script: ProductAdResult; scriptText: string }>
> {
  const picked = await runWithQualityRetry<ProductAdResult>({
    toolName: "product-ad",
    userGoal: `${params.productName} · ${params.audience} · ${params.platform}`,
    toOutputText: productAdToDisplayText,
    generate: async () => {
      const result = await runProductAdClaude({
        produkt: params.productName,
        zielgruppe: params.audience,
        plattform: params.platform,
      });
      return throwIfToolError(result);
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
      scriptText: productAdToDisplayText(picked.value),
    },
    qualityScore: picked.score,
    retried: picked.wasRetried,
  };
}