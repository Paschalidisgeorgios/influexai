/**
 * dashboard-tool-registry.ts — Zentrale Datenstruktur aller Dashboard-Tools
 *
 * HINWEIS: Diese Datei ist bewusst NICHT in andere Dateien integriert (Step 1 only).
 * Sie dient als Single Source of Truth für spätere Integrationsschritte.
 *
 * Datenquellen:
 *  - ToolId-Union-Type:      src/components/dashboard/core/DashboardLayout.tsx (Z. 52–68)
 *  - calculateExactCredits:  src/lib/dashboard/promptOptimizer.ts (Z. 600–626)
 *  - TOOLS_WITH_RIGHT_PANEL: src/components/dashboard/core/DashboardLayout.tsx (Z. 171–175)
 *  - MEDIA_TOOLS:            src/components/dashboard/core/AgentBox.tsx (Z. 109)
 *  - COPILOT_TRIGGER_TOOLS:  src/components/dashboard/core/AgentBox.tsx (Z. 1216)
 *  - SettingsPanel-Routing:  src/components/dashboard/core/SettingsPanel.tsx (Z. 59–63)
 *  - API-Routes:             src/app/api/ (tatsächlich vorhandene route.ts-Dateien)
 *
 * WICHTIG: `src/lib/tools/tool-registry.ts` (4-Tool-Architektur) wird aktiv
 * von DynamicDashboardEngine, DashboardToolContext und story-/image-generator-
 * Pages genutzt und bleibt unverändert.
 */

import type { ToolId } from "@/components/dashboard/core/DashboardLayout";

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Kategorien aus der bestehenden ToolId-Union-Kommentarstruktur und
 * calculateExactCredits-Gruppierung in promptOptimizer.ts.
 * "text" wird auch für Navigation-Only-Tools (studio, gallery, settings) verwendet
 * (keine passendere Kategorie im bestehenden Schema).
 */
export type ToolCategory = "text" | "video" | "image" | "audio" | "live";

/**
 * active:       API-Route vorhanden + Implementierung im Code gefunden
 * preview:      Teilweise implementiert oder in Beta-ähnlichem Zustand
 * coming-soon:  Nur UI/Sidebar-Eintrag, keine API-Route auffindbar
 * unknown:      API-Route unklar / nicht eindeutig zuordenbar
 */
export type ToolStatus = "active" | "preview" | "coming-soon" | "unknown";

export interface ToolDefinition {
  /** Entspricht dem ToolId-Union-Wert aus DashboardLayout.tsx */
  id: string;
  category: ToolCategory;
  /** UI-Name wie er in NAV_SECTIONS / NAV_BOTTOM in DashboardLayout.tsx steht */
  name: string;
  /**
   * Aus calculateExactCredits() in promptOptimizer.ts.
   * null = modell- oder dauerabhängig, Spanne in sourceNotes angegeben.
   */
  credits: number | null;
  /**
   * Tatsächlich genutzte API-Route.
   * null = keine Route (Navigation-Only oder unbekannt).
   */
  apiRoute: string | null;
  /** true wenn ToolId in TOOLS_WITH_RIGHT_PANEL (DashboardLayout.tsx Z.171) */
  hasRightPanel: boolean;
  /** true wenn ToolId in MEDIA_TOOLS (AgentBox.tsx Z.109) */
  isMediaTool: boolean;
  status: ToolStatus;
  /** Herkunft der Daten + Unsicherheiten */
  sourceNotes: string;
}

// ─── Registry ─────────────────────────────────────────────────────────────────

export const TOOL_REGISTRY: Record<string, ToolDefinition> = {

  // ── Navigation & Core ─────────────────────────────────────────────────────

  "studio": {
    id: "studio",
    category: "text",
    name: "Studio",
    credits: 0,
    apiRoute: null,
    hasRightPanel: false,
    isMediaTool: false,
    status: "active",
    sourceNotes: "Navigation-Only. Kein API-Aufruf; rendert StudioHome. calculateExactCredits gibt 0 zurück (nicht explizit gelistet, fällt in Default-Branch → 5, aber UI-seitig nie verwendet). Kategorie 'text' als Fallback – passt zu keiner Kategorie des bestehenden Schemas.",
  },

  "gallery": {
    id: "gallery",
    category: "text",
    name: "Galerie",
    credits: 0,
    apiRoute: null,
    hasRightPanel: false,
    isMediaTool: false,
    status: "active",
    sourceNotes: "Navigation-Only. calculateExactCredits gibt explizit 0 zurück (promptOptimizer Z.604). Löst COPILOT_TRIGGER_TOOLS aus (AgentBox Z.1216) → /api/agent/copilot. Kategorie 'text' als Fallback.",
  },

  "settings": {
    id: "settings",
    category: "text",
    name: "Einstellungen",
    credits: 0,
    apiRoute: null,
    hasRightPanel: false,
    isMediaTool: false,
    status: "active",
    sourceNotes: "Navigation-Only. calculateExactCredits gibt explizit 0 zurück (promptOptimizer Z.604). Löst COPILOT_TRIGGER_TOOLS aus → /api/agent/copilot. Rendert SettingsView. Kategorie 'text' als Fallback.",
  },

  // ── Text Tools ────────────────────────────────────────────────────────────

  "viral-hook": {
    id: "viral-hook",
    category: "text",
    name: "Viral Hook",
    credits: 1,
    apiRoute: "/api/agent",
    hasRightPanel: false,
    isMediaTool: false,
    status: "active",
    sourceNotes: "TEXT_TOOLS-Set in promptOptimizer (Z.598) → 1 Credit. AgentBox.tsx: buildPrompt() generiert Hook-Prompt, Submit via /api/agent (SSE-Stream). Zusätzlich existiert /api/viral-hook/route.ts als eigenständige Route (wird von alten Dashboard-Pages genutzt, nicht von AgentBox).",
  },

  "content-calendar": {
    id: "content-calendar",
    category: "text",
    name: "Content Kalender",
    credits: 1,
    apiRoute: "/api/agent",
    hasRightPanel: false,
    isMediaTool: false,
    status: "active",
    sourceNotes: "TEXT_TOOLS-Set in promptOptimizer (Z.598) → 1 Credit. AgentBox.tsx: buildPrompt() generiert Kalender-Prompt, Submit via /api/agent (SSE). Eigene /api/content-kalender-Route nicht im api-Verzeichnis gefunden.",
  },

  "trend-script": {
    id: "trend-script",
    category: "text",
    name: "Trend Script",
    credits: 1,
    apiRoute: "/api/agent",
    hasRightPanel: false,
    isMediaTool: false,
    status: "active",
    sourceNotes: "TEXT_TOOLS-Set in promptOptimizer (Z.598) → 1 Credit. AgentBox.tsx: buildPrompt() generiert Script-Prompt, Submit via /api/agent (SSE). Eigenständige Route /api/trend-script/route.ts existiert zusätzlich (Legacy-Dashboard-Pages).",
  },

  // ── Video Tools (fal.ai) ──────────────────────────────────────────────────

  "img-to-video": {
    id: "img-to-video",
    category: "video",
    name: "Bild zu Video",
    credits: null,
    apiRoute: "/api/akool/image-to-video",
    hasRightPanel: true,
    isMediaTool: true,
    status: "active",
    sourceNotes: "Credits: 15 (< 10s) oder 30 (≥ 10s) — durationabhängig, daher null. TOOLS_WITH_RIGHT_PANEL (DashboardLayout Z.172). MEDIA_TOOLS (AgentBox Z.109). API: /api/akool/image-to-video/route.ts existiert. AgentBox hat ImgToVideoValues-Form mit Start/End-Frame + MotionPrompt.",
  },

  "text-to-video": {
    id: "text-to-video",
    category: "video",
    name: "Text zu Video",
    credits: null,
    apiRoute: "/api/akool/text-to-video",
    hasRightPanel: true,
    isMediaTool: true,
    status: "active",
    sourceNotes: "Credits: 15 (< 10s) oder 30 (≥ 10s) — durationabhängig, daher null. TOOLS_WITH_RIGHT_PANEL (DashboardLayout Z.172). MEDIA_TOOLS (AgentBox Z.109). API: /api/akool/text-to-video/route.ts existiert.",
  },

  "video-to-video": {
    id: "video-to-video",
    category: "video",
    name: "Video to Video",
    credits: 15,
    apiRoute: "/api/akool/video-to-video",
    hasRightPanel: false,
    isMediaTool: true,
    status: "active",
    sourceNotes: "promptOptimizer Z.619 → 15 Credits fix. MEDIA_TOOLS (AgentBox Z.109). API: /api/akool/video-to-video/route.ts existiert.",
  },

  "ref-to-video": {
    id: "ref-to-video",
    category: "video",
    name: "Reference to Video",
    credits: 15,
    apiRoute: null,
    hasRightPanel: false,
    isMediaTool: false,
    status: "unknown",
    sourceNotes: "promptOptimizer Z.619 → 15 Credits (zusammen mit video-to-video). Keine dedizierte API-Route in /api/ gefunden. Kein Form in AgentBox. Status 'unknown' bis Route identifiziert.",
  },

  // ── Video Tools (Akool – Face/Character) ──────────────────────────────────

  "face-swap-video": {
    id: "face-swap-video",
    category: "video",
    name: "Gesichtstausch Video",
    credits: 10,
    apiRoute: null,
    hasRightPanel: false,
    isMediaTool: false,
    status: "unknown",
    sourceNotes: "AKOOL_TOOLS-Set in promptOptimizer (Z.591) → 10 Credits. /api/faceswap-Ordner existiert, aber unklar ob Video-Faceswap oder Image-Faceswap abdeckt. Keine explizite Zuordnung in AgentBox oder DashboardLayout-Routing gefunden.",
  },

  "character-swap": {
    id: "character-swap",
    category: "video",
    name: "Character Swap",
    credits: 10,
    apiRoute: null,
    hasRightPanel: false,
    isMediaTool: false,
    status: "unknown",
    sourceNotes: "AKOOL_TOOLS-Set → 10 Credits. Keine dedizierte API-Route in /api/ gefunden. Kein Form in AgentBox. Status 'unknown'.",
  },

  "char-studio-video": {
    id: "char-studio-video",
    category: "video",
    name: "Character Studio",
    credits: 10,
    apiRoute: "/api/akool/character-studio",
    hasRightPanel: false,
    isMediaTool: false,
    status: "active",
    sourceNotes: "AKOOL_TOOLS-Set → 10 Credits. /api/akool/character-studio/route.ts existiert (geteilt mit char-studio-image). Zuordnung per Toolname erschlossen.",
  },

  "avatar-video": {
    id: "avatar-video",
    category: "video",
    name: "Avatar Video",
    credits: 10,
    apiRoute: "/api/avatar",
    hasRightPanel: false,
    isMediaTool: false,
    status: "active",
    sourceNotes: "AKOOL_TOOLS-Set → 10 Credits. /api/avatar/create-job, /api/avatar/start-render existieren. Genauer Endpoint je nach Avatar-Workflow variiert.",
  },

  "video-translation": {
    id: "video-translation",
    category: "video",
    name: "Videoübersetzung",
    credits: 10,
    apiRoute: "/api/akool/video-translation",
    hasRightPanel: false,
    isMediaTool: false,
    status: "active",
    sourceNotes: "AKOOL_TOOLS-Set → 10 Credits. /api/akool/video-translation/route.ts gefunden.",
  },

  "talking-avatar": {
    id: "talking-avatar",
    category: "video",
    name: "Sprechender Avatar",
    credits: 10,
    apiRoute: null,
    hasRightPanel: false,
    isMediaTool: false,
    status: "unknown",
    sourceNotes: "AKOOL_TOOLS-Set → 10 Credits. Kein direktes /api/akool/talking-avatar oder ähnliches Route-File gefunden. /api/akool/lipsync könnte verwandt sein. Status 'unknown'.",
  },

  "talking-photo": {
    id: "talking-photo",
    category: "video",
    name: "Sprechendes Foto",
    credits: 10,
    apiRoute: null,
    hasRightPanel: false,
    isMediaTool: false,
    status: "unknown",
    sourceNotes: "AKOOL_TOOLS-Set → 10 Credits. /api/live-portrait/route.ts existiert (könnte relevant sein), Zuordnung nicht eindeutig. Status 'unknown'.",
  },

  "ai-video-editor": {
    id: "ai-video-editor",
    category: "video",
    name: "KI-Videoeditor",
    credits: 10,
    apiRoute: null,
    hasRightPanel: false,
    isMediaTool: false,
    status: "coming-soon",
    sourceNotes: "AKOOL_TOOLS-Set → 10 Credits. Keine API-Route in /api/ gefunden. Sidebar-Eintrag vorhanden. Status 'coming-soon'.",
  },

  "ecommerce-ads": {
    id: "ecommerce-ads",
    category: "video",
    name: "E-Commerce Product Ads",
    credits: 8,
    apiRoute: "/api/akool/ecommerce-ads",
    hasRightPanel: true,
    isMediaTool: true,
    status: "active",
    sourceNotes: "promptOptimizer Z.621 → 8 Credits. TOOLS_WITH_RIGHT_PANEL (DashboardLayout Z.173). MEDIA_TOOLS (AgentBox Z.109). UGC_VIDEO_TOOL_IDS in SettingsPanel (Z.63). /api/akool/ecommerce-ads/route.ts existiert.",
  },

  // ── Image Tools ───────────────────────────────────────────────────────────

  "face-swap-image": {
    id: "face-swap-image",
    category: "image",
    name: "Gesichtstausch Bild",
    credits: 10,
    apiRoute: null,
    hasRightPanel: false,
    isMediaTool: false,
    status: "unknown",
    sourceNotes: "AKOOL_TOOLS-Set → 10 Credits. /api/faceswap-Ordner gefunden, aber Aufteilung Video vs. Image unklar. Status 'unknown'.",
  },

  "image-gen": {
    id: "image-gen",
    category: "image",
    name: "Bildgenerator",
    credits: null,
    apiRoute: "/api/generate-image",
    hasRightPanel: true,
    isMediaTool: true,
    status: "active",
    sourceNotes: "Credits: 3 (default/nano-banana-2) oder 5 (nano-banana-pro/flux-2-pro) — modellabhängig, daher null. TOOLS_WITH_RIGHT_PANEL. MEDIA_TOOLS. IMAGE_TOOL_IDS in SettingsPanel (Z.59). KreaImageTool.tsx (Z.113) nennt /api/generate-image explizit. Ordner /api/generate-image/ im API-Verzeichnis gefunden.",
  },

  "img-to-img": {
    id: "img-to-img",
    category: "image",
    name: "Bild zu Bild",
    credits: null,
    apiRoute: null,
    hasRightPanel: true,
    isMediaTool: false,
    status: "unknown",
    sourceNotes: "Credits: 3 oder 5 — modellabhängig (wie image-gen), daher null. TOOLS_WITH_RIGHT_PANEL. IMAGE_TOOL_IDS in SettingsPanel (Z.59). Keine eigenständige API-Route in AgentBox oder /api/ gefunden. Status 'unknown'.",
  },

  "char-studio-image": {
    id: "char-studio-image",
    category: "image",
    name: "Character Studio Bild",
    credits: 10,
    apiRoute: "/api/akool/character-studio",
    hasRightPanel: false,
    isMediaTool: false,
    status: "active",
    sourceNotes: "AKOOL_TOOLS-Set → 10 Credits. /api/akool/character-studio/route.ts existiert (geteilt mit char-studio-video).",
  },

  "jarvis-moderator": {
    id: "jarvis-moderator",
    category: "image",
    name: "Jarvis Moderator",
    credits: 1,
    apiRoute: null,
    hasRightPanel: false,
    isMediaTool: false,
    status: "coming-soon",
    sourceNotes: "promptOptimizer Z.623 → 1 Credit. Keine API-Route in /api/ gefunden. Sidebar-Eintrag vorhanden. Status 'coming-soon'.",
  },

  // ── Audio Tools ───────────────────────────────────────────────────────────

  "tts": {
    id: "tts",
    category: "audio",
    name: "Text-zu-Sprache",
    credits: 2,
    apiRoute: "/api/akool/tts",
    hasRightPanel: false,
    isMediaTool: false,
    status: "active",
    sourceNotes: "promptOptimizer Z.622 → 2 Credits. /api/akool/tts/route.ts existiert. Zusätzlich /api/stimme/speak/route.ts vorhanden (älteres Legacy-Endpoint).",
  },

  "voice-clone": {
    id: "voice-clone",
    category: "audio",
    name: "Stimmenklon",
    credits: 2,
    apiRoute: "/api/akool/voice-clone",
    hasRightPanel: false,
    isMediaTool: false,
    status: "active",
    sourceNotes: "promptOptimizer Z.622 → 2 Credits. /api/akool/voice-clone/route.ts existiert. Zusätzlich /api/stimme/clone/route.ts (Legacy).",
  },

  "voice-changer": {
    id: "voice-changer",
    category: "audio",
    name: "Stimmverzerrer",
    credits: 2,
    apiRoute: "/api/akool/voice-changer",
    hasRightPanel: false,
    isMediaTool: false,
    status: "active",
    sourceNotes: "promptOptimizer Z.622 → 2 Credits. /api/akool/voice-changer/route.ts existiert.",
  },

  // ── Live & Akool Tools ────────────────────────────────────────────────────

  "live-camera": {
    id: "live-camera",
    category: "live",
    name: "Live-Kamera",
    credits: 10,
    apiRoute: "/api/live-avatar/session",
    hasRightPanel: false,
    isMediaTool: false,
    status: "active",
    sourceNotes: "AKOOL_TOOLS-Set → 10 Credits. /api/live-avatar/session/route.ts und /api/live-avatar/heartbeat/route.ts existieren.",
  },

  "streaming-avatar": {
    id: "streaming-avatar",
    category: "live",
    name: "Streaming-Avatar",
    credits: 10,
    apiRoute: "/api/live-avatar/session",
    hasRightPanel: false,
    isMediaTool: false,
    status: "active",
    sourceNotes: "AKOOL_TOOLS-Set → 10 Credits. Teilt /api/live-avatar/session mit live-camera (Akool Live Avatar Session-Management).",
  },

  "live-face-swap": {
    id: "live-face-swap",
    category: "live",
    name: "Live-Gesichtstausch",
    credits: 10,
    apiRoute: null,
    hasRightPanel: false,
    isMediaTool: false,
    status: "unknown",
    sourceNotes: "AKOOL_TOOLS-Set → 10 Credits. /api/live-avatar existiert, aber Zuordnung zu live-face-swap nicht eindeutig verifizierbar. Status 'unknown'.",
  },

  "ai-support-agent": {
    id: "ai-support-agent",
    category: "live",
    name: "KI-Support-Mitarbeiter",
    credits: 10,
    apiRoute: null,
    hasRightPanel: false,
    isMediaTool: false,
    status: "coming-soon",
    sourceNotes: "AKOOL_TOOLS-Set → 10 Credits. Keine API-Route in /api/ gefunden. Sidebar-Eintrag vorhanden. Status 'coming-soon'.",
  },

  "akool-production": {
    id: "akool-production",
    category: "live",
    name: "Akool Production",
    credits: 10,
    apiRoute: null,
    hasRightPanel: false,
    isMediaTool: false,
    status: "coming-soon",
    sourceNotes: "AKOOL_TOOLS-Set → 10 Credits. Keine API-Route in /api/ gefunden. Sidebar-Eintrag vorhanden. Status 'coming-soon'.",
  },

  "holographic-avatar": {
    id: "holographic-avatar",
    category: "live",
    name: "Holografische Avatar-Anz.",
    credits: 10,
    apiRoute: null,
    hasRightPanel: false,
    isMediaTool: false,
    status: "coming-soon",
    sourceNotes: "AKOOL_TOOLS-Set → 10 Credits. Keine API-Route in /api/ gefunden. Sidebar-Eintrag vorhanden. Status 'coming-soon'.",
  },

  "akool-edge": {
    id: "akool-edge",
    category: "live",
    name: "Akool Edge",
    credits: 10,
    apiRoute: null,
    hasRightPanel: false,
    isMediaTool: false,
    status: "coming-soon",
    sourceNotes: "AKOOL_TOOLS-Set → 10 Credits. Keine API-Route in /api/ gefunden. Sidebar-Eintrag vorhanden. Status 'coming-soon'.",
  },
} satisfies Record<string, ToolDefinition>;

// ─── Helpers (readonly, keine Seiteneffekte) ──────────────────────────────────

/** Alle Tools eines bestimmten Status */
export function getToolsByStatus(status: ToolStatus): ToolDefinition[] {
  return Object.values(TOOL_REGISTRY).filter((t) => t.status === status);
}

/** Alle Tools einer bestimmten Kategorie */
export function getToolsByCategory(category: ToolCategory): ToolDefinition[] {
  return Object.values(TOOL_REGISTRY).filter((t) => t.category === category);
}

/** Tool-Definition für eine gegebene ToolId — gibt undefined zurück wenn nicht gefunden */
export function getToolDefinition(id: ToolId): ToolDefinition | undefined {
  return TOOL_REGISTRY[id];
}

/** Übersicht: Anzahl Tools pro Status */
export function getRegistrySummary(): Record<ToolStatus, number> {
  const summary: Record<ToolStatus, number> = {
    active: 0,
    preview: 0,
    "coming-soon": 0,
    unknown: 0,
  };
  for (const tool of Object.values(TOOL_REGISTRY)) {
    summary[tool.status]++;
  }
  return summary;
}
