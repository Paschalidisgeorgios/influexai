import { CONTENT_KALENDER_TOOL_CREDIT_COST } from "@/lib/content-kalender-tool";
import { COMPETITOR_ANALYSIS_CREDIT_COST } from "@/lib/competitor-analysis";
import { IMAGE_GEN_CREDITS } from "@/lib/image-generator-credits";
import { PRODUCT_PREVIEW_CREDIT_COST } from "@/lib/product-ad-preview-run";
import { SEEDANCE_CREDIT_COST } from "@/lib/seedance-config";
import { TREND_SCRIPT_TOOL_CREDIT_COST } from "@/lib/trend-script-tool";
import { VIRAL_HOOK_EXTRACTOR_CREDIT_COST } from "@/lib/viral-hook-extraktor";
import { VIRAL_SCORE_CREDIT_COST } from "@/lib/viral-score";
import type { AgentExecutableToolName, AgentTextToolRun } from "./types";
import type { CampaignPlanStep } from "./campaignPlanner";

/** Flat credit cost per Master Agent invocation (orchestrator LLM turns). */
export const ORCHESTRATOR_BASE_COST = 1;

/** Credit costs for executable tools (shown before run). */
export const AGENT_TOOL_CREDITS: Record<AgentExecutableToolName, number> = {
  analyze_niche: 2,
  generate_script: 2,
  generate_thumbnail: 1,
  viral_score: VIRAL_SCORE_CREDIT_COST,
  detect_outlier: 3,
  analyze_competitor: COMPETITOR_ANALYSIS_CREDIT_COST,
  generate_image: IMAGE_GEN_CREDITS.standard,
  generate_video_from_image: SEEDANCE_CREDIT_COST,
  generate_product_preview: PRODUCT_PREVIEW_CREDIT_COST,
};

export const AGENT_FULL_PIPELINE_TOOLS: AgentExecutableToolName[] = [
  "analyze_niche",
  "detect_outlier",
  "generate_script",
  "generate_thumbnail",
  "viral_score",
];

export function estimateAgentCredits(userMessage: string): {
  min: number;
  max: number;
  typical: number;
  label: string;
} {
  const lower = userMessage.toLowerCase();

  const wantsUgc =
    /ugc|brand deal|produkt zeigen|authentic content|produktwerbung/i.test(
      lower
    );
  if (wantsUgc) {
    const typical =
      AGENT_TOOL_CREDITS.generate_product_preview +
      AGENT_TOOL_CREDITS.generate_video_from_image;
    return {
      min: AGENT_TOOL_CREDITS.generate_product_preview,
      max: typical + 1,
      typical,
      label: `~${typical} Credits`,
    };
  }

  const wantsImageVideo =
    /bild.*video|video.*bild|seedance|bild zu video|bild-zu-video|ki-creator|ki creator|generier.*bild|mach.*video|animier/i.test(
      lower
    );
  if (wantsImageVideo) {
    const typical =
      AGENT_TOOL_CREDITS.generate_image +
      AGENT_TOOL_CREDITS.generate_video_from_image;
    return {
      min: typical - 1,
      max: typical + 2,
      typical,
      label: `~${typical} Credits`,
    };
  }

  const wantsCompetitor = /konkurrenz|competitor|kanal analys|youtube kanal/i.test(
    lower
  );
  if (wantsCompetitor) {
    return {
      min: AGENT_TOOL_CREDITS.analyze_competitor,
      max: AGENT_TOOL_CREDITS.analyze_competitor + 5,
      typical: AGENT_TOOL_CREDITS.analyze_competitor,
      label: `~${AGENT_TOOL_CREDITS.analyze_competitor} Credits`,
    };
  }

  const wantsFull =
    /video|script|thumbnail|viral|outlier|nische|plan|komplett|alles/i.test(
      lower
    );
  if (wantsFull) {
    const typical = AGENT_FULL_PIPELINE_TOOLS.reduce(
      (s, t) => s + AGENT_TOOL_CREDITS[t],
      0
    );
    return {
      min: typical - 2,
      max: typical + 3,
      typical,
      label: `~${typical} Credits`,
    };
  }

  return {
    min: 2,
    max: 10,
    typical: 6,
    label: "~6–10 Credits",
  };
}

export function fullPipelineCreditSum(): number {
  return AGENT_FULL_PIPELINE_TOOLS.reduce(
    (s, t) => s + AGENT_TOOL_CREDITS[t],
    0
  );
}

/** KI-Agent orchestrator text tools — aligned with standalone API route costs. */
export function kiAgentOrchestratorToolCreditCost(tool: string): number {
  switch (tool) {
    case "viral-hook":
      return VIRAL_HOOK_EXTRACTOR_CREDIT_COST;
    case "trend-script":
      return TREND_SCRIPT_TOOL_CREDIT_COST;
    case "content-kalender":
      return CONTENT_KALENDER_TOOL_CREDIT_COST;
    case "product-ad":
      return 0;
    case "image-generator":
      return AGENT_TOOL_CREDITS.generate_image;
    default:
      return VIRAL_HOOK_EXTRACTOR_CREDIT_COST;
  }
}

export function sumKiAgentOrchestratorUsedCredits(
  toolRuns: AgentTextToolRun[] | undefined
): number {
  if (!toolRuns?.length) return 0;
  return toolRuns.reduce(
    (sum, run) => sum + kiAgentOrchestratorToolCreditCost(run.tool),
    0
  );
}

/** Campaign autopilot — per planned step (matches post-run sum in campaignExecutor). */
export function sumCampaignPlanCredits(plan: CampaignPlanStep[]): number {
  let total = 0;
  for (const step of plan) {
    switch (step.tool) {
      case "image-generator":
        total += AGENT_TOOL_CREDITS.generate_image;
        break;
      case "trend-script":
        total += 4;
        break;
      case "viral-hook":
        total += 3;
        break;
      case "content-kalender":
        total += 5;
        break;
      case "product-ad":
        total += 3;
        break;
      default:
        break;
    }
  }
  return total;
}
