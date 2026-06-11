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

/** KI Agent execution framework (router / mockExecutor) */
export type AgentExecutionStatus =
  | "idle"
  | "planning"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export type AgentStepStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "skipped";

export type AgentTool =
  | "script_generator"
  | "produkt_werbung"
  | "thumbnail_concept"
  | "ki_agent"
  | "ki_ich"
  | "image_generator"
  | "viral_hook_extraktor"
  | "content_kalender"
  | "trend_script"
  | "stimme_musik"
  | "live_creator"
  | "lora_training";

export type AgentIntent =
  | "image_generation"
  | "video_briefing"
  | "script_generation"
  | "product_ad"
  | "hook_generation"
  | "content_calendar"
  | "thumbnail_concept"
  | "avatar_workflow"
  | "multi_tool_content_package"
  | "unknown";

export type AgentExecutionStep = {
  id: string;
  label: string;
  status: AgentStepStatus;
  tool?: AgentTool;
  result?: unknown;
  error?: string;
};

export type AgentScores = {
  hookScore?: number;
  clarity?: number;
  platformFit?: "low" | "medium" | "high";
  trendFit?: "low" | "medium" | "high";
  brandFit?: "low" | "medium" | "high";
  visualFit?: "low" | "medium" | "high";
  ctaStrength?: number;
  riskLevel?: "low" | "medium" | "high";
};

export type AgentTextToolRun<T = unknown> = {
  tool: string;
  input: Record<string, unknown>;
  output: T;
  qualityScore: number;
  retried: boolean;
};

export type AgentResult = {
  type: string;
  title: string;
  summary: string;
  outputs: unknown[];
  scores?: AgentScores;
  nextActions?: string[];
  /** Per-tool execution metadata for agent_executions.result */
  toolRuns?: AgentTextToolRun[];
};

export type AgentExecution = {
  id: string;
  userId?: string;
  prompt: string;
  intent: AgentIntent;
  selectedTools: AgentTool[];
  status: AgentExecutionStatus;
  steps: AgentExecutionStep[];
  result?: AgentResult;
  estimatedCredits?: number;
  usedCredits?: number;
  createdAt: string;
  updatedAt: string;
};

export type CampaignMode =
  | "sprint"
  | "weekly"
  | "monthly"
  | "product_launch";

export type CampaignPlatform =
  | "instagram"
  | "tiktok"
  | "youtube_shorts"
  | "linkedin";

export type CampaignGoal =
  | "reach"
  | "leads"
  | "trust"
  | "product_sales"
  | "branding";

export type CampaignTone =
  | "professional"
  | "modern"
  | "direct"
  | "trustworthy"
  | "bold";

export type LegalSensitivity = "low" | "medium" | "high";

export type BrandDNA = {
  companyName: string;
  industry: string;
  targetAudience: string;
  offer: string;
  platforms: CampaignPlatform[];
  toneOfVoice: CampaignTone;
  forbiddenClaims: string[];
  forbiddenWords: string[];
  requiredDisclaimers: string[];
  visualStyle: string;
  ctaStyle: string;
  legalSensitivity: LegalSensitivity;
  websiteUrl?: string;
  existingContentExamples?: string[];
};

export type ContentItem = {
  id: string;
  type: "reel" | "carousel" | "story" | "post" | "ad" | "visual_briefing";
  platform: CampaignPlatform;
  day?: number;
  title: string;
  content?: string;
  hook?: string;
  script?: string;
  caption?: string;
  hashtags?: string[];
  postingTime?: string;
  cta?: string;
  visualBriefing?: string;
  imagePrompt?: string;
  scores?: ContentScores;
  status: "pending" | "generated" | "reviewing" | "approved" | "rejected";
};

export type ContentScores = {
  brandFit?: number;
  clarity?: number;
  ctaStrength?: number;
  platformFit?: number;
  hookScore?: number;
  claimRisk?: "low" | "medium" | "high";
  legalRisk?: "low" | "medium" | "high";
  duplicateSimilarity?: number;
  overallScore?: number;
};

export type QualityDecision = "accept" | "improve" | "regenerate" | "manual_review";

export type CampaignResult = {
  id: string;
  mode: CampaignMode;
  title: string;
  summary: string;
  brandDNA: Partial<BrandDNA>;
  assumptionsMade: string[];
  items: ContentItem[];
  overallScores: ContentScores;
  estimatedCredits: number;
  usedCredits: number;
  createdAt: string;
};

export type CampaignExecution = {
  id: string;
  userId?: string;
  prompt: string;
  mode: CampaignMode;
  platforms: CampaignPlatform[];
  goal: CampaignGoal;
  tone: CampaignTone;
  brandDNA?: Partial<BrandDNA>;
  status: AgentExecutionStatus;
  steps: AgentExecutionStep[];
  result?: CampaignResult;
  estimatedCredits: number;
  usedCredits: number;
  createdAt: string;
  updatedAt: string;
};

export type SubjectGenderPresentation =
  | "female"
  | "male"
  | "neutral"
  | "unspecified";

export type GenerationHardConstraints = {
  subjectGenderPresentation?: SubjectGenderPresentation;
  subjectCount?: number;
  requiredSubject?: string[];
  forbiddenSubject?: string[];
  requiredStyle?: string[];
  forbiddenStyle?: string[];
  requiredFormat?: string;
  forbiddenElements?: string[];
  mustAvoidTextInImage?: boolean;
  mustAvoidLogoInGeneratedImage?: boolean;
  anatomyMustBeValid?: boolean;
  faceMustBeClean?: boolean;
  handsMustBeValid?: boolean;
};

export type GenerationRequirements = {
  intent: AgentIntent;
  outputType: "text" | "image" | "video" | "campaign" | "calendar";
  topic?: string;
  niche?: string;
  platform?: string;
  targetAudience?: string;
  tone?: string;
  hardConstraints: GenerationHardConstraints;
  softPreferences: string[];
};

export type VisualQAReport = {
  passed: boolean;
  genderMatches?: boolean;
  subjectCountMatches?: boolean;
  anatomyOk?: boolean;
  handsOk?: boolean;
  faceOk?: boolean;
  textOk?: boolean;
  logoOk?: boolean;
  formatOk?: boolean;
  brandFit?: "low" | "medium" | "high";
  issues: string[];
  repairPrompt?: string;
};

export type OverlayInstructions = {
  addLogoAsOverlay?: boolean;
  addTextAsOverlay?: boolean;
  text?: string;
  position?:
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right"
    | "center";
};
