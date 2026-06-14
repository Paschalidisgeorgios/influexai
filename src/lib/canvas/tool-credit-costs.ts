import { AKOOL_TOOL_CREDITS } from "@/lib/akool-credits";
import { estimateAvatarCredits } from "@/lib/avatar/pricing";
import { PREMIUM_GENERATE_CREDIT_COST } from "@/lib/claude-premium-generate";
import { CONTENT_KALENDER_TOOL_CREDIT_COST } from "@/lib/content-kalender-tool";
import { IMAGE_GEN_CREDITS } from "@/lib/image-generator-credits";
import { LORA_GENERATION_CREDIT } from "@/lib/lora-config";
import { calcLoraCredits } from "@/lib/lora-credits";
import { SEEDANCE_CREDIT_COST } from "@/lib/seedance-config";
import { VIRAL_HOOK_EXTRACTOR_CREDIT_COST } from "@/lib/viral-hook-extraktor";
import { UGC_VIDEO_CREDIT_COST } from "@/lib/akool-ugc";
import { VIRAL_SCORE_CREDIT_COST } from "@/lib/viral-score";

/** Matches fullPipelineCreditSum() in agent/credits — kept inline for client-safe imports. */
const AGENT_AUTOPILOT_BASE_COINS = 10;

type CoinTool = { id: string; baseCoins: number };

/** Base coin values aligned with API route `deductCredits` charges. */
export const CANVAS_TOOL_BASE_COINS = {
  "viral-hook": VIRAL_HOOK_EXTRACTOR_CREDIT_COST,
  "content-kalender": CONTENT_KALENDER_TOOL_CREDIT_COST,
  "trend-script": PREMIUM_GENERATE_CREDIT_COST,
  "script-generator": PREMIUM_GENERATE_CREDIT_COST,
  "produkt-werbung": 0,
  "flux-image": IMAGE_GEN_CREDITS.standard,
  "ki-ich": LORA_GENERATION_CREDIT,
  "lora-training": calcLoraCredits(2000),
  "seedance-video": SEEDANCE_CREDIT_COST,
  "video-transformer": AKOOL_TOOL_CREDITS.videoEditor,
  "video-uebersetzer": AKOOL_TOOL_CREDITS.videoTranslationPerMinute,
  "avatar-studio": estimateAvatarCredits({
    durationSeconds: 30,
    resolution: "720p",
    aspectRatio: "9:16",
    subtitles: false,
    voiceover: false,
    branding: false,
  }),
  "lipsync-studio": AKOOL_TOOL_CREDITS.lipsync,
  "melodia-studio": 1,
  "agent-autopilot": AGENT_AUTOPILOT_BASE_COINS,
  "thumbnail-concept": 1,
  "niche-analyzer": 2,
  "outlier-detector": 3,
  "viral-score": VIRAL_SCORE_CREDIT_COST,
  "ugc-video": UGC_VIDEO_CREDIT_COST,
  "campaign-autopilot": 38,
} as const;

export const CANVAS_TOOL_HIGH_RES_COINS = {
  "flux-image": IMAGE_GEN_CREDITS.highRes,
  "seedance-video": SEEDANCE_CREDIT_COST,
} as const;

export function calculateCanvasToolCoins(
  tool: CoinTool,
  params: Record<string, unknown>
): number {
  if (tool.id === "flux-image") {
    const num = Math.max(1, Number(params.num_images ?? 1));
    const perImage = IMAGE_GEN_CREDITS.standard;
    return perImage * num;
  }

  if (tool.id === "lora-training") {
    const steps = Number(params.training_steps ?? 2000);
    return calcLoraCredits(steps);
  }

  if (tool.id === "video-uebersetzer") {
    const minutes = Math.max(1, Number(params.duration_minutes ?? 1));
    return minutes * AKOOL_TOOL_CREDITS.videoTranslationPerMinute;
  }

  if (tool.id === "seedance-video") {
    const duration = Number(params.duration ?? 8);
    return Math.max(SEEDANCE_CREDIT_COST, Math.round(SEEDANCE_CREDIT_COST * (duration / 8)));
  }

  return tool.baseCoins;
}

export function getCanvasToolBaseCoins(toolId: string): number {
  return (
    CANVAS_TOOL_BASE_COINS[toolId as keyof typeof CANVAS_TOOL_BASE_COINS] ??
    0
  );
}
