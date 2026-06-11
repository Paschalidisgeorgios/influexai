import { CONTENT_KALENDER_TOOL_CREDIT_COST } from "@/lib/content-kalender-tool";
import { IMAGE_GEN_CREDITS } from "@/lib/image-generator-credits";
import { TREND_SCRIPT_TOOL_CREDIT_COST } from "@/lib/trend-script-tool";
import { VIRAL_HOOK_EXTRACTOR_CREDIT_COST } from "@/lib/viral-hook-extraktor";
import type { AgentIntent } from "./types";

export type KiAgentOrchestrateCreditEstimate = {
  typical: number;
  min: number;
  max: number;
  label: string;
};

/** Mirrors toolOrchestrator API calls and their server-side deductCredits amounts. */
export function estimateKiAgentOrchestrateCredits(
  intent: AgentIntent
): KiAgentOrchestrateCreditEstimate {
  switch (intent) {
    case "hook_generation":
      return fixed(VIRAL_HOOK_EXTRACTOR_CREDIT_COST);
    case "script_generation":
      return fixed(TREND_SCRIPT_TOOL_CREDIT_COST);
    case "content_calendar":
      return fixed(CONTENT_KALENDER_TOOL_CREDIT_COST);
    case "product_ad":
      return fixed(0);
    case "video_briefing":
      return fixed(
        TREND_SCRIPT_TOOL_CREDIT_COST + VIRAL_HOOK_EXTRACTOR_CREDIT_COST
      );
    case "multi_tool_content_package":
      return fixed(
        VIRAL_HOOK_EXTRACTOR_CREDIT_COST +
          TREND_SCRIPT_TOOL_CREDIT_COST +
          CONTENT_KALENDER_TOOL_CREDIT_COST
      );
    case "image_generation":
      return fixed(IMAGE_GEN_CREDITS.standard);
    default:
      return fixed(VIRAL_HOOK_EXTRACTOR_CREDIT_COST);
  }
}

function fixed(amount: number): KiAgentOrchestrateCreditEstimate {
  return {
    min: amount,
    typical: amount,
    max: amount,
    label: amount === 1 ? "1 Credit" : `${amount} Credits`,
  };
}
