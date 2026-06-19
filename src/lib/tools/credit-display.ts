/**
 * credit-display.ts — Phase 1C display SSOT
 *
 * Sichtbare Credit-Labels für UI, AgentBox und calculateExactCredits.
 * Liest primär aus der kanonischen Registry; Runtime-Konstanten nur als Fallback.
 *
 * Client-safe — keine server-only Imports.
 */

import { AKOOL_TOOL_CREDITS } from "@/lib/akool-credits";
import { CONTENT_KALENDER_TOOL_CREDIT_COST } from "@/lib/content-kalender-tool";
import { IMAGE_GEN_CREDITS } from "@/lib/image-generator-credits";
import { LIVE_CREATOR_PORTRAIT_CREDIT_COST } from "@/lib/live-creator-config";
import { TREND_SCRIPT_TOOL_CREDIT_COST } from "@/lib/trend-script-tool";
import { VIRAL_HOOK_EXTRACTOR_CREDIT_COST } from "@/lib/viral-hook-extraktor";
import type { ToolId } from "@/components/dashboard/core/DashboardLayout";
import type {
  CanonicalToolDefinition,
  CreditDisplayValue,
  CreditPolicy,
} from "./canonical-tool-types";
import { getCanonicalToolByAlias } from "./canonical-tool-registry";

/** Flat orchestrator cost — keep in sync with agent/credits.ts ORCHESTRATOR_BASE_COST */
const ORCHESTRATOR_BASE_COST = 1;

export interface CreditDisplayMeta {
  /** User-facing label, e.g. "40 Credits", "5–8 Credits", "Dynamisch nach Dauer" */
  label: string;
  /**
   * Minimum credits for affordance checks.
   * null = dynamic/unknown — UI should not hard-block on balance alone.
   */
  affordanceAmount: number | null;
  /** Documented minimum from runtime when known (same as affordance when fixed). */
  minimumCredits: number | null;
  /** Starting balance hint for dynamic tools (e.g. Akool fallback). */
  startingCredits: number | null;
  isDynamic: boolean;
  isFree: boolean;
}

/** Dashboard ToolId → canonical registry id */
const DASHBOARD_TOOL_ALIASES: Record<string, string> = {
  "img-to-video": "szenen-generator",
  "char-studio-video": "character-studio",
  "char-studio-image": "character-studio",
  "character-swap": "character-studio",
  "ai-video-editor": "video-to-video",
  tts: "melodia-tts",
  "voice-clone": "voice-clone-akool",
  "voice-changer": "voice-changer",
  "talking-avatar": "talking-avatar",
  "ecommerce-ads": "ecommerce-ads",
  "content-calendar": "content-calendar",
  "trend-script": "trend-script",
  "viral-hook": "viral-hook",
  "image-gen": "image-gen",
  "img-to-img": "img-to-img",
  "text-to-video": "text-to-video",
  "video-to-video": "video-to-video",
  "ref-to-video": "ref-to-video",
  "avatar-video": "avatar-video",
  "video-translation": "video-translation",
  "talking-photo": "talking-photo",
  "live-creator": "live-creator",
  "live-creator-portrait": "live-creator",
  "face-swap-video": "face-swap",
  "face-swap-image": "face-swap",
};

/** Live Creator Akool talking-photo video (POST pre-pay). */
const LIVE_CREATOR_VIDEO_CREDITS = 10;

function meta(
  label: string,
  opts: {
    affordance?: number | null;
    minimum?: number | null;
    starting?: number | null;
    isDynamic?: boolean;
    isFree?: boolean;
  } = {}
): CreditDisplayMeta {
  const affordance = opts.affordance ?? null;
  return {
    label,
    affordanceAmount: affordance,
    minimumCredits: opts.minimum ?? affordance,
    startingCredits: opts.starting ?? affordance,
    isDynamic: opts.isDynamic ?? false,
    isFree: opts.isFree ?? false,
  };
}

function resolveCanonicalId(toolId: string): string {
  return DASHBOARD_TOOL_ALIASES[toolId] ?? toolId;
}

function numericCredit(value: CreditDisplayValue): number | null {
  if (value === "dynamic" || value === "DOCS_REQUIRED") return null;
  return value;
}

export function formatCreditsAmount(amount: number): string {
  if (amount === 0) return "Kostenlos";
  if (amount === 1) return "1 Credit";
  return `${amount} Credits`;
}

export function formatCreditPolicy(
  policy: CreditPolicy,
  options?: { settings?: Record<string, unknown> | null; toolId?: string }
): string {
  const settings = options?.settings;
  const toolId = options?.toolId;

  if (policy.mode === "free_preview") return "Preview kostenlos";
  if (policy.mode === "none" || policy.displayedCredits === 0) return "Kostenlos";

  if (toolId === "image-gen" || toolId === "img-to-img") {
    return imageGenDisplayLabel(toolId, settings).label;
  }

  if (policy.mode === "dynamic" || policy.displayedCredits === "dynamic") {
    if (toolId === "szenen-generator" || toolId === "img-to-video") {
      return "Dynamisch nach Modell & Dauer";
    }
    if (toolId === "text-to-video") {
      return `Dynamisch · Fallback ${AKOOL_TOOL_CREDITS.textToVideo}`;
    }
    if (toolId === "avatar-video") {
      return "Dynamisch nach Optionen";
    }
    return "Credits variieren";
  }

  if (policy.mode === "per_minute") {
    const perMin = policy.baseCredits ?? 30;
    return `Je Minute · ab ${perMin} Credits`;
  }

  if (policy.mode === "per_second") {
    return "Je Dauer";
  }

  const variantNums =
    policy.variants
      ?.map((v) => numericCredit(v.credits))
      .filter((n): n is number => n !== null) ?? [];

  const base = policy.baseCredits ?? numericCredit(policy.displayedCredits);

  if (base !== null && variantNums.length > 0) {
    const min = Math.min(base, ...variantNums);
    const max = Math.max(base, ...variantNums);
    if (min !== max) return `${min}–${max} Credits`;
  }

  if (base !== null) return formatCreditsAmount(base);

  return "Credits variieren";
}

function imageGenDisplayLabel(
  toolId: string,
  settings?: Record<string, unknown> | null
): CreditDisplayMeta {
  const highRes = settings?.highRes === true;
  const amount = highRes
    ? IMAGE_GEN_CREDITS.highRes
    : IMAGE_GEN_CREDITS.standard;

  if (toolId === "img-to-img") {
    return meta(formatCreditsAmount(IMAGE_GEN_CREDITS.variation), {
      affordance: IMAGE_GEN_CREDITS.variation,
    });
  }

  return meta(highRes ? formatCreditsAmount(amount) : "5–8 Credits", {
    affordance: amount,
    minimum: IMAGE_GEN_CREDITS.standard,
    starting: IMAGE_GEN_CREDITS.standard,
  });
}

function metaFromCanonical(
  tool: CanonicalToolDefinition,
  settings?: Record<string, unknown> | null
): CreditDisplayMeta {
  const toolId = tool.id;

  if (toolId === "talking-photo") {
    return meta("Live Portrait (fal.ai) · 5 Credits", { affordance: 5 });
  }
  if (toolId === "talking-avatar") {
    const n = AKOOL_TOOL_CREDITS.lipsync;
    return meta(`Lip Sync (Akool) · ${n} Credits`, { affordance: n });
  }
  if (toolId === "live-creator") {
    return meta(`Live Creator Video (Akool) · ${LIVE_CREATOR_VIDEO_CREDITS} Credits`, {
      affordance: LIVE_CREATOR_VIDEO_CREDITS,
      minimum: LIVE_CREATOR_VIDEO_CREDITS,
      starting: LIVE_CREATOR_VIDEO_CREDITS,
    });
  }

  if (toolId === "image-gen" || tool.aliases?.includes("image-gen")) {
    return imageGenDisplayLabel("image-gen", settings);
  }
  if (toolId === "img-to-img" || tool.aliases?.includes("img-to-img")) {
    return imageGenDisplayLabel("img-to-img", settings);
  }

  if (toolId === "content-calendar") {
    const cost = CONTENT_KALENDER_TOOL_CREDIT_COST;
    return meta(formatCreditsAmount(cost), {
      affordance: cost,
      minimum: cost,
      starting: cost,
    });
  }

  if (toolId === "agent-autopilot") {
    return meta(`${ORCHESTRATOR_BASE_COST} Credit Basis · Tools extra`, {
      affordance: ORCHESTRATOR_BASE_COST,
      minimum: ORCHESTRATOR_BASE_COST,
      isDynamic: true,
    });
  }

  const label = formatCreditPolicy(tool.creditPolicy, { settings, toolId });
  const p = tool.creditPolicy;

  if (p.mode === "dynamic" || p.displayedCredits === "dynamic") {
    let affordance: number | null = null;
    let starting: number | null = null;
    if (toolId === "text-to-video") {
      affordance = AKOOL_TOOL_CREDITS.textToVideo;
      starting = AKOOL_TOOL_CREDITS.textToVideo;
    } else if (toolId === "szenen-generator") {
      affordance = null;
      starting = null;
    } else if (toolId === "avatar-video") {
      affordance = 5;
      starting = 5;
    }
    return meta(label, {
      affordance,
      minimum: affordance,
      starting,
      isDynamic: true,
    });
  }

  if (p.mode === "per_minute") {
    const perMin = p.baseCredits ?? AKOOL_TOOL_CREDITS.videoTranslationPerMinute;
    return meta(label, {
      affordance: perMin,
      minimum: perMin,
      starting: perMin,
      isDynamic: true,
    });
  }

  const base =
    p.baseCredits ?? numericCredit(p.displayedCredits) ?? null;

  if (base !== null) {
    const variantNums =
      p.variants
        ?.map((v) => numericCredit(v.credits))
        .filter((n): n is number => n !== null) ?? [];
    const affordance =
      variantNums.length > 0
        ? Math.max(base, ...variantNums)
        : base;

    return meta(label, {
      affordance,
      minimum: base,
      starting: affordance,
      isFree: base === 0,
    });
  }

  return meta(label, { isDynamic: true });
}

/** Runtime fallback when canonical entry is missing (preview mocks, legacy ids). */
function metaFromRuntime(
  toolId: string,
  settings?: Record<string, unknown> | null
): CreditDisplayMeta {
  if (toolId === "gallery" || toolId === "settings" || toolId === "studio") {
    return meta("Kostenlos", { affordance: 0, isFree: true });
  }

  if (toolId === "viral-hook") {
    return meta(formatCreditsAmount(VIRAL_HOOK_EXTRACTOR_CREDIT_COST), {
      affordance: VIRAL_HOOK_EXTRACTOR_CREDIT_COST,
    });
  }

  if (toolId === "trend-script") {
    return meta(formatCreditsAmount(TREND_SCRIPT_TOOL_CREDIT_COST), {
      affordance: TREND_SCRIPT_TOOL_CREDIT_COST,
    });
  }

  if (toolId === "image-gen" || toolId === "img-to-img") {
    return imageGenDisplayLabel(toolId, settings);
  }

  if (toolId === "talking-photo") {
    return meta("Live Portrait (fal.ai) · 5 Credits", { affordance: 5 });
  }

  if (toolId === "live-creator") {
    return meta(`Live Creator Video (Akool) · ${LIVE_CREATOR_VIDEO_CREDITS} Credits`, {
      affordance: LIVE_CREATOR_VIDEO_CREDITS,
    });
  }

  if (toolId === "video-to-video" || toolId === "ai-video-editor") {
    const n = AKOOL_TOOL_CREDITS.videoEditor;
    return meta(formatCreditsAmount(n), { affordance: n });
  }

  if (toolId === "ecommerce-ads") {
    const n = AKOOL_TOOL_CREDITS.ecommerceAds;
    return meta(formatCreditsAmount(n), { affordance: n });
  }

  if (toolId === "talking-avatar") {
    const n = AKOOL_TOOL_CREDITS.lipsync;
    return meta(`Lip Sync (Akool) · ${n} Credits`, { affordance: n });
  }

  if (
    toolId === "char-studio-video" ||
    toolId === "char-studio-image" ||
    toolId === "character-swap"
  ) {
    const n = AKOOL_TOOL_CREDITS.characterStudio;
    return meta(formatCreditsAmount(n), { affordance: n });
  }

  if (toolId === "tts") {
    return meta(formatCreditsAmount(AKOOL_TOOL_CREDITS.tts), {
      affordance: AKOOL_TOOL_CREDITS.tts,
    });
  }

  if (toolId === "voice-clone") {
    return meta(formatCreditsAmount(AKOOL_TOOL_CREDITS.voiceClone), {
      affordance: AKOOL_TOOL_CREDITS.voiceClone,
    });
  }

  if (toolId === "voice-changer") {
    return meta(formatCreditsAmount(AKOOL_TOOL_CREDITS.voiceChanger), {
      affordance: AKOOL_TOOL_CREDITS.voiceChanger,
    });
  }

  if (toolId === "img-to-video" || toolId === "text-to-video") {
    const fallback = AKOOL_TOOL_CREDITS.textToVideo;
    return meta(
      toolId === "text-to-video"
        ? `Dynamisch · Fallback ${fallback}`
        : "Dynamisch nach Modell & Dauer",
      {
        affordance: toolId === "text-to-video" ? fallback : null,
        starting: toolId === "text-to-video" ? fallback : null,
        isDynamic: true,
      }
    );
  }

  if (toolId === "video-translation") {
    const perMin = AKOOL_TOOL_CREDITS.videoTranslationPerMinute;
    return meta(`Je Minute · ab ${perMin} Credits`, {
      affordance: perMin,
      minimum: perMin,
      starting: perMin,
      isDynamic: true,
    });
  }

  if (toolId.startsWith("preview:")) {
    return meta("Preview", { affordance: 0, isFree: true });
  }

  return meta("Credits variieren", { isDynamic: true });
}

export function getCreditDisplayMeta(
  toolId: string,
  settings?: Record<string, unknown> | null
): CreditDisplayMeta {
  if (toolId === "live-creator-portrait") {
    return meta(
      `Live Creator Portrait · ${LIVE_CREATOR_PORTRAIT_CREDIT_COST} Credits`,
      { affordance: LIVE_CREATOR_PORTRAIT_CREDIT_COST }
    );
  }

  const canonicalId = resolveCanonicalId(toolId);
  const tool =
    getCanonicalToolByAlias(canonicalId) ?? getCanonicalToolByAlias(toolId);

  if (tool?.isProduction) {
    return metaFromCanonical(tool, settings);
  }

  return metaFromRuntime(toolId, settings);
}

export function getCreditDisplayLabel(
  toolId: string,
  settings?: Record<string, unknown> | null
): string {
  return getCreditDisplayMeta(toolId, settings).label;
}

/** Numeric estimate for legacy callers (AgentBox affordance, prompt optimizer). */
export function getCreditAffordanceAmount(
  toolId: string,
  settings?: Record<string, unknown> | null
): number {
  const m = getCreditDisplayMeta(toolId, settings);
  return m.affordanceAmount ?? m.startingCredits ?? m.minimumCredits ?? 0;
}

export function canAffordCreditDisplay(
  currentCredits: number,
  toolId: string,
  settings?: Record<string, unknown> | null
): boolean {
  const m = getCreditDisplayMeta(toolId, settings);
  if (m.isFree) return true;
  const required =
    m.affordanceAmount ?? m.minimumCredits ?? m.startingCredits;
  if (required === null) return true;
  return currentCredits >= required;
}

/** AgentBox / DashboardLayout ToolId entry point. */
export function getDashboardToolCreditDisplay(
  toolId: ToolId,
  settings?: Record<string, unknown> | null
): CreditDisplayMeta {
  return getCreditDisplayMeta(toolId, settings);
}
