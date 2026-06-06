export type AgentExecutableToolName =
  | "analyze_niche"
  | "generate_script"
  | "generate_thumbnail"
  | "viral_score"
  | "detect_outlier"
  | "analyze_competitor"
  | "generate_image"
  | "generate_video_from_image"
  | "generate_product_preview";

export type AgentRedirectToolName =
  | "ugc_video"
  | "produkt_werbung"
  | "avatar_video"
  | "video_remix"
  | "stimme_musik"
  | "live_creator";

export type AgentToolName = AgentExecutableToolName | AgentRedirectToolName;

export type AgentImageOutput = {
  imageUrl: string;
  generationId: string;
  prompt?: string;
  improvedPrompt?: string;
};

export type AgentVideoOutput = {
  videoUrl: string;
  generationId: string;
  motionPrompt?: string;
};

export type AgentProductPreviewOutput = {
  imageUrl: string;
  generationId: string;
  productName: string;
  productDescription?: string;
  sourceImageUrl?: string;
  productUrl?: string;
};

export type AgentRedirectOutput = {
  tool: AgentRedirectToolName;
  title: string;
  emoji: string;
  headline: string;
  description: string;
  href: string;
};

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
  competitor?: unknown;
  image?: AgentImageOutput;
  video?: AgentVideoOutput;
  productPreview?: AgentProductPreviewOutput;
  redirects?: AgentRedirectOutput[];
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
