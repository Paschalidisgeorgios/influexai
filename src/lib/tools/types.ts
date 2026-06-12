export type DashboardThemeKey = "green" | "blue" | "violet";

export type ToolLayoutMode = "agent" | "video-studio" | "image-studio" | "avatar";

export type ToolId =
  | "agent-autopilot"
  | "szenen-generator"
  | "story-creator"
  | "bild-generator";

export type ToolCategory = "automation" | "video" | "visuals" | "avatar";

export type ToolCapabilityType =
  | "text-generation"
  | "image-to-video"
  | "text-to-video"
  | "text-to-image";

export type VideoModelCapabilities = {
  supportsStart: boolean;
  supportsEnd: boolean;
  supportsAudio: boolean;
  supportsReference: boolean;
  supportsCamera: boolean;
  supportsShotType: boolean;
  supportsExpression: boolean;
  supportsAtmosphere: boolean;
};

export type ImageModelCapabilities = {
  supportsNegativePrompt: boolean;
  supportsAspectRatio: boolean;
  supportsSteps: boolean;
  supportsGuidance: boolean;
  supportsSeed: boolean;
};

export type StoryModelCapabilities = {
  supportsStart: boolean;
  supportsEnd: boolean;
  supportsAudio: boolean;
  supportsReference: boolean;
  supportsCamera: boolean;
  supportsShotType: boolean;
  supportsExpression: boolean;
  supportsAtmosphere: boolean;
};

export type ParamRange = { min: number; max: number; default: number };

export type ModelParamSchema = Record<
  string,
  string[] | ParamRange
>;

export type ToolModel = {
  id: string;
  name: string;
  provider: string;
  theme: DashboardThemeKey;
  credits: number;
  durations?: string[];
  resolutions?: string[];
  capabilities: VideoModelCapabilities | ImageModelCapabilities | StoryModelCapabilities;
  params?: ModelParamSchema;
};

export type ToolCapabilities = {
  type: ToolCapabilityType;
  hasPrompt: boolean;
  hasModels: boolean;
  hasUploads: boolean;
  hasParams: boolean;
};

export type ToolUIConfig = {
  layout: ToolLayoutMode;
  primaryInput: "textarea" | "input";
  showPayload: boolean;
};

export type ToolCredits = {
  base: number;
  unit: string;
};

export type ToolParams = Record<string, unknown>;

export type PayloadBuilder = (
  prompt: string,
  model: ToolModel | null,
  params: ToolParams,
  uploads?: Record<string, string>
) => Record<string, unknown>;

export type ToolConfig = {
  label: string;
  route: string;
  provider: string;
  category: ToolCategory;
  theme: DashboardThemeKey;
  capabilities: ToolCapabilities;
  models: ToolModel[];
  ui: ToolUIConfig;
  credits: ToolCredits;
  payload: PayloadBuilder;
};

export type ToolRegistry = Record<ToolId, ToolConfig>;
