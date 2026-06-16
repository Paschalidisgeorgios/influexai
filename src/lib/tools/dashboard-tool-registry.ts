/**
 * dashboard-tool-registry.ts — Legacy audit registry (DashboardLayout ToolId union)
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * SUPERSEDED FOR PRODUCT TRUTH BY:
 *   src/lib/tools/canonical-tool-registry.ts  (Phase 1A — canonical SSOT)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * This file remains for:
 *   - ToolId-aligned audit entries (35 dashboard tools)
 *   - AgentBox dev-time validation via getToolDefinition()
 *
 * Do NOT add new tools here without mirroring in canonical-tool-registry.ts.
 * @see PRODUCT_TRUTH_FREEZE.md
 *
 * HINWEIS: Diese Datei ist bewusst NICHT in Billing/API integriert (Step 1 only).
 *
 * Datenquellen:
 *  - ToolId-Union-Type:      src/components/dashboard/core/DashboardLayout.tsx (Z. 52–68)
 *  - calculateExactCredits:  src/lib/dashboard/promptOptimizer.ts (Z. 600–626) — ACHTUNG: weicht
 *                            systematisch von AKOOL_TOOL_CREDITS (akool-credits.ts) ab; Validation
 *                            v2 korrigiert die Registry auf die tatsächlichen API-Abzüge.
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
    sourceNotes: "Navigation-Only. Kein API-Aufruf; rendert StudioHome. calculateExactCredits hat keinen expliziten Eintrag für 'studio' — fällt in Default-Branch und würde 5 zurückgeben, wird aber UI-seitig nie aufgerufen. credits=0 gesetzt, da kein Abzug stattfindet. Kategorie 'text' als Fallback – passt zu keiner Kategorie des bestehenden Schemas.",
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
    apiRoute: "/api/viral-hook",
    hasRightPanel: false,
    isMediaTool: false,
    status: "active",
    sourceNotes: "VIRAL_HOOK_EXTRACTOR_CREDIT_COST = 1 (viral-hook-extraktor.ts) — übereinstimmend mit promptOptimizer TEXT_TOOLS. /api/viral-hook/route.ts: echter Anthropic-Call, deductCredits mit amount=1 via withCreditDeduction. AgentBox streamt via /api/agent als Proxy, tatsächlicher Credit-Abzug in /api/viral-hook. [KORRIGIERT v2: apiRoute /api/agent → /api/viral-hook]",
  },

  "content-calendar": {
    id: "content-calendar",
    category: "text",
    name: "Content Kalender",
    credits: null,
    apiRoute: "/api/agent",
    hasRightPanel: false,
    isMediaTool: false,
    status: "active",
    sourceNotes: "UI-Falschanzeige-Risiko: zeigt ~1 Credit (promptOptimizer TEXT_TOOLS), AgentBox-Pfad kann bis zu 3 abziehen (1 Base ORCHESTRATOR_BASE_COST + 2 Tool via content_calendar-Orchestrator). Standalone /api/content-kalender/route.ts zieht CONTENT_KALENDER_TOOL_CREDIT_COST=2 ab (Anthropic-Call). Kein eindeutiger Fixwert → null. [KORRIGIERT v3: credits 1→null, UI-Falschanzeige-Risiko dokumentiert]",
  },

  "trend-script": {
    id: "trend-script",
    category: "text",
    name: "Trend Script",
    credits: 3,
    apiRoute: "/api/trend-script",
    hasRightPanel: false,
    isMediaTool: false,
    status: "active",
    sourceNotes: "TREND_SCRIPT_TOOL_CREDIT_COST = 3 (trend-script-tool.ts). /api/trend-script/route.ts: echter YouTube-API + Anthropic-Call, deductCredits mit amount=3. promptOptimizer TEXT_TOOLS-Set setzt fälschlich 1 Credit — Diskrepanz zur Route. AgentBox streamt via /api/agent, tatsächlicher Abzug in /api/trend-script. [KORRIGIERT v2: credits 1→3, apiRoute /api/agent→/api/trend-script]",
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
    sourceNotes: "UI-Redirect: Sidebar + Hero-Card navigieren zu /dashboard/szenen-generator (SzenenGeneratorStudio) statt AgentBox-Formular zu öffnen. Identische API-Route /api/akool/image-to-video, aber vollständige Modell-/Resolution-/Duration-Auswahl + Polling dort bereits implementiert. AgentBox-Mock-Pfad für img-to-video ist seit diesem Fix unreachable. Credits weiterhin null (modell-/dauerabhängig, korrekt in SzenenGeneratorStudio dargestellt). [REDIRECT v5]",
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
    sourceNotes: "Credits: calculateAkoolModelCredits(model, resolution, duration) wenn Modell bekannt; Fallback AKOOL_TOOL_CREDITS.textToVideo = 50 wenn kein Modell gefunden. Kein generelles 15–30-Fenster. TOOLS_WITH_RIGHT_PANEL (DashboardLayout Z.172). MEDIA_TOOLS (AgentBox Z.109). API: /api/akool/text-to-video/route.ts existiert, echter Akool-Call (/v4/text2video/create). [KORRIGIERT v2: sourceNotes präzisiert, Fallback 50 ergänzt]",
  },

  "video-to-video": {
    id: "video-to-video",
    category: "video",
    name: "Video to Video",
    credits: 40,
    apiRoute: "/api/akool/video-to-video",
    hasRightPanel: false,
    isMediaTool: true,
    status: "active",
    sourceNotes: "AKOOL_TOOL_CREDITS.videoEditor = 40 (akool-credits.ts). Route ruft /v3/video/style-transfer auf, generationType='akool-video-editor'. promptOptimizer Z.619 nennt fälschlich 15 — Diskrepanz. MEDIA_TOOLS (AgentBox Z.109). [KORRIGIERT v2: credits 15→40]",
  },

  "ref-to-video": {
    id: "ref-to-video",
    category: "video",
    name: "Reference to Video",
    credits: 15,
    apiRoute: null,
    hasRightPanel: false,
    isMediaTool: false,
    status: "coming-soon",
    sourceNotes: "Sidebar-Eintrag + TOOL_LABEL vorhanden, aber kein TOOL_META/MEDIA_TOOLS-Eintrag in AgentBox, keine API-Route. Aktuell nur 3s-Mock mit Unsplash-Placeholder via handleActionExecute — Credits werden trotzdem über /api/dashboard/asset mit skipDeduction:false abgezogen (Mock-Billing-Risiko: echte Credits für Placeholder). Status 'coming-soon': erfordert eigene Implementierung (kein bestehender Akool/fal.ai-Endpoint im Code referenziert). [KORRIGIERT v5: unknown→coming-soon] [SIDEBAR-ENTFERNT] Kein sinnvolles Formular in AgentBox (FALLBACK_META), Bug: speichert Placeholder-Video statt Text-Output.",
  },

  // ── Video Tools (Akool – Face/Character) ──────────────────────────────────

  "face-swap-video": {
    id: "face-swap-video",
    category: "video",
    name: "Gesichtstausch Video",
    credits: 10,
    apiRoute: "/api/faceswap",
    hasRightPanel: false,
    isMediaTool: false,
    status: "active",
    sourceNotes: "CREDIT_VIDEO=10 in /api/faceswap/route.ts, echter Akool-Call. [KORRIGIERT v3] [REDIRECT v6] [SIDEBAR-KONSOLIDIERUNG v9] Einziger verbleibender Sidebar-Eintrag für face-studio-Gruppe — Label umbenannt von 'Gesichtstausch Video' zu 'Gesichtstausch'. face-swap-image + live-face-swap entfernt — /dashboard/face-studio deckt beide Varianten via Tabs (Video/Foto).",
  },

  "character-swap": {
    id: "character-swap",
    category: "video",
    name: "Character Swap",
    credits: 25,
    apiRoute: "/api/akool/character-studio",
    hasRightPanel: false,
    isMediaTool: false,
    status: "active",
    sourceNotes: "Duplikat von char-studio-video. [KORRIGIERT v5] [REDIRECT v6] [SIDEBAR-KONSOLIDIERUNG v9] Sidebar-Eintrag entfernt — Funktion über char-studio-video-Eintrag → /dashboard/character-studio erreichbar (Seite bietet Mode-Toggle animate/replace).",
  },

  "char-studio-video": {
    id: "char-studio-video",
    category: "video",
    name: "Character Studio",
    credits: 25,
    apiRoute: "/api/akool/character-studio",
    hasRightPanel: false,
    isMediaTool: false,
    status: "active",
    sourceNotes: "AKOOL_TOOL_CREDITS.characterStudio = 25. Route: /api/akool/character-studio. [KORRIGIERT v2] [REDIRECT v6] [SIDEBAR-KONSOLIDIERUNG v9] Einziger verbleibender Sidebar-Eintrag für character-studio-Gruppe (Label 'Character Studio', Badge 'New'). character-swap + char-studio-image entfernt — alle drei zeigten auf dieselbe /dashboard/character-studio-Seite.",
  },

  "avatar-video": {
    id: "avatar-video",
    category: "video",
    name: "Avatar Video",
    credits: null,
    apiRoute: "/api/avatar/create-job",
    hasRightPanel: false,
    isMediaTool: false,
    status: "active",
    sourceNotes: "Credits: dynamisch via estimateAvatarCredits() — Basis 5/9/16 + Addons 5–21. Pre-Pay mit refundCredits-on-Failure bereits implementiert. [KORRIGIERT v3] [REDIRECT v8] UI-Redirect: Sidebar navigiert zu /dashboard/avatar-studio (vollständige Implementierung mit Bild+Video-Upload, Optionen, create-job+start-render, Pre-Pay) statt AgentBox-Mock.",
  },

  "video-translation": {
    id: "video-translation",
    category: "video",
    name: "Videoübersetzung",
    credits: null,
    apiRoute: "/api/akool/video-translation",
    hasRightPanel: false,
    isMediaTool: false,
    status: "active",
    sourceNotes: "Credits: minutes × 30 (Minimum 30 Credits/Min). Echter Akool-Call. Duplikat: /dashboard/video-uebersetzer ruft dieselbe Route auf. [KORRIGIERT v2] [REDIRECT v8] UI-Redirect: Sidebar navigiert zu /dashboard/video-translation (vollständige Implementierung, Akool-Polling) statt AgentBox-Mock.",
  },

  "talking-avatar": {
    id: "talking-avatar",
    category: "video",
    name: "Sprechender Avatar",
    credits: 20,
    apiRoute: "/api/akool/lipsync",
    hasRightPanel: false,
    isMediaTool: false,
    status: "active",
    sourceNotes: "AKOOL_TOOL_CREDITS.lipsync=20 (akool-credits.ts). /api/akool/lipsync/route.ts: echter Akool-Call (/v3/lipsync/create), runAkoolAsyncPost → deductAkoolToolCredits upfront. Semantisch: Lipsync = Video mit synchronisierten Lippen → entspricht 'Sprechender Avatar'. promptOptimizer-AKOOL_TOOLS-Set nannte fälschlich 10. [KORRIGIERT v3: status unknown→active, credits 10→20, apiRoute null→/api/akool/lipsync] [REDIRECT v6] UI-Redirect: Sidebar navigiert zu /dashboard/lipsync-studio (vollständige Implementierung mit Video-URL + Audio-URL/TTS, Polling via useAkoolJobPoll) statt AgentBox-Mock zu öffnen. /dashboard/lipsync ist Duplikat — lipsync-studio als kanonische Seite gewählt.",
  },

  "talking-photo": {
    id: "talking-photo",
    category: "video",
    name: "Sprechendes Foto",
    credits: 5,
    apiRoute: "/api/live-portrait",
    hasRightPanel: false,
    isMediaTool: false,
    status: "active",
    sourceNotes: "CREDIT_COST=5 in /api/live-portrait/route.ts (hardcoded). Echter fal.ai-Call (fal-ai/live-portrait). Pre-Pay mit Refund-on-Failure bereits implementiert. [KORRIGIERT v3: status unknown→active, credits 10→5, apiRoute null→/api/live-portrait] [REDIRECT v6] UI-Redirect: Sidebar navigiert zu /dashboard/live-portrait (vollständige Implementierung mit Foto-Upload + Driving-Video/Webcam + echtem /api/live-portrait-Call + Result-Anzeige) statt AgentBox-Mock zu öffnen.",
  },

  "ai-video-editor": {
    id: "ai-video-editor",
    category: "video",
    name: "KI-Videoeditor",
    credits: 40,
    apiRoute: "/api/akool/video-to-video",
    hasRightPanel: false,
    isMediaTool: true,
    status: "active",
    sourceNotes: "AKOOL_TOOL_CREDITS.videoEditor = 40 (akool-credits.ts). Route: /api/akool/video-to-video/route.ts, echter Akool-Call (/v3/video/style-transfer), pollType 'videoEditor'. Pre-Pay via runAkoolAsyncPost (deductAkoolToolCredits vor Job-Start, refundAkoolToolCredits bei Fehler). Dedicated Dashboard-Seite: /dashboard/video-editor/page.tsx. AgentBox: MEDIA_TOOLS, TOOL_META. [AKTIVIERT v4: coming-soon→active, credits 10→40, apiRoute ergänzt]",
  },

  "ecommerce-ads": {
    id: "ecommerce-ads",
    category: "video",
    name: "E-Commerce Product Ads",
    credits: 15,
    apiRoute: "/api/akool/ecommerce-ads",
    hasRightPanel: true,
    isMediaTool: true,
    status: "active",
    sourceNotes: "AKOOL_TOOL_CREDITS.ecommerceAds = 15 (akool-credits.ts). Route: /api/akool/ecommerce-ads/route.ts, echter Akool-Call (/v3/product-ad/create). TOOLS_WITH_RIGHT_PANEL (DashboardLayout Z.173). MEDIA_TOOLS (AgentBox Z.109). UGC_VIDEO_TOOL_IDS in SettingsPanel (Z.63). promptOptimizer Z.621 nennt fälschlich 8. [KORRIGIERT v2: credits 8→15]",
  },

  // ── Image Tools ───────────────────────────────────────────────────────────

  "face-swap-image": {
    id: "face-swap-image",
    category: "image",
    name: "Gesichtstausch Bild",
    credits: 5,
    apiRoute: "/api/faceswap",
    hasRightPanel: false,
    isMediaTool: false,
    status: "active",
    sourceNotes: "CREDIT_IMAGE=5 in /api/faceswap/route.ts. [KORRIGIERT v3] [REDIRECT v6] [SIDEBAR-KONSOLIDIERUNG v9] Sidebar-Eintrag entfernt — Funktion über face-swap-video-Eintrag ('Gesichtstausch') → /dashboard/face-studio erreichbar (Tab 'Face Swap Foto' auf der Seite verfügbar).",
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
    sourceNotes: "Credits: IMAGE_GEN_CREDITS.standard = FAL_CREDITS.fluxDev = 5 (Standardqualität), IMAGE_GEN_CREDITS.highRes = FAL_CREDITS.fluxProT2i = 8 (High-Res). Kein 3-Credit-Tier im tatsächlichen Code. /api/generate-image/route.ts: echter fal.ai-Call via generateCategoryImage(). TOOLS_WITH_RIGHT_PANEL. MEDIA_TOOLS. IMAGE_TOOL_IDS in SettingsPanel (Z.59). [KORRIGIERT v2: Bereich 3–5 → standard=5/highRes=8, kein 3er-Tier]",
  },

  "img-to-img": {
    id: "img-to-img",
    category: "image",
    name: "Bild zu Bild",
    credits: 3,
    apiRoute: "/api/generate-image",
    hasRightPanel: true,
    isMediaTool: true,
    status: "active",
    sourceNotes: "Shared Route mit image-gen via variation:true Parameter. 3 Credits. TOOLS_WITH_RIGHT_PANEL + IMAGE_TOOL_IDS. [AKTIVIERT v5: handleActionExecute-Branch ergänzt] [AKTIVIERT v8] MEDIA_TOOLS + TOOL_META ergänzt in AgentBox.tsx — isMedia=true, onActionExecute erreichbar. buildPrompt-Case nicht nötig (default:'' reicht, Prompt optional für variation-Mode). AgentBox zeigt jetzt 'Bild zu Bild'-Header statt FALLBACK_META 'TOOL'.",
  },

  "char-studio-image": {
    id: "char-studio-image",
    category: "image",
    name: "Character Studio Bild",
    credits: 25,
    apiRoute: "/api/akool/character-studio",
    hasRightPanel: false,
    isMediaTool: false,
    status: "active",
    sourceNotes: "AKOOL_TOOL_CREDITS.characterStudio = 25. Route: /api/akool/character-studio. Video-Output trotz 'image'-Kategorie. [KORRIGIERT v2] [REDIRECT v8] [SIDEBAR-KONSOLIDIERUNG v9] Sidebar-Eintrag entfernt — Funktion über char-studio-video-Eintrag → /dashboard/character-studio erreichbar (Seite bietet Mode-Toggle animate/replace).",
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
    sourceNotes: "NICHT BUILDBAR: Kein Akool-Endpoint für Content-Moderation referenziert. Würde neuen Provider erfordern. [Diagnose v4] [ENTFERNT v7] Sidebar-Eintrag entfernt — aktiver Button ohne Funktion und ohne Coming-Soon-Hinweis war irreführend. Kein Akool-Endpoint vorhanden. Kann bei zukünftiger echter Implementierung neu hinzugefügt werden.",
  },

  // ── Audio Tools ───────────────────────────────────────────────────────────

  "tts": {
    id: "tts",
    category: "audio",
    name: "Text-zu-Sprache",
    credits: 3,
    apiRoute: "/api/akool/tts",
    hasRightPanel: false,
    isMediaTool: false,
    status: "active",
    sourceNotes: "AKOOL_TOOL_CREDITS.tts = 3. Route: /api/akool/tts. [KORRIGIERT v2: credits 2→3] [REDIRECT v8] [SIDEBAR-KONSOLIDIERUNG v9] Einziger verbleibender Sidebar-Eintrag für melodia-Gruppe — Label umbenannt von 'Text-zu-Sprache' zu 'Melodia Studio'. voice-clone + voice-changer entfernt — /dashboard/melodia deckt alle drei via Tabs (Text zu Sprache / Stimme klonen / Stimme ändern).",
  },

  "voice-clone": {
    id: "voice-clone",
    category: "audio",
    name: "Stimmenklon",
    credits: 5,
    apiRoute: "/api/akool/voice-clone",
    hasRightPanel: false,
    isMediaTool: false,
    status: "active",
    sourceNotes: "AKOOL_TOOL_CREDITS.voiceClone = 5. Route: /api/akool/voice-clone. [KORRIGIERT v2: credits 2→5] [REDIRECT v8] [SIDEBAR-KONSOLIDIERUNG v9] Sidebar-Eintrag entfernt — Funktion über tts-Eintrag ('Melodia Studio') → /dashboard/melodia erreichbar (Tab 'Stimme klonen' auf der Seite verfügbar).",
  },

  "voice-changer": {
    id: "voice-changer",
    category: "audio",
    name: "Stimmverzerrer",
    credits: 5,
    apiRoute: "/api/akool/voice-changer",
    hasRightPanel: false,
    isMediaTool: false,
    status: "active",
    sourceNotes: "AKOOL_TOOL_CREDITS.voiceChanger = 5. Route: /api/akool/voice-changer. [KORRIGIERT v2: credits 2→5] [REDIRECT v8] [SIDEBAR-KONSOLIDIERUNG v9] Sidebar-Eintrag entfernt — Funktion über tts-Eintrag ('Melodia Studio') → /dashboard/melodia erreichbar (Tab 'Stimme ändern' auf der Seite verfügbar).",
  },

  // ── Live & Akool Tools ────────────────────────────────────────────────────

  "live-camera": {
    id: "live-camera",
    category: "live",
    name: "Live-Kamera",
    credits: null,
    apiRoute: "/api/live-avatar/session",
    hasRightPanel: false,
    isMediaTool: false,
    status: "active",
    sourceNotes: "Credits: 1/Min via Heartbeat. /api/live-avatar/session: echter Akool/Agora-Call. Billing-Lücke dokumentiert. [KORRIGIERT v3] [SIDEBAR-ENTFERNT v10 — FEATURE-VORBEREITET] Sidebar-Eintrag entfernt, da keine UI existiert. UNTERSCHIED zu v7-Entfernungen: /api/live-avatar/session + /api/live-avatar/heartbeat sind vollständig implementiert (echte Akool/Agora-Integration, LIVE_AVATAR_CREDITS_PER_MINUTE=1). Für Reaktivierung: neue Dashboard-Seite mit Agora-SDK-Webcam-Integration + Session-Start/Heartbeat-Anbindung bauen, dann Sidebar-Eintrag + Redirect ergänzen (gleiches Muster wie v8-Redirects). Billing-Lücke bei Session-Start (dokumentiert in vorheriger Session) sollte beim Feature-Build mitbehandelt werden.",
  },

  "streaming-avatar": {
    id: "streaming-avatar",
    category: "live",
    name: "Streaming-Avatar",
    credits: null,
    apiRoute: "/api/live-avatar/session",
    hasRightPanel: false,
    isMediaTool: false,
    status: "active",
    sourceNotes: "Credits: 1/Min via Heartbeat. Teilt /api/live-avatar/session mit live-camera. Billing-Lücke dokumentiert. [KORRIGIERT v3] [SIDEBAR-ENTFERNT v10 — FEATURE-VORBEREITET] Sidebar-Eintrag entfernt, da keine UI existiert. UNTERSCHIED zu v7-Entfernungen: /api/live-avatar/session + /api/live-avatar/heartbeat sind vollständig implementiert (echte Akool/Agora-Integration, LIVE_AVATAR_CREDITS_PER_MINUTE=1). Für Reaktivierung: neue Dashboard-Seite mit Agora-SDK-Webcam-Integration + Session-Start/Heartbeat-Anbindung bauen, dann Sidebar-Eintrag + Redirect ergänzen (gleiches Muster wie v8-Redirects). Billing-Lücke bei Session-Start (dokumentiert in vorheriger Session) sollte beim Feature-Build mitbehandelt werden.",
  },

  "live-face-swap": {
    id: "live-face-swap",
    category: "live",
    name: "Live-Gesichtstausch",
    credits: 10,
    apiRoute: "/api/faceswap",
    hasRightPanel: false,
    isMediaTool: false,
    status: "active",
    sourceNotes: "CREDIT_VIDEO=10 in /api/faceswap/route.ts, generationType='live-creator-faceswap'. [KORRIGIERT v3] [REDIRECT v8] [SIDEBAR-KONSOLIDIERUNG v9] Sidebar-Eintrag entfernt — Funktion über face-swap-video-Eintrag ('Gesichtstausch') → /dashboard/face-studio erreichbar (kein eigener 'Live'-Tab, API-Implementierung identisch mit Batch-Swap).",
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
    sourceNotes: "NICHT BUILDBAR: Kein Akool-Endpoint für AI-Support/Chat-Agent referenziert. Würde komplett neue Architektur erfordern. [Diagnose v4] [ENTFERNT v7] Sidebar-Eintrag entfernt — aktiver Button ohne Funktion und ohne Coming-Soon-Hinweis war irreführend. Kein Akool-Endpoint vorhanden. Kann bei zukünftiger echter Implementierung neu hinzugefügt werden.",
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
    sourceNotes: "NICHT BUILDBAR: Kein Akool-Endpoint für 'Production'-Feature referenziert. Würde API-Recherche und neuen Wrapper erfordern. [Diagnose v4] [ENTFERNT v7] Sidebar-Eintrag entfernt — aktiver Button ohne Funktion und ohne Coming-Soon-Hinweis war irreführend. Kein Akool-Endpoint vorhanden. Kann bei zukünftiger echter Implementierung neu hinzugefügt werden.",
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
    sourceNotes: "NICHT BUILDBAR: Kein Akool-Endpoint für holografische/3D-Avatar-Darstellung referenziert. Erfordert Hardware-Integration oder spezialisierte 3D-Pipeline. [Diagnose v4] [ENTFERNT v7] Sidebar-Eintrag entfernt — aktiver Button ohne Funktion und ohne Coming-Soon-Hinweis war irreführend. Kein Akool-Endpoint vorhanden. Kann bei zukünftiger echter Implementierung neu hinzugefügt werden.",
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
    sourceNotes: "NICHT BUILDBAR: Kein Akool-Endpoint für 'Edge'-Feature referenziert. Würde Enterprise-API-Recherche und neuen Wrapper erfordern. [Diagnose v4] [ENTFERNT v7] Sidebar-Eintrag entfernt — aktiver Button ohne Funktion und ohne Coming-Soon-Hinweis war irreführend. Kein Akool-Endpoint vorhanden. Kann bei zukünftiger echter Implementierung neu hinzugefügt werden.",
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
