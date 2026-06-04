export type AgentToolName =
  | "analyze_niche"
  | "generate_script"
  | "create_thumbnail_concept"
  | "calculate_viral_score"
  | "find_outliers"
  | "suggest_video_ideas";

export type AgentChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type AgentStep = {
  tool: AgentToolName;
  label: string;
  status: "running" | "done" | "error";
  error?: string;
};

export type AgentOutputs = {
  niche?: unknown;
  outliers?: unknown;
  script?: unknown;
  thumbnail?: unknown;
  viralScore?: unknown;
  videoIdeas?: unknown;
};

export type AgentStreamEvent =
  | {
      type: "estimate";
      min: number;
      max: number;
      typical: number;
      label: string;
    }
  | { type: "text_delta"; text: string }
  | { type: "tool_start"; tool: AgentToolName; label: string }
  | { type: "tool_done"; tool: AgentToolName; creditsUsed: number }
  | { type: "tool_error"; tool: AgentToolName; error: string }
  | { type: "outputs"; outputs: AgentOutputs }
  | { type: "credits"; creditsLeft: number; totalUsed: number }
  | { type: "done"; summary: string }
  | { type: "error"; message: string };
