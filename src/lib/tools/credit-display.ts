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
  "face-swap-video": "face-swap",
  "face-swap-image": "face-swap",
};

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
    return {
      label: formatCreditsAmount(IMAGE_GEN_CREDITS.variation),
      affordanceAmount: IMAGE_GEN_CREDITS.variation,
      isDynamic: false,
      isFree: false,
    };
  }

  return {
    label: highRes ? formatCreditsAmount(amount) : "5–8 Credits",
    affordanceAmount: amount,
    isDynamic: false,
    isFree: false,
  };
}

function metaFromCanonical(
  tool: CanonicalToolDefinition,
  settings?: Record<string, unknown> | null
): CreditDisplayMeta {
  const toolId = tool.id;

  if (toolId === "image-gen" || tool.aliases?.includes("image-gen")) {
    return imageGenDisplayLabel("image-gen", settings);
  }
  if (toolId === "img-to-img" || tool.aliases?.includes("img-to-img")) {
    return imageGenDisplayLabel("img-to-img", settings);
  }

  if (toolId === "content-calendar") {
    const agentCost = CONTENT_KALENDER_TOOL_CREDIT_COST;
    const actionCost = 5;
    return {
      label: `${agentCost} Credits (AgentBox) · ${actionCost} (Dashboard)`,
      affordanceAmount: Math.max(agentCost, actionCost),
      isDynamic: false,
      isFree: false,
    };
  }

  if (toolId === "agent-autopilot") {
    return {
      label: `${ORCHESTRATOR_BASE_COST} Credit Basis · Tools extra`,
      affordanceAmount: ORCHESTRATOR_BASE_COST,
      isDynamic: true,
      isFree: false,
    };
  }

  const label = formatCreditPolicy(tool.creditPolicy, { settings, toolId });
  const p = tool.creditPolicy;

  if (p.mode === "dynamic" || p.displayedCredits === "dynamic") {
    let affordance: number | null = null;
    if (toolId === "text-to-video") {
      affordance = AKOOL_TOOL_CREDITS.textToVideo;
    } else if (toolId === "szenen-generator") {
      affordance = null;
    } else if (toolId === "avatar-video") {
      affordance = 5;
    }
    return {
      label,
      affordanceAmount: affordance,
      isDynamic: true,
      isFree: false,
    };
  }

  if (p.mode === "per_minute") {
    const perMin = p.baseCredits ?? AKOOL_TOOL_CREDITS.videoTranslationPerMinute;
    return {
      label,
      affordanceAmount: perMin,
      isDynamic: true,
      isFree: false,
    };
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

    return {
      label,
      affordanceAmount: affordance,
      isDynamic: false,
      isFree: base === 0,
    };
  }

  return {
    label,
    affordanceAmount: null,
    isDynamic: true,
    isFree: false,
  };
}

/** Runtime fallback when canonical entry is missing (preview mocks, legacy ids). */
function metaFromRuntime(
  toolId: string,
  settings?: Record<string, unknown> | null
): CreditDisplayMeta {
  if (toolId === "gallery" || toolId === "settings" || toolId === "studio") {
    return {
      label: "Kostenlos",
      affordanceAmount: 0,
      isDynamic: false,
      isFree: true,
    };
  }

  if (toolId === "viral-hook") {
    return {
      label: formatCreditsAmount(VIRAL_HOOK_EXTRACTOR_CREDIT_COST),
      affordanceAmount: VIRAL_HOOK_EXTRACTOR_CREDIT_COST,
      isDynamic: false,
      isFree: false,
    };
  }

  if (toolId === "trend-script") {
    return {
      label: formatCreditsAmount(TREND_SCRIPT_TOOL_CREDIT_COST),
      affordanceAmount: TREND_SCRIPT_TOOL_CREDIT_COST,
      isDynamic: false,
      isFree: false,
    };
  }

  if (toolId === "image-gen" || toolId === "img-to-img") {
    return imageGenDisplayLabel(toolId, settings);
  }

  if (toolId === "video-to-video" || toolId === "ai-video-editor") {
    const n = AKOOL_TOOL_CREDITS.videoEditor;
    return {
      label: formatCreditsAmount(n),
      affordanceAmount: n,
      isDynamic: false,
      isFree: false,
    };
  }

  if (toolId === "ecommerce-ads") {
    const n = AKOOL_TOOL_CREDITS.ecommerceAds;
    return {
      label: formatCreditsAmount(n),
      affordanceAmount: n,
      isDynamic: false,
      isFree: false,
    };
  }

  if (toolId === "talking-avatar") {
    const n = AKOOL_TOOL_CREDITS.lipsync;
    return {
      label: formatCreditsAmount(n),
      affordanceAmount: n,
      isDynamic: false,
      isFree: false,
    };
  }

  if (
    toolId === "char-studio-video" ||
    toolId === "char-studio-image" ||
    toolId === "character-swap"
  ) {
    const n = AKOOL_TOOL_CREDITS.characterStudio;
    return {
      label: formatCreditsAmount(n),
      affordanceAmount: n,
      isDynamic: false,
      isFree: false,
    };
  }

  if (toolId === "tts") {
    const n = AKOOL_TOOL_CREDITS.tts;
    return {
      label: formatCreditsAmount(n),
      affordanceAmount: n,
      isDynamic: false,
      isFree: false,
    };
  }

  if (toolId === "voice-clone") {
    const n = AKOOL_TOOL_CREDITS.voiceClone;
    return {
      label: formatCreditsAmount(n),
      affordanceAmount: n,
      isDynamic: false,
      isFree: false,
    };
  }

  if (toolId === "voice-changer") {
    const n = AKOOL_TOOL_CREDITS.voiceChanger;
    return {
      label: formatCreditsAmount(n),
      affordanceAmount: n,
      isDynamic: false,
      isFree: false,
    };
  }

  if (toolId === "img-to-video" || toolId === "text-to-video") {
    return {
      label:
        toolId === "text-to-video"
          ? `Dynamisch · Fallback ${AKOOL_TOOL_CREDITS.textToVideo}`
          : "Dynamisch nach Modell & Dauer",
      affordanceAmount:
        toolId === "text-to-video" ? AKOOL_TOOL_CREDITS.textToVideo : null,
      isDynamic: true,
      isFree: false,
    };
  }

  if (toolId === "video-translation") {
    const perMin = AKOOL_TOOL_CREDITS.videoTranslationPerMinute;
    return {
      label: `Je Minute · ab ${perMin} Credits`,
      affordanceAmount: perMin,
      isDynamic: true,
      isFree: false,
    };
  }

  if (toolId.startsWith("preview:")) {
    return {
      label: "Preview",
      affordanceAmount: 0,
      isDynamic: false,
      isFree: true,
    };
  }

  return {
    label: "Credits variieren",
    affordanceAmount: null,
    isDynamic: true,
    isFree: false,
  };
}

export function getCreditDisplayMeta(
  toolId: string,
  settings?: Record<string, unknown> | null
): CreditDisplayMeta {
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
  const meta = getCreditDisplayMeta(toolId, settings);
  return meta.affordanceAmount ?? 0;
}

export function canAffordCreditDisplay(
  currentCredits: number,
  toolId: string,
  settings?: Record<string, unknown> | null
): boolean {
  const meta = getCreditDisplayMeta(toolId, settings);
  if (meta.isFree) return true;
  if (meta.affordanceAmount === null) return true;
  return currentCredits >= meta.affordanceAmount;
}

/** AgentBox / DashboardLayout ToolId entry point. */
export function getDashboardToolCreditDisplay(
  toolId: ToolId,
  settings?: Record<string, unknown> | null
): CreditDisplayMeta {
  return getCreditDisplayMeta(toolId, settings);
}
