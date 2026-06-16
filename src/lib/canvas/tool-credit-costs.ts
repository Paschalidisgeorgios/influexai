/**
 * Canvas workspace coin display — delegates to credit-display SSOT where mapped.
 * Runtime billing still uses API routes; this file is display + estimate only.
 *
 * @see PRODUCT_TRUTH_FREEZE.md Phase 1D
 */

import { AKOOL_TOOL_CREDITS } from "@/lib/akool-credits";
import { estimateAvatarCredits } from "@/lib/avatar/pricing";
import { PREMIUM_GENERATE_CREDIT_COST } from "@/lib/claude-premium-generate";
import { CONTENT_KALENDER_TOOL_CREDIT_COST } from "@/lib/content-kalender-tool";
import { IMAGE_GEN_CREDITS } from "@/lib/image-generator-credits";
import { LORA_GENERATION_CREDIT } from "@/lib/lora-config";
import { calcLoraCredits } from "@/lib/lora-credits";
import { SEEDANCE_CREDIT_COST } from "@/lib/seedance-config";
import { TREND_SCRIPT_TOOL_CREDIT_COST } from "@/lib/trend-script-tool";
import { VIRAL_HOOK_EXTRACTOR_CREDIT_COST } from "@/lib/viral-hook-extraktor";
import { UGC_VIDEO_CREDIT_COST } from "@/lib/akool-ugc";
import { VIRAL_SCORE_CREDIT_COST } from "@/lib/viral-score";
import {
  getCreditAffordanceAmount,
  getCreditDisplayLabel,
} from "@/lib/tools/credit-display";

/** Canvas tool id → canonical / dashboard tool id for credit-display SSOT */
const CANVAS_CANONICAL_MAP: Record<string, string> = {
  "viral-hook": "viral-hook",
  "content-kalender": "content-calendar",
  "trend-script": "trend-script",
  "script-generator": "script-generator",
  "flux-image": "image-gen",
  "lipsync-studio": "talking-avatar",
  "video-transformer": "video-to-video",
  "video-uebersetzer": "video-translation",
  "melodia-studio": "tts",
  "agent-autopilot": "agent-autopilot",
  "thumbnail-concept": "thumbnail-concept",
  "niche-analyzer": "niche-analyzer",
  "ugc-video": "ugc-video",
};

type CoinTool = { id: string; baseCoins: number };

/** Legacy base coins — prefer getCanvasToolBaseCoins() for display. */
export const CANVAS_TOOL_BASE_COINS = {
  "viral-hook": VIRAL_HOOK_EXTRACTOR_CREDIT_COST,
  "content-kalender": CONTENT_KALENDER_TOOL_CREDIT_COST,
  "trend-script": TREND_SCRIPT_TOOL_CREDIT_COST,
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
  "melodia-studio": AKOOL_TOOL_CREDITS.tts,
  "agent-autopilot": 1,
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

export function getCanvasToolDisplayLabel(toolId: string): string {
  const canonical = CANVAS_CANONICAL_MAP[toolId];
  if (canonical) return getCreditDisplayLabel(canonical);
  return `${getCanvasToolBaseCoins(toolId)} Credits`;
}

export function calculateCanvasToolCoins(
  tool: CoinTool,
  params: Record<string, unknown>
): number {
  if (tool.id === "flux-image") {
    const num = Math.max(1, Number(params.num_images ?? 1));
    const perImage = getCanvasToolBaseCoins("flux-image");
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
    return Math.max(
      SEEDANCE_CREDIT_COST,
      Math.round(SEEDANCE_CREDIT_COST * (duration / 8))
    );
  }

  return getCanvasToolBaseCoins(tool.id);
}

export function getCanvasToolBaseCoins(toolId: string): number {
  const canonical = CANVAS_CANONICAL_MAP[toolId];
  if (canonical) {
    const fromDisplay = getCreditAffordanceAmount(canonical);
    if (fromDisplay > 0) return fromDisplay;
  }
  return (
    CANVAS_TOOL_BASE_COINS[toolId as keyof typeof CANVAS_TOOL_BASE_COINS] ??
    0
  );
}
