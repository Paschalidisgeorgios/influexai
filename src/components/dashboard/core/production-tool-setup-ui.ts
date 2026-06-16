import type { ToolId } from "./DashboardLayout";
import { getCreditDisplayLabel } from "@/lib/tools/credit-display";
import { getToolDisplayLabel } from "./production-tool-routes";
import { VIRAL_HOOK_CREDIT_COST } from "@/lib/viral-hook-analysis";
import { CONTENT_CALENDAR_CREDIT_COST } from "@/lib/content-calendar-analysis";
import { IMAGE_GEN_CREDITS } from "@/lib/image-generator-credits";
import { AKOOL_TOOL_CREDITS } from "@/lib/akool-credits";

export const SETUP_MVP_TOOL_IDS = new Set<ToolId>([
  "viral-hook",
  "content-calendar",
  "image-gen",
  "img-to-video",
  "text-to-video",
]);

/** Tools whose output is persisted to the user gallery (media generations). */
export const GALLERY_PERSISTED_TOOL_IDS = new Set<ToolId>([
  "image-gen",
  "img-to-video",
  "text-to-video",
]);

export const SETUP_COPY = {
  creditsBeforeStart: "Kosten siehst du vor dem Start.",
  agentSecondary: "Mit Agent vorbereiten",
  agentPrimary: "Im Agent vorbereiten",
  errorGeneric:
    "Der Vorgang konnte nicht abgeschlossen werden. Bitte versuche es erneut.",
  galleryResult: "Ergebnis wird in deiner Galerie gespeichert.",
  resultInline: "Ergebnis erscheint direkt hier.",
  toolCardCta: "Tool einrichten",
  modelsLoading: "Modelle werden geladen…",
  videoGenerating: "Video wird erstellt — das kann einige Minuten dauern.",
} as const;

const TOOL_CATEGORY: Partial<Record<ToolId, string>> = {
  "viral-hook": "Text & Kampagne",
  "content-calendar": "Text & Kampagne",
  "image-gen": "Bild & Produktvisuals",
  "img-to-img": "Bild & Produktvisuals",
  "img-to-video": "Video-Produktion",
  "text-to-video": "Video-Produktion",
};

const TOOL_SETUP_SUBTITLE: Partial<Record<ToolId, string>> = {
  "viral-hook":
    "Starke Einstiege für Reels, Shorts und Ads — passend zu Thema oder Link.",
  "content-calendar":
    "Themen, Formate und Rhythmus für den nächsten Monat — strukturiert und sofort nutzbar.",
  "image-gen":
    "Produkt- und Kampagnenmotive für Social, Ads und Präsentationen.",
  "img-to-video":
    "Ein Startbild wird zum Motion-Clip — für Reels, Ads und Produktshows.",
  "text-to-video":
    "Aus einer Szenenbeschreibung entsteht ein Video-Clip.",
};

/** UI-only credit labels — sourced from existing cost constants */
const CREDIT_UI_OVERRIDES: Partial<Record<ToolId, string>> = {
  "viral-hook": `${VIRAL_HOOK_CREDIT_COST} Credits`,
  "content-calendar": `${CONTENT_CALENDAR_CREDIT_COST} Credits`,
  "text-to-video": `Ab ${AKOOL_TOOL_CREDITS.textToVideo} Credits · Modell & Dauer`,
  "img-to-video": "Dynamisch · Modell & Dauer",
  "image-gen": `${IMAGE_GEN_CREDITS.standard}–${IMAGE_GEN_CREDITS.highRes} Credits`,
};

export function getSetupCreditLabel(
  toolId: ToolId,
  settings?: Record<string, unknown> | null
): string {
  if (CREDIT_UI_OVERRIDES[toolId]) {
    return CREDIT_UI_OVERRIDES[toolId]!;
  }
  const raw = getCreditDisplayLabel(toolId, settings);
  if (raw.includes("AgentBox") || raw.includes("Dashboard")) {
    return "2–5 Credits";
  }
  if (/Fallback/i.test(raw)) {
    return "Ab 50 Credits · abhängig von Modell und Dauer";
  }
  return raw;
}

export function getToolSetupCategory(toolId: ToolId): string {
  return TOOL_CATEGORY[toolId] ?? "Tool";
}

export function getToolSetupSubtitle(toolId: ToolId): string {
  return TOOL_SETUP_SUBTITLE[toolId] ?? "Wähle Ziel, Format und Modell.";
}

export function getToolSetupTitle(toolId: ToolId): string {
  return getToolDisplayLabel(toolId);
}

export function buildAgentPrepareHref(
  toolId: ToolId,
  fields: Record<string, string>
): string {
  const parts = Object.entries(fields)
    .filter(([, v]) => v.trim())
    .map(([k, v]) => `${k}: ${v.trim()}`);
  const prompt = parts.join("\n");
  const params = new URLSearchParams();
  if (prompt) params.set("prompt", prompt);
  params.set("tool", toolId);
  return `/dashboard/ki-agent?${params.toString()}`;
}
