import type { ToolId } from "./DashboardLayout";
import { getCreditDisplayLabel } from "@/lib/tools/credit-display";
import { getToolDisplayLabel } from "./production-tool-routes";
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
  galleryResult:
    "Medien-Ergebnisse landen nach erfolgreicher Generierung in der Galerie (/dashboard/gallery).",
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

export function getSetupCreditLabel(
  toolId: ToolId,
  settings?: Record<string, unknown> | null
): string {
  return getCreditDisplayLabel(toolId, settings);
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
