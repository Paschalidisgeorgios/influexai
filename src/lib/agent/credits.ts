import type { AgentToolName } from "./types";

/** Display / estimate costs (shown before run). */
export const AGENT_TOOL_CREDITS: Record<AgentToolName, number> = {
  analyze_niche: 3,
  find_outliers: 3,
  generate_script: 2,
  create_thumbnail_concept: 1,
  calculate_viral_score: 2,
  suggest_video_ideas: 0,
};

export const AGENT_FULL_PIPELINE_TOOLS: AgentToolName[] = [
  "analyze_niche",
  "find_outliers",
  "generate_script",
  "create_thumbnail_concept",
  "calculate_viral_score",
];

export function estimateAgentCredits(userMessage: string): {
  min: number;
  max: number;
  typical: number;
  label: string;
} {
  const lower = userMessage.toLowerCase();
  const wantsFull =
    /video|script|thumbnail|viral|outlier|nische|konkurrenz|plan|komplett|alles/i.test(
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
