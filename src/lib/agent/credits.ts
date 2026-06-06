import { COMPETITOR_ANALYSIS_CREDIT_COST } from "@/lib/competitor-analysis";
import { IMAGE_GEN_CREDITS } from "@/lib/image-generator-credits";
import { PRODUCT_PREVIEW_CREDIT_COST } from "@/lib/product-ad-preview-run";
import { SEEDANCE_CREDIT_COST } from "@/lib/seedance-config";
import { VIRAL_SCORE_CREDIT_COST } from "@/lib/viral-score";
import type { AgentExecutableToolName } from "./types";

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
