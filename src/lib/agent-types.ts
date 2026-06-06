export type CreatorDNA = {
  niche: string;
  targetAudience: string;
  platforms: ("TikTok" | "Instagram" | "YouTube" | "LinkedIn")[];
  tone: string;
  language: "de" | "en";
  goals: string[];
  forbiddenTopics: string[];
  preferredFormats: string[];
  visualStyle: string;
  ctaStyle: string;
};

export type AgentTool =
  | "script_generator"
  | "produkt_werbung"
  | "viral_hook_extraktor"
  | "content_kalender"
  | "thumbnail_konzept"
  | "mein_ki_ich";

export type AgentIntent =
  | "script_generation"
  | "ad_creation"
  | "hook_generation"
  | "calendar_planning"
  | "thumbnail_creation"
  | "avatar_creation"
  | "unknown";

export type RiskLevel = "low" | "medium" | "high";
export type FitLevel = "low" | "medium" | "high";

export type AgentScores = {
  hookScore: number;
  clarity: number;
  platformFit: FitLevel;
  trendFit: FitLevel;
  ctaStrength: number;
  riskLevel: RiskLevel;
};

export type AgentOutput =
  | {
      type: "script";
      hook: string;
      story: string;
      cta: string;
      hashtags: string[];
    }
  | {
      type: "hooks";
      variants: string[];
    }
  | {
      type: "calendar";
      entries: { day: string; idea: string; format: string }[];
      bestTime: string;
    }
  | {
      type: "ad";
      hook: string;
      body: string;
      hashtags: string[];
    }
  | {
      type: "raw";
      text: string;
    };

export type NextAction =
  | "thumbnail_erstellen"
  | "caption_schreiben"
  | "hook_variieren"
  | "in_kalender_uebernehmen"
  | "mehr_varianten"
  | "speichern";

export type AgentResponse = {
  intent: AgentIntent;
  tool: AgentTool | null;
  missingInfo: string[];
  summary: string;
  output: AgentOutput;
  scores: AgentScores;
  nextActions: NextAction[];
};

export type FeedbackEvent = {
  id: string;
  userId: string;
  sessionId: string;
  responseId: string;
  action: "liked" | "disliked" | "edited" | "exported" | "regenerated" | "saved";
  tool: AgentTool | null;
  intent: AgentIntent;
  createdAt: string;
  // TODO: In Supabase agent_feedback Tabelle speichern wenn ready
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  agentResponse?: AgentResponse;
  createdAt: string;
};
