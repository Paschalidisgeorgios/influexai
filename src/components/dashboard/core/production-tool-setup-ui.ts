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

const TOOL_CATEGORY: Partial<Record<ToolId, string>> = {
  "viral-hook": "Text",
  "content-calendar": "Text & Kampagne",
  "image-gen": "Foto",
  "img-to-img": "Foto",
  "img-to-video": "Video",
  "text-to-video": "Video",
};

const TOOL_SETUP_SUBTITLE: Partial<Record<ToolId, string>> = {
  "viral-hook": "Thema oder Link eingeben, Hook generieren.",
  "content-calendar": "Nische und Rhythmus wählen, Plan erstellen.",
  "image-gen": "Prompt und Format wählen, Bild generieren.",
  "img-to-video": "Startbild, Prompt und Modell — dann Video.",
  "text-to-video": "Prompt und Modell wählen, Clip starten.",
};

/** UI-only credit labels — no registry edits */
const CREDIT_UI_OVERRIDES: Partial<Record<ToolId, string>> = {
  "viral-hook": "1 Credit",
  "content-calendar": "2–5 Credits",
  "text-to-video": "Dynamisch · ab 50 Credits",
  "img-to-video": "Dynamisch nach Modell & Dauer",
  "image-gen": "5–8 Credits",
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
    return raw.replace(/Fallback\s*/i, "ab ").replace(/\s+/g, " ").trim();
  }
  return raw;
}

export function getToolSetupCategory(toolId: ToolId): string {
  return TOOL_CATEGORY[toolId] ?? "Tool";
}

export function getToolSetupSubtitle(toolId: ToolId): string {
  return TOOL_SETUP_SUBTITLE[toolId] ?? "Optionen wählen und starten.";
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
